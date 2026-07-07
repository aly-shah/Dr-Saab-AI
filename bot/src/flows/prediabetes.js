import { t } from "../i18n.js";
import { send, langOf, sanitizeMd } from "../utils.js";
import {
  prediabetesMenuKeyboard,
  pdWinsChoiceKeyboard,
  pdWinsFollowupKeyboard,
  pdWinsGoKeyboard,
  pdGymExperienceKeyboard,
  pdGymDaysKeyboard,
  pdGymGoalKeyboard,
  pdGymDoneKeyboard,
  pdCravingsDrinkKeyboard,
  pdCravingsJunkKeyboard,
  pdCravingsCommitKeyboard,
  pdBackKeyboard,
} from "../keyboards.js";
import { saveProfileAnswer } from "../supabase.js";
import { generateGymPlan } from "../openai.js";

// Only prediabetes users should reach this flow. Defence-in-depth: the menu
// button is only rendered for user_type=prediabetes, but deep links land here too.
function isPrediabetes(session) {
  return session?.user?.user_type === "prediabetes";
}

const WIN_KEYS = [
  "pd_win_walk_office",
  "pd_win_walk_block",
  "pd_win_stairs",
  "pd_win_stretch_tv",
  "pd_win_home_workout",
  "pd_win_brisk_walk",
  "pd_win_park_further",
  "pd_win_phone_walk",
];

// 15 minutes in real life; a testing shortcut lives on the env var so the
// spec's "approximately 15-20 minutes" can be shortened during QA.
const WINS_FOLLOWUP_MS = parseInt(process.env.PD_WINS_FOLLOWUP_MS || String(15 * 60 * 1000), 10);

// Labels used both as callback values and as human-readable strings we echo
// back to the user. Keys map to i18n button labels so we localise on read.
const DRINK_LABELS = {
  coke: "btn_pd_drink_coke",
  pepsi: "btn_pd_drink_pepsi",
  "7up": "btn_pd_drink_7up",
  sprite: "btn_pd_drink_sprite",
  mountain_dew: "btn_pd_drink_mtn",
  energy: "btn_pd_drink_energy",
  sweet_tea: "btn_pd_drink_tea",
};

const JUNK_LABELS = {
  burgers: "btn_pd_junk_burgers",
  pizza: "btn_pd_junk_pizza",
  fries: "btn_pd_junk_fries",
  chips: "btn_pd_junk_chips",
  biscuits: "btn_pd_junk_biscuits",
  cakes: "btn_pd_junk_cakes",
  chocolate: "btn_pd_junk_choco",
  fast_food: "btn_pd_junk_fast",
};

const COMMIT_LABELS = {
  less_soda: "btn_pd_commit_less_soda",
  weekend_only: "btn_pd_commit_weekend_only",
  water: "btn_pd_commit_water",
  less_fast: "btn_pd_commit_less_fast",
  skip_chips: "btn_pd_commit_skip_chips",
};

const GYM_GOAL_LABELS = {
  lose_weight: "btn_pd_gym_goal_lose",
  build_muscle: "btn_pd_gym_goal_build",
  improve_fitness: "btn_pd_gym_goal_fitness",
  improve_bloodsugar: "btn_pd_gym_goal_bloodsugar",
};

const GYM_EXP_LABELS = {
  never: "btn_pd_gym_exp_never",
  beginner: "btn_pd_gym_exp_beginner",
  regular: "btn_pd_gym_exp_regular",
};

// ---- Menu ----

export async function showPrediabetes(bot, chatId, session) {
  const lang = langOf(session);
  if (!isPrediabetes(session)) {
    return send(bot, chatId, t(lang, "pd_menu_not_pre"), {
      keyboard: pdBackKeyboard(lang),
      markdown: true,
    });
  }
  session.state = "idle";
  session.step = null;
  session.data = {};
  await send(bot, chatId, `${t(lang, "pd_menu_title")}\n\n${t(lang, "pd_menu_intro")}`, {
    keyboard: prediabetesMenuKeyboard(lang),
    markdown: true,
  });
}

