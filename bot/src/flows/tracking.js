import { t } from "../i18n.js";
import { send, sanitizeMd, langOf } from "../utils.js";
import {
  backKeyboard,
  reminderOfferKeyboard,
  activityDaysKeyboard,
  wellbeingMoodKeyboard,
  t1ConfidenceKeyboard,
  medConfirmKeyboard,
  medConsistencyOfferKeyboard,
} from "../keyboards.js";
import {
  addGlucose,
  addGlucoseFull,
  addMedication,
  addHealthLog,
  addWellbeingLog,
  addT1ConfidenceLog,
  addMedicationMaster,
  addMedicationMasterFull,
  findMedicationByName,
  listMedications,
  addReminderSchedule,
  registerActivity,
  updateUser,
  countGlucose,
  countMedicationLogs,
  countWeightEntries,
  countActivityEntries,
  enrollMedConsistency,
} from "../supabase.js";
import { applyScores, glucoseInRange } from "../scores.js";
import { refreshKB } from "../kb.js";
import { awardEventToChallenges } from "./challengeEngine.js";

// ==================================================================
// Blood Sugar — v2 (Check-In spec, 2026-07)
// ==================================================================
// Accept "Fasting 112" / "Random 145" / "Fasting 6.2" / "HbA1c 7.2".
// Dual-unit inference: a single-digit value with a decimal is mmol/L; a
// two- or three-digit integer is mg/dL. HbA1c is kept as its own kind and
// stored in the value_mgdl column (as a percentage) for now.

export async function startGlucose(bot, chatId, session) {
  session.state = "glucose";
  await send(bot, chatId, t(langOf(session), "bs_prompt_v2"), {
    keyboard: backKeyboard(langOf(session)),
    markdown: true,
  });
}

// Return { value_mgdl, unit, measure_kind } or null.
function parseGlucose(text) {
  const s = String(text || "").toLowerCase();
  const numM = s.match(/(\d+(?:\.\d+)?)/);
  if (!numM) return null;
  const raw = parseFloat(numM[1]);
  if (!Number.isFinite(raw)) return null;

  // Measurement kind — default random.
  let kind = "random";
  if (/hba1c|a1c/i.test(s)) kind = "hba1c";
  else if (/fast/.test(s)) kind = "fasting";
  else if (/pre[-\s]?meal|before/.test(s)) kind = "pre_meal";
  else if (/post[-\s]?meal|after/.test(s)) kind = "post_meal";
  else if (/bed|night/.test(s)) kind = "bedtime";
  else if (/random/.test(s)) kind = "random";

  // Unit inference:
  //   - HbA1c: always a percentage
  //   - Single-digit decimal (e.g. 6.2): mmol/L, convert to mg/dL (×18)
  //   - Otherwise: mg/dL
  let unit;
  let mgdl;
  if (kind === "hba1c") {
    unit = "hba1c";
    mgdl = raw; // stored as percentage
  } else if (raw < 30) {
    // A single-digit-with-decimal or a low integer: treat as mmol/L
    unit = "mmol_l";
    mgdl = Math.round(raw * 18);
  } else {
    unit = "mg_dl";
    mgdl = raw;
  }
  return { value_mgdl: mgdl, unit, measure_kind: kind, raw };
}

function glucoseFeedback(lang, value_mgdl, kind) {
  if (kind === "hba1c") return ""; // HbA1c interpretation handled elsewhere
  if (value_mgdl < 70) return t(lang, "glucose_low");
  if (value_mgdl > 300) return t(lang, "glucose_vhigh");
  const highThreshold = kind === "fasting" ? 130 : 180;
  if (value_mgdl > highThreshold) return t(lang, "glucose_high");
  return t(lang, "glucose_normal");
}

