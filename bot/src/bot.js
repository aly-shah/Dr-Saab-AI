import { t, LANGUAGES } from "./i18n.js";
import { send, sanitizeMd, langOf } from "./utils.js";
import { mainMenuKeyboard, profileKeyboard, languageKeyboard, backKeyboard } from "./keyboards.js";
import { getSession, resetFlow } from "./session.js";
import { getOrCreateUser, updateUser, recordMessage } from "./supabase.js";

import { startOnboarding, onboardingText, onboardingCallback } from "./flows/onboarding.js";
import {
  startGlucose,
  glucoseText,
  startMedication,
  medicationText,
  startHealth,
  healthText,
} from "./flows/tracking.js";
import { startCoach, coachText } from "./flows/coach.js";
import { startLab, labText } from "./flows/labreport.js";
import { showProgress, showSummary } from "./flows/progress.js";
import { showEducation } from "./flows/education.js";

async function showMenu(bot, chatId, session) {
  resetFlow(chatId);
  const lang = langOf(session);
  await send(bot, chatId, t(lang, "menu_title"), { keyboard: mainMenuKeyboard(lang), markdown: true });
}

async function startCommand(bot, chatId, session) {
  if (!session.user.onboarded) return startOnboarding(bot, chatId, session);
  const lang = langOf(session);
  await send(bot, chatId, t(lang, "welcome_back", { name: sanitizeMd(session.user.name || "") }), {
    markdown: true,
  });
  await send(bot, chatId, t(lang, "menu_title"), { keyboard: mainMenuKeyboard(lang), markdown: true });
}

function showProfile(bot, chatId, session) {
  const u = session.user;
  const lang = langOf(session);
  const langLabel = LANGUAGES.find((l) => l.code === u.language)?.label || u.language;
  const text = t(lang, "profile_title", {
    name: sanitizeMd(u.name || "—"),
    age: u.age || "—",
    gender: u.gender || "—",
    city: sanitizeMd(u.city || "—"),
    diabetes: u.diabetes_status || "—",
    goals: sanitizeMd(u.goals || "—"),
    tier: u.tier,
    language: langLabel,
  });
  return send(bot, chatId, text, { keyboard: profileKeyboard(lang), markdown: true });
}

function showSubscription(bot, chatId, session) {
  const lang = langOf(session);
  return send(bot, chatId, t(lang, "subscription_info", { tier: session.user.tier }), {
    keyboard: backKeyboard(lang),
    markdown: true,
  });
}

async function dispatchFeature(bot, chatId, session, action) {
  switch (action) {
    case "glucose":
      return startGlucose(bot, chatId, session);
    case "medication":
      return startMedication(bot, chatId, session);
    case "health":
      return startHealth(bot, chatId, session);
    case "coach":
      return startCoach(bot, chatId, session, "coach");
    case "food":
      return startCoach(bot, chatId, session, "food");
    case "fitness":
      return startCoach(bot, chatId, session, "fitness");
    case "lab":
      return startLab(bot, chatId, session);
    case "progress":
      return showProgress(bot, chatId, session);
    case "summary":
      return showSummary(bot, chatId, session);
    case "learn":
      return showEducation(bot, chatId, session);
    case "profile":
      return showProfile(bot, chatId, session);
    case "subscription":
      return showSubscription(bot, chatId, session);
    case "language":
      return send(bot, chatId, t("en", "choose_language"), { keyboard: languageKeyboard(), markdown: true });
    default:
      return showMenu(bot, chatId, session);
  }
}

export async function handleMessage(bot, msg) {
  if (!msg.chat) return;
  const chatId = msg.chat.id;
  const session = getSession(chatId);
  if (!session.user) session.user = await getOrCreateUser(msg.from?.id ?? chatId, msg.__source || "telegram");

  // count activity for the patient KB (cheap upsert, no AI)
  recordMessage(session.user.id).catch(() => {});

  const text = msg.text;
  const cmd = text?.split(/\s+/)[0]?.split("@")[0];

  if (cmd === "/start") return startCommand(bot, chatId, session);
  if (cmd === "/menu") {
    return session.user.onboarded ? showMenu(bot, chatId, session) : startOnboarding(bot, chatId, session);
  }
  if (cmd === "/cancel") {
    if (!session.user.onboarded) return startOnboarding(bot, chatId, session);
    await send(bot, chatId, t(langOf(session), "cancelled"));
    return showMenu(bot, chatId, session);
  }

  // Not onboarded yet → (re)start onboarding for any input.
  if (!session.user.onboarded && session.state !== "onboarding") {
    return startOnboarding(bot, chatId, session);
  }

  switch (session.state) {
    case "onboarding":
      return onboardingText(bot, chatId, session, text);
    case "glucose":
      return glucoseText(bot, chatId, session, text);
    case "medication":
      return medicationText(bot, chatId, session, text);
    case "health":
      return healthText(bot, chatId, session, text);
    case "coach":
    case "food":
    case "fitness":
      return coachText(bot, chatId, session, text, msg);
    case "lab":
      return labText(bot, chatId, session, text, msg);
    default:
      return showMenu(bot, chatId, session);
  }
}

export async function handleCallback(bot, query) {
  const chatId = query.message?.chat?.id;
  if (!chatId) return;
  const session = getSession(chatId);
  if (!session.user) session.user = await getOrCreateUser(query.from.id, query.__source || "telegram");
  const data = query.data || "";
  bot.answerCallbackQuery(query.id).catch(() => {});

  // Onboarding choice buttons (language/gender/diabetes/skip)
  if (session.state === "onboarding") {
    return onboardingCallback(bot, chatId, session, data);
  }

  // Language change from Profile
  if (data.startsWith("lang:")) {
    const code = data.split(":")[1];
    session.user = await updateUser(session.user.id, { language: code });
    return showMenu(bot, chatId, session);
  }

  if (data === "menu") return showMenu(bot, chatId, session);
  if (data.startsWith("feat:")) return dispatchFeature(bot, chatId, session, data.split(":")[1]);
}

export function registerHandlers(bot) {
  bot.on("message", (msg) => {
    handleMessage(bot, msg).catch((e) => {
      console.error("message handler error:", e);
      const chatId = msg.chat?.id;
      const lang = chatId ? langOf(getSession(chatId)) : "en";
      if (chatId) send(bot, chatId, t(lang, "error_generic"));
    });
  });

  bot.on("callback_query", (query) => {
    handleCallback(bot, query).catch((e) => console.error("callback handler error:", e));
  });
}
