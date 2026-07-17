import { t, LANGUAGES } from "./i18n.js";
import { send, sanitizeMd, langOf, isPremium } from "./utils.js";
import { config } from "./config.js";
import {
  mainMenuKeyboardV2,
  patientMenuForDoctorKeyboard,
  checkInKeyboard,
  foodHelpKeyboard,
  moreKeyboard,
  profileKeyboard,
  languageKeyboard,
  backKeyboard,
  subscriptionKeyboard,
  saveReadingOfferKeyboard,
} from "./keyboards.js";
import { getSession, resetFlow, clearSession } from "./session.js";
import {
  getOrCreateUser,
  updateUser,
  recordMessage,
  deleteUser,
  setAccountStatus,
  latestMetrics,
} from "./supabase.js";
import { TIERS, normalizeTier } from "./tiers.js";
import {
  INTENT,
  resolveIntent,
  isGlobalIntent,
  isQuestion,
  isFoodQuestion,
  detectReadingInQuestion,
  logShortcutEvent,
} from "./shortcuts.js";

import {
  startOnboarding,
  onboardingText,
  onboardingCallback,
  doctorPatientBranchCallback,
} from "./flows/onboarding.js";
import {
  doctorOnboardingText,
  doctorOnboardingCallback,
} from "./flows/doctorOnboarding.js";
import {
  showDoctorMenu,
  doctorCallback,
  showMyDoctor,
  myDoctorCallback,
  myDoctorText,
} from "./flows/doctor.js";
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
import { startMyHealth, myHealthText, myHealthCallback } from "./flows/myhealth.js";
import { startCoach, coachText } from "./flows/coach.js";
import { startAskDrsaab, askDrsaabText } from "./flows/askdrsaab.js";
import { startLab, labText } from "./flows/labreport.js";
import { showSummary } from "./flows/progress.js";
import { showEducation } from "./flows/education.js";
import { showT1Community, dispatchT1Community } from "./flows/t1community.js";
import {
  showPrediabetes,
  dispatchPrediabetes,
  prediabetesText,
} from "./flows/prediabetes.js";
import {
  showBetterMe,
  dispatchBetterMe,
  bettermeText,
} from "./flows/betterme.js";
import {
  showPregnancy,
  dispatchPregnancy,
  pregnancyText,
} from "./flows/pregnancy.js";
import {
  showChallenges,
  chalCallback,
  chalHba1cText,
} from "./flows/challenges.js";

// Legacy `chl:*` handlers kept for backwards-compat with any old deep links
// living in a message or button. New Challenges module (spec v1.0) is under
// `chal:*` and lives in flows/challenges.js.
async function legacyChallengeStub(bot, chatId, session) {
  return showChallenges(bot, chatId, session);
}
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
import {
  subscriptionCallback,
  subscriptionText,
  adminSubscriptionCommand,
  isAdminChat,
} from "./flows/subscription.js";

// Display name for a tier slug (handles legacy slugs).
function planName(lang, tier) {
  const key = TIERS[normalizeTier(tier)]?.nameKey || "plan_free";
  return t(lang, key);
}

async function showMenu(bot, chatId, session) {
  // Doctors default to their own three-item menu, but if they've toggled into
  // patient mode (session.patientMode) show the patient menu with a
  // Switch-to-Doctor button at the bottom.
  const isDoctor = session.user?.user_type === "doctor";
  if (isDoctor && !session.patientMode) return showDoctorMenu(bot, chatId, session);
  resetFlow(chatId);
  const lang = langOf(session);
  const keyboard = isDoctor
    ? patientMenuForDoctorKeyboard(lang, session.user)
    : mainMenuKeyboardV2(lang, session.user);
  await send(bot, chatId, t(lang, "menu_v2_title"), { keyboard, markdown: true, keepEmoji: true });
}