export async function glucoseText(bot, chatId, session, text) {
  const lang = langOf(session);

  // Offer-reminder step
  if (session.step === "offer_bs_reminder") {
    return send(bot, chatId, t(lang, "bs_reminder_offer"), {
      keyboard: reminderOfferKeyboard(lang, "glucose"),
      markdown: true,
    });
  }

  const parsed = parseGlucose(text);
  if (!parsed) return send(bot, chatId, t(lang, "bs_invalid"), { markdown: true });

  const isFirst = (await countGlucose(session.user.id).catch(() => 0)) === 0;

  await addGlucoseFull(session.user.id, {
    value: parsed.value_mgdl,
    unit: parsed.unit,
    measure_kind: parsed.measure_kind,
    context: parsed.measure_kind,
  });
  session.user = await registerActivity(session.user);
  session.user = await applyScores(
    session.user,
    "log_glucose",
    glucoseInRange(parsed.value_mgdl, parsed.measure_kind) ? "in_range" : "out_range"
  );
  await refreshKB(session.user);
  awardEventToChallenges(session.user, "glucose", {
    value_mgdl: parsed.value_mgdl, measure_kind: parsed.measure_kind,
  }).catch(() => {});

  // TODO: rotate through 20 variations per confirmation type
  const feedback = glucoseFeedback(lang, parsed.value_mgdl, parsed.measure_kind);

  if (isFirst) {
    await send(bot, chatId, t(lang, "bs_first_confirm"), { markdown: true });
    if (feedback) await send(bot, chatId, feedback, { markdown: true });
    session.step = "offer_bs_reminder";
    await send(bot, chatId, t(lang, "bs_reminder_offer"), {
      keyboard: reminderOfferKeyboard(lang, "glucose"),
      markdown: true,
    });
  } else {
    // Terminal path — attach Back-to-menu button to the last message.
    if (feedback) {
      await send(bot, chatId, t(lang, "bs_confirm"), { markdown: true });
      await send(bot, chatId, feedback, { keyboard: backKeyboard(lang), markdown: true });
    } else {
      await send(bot, chatId, t(lang, "bs_confirm"), { keyboard: backKeyboard(lang), markdown: true });
    }
    session.state = "idle";
    session.step = null;
  }
}

// Called from bot.js when a remoffer:glucose:yes/no callback fires.
export async function glucoseReminderCallback(bot, chatId, session, ans) {
  const lang = langOf(session);
  if (ans === "yes") {
    await addReminderSchedule(session.user.id, {
      category: "glucose",
      label: "Blood sugar check-in",
      time_of_day: "08:00",
      frequency_days: 1,
      next_fire_at: nextFireAtFor("08:00", 1),
    });
    await send(bot, chatId, t(lang, "bs_reminder_yes"), { keyboard: backKeyboard(lang), markdown: true });
  } else {
    await send(bot, chatId, t(lang, "bs_reminder_no"), { keyboard: backKeyboard(lang), markdown: true });
  }
  session.state = "idle";
  session.step = null;
}

// ==================================================================
// Medication — v2 first-time setup + text parse + confirm card
// ==================================================================
// Two shapes:
//   1) First time (no medications on file): enter "setup mode" — multi-med
//      text parse, confirm card, then offer Consistency Program.
//   2) Subsequent times: existing single-med log flow (kept for now).

export async function startMedication(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "medication";
  session.data = {};

  const existing = await listMedications(session.user.id).catch(() => []);
  if (!existing.length) {
    session.step = "setup_await_text";
    await send(bot, chatId, t(lang, "med_setup_prompt"), {
      keyboard: backKeyboard(lang),
      markdown: true,
    });
    return;
  }

  session.step = "log_ask_name";
  await send(bot, chatId, t(lang, "med_ask_name"), {
    keyboard: backKeyboard(lang),
    markdown: true,
  });
}

// Split a message into individual medication clauses. Handles line breaks,
// commas, semicolons and " and " conjunctions.
function splitMedClauses(text) {
  return String(text || "")
    .split(/\n|;|,| and | & /i)
    .map((s) => s.trim())
    .filter(Boolean);
}

const INSULIN_HINTS = ["insulin", "humalog", "lantus", "novolog", "novomix", "toujeo", "tresiba", "levemir", "apidra"];
const FREQ_HINTS = [
  { re: /once\s*daily|every\s*day|1\s*x\s*daily|od\b/i, val: "once_daily" },
  { re: /twice\s*daily|bd\b|bid\b|morning\s*and\s*evening|morning\s*&\s*evening|2\s*x\s*daily/i, val: "morning_evening" },
  { re: /three\s*times|thrice|3\s*x\s*daily|tds\b|tid\b/i, val: "three_times" },
  { re: /every\s*night|before\s*bed|bedtime|nightly/i, val: "bedtime" },
  { re: /before\s*breakfast|morning/i, val: "morning" },
];

