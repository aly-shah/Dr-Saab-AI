import { t, LANGUAGES } from "./i18n.js";
import { send, sanitizeMd, langOf } from "./utils.js";
import {
  mainMenuKeyboard,
  mainMenuKeyboardV2,
  checkInKeyboard,
  foodHelpKeyboard,
  myProgressKeyboard,
  moreKeyboard,
  profileKeyboard,
  languageKeyboard,
  backKeyboard,
} from "./keyboards.js";
import { getSession, resetFlow, clearSession } from "./session.js";
import { getOrCreateUser, updateUser, recordMessage, deleteUser } from "./supabase.js";
import { TIERS, normalizeTier } from "./tiers.js";

import { startOnboarding, onboardingText, onboardingCallback } from "./flows/onboarding.js";
import { detectGreetingScenario } from "./welcome.js";
import {
  startGlucose,
  glucoseText,
  startMedication,
  medicationText,
  medicationCallback,
  startWeight,
  weightText,
  weightCallback,
  startActivity,
  activityText,
  activityCallback,
  startSymptoms,
  symptomsText,
  startHealth,
  healthText,
} from "./flows/tracking.js";
import { startCoach, coachText } from "./flows/coach.js";
import { startLab, labText } from "./flows/labreport.js";
import { showProgress, showSummary, showRecentActivity } from "./flows/progress.js";
import { showEducation } from "./flows/education.js";
import { showGoals, startGoalSet, goalsText } from "./flows/goals.js";
import {
  showChallenges,
  showMyChallenges,
  startChallengeJoin,
  challengeCodeText,
} from "./flows/challenges.js";
import { showReports, showWeeklyReport, showMonthlyReport, showDoctorReport } from "./flows/reports.js";
import { showExecutive, requestService } from "./flows/executive.js";
import { profileqText, skipProfileQuestion } from "./flows/profileBuilder.js";
import { showReminders, cancelReminder } from "./flows/reminders.js";

// Display name for a tier slug (handles legacy slugs).
function planName(lang, tier) {
  const key = TIERS[normalizeTier(tier)]?.nameKey || "plan_free";
  return t(lang, key);
}

async function showMenu(bot, chatId, session) {
  resetFlow(chatId);
  const lang = langOf(session);
  await send(bot, chatId, t(lang, "menu_v2_title"), { keyboard: mainMenuKeyboardV2(lang), markdown: true });
}

async function startCommand(bot, chatId, session, scenario = "eng") {
  if (!session.user.onboarded) return startOnboarding(bot, chatId, session, scenario);
  const lang = langOf(session);
  await send(bot, chatId, t(lang, "welcome_back", { name: sanitizeMd(session.user.name || "") }), {
    markdown: true,
  });
  await send(bot, chatId, t(lang, "menu_v2_title"), { keyboard: mainMenuKeyboardV2(lang), markdown: true });
}

// Submenu show functions — each lands on its own keyboard, two-level cap.
function showCheckIn(bot, chatId, session) {
  const lang = langOf(session);
  return send(bot, chatId, t(lang, "checkin_title"), { keyboard: checkInKeyboard(lang), markdown: true });
}
function showFoodHelp(bot, chatId, session) {
  const lang = langOf(session);
  return send(bot, chatId, t(lang, "foodhelp_title"), { keyboard: foodHelpKeyboard(lang), markdown: true });
}
function showMyProgress(bot, chatId, session) {
  const lang = langOf(session);
  return send(bot, chatId, t(lang, "progress_menu_title"), { keyboard: myProgressKeyboard(lang), markdown: true });
}
function showMore(bot, chatId, session) {
  const lang = langOf(session);
  return send(bot, chatId, t(lang, "more_title"), { keyboard: moreKeyboard(lang), markdown: true });
}
function showPlan(bot, chatId, session) {
  const lang = langOf(session);
  return send(bot, chatId, t(lang, "plan_title") + "\n\n" + t(lang, "plan_body", { plan: planName(lang, session.user.tier) }), {
    keyboard: backKeyboard(lang),
    markdown: true,
  });
}
function showSupport(bot, chatId, session) {
  const lang = langOf(session);
  return send(bot, chatId, t(lang, "support_title") + "\n\n" + t(lang, "support_body"), {
    keyboard: backKeyboard(lang),
    markdown: true,
  });
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
    tier: planName(lang, u.tier),
    language: langLabel,
  });
  return send(bot, chatId, text, { keyboard: profileKeyboard(lang), markdown: true });
}

