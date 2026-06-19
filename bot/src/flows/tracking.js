import { t } from "../i18n.js";
import { send, sanitizeMd, langOf } from "../utils.js";
import {
  backKeyboard,
  medFrequencyKeyboard,
  reminderOfferKeyboard,
  activityDaysKeyboard,
} from "../keyboards.js";
import {
  addGlucose,
  addMedication,
  addHealthLog,
  addSymptomLog,
  addMedicationMaster,
  findMedicationByName,
  addReminderSchedule,
  registerActivity,
  updateUser,
} from "../supabase.js";
import { applyScores, glucoseInRange } from "../scores.js";
import { refreshKB } from "../kb.js";

// ---------------- Glucose (unchanged behavior) ----------------

export async function startGlucose(bot, chatId, session) {
  session.state = "glucose";
  await send(bot, chatId, t(langOf(session), "glucose_prompt"), {
    keyboard: backKeyboard(langOf(session)),
    markdown: true,
  });
}

const CONTEXT_WORDS = {
  fasting: "fasting",
  pre: "pre_meal",
  "pre-meal": "pre_meal",
  "pre meal": "pre_meal",
  before: "pre_meal",
  post: "post_meal",
  "post-meal": "post_meal",
  "post meal": "post_meal",
  after: "post_meal",
  bed: "bedtime",
  bedtime: "bedtime",
  night: "bedtime",
  random: "random",
};

function parseGlucose(text) {
  const m = String(text).match(/(\d{2,3})(\.\d+)?/);
  if (!m) return null;
  const value = parseFloat(m[1]);
  let context = "random";
  const lower = text.toLowerCase();
  for (const [word, ctx] of Object.entries(CONTEXT_WORDS)) {
    if (lower.includes(word)) {
      context = ctx;
      break;
    }
  }
  return { value, context };
}

function glucoseFeedback(lang, value, context) {
  if (value < 70) return t(lang, "glucose_low");
  if (value > 300) return t(lang, "glucose_vhigh");
  const highThreshold = context === "fasting" ? 130 : 180;
  if (value > highThreshold) return t(lang, "glucose_high");
  return t(lang, "glucose_normal");
}

export async function glucoseText(bot, chatId, session, text) {
  const lang = langOf(session);
  const parsed = parseGlucose(text);
  if (!parsed) return send(bot, chatId, t(lang, "invalid_number"));

  await addGlucose(session.user.id, parsed.value, parsed.context);
  session.user = await registerActivity(session.user);
  session.user = await applyScores(
    session.user,
    "log_glucose",
    glucoseInRange(parsed.value, parsed.context) ? "in_range" : "out_range"
  );
  await refreshKB(session.user);

  const feedback = glucoseFeedback(lang, parsed.value, parsed.context);
  await send(
    bot,
    chatId,
    t(lang, "glucose_saved", {
      value: parsed.value,
      context: parsed.context,
      feedback,
      streak: session.user.streak,
    }),
    { keyboard: backKeyboard(lang), markdown: true }
  );
}

// ---------------- Medication (full conversational flow) ----------------
//
// Per the Build 1 spec the medication entry should:
//   - parse name + dose
//   - check if the user already has this medication
//   - if new, ask frequency, then offer a reminder
//   - if existing, just log the intake against the dose journal
//
// Session shape during the flow:
//   session.state = "medication"
//   session.step  = "ask_name" | "ask_freq" | "ask_other_freq" | "offer_reminder" | "ask_time"
//   session.data  = { name, dose, frequency, master_med_id, reminder_enabled }

export async function startMedication(bot, chatId, session) {
  session.state = "medication";
  session.step = "ask_name";
  session.data = {};
  await send(bot, chatId, t(langOf(session), "med_ask_name"), {
    keyboard: backKeyboard(langOf(session)),
    markdown: true,
  });
}

function parseMedNameDose(val) {
  const cleaned = val.trim().slice(0, 200);
  const doseMatch = cleaned.match(/(\d+(?:[\.\/]\d+)?\s?(?:mg|ml|units|iu|g)\b.*)$/i);
  const dose = doseMatch ? doseMatch[1].trim() : null;
  const name = dose ? cleaned.replace(dose, "").trim() : cleaned;
  return { name: name || cleaned, dose };
}

