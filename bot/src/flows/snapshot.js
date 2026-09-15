// 📊 Generate Report — Executive Health Snapshot (Consistency Coach and above).
//
// Builds the premium one-page PDF from the user's record. When the record is
// missing something the design needs (profile basics, enough recent glucose
// readings, current medicines) the flow asks for it conversationally first,
// saves the answers to the user's record so the next report is instant, and
// then generates. Delivery is a document message with the PDF attached.
//
// State: session.state = "snapshot", session.step = the question being asked
// (name | age | gender | diabetes | height | weight | readings | meds) or
// "generating". session.data.snap tracks which optional questions were
// already offered so a Skip is honoured.

import { t } from "../i18n.js";
import { send, typing, langOf, sanitizeMd, sendDocument } from "../utils.js";
import { isPaid } from "../tiers.js";
import {
  backKeyboard,
  upgradeKeyboard,
  snapGenderKeyboard,
  snapDiabetesKeyboard,
  snapSkipKeyboard,
  snapDoneKeyboard,
} from "../keyboards.js";
import {
  updateUser,
  addGlucoseFull,
  addHealthMedication,
  snapshotRaw,
  saveGeneratedDocument,
} from "../supabase.js";
import { extractAboutYou, extractHealthMedications, snapshotInsights } from "../openai.js";
import {
  assembleSnapshotData,
  fallbackInsights,
  glucoseSufficiency,
  missingProfileFields,
  currentMedicines,
  dayKey,
  TZ,
} from "../snapshotData.js";
import { renderSnapshotPdf } from "../snapshotPdf.js";
import { errorKey } from "../errors.js";
import { logError, logWarn } from "../log.js";

const SKIP_RE = /^(skip|no|none|nope|later|nahi|nahin|nahe|koi nahi|chor(?:o|do)?|\/skip)\.?$/i;