// ---- 10-Minute Wins ----

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
  // Reset per-round follow-up flags so a fresh setTimeout can arm cleanly.
  if (session.data?.winsTimer) clearTimeout(session.data.winsTimer);
  session.data = { ...session.data, winKey: win.key, winsAnswered: false, winsTimer: null };
  await send(
    bot,
    chatId,
    `${t(lang, "pd_wins_title")}\n\n${t(lang, "pd_wins_prompt", { activity: win.text })}`,
    { keyboard: pdWinsChoiceKeyboard(lang), markdown: true },
  );
}

async function handleWinsChoice(bot, chatId, session, action) {
  const lang = langOf(session);
  if (action === "wins_again") {
    return showWin(bot, chatId, session, session.data?.winKey);
  }
  // wins_do — save intent, offer an immediate "Done" button, and also
  // schedule the delayed check-in as a backup if the user forgets.
  const activity = t(lang, session.data?.winKey || WIN_KEYS[0]);
  saveProfileAnswer(session.user.id, "pd_last_win_activity", activity).catch(() => {});
  saveProfileAnswer(session.user.id, "pd_last_win_started_at", new Date().toISOString()).catch(() => {});
  await send(bot, chatId, t(lang, "pd_wins_go"), {
    keyboard: pdWinsGoKeyboard(lang),
    markdown: true,
  });
  // Fire the "did you complete it?" prompt after ~15 minutes. Best-effort:
  // if the process restarts the schedule is lost — acceptable for the MVP,
  // matching how the rest of the session lives in memory. The handle is
  // stashed so an early "Done" tap can cancel it.
  if (session.data?.winsTimer) clearTimeout(session.data.winsTimer);
  session.data = session.data || {};
  session.data.winsTimer = setTimeout(() => {
    if (session.data?.winsAnswered) return;
    send(bot, chatId, t(lang, "pd_wins_check"), {
      keyboard: pdWinsFollowupKeyboard(lang),
      markdown: true,
    }).catch(() => {});
  }, WINS_FOLLOWUP_MS);
}

async function handleWinsFollowup(bot, chatId, session, answer) {
  const lang = langOf(session);
  // Mark the round as answered and drop any pending delayed check-in so it
  // doesn't fire on top of an already-completed activity.
  session.data = session.data || {};
  session.data.winsAnswered = true;
  if (session.data.winsTimer) {
    clearTimeout(session.data.winsTimer);
    session.data.winsTimer = null;
  }
  saveProfileAnswer(session.user.id, "pd_last_win_completed", answer).catch(() => {});
  const key = answer === "yes" ? "pd_wins_yes" : "pd_wins_notyet";
  await send(bot, chatId, t(lang, key), { keyboard: pdBackKeyboard(lang), markdown: true });
}

// ---- My Gym Plan ----

async function startGym(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "prediabetes";
  session.step = "gym_q1";
  session.data = { gym: {} };
  await send(bot, chatId, `${t(lang, "pd_gym_title")}\n\n${t(lang, "pd_gym_intro")}\n\n${t(lang, "pd_gym_q1")}`, {
    keyboard: pdGymExperienceKeyboard(lang),
    markdown: true,
  });
}

async function askGymDays(bot, chatId, session) {
  const lang = langOf(session);
  session.step = "gym_q2";
  await send(bot, chatId, t(lang, "pd_gym_q2"), {
    keyboard: pdGymDaysKeyboard(lang),
    markdown: true,
  });
}

async function askGymGoal(bot, chatId, session) {
  const lang = langOf(session);
  session.step = "gym_q3";
  await send(bot, chatId, t(lang, "pd_gym_q3"), {
    keyboard: pdGymGoalKeyboard(lang),
    markdown: true,
  });
}