function parseSingleMed(clause) {
  const raw = clause.trim();
  if (!raw) return null;

  const isInsulin = INSULIN_HINTS.some((k) => raw.toLowerCase().includes(k));

  // Frequency
  let frequency = null;
  for (const f of FREQ_HINTS) if (f.re.test(raw)) { frequency = f.val; break; }

  // Units for insulin (e.g. "8 units", "20 iu")
  let units = null;
  if (isInsulin) {
    const u = raw.match(/(\d+)\s*(?:units?|iu)\b/i);
    if (u) units = u[1];
  }

  // Dose for tablets/capsules/syrups (mg/ml/g)
  let dose = null;
  const d = raw.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg)\b/i);
  if (d) dose = `${d[1]}${d[2].toLowerCase()}`;

  // Name = strip out dose/frequency/units markers to leave the drug name.
  let name = raw
    .replace(/(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|units?|iu)\b/gi, " ")
    .replace(/once\s*daily|twice\s*daily|three\s*times(?:\s*daily)?|every\s*day|every\s*night|before\s*bed|bedtime|nightly|morning\s*and\s*evening|morning\s*&\s*evening|before\s*breakfast|morning|evening/gi, " ")
    .replace(/\b(od|bd|bid|tds|tid)\b/gi, " ")
    .replace(/\bat\b|\bwith\b|\bfor\b/gi, " ")
    .replace(/insulin/gi, isInsulin ? " " : "insulin")
    .replace(/\s+/g, " ")
    .trim();

  if (!name) return null;
  name = name.slice(0, 80);

  return { name, dose, frequency, units, is_insulin: isInsulin };
}

function parseMedicationMessage(text) {
  return splitMedClauses(text).map(parseSingleMed).filter(Boolean);
}

function formatMedLine(m) {
  const icon = m.is_insulin ? "💉" : "💊";
  const dose = m.units ? `${m.units} units` : m.dose || "";
  const freq = m.frequency ? ` — ${prettyFrequency(m.frequency)}` : "";
  return `${icon} ${m.name}${dose ? ` ${dose}` : ""}${freq}`;
}

function prettyFrequency(f) {
  return {
    once_daily: "Once daily",
    morning_evening: "Morning & evening",
    three_times: "Three times daily",
    bedtime: "At bedtime",
    morning: "In the morning",
  }[f] || f;
}

export async function medicationText(bot, chatId, session, text) {
  const lang = langOf(session);
  const val = (text || "").trim();

  // ---- Setup mode ----
  if (session.step === "setup_await_text" || session.step === "setup_edit" || session.step === "setup_add") {
    const parsed = parseMedicationMessage(val);
    if (!parsed.length) return send(bot, chatId, t(lang, "med_setup_none"), { markdown: true });

    if (session.step === "setup_edit") session.data.pending = parsed;
    else if (session.step === "setup_add") session.data.pending = [...(session.data.pending || []), ...parsed];
    else session.data.pending = parsed;

    const lines = session.data.pending.map(formatMedLine).join("\n");
    session.step = "setup_confirm";
    return send(bot, chatId, t(lang, "med_confirm_intro", { lines }), {
      keyboard: medConfirmKeyboard(lang),
      markdown: true,
    });
  }

  // ---- Legacy single-med log path (subsequent logs) ----
  if (!val) return send(bot, chatId, t(lang, "med_ask_name"), { markdown: true });
  const { name, dose } = parseMedNameDose(val);
  await addMedication(session.user.id, name, dose);
  session.user = await registerActivity(session.user);
  session.user = await applyScores(session.user, "log_med");
  await refreshKB(session.user);
  awardEventToChallenges(session.user, "medication", { name, dose }).catch(() => {});

  const existing = await findMedicationByName(session.user.id, name).catch(() => null);
  session.state = "idle";
  session.step = null;
  return send(
    bot,
    chatId,
    t(lang, "med_existing_logged", { name: sanitizeMd(name), streak: session.user.streak }),
    { keyboard: backKeyboard(lang), markdown: true }
  );
}

function parseMedNameDose(val) {
  const cleaned = val.trim().slice(0, 200);
  const doseMatch = cleaned.match(/(\d+(?:[\.\/]\d+)?\s?(?:mg|ml|units|iu|g)\b.*)$/i);
  const dose = doseMatch ? doseMatch[1].trim() : null;
  const name = dose ? cleaned.replace(dose, "").trim() : cleaned;
  return { name: name || cleaned, dose };
}