function snap(session) {
  if (!session.data) session.data = {};
  if (!session.data.snap) session.data.snap = {};
  return session.data.snap;
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------
export async function startSnapshot(bot, chatId, session) {
  const lang = langOf(session);
  if (!isPaid(session.user)) {
    session.state = "idle";
    return send(bot, chatId, t(lang, "snapshot_required"), { keyboard: upgradeKeyboard(lang), markdown: true });
  }
  session.state = "snapshot";
  session.step = null;
  session.data = { snap: {} };
  if (missingProfileFields(session.user).length) {
    await send(bot, chatId, t(lang, "snapshot_intro_missing"), { markdown: true });
  }
  return continueSnapshot(bot, chatId, session);
}

// Decide the next question, or generate when nothing is missing.
async function continueSnapshot(bot, chatId, session) {
  const s = snap(session);
  const user = session.user;

  const missing = missingProfileFields(user);
  if (missing.length) return askField(bot, chatId, session, missing[0]);

  if (!s.readingsAsked) {
    const raw = await snapshotRaw(user.id).catch(() => ({ glucose: [] }));
    const suff = glucoseSufficiency(raw.glucose || []);
    if (!suff.weekly.enough) {
      s.readingsAsked = true;
      return askField(bot, chatId, session, "readings", {
        fasting: suff.weekly.fasting,
        random: suff.weekly.random,
      });
    }
  }

  if (!s.medsAsked) {
    const meds = await currentMedicines(user).catch(() => []);
    if (!meds.length) {
      s.medsAsked = true;
      return askField(bot, chatId, session, "meds");
    }
  }

  return generateSnapshot(bot, chatId, session);
}

function keyboardFor(lang, field) {
  if (field === "gender") return snapGenderKeyboard(lang);
  if (field === "diabetes") return snapDiabetesKeyboard(lang);
  if (field === "readings" || field === "meds") return snapSkipKeyboard(lang);
  return backKeyboard(lang);
}

async function askField(bot, chatId, session, field, vars = {}) {
  const lang = langOf(session);
  session.state = "snapshot";
  session.step = field;
  return send(bot, chatId, t(lang, `snapshot_ask_${field}`, vars), {
    keyboard: keyboardFor(lang, field),
    markdown: true,
  });
}

async function reask(bot, chatId, session, key, vars = {}) {
  const lang = langOf(session);
  return send(bot, chatId, t(lang, key, vars), {
    keyboard: keyboardFor(lang, session.step),
    markdown: true,
  });
}

async function saveProfile(session, patch) {
  session.user = await updateUser(session.user.id, patch).catch((e) => {
    logError("Health Snapshot profile save", e?.message);
    return { ...session.user, ...patch };
  });
}

// ---------------------------------------------------------------------------
// Typed answers
// ---------------------------------------------------------------------------
export async function snapshotText(bot, chatId, session, text, msg) {
  session.state = "snapshot";
  const step = session.step;
  const val = String(text || msg?.caption || "").trim();
  if (!step || step === "generating") return continueSnapshot(bot, chatId, session);

  if (step === "name") {
    const name = val.replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 60 || /^\d+$/.test(name)) return reask(bot, chatId, session, "snapshot_invalid_name");
    await saveProfile(session, { name });
    return continueSnapshot(bot, chatId, session);
  }

  if (step === "age") {
    const parsed = extractAboutYou(val);
    const age = parsed.age ?? (Number.isInteger(Number(val)) ? Number(val) : null);
    if (!(age >= 1 && age <= 120)) return reask(bot, chatId, session, "snapshot_invalid_age");
    await saveProfile(session, { age });
    return continueSnapshot(bot, chatId, session);
  }

  if (step === "gender") {
    const g = extractAboutYou(val).gender || (/^(m|mard|male|larka|aadmi)$/i.test(val) ? "male" : /^(f|aurat|female|larki|khatoon)$/i.test(val) ? "female" : null);
    if (!g) return reask(bot, chatId, session, "snapshot_ask_gender");
    await saveProfile(session, { gender: g });
    return continueSnapshot(bot, chatId, session);
  }

  if (step === "diabetes") {
    const l = val.toLowerCase();
    const dt = /gestation|pregnan|hamal/.test(l) ? "gestational"
      : /pre[\s-]?diab|border/.test(l) ? "prediabetes"
      : /type\s*1|t1|\b1\b|insulin[\s-]?dependent/.test(l) ? "type1"
      : /type\s*2|t2|\b2\b/.test(l) ? "type2"
      : null;
    if (!dt) return reask(bot, chatId, session, "snapshot_ask_diabetes");
    await saveProfile(session, { diabetes_status: dt });
    return continueSnapshot(bot, chatId, session);
  }

  if (step === "height") {
    const parsed = extractAboutYou(val);
    let h = parsed.height_cm ?? null;
    if (h == null) {
      const n = parseFloat(val);
      if (n >= 50 && n <= 250) h = Math.round(n);
      else if (n >= 1.2 && n < 2.6) h = Math.round(n * 100);
    }
    if (!(h >= 50 && h <= 250)) return reask(bot, chatId, session, "snapshot_invalid_height");
    await saveProfile(session, { height_cm: h });
    return continueSnapshot(bot, chatId, session);
  }

  if (step === "weight") {
    const parsed = extractAboutYou(val);
    let w = parsed.weight_kg ?? null;
    if (w == null) {
      const n = parseFloat(val);
      if (n >= 20 && n <= 300) w = Math.round(n * 10) / 10;
    }
    if (!(w >= 20 && w <= 300)) return reask(bot, chatId, session, "snapshot_invalid_weight");
    await saveProfile(session, { weight_kg: w });
    return continueSnapshot(bot, chatId, session);
  }

  if (step === "readings") return readingsAnswer(bot, chatId, session, val);
  if (step === "meds") return medsAnswer(bot, chatId, session, val);

  return continueSnapshot(bot, chatId, session);
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------
export async function snapshotCallback(bot, chatId, session, data) {
  const [, action, value] = String(data || "").split(":");
  if (action === "again") return startSnapshot(bot, chatId, session);
  if (!isPaid(session.user)) return startSnapshot(bot, chatId, session);
  session.state = "snapshot";
  const s = snap(session);
  if (action === "gender" && ["male", "female", "other"].includes(value)) {
    await saveProfile(session, { gender: value });
    return continueSnapshot(bot, chatId, session);
  }
  if (action === "dt" && ["type1", "type2", "prediabetes", "gestational"].includes(value)) {
    await saveProfile(session, { diabetes_status: value });
    return continueSnapshot(bot, chatId, session);
  }
  if (action === "skip") {
    if (session.step === "readings") s.readingsAsked = true;
    if (session.step === "meds") s.medsAsked = true;
    return continueSnapshot(bot, chatId, session);
  }
  return continueSnapshot(bot, chatId, session);
}

// ---------------------------------------------------------------------------
// Readings: "110 fasting 12 Sep" (one per line)
// ---------------------------------------------------------------------------
const MONTH_RE = "(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*";
const MONTH_INDEX = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
const DAY_MS = 86400000;
const PKT_OFFSET_MIN = 5 * 60;

// Build an absolute time from a PKT calendar date + clock time.
function pktDate(y, m, d, hh, mm) {
  return new Date(Date.UTC(y, m, d, hh, mm) - PKT_OFFSET_MIN * 60000);
}

function todayParts(now) {
  const [y, m, d] = dayKey(now).split("-").map(Number);
  return { y, m: m - 1, d };
}

// Returns { y, m, d } for a date mention in the line, or null when absent.
function parseDateHint(l, now) {
  const today = todayParts(now);
  const shift = (days) => {
    const dt = new Date(Date.UTC(today.y, today.m, today.d) - days * DAY_MS);
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: dt.getUTCDate() };
  };
  if (/\b(today|aaj|abhi|now)\b/.test(l)) return today;
  if (/\b(yesterday|kal|gu?zishta)\b/.test(l)) return shift(1);
  const ago = l.match(/(\d{1,2})\s*(?:days?|din)\s*(?:ago|pehle|pehlay)/);
  if (ago) return shift(Number(ago[1]));

  let m = l.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*${MONTH_RE}(?:\\s*(\\d{4}))?`));
  if (m) return withYear(Number(m[1]), MONTH_INDEX[m[2].slice(0, 4)] ?? MONTH_INDEX[m[2].slice(0, 3)], m[3], today);
  m = l.match(new RegExp(`\\b${MONTH_RE}\\s*(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?`));
  if (m) return withYear(Number(m[2]), MONTH_INDEX[m[1].slice(0, 4)] ?? MONTH_INDEX[m[1].slice(0, 3)], m[3], today);
  m = l.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/);
  if (m && !/\d{1,2}[\/-]\d{1,2}[\/-]\d{1,2}[\/-]/.test(l)) {
    const d = Number(m[1]), mo = Number(m[2]) - 1;
    if (mo >= 0 && mo <= 11 && d >= 1 && d <= 31) return withYear(d, mo, m[3], today);
  }
  return null;
}

function withYear(d, m, yStr, today) {
  if (m == null || !(d >= 1 && d <= 31)) return null;
  let y = yStr ? Number(yStr.length === 2 ? "20" + yStr : yStr) : today.y;
  // "12 Sep" typed in January means last year's September.
  if (!yStr && (m > today.m || (m === today.m && d > today.d))) y -= 1;
  return { y, m, d };
}

function parseTimeHint(l, context) {
  const m = l.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (m) {
    let hh = Number(m[1]) % 12;
    if (m[3] === "pm") hh += 12;
    return [hh, Number(m[2] || 0)];
  }
  if (/\b(morning|subah|nashta|breakfast)\b/.test(l)) return [7, 30];
  if (/\b(noon|lunch|dopehr|dopahar)\b/.test(l)) return [13, 30];
  if (/\b(evening|shaam|sham|dinner)\b/.test(l)) return [19, 0];
  if (/\b(night|raat|bed)\b/.test(l)) return [22, 0];
  return context === "fasting" ? [7, 30] : [19, 0];
}

export function parseReadings(text, now = Date.now()) {
  const lines = String(text || "")
    .split(/\n|;|,(?=\s*\d)/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out = [];
  for (const line of lines) {
    const l = line.toLowerCase();
    // Reading value = the first number that isn't part of a date/time token.
    const stripped = l
      .replace(/\b\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b/g, " ")
      .replace(new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s*${MONTH_RE}(?:\\s*\\d{4})?`, "g"), " ")
      .replace(new RegExp(`\\b${MONTH_RE}\\s*\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s*\\d{4})?`, "g"), " ")
      .replace(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/g, " ")
      .replace(/\b\d{1,2}\s*(?:days?|din)\s*(?:ago|pehle|pehlay)/g, " ")
      .replace(/\b(19|20)\d{2}\b/g, " ");
    const numM = stripped.match(/(\d+(?:\.\d+)?)/);
    if (!numM) continue;
    let v = parseFloat(numM[1]);
    if (v > 0 && v < 30) v = Math.round(v * 18); // mmol/L
    if (!(v >= 30 && v <= 600)) continue;
    const context = /fast|khali|nihar|before breakfast|subah khali/.test(l)
      ? "fasting"
      : /post|after|baad|khane ke/.test(l)
        ? "post_meal"
        : /bed|night|raat|sone/.test(l)
          ? "bedtime"
          : "random";
    const dp = parseDateHint(l, now) || todayParts(now);
    const [hh, mm] = parseTimeHint(l, context);
    const at = pktDate(dp.y, dp.m, dp.d, hh, mm);
    if (at.getTime() > now + DAY_MS || now - at.getTime() > 400 * DAY_MS) continue;
    out.push({ value: Math.round(v), context, created_at: at.toISOString() });
  }
  return out;
}

