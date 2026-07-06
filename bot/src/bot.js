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
  subscriptionKeyboard,
} from "./keyboards.js";
import { getSession, resetFlow, clearSession } from "./session.js";
import {
  getOrCreateUser,
  updateUser,
  recordMessage,
  deleteUser,
  setAccountStatus,
} from "./supabase.js";
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
  startWellbeing,
  wellbeingText,
  wellbeingCallback,
  t1ConfidenceCallback,
  glucoseReminderCallback,
  startHealth,
  healthText,
} from "./flows/tracking.js";
import { startCoach, coachText } from "./flows/coach.js";
import { startAskDrsaab, askDrsaabText } from "./flows/askdrsaab.js";
import { startLab, labText, handleUploadLabButton } from "./flows/labreport.js";
import { showProgress, showSummary, showRecentActivity } from "./flows/progress.js";
import { showEducation } from "./flows/education.js";
import { showT1Community, dispatchT1Community } from "./flows/t1community.js";
import {
  showGoals,
  startAddGoal,
  pickGoalSuggestion,
  showGoalDetail,
  completeGoal,
  deleteGoal,
  showEditMenu,
  startEditField,
  handleReviewAction,
  handleSkipAction,
  goalsText,
} from "./flows/goals.js";
import {
  showChallenges,
  showMyChallenges,
  startChallengeJoin,
  challengeCodeText,
} from "./flows/challenges.js";
import { showReports, showWeeklyReport, showMonthlyReport, showDoctorReport } from "./flows/reports.js";
import { showExecutive, requestService } from "./flows/executive.js";
import { profileqText, skipProfileQuestion } from "./flows/profileBuilder.js";
import { showReminders, cancelReminder, toggleReminderPref } from "./flows/reminders.js";
import {
  showAccount,
  startEditProfile,
  showDeactivateConfirm,
  doDeactivate,
  showCloseConfirm,
  doClose,
} from "./flows/account.js";

// Display name for a tier slug (handles legacy slugs).
function planName(lang, tier) {
  const key = TIERS[normalizeTier(tier)]?.nameKey || "plan_free";
  return t(lang, key);
}

async function showMenu(bot, chatId, session) {
  resetFlow(chatId);
  const lang = langOf(session);
  await send(bot, chatId, t(lang, "menu_v2_title"), { keyboard: mainMenuKeyboardV2(lang, session.user), markdown: true });
}