// Persist the pending medications and offer the Consistency Program.
async function saveSetupAndOfferProgram(bot, chatId, session) {
  const lang = langOf(session);
  const list = session.data.pending || [];
  for (const m of list) {
    await addMedicationMasterFull(session.user.id, {
      name: m.name,
      dose: m.dose,
      frequency: m.frequency,
      units: m.units,
      is_insulin: m.is_insulin,
      preferred_time: null,
      reminder_enabled: false,
    }).catch((e) => console.error("addMedicationMasterFull:", e?.message));
  }
  session.step = "setup_offer_program";
  await send(bot, chatId, t(lang, "med_saved_ok"), { markdown: true });
  await send(bot, chatId, t(lang, "medcp_offer"), {
    keyboard: medConsistencyOfferKeyboard(lang),
    markdown: true,
  });
}

// Callback dispatcher for medconf:* / medcp:*.
export async function medicationCallback(bot, chatId, session, data) {
  const lang = langOf(session);

  if (data.startsWith("medconf:")) {
    const action = data.split(":")[1];
    if (action === "yes") return saveSetupAndOfferProgram(bot, chatId, session);
    if (action === "edit") {
      session.step = "setup_edit";
      return send(bot, chatId, t(lang, "med_edit_ask"), { markdown: true });
    }
    if (action === "add") {
      session.step = "setup_add";
      return send(bot, chatId, t(lang, "med_add_ask"), { markdown: true });
    }
  }

  if (data.startsWith("medcp:")) {
    const ans = data.split(":")[1];
    if (ans === "yes") {
      await enrollMedConsistency(session.user.id).catch((e) => console.error("enrollMedConsistency:", e?.message));
      await addReminderSchedule(session.user.id, {
        category: "med_consistency",
        label: session.data.pending?.map((m) => m.name).join(", ") || "Medications",
        time_of_day: "20:00",
        frequency_days: 1,
        next_fire_at: nextFireAtFor("20:00", 1),
      });
      await send(bot, chatId, t(lang, "medcp_yes"), { keyboard: backKeyboard(lang), markdown: true });
    } else {
      await send(bot, chatId, t(lang, "medcp_no"), { keyboard: backKeyboard(lang), markdown: true });
    }
    session.state = "idle";
    session.step = null;
    session.data = {};
    return;
  }

  // Legacy medfreq: / remoffer: paths are handled elsewhere (kept for old flow)
}

