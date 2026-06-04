import { t } from "../i18n.js";
import { send, sanitizeMd, langOf } from "../utils.js";
import {
  languageKeyboard,
  genderKeyboard,
  diabetesKeyboard,
  skipKeyboard,
  mainMenuKeyboard,
} from "../keyboards.js";
import { updateUser } from "../supabase.js";
import { resetFlow } from "../session.js";

// Ordered steps. 'choice' steps are answered via inline buttons (callbacks),
// 'text' steps via a typed reply, 'optional' steps via text OR a Skip button.
const STEPS = [
  "language",
  "name",
  "age",
  "gender",
  "city",
  "height",
  "weight",
  "diabetes",
  "goals",
  "medications",
  "doctor_code",
  "challenge_code",
  "team_code",
];

function nextStep(current) {
  const i = STEPS.indexOf(current);
  return STEPS[i + 1] || null;
}

export async function startOnboarding(bot, chatId, session) {
  session.state = "onboarding";
  session.step = "language";
  session.data = {};
  await send(bot, chatId, t("en", "choose_language"), {
    keyboard: languageKeyboard(),
    markdown: true,
  });
}

// Send the prompt for the current step.
async function promptStep(bot, chatId, session) {
  const lang = langOf(session);
  switch (session.step) {
    case "name":
      return send(bot, chatId, t(lang, "language_set") + "\n\n" + t(lang, "ask_name"), { markdown: true });
    case "age":
      return send(bot, chatId, t(lang, "ask_age"), { markdown: true });
    case "gender":
      return send(bot, chatId, t(lang, "ask_gender"), { keyboard: genderKeyboard(lang), markdown: true });
    case "city":
      return send(bot, chatId, t(lang, "ask_city"), { markdown: true });
    case "height":
      return send(bot, chatId, t(lang, "ask_height"), { markdown: true });
    case "weight":
      return send(bot, chatId, t(lang, "ask_weight"), { markdown: true });
    case "diabetes":
      return send(bot, chatId, t(lang, "ask_diabetes"), { keyboard: diabetesKeyboard(lang), markdown: true });
    case "goals":
      return send(bot, chatId, t(lang, "ask_goals"), { markdown: true });
    case "medications":
      return send(bot, chatId, t(lang, "ask_meds"), { markdown: true });
    case "doctor_code":
      return send(bot, chatId, t(lang, "ask_doctor_code"), { keyboard: skipKeyboard(lang), markdown: true });
    case "challenge_code":
      return send(bot, chatId, t(lang, "ask_challenge_code"), { keyboard: skipKeyboard(lang), markdown: true });
    case "team_code":
      return send(bot, chatId, t(lang, "ask_team_code"), { keyboard: skipKeyboard(lang), markdown: true });
    default:
      return finish(bot, chatId, session);
  }
}

async function advance(bot, chatId, session) {
  session.step = nextStep(session.step);
  if (!session.step) return finish(bot, chatId, session);
  return promptStep(bot, chatId, session);
}

async function finish(bot, chatId, session) {
  const d = session.data;
  const updated = await updateUser(session.user.id, {
    name: d.name,
    age: d.age ?? null,
    gender: d.gender ?? null,
    city: d.city ?? null,
    language: d.language || "en",
    height_cm: d.height ?? null,
    weight_kg: d.weight ?? null,
    diabetes_status: d.diabetes ?? null,
    goals: d.goals ?? null,
    medications: d.medications ?? null,
    doctor_code: d.doctor_code ?? null,
    challenge_code: d.challenge_code ?? null,
    team_code: d.team_code ?? null,
    onboarded: true,
  });
  session.user = updated;
  const lang = updated.language || "en";
  resetFlow(chatId);
  session.user = updated;
  await send(bot, chatId, t(lang, "onboarding_done", { name: sanitizeMd(updated.name || "") }), {
    markdown: true,
  });
  await send(bot, chatId, t(lang, "menu_title"), { keyboard: mainMenuKeyboard(lang), markdown: true });
}

// Handle typed answers during onboarding.
export async function onboardingText(bot, chatId, session, text) {
  const lang = langOf(session);
  const step = session.step;
  const val = (text || "").trim();

  switch (step) {
    case "name":
      session.data.name = val.slice(0, 60);
      break;
    case "age": {
      const n = parseInt(val, 10);
      if (Number.isNaN(n) || n < 1 || n > 120) return send(bot, chatId, t(lang, "invalid_number"));
      session.data.age = n;
      break;
    }
    case "city":
      session.data.city = val.slice(0, 60);
      break;
    case "height": {
      const n = parseFloat(val);
      if (Number.isNaN(n) || n < 50 || n > 250) return send(bot, chatId, t(lang, "invalid_number"));
      session.data.height = n;
      break;
    }
    case "weight": {
      const n = parseFloat(val);
      if (Number.isNaN(n) || n < 20 || n > 400) return send(bot, chatId, t(lang, "invalid_number"));
      session.data.weight = n;
      break;
    }
    case "goals":
      session.data.goals = val.slice(0, 300);
      break;
    case "medications":
      session.data.medications = val.slice(0, 300);
      break;
    case "doctor_code":
      session.data.doctor_code = val.slice(0, 40);
      break;
    case "challenge_code":
      session.data.challenge_code = val.slice(0, 40);
      break;
    case "team_code":
      session.data.team_code = val.slice(0, 40);
      break;
    // gender / diabetes / language are answered via buttons; nudge the user
    case "gender":
      return send(bot, chatId, t(lang, "ask_gender"), { keyboard: genderKeyboard(lang), markdown: true });
    case "diabetes":
      return send(bot, chatId, t(lang, "ask_diabetes"), { keyboard: diabetesKeyboard(lang), markdown: true });
    case "language":
      return send(bot, chatId, t("en", "choose_language"), { keyboard: languageKeyboard(), markdown: true });
    default:
      return;
  }
  return advance(bot, chatId, session);
}

// Handle inline-button answers during onboarding.
export async function onboardingCallback(bot, chatId, session, data) {
  const [kind, value] = data.split(":");

  if (kind === "lang" && session.step === "language") {
    session.data.language = value;
    return advance(bot, chatId, session);
  }
  if (kind === "gender" && session.step === "gender") {
    session.data.gender = value;
    return advance(bot, chatId, session);
  }
  if (kind === "ds" && session.step === "diabetes") {
    session.data.diabetes = value;
    return advance(bot, chatId, session);
  }
  if (data === "skip" && ["doctor_code", "challenge_code", "team_code"].includes(session.step)) {
    return advance(bot, chatId, session);
  }
}
