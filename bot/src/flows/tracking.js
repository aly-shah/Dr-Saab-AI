import { t } from "../i18n.js";
import { send, sanitizeMd, langOf } from "../utils.js";
import { backKeyboard } from "../keyboards.js";
import { addGlucose, addMedication, addHealthLog, registerActivity } from "../supabase.js";

// ---------------- Glucose ----------------

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

// ---------------- Medication ----------------

export async function startMedication(bot, chatId, session) {
  session.state = "medication";
  await send(bot, chatId, t(langOf(session), "medication_prompt"), {
    keyboard: backKeyboard(langOf(session)),
    markdown: true,
  });
}

export async function medicationText(bot, chatId, session, text) {
  const lang = langOf(session);
  const val = (text || "").trim().slice(0, 120);
  if (!val) return send(bot, chatId, t(lang, "medication_prompt"), { markdown: true });

  // split a trailing dose if present (e.g. "Metformin 500mg")
  const doseMatch = val.match(/(\d+\s?(mg|ml|units|iu|g)\b.*)$/i);
  const dose = doseMatch ? doseMatch[1] : null;
  const name = dose ? val.replace(dose, "").trim() : val;

  await addMedication(session.user.id, name || val, dose);
  session.user = await registerActivity(session.user);

  await send(
    bot,
    chatId,
    t(lang, "medication_saved", { name: sanitizeMd(name || val), streak: session.user.streak }),
    { keyboard: backKeyboard(lang), markdown: true }
  );
}

// ---------------- Daily health check-in ----------------

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
  await send(bot, chatId, t(lang, "health_saved", { streak: session.user.streak }), {
    keyboard: backKeyboard(lang),
    markdown: true,
  });
}