// HH:MM (24-hour). Returns null if it doesn't parse.
function normalizeTimeOfDay(val) {
  const m = String(val).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function nextFireAtFor(timeOfDay, frequencyDays = 1) {
  const TZ_OFFSET = parseInt(process.env.REMINDER_TZ_OFFSET || "5", 10);
  const [h, m] = timeOfDay.split(":").map(Number);
  const now = new Date();
  const local = new Date(now.getTime() + TZ_OFFSET * 3600 * 1000);
  local.setUTCHours(h, m, 0, 0);
  const nowLocal = new Date(now.getTime() + TZ_OFFSET * 3600 * 1000);
  if (local <= nowLocal) local.setUTCDate(local.getUTCDate() + frequencyDays);
  return new Date(local.getTime() - TZ_OFFSET * 3600 * 1000).toISOString();
}

// ==================================================================
// Weight — v2 (lb→kg conversion, first/subsequent messages)
// ==================================================================

export async function startWeight(bot, chatId, session) {
  session.state = "weight";
  session.step = "ask_value";
  session.data = {};
  await send(bot, chatId, t(langOf(session), "weight_prompt_v2"), {
    keyboard: backKeyboard(langOf(session)),
    markdown: true,
  });
}

function parseWeight(text) {
  const s = String(text || "").toLowerCase();
  const m = s.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const val = parseFloat(m[1]);
  if (!Number.isFinite(val)) return null;
  const isLb = /lbs?\b|pounds?\b/.test(s);
  const kg = isLb ? +(val * 0.45359237).toFixed(1) : val;
  if (kg < 20 || kg > 400) return null;
  return { kg, original: val, unit: isLb ? "lb" : "kg" };
}

export async function weightText(bot, chatId, session, text) {
  const lang = langOf(session);
  const p = parseWeight(text);
  if (!p) return send(bot, chatId, t(lang, "invalid_number"));

  const isFirst = (await countWeightEntries(session.user.id).catch(() => 0)) === 0;

  await addHealthLog(session.user.id, { weight_kg: p.kg });
  session.user = await registerActivity(session.user);
  session.user = await applyScores(session.user, "checkin");
  await refreshKB(session.user);
  awardEventToChallenges(session.user, "weight", { weight_kg: p.kg }).catch(() => {});

  const shownUnit = p.unit === "lb" ? `${p.original} lb (${p.kg} kg)` : `${p.kg} kg`;
  const confirmBody = `${t(lang, isFirst ? "weight_first_confirm" : "weight_confirm")}\n\n_Saved:_ ${shownUnit}`;
  if (isFirst) {
    await send(bot, chatId, confirmBody, { keyboard: backKeyboard(lang), markdown: true });
  } else {
    await send(bot, chatId, confirmBody, { markdown: true });
    await send(bot, chatId, t(lang, "weight_trend"), { keyboard: backKeyboard(lang), markdown: true });
  }

  session.state = "idle";
  session.step = null;
}

export async function weightCallback(bot, chatId, session, data) {
  // Kept for compatibility with the older monthly-reminder offer callback
  const lang = langOf(session);
  if (!data.startsWith("remoffer:")) return;
  const [, key, ans] = data.split(":");
  if (key !== "weight") return;
  if (ans === "yes") {
    await addReminderSchedule(session.user.id, {
      category: "weight",
      label: "Weight check-in",
      time_of_day: "09:00",
      frequency_days: 30,
      next_fire_at: nextFireAtFor("09:00", 30),
    });
    await send(bot, chatId, t(lang, "weight_monthly_saved"), { keyboard: backKeyboard(lang), markdown: true });
  } else {
    await send(bot, chatId, t(lang, "bs_reminder_no"), { keyboard: backKeyboard(lang), markdown: true });
  }
  session.state = "idle";
  session.step = null;
}

// ==================================================================
// Physical Activity — v2 (parser for type/duration/distance/steps)
// ==================================================================

export async function startActivity(bot, chatId, session) {
  session.state = "activity";
  session.step = "ask_value";
  session.data = {};
  await send(bot, chatId, t(langOf(session), "activity_prompt_v2"), {
    keyboard: backKeyboard(langOf(session)),
    markdown: true,
  });
}

function parseActivity(text) {
  const raw = String(text || "").toLowerCase();
  const stepsM = raw.match(/(\d[\d,]*)\s*steps?/);
  const minsM = raw.match(/(\d+)\s*(?:minute|min)/);
  const hoursM = raw.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr)/);
  const kmM = raw.match(/(\d+(?:\.\d+)?)\s*km\b/);
  const activityTypes = ["walk", "walked", "run", "ran", "gym", "swam", "swim", "cricket", "yoga", "cycle", "cycling", "jog", "jogged"];
  const typeM = activityTypes.find((w) => raw.includes(w));

  const fields = { note: text.slice(0, 200) };
  if (stepsM) fields.steps = parseInt(stepsM[1].replace(/,/g, ""), 10);
  if (minsM || hoursM || kmM || typeM) {
    const parts = [];
    if (typeM) parts.push(typeM);
    if (minsM) parts.push(`${minsM[1]} min`);
    if (hoursM) parts.push(`${hoursM[1]} hr`);
    if (kmM) parts.push(`${kmM[1]} km`);
    if (parts.length) fields.note = parts.join(" ");
  }
  // Approximate duration in minutes for the Challenges engine. Order of
  // preference: explicit minutes → hours × 60 → a walking estimate from
  // steps (100 steps ≈ 1 min) → a conservative 20-min default when the
  // user just says "went for a walk" so the intent still qualifies.
  let durationMin = 0;
  if (minsM) durationMin = parseInt(minsM[1], 10);
  else if (hoursM) durationMin = Math.round(parseFloat(hoursM[1]) * 60);
  else if (stepsM) durationMin = Math.round(parseInt(stepsM[1].replace(/,/g, ""), 10) / 100);
  else if (typeM) durationMin = 20;
  fields._durationMin = durationMin;
  return fields;
}