async function startCommand(bot, chatId, session, scenario = "eng") {
  if (!session.user.onboarded) return startOnboarding(bot, chatId, session, scenario);
  const lang = langOf(session);
  await send(bot, chatId, t(lang, "welcome_back", { name: sanitizeMd(session.user.name || "") }), {
    markdown: true,
  });
  await send(bot, chatId, t(lang, "menu_v2_title"), { keyboard: mainMenuKeyboardV2(lang, session.user), markdown: true, keepEmoji: true });
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

// ==================================================================
// Universal shortcut router (spec 2026-07)
// ==================================================================
// State names of active flows that hold captured-but-unsaved answers.
// When a global shortcut interrupts one of these, we snapshot the
// state so the user can `resume` shortly after.
const RESUMABLE_STATES = new Set([
  "glucose",
  "medication",
  "weight",
  "activity",
  "symptoms",
  "wellbeing",
  "health",
  "myhealth",
  "lab",
  "prediabetes",
  "betterme",
  "pregnancy",
  "profileq",
  "my_doctor",
  "challenge_hba1c_baseline",
  "sub_await_proof",
]);

const PAUSED_TTL_MS = 15 * 60 * 1000;

function isInResumableFlow(session) {
  return RESUMABLE_STATES.has(session.state);
}

// Snapshot the current flow before a global shortcut takes over so
// the user can restore it with `resume`. Called only when we're
// leaving a data-entry state that had already collected input.
function pauseActiveFlow(session) {
  if (!isInResumableFlow(session)) return null;
  session.pausedFlow = {
    state: session.state,
    step: session.step,
    data: { ...(session.data || {}) },
    at: Date.now(),
  };
  return session.pausedFlow;
}

// Human label for the flow that got paused (used in the ack message).
function pausedFlowLabel(lang, pf) {
  const key = {
    glucose: "shortcut_flow_glucose",
    medication: "shortcut_flow_med",
    weight: "shortcut_flow_weight",
    activity: "shortcut_flow_activity",
    symptoms: "shortcut_flow_symptoms",
    wellbeing: "shortcut_flow_wellbeing",
    health: "shortcut_flow_health",
    myhealth: "shortcut_flow_myhealth",
    lab: "shortcut_flow_lab",
    my_doctor: "shortcut_flow_mydoc",
  }[pf?.state];
  const localised = key ? t(lang, key) : null;
  return localised && !localised.startsWith(key) ? localised : (pf?.state || "");
}

// Restore a paused flow. Returns true if a resume actually happened.
async function resumePausedFlow(bot, chatId, session) {
  const pf = session.pausedFlow;
  const lang = langOf(session);
  if (!pf || Date.now() - pf.at > PAUSED_TTL_MS) {
    session.pausedFlow = null;
    await send(bot, chatId, t(lang, "shortcut_no_paused_flow"), { markdown: true });
    return false;
  }
  session.state = pf.state;
  session.step = pf.step;
  session.data = { ...pf.data };
  session.pausedFlow = null;
  await send(bot, chatId, t(lang, "shortcut_resumed", { flow: pausedFlowLabel(lang, pf) }), {
    markdown: true,
  });
  return true;
}

// Quick Shortcuts help card — shown by the `help` shortcut and by the
// `commands` alias, per §8 of the spec.
async function showQuickShortcuts(bot, chatId, session, entryPoint = "help_command") {
  const lang = langOf(session);
  const body = `${t(lang, "quick_shortcuts_title")}\n\n${t(lang, "quick_shortcuts_body")}`;
  logShortcutEvent("shortcut_help_viewed", { entry_point: entryPoint, user_id: session.user?.id });
  await send(bot, chatId, body, {
    keyboard: mainMenuKeyboardV2(lang, session.user),
    markdown: true,
    keepEmoji: true,
  });
}

// HBA1C_SHOW intent — retrieve the latest stored HbA1c rather than
// starting a report upload. Falls back to an upload-prompt if none.
async function showLatestHba1c(bot, chatId, session) {
  const lang = langOf(session);
  const u = session.user || {};
  let value = null;
  let dateBucket = u.hba1c_date_bucket || null;

  if (typeof u.latest_hba1c === "number") {
    value = u.latest_hba1c;
  } else {
    const metrics = await latestMetrics(u.id).catch(() => []);
    const hit = (metrics || []).find((m) => m.metric_type === "hba1c");
    if (hit && typeof hit.value === "number") {
      value = hit.value;
      dateBucket = hit.measurement_date || dateBucket;
    }
  }

  if (value == null) {
    return send(bot, chatId, t(lang, "shortcut_hba1c_none"), {
      keyboard: backKeyboard(lang),
      markdown: true,
    });
  }
  const date = dateBucket ? ` _(as of ${String(dateBucket).slice(0, 10)})_` : "";
  return send(bot, chatId, t(lang, "shortcut_hba1c_latest", { value, date }), {
    keyboard: backKeyboard(lang),
    markdown: true,
  });
}

// Sugar-with-value flow: pre-parse the reading, start the glucose flow
// with the value already captured, then ask for the missing timing
// context (fasting / random / pre-meal / post-meal / bedtime).
async function startGlucoseWithValue(bot, chatId, session, structured) {
  const lang = langOf(session);
  session.state = "glucose";
  session.step = "await_context";
  session.data = { ...(session.data || {}), pendingSugar: structured };
  return send(bot, chatId, t(lang, "shortcut_sugar_needs_context", { value: structured.value }), {
    keyboard: backKeyboard(lang),
    markdown: true,
  });
}

// Route a resolved intent to the appropriate handler. Global intents
// wipe the current flow; sugar/med intents also replace it (per §7).
async function routeIntent(bot, chatId, session, resolved) {
  const lang = langOf(session);
  const intent = resolved.intent;
  const isDoctor = session.user?.user_type === "doctor";
  const role = isDoctor ? "doctor" : "patient";

  logShortcutEvent("shortcut_executed", {
    canonical_intent: intent,
    match_type: resolved.matchType,
    active_flow: session.state,
    role,
    user_id: session.user?.id,
  });

  // Pause any active flow before a global takeover so the user can
  // resume. CANCEL and RESUME don't need a snapshot — cancel discards,
  // resume operates on the existing snapshot. Everything else that
  // interrupts a data-entry state gets one.
  const wasInFlow = isInResumableFlow(session);
  const skipPause = intent === INTENT.CANCEL || intent === INTENT.RESUME;
  if (wasInFlow && isGlobalIntent(intent) && !skipPause) {
    const paused = pauseActiveFlow(session);
    resetFlow(chatId);
    if (paused) {
      await send(
        bot,
        chatId,
        t(lang, "shortcut_flow_paused", { flow: pausedFlowLabel(lang, paused) }),
        { markdown: true },
      );
    }
  }

  switch (intent) {
    case INTENT.MENU:
      return showMenu(bot, chatId, session);
    case INTENT.HELP:
      return showQuickShortcuts(bot, chatId, session);
    case INTENT.HEALTH:
      return startMyHealth(bot, chatId, session);
    case INTENT.SUGAR_LOG:
      if (resolved.structured?.kind === "glucose") {
        return startGlucoseWithValue(bot, chatId, session, resolved.structured);
      }
      if (resolved.structured?.kind === "hba1c") {
        // Pre-parsed HbA1c value from the sugar detector — the user
        // likely wants to add it to their record. Route into the lab
        // flow with the raw text so its parser handles the save.
        return startLab(bot, chatId, session);
      }
      return startGlucose(bot, chatId, session);
    case INTENT.MEDICATION:
      return startMedication(bot, chatId, session);
    case INTENT.FOOD_HELP:
      return showFoodHelp(bot, chatId, session);
    case INTENT.REPORT:
      return startLab(bot, chatId, session);
    case INTENT.PROGRESS:
      return showSummary(bot, chatId, session);
    case INTENT.CHALLENGE:
      return showChallenges(bot, chatId, session);
    case INTENT.DOCTOR:
      // AC-07: doctors land on their own menu; patients land on My Doctor.
      if (isDoctor && !session.patientMode) return showDoctorMenu(bot, chatId, session);
      return showMyDoctor(bot, chatId, session);
    case INTENT.HBA1C_SHOW:
      return showLatestHba1c(bot, chatId, session);
    case INTENT.CANCEL:
      resetFlow(chatId);
      await send(bot, chatId, t(lang, "cancelled"));
      return showMenu(bot, chatId, session);
    case INTENT.RESUME:
      return resumePausedFlow(bot, chatId, session);
    default:
      return showMenu(bot, chatId, session);
  }
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
    case "more":
      return showMore(bot, chatId, session);
    case "myhealth":
      // ❤️ My Health — the user's canonical, conversational health profile.
      return startMyHealth(bot, chatId, session);
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
    case "summary":
      return showSummary(bot, chatId, session);
    case "learn":
      return showEducation(bot, chatId, session);
    case "t1community":
      return showT1Community(bot, chatId, session);
    case "prediabetes":
      return showPrediabetes(bot, chatId, session);
    case "betterme":
      return showBetterMe(bot, chatId, session);
    case "pregnancy":
      return showPregnancy(bot, chatId, session);
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
    resetFlow(chatId);
    await send(bot, chatId, t(langOf(session), "cancelled"));
    return showMenu(bot, chatId, session);
  }

  // /upgrade legacy slash — no plain-word equivalent, kept as a shortcut
  // for users who remember it.
  if (cmd === "/upgrade" && session.user.onboarded) {
    return showSubscription(bot, chatId, session);
  }

  // Subscription admin commands (spec §10). Only the configured admin phone
  // number can invoke `/sub …` and manage pending payments.
  if (cmd === "/sub" && isAdminChat(chatId)) {
    return adminSubscriptionCommand(bot, chatId, session, text);
  }

  // Doctor QA shortcut — types `/testdp` in a doctor chat to fire the same
  // "10-patient cap reached" notification a real 11th-patient link attempt
  // would send. Backup for cases where WhatsApp buries the menu button inside
  // a "Choose" list. Gated by config.testActivationEnabled.
  if (cmd === "/testdp" && session.user.onboarded && session.user.user_type === "doctor") {
    const { notifyDoctorCapReached } = await import("./flows/subscription.js");
    if (!config.testActivationEnabled) {
      return send(bot, chatId, t(langOf(session), "test_activation_disabled"), { markdown: true });
    }
    await notifyDoctorCapReached(session.user, t(langOf(session), "dp_test_patient_name"));
    return;
  }

  // Universal shortcut / smart-alias router (spec 2026-07).
  //
  // Layered routing per §5:
  //   1. normalize
  //   2. exact command match  (top-10 canonical shortcuts)
  //   3. alias / phrase match (curated aliases + Roman Urdu + Urdu)
  //   4. structured data      (e.g. "sugar 145" → glucose entry)
  //   5. context-aware        (in-flow natural replies stay in the flow)
  //   6. AI fallback          (idle idle+free-text → Ask DrSaab)
  //
  // Onboarding is intentionally excluded — a not-yet-onboarded user
  // must complete the wizard before shortcuts become active.
  const activeState = session.state;
  const inResumableFlow = isInResumableFlow(session);
  const inCoachlike = ["coach", "food", "fitness", "label", "analyze", "askdrsaab"].includes(activeState);

  // The router accepts both bare words ("sugar") and the optional
  // slash form ("/sugar"). Slash commands already consumed above
  // (/start, /menu, /cancel, /upgrade) never reach this point.
  if (session.user.onboarded && text) {
    const resolved = resolveIntent(text, { inFlow: inResumableFlow || inCoachlike });
    if (resolved) {
      logShortcutEvent("shortcut_detected", {
        canonical_intent: resolved.intent,
        match_type: resolved.matchType,
        confidence: resolved.confidence,
        language: session.user?.language || "en",
        message_text: text,
        user_id: session.user?.id,
      });
      // High-signal paths always route:
      //   • structured   — data-entry with a numeric reading
      //   • hba1c_show   — verbatim retrieval phrase
      //   • exact/alias_full — the whole message equals an alias, no
      //     ambiguity about intent (the user typed the shortcut).
      if (
        resolved.matchType === "structured" ||
        resolved.matchType === "hba1c_show" ||
        resolved.matchType === "exact" ||
        resolved.matchType === "alias_full"
      ) {
        return routeIntent(bot, chatId, session, resolved);
      }

      // "partial" match — first token is a shortcut but there's more.
      // Apply the coach / question guard so long sentences that just
      // start with "food …" or "menu …" don't hijack the chat.
      if (resolved.matchType === "partial" && resolved.confidence === "high") {
        const trimmed = (text || "").trim();
        const tokenCount = trimmed.split(/\s+/).length;
        if (inCoachlike && tokenCount > 2) {
          // stay in the coach; fall through
        } else if (isQuestion(text)) {
          // sounds like a question — Ask DrSaab handles it
        } else {
          return routeIntent(bot, chatId, session, resolved);
        }
      }
    }

    // §6 disambiguation rule 4 — food questions ("Can I eat biryani?")
    // route to the Food Help coach conversationally rather than the
    // generic Ask DrSaab, but only for paid users (Food Coach is a paid
    // feature) and when we're not already inside another data-entry flow.
    if (
      !inResumableFlow &&
      !inCoachlike &&
      isFoodQuestion(text) &&
      isPremium(session.user)
    ) {
      logShortcutEvent("shortcut_executed", {
        canonical_intent: "FOOD_HELP",
        match_type: "food_question",
        active_flow: session.state,
        role: session.user?.user_type === "doctor" ? "doctor" : "patient",
        user_id: session.user?.id,
      });
      // Enter the food coach silently (skip the intro since the user
      // already asked their question) and hand the message straight to
      // coachText so the AI answers the biryani question in-flow.
      session.state = "food";
      session.history = [];
      if (session.data) delete session.data.foodRestaurantId;
      return coachText(bot, chatId, session, text, msg);
    }
  }

  // Not onboarded yet → (re)start onboarding for any input.
  // A greeting word picks the matching welcome scenario; any other text
  // falls back to the English welcome banner. Doctor onboarding branches
  // (doctor_onboarding, doctor_patient_onboarding) are also considered
  // in-progress onboarding — otherwise their typed replies would restart
  // the whole welcome/language flow.
  //
  // sub_await_proof is a payment upload state: the user reached it only
  // after completing onboarding, but session.user.onboarded may look false
  // on a fresh in-memory session after a process restart. Never bounce
  // them into onboarding while mid-upload — the state check below handles
  // the missing-context case with a friendlier message.
  const inOnboardingState =
    session.state === "onboarding" ||
    session.state === "doctor_onboarding" ||
    session.state === "doctor_patient_onboarding" ||
    session.state === "sub_await_proof";
  if (!session.user.onboarded && !inOnboardingState) {
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
    case "doctor_onboarding":
      return doctorOnboardingText(bot, chatId, session, text);
    case "doctor_patient_onboarding":
      // Typed reply inside the diabetes-type button screen — nudge them to tap.
      return send(bot, chatId, t(langOf(session), "ask_diabetes_type"), {
        markdown: true,
      });
    case "my_doctor":
      return myDoctorText(bot, chatId, session, text);
    case "myhealth":
      return myHealthText(bot, chatId, session, text, msg);
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
      await askDrsaabText(bot, chatId, session, text, msg);
      await maybeOfferSaveReading(bot, chatId, session, text);
      return;
    case "lab":
      return labText(bot, chatId, session, text, msg);
    case "challenge_code":
      // Legacy state — new Challenges module never enters this state.
      resetFlow(chatId);
      return showMenu(bot, chatId, session);
    case "challenge_hba1c_baseline":
      return chalHba1cText(bot, chatId, session, text, msg);
    case "profileq":
      return profileqText(bot, chatId, session, text);
    case "sub_await_proof":
      // Subscription Module (spec §8) — the user is uploading their payment
      // screenshot. Any incoming photo/image message is captured here.
      return subscriptionText(bot, chatId, session, text, msg);
    case "prediabetes":
      return prediabetesText(bot, chatId, session, text);
    case "betterme":
      return bettermeText(bot, chatId, session, text);
    case "pregnancy":
      return pregnancyText(bot, chatId, session, text);
    default:
      // Idle — no active flow. Treat any free-text message as an Ask DrSaab
      // question so users (esp. on WhatsApp) can ask anything without first
      // navigating into the Ask DrSaab section. Menu/help word commands are
      // handled above this switch and still open the menu.
      await askDrsaabText(bot, chatId, session, text, msg);
      await maybeOfferSaveReading(bot, chatId, session, text);
      return;
  }
}