export async function medicationText(bot, chatId, session, text) {
  const lang = langOf(session);
  const val = (text || "").trim();
  if (!val) return send(bot, chatId, t(lang, "med_ask_name"), { markdown: true });

  // Step: collect name + dose
  if (session.step === "ask_name") {
    const { name, dose } = parseMedNameDose(val);
    // Always log the dose taken — that's the core journal entry.
    await addMedication(session.user.id, name, dose);
    session.user = await registerActivity(session.user);
    session.user = await applyScores(session.user, "log_med");
    await refreshKB(session.user);

    // Is this medication already in their list?
    const existing = await findMedicationByName(session.user.id, name).catch(() => null);
    if (existing) {
      session.state = "idle";
      session.step = null;
      return send(
        bot,
        chatId,
        t(lang, "med_existing_logged", { name: sanitizeMd(name), streak: session.user.streak }),
        { keyboard: backKeyboard(lang), markdown: true }
      );
    }

    // New medication — start the master-add conversational branch.
    session.data = { name, dose };
    session.step = "ask_freq";
    return send(bot, chatId, t(lang, "med_ask_frequency", { name: sanitizeMd(name) }), {
      keyboard: medFrequencyKeyboard(lang),
      markdown: true,
    });
  }

  if (session.step === "ask_other_freq") {
    session.data.frequency = val.slice(0, 60);
    session.step = "offer_reminder";
    return send(bot, chatId, t(lang, "med_offer_reminder", { name: sanitizeMd(session.data.name) }), {
      keyboard: reminderOfferKeyboard(lang, "med"),
      markdown: true,
    });
  }

  if (session.step === "ask_time") {
    if (/^skip$/i.test(val)) {
      await saveMedMaster(session, false);
      session.state = "idle";
      session.step = null;
      return send(bot, chatId, t(lang, "med_added_no_reminder", { name: sanitizeMd(session.data.name) }), {
        keyboard: backKeyboard(lang),
        markdown: true,
      });
    }
    const time = normalizeTimeOfDay(val);
    if (!time) {
      return send(bot, chatId, t(lang, "med_reminder_pick_time"), { markdown: true });
    }
    const master = await saveMedMaster(session, true);
    await addReminderSchedule(session.user.id, {
      category: "medication",
      target_id: master?.id || null,
      label: session.data.name,
      time_of_day: time,
      frequency_days: 1,
      next_fire_at: nextFireAtFor(time, 1),
    });
    session.state = "idle";
    session.step = null;
    return send(bot, chatId, t(lang, "med_added_with_reminder", { name: sanitizeMd(session.data.name), time }), {
      keyboard: backKeyboard(lang),
      markdown: true,
    });
  }

  // Steps that need a button — gently nudge.
  if (session.step === "ask_freq" || session.step === "offer_reminder") {
    return send(bot, chatId, t(lang, "med_ask_frequency", { name: sanitizeMd(session.data.name || "—") }), {
      keyboard: medFrequencyKeyboard(lang),
      markdown: true,
    });
  }

  return startMedication(bot, chatId, session);
}

export async function medicationCallback(bot, chatId, session, data) {
  const lang = langOf(session);

  if (data.startsWith("medfreq:")) {
    const value = data.split(":")[1];
    session.data = session.data || {};
    if (value === "other") {
      session.step = "ask_other_freq";
      return send(bot, chatId, t(lang, "med_other_freq"), { markdown: true });
    }
    session.data.frequency = value;
    session.step = "offer_reminder";
    return send(bot, chatId, t(lang, "med_offer_reminder", { name: sanitizeMd(session.data.name || "—") }), {
      keyboard: reminderOfferKeyboard(lang, "med"),
      markdown: true,
    });
  }

  if (data.startsWith("remoffer:")) {
    const [, key, ans] = data.split(":");
    if (key !== "med") return; // dispatched from another flow
    if (ans === "no") {
      await saveMedMaster(session, false);
      session.state = "idle";
      session.step = null;
      return send(bot, chatId, t(lang, "med_added_no_reminder", { name: sanitizeMd(session.data.name || "—") }), {
        keyboard: backKeyboard(lang),
        markdown: true,
      });
    }
    session.step = "ask_time";
    return send(bot, chatId, t(lang, "med_reminder_pick_time"), { markdown: true });
  }
}