export async function activityText(bot, chatId, session, text) {
  const lang = langOf(session);
  const fields = parseActivity(text);
  const durationMin = fields._durationMin || 0;
  delete fields._durationMin;

  const isFirst = (await countActivityEntries(session.user.id).catch(() => 0)) === 0;

  await addHealthLog(session.user.id, fields);
  session.user = await registerActivity(session.user);
  session.user = await applyScores(session.user, "checkin");
  await refreshKB(session.user);
  awardEventToChallenges(session.user, "activity", {
    duration_min: durationMin,
    activity_text: text,
  }).catch(() => {});

  const askGoal = !session.user.weekly_activity_goal_days;
  const confirmKey = isFirst ? "activity_first_confirm" : "activity_confirm";
  // If we still need to ask the weekly goal, don't attach the back button —
  // the goal keyboard follows immediately. Otherwise attach it to the last
  // message so the user has a way home.
  await send(bot, chatId, t(lang, confirmKey), {
    markdown: true,
    keyboard: !askGoal && isFirst ? backKeyboard(lang) : undefined,
  });
  if (!isFirst) {
    await send(bot, chatId, t(lang, "activity_trend"), {
      keyboard: askGoal ? undefined : backKeyboard(lang),
      markdown: true,
    });
  }

  if (askGoal) {
    session.step = "ask_goal";
    return send(bot, chatId, t(lang, "activity_ask_goal"), {
      keyboard: activityDaysKeyboard(lang),
      markdown: true,
    });
  }

  session.state = "idle";
  session.step = null;
}

export async function activityCallback(bot, chatId, session, data) {
  const lang = langOf(session);
  if (!data.startsWith("actgoal:")) return;
  const days = parseInt(data.split(":")[1], 10);
  if (!Number.isFinite(days) || days < 1 || days > 7) return;
  session.user = await updateUser(session.user.id, { weekly_activity_goal_days: days });
  await send(bot, chatId, t(lang, "activity_goal_saved", { days }), {
    keyboard: backKeyboard(lang),
    markdown: true,
  });
  session.state = "idle";
  session.step = null;
}

// ==================================================================
// Wellbeing (replaces Symptoms UX)
// ==================================================================

const MOOD_TO_SCORE = { great: 5, good: 4, okay: 3, notgreat: 2, poor: 1 };

// Type 1 users get an extra periodic prompt after wellbeing. 14-day cadence so
// we don't nag on daily check-ins but still capture drift in confidence.
const T1_CONFIDENCE_DAYS = 14;

function isType1(user) {
  return user?.diabetes_status === "type1";
}

function t1ConfidenceDue(user) {
  if (!isType1(user)) return false;
  const last = user.t1_confidence_updated_at;
  if (!last) return true;
  const ageMs = Date.now() - new Date(last).getTime();
  return ageMs >= T1_CONFIDENCE_DAYS * 24 * 60 * 60 * 1000;
}

async function offerT1Confidence(bot, chatId, session) {
  if (!t1ConfidenceDue(session.user)) return false;
  const lang = langOf(session);
  session.state = "t1_confidence";
  session.step = null;
  await send(bot, chatId, t(lang, "t1c_prompt"), {
    keyboard: t1ConfidenceKeyboard(lang),
    markdown: true,
  });
  return true;
}

export async function t1ConfidenceCallback(bot, chatId, session, data) {
  const lang = langOf(session);
  if (!data.startsWith("t1c:")) return;
  const level = data.split(":")[1];
  if (!["very", "mostly", "sometimes", "help"].includes(level)) return;

  const updated = await addT1ConfidenceLog(session.user.id, level).catch((e) => {
    console.error("addT1ConfidenceLog:", e?.message);
    return null;
  });
  if (updated) session.user = updated;
  else {
    session.user.t1_confidence = level;
    session.user.t1_confidence_updated_at = new Date().toISOString();
  }

  await send(bot, chatId, t(lang, `t1c_reply_${level}`), {
    keyboard: backKeyboard(lang),
    markdown: true,
  });
  session.state = "idle";
  session.step = null;
}

export async function startWellbeing(bot, chatId, session) {
  session.state = "wellbeing";
  session.data = {};
  await send(bot, chatId, t(langOf(session), "wb_prompt"), {
    keyboard: wellbeingMoodKeyboard(langOf(session)),
    markdown: true,
  });
}