async function startCommand(bot, chatId, session, scenario = "eng") {
  if (!session.user.onboarded) return startOnboarding(bot, chatId, session, scenario);
  const lang = langOf(session);
  await send(bot, chatId, t(lang, "welcome_back", { name: sanitizeMd(session.user.name || "") }), {
    markdown: true,
  });
  await send(bot, chatId, t(lang, "menu_v2_title"), { keyboard: mainMenuKeyboardV2(lang, session.user), markdown: true });
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
  return send(bot, chatId, `${t(lang, "more_title")}\n\n${t(lang, "more_subtitle")}`, {
    keyboard: moreKeyboard(lang),
    markdown: true,
  });
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

// My Subscription — spec 2026-07. Shows current plan + features + renewal.
// Renewal date is derived from `updated_at` (best-effort — the payment
// system will populate a dedicated column when we integrate billing).
function subscriptionFeaturesKey(tier) {
  switch (normalizeTier(tier)) {
    case "executive": return "sub_features_executive";
    case "consistency": return "sub_features_consistency";
    default: return "sub_features_free";
  }
}

function showSubscription(bot, chatId, session) {
  const lang = langOf(session);
  const u = session.user || {};
  const tier = normalizeTier(u.tier);
  const lines = [
    t(lang, "sub_title"),
    "",
    t(lang, "sub_current_plan", { plan: planName(lang, u.tier) }),
    "",
    t(lang, "sub_features_header"),
    t(lang, subscriptionFeaturesKey(tier)),
    "",
    tier === "free" ? t(lang, "sub_no_renewal") : t(lang, "sub_renewal", { date: "—" }),
  ];
  return send(bot, chatId, lines.join("\n"), {
    keyboard: subscriptionKeyboard(lang, u),
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
      // Ask DrSaab is the open AI conversation — free-tier ready, paid users
      // get the OpenAI-backed model and deeper personalisation.
      return startAskDrsaab(bot, chatId, session);
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
    case "upload_lab":
      return handleUploadLabButton(bot, chatId, session);
    case "progress":
      return showProgress(bot, chatId, session);
    case "summary":
      return showSummary(bot, chatId, session);
    case "learn":
      return showEducation(bot, chatId, session);
    case "t1community":
      return showT1Community(bot, chatId, session);
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
    case "account":
      return showAccount(bot, chatId, session);
    case "reminders":
      return showReminders(bot, chatId, session);
    case "language": {
      // Reached via the Profile screen's "Change language" button — after
      // picking (or hitting Back), return to Profile rather than the main menu.
      const lang = langOf(session);
      session.languageReturn = "feat:profile";
      return send(bot, chatId, t(lang, "choose_language"), {
        keyboard: languageKeyboard(lang, lang, "feat:profile"),
        markdown: true,
      });
    }
    default:
      return showMenu(bot, chatId, session);
  }
}

export async function handleMessage(bot, msg) {
  if (!msg.chat) return;
  const chatId = msg.chat.id;
  const session = getSession(chatId);
  if (!session.user) session.user = await getOrCreateUser(msg.from?.id ?? chatId, msg.__source || "telegram");

  // Account status gate (2026-07 spec — More → My Account).
  //   inactive → any inbound message reactivates + welcomes back, then falls
  //              through to normal handling.
  //   closed   → terminal from the app's point of view; reply with a stock
  //              message and stop.
  const status = session.user?.account_status;
  if (status === "closed") {
    return send(bot, chatId, t(langOf(session), "account_closed_reply"));
  }
  if (status === "inactive") {
    const reactivated = await setAccountStatus(session.user.id, "active").catch(() => null);
    if (reactivated) session.user = reactivated;
    await send(
      bot,
      chatId,
      t(langOf(session), "reactivated_welcome", { name: sanitizeMd(session.user.name || "") }),
      { markdown: true }
    );
    // fall through and let the rest of handleMessage process the message
  }

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
    "coach", "food", "fitness", "askdrsaab", "lab", "goals", "challenge_code", "profileq",
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
    case "wellbeing":
      return wellbeingText(bot, chatId, session, text);
    case "health":
      return healthText(bot, chatId, session, text);
    case "coach":
    case "food":
    case "fitness":
    case "label":
    case "analyze":
      return coachText(bot, chatId, session, text, msg);
    case "askdrsaab":
      return askDrsaabText(bot, chatId, session, text, msg);
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

  // A closed account can't drive the menu either — the equivalent guard in
  // handleMessage covers typed input. Reactivation only happens on a typed
  // message, not a stray inline-button tap.
  if (session.user?.account_status === "closed") {
    return send(bot, chatId, t(langOf(session), "account_closed_reply"));
  }

  // Onboarding choice buttons (language/gender/diabetes/skip)
  if (session.state === "onboarding") {
    return onboardingCallback(bot, chatId, session, data);
  }

  // Language change (from Profile or More → Language). Return the user to
  // whichever screen they came from (session.languageReturn), falling back to
  // the main menu if we don't have that context (e.g. process restart).
  if (data.startsWith("lang:")) {
    const code = data.split(":")[1];
    session.user = await updateUser(session.user.id, { language: code });
    const back = session.languageReturn;
    session.languageReturn = null;
    if (back && back.startsWith("feat:")) {
      return dispatchFeature(bot, chatId, session, back.split(":")[1]);
    }
    return showMenu(bot, chatId, session);
  }

  if (data === "menu") return showMenu(bot, chatId, session);

  // Goals — spec 2026-07 (list / add flow / detail / edit / review)
  if (data === "goal:add" || data === "goal:set") return startAddGoal(bot, chatId, session);
  if (data.startsWith("goalsug:")) return pickGoalSuggestion(bot, chatId, session, data.split(":")[1]);
  if (data.startsWith("goal:skip:")) return handleSkipAction(bot, chatId, session, data.split(":")[2]);
  if (data.startsWith("goal:view:")) return showGoalDetail(bot, chatId, session, data.split(":")[2]);
  if (data.startsWith("goal:edit:")) return showEditMenu(bot, chatId, session, data.split(":")[2]);
  if (data.startsWith("goal:complete:")) return completeGoal(bot, chatId, session, data.split(":")[2]);
  if (data.startsWith("goal:delete:")) return deleteGoal(bot, chatId, session, data.split(":")[2]);
  if (data.startsWith("goaledit:")) {
    const [, gid, field] = data.split(":");
    return startEditField(bot, chatId, session, gid, field);
  }
  if (data.startsWith("goalrev:")) {
    const [, gid, action] = data.split(":");
    return handleReviewAction(bot, chatId, session, gid, action);
  }

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
    if (x === "symptoms") return startWellbeing(bot, chatId, session);
  }

  // Food Help submenu — all four route into the Food coach with a seed prompt.
  // The seed only fires if startCoach actually entered the food state (i.e.
  // the user wasn't bounced to the upgrade gate).
  if (data.startsWith("fh:")) {
    const x = data.split(":")[1];
    // "analyze" and "label" each use a dedicated coach kind so the AI answers
    // in the exact structured format the spec requires. The conversational
    // options (What Can I Eat / Restaurant / Snacks) share the general food
    // coach with a seed prompt.
    if (x === "analyze") {
      await startCoach(bot, chatId, session, "analyze");
      return;
    }
    if (x === "label") {
      await startCoach(bot, chatId, session, "label");
      return;
    }
    const seedKey = {
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

  // More submenu (spec 2026-07: 4 items). Legacy `mo:` deep links kept so
  // any old inline button that still uses them keeps working.
  if (data.startsWith("mo:")) {
    const x = data.split(":")[1];
    if (x === "reminders") return showReminders(bot, chatId, session);
    if (x === "language") {
      // Reached via More — after picking (or hitting Back), return to More.
      const lang = langOf(session);
      session.languageReturn = "feat:more";
      return send(bot, chatId, t(lang, "choose_language"), {
        keyboard: languageKeyboard(lang, lang, "feat:more"),
        markdown: true,
      });
    }
    if (x === "subscription") return showSubscription(bot, chatId, session);
    if (x === "account") return showAccount(bot, chatId, session);
    if (x === "plan") return showPlan(bot, chatId, session);
    if (x === "support") return showSupport(bot, chatId, session);
    if (x === "goals") return showGoals(bot, chatId, session);
    if (x === "challenges") return showChallenges(bot, chatId, session);
    if (x === "executive") return showExecutive(bot, chatId, session);
  }

  // My Account actions
  if (data.startsWith("acct:")) {
    const x = data.split(":")[1];
    if (x === "edit") return startEditProfile(bot, chatId, session);
    if (x === "deactivate") return showDeactivateConfirm(bot, chatId, session);
    if (x === "deactivate_confirm") return doDeactivate(bot, chatId, session);
    if (x === "close") return showCloseConfirm(bot, chatId, session);
    if (x === "close_confirm") return doClose(bot, chatId, session);
  }

  // My Subscription actions
  if (data.startsWith("sub:")) {
    const x = data.split(":")[1];
    if (x === "upgrade") {
      const lang = langOf(session);
      return send(bot, chatId, t(lang, "upgrade_intro", { plan: planName(lang, session.user.tier) }), {
        keyboard: backKeyboard(lang, "feat:subscription"),
        markdown: true,
      });
    }
    if (x === "manage") {
      const lang = langOf(session);
      return send(bot, chatId, t(lang, "sub_manage_stub"), {
        keyboard: backKeyboard(lang, "feat:subscription"),
        markdown: true,
      });
    }
    if (x === "billing") {
      const lang = langOf(session);
      return send(bot, chatId, t(lang, "sub_billing_stub"), {
        keyboard: backKeyboard(lang, "feat:subscription"),
        markdown: true,
      });
    }
  }

  // Reminder category preference toggle (More → Reminders)
  if (data.startsWith("remp:")) {
    return toggleReminderPref(bot, chatId, session, data.split(":")[1]);
  }

  // Medication frequency picker — only fires inside the medication flow.
  if (data.startsWith("medfreq:")) {
    return medicationCallback(bot, chatId, session, data);
  }

  // Reminder offer (Y/N). The embedded key tells us which flow asked.
  if (data.startsWith("remoffer:")) {
    const [, key, ans] = data.split(":");
    if (key === "glucose") return glucoseReminderCallback(bot, chatId, session, ans);
    if (key === "med") return medicationCallback(bot, chatId, session, data);
    if (key === "weight") return weightCallback(bot, chatId, session, data);
    return;
  }

  // Medication setup: confirmation card (Yes/Edit/Add) and consistency offer.
  if (data.startsWith("medconf:") || data.startsWith("medcp:")) {
    return medicationCallback(bot, chatId, session, data);
  }

  // Wellbeing mood picker.
  if (data.startsWith("wb:")) {
    return wellbeingCallback(bot, chatId, session, data);
  }

  // Type 1 periodic confidence check (fires after wellbeing for T1 users).
  if (data.startsWith("t1c:")) {
    return t1ConfidenceCallback(bot, chatId, session, data);
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

  // T1 Community sub-menu (spec 2026-07): support / blogs / videos / dailylife / events.
  if (data.startsWith("t1:")) {
    return dispatchT1Community(bot, chatId, session, data.split(":")[1]);
  }

  // Profile-based main-menu item. Type 1 users land on the T1 Community
  // section; other profiles fall through to the Ask DrSaab stub until their
  // own section is built.
  if (data.startsWith("pfl:")) {
    const profile = data.split(":")[1];
    if (profile === "type1") return showT1Community(bot, chatId, session);
    const lang = langOf(session);
    await send(bot, chatId, t(lang, "profile_menu_stub"), { markdown: true });
    return startAskDrsaab(bot, chatId, session);
  }
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