async function saveMedMaster(session, reminderEnabled) {
  return addMedicationMaster(
    session.user.id,
    session.data.name,
    session.data.dose || null,
    session.data.frequency || null,
    !!reminderEnabled
  );
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

// Build a UTC timestamp for the next firing of a reminder at the user's
// local time-of-day, with PKT (UTC+5) as the default offset. Same simple
// model the scheduler.js already uses.
function nextFireAtFor(timeOfDay, frequencyDays = 1) {
  const TZ_OFFSET = parseInt(process.env.REMINDER_TZ_OFFSET || "5", 10);
  const [h, m] = timeOfDay.split(":").map(Number);
  const now = new Date();
  // shift to user-local
  const local = new Date(now.getTime() + TZ_OFFSET * 3600 * 1000);
  local.setUTCHours(h, m, 0, 0);
  // if that time is already past today, advance one period
  const nowLocal = new Date(now.getTime() + TZ_OFFSET * 3600 * 1000);
  if (local <= nowLocal) local.setUTCDate(local.getUTCDate() + frequencyDays);
  // shift back to UTC for storage
  return new Date(local.getTime() - TZ_OFFSET * 3600 * 1000).toISOString();
}

// ---------------- Weight ----------------

export async function startWeight(bot, chatId, session) {
  session.state = "weight";
  session.step = "ask_value";
  session.data = {};
  await send(bot, chatId, t(langOf(session), "weight_prompt"), {
    keyboard: backKeyboard(langOf(session)),
    markdown: true,
  });
}

export async function weightText(bot, chatId, session, text) {
  const lang = langOf(session);
  const val = (text || "").trim();
  const m = val.match(/(\d+(?:\.\d+)?)/);
  if (!m) return send(bot, chatId, t(lang, "invalid_number"));
  const weight = parseFloat(m[1]);
  if (weight < 20 || weight > 400) return send(bot, chatId, t(lang, "invalid_number"));

  await addHealthLog(session.user.id, { weight_kg: weight });
  session.user = await registerActivity(session.user);
  session.user = await applyScores(session.user, "checkin");
  await refreshKB(session.user);

  await send(bot, chatId, t(lang, "weight_saved", { value: weight, streak: session.user.streak }), {
    markdown: true,
  });
  session.step = "offer_reminder";
  await send(bot, chatId, t(lang, "weight_offer_monthly"), {
    keyboard: reminderOfferKeyboard(lang, "weight"),
    markdown: true,
  });
}

export async function weightCallback(bot, chatId, session, data) {
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
    await send(bot, chatId, t(lang, "bs_reminder_skipped"), { keyboard: backKeyboard(lang), markdown: true });
  }
  session.state = "idle";
  session.step = null;
}

// ---------------- Physical Activity ----------------

export async function startActivity(bot, chatId, session) {
  session.state = "activity";
  session.step = "ask_value";
  session.data = {};
  await send(bot, chatId, t(langOf(session), "activity_prompt"), {
    keyboard: backKeyboard(langOf(session)),
    markdown: true,
  });
}

function parseActivity(text) {
  const lower = String(text || "").toLowerCase();
  const stepsM = lower.match(/(\d+)\s*steps?/);
  const minsM = lower.match(/(\d+)\s*(?:minute|min)/);
  if (stepsM) return { steps: parseInt(stepsM[1], 10) };
  if (minsM) return { note: `${minsM[1]} minutes activity` };
  return { note: text.slice(0, 200) };
}

export async function activityText(bot, chatId, session, text) {
  const lang = langOf(session);
  const fields = parseActivity(text);
  await addHealthLog(session.user.id, fields);
  session.user = await registerActivity(session.user);
  session.user = await applyScores(session.user, "checkin");
  await refreshKB(session.user);

  await send(bot, chatId, t(lang, "activity_saved", { streak: session.user.streak }), {
    markdown: true,
  });

  // First-time activity log → ask for a weekly goal. We store the goal on the
  // user row so we can use it in summaries and future coaching.
  if (!session.user.weekly_activity_goal_days) {
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

// ---------------- Symptoms ----------------

export async function startSymptoms(bot, chatId, session) {
  session.state = "symptoms";
  await send(bot, chatId, t(langOf(session), "symptoms_prompt"), {
    keyboard: backKeyboard(langOf(session)),
    markdown: true,
  });
}

export async function symptomsText(bot, chatId, session, text) {
  const lang = langOf(session);
  const val = (text || "").trim().slice(0, 800);
  if (!val) return send(bot, chatId, t(lang, "symptoms_prompt"), { markdown: true });
  await addSymptomLog(session.user.id, val);
  session.user = await registerActivity(session.user);
  session.user = await applyScores(session.user, "checkin");
  await refreshKB(session.user);
  await send(
    bot,
    chatId,
    `${t(lang, "symptoms_saved")}\n\n${t(lang, "symptoms_coach_intro")}\n\n${t(lang, "disclaimer")}`,
    { keyboard: backKeyboard(lang), markdown: true }
  );
  session.state = "idle";
}

// ---------------- Daily health check-in (legacy combined entry) ----------------

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