async function readingsAnswer(bot, chatId, session, val) {
  const lang = langOf(session);
  const s = snap(session);
  if (SKIP_RE.test(val)) return continueSnapshot(bot, chatId, session);
  const readings = parseReadings(val);
  if (!readings.length) {
    s.readingsRetry = (s.readingsRetry || 0) + 1;
    if (s.readingsRetry >= 3) return continueSnapshot(bot, chatId, session);
    return reask(bot, chatId, session, "snapshot_readings_none");
  }
  let saved = 0;
  for (const r of readings) {
    try {
      await addGlucoseFull(session.user.id, {
        value: r.value,
        unit: "mg_dl",
        measure_kind: r.context,
        context: r.context,
        created_at: r.created_at,
        note: "added for health snapshot",
      });
      saved += 1;
    } catch (e) {
      logError("Health Snapshot reading save", e?.message);
    }
  }
  await send(bot, chatId, t(lang, "snapshot_readings_saved", { n: saved }), { markdown: true });
  // Still short? Offer once more, otherwise move on.
  const raw = await snapshotRaw(session.user.id).catch(() => ({ glucose: [] }));
  const suff = glucoseSufficiency(raw.glucose || []);
  if (!suff.weekly.enough && !s.readingsSecondAsk) {
    s.readingsSecondAsk = true;
    return askField(bot, chatId, session, "readings_more", { fasting: suff.weekly.fasting, random: suff.weekly.random });
  }
  return continueSnapshot(bot, chatId, session);
}