export async function wellbeingCallback(bot, chatId, session, data) {
  const lang = langOf(session);
  if (!data.startsWith("wb:")) return;
  const mood = data.split(":")[1];
  const score = MOOD_TO_SCORE[mood];
  if (!score) return;
  session.data = { mood, score };

  if (mood === "notgreat" || mood === "poor") {
    session.step = "await_note";
    return send(bot, chatId, t(lang, mood === "notgreat" ? "wb_reply_notgreat" : "wb_reply_poor"), {
      markdown: true,
    });
  }

  // Great / Good / Okay → save immediately with no follow-up.
  await addWellbeingLog(session.user.id, { score, label: mood, note: null }).catch((e) =>
    console.error("addWellbeingLog:", e?.message)
  );
  session.user = await registerActivity(session.user);
  session.user = await applyScores(session.user, "checkin");
  await refreshKB(session.user);
  awardEventToChallenges(session.user, "wellbeing", { mood, score }).catch(() => {});
  await send(bot, chatId, t(lang, `wb_reply_${mood}`), { keyboard: backKeyboard(lang), markdown: true });
  session.state = "idle";
  session.step = null;
  await offerT1Confidence(bot, chatId, session);
}

export async function wellbeingText(bot, chatId, session, text) {
  const lang = langOf(session);
  if (session.step !== "await_note") return startWellbeing(bot, chatId, session);

  const note = (text || "").trim().slice(0, 800);
  const { mood, score } = session.data || {};
  await addWellbeingLog(session.user.id, {
    score,
    label: mood,
    note,
    // TODO: LLM-based category triage (physical / emotional / diabetes / urgent). For now stored as unclassified.
    category: "unclassified",
  }).catch((e) => console.error("addWellbeingLog:", e?.message));
  session.user = await registerActivity(session.user);
  session.user = await applyScores(session.user, "checkin");
  await refreshKB(session.user);
  awardEventToChallenges(session.user, "wellbeing", { mood, score }).catch(() => {});

  await send(bot, chatId, t(lang, "wb_note_saved"), { keyboard: backKeyboard(lang), markdown: true });
  session.state = "idle";
  session.step = null;
  await offerT1Confidence(bot, chatId, session);
}

// ==================================================================
// Legacy: Symptoms (kept for older deep links; new entry point is Wellbeing)
// ==================================================================
export async function startSymptoms(bot, chatId, session) {
  return startWellbeing(bot, chatId, session);
}
export async function symptomsText(bot, chatId, session, text) {
  return wellbeingText(bot, chatId, session, text);
}

// ==================================================================
// Daily health check-in (legacy combined entry)
// ==================================================================

export async function startHealth(bot, chatId, session) {
  session.state = "health";
  await send(bot, chatId, t(langOf(session), "health_prompt"), {
    keyboard: backKeyboard(langOf(session)),
    markdown: true,
  });
}

function parseHealth(text) {
  const lower = String(text).toLowerCase();
  const fields = {};
  const num = (re) => {
    const m = lower.match(re);
    return m ? parseFloat(m[1]) : null;
  };
  const weight = num(/weight\s*:?\s*(\d+(\.\d+)?)/) ?? num(/(\d+(\.\d+)?)\s*kg/);
  const steps = num(/steps?\s*:?\s*(\d+)/);
  const sleep = num(/sleep\s*:?\s*(\d+(\.\d+)?)/);
  const water = num(/water\s*:?\s*(\d+)/) ?? num(/(\d+)\s*glass/);
  const moodM = lower.match(/mood\s*:?\s*([a-z]+)/);

  if (weight) fields.weight_kg = weight;
  if (steps) fields.steps = Math.round(steps);
  if (sleep) fields.sleep_hours = sleep;
  if (water) fields.water_glasses = Math.round(water);
  if (moodM) fields.mood = moodM[1];
  return fields;
}

export async function healthText(bot, chatId, session, text) {
  const lang = langOf(session);
  const fields = parseHealth(text);
  if (Object.keys(fields).length === 0) {
    fields.note = (text || "").trim().slice(0, 200);
    if (!fields.note) return send(bot, chatId, t(lang, "health_none"), { markdown: true });
  }

  await addHealthLog(session.user.id, fields);
  session.user = await registerActivity(session.user);
  session.user = await applyScores(session.user, "checkin");
  await refreshKB(session.user);
  await send(bot, chatId, t(lang, "health_saved", { streak: session.user.streak }), {
    keyboard: backKeyboard(lang),
    markdown: true,
  });
}
