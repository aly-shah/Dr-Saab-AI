// Challenges module (spec v1.0, 2026-07).
//
// Three MVP challenges live in the challenge_definitions table:
//   • hba1c_90d          — 90-Day HbA1c Challenge  (needs baseline + final)
//   • activity_30d       — 30-Day Activity Challenge (auto-scored from logs)
//   • healthy_plate_30d  — 30-Day Healthy Plate Challenge (auto from meals)
//
// Everything user-facing is here. Progress hooks (glucose/med/activity/meal/
// lab logging → participation points, outcome updates, doctor notifications)
// live in challengeEngine.js so the tracking/coach/lab flows only need a
// single call. Daily reminders and the final-result prompt are queued into
// reminder_schedules and rendered by scheduler.js.
//
// Callback prefix: `chal:*` (distinct from the legacy `chl:*` module, which
// is kept alive in bot.js for backwards-compat with old deep links).
// Text-input states: `challenge_hba1c_baseline` and `challenge_hba1c_final`.

import { t } from "../i18n.js";
import { send, sanitizeMd, langOf, photoDataUrl, documentBuffer } from "../utils.js";
import { resetFlow } from "../session.js";
import {
  chalMainKeyboard,
  chalAvailableKeyboard,
  chalIntroKeyboard,
  chalHowBackKeyboard,
  chalHba1cCollectKeyboard,
  chalHba1cReuseKeyboard,
  chalHba1cFinalKeyboard,
  chalRankingsPickerKeyboard,
  chalBackKeyboard,
  chalDetailKeyboard,
  chalWithdrawConfirmKeyboard,
  chalActiveListKeyboard,
} from "../keyboards.js";
import {
  listActiveChallengeDefs,
  getChallengeDefByCode,
  getChallengeDefById,
  getActiveUserChallenge,
  createUserChallenge,
  updateUserChallenge,
  getUserChallengeById,
  listUserChallengesActive,
  listUserChallengesHistory,
  listCohortResults,
  listChallengeEventsForDay,
  addReminderSchedule,
  latestMetrics,
  getDoctorById,
  enqueueChallengeDoctorNotification,
} from "../supabase.js";
import { explainLab } from "../openai.js";
import { addLabReport } from "../supabase.js";
import { extractPdfText, isPdfMime } from "../pdf.js";
import { computeAndPersistScores, HBA1C_BANDS } from "./challengeEngine.js";

const TZ_OFFSET = parseInt(process.env.REMINDER_TZ_OFFSET || "5", 10);

