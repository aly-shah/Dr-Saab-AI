import { t } from "../i18n.js";
import { send, langOf, sanitizeMd } from "../utils.js";
import {
  betterMeMenuKeyboard,
  bmHabitPickerKeyboard,
  bmHabitDaysKeyboard,
  bmFitExperienceKeyboard,
  bmFitDaysKeyboard,
  bmFitGoalKeyboard,
  bmFitDoneKeyboard,
  bmWinsChoiceKeyboard,
  bmWinsFollowupKeyboard,
  bmWinsGoKeyboard,
  bmJourneyConditionsKeyboard,
  bmJourneyGoalKeyboard,
  bmBackKeyboard,
} from "../keyboards.js";
import { saveProfileAnswer, updateUser } from "../supabase.js";
import { generateFitnessPlan } from "../openai.js";

// Only "live healthier" users should reach this flow. Defence-in-depth: the
// profile menu button is only rendered when user_type=healthier, but deep
// links (e.g. from a shared URL or a past message) still land here.
function isHealthier(session) {
  return session?.user?.user_type === "healthier";
}

// ---- Menu ----

export async function showBetterMe(bot, chatId, session) {
  const lang = langOf(session);
  if (!isHealthier(session)) {
    return send(bot, chatId, t(lang, "bm_menu_not_healthier"), {
      keyboard: bmBackKeyboard(lang),
      markdown: true,
    });
  }
  session.state = "idle";
  session.step = null;
  session.data = {};
  await send(bot, chatId, `${t(lang, "bm_menu_title")}\n\n${t(lang, "bm_menu_intro")}`, {
    keyboard: betterMeMenuKeyboard(lang),
    markdown: true,
  });
}

// ===================================================================
// Build a New Habit
// ===================================================================

const HABIT_LABELS = {
  water: "bm_habit_water",
  sleep: "bm_habit_sleep",
  walk: "bm_habit_walk",
  exercise: "bm_habit_exercise",
  veggies: "bm_habit_veggies",
  less_sugar: "bm_habit_less_sugar",
  quit_smoking: "bm_habit_quit_smoking",
  stress: "bm_habit_stress",
  read: "bm_habit_read",
  pray: "bm_habit_pray",
};

async function startHabit(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "betterme";
  session.step = "habit_pick";
  session.data = { habit: {} };
  await send(bot, chatId, `${t(lang, "bm_habit_title")}\n\n${t(lang, "bm_habit_intro")}`, {
    keyboard: bmHabitPickerKeyboard(lang),
    markdown: true,
  });
}

async function askHabitWhy(bot, chatId, session, habitLabel) {
  const lang = langOf(session);
  session.data.habit = { ...(session.data.habit || {}), name: habitLabel };
  session.step = "habit_why";
  await send(bot, chatId, t(lang, "bm_habit_why_q", { habit: sanitizeMd(habitLabel) }), {
    markdown: true,
  });
}

async function askHabitDays(bot, chatId, session) {
  const lang = langOf(session);
  session.step = "habit_days";
  await send(bot, chatId, t(lang, "bm_habit_days_q"), {
    keyboard: bmHabitDaysKeyboard(lang),
    markdown: true,
  });
}

async function finishHabit(bot, chatId, session, days) {
  const lang = langOf(session);
  const habit = session.data?.habit || {};
  const record = { ...habit, days, saved_at: new Date().toISOString() };
  saveProfileAnswer(session.user.id, "bm_habit", JSON.stringify(record)).catch(() => {});
  session.state = "idle";
  session.step = null;
  session.data = {};
  await send(bot, chatId, t(lang, "bm_habit_done", {
    habit: sanitizeMd(habit.name || ""),
    days,
  }), {
    keyboard: bmBackKeyboard(lang),
    markdown: true,
  });
}

// ===================================================================
// My Fitness Plan
// ===================================================================

const FIT_EXP_LABELS = {
  never: "btn_bm_fit_exp_never",
  beginner: "btn_bm_fit_exp_beginner",
  regular: "btn_bm_fit_exp_regular",
};
const FIT_GOAL_LABELS = {
  lose_weight: "btn_bm_fit_goal_lose",
  build_muscle: "btn_bm_fit_goal_build",
  improve_fitness: "btn_bm_fit_goal_fitness",
  improve_overall: "btn_bm_fit_goal_overall",
};