function showSubscription(bot, chatId, session) {
  const lang = langOf(session);
  return send(bot, chatId, t(lang, "upgrade_intro", { plan: planName(lang, session.user.tier) }), {
    keyboard: backKeyboard(lang),
    markdown: true,
  });
}

async function dispatchFeature(bot, chatId, session, action) {
  switch (action) {
    // ---- Build 1 top-level actions ----
    case "checkin":
      return showCheckIn(bot, chatId, session);
    case "foodhelp":
      return showFoodHelp(bot, chatId, session);
    case "myprogress":
      return showMyProgress(bot, chatId, session);
    case "more":
      return showMore(bot, chatId, session);
    case "askdrsaab":
      // Ask DrSaab is the open AI conversation — reuses the existing coach.
      return startCoach(bot, chatId, session, "coach");
    // ---- legacy actions kept so deep links / old buttons keep working ----
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
    case "goals":
      return showGoals(bot, chatId, session);
    case "challenges":
      return showChallenges(bot, chatId, session);
    case "reports":
      return showReports(bot, chatId, session);
    case "executive":
      return showExecutive(bot, chatId, session);
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

  // Hard reset: typing DELETE (exact, all caps) wipes this user's profile and
  // ALL their data + chat history, then drops the session. Lets a demo be
  // replayed from scratch as a brand-new user. Checked before recordMessage so
  // we don't re-create a patient_kb row against the row we're about to delete.
  if (msg.text?.trim() === "DELETE") {
    await deleteUser(session.user.id).catch((e) => console.error("deleteUser error:", e));
    clearSession(chatId);
    return send(
      bot,
      chatId,
      "Your profile and chat history have been deleted. Send any message (or /start) to begin again as a new user."
    );
  }

  // count activity for the patient KB (cheap upsert, no AI)
  recordMessage(session.user.id).catch(() => {});

  const text = msg.text;
  const cmd = text?.split(/\s+/)[0]?.split("@")[0];

  // Greeting words ("hi", "salaam", "السلام علیکم", …) from a not-onboarded
  // user trigger the matching welcome scenario. Already-onboarded users get
  // the normal welcome-back menu and don't see the welcome banner again.
  const greeting = session.user.onboarded ? null : detectGreetingScenario(text);

  if (cmd === "/start") return startCommand(bot, chatId, session, "eng");
  if (cmd === "/menu") {
    return session.user.onboarded ? showMenu(bot, chatId, session) : startOnboarding(bot, chatId, session, "eng");
  }
  if (cmd === "/cancel") {
    if (!session.user.onboarded) return startOnboarding(bot, chatId, session, "eng");
    await send(bot, chatId, t(langOf(session), "cancelled"));
    return showMenu(bot, chatId, session);
  }

  // Common commands (proposal §3.1) — slash always; plain words only when the
  // user is NOT mid-flow, so "help"/"menu" inside a coach chat stay as content.
  const word = (text || "").trim().toLowerCase();
  const inFlow = [
    "onboarding", "glucose", "medication", "health",
    "coach", "food", "fitness", "lab", "goals", "challenge_code", "profileq",
    "weight", "activity", "symptoms",
  ].includes(session.state);
  if (session.user.onboarded) {
    if (cmd === "/home" || (!inFlow && (word === "home" || word === "menu"))) {
      return showMenu(bot, chatId, session);
    }
    if (cmd === "/help" || (!inFlow && word === "help")) {
      return send(bot, chatId, t(langOf(session), "help_text"), {
        keyboard: mainMenuKeyboard(langOf(session)),
        markdown: true,
      });
    }
    if (cmd === "/upgrade" || (!inFlow && word === "upgrade")) {
      return showSubscription(bot, chatId, session);
    }
  }

  // Not onboarded yet → (re)start onboarding for any input.
  // A greeting word picks the matching welcome scenario; any other text
  // falls back to the English welcome banner.
  if (!session.user.onboarded && session.state !== "onboarding") {
    return startOnboarding(bot, chatId, session, greeting || "eng");
  }

  // Already in onboarding but the user typed a greeting — restart the banner
  // in the matching scenario (covers cases where they tap "back" or want to
  // change language before completing).
  if (greeting && session.state === "onboarding" && session.step === "welcome") {
    return startOnboarding(bot, chatId, session, greeting);
  }

  switch (session.state) {
    case "onboarding":
      return onboardingText(bot, chatId, session, text);
    case "glucose":
      return glucoseText(bot, chatId, session, text);
    case "medication":
      return medicationText(bot, chatId, session, text);
    case "weight":
      return weightText(bot, chatId, session, text);
    case "activity":
      return activityText(bot, chatId, session, text);
    case "symptoms":
      return symptomsText(bot, chatId, session, text);
    case "health":
      return healthText(bot, chatId, session, text);
    case "coach":
    case "food":
    case "fitness":
      return coachText(bot, chatId, session, text, msg);
    case "lab":
      return labText(bot, chatId, session, text, msg);
    case "goals":
      return goalsText(bot, chatId, session, text);
    case "challenge_code":
      return challengeCodeText(bot, chatId, session, text);
    case "profileq":
      return profileqText(bot, chatId, session, text);
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

  // Goals
  if (data === "goal:set") return startGoalSet(bot, chatId, session);

  // Challenges (feature prefix `chl:` — distinct from onboarding `ch:`)
  if (data.startsWith("chl:")) {
    const x = data.split(":")[1];
    if (x === "mine") return showMyChallenges(bot, chatId, session);
    return startChallengeJoin(bot, chatId, session, x);
  }

  // Reports
  if (data.startsWith("rep:")) {
    const x = data.split(":")[1];
    if (x === "weekly") return showWeeklyReport(bot, chatId, session);
    if (x === "monthly") return showMonthlyReport(bot, chatId, session);
    if (x === "doctor") return showDoctorReport(bot, chatId, session);
  }

  // Executive services
  if (data.startsWith("ex:")) return requestService(bot, chatId, session, data.split(":")[1]);

  // Background profile drip — Skip
  if (data === "pq:skip") return skipProfileQuestion(bot, chatId, session);

  // ===== Build 1 submenu routing =====
  // Check In submenu
  if (data.startsWith("ci:")) {
    const x = data.split(":")[1];
    if (x === "bsugar") return startGlucose(bot, chatId, session);
    if (x === "med") return startMedication(bot, chatId, session);
    if (x === "weight") return startWeight(bot, chatId, session);
    if (x === "activity") return startActivity(bot, chatId, session);
    if (x === "symptoms") return startSymptoms(bot, chatId, session);
  }

  // Food Help submenu — all four route into the Food coach with a seed prompt.
  // The seed only fires if startCoach actually entered the food state (i.e.
  // the user wasn't bounced to the upgrade gate).
  if (data.startsWith("fh:")) {
    const x = data.split(":")[1];
    const seedKey = {
      analyze: "foodhelp_analyze_prompt",
      caneat: "foodhelp_caneat_prompt",
      restaurant: "foodhelp_restaurant_prompt",
      snacks: "foodhelp_snacks_prompt",
    }[x];
    await startCoach(bot, chatId, session, "food");
    if (seedKey && session.state === "food") {
      await send(bot, chatId, t(langOf(session), seedKey), { markdown: true });
    }
    return;
  }

  // My Progress submenu
  if (data.startsWith("mp:")) {
    const x = data.split(":")[1];
    if (x === "weekly") return showSummary(bot, chatId, session);
    if (x === "monthly") return showMonthlyReport(bot, chatId, session);
    if (x === "trends") return showProgress(bot, chatId, session);
    if (x === "recent") return showRecentActivity(bot, chatId, session);
  }

  // More submenu
  if (data.startsWith("mo:")) {
    const x = data.split(":")[1];
    if (x === "reminders") return showReminders(bot, chatId, session);
    if (x === "language")
      return send(bot, chatId, t("en", "choose_language"), { keyboard: languageKeyboard(), markdown: true });
    if (x === "plan") return showPlan(bot, chatId, session);
    if (x === "subscription") return showSubscription(bot, chatId, session);
    if (x === "support") return showSupport(bot, chatId, session);
    if (x === "goals") return showGoals(bot, chatId, session);
    if (x === "challenges") return showChallenges(bot, chatId, session);
    if (x === "executive") return showExecutive(bot, chatId, session);
  }

  // Medication frequency picker — only fires inside the medication flow.
  if (data.startsWith("medfreq:")) {
    return medicationCallback(bot, chatId, session, data);
  }

  // Reminder offer (Y/N). The embedded key tells us which flow asked.
  if (data.startsWith("remoffer:")) {
    const key = data.split(":")[1];
    if (key === "med" || key === "glucose") return medicationCallback(bot, chatId, session, data);
    if (key === "weight") return weightCallback(bot, chatId, session, data);
    return;
  }

  // Activity goal picker — only fires inside the activity flow.
  if (data.startsWith("actgoal:")) {
    return activityCallback(bot, chatId, session, data);
  }

  // Cancel a reminder from the More → Reminders list
  if (data.startsWith("remcancel:")) {
    return cancelReminder(bot, chatId, session, data.split(":")[1]);
  }

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