// ---------------------------------------------------------------------------
// Medicines
// ---------------------------------------------------------------------------
function splitMedsFallback(text) {
  return String(text || "")
    .split(/\n|;|,(?=\s*[A-Za-z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
    .slice(0, 8)
    .map((s) => {
      const m = s.match(/^(.*?)(\d+(?:\.\d+)?\s*(?:mg|mcg|g|iu|units?|ml))?\s*(.*)$/i);
      return {
        name: (m?.[1] || s).trim() || s,
        dose: m?.[2] ? m[2].trim() : null,
        frequency: m?.[3] ? m[3].trim() : null,
        generic_name: null,
      };
    });
}

async function medsAnswer(bot, chatId, session, val) {
  const lang = langOf(session);
  if (SKIP_RE.test(val)) return continueSnapshot(bot, chatId, session);
  await typing(bot, chatId);
  let meds = [];
  try {
    ({ medications: meds } = await extractHealthMedications(session.user, val));
  } catch (e) {
    logWarn("Health Snapshot medicines", `AI extraction failed, using plain split: ${e?.message}`);
    meds = splitMedsFallback(val);
  }
  if (!meds.length) meds = splitMedsFallback(val);
  if (!meds.length) return reask(bot, chatId, session, "snapshot_ask_meds");
  let saved = 0;
  for (const m of meds) {
    try {
      await addHealthMedication(session.user.id, { ...m, source: "text", original_message: val });
      saved += 1;
    } catch (e) {
      logError("Health Snapshot medicine save", e?.message);
    }
  }
  // Mirror onto the users row like My Health does, so coaches see it too.
  await saveProfile(session, {
    medications: meds.map((m) => [m.name, m.dose, m.frequency].filter(Boolean).join(" ")).join("; "),
  });
  await send(bot, chatId, t(lang, "snapshot_meds_saved", { n: saved }), { markdown: true });
  return continueSnapshot(bot, chatId, session);
}

// ---------------------------------------------------------------------------
// Generate + deliver
// ---------------------------------------------------------------------------
async function generateSnapshot(bot, chatId, session) {
  const lang = langOf(session);
  const user = session.user;
  session.step = "generating";
  await send(bot, chatId, t(lang, "snapshot_generating"), { markdown: true });
  await typing(bot, chatId);
  try {
    const data = await assembleSnapshotData(user);
    let insights;
    try {
      insights = await snapshotInsights(user, data.facts);
    } catch (e) {
      logWarn("Health Snapshot AI", `using built-in summaries — ${e?.message}`);
      insights = fallbackInsights(data);
    }
    const pdf = await renderSnapshotPdf(data, insights);
    const filename = `DrSaab-Health-Snapshot-${dayKey(data.generatedAt)}.pdf`;

    // Insights first as plain text (readable on every channel), then the PDF
    // with the action buttons attached to it.
    const bullets = insights.insights.map((i) => `• ${sanitizeMd(i.text)}`).join("\n");
    await send(bot, chatId, t(lang, "snapshot_insights_text", { bullets }), { markdown: true });

    const caption = t(lang, "snapshot_caption", {
      name: sanitizeMd(data.profile.name),
      score: data.score.total,
      rating: data.score.rating,
    });
    const ok = await sendDocument(bot, chatId, pdf, {
      filename,
      mime: "application/pdf",
      caption,
      keyboard: snapDoneKeyboard(lang),
    });
    if (!ok) {
      await send(bot, chatId, t(lang, "snapshot_send_failed"), { keyboard: backKeyboard(lang), markdown: true });
    }
    saveGeneratedDocument(
      user.id,
      "snapshot",
      `data:application/pdf;base64,${pdf.toString("base64")}`,
      `Executive Health Snapshot generated — score ${data.score.total}/100 (${data.score.rating})`
    ).catch(() => {});
  } catch (e) {
    logError("Health Snapshot", e?.message || String(e));
    console.error(e?.stack || e);
    await send(bot, chatId, t(lang, errorKey(e)), { keyboard: backKeyboard(lang) });
  } finally {
    session.state = "idle";
    session.step = null;
    session.data = {};
  }
}

export { TZ as SNAPSHOT_TZ };