async function generateAndDeliverPlan(bot, chatId, session) {
  const lang = langOf(session);
  await send(bot, chatId, t(lang, "pd_gym_generating"), { markdown: true });
  const answers = session.data?.gym || {};
  let plan;
  try {
    plan = await generateGymPlan(session.user, answers);
  } catch (e) {
    console.error("generateGymPlan error:", e?.message);
    return send(bot, chatId, t(lang, "pd_gym_error"), {
      keyboard: pdBackKeyboard(lang),
      markdown: true,
    });
  }
  const record = { ...answers, plan, generated_at: new Date().toISOString() };
  saveProfileAnswer(session.user.id, "pd_gym_plan", JSON.stringify(record)).catch(() => {});
  session.state = "idle";
  session.step = null;
  await send(bot, chatId, t(lang, "pd_gym_saved", { plan }), {
    keyboard: pdGymDoneKeyboard(lang),
    markdown: true,
  });
}

// ---- Beat the Cravings ----

async function startCravings(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "prediabetes";
  session.step = "crav_drink";
  session.data = { crav: {} };
  await send(bot, chatId, `${t(lang, "pd_crav_title")}\n\n${t(lang, "pd_crav_intro")}\n\n${t(lang, "pd_crav_drink_q")}`, {
    keyboard: pdCravingsDrinkKeyboard(lang),
    markdown: true,
  });
}

async function askDrinkServings(bot, chatId, session, drink) {
  const lang = langOf(session);
  session.data.crav.drink = drink;
  session.step = "crav_drink_servings";
  await send(bot, chatId, t(lang, "pd_crav_drink_servings_q", { drink: sanitizeMd(drink) }), {
    markdown: true,
  });
}

async function askJunk(bot, chatId, session) {
  const lang = langOf(session);
  session.step = "crav_junk";
  await send(bot, chatId, t(lang, "pd_crav_junk_q"), {
    keyboard: pdCravingsJunkKeyboard(lang),
    markdown: true,
  });
}

async function askJunkFreq(bot, chatId, session, junk) {
  const lang = langOf(session);
  session.data.crav.junk = junk;
  session.step = "crav_junk_freq";
  await send(bot, chatId, t(lang, "pd_crav_junk_freq_q", { junk: sanitizeMd(junk) }), {
    markdown: true,
  });
}

async function shareVideoAndAskReflection(bot, chatId, session) {
  const lang = langOf(session);
  await send(bot, chatId, t(lang, "pd_crav_video"), { markdown: true });
  session.step = "crav_reflection";
  await send(bot, chatId, t(lang, "pd_crav_reflection_q"), { markdown: true });
}

async function askCommitment(bot, chatId, session) {
  const lang = langOf(session);
  session.step = "crav_commit";
  await send(bot, chatId, t(lang, "pd_crav_commit_q"), {
    keyboard: pdCravingsCommitKeyboard(lang),
    markdown: true,
  });
}

async function finishCravings(bot, chatId, session, commitment) {
  const lang = langOf(session);
  session.data.crav.commitment = commitment;
  const record = { ...session.data.crav, completed_at: new Date().toISOString() };
  saveProfileAnswer(session.user.id, "pd_cravings", JSON.stringify(record)).catch(() => {});
  saveProfileAnswer(session.user.id, "pd_commitment", commitment).catch(() => {});
  session.state = "idle";
  session.step = null;
  session.data = {};
  await send(bot, chatId, t(lang, "pd_crav_done", { commitment: sanitizeMd(commitment) }), {
    keyboard: pdBackKeyboard(lang),
    markdown: true,
  });
}

// ---- Text handler (called from bot.js state switch) ----