async function startFitness(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "betterme";
  session.step = "fit_q1";
  session.data = { fit: {} };
  await send(bot, chatId, `${t(lang, "bm_fit_title")}\n\n${t(lang, "bm_fit_intro")}\n\n${t(lang, "bm_fit_q1")}`, {
    keyboard: bmFitExperienceKeyboard(lang),
    markdown: true,
  });
}

async function askFitDays(bot, chatId, session) {
  const lang = langOf(session);
  session.step = "fit_q2";
  await send(bot, chatId, t(lang, "bm_fit_q2"), {
    keyboard: bmFitDaysKeyboard(lang),
    markdown: true,
  });
}

async function askFitGoal(bot, chatId, session) {
  const lang = langOf(session);
  session.step = "fit_q3";
  await send(bot, chatId, t(lang, "bm_fit_q3"), {
    keyboard: bmFitGoalKeyboard(lang),
    markdown: true,
  });
}

async function generateAndDeliverFitness(bot, chatId, session) {
  const lang = langOf(session);
  await send(bot, chatId, t(lang, "bm_fit_generating"), { markdown: true });
  const answers = session.data?.fit || {};
  let plan;
  try {
    plan = await generateFitnessPlan(session.user, answers);
  } catch (e) {
    console.error("generateFitnessPlan error:", e?.message);
    return send(bot, chatId, t(lang, "bm_fit_error"), {
      keyboard: bmBackKeyboard(lang),
      markdown: true,
    });
  }
  const record = { ...answers, plan, generated_at: new Date().toISOString() };
  saveProfileAnswer(session.user.id, "bm_fitness_plan", JSON.stringify(record)).catch(() => {});
  session.state = "idle";
  session.step = null;
  await send(bot, chatId, t(lang, "bm_fit_saved", { plan }), {
    keyboard: bmFitDoneKeyboard(lang),
    markdown: true,
  });
}

// ===================================================================
// 10-Minute Wins
// ===================================================================

const WIN_KEYS = [
  "bm_win_walk_block",
  "bm_win_stairs",
  "bm_win_stretch_tv",
  "bm_win_home_workout",
  "bm_win_brisk_walk",
  "bm_win_park_further",
  "bm_win_phone_walk",
];

// 15 minutes by default; env override for QA (matches prediabetes flow).
const WINS_FOLLOWUP_MS = parseInt(process.env.BM_WINS_FOLLOWUP_MS || String(15 * 60 * 1000), 10);

function pickWin(lang, excludeKey = null) {
  const pool = excludeKey ? WIN_KEYS.filter((k) => k !== excludeKey) : WIN_KEYS;
  const key = pool[Math.floor(Math.random() * pool.length)];
  return { key, text: t(lang, key) };
}

async function showWin(bot, chatId, session, excludeKey = null) {
  const lang = langOf(session);
  const win = pickWin(lang, excludeKey);
  session.state = "idle";
  session.step = null;
  if (session.data?.winsTimer) clearTimeout(session.data.winsTimer);
  session.data = { ...session.data, winKey: win.key, winsAnswered: false, winsTimer: null };
  await send(
    bot,
    chatId,
    `${t(lang, "bm_wins_title")}\n\n${t(lang, "bm_wins_prompt", { activity: win.text })}`,
    { keyboard: bmWinsChoiceKeyboard(lang), markdown: true },
  );
}

async function handleWinsChoice(bot, chatId, session, action) {
  const lang = langOf(session);
  if (action === "wins_again") {
    return showWin(bot, chatId, session, session.data?.winKey);
  }
  const activity = t(lang, session.data?.winKey || WIN_KEYS[0]);
  saveProfileAnswer(session.user.id, "bm_last_win_activity", activity).catch(() => {});
  saveProfileAnswer(session.user.id, "bm_last_win_started_at", new Date().toISOString()).catch(() => {});
  await send(bot, chatId, t(lang, "bm_wins_go"), {
    keyboard: bmWinsGoKeyboard(lang),
    markdown: true,
  });
  if (session.data?.winsTimer) clearTimeout(session.data.winsTimer);
  session.data = session.data || {};
  session.data.winsTimer = setTimeout(() => {
    if (session.data?.winsAnswered) return;
    send(bot, chatId, t(lang, "bm_wins_check"), {
      keyboard: bmWinsFollowupKeyboard(lang),
      markdown: true,
    }).catch(() => {});
  }, WINS_FOLLOWUP_MS);
}