// -------------------------------------------------------------------
// Date / display helpers
// -------------------------------------------------------------------
function todayLocalDate() {
  const d = new Date(Date.now() + TZ_OFFSET * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

function addDaysToLocalDate(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const da = new Date(`${a}T00:00:00Z`).getTime();
  const db = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((db - da) / 86400000);
}

// First display name for public rankings — "Ahmed K." style. Falls back to
// "DrSaab user" for users who haven't set a name yet.
function publicDisplayName(user) {
  const raw = String(user?.name || "").trim();
  if (!raw) return "DrSaab user";
  const parts = raw.split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

// Convert a HbA1c baseline to a fairness band (spec §9.3).
export function baselineBand(value) {
  if (value == null) return null;
  if (value < 7) return HBA1C_BANDS.lt7;
  if (value < 9) return HBA1C_BANDS.b7_8_9;
  if (value < 11) return HBA1C_BANDS.b9_10_9;
  return HBA1C_BANDS.b11_plus;
}

function bandLabelKey(band) {
  return {
    [HBA1C_BANDS.lt7]:      "chal_baseline_band_lt7",
    [HBA1C_BANDS.b7_8_9]:   "chal_baseline_band_7_8_9",
    [HBA1C_BANDS.b9_10_9]:  "chal_baseline_band_9_10_9",
    [HBA1C_BANDS.b11_plus]: "chal_baseline_band_11_plus",
  }[band] || "chal_baseline_band_lt7";
}

// -------------------------------------------------------------------
// Entry point (main menu → Challenges)
// -------------------------------------------------------------------
export async function showChallenges(bot, chatId, session) {
  resetFlow(chatId);
  const lang = langOf(session);
  return send(
    bot,
    chatId,
    `${t(lang, "chal_menu_title")}\n\n${t(lang, "chal_menu_intro")}`,
    { keyboard: chalMainKeyboard(lang), markdown: true, keepEmoji: true }
  );
}

// -------------------------------------------------------------------
// Active challenges list
// -------------------------------------------------------------------
async function showActive(bot, chatId, session) {
  const lang = langOf(session);
  const rows = await listUserChallengesActive(session.user.id).catch(() => []);
  if (!rows.length) {
    return send(bot, chatId, `${t(lang, "chal_active_title")}\n\n${t(lang, "chal_active_none")}`, {
      keyboard: chalBackKeyboard(lang), markdown: true, keepEmoji: true,
    });
  }
  const lines = [];
  for (const r of rows) {
    lines.push(await renderActiveLine(session, r, lang));
  }
  return send(
    bot,
    chatId,
    `${t(lang, "chal_active_title")}\n\n${lines.join("\n")}\n\n_Tap a challenge for details._`,
    { keyboard: chalActiveListKeyboard(lang, rows), markdown: true, keepEmoji: true }
  );
}

// Per-challenge detail card (§7.5 for Activity + equivalents for HbA1c and
// Healthy Plate). Buttons let the user toggle their public-leaderboard
// visibility or withdraw entirely.
async function showChallengeDetail(bot, chatId, session, ucId) {
  const lang = langOf(session);
  const uc = await getUserChallengeById(ucId).catch(() => null);
  if (!uc || uc.user_id !== session.user.id) return showActive(bot, chatId, session);

  const def = uc.challenge_id ? await getChallengeDefById(uc.challenge_id).catch(() => null) : null;
  const type = def?.challenge_type || uc.challenge_type;
  const total = def?.duration_days || 30;
  const start = uc.start_date || todayLocalDate();
  const day = Math.min(total, Math.max(1, daysBetween(start, todayLocalDate()) + 1));

  // Aggregate minutes for Activity — sum metadata.duration_min from
  // challenge_events with event_type='activity'.
  let minutes = 0;
  if (type === "activity") {
    const evs = await listChallengeEventsInWindow(uc.id, uc.start_date, todayLocalDate())
      .catch(() => []);
    minutes = evs
      .filter((e) => e.event_type === "activity")
      .reduce((n, e) => n + (Number(e.metadata?.duration_min) || 0), 0);
  }

  // For rank display we need the cohort size. Cheap read; already cached in
  // the DB.
  let cohortSize = "—";
  if (uc.challenge_id) {
    const cohort = await listCohortResults(uc.challenge_id).catch(() => []);
    cohortSize = cohort.length || "—";
  }

  let text;
  if (type === "activity") {
    text = t(lang, "chal_detail_activity", {
      active_days: uc.outcome_value || 0,
      minutes,
      streak: uc.current_streak || 0,
      day, total,
      rank: uc.rank ?? "—",
    }).replace("{total}", String(cohortSize));
  } else if (type === "healthy_plate") {
    text = t(lang, "chal_detail_healthy_plate", {
      count: uc.outcome_value || 0,
      day, total,
      rank: uc.rank ?? "—",
    }).replace("{total}", String(cohortSize));
  } else if (type === "hba1c") {
    if (uc.status === "awaiting_final_result") {
      text = t(lang, "chal_detail_awaiting_final");
    } else {
      text = t(lang, "chal_detail_hba1c", {
        baseline: fmtHba1c(uc.baseline_value),
        day, total,
        points: uc.participation_points || 0,
        streak: uc.current_streak || 0,
      });
    }
  } else {
    text = uc.def_name || "Challenge";
  }

  return send(bot, chatId, text, {
    keyboard: chalDetailKeyboard(lang, uc.id, uc.leaderboard_opt_in !== false),
    markdown: true, keepEmoji: true,
  });
}

// Helper — fetch challenge_events within a date window for the detail view.
async function listChallengeEventsInWindow(ucId, startDate, endDate) {
  // We only need aggregate stats, so pull with a lightweight loop of daily
  // fetches (the per-day helper already exists).
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const out = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const rows = await listChallengeEventsForDay(ucId, iso).catch(() => []);
    out.push(...rows);
  }
  return out;
}

// Choose the right one-line progress summary per challenge type.
async function renderActiveLine(session, uc, lang) {
  const type = uc.def_type || (await getChallengeDefById(uc.challenge_id).catch(() => null))?.challenge_type;
  const total = uc.def_duration_days || 30;
  const start = uc.start_date || todayLocalDate();
  const day = Math.min(total, Math.max(1, daysBetween(start, todayLocalDate()) + 1));

  if (type === "hba1c") {
    if (uc.status === "awaiting_final_result") return t(lang, "chal_active_awaiting_hba1c");
    return t(lang, "chal_active_line_hba1c", { day, total });
  }
  if (type === "activity") {
    return t(lang, "chal_active_line_activity", {
      day, total, active_days: uc.outcome_value || 0,
    });
  }
  if (type === "healthy_plate") {
    return t(lang, "chal_active_line_healthy_plate", {
      day, total, count: uc.outcome_value || 0,
    });
  }
  return `• ${uc.def_name || "Challenge"} — day ${day}/${total}`;
}

// -------------------------------------------------------------------
// Browse — pick a challenge
// -------------------------------------------------------------------
async function showBrowse(bot, chatId, session) {
  const lang = langOf(session);
  const defs = await listActiveChallengeDefs().catch(() => []);
  if (!defs.length) {
    return send(bot, chatId, t(lang, "chal_error_no_defs"), {
      keyboard: chalBackKeyboard(lang), markdown: true, keepEmoji: true,
    });
  }
  return send(
    bot,
    chatId,
    `${t(lang, "chal_available_title")}\n\n${t(lang, "chal_available_intro")}`,
    { keyboard: chalAvailableKeyboard(lang), markdown: true, keepEmoji: true }
  );
}

async function showChallengeIntro(bot, chatId, session, code) {
  const lang = langOf(session);
  const def = await getChallengeDefByCode(code).catch(() => null);
  if (!def) return showBrowse(bot, chatId, session);

  const [titleKey, bodyKey] = introKeysFor(def.challenge_type);
  return send(
    bot,
    chatId,
    `${t(lang, titleKey)}\n\n${t(lang, bodyKey)}`,
    { keyboard: chalIntroKeyboard(lang, code), markdown: true, keepEmoji: true }
  );
}

async function showHowItWorks(bot, chatId, session, code) {
  const lang = langOf(session);
  const def = await getChallengeDefByCode(code).catch(() => null);
  if (!def) return showBrowse(bot, chatId, session);

  const [titleKey, bodyKey] = howKeysFor(def.challenge_type);
  // §7.4: the Activity Challenge how-it-works also lists the qualifying
  // activity types so users know what counts.
  const extras = def.challenge_type === "activity"
    ? t(lang, "chal_activity_qualifying_list")
    : "";
  return send(
    bot,
    chatId,
    `${t(lang, titleKey)}\n\n${t(lang, bodyKey)}${extras}`,
    { keyboard: chalHowBackKeyboard(lang, code), markdown: true, keepEmoji: true }
  );
}

function introKeysFor(type) {
  if (type === "hba1c")        return ["chal_hba1c_intro_title", "chal_hba1c_intro_body"];
  if (type === "activity")     return ["chal_activity_intro_title", "chal_activity_intro_body"];
  return ["chal_hp_intro_title", "chal_hp_intro_body"];
}
function howKeysFor(type) {
  if (type === "hba1c")        return ["chal_hba1c_how_title", "chal_hba1c_how_body"];
  if (type === "activity")     return ["chal_activity_how_title", "chal_activity_how_body"];
  return ["chal_hp_how_title", "chal_hp_how_body"];
}

// -------------------------------------------------------------------
// Join flow
// -------------------------------------------------------------------
async function startJoin(bot, chatId, session, code) {
  const lang = langOf(session);
  const def = await getChallengeDefByCode(code).catch(() => null);
  if (!def) return showBrowse(bot, chatId, session);

  const existing = await getActiveUserChallenge(session.user.id, def.id).catch(() => null);
  if (existing) {
    return send(bot, chatId, t(lang, "chal_join_already", { name: def.name }), {
      keyboard: chalBackKeyboard(lang), markdown: true, keepEmoji: true,
    });
  }

  // §6.1 eligibility gate — the HbA1c challenge is designed for users with a
  // diabetes-related profile. "Healthier" users and doctors without a
  // recorded diabetes_status don't have a clinically meaningful HbA1c target
  // and are politely deflected. Everyone else (type1/type2/prediabetes/
  // gestational/atrisk/notsure) is eligible.
  if (def.challenge_type === "hba1c" && !hba1cEligible(session.user)) {
    return send(bot, chatId, t(lang, "chal_ineligible_hba1c"), {
      keyboard: chalBackKeyboard(lang), markdown: true, keepEmoji: true,
    });
  }

  if (def.challenge_type === "hba1c") return startHba1cJoin(bot, chatId, session, def);
  if (def.challenge_type === "activity") return finalizeSimpleJoin(bot, chatId, session, def);
  if (def.challenge_type === "healthy_plate") return finalizeSimpleJoin(bot, chatId, session, def);
  return showBrowse(bot, chatId, session);
}

// Any recognised diabetes profile qualifies. `healthier` users and doctors
// with no `diabetes_status` are excluded — the challenge isn't meaningful
// for them and the copy would confuse.
function hba1cEligible(user) {
  const status = user?.diabetes_status;
  if (status && ["type1", "type2", "prediabetes", "gestational", "atrisk", "notsure"].includes(status)) {
    return true;
  }
  const ut = user?.user_type;
  if (ut === "diabetes" || ut === "prediabetes") return true;
  // Fall back on any prior HbA1c reading on file — implies clinical relevance.
  if (user?.latest_hba1c != null) return true;
  return false;
}

// One-tap join for Activity + Healthy Plate (no baseline required).
async function finalizeSimpleJoin(bot, chatId, session, def) {
  const lang = langOf(session);
  const startDate = todayLocalDate();
  const endDate = addDaysToLocalDate(startDate, def.duration_days - 1);

  const uc = await createUserChallenge({
    user_id: session.user.id,
    challenge_type: def.challenge_type,
    challenge_id: def.id,
    doctor_id: session.user.doctor_id || null,
    public_display_name: publicDisplayName(session.user),
    leaderboard_opt_in: true,
    status: "active",
    start_date: startDate,
    end_date: endDate,
    started_at: new Date().toISOString(),
    outcome_value: 0,
    participation_points: 0,
  });

  await scheduleChallengeCheckinReminder(session.user.id, uc.id, def.challenge_type);
  await notifyDoctorJoinedIfAny(session, uc, def);

  const titleKey = def.challenge_type === "activity" ? "chal_activity_join_title" : "chal_hp_join_title";
  const bodyKey  = def.challenge_type === "activity" ? "chal_activity_join_body"  : "chal_hp_join_body";
  return send(
    bot,
    chatId,
    `${t(lang, titleKey)}\n\n${t(lang, bodyKey, { end_date: endDate })}`,
    { keyboard: chalBackKeyboard(lang), markdown: true, keepEmoji: true }
  );
}

// -------------------------------------------------------------------
// HbA1c join — baseline collection
// -------------------------------------------------------------------
async function startHba1cJoin(bot, chatId, session, def) {
  const lang = langOf(session);

  // If we already have a recent HbA1c on file (My Health metrics or the
  // profile column), offer to reuse it.
  const reusable = await findRecentHba1c(session.user).catch(() => null);
  session.data = session.data || {};
  session.data.chal = { pendingChallengeId: def.id };

  if (reusable) {
    session.state = "challenge_hba1c_baseline";
    session.step = "await_reuse";
    session.data.chal.reuseHba1c = reusable;
    const key = reusable.date ? "chal_hba1c_reuse" : "chal_hba1c_reuse_no_date";
    let body = t(lang, key, { value: reusable.value, date: reusable.date || "—" });
    // §6.1: nudge the user to add a fresher result if the reusable one is
    // more than 30 days old — still allow "Yes, use this", but they see the
    // reason to consider a newer number.
    if (reusable.date && daysBetween(reusable.date, todayLocalDate()) > 30) {
      body += "\n\n" + t(lang, "chal_hba1c_baseline_stale_warning");
    }
    return send(bot, chatId, body, {
      keyboard: chalHba1cReuseKeyboard(lang), markdown: true, keepEmoji: true, keepEmoji: true,
    });
  }

  return promptHba1cBaseline(bot, chatId, session);
}

async function promptHba1cBaseline(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "challenge_hba1c_baseline";
  session.step = "await_value";
  return send(
    bot,
    chatId,
    `${t(lang, "chal_hba1c_collect_title")}\n\n${t(lang, "chal_hba1c_collect_body")}`,
    { keyboard: chalHba1cCollectKeyboard(lang), markdown: true, keepEmoji: true }
  );
}

async function acceptHba1cReuse(bot, chatId, session) {
  const lang = langOf(session);
  const reuse = session.data?.chal?.reuseHba1c;
  if (!reuse) return promptHba1cBaseline(bot, chatId, session);
  return finalizeHba1cJoin(bot, chatId, session, reuse.value, reuse.date || todayLocalDate());
}

// After the user commits a starting HbA1c (reused or entered), create the
// user_challenges row and confirm.
async function finalizeHba1cJoin(bot, chatId, session, hba1cValue, baselineDate) {
  const lang = langOf(session);
  const pendingId = session.data?.chal?.pendingChallengeId;
  const def = pendingId
    ? await getChallengeDefById(pendingId).catch(() => null)
    : await getChallengeDefByCode("hba1c_90d").catch(() => null);
  if (!def) {
    resetFlow(chatId);
    return showChallenges(bot, chatId, session);
  }

  const startDate = todayLocalDate();
  const endDate = addDaysToLocalDate(startDate, def.duration_days - 1);
  const band = baselineBand(hba1cValue);

  const uc = await createUserChallenge({
    user_id: session.user.id,
    challenge_type: def.challenge_type,
    challenge_id: def.id,
    doctor_id: session.user.doctor_id || null,
    public_display_name: publicDisplayName(session.user),
    leaderboard_opt_in: true,
    status: "active",
    start_date: startDate,
    end_date: endDate,
    started_at: new Date().toISOString(),
    baseline_value: hba1cValue,
    baseline_unit: "%",
    baseline_date: baselineDate,
    baseline_band: band,
    outcome_value: 0,
    participation_points: 0,
  });

  await scheduleChallengeCheckinReminder(session.user.id, uc.id, "hba1c");
  await scheduleHba1cFinalPrompt(session.user.id, uc.id, endDate, def);
  await notifyDoctorJoinedIfAny(session, uc, def);

  resetFlow(chatId);

  const doc = session.user.doctor_id
    ? await getDoctorById(session.user.doctor_id).catch(() => null)
    : null;
  const body =
    `${t(lang, "chal_hba1c_confirm_title")}\n\n` +
    t(lang, "chal_hba1c_confirm_body", {
      baseline: fmtHba1c(hba1cValue), end_date: endDate,
    });
  const footer = doc
    ? `\n\n${t(lang, "chal_hba1c_confirm_doctor_footer", { doctor: sanitizeMd(doc.name || "—") })}`
    : "";
  return send(bot, chatId, body + footer, {
    keyboard: chalBackKeyboard(lang), markdown: true, keepEmoji: true,
  });
}

function fmtHba1c(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(1) : String(v);
}

// Look up a usable starting HbA1c from either the health_metrics timeline
// or the profile snapshot on the users row.
async function findRecentHba1c(user) {
  try {
    const metrics = await latestMetrics(user.id).catch(() => []);
    const hit = (metrics || []).find((m) => m.metric_type === "hba1c" && m.value != null);
    if (hit) return { value: Number(hit.value), date: hit.measurement_date || null };
  } catch { /* fall through */ }
  if (user?.latest_hba1c != null) {
    return { value: Number(user.latest_hba1c), date: null };
  }
  return null;
}

// -------------------------------------------------------------------
// HbA1c text-state handler (baseline & final input)
// -------------------------------------------------------------------

// value must be a plausible HbA1c percentage.
function parseHba1cText(text) {
  const s = String(text || "").trim();
  const m = s.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const v = parseFloat(m[1]);
  if (!Number.isFinite(v) || v < 4 || v > 20) return null;
  return v;
}

export async function chalHba1cText(bot, chatId, session, text, msg) {
  const lang = langOf(session);
  const step = session.step;

  // Reuse-question step: any typed reply is treated as "add another".
  if (step === "await_reuse") {
    return promptHba1cBaseline(bot, chatId, session);
  }

  // Try image / PDF extraction first (spec: Upload Report or Enter Result).
  const imageDataUrl = msg ? await photoDataUrl(bot, msg) : null;
  let userText = (text || msg?.caption || "").trim();
  if (!imageDataUrl && msg) {
    const doc = await documentBuffer(bot, msg);
    if (doc && isPdfMime(doc.mime)) {
      const extracted = await extractPdfText(doc.buffer);
      if (extracted) userText = [userText, extracted].filter(Boolean).join("\n\n");
    }
  }

  let value = null;
  let reportDateGuess = null;

  if (imageDataUrl || (userText && !parseHba1cText(userText))) {
    // Ask the lab-report analyser to extract HbA1c from a report (image or
    // pasted values). We also persist it to lab_reports so the user's health
    // timeline stays in sync.
    try {
      const extracted = await explainLab(session.user, userText || "HbA1c report",
        imageDataUrl, "");
      const hba1cRow = (extracted?.values || []).find(
        (v) => /hba1c|a1c/i.test(v?.test || "")
      );
      if (hba1cRow?.result) {
        value = parseHba1cText(String(hba1cRow.result));
      }
      reportDateGuess = extracted?.metadata?.report_date || null;
      if (value != null) {
        await addLabReport(session.user.id, userText || "[image]",
          extracted?.analysis || "",
          { metadata: extracted?.metadata, values: extracted?.values, lab_source: extracted?.labSource }
        ).catch(() => {});
      }
    } catch (e) {
      console.error("chal HbA1c extract:", e?.message);
    }
  }

  if (value == null) value = parseHba1cText(userText);

  if (value == null) {
    return send(bot, chatId, t(lang, "chal_hba1c_invalid"), { markdown: true, keepEmoji: true });
  }

  const date = reportDateGuess && /^\d{4}-\d{2}-\d{2}$/.test(reportDateGuess)
    ? reportDateGuess
    : todayLocalDate();

  if (step === "await_final_value") {
    return applyHba1cFinal(bot, chatId, session, value, date);
  }
  return finalizeHba1cJoin(bot, chatId, session, value, date);
}

// -------------------------------------------------------------------
// HbA1c final result submission
// -------------------------------------------------------------------
export async function startHba1cFinal(bot, chatId, session, ucId) {
  const lang = langOf(session);
  const uc = await getUserChallengeById(ucId).catch(() => null);
  if (!uc || uc.user_id !== session.user.id) return showChallenges(bot, chatId, session);

  session.state = "challenge_hba1c_baseline";
  session.step = "await_final_value";
  session.data = session.data || {};
  session.data.chal = { pendingFinalUc: uc.id };

  return send(
    bot,
    chatId,
    `${t(lang, "chal_hba1c_final_prompt_title")}\n\n${t(lang, "chal_hba1c_final_prompt_body")}`,
    { keyboard: chalHba1cFinalKeyboard(lang), markdown: true, keepEmoji: true }
  );
}

async function applyHba1cFinal(bot, chatId, session, finalValue, finalDate) {
  const lang = langOf(session);
  const ucId = session.data?.chal?.pendingFinalUc;
  const uc = ucId ? await getUserChallengeById(ucId).catch(() => null) : null;
  if (!uc) {
    resetFlow(chatId);
    return showChallenges(bot, chatId, session);
  }

  const change = Number(uc.baseline_value) - finalValue;
  const patch = {
    final_value: finalValue,
    final_unit: "%",
    final_date: finalDate,
    outcome_value: change,
    status: "completed",
    completed_at: new Date().toISOString(),
  };
  await updateUserChallenge(uc.id, patch);

  // Recompute cohort scores & ranks; write back this user's row.
  const { rank, total, band } = await computeAndPersistScores(uc.challenge_id, session.user.id);
  const uc2 = await getUserChallengeById(uc.id).catch(() => uc);

  await notifyDoctorCompletedIfAny(session, { ...uc2, rank, total });

  const supportive = pickHba1cSupportive(lang, change);
  const bandKey = bandLabelKey(band || uc.baseline_band);
  const bandLine = t(lang, "chal_rankings_hba1c_note", { band: t(lang, bandKey) });
  const body =
    `${t(lang, "chal_hba1c_final_saved_title")}\n\n` +
    t(lang, "chal_hba1c_final_saved_body", {
      baseline: fmtHba1c(uc.baseline_value),
      final: fmtHba1c(finalValue),
      change: change >= 0 ? change.toFixed(1) : `+${(-change).toFixed(1)}`,
      rank: rank ?? "—",
      total: total ?? "—",
    }) + "\n\n" + supportive + "\n\n" + bandLine;

  resetFlow(chatId);
  return send(bot, chatId, body, { keyboard: chalBackKeyboard(lang), markdown: true, keepEmoji: true });
}

function pickHba1cSupportive(lang, change) {
  if (change >= 0.3) return t(lang, "chal_hba1c_supportive_improved");
  if (change > -0.3) return t(lang, "chal_hba1c_supportive_flat");
  return t(lang, "chal_hba1c_supportive_up");
}

// -------------------------------------------------------------------
// Rankings
// -------------------------------------------------------------------
async function showRankings(bot, chatId, session, code = null) {
  const lang = langOf(session);
  const defs = await listActiveChallengeDefs().catch(() => []);
  if (!defs.length) {
    return send(bot, chatId, t(lang, "chal_error_no_defs"), {
      keyboard: chalBackKeyboard(lang), markdown: true, keepEmoji: true,
    });
  }
  if (!code) {
    return send(bot, chatId, t(lang, "chal_rankings_pick_intro"), {
      keyboard: chalRankingsPickerKeyboard(lang, defs), markdown: true, keepEmoji: true,
    });
  }
  const def = defs.find((d) => d.challenge_code === code) || await getChallengeDefByCode(code);
  if (!def) return showRankings(bot, chatId, session);

  const cohort = await listCohortResults(def.id).catch(() => []);

  // For HbA1c, filter to the user's own baseline band (if they've joined
  // this challenge) — otherwise show the biggest band (7.0%–8.9%) as the
  // default view so a curious non-participant still sees a real leaderboard.
  let cohortView = cohort;
  let bandForView = null;
  if (def.challenge_type === "hba1c") {
    const own = cohort.find((r) => r.user_id === session.user.id);
    bandForView = own?.baseline_band || dominantBand(cohort) || HBA1C_BANDS.b7_8_9;
    cohortView = cohort.filter((r) => r.baseline_band === bandForView);
    // Awaiting-final rows are excluded from the leaderboard (spec §11).
    cohortView = cohortView.filter((r) => r.status === "completed" || r.final_value != null);
  }

  // §11: opted-out users are hidden from the public leaderboard. The user's
  // own row is always kept so they can see the standings from their vantage.
  cohortView = cohortView.filter(
    (r) => r.user_id === session.user.id || r.leaderboard_opt_in !== false
  );

  cohortView = rankSort(cohortView, def);

  const meIdx = cohortView.findIndex((r) => r.user_id === session.user.id);
  const shown = sliceAroundMe(cohortView, meIdx, 6);

  const rows = shown.map(({ row, rank }) => renderRankRow(lang, row, rank, def, session.user.id));
  const title = t(lang, "chal_rankings_title", { name: displayNameForDef(lang, def) });
  const empty = !cohortView.length ? "\n\n" + t(lang, "chal_rankings_empty") : "";
  const youLine = meIdx >= 0
    ? t(lang, "chal_rankings_you_position", { rank: meIdx + 1, total: cohortView.length })
    : "";
  const bandLine = def.challenge_type === "hba1c" && bandForView
    ? "\n\n" + t(lang, "chal_rankings_hba1c_note", {
        band: t(lang, bandLabelKey(bandForView)),
      })
    : "";

  return send(
    bot,
    chatId,
    `${title}${empty}\n\n${rows.join("\n")}${youLine}${bandLine}`,
    { keyboard: chalBackKeyboard(lang), markdown: true, keepEmoji: true }
  );
}

function displayNameForDef(lang, def) {
  const key = {
    hba1c: "chal_type_hba1c",
    activity: "chal_type_activity",
    healthy_plate: "chal_type_healthy_plate",
  }[def.challenge_type];
  return key ? t(lang, key) : def.name;
}

function dominantBand(cohort) {
  const counts = new Map();
  for (const r of cohort) {
    if (!r.baseline_band) continue;
    counts.set(r.baseline_band, (counts.get(r.baseline_band) || 0) + 1);
  }
  let best = null, bestN = 0;
  for (const [k, n] of counts) if (n > bestN) { best = k; bestN = n; }
  return best;
}

// Rank by final_score desc, then tie-break on outcome (spec §9.2).
function rankSort(rows, def) {
  return [...rows].sort((a, b) => {
    const fa = Number(a.final_score ?? 0);
    const fb = Number(b.final_score ?? 0);
    if (fb !== fa) return fb - fa;
    const oa = Number(a.outcome_value ?? 0);
    const ob = Number(b.outcome_value ?? 0);
    if (ob !== oa) return ob - oa;
    return Number(b.participation_points ?? 0) - Number(a.participation_points ?? 0);
  });
}

function sliceAroundMe(sorted, meIdx, span) {
  if (sorted.length <= span * 2 + 1) {
    return sorted.map((row, i) => ({ row, rank: i + 1 }));
  }
  if (meIdx < 0) {
    return sorted.slice(0, span * 2 + 1).map((row, i) => ({ row, rank: i + 1 }));
  }
  const start = Math.max(0, meIdx - span);
  const end   = Math.min(sorted.length, meIdx + span + 1);
  return sorted.slice(start, end).map((row, i) => ({ row, rank: start + i + 1 }));
}

function renderRankRow(lang, row, rank, def, meId) {
  const name = row.public_display_name || row._user_name || "DrSaab user";
  const isMe = row.user_id === meId;
  let outcome = "—";
  if (def.challenge_type === "hba1c") {
    const change = Number(row.outcome_value ?? 0);
    if (change > 0) {
      outcome = t(lang, "chal_outcome_hba1c_change", { change: change.toFixed(1) });
    } else if (isMe) {
      // Own row: honest private feedback. An upward arrow is fine because the
      // user already sees the exact numbers in the final-result card.
      outcome = change < 0
        ? t(lang, "chal_outcome_hba1c_up", { change: (-change).toFixed(1) })
        : t(lang, "chal_outcome_hba1c_steady");
    } else {
      // §18: public leaderboard must not highlight another user's HbA1c
      // increase. Steady/worsening peers show as "steady" — no arrow, no
      // number leak, no public shaming.
      outcome = t(lang, "chal_outcome_hba1c_steady");
    }
  } else if (def.challenge_type === "activity") {
    outcome = t(lang, "chal_outcome_active_days", { value: row.outcome_value ?? 0 });
  } else {
    outcome = t(lang, "chal_outcome_plates", { value: row.outcome_value ?? 0 });
  }
  const line = t(lang, "chal_rankings_row", {
    rank, name: isMe ? "*You*" : sanitizeMd(name), outcome,
  });
  return isMe ? line + t(lang, "chal_rankings_you_suffix") : line;
}

// -------------------------------------------------------------------
// History
// -------------------------------------------------------------------
async function showHistory(bot, chatId, session) {
  const lang = langOf(session);
  const rows = await listUserChallengesHistory(session.user.id).catch(() => []);
  if (!rows.length) {
    return send(bot, chatId, `${t(lang, "chal_history_title")}\n\n${t(lang, "chal_history_empty")}`, {
      keyboard: chalBackKeyboard(lang), markdown: true, keepEmoji: true,
    });
  }
  const lines = [];
  for (const r of rows) {
    const def = r.def_type ? { challenge_type: r.def_type }
      : await getChallengeDefById(r.challenge_id).catch(() => null);
    const name = r.def_name || def?.name || "Challenge";
    if (r.status === "completed") {
      lines.push(t(lang, "chal_history_row_completed", {
        name, outcome: outcomeText(lang, r, def), rank: r.rank ?? "—", total: "—",
      }));
    } else {
      const statusKey = {
        expired_incomplete: "chal_history_status_expired",
        withdrawn_by_user:  "chal_history_status_withdrawn",
        disqualified:       "chal_history_status_disqualified",
      }[r.status] || "chal_history_status_expired";
      lines.push(t(lang, "chal_history_row_incomplete", { name, status: t(lang, statusKey) }));
    }
  }
  return send(
    bot,
    chatId,
    `${t(lang, "chal_history_title")}\n\n${lines.join("\n")}`,
    { keyboard: chalBackKeyboard(lang), markdown: true, keepEmoji: true }
  );
}

function outcomeText(lang, uc, def) {
  const type = def?.challenge_type || uc.challenge_type;
  if (type === "hba1c") {
    const change = Number(uc.outcome_value ?? 0);
    return change >= 0
      ? t(lang, "chal_outcome_hba1c_change", { change: change.toFixed(1) })
      : t(lang, "chal_outcome_hba1c_up", { change: (-change).toFixed(1) });
  }
  if (type === "activity") return t(lang, "chal_outcome_active_days", { value: uc.outcome_value ?? 0 });
  return t(lang, "chal_outcome_plates", { value: uc.outcome_value ?? 0 });
}

// -------------------------------------------------------------------
// Reminders & doctor notifications
// -------------------------------------------------------------------
function nextFire9amLocal(offsetDays = 1) {
  const nowLocal = new Date(Date.now() + TZ_OFFSET * 3600 * 1000);
  const target = new Date(Date.UTC(
    nowLocal.getUTCFullYear(),
    nowLocal.getUTCMonth(),
    nowLocal.getUTCDate() + offsetDays,
    9, 0, 0
  ));
  return new Date(target.getTime() - TZ_OFFSET * 3600 * 1000).toISOString();
}

// Fire a daily nudge for each active challenge. Category is `challenge_checkin`
// so scheduler.js can render it with the right supportive template.
async function scheduleChallengeCheckinReminder(userId, ucId, challengeType) {
  const freq = challengeType === "hba1c" ? 7 : 3;
  try {
    await addReminderSchedule(userId, {
      category: "challenge_checkin",
      target_id: ucId,
      label: challengeType,
      time_of_day: "09:00",
      frequency_days: freq,
      next_fire_at: nextFire9amLocal(freq === 7 ? 7 : 3),
    });
  } catch (e) { console.error("chal reminder schedule:", e?.message); }
}

// Fire once, 7 days before end_date, asking for the final HbA1c.
async function scheduleHba1cFinalPrompt(userId, ucId, endDate, def) {
  const daysBefore = def?.scoring_config?.final_prompt_days_before || 7;
  const promptDate = addDaysToLocalDate(endDate, -daysBefore);
  const now = todayLocalDate();
  const offsetDays = Math.max(1, daysBetween(now, promptDate));
  try {
    await addReminderSchedule(userId, {
      category: "challenge_final_result_prompt",
      target_id: ucId,
      label: "hba1c_final",
      time_of_day: "10:00",
      frequency_days: 3, // repeat every 3 days until final is submitted
      next_fire_at: nextFire9amLocal(offsetDays),
    });
  } catch (e) { console.error("chal final prompt schedule:", e?.message); }
}

async function notifyDoctorJoinedIfAny(session, uc, def) {
  const docId = session.user?.doctor_id;
  if (!docId || session.user?.doctor_link_status !== "active") return;
  try {
    await enqueueChallengeDoctorNotification({
      doctor_id: docId,
      user_id: session.user.id,
      user_challenge_id: uc.id,
      notification_type: "joined",
      payload: {
        challenge_name: def.name,
        start_date: uc.start_date,
        end_date: uc.end_date,
      },
      scheduled_for: new Date().toISOString(),
    });
    await updateUserChallenge(uc.id, { doctor_notified_start: true });
  } catch (e) { console.error("doctor notify (joined):", e?.message); }
}

async function notifyDoctorCompletedIfAny(session, uc) {
  const docId = uc.doctor_id || session.user?.doctor_id;
  if (!docId) return;
  try {
    const def = uc.challenge_id
      ? await getChallengeDefById(uc.challenge_id).catch(() => null) : null;
    await enqueueChallengeDoctorNotification({
      doctor_id: docId,
      user_id: session.user.id,
      user_challenge_id: uc.id,
      notification_type: "completed",
      payload: {
        challenge_type: uc.challenge_type,
        challenge_name: def?.name || uc.challenge_type,
        outcome_value: uc.outcome_value,
        baseline_value: uc.baseline_value,
        final_value: uc.final_value,
        rank: uc.rank,
        total: uc.total,
        percentile: uc.percentile,
        participation_points: uc.participation_points,
        status: uc.status,
      },
      scheduled_for: new Date().toISOString(),
    });
    await updateUserChallenge(uc.id, { doctor_notified_end: true });
  } catch (e) { console.error("doctor notify (completed):", e?.message); }
}

// -------------------------------------------------------------------
// Leaderboard opt-out (§11)
// -------------------------------------------------------------------
async function toggleLeaderboardVisibility(bot, chatId, session, ucId) {
  const lang = langOf(session);
  const uc = await getUserChallengeById(ucId).catch(() => null);
  if (!uc || uc.user_id !== session.user.id) return showActive(bot, chatId, session);
  const nowOn = uc.leaderboard_opt_in !== false;
  const newVal = !nowOn;
  await updateUserChallenge(uc.id, { leaderboard_opt_in: newVal });
  await send(bot, chatId, t(lang, newVal ? "chal_leaderboard_optin_on" : "chal_leaderboard_optin_off"), {
    markdown: true, keepEmoji: true,
  });
  return showChallengeDetail(bot, chatId, session, ucId);
}

// -------------------------------------------------------------------
// Withdraw challenge (§15 status = withdrawn_by_user)
// -------------------------------------------------------------------
async function askWithdrawConfirm(bot, chatId, session, ucId) {
  const lang = langOf(session);
  const uc = await getUserChallengeById(ucId).catch(() => null);
  if (!uc || uc.user_id !== session.user.id) return showActive(bot, chatId, session);
  const def = uc.challenge_id ? await getChallengeDefById(uc.challenge_id).catch(() => null) : null;
  const name = def?.name || uc.challenge_type;
  return send(bot, chatId, t(lang, "chal_withdraw_confirm_prompt", { name }), {
    keyboard: chalWithdrawConfirmKeyboard(lang, ucId), markdown: true, keepEmoji: true,
  });
}

async function withdrawChallenge(bot, chatId, session, ucId) {
  const lang = langOf(session);
  const uc = await getUserChallengeById(ucId).catch(() => null);
  if (!uc || uc.user_id !== session.user.id) return showActive(bot, chatId, session);
  const def = uc.challenge_id ? await getChallengeDefById(uc.challenge_id).catch(() => null) : null;
  await updateUserChallenge(uc.id, {
    status: "withdrawn_by_user",
    withdrawn_at: new Date().toISOString(),
  });
  // Recompute cohort ranks so the withdrawing user drops out cleanly.
  if (uc.challenge_id) {
    await computeAndPersistScores(uc.challenge_id, uc.user_id).catch(() => {});
  }
  await send(bot, chatId, t(lang, "chal_withdraw_done", { name: def?.name || uc.challenge_type }), {
    keyboard: chalBackKeyboard(lang), markdown: true, keepEmoji: true,
  });
}

// -------------------------------------------------------------------
// Callback dispatcher (handles `chal:*` from bot.js)
// -------------------------------------------------------------------
export async function chalCallback(bot, chatId, session, data) {
  const parts = data.slice(5).split(":"); // strip "chal:"
  const action = parts[0];

  if (action === "menu" || !action) return showChallenges(bot, chatId, session);
  if (action === "active")   return showActive(bot, chatId, session);
  if (action === "browse")   return showBrowse(bot, chatId, session);
  if (action === "history")  return showHistory(bot, chatId, session);
  if (action === "rankings") return showRankings(bot, chatId, session);
  if (action === "rank")     return showRankings(bot, chatId, session, parts[1]);
  if (action === "def")      return showChallengeIntro(bot, chatId, session, parts[1]);
  if (action === "how")      return showHowItWorks(bot, chatId, session, parts[1]);
  if (action === "join")     return startJoin(bot, chatId, session, parts[1]);
  if (action === "view")     return showChallengeDetail(bot, chatId, session, parts[1]);
  if (action === "toggle_leaderboard") return toggleLeaderboardVisibility(bot, chatId, session, parts[1]);
  if (action === "withdraw") return askWithdrawConfirm(bot, chatId, session, parts[1]);
  if (action === "withdraw_confirm") return withdrawChallenge(bot, chatId, session, parts[1]);

  // HbA1c baseline dialog buttons.
  if (action === "hba1c_reuse_yes") return acceptHba1cReuse(bot, chatId, session);
  if (action === "hba1c_reuse_no")  return promptHba1cBaseline(bot, chatId, session);
  if (action === "hba1c_upload_hint" || action === "hba1c_enter_hint") {
    return send(bot, chatId, `${t(langOf(session), "chal_hba1c_collect_title")}\n\n${t(langOf(session), "chal_hba1c_collect_body")}`, {
      keyboard: chalHba1cCollectKeyboard(langOf(session)), markdown: true, keepEmoji: true, keepEmoji: true,
    });
  }

  // HbA1c final-result dialog buttons.
  if (action === "hba1c_final_upload_hint" || action === "hba1c_final_enter_hint") {
    return send(bot, chatId, `${t(langOf(session), "chal_hba1c_final_prompt_title")}\n\n${t(langOf(session), "chal_hba1c_final_prompt_body")}`, {
      keyboard: chalHba1cFinalKeyboard(langOf(session)), markdown: true, keepEmoji: true, keepEmoji: true,
    });
  }
  if (action === "hba1c_final_later") {
    resetFlow(chatId);
    return showChallenges(bot, chatId, session);
  }
  if (action === "hba1c_final") {
    // `chal:hba1c_final:<ucId>` fired from a scheduler-delivered prompt.
    return startHba1cFinal(bot, chatId, session, parts[1]);
  }

  return showChallenges(bot, chatId, session);
}