export async function prediabetesText(bot, chatId, session, text) {
  const lang = langOf(session);
  const value = (text || "").trim();
  if (!value) return;

  switch (session.step) {
    // Cravings: typed "Other" for drink
    case "crav_drink_other":
      return askDrinkServings(bot, chatId, session, value);
    // Cravings: typed servings for drink → move to junk
    case "crav_drink_servings":
      session.data.crav.drink_servings = value;
      return askJunk(bot, chatId, session);
    // Cravings: typed "Other" for junk
    case "crav_junk_other":
      return askJunkFreq(bot, chatId, session, value);
    // Cravings: typed frequency for junk → play video, ask reflection
    case "crav_junk_freq":
      session.data.crav.junk_freq = value;
      return shareVideoAndAskReflection(bot, chatId, session);
    // Cravings: typed reflection → move to commitment picker
    case "crav_reflection":
      session.data.crav.reflection = value;
      return askCommitment(bot, chatId, session);
    // Cravings: typed "Other" commitment → close out
    case "crav_commit_other":
      return finishCravings(bot, chatId, session, value);
    default:
      // Unknown step — fall back to the menu so the user isn't stuck.
      return showPrediabetes(bot, chatId, session);
  }
}

// ---- Callback dispatcher (called from bot.js `pd:` handler) ----

export async function dispatchPrediabetes(bot, chatId, session, action) {
  const lang = langOf(session);
  if (!isPrediabetes(session)) return showPrediabetes(bot, chatId, session);

  if (action === "menu") return showPrediabetes(bot, chatId, session);

  // 10-Minute Wins
  if (action === "wins") return showWin(bot, chatId, session);
  if (action === "wins_do" || action === "wins_again") {
    return handleWinsChoice(bot, chatId, session, action);
  }
  if (action === "wins_yes") return handleWinsFollowup(bot, chatId, session, "yes");
  if (action === "wins_notyet") return handleWinsFollowup(bot, chatId, session, "notyet");

  // Gym Plan
  if (action === "gym") return startGym(bot, chatId, session);
  if (action.startsWith("gymexp:")) {
    const val = action.slice("gymexp:".length);
    session.data = session.data || {};
    session.data.gym = { ...(session.data.gym || {}), experience: t(lang, GYM_EXP_LABELS[val] || "btn_pd_gym_exp_never") };
    return askGymDays(bot, chatId, session);
  }
  if (action.startsWith("gymdays:")) {
    const n = parseInt(action.slice("gymdays:".length), 10);
    session.data = session.data || {};
    session.data.gym = { ...(session.data.gym || {}), days: n === 5 ? "5+" : String(n) };
    return askGymGoal(bot, chatId, session);
  }
  if (action.startsWith("gymgoal:")) {
    const val = action.slice("gymgoal:".length);
    session.data = session.data || {};
    session.data.gym = { ...(session.data.gym || {}), goal: t(lang, GYM_GOAL_LABELS[val] || "btn_pd_gym_goal_fitness") };
    return generateAndDeliverPlan(bot, chatId, session);
  }

  // Cravings
  if (action === "cravings") return startCravings(bot, chatId, session);
  if (action.startsWith("drink:")) {
    const val = action.slice("drink:".length);
    if (val === "other") {
      session.step = "crav_drink_other";
      return send(bot, chatId, t(lang, "pd_crav_drink_other_q"), { markdown: true });
    }
    return askDrinkServings(bot, chatId, session, t(lang, DRINK_LABELS[val] || "btn_pd_drink_other"));
  }
  if (action.startsWith("junk:")) {
    const val = action.slice("junk:".length);
    if (val === "other") {
      session.step = "crav_junk_other";
      return send(bot, chatId, t(lang, "pd_crav_junk_other_q"), { markdown: true });
    }
    return askJunkFreq(bot, chatId, session, t(lang, JUNK_LABELS[val] || "btn_pd_junk_other"));
  }
  if (action.startsWith("commit:")) {
    const val = action.slice("commit:".length);
    if (val === "other") {
      session.step = "crav_commit_other";
      return send(bot, chatId, t(lang, "pd_crav_commit_other_q"), { markdown: true });
    }
    return finishCravings(bot, chatId, session, t(lang, COMMIT_LABELS[val] || "btn_pd_commit_water"));
  }

  return showPrediabetes(bot, chatId, session);
}