async function handleWinsFollowup(bot, chatId, session, answer) {
  const lang = langOf(session);
  session.data = session.data || {};
  session.data.winsAnswered = true;
  if (session.data.winsTimer) {
    clearTimeout(session.data.winsTimer);
    session.data.winsTimer = null;
  }
  saveProfileAnswer(session.user.id, "bm_last_win_completed", answer).catch(() => {});
  const key = answer === "yes" ? "bm_wins_yes" : "bm_wins_notyet";
  await send(bot, chatId, t(lang, key), { keyboard: bmBackKeyboard(lang), markdown: true });
}

// ===================================================================
// My Health Journey
// ===================================================================

const JOURNEY_GOAL_LABELS = {
  lose_weight: "btn_bm_journey_lose",
  get_fitter: "btn_bm_journey_fit",
  sleep_better: "btn_bm_journey_sleep",
  quit_smoking: "btn_bm_journey_quit",
  reduce_stress: "btn_bm_journey_stress",
  energetic: "btn_bm_journey_energy",
  overall_health: "btn_bm_journey_overall",
};

async function startJourney(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "betterme";
  session.step = "journey_cond_ask";
  session.data = { journey: {} };
  const current = (session.user?.other_conditions || "").trim();
  if (current) {
    await send(bot, chatId, `${t(lang, "bm_journey_title")}\n\n${t(lang, "bm_journey_conditions_have", { list: sanitizeMd(current) })}`, {
      keyboard: bmJourneyConditionsKeyboard(lang),
      markdown: true,
    });
  } else {
    await send(bot, chatId, `${t(lang, "bm_journey_title")}\n\n${t(lang, "bm_journey_conditions_none")}`, {
      keyboard: bmJourneyConditionsKeyboard(lang),
      markdown: true,
    });
  }
}

async function askJourneyConditions(bot, chatId, session) {
  const lang = langOf(session);
  session.step = "journey_cond_text";
  await send(bot, chatId, t(lang, "bm_journey_conditions_prompt"), { markdown: true });
}

async function askJourneyGoal(bot, chatId, session) {
  const lang = langOf(session);
  session.step = "journey_goal";
  await send(bot, chatId, t(lang, "bm_journey_goal_q"), {
    keyboard: bmJourneyGoalKeyboard(lang),
    markdown: true,
  });
}

async function finishJourney(bot, chatId, session, goalLabel) {
  const lang = langOf(session);
  const record = {
    conditions: session.user?.other_conditions || null,
    goal: goalLabel,
    saved_at: new Date().toISOString(),
  };
  saveProfileAnswer(session.user.id, "bm_health_journey", JSON.stringify(record)).catch(() => {});
  session.state = "idle";
  session.step = null;
  session.data = {};
  await send(bot, chatId, t(lang, "bm_journey_done", { goal: sanitizeMd(goalLabel) }), {
    keyboard: bmBackKeyboard(lang),
    markdown: true,
  });
}

// ---- Text handler (called from bot.js state switch) ----

export async function bettermeText(bot, chatId, session, text) {
  const lang = langOf(session);
  const value = (text || "").trim();
  if (!value) return;

  switch (session.step) {
    // Habit — typed "Other" name
    case "habit_other":
      return askHabitWhy(bot, chatId, session, value.slice(0, 120));

    // Habit — the "why does this matter" text; move to days picker.
    case "habit_why":
      session.data.habit = { ...(session.data.habit || {}), why: value.slice(0, 400) };
      return askHabitDays(bot, chatId, session);

    // Health Journey — typed conditions list.
    case "journey_cond_text": {
      if (/^skip$/i.test(value)) {
        await send(bot, chatId, t(lang, "bm_journey_conditions_saved"), { markdown: true });
        return askJourneyGoal(bot, chatId, session);
      }
      const cleaned = value.slice(0, 400);
      try {
        const u = await updateUser(session.user.id, { other_conditions: cleaned });
        if (u) session.user = u;
      } catch (e) {
        console.error("betterme conditions update:", e?.message);
      }
      await send(bot, chatId, t(lang, "bm_journey_conditions_saved"), { markdown: true });
      return askJourneyGoal(bot, chatId, session);
    }

    // Health Journey — typed "Other" 1-year goal.
    case "journey_goal_other":
      return finishJourney(bot, chatId, session, value.slice(0, 200));

    default:
      // Unknown step — fall back to the menu so the user isn't stuck.
      return showBetterMe(bot, chatId, session);
  }
}