// §6 disambiguation rule 2: if the user asks a clinical question that
// contains a numeric reading (e.g. "is sugar 145 bad?"), Ask DrSaab
// answers first — and only then do we offer to save the value.
async function maybeOfferSaveReading(bot, chatId, session, text) {
  if (!isQuestion(text)) return;
  const reading = detectReadingInQuestion(text);
  if (!reading) return;
  if (reading.kind !== "glucose" && reading.kind !== "hba1c") return;
  const lang = langOf(session);
  await send(bot, chatId, t(lang, "shortcut_confirm_log_sugar", { value: reading.value }), {
    keyboard: saveReadingOfferKeyboard(lang, reading.kind, reading.value),
    markdown: true,
  });
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

  // Doctor onboarding — only the "patient use?" yes/no answers are inline;
  // everything else is typed and handled via handleMessage.
  if (session.state === "doctor_onboarding") {
    return doctorOnboardingCallback(bot, chatId, session, data);
  }

  // Doctor picked "dual use" — diabetes-type question drives this state.
  if (session.state === "doctor_patient_onboarding") {
    return doctorPatientBranchCallback(bot, chatId, session, data);
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

  // Save-reading offer after a clinical question (§6 rule 2). Yes routes
  // into the appropriate flow with the value pre-parsed; No is silent.
  if (data.startsWith("saveq:")) {
    const [, kind, valueStr, ans] = data.split(":");
    const value = parseFloat(valueStr);
    logShortcutEvent("shortcut_confirmed", {
      suggested_intent: kind === "hba1c" ? "HBA1C_LOG" : "SUGAR_LOG",
      user_confirmation: ans,
      user_id: session.user?.id,
    });
    if (ans === "no" || !Number.isFinite(value)) {
      return;
    }
    if (kind === "glucose") {
      return startGlucoseWithValue(bot, chatId, session, { value, kind: "glucose" });
    }
    if (kind === "hba1c") {
      return startLab(bot, chatId, session);
    }
    return;
  }

  // ❤️ My Health — start / confirm (ok/edit/skip) / glucose-context picker.
  if (data.startsWith("mh:")) return myHealthCallback(bot, chatId, session, data);

  // Challenges v1.0 (spec 2026-07) — prefix `chal:*`.
  if (data.startsWith("chal:")) return chalCallback(bot, chatId, session, data);

  // Legacy Challenges module (`chl:*`) kept for backwards-compat with any
  // old deep link. All actions land back on the new hub.
  if (data.startsWith("chl:")) return legacyChallengeStub(bot, chatId, session);

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
    // Restaurant Guidance and Snack Ideas skip the generic Food Coach intro
    // — their own prompt already tells the user what to do, so the intro was
    // redundant and made the entry feel like two separate messages.
    if (x === "restaurant" || x === "snacks") {
      await startCoach(bot, chatId, session, "food", seedKey);
      return;
    }
    await startCoach(bot, chatId, session, "food");
    if (seedKey && session.state === "food") {
      await send(bot, chatId, t(langOf(session), seedKey), { markdown: true });
    }
    return;
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
    // Manage / Billing stubs stay — they're not part of the Upgrade module.
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
    // Everything else in the `sub:` namespace belongs to the Subscription
    // Module (spec §2–§14) — upgrade menu, plan pick, pay method, proof.
    return subscriptionCallback(bot, chatId, session, data);
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
  // Pass the full remainder so nested actions like `dl:<cat>` and `dt:<id>` reach the dispatcher intact.
  if (data.startsWith("t1:")) {
    return dispatchT1Community(bot, chatId, session, data.slice(3));
  }

  // Prediabetes Healthy Living sub-menu (spec 2026-07): wins / gym / cravings.
  if (data.startsWith("pd:")) {
    return dispatchPrediabetes(bot, chatId, session, data.slice(3));
  }

  // Better Me sub-menu (spec 2026-07): habit / fitness / wins.
  if (data.startsWith("bm:")) {
    return dispatchBetterMe(bot, chatId, session, data.slice(3));
  }

  // Pregnancy Support sub-menu (spec 2026-07): progress / tips / checklist.
  if (data.startsWith("pg:")) {
    return dispatchPregnancy(bot, chatId, session, data.slice(3));
  }

  // Doctor & Referral module (v1.0)
  if (data.startsWith("doc:")) {
    return doctorCallback(bot, chatId, session, data);
  }
  if (data.startsWith("mydoc:")) {
    return myDoctorCallback(bot, chatId, session, data);
  }

  // Profile-based main-menu item. Type 1 users land on the T1 Community
  // section, prediabetes users on the Healthy Living menu; other profiles
  // fall through to the Ask DrSaab stub until their own section is built.
  if (data.startsWith("pfl:")) {
    const profile = data.split(":")[1];
    if (profile === "type1") return showT1Community(bot, chatId, session);
    if (profile === "prediabetes") return showPrediabetes(bot, chatId, session);
    if (profile === "healthier") return showBetterMe(bot, chatId, session);
    if (profile === "gestational") return showPregnancy(bot, chatId, session);
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