// ---- Callback dispatcher (called from bot.js `bm:` handler) ----

export async function dispatchBetterMe(bot, chatId, session, action) {
  const lang = langOf(session);
  if (!isHealthier(session)) return showBetterMe(bot, chatId, session);

  if (action === "menu") return showBetterMe(bot, chatId, session);

  // Build a New Habit
  if (action === "habit") return startHabit(bot, chatId, session);
  if (action.startsWith("habit:")) {
    const val = action.slice("habit:".length);
    if (val === "other") {
      session.state = "betterme";
      session.step = "habit_other";
      session.data = session.data || {};
      session.data.habit = {};
      return send(bot, chatId, t(lang, "bm_habit_other_q"), { markdown: true });
    }
    const labelKey = HABIT_LABELS[val];
    if (!labelKey) return showBetterMe(bot, chatId, session);
    return askHabitWhy(bot, chatId, session, t(lang, labelKey));
  }
  if (action.startsWith("habitdays:")) {
    const n = parseInt(action.slice("habitdays:".length), 10);
    if (!Number.isInteger(n) || n < 1 || n > 7) return showBetterMe(bot, chatId, session);
    return finishHabit(bot, chatId, session, n);
  }

  // My Fitness Plan
  if (action === "fitness") return startFitness(bot, chatId, session);
  if (action.startsWith("fitexp:")) {
    const val = action.slice("fitexp:".length);
    session.data = session.data || {};
    session.data.fit = { ...(session.data.fit || {}), experience: t(lang, FIT_EXP_LABELS[val] || "btn_bm_fit_exp_never") };
    return askFitDays(bot, chatId, session);
  }
  if (action.startsWith("fitdays:")) {
    const n = parseInt(action.slice("fitdays:".length), 10);
    session.data = session.data || {};
    session.data.fit = { ...(session.data.fit || {}), days: n === 5 ? "5+" : String(n) };
    return askFitGoal(bot, chatId, session);
  }
  if (action.startsWith("fitgoal:")) {
    const val = action.slice("fitgoal:".length);
    session.data = session.data || {};
    session.data.fit = { ...(session.data.fit || {}), goal: t(lang, FIT_GOAL_LABELS[val] || "btn_bm_fit_goal_overall") };
    return generateAndDeliverFitness(bot, chatId, session);
  }

  // 10-Minute Wins
  if (action === "wins") return showWin(bot, chatId, session);
  if (action === "wins_do" || action === "wins_again") {
    return handleWinsChoice(bot, chatId, session, action);
  }
  if (action === "wins_yes") return handleWinsFollowup(bot, chatId, session, "yes");
  if (action === "wins_notyet") return handleWinsFollowup(bot, chatId, session, "notyet");

  // Health Journey
  if (action === "journey") return startJourney(bot, chatId, session);
  if (action === "condyes") return askJourneyConditions(bot, chatId, session);
  if (action === "condno") return askJourneyGoal(bot, chatId, session);
  if (action.startsWith("jgoal:")) {
    const val = action.slice("jgoal:".length);
    if (val === "other") {
      session.state = "betterme";
      session.step = "journey_goal_other";
      return send(bot, chatId, t(lang, "bm_journey_other_q"), { markdown: true });
    }
    const labelKey = JOURNEY_GOAL_LABELS[val];
    if (!labelKey) return showBetterMe(bot, chatId, session);
    return finishJourney(bot, chatId, session, t(lang, labelKey));
  }

  return showBetterMe(bot, chatId, session);
}
