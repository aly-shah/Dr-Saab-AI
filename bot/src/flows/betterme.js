import { t } from "../i18n.js";
import { send, langOf } from "../utils.js";
import {
  betterMeMenuKeyboard,
  bmFitExperienceKeyboard,
  bmFitDaysKeyboard,
  bmFitGoalKeyboard,
  bmFitDoneKeyboard,
  bmWinsChoiceKeyboard,
  bmBackKeyboard,
} from "../keyboards.js";
import {
  saveProfileAnswer,
  listWinLogsSince,
  getTodayWinLog,
  upsertWinLogForDate,
  bumpWinCounter,
} from "../supabase.js";
import { generateFitnessPlan } from "../openai.js";
import { dispatchHabitBuilder, habitBuilderText } from "./habitbuilder.js";

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
// Build a New Habit — lives in flows/habitbuilder.js. Kept out of this
// file so the lifecycle state machine and reminder wiring stay in one place.
// ===================================================================

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
// 10-Minute Wins — spec 2026-07
// -------------------------------------------------------------------
// One challenge per calendar day. Rotation excludes anything shown in the
// last 5 days; if the pool is empty we reset with only yesterday excluded.
// The user gets one swap per day (recorded in-place via replacement_used);
// after that we replay the same challenge on re-entry. Done/Skip lock in
// the outcome and bump the user's counters — no streaks, no follow-ups.
// ===================================================================

const WIN_TZ_OFFSET = parseInt(process.env.REMINDER_TZ_OFFSET || "5", 10); // PKT default

// The library is intentionally static. Each entry contributes one library
// button and two i18n keys (title + description).
const WIN_CHALLENGES = [
  { id: "walk",      title_key: "bm_win_walk_title",      desc_key: "bm_win_walk_desc" },
  { id: "stretch",   title_key: "bm_win_stretch_title",   desc_key: "bm_win_stretch_desc" },
  { id: "water",     title_key: "bm_win_water_title",     desc_key: "bm_win_water_desc" },
  { id: "declutter", title_key: "bm_win_declutter_title", desc_key: "bm_win_declutter_desc" },
  { id: "unplug",    title_key: "bm_win_unplug_title",    desc_key: "bm_win_unplug_desc" },
];
const WIN_BY_ID = Object.fromEntries(WIN_CHALLENGES.map((c) => [c.id, c]));
const WIN_ENCOURAGEMENTS = ["bm_wins_enc_1", "bm_wins_enc_2", "bm_wins_enc_3"];

function localToday() {
  const d = new Date(Date.now() + WIN_TZ_OFFSET * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}
function isoDateOffset(days) {
  const ms = Date.now() + WIN_TZ_OFFSET * 3600 * 1000 + days * 86400 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

// Pick a challenge respecting:
//   • hard rule: never yesterday's pick
//   • soft rule: no repeats in the last 5 calendar days
// Reset the pool (only yesterday excluded) if the soft rule leaves us empty.
function pickChallenge(recentLogs) {
  const yesterday = isoDateOffset(-1);
  const yesterdayId = recentLogs.find((r) => r.challenge_date === yesterday)?.challenge_id;
  const recent5Ids = new Set(recentLogs.map((r) => r.challenge_id));

  let pool = WIN_CHALLENGES.filter((c) => !recent5Ids.has(c.id));
  if (pool.length === 0) {
    pool = WIN_CHALLENGES.filter((c) => c.id !== yesterdayId);
  }
  if (pool.length === 0) pool = WIN_CHALLENGES; // ultra-fallback
  return pool[Math.floor(Math.random() * pool.length)];
}

function renderChallenge(lang, challenge) {
  return t(lang, "bm_wins_prompt", {
    title: t(lang, challenge.title_key),
    desc: t(lang, challenge.desc_key),
  });
}

async function showWin(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "idle";
  session.step = null;

  const today = localToday();
  const existing = await getTodayWinLog(session.user.id, today).catch(() => null);

  // Same-day re-entry after answering: friendly "come back tomorrow" screen.
  if (existing && existing.status && existing.status !== "no_response") {
    const key = existing.status === "completed" ? "bm_wins_already_done" : "bm_wins_already_skipped";
    return send(bot, chatId, t(lang, key), {
      keyboard: bmBackKeyboard(lang),
      markdown: true,
    });
  }

  // Same-day re-entry before answering: replay the same challenge, don't
  // re-pick — otherwise the user would appear to have "unlimited swaps".
  let challenge;
  if (existing?.challenge_id && WIN_BY_ID[existing.challenge_id]) {
    challenge = WIN_BY_ID[existing.challenge_id];
  } else {
    const since = isoDateOffset(-5);
    const recent = await listWinLogsSince(session.user.id, since).catch(() => []);
    challenge = pickChallenge(recent);
    await upsertWinLogForDate(session.user.id, today, {
      challenge_id: challenge.id,
      challenge_name: t(lang, challenge.title_key),
      status: "no_response",
      replacement_used: false,
    }).catch((e) => console.error("upsertWinLogForDate:", e?.message));
  }

  await send(
    bot, chatId,
    `${t(lang, "bm_wins_title")}\n\n${renderChallenge(lang, challenge)}`,
    { keyboard: bmWinsChoiceKeyboard(lang), markdown: true },
  );
}

async function swapWin(bot, chatId, session) {
  const lang = langOf(session);
  const today = localToday();
  const existing = await getTodayWinLog(session.user.id, today).catch(() => null);

  // No log yet (edge case: user tapped Swap before the entry showed a
  // challenge) — treat it like a first open.
  if (!existing) return showWin(bot, chatId, session);

  // Already answered — swap doesn't reopen a settled day.
  if (existing.status && existing.status !== "no_response") {
    return showWin(bot, chatId, session);
  }

  // Already used the daily swap: replay the current challenge with a note.
  if (existing.replacement_used) {
    const current = WIN_BY_ID[existing.challenge_id];
    const note = t(lang, "bm_wins_swap_used");
    const body = current
      ? `${note}\n\n${renderChallenge(lang, current)}`
      : note;
    return send(bot, chatId, body, {
      keyboard: bmWinsChoiceKeyboard(lang),
      markdown: true,
    });
  }

  // Perform the swap: pick a new challenge (respecting rotation, and also
  // excluding the one we're replacing so the swap is meaningful).
  const since = isoDateOffset(-5);
  const recent = await listWinLogsSince(session.user.id, since).catch(() => []);
  const augmented = existing.challenge_id
    ? [{ challenge_id: existing.challenge_id, challenge_date: today }, ...recent.filter((r) => r.challenge_date !== today)]
    : recent;
  const next = pickChallenge(augmented);
  await upsertWinLogForDate(session.user.id, today, {
    challenge_id: next.id,
    challenge_name: t(lang, next.title_key),
    status: "no_response",
    replacement_used: true,
  }).catch((e) => console.error("upsertWinLogForDate (swap):", e?.message));

  await send(
    bot, chatId,
    `${t(lang, "bm_wins_title")}\n\n${renderChallenge(lang, next)}`,
    { keyboard: bmWinsChoiceKeyboard(lang), markdown: true },
  );
}

async function handleWinOutcome(bot, chatId, session, outcome) {
  const lang = langOf(session);
  const today = localToday();
  const existing = await getTodayWinLog(session.user.id, today).catch(() => null);

  // Silent no-op if there is no active challenge — prevents double-counting
  // when a stale button is tapped after a same-day re-entry lock.
  if (!existing || (existing.status && existing.status !== "no_response")) {
    return showWin(bot, chatId, session);
  }

  await upsertWinLogForDate(session.user.id, today, {
    challenge_id: existing.challenge_id,
    challenge_name: existing.challenge_name,
    status: outcome === "done" ? "completed" : "skipped",
    replacement_used: existing.replacement_used,
  }).catch(() => {});

  const u = await bumpWinCounter(session.user.id, outcome === "done" ? "completed" : "skipped").catch(() => null);
  if (u) session.user = u;

  const msg = outcome === "done"
    ? t(lang, WIN_ENCOURAGEMENTS[Math.floor(Math.random() * WIN_ENCOURAGEMENTS.length)])
    : t(lang, "bm_wins_ack_skip");

  await send(bot, chatId, msg, { keyboard: bmBackKeyboard(lang), markdown: true });
}

// ===================================================================
// My Health Journey — removed 2026-07-14. The health summary now lives
// exclusively in My Health; a second Better-Me entry was redundant.
// ===================================================================

// ---- Text handler (called from bot.js state switch) ----

export async function bettermeText(bot, chatId, session, text) {
  const lang = langOf(session);
  const value = (text || "").trim();
  if (!value) return;

  // Habit Builder owns any hb_* step (typed "Other amount" / "Other time").
  if (typeof session.step === "string" && session.step.startsWith("hb_")) {
    const handled = await habitBuilderText(bot, chatId, session, value);
    if (handled) return;
  }

  // Unknown step — fall back to the menu so the user isn't stuck. All
  // remaining Better Me text-driven flows currently live in Habit Builder,
  // handled above via habitBuilderText.
  return showBetterMe(bot, chatId, session);
}

// ---- Callback dispatcher (called from bot.js `bm:` handler) ----

export async function dispatchBetterMe(bot, chatId, session, action) {
  const lang = langOf(session);

  // Habit Builder sub-actions (hb:answer:*, hb:stop:*) come from
  // scheduler-sent messages that may land while the user's session is idle
  // and even if their profile has since changed. Route them before the
  // healthier gate so a user can always answer or silence their own habit.
  if (action.startsWith("hb:")) {
    return dispatchHabitBuilder(bot, chatId, session, action);
  }

  if (!isHealthier(session)) return showBetterMe(bot, chatId, session);

  if (action === "menu") return showBetterMe(bot, chatId, session);

  // Entry into Habit Builder from the Better Me menu (still gated on
  // healthier, above — matching every other bm:* menu entry).
  if (action === "habit") {
    return dispatchHabitBuilder(bot, chatId, session, action);
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

  // 10-Minute Wins (spec 2026-07)
  if (action === "wins") return showWin(bot, chatId, session);
  if (action === "w:done") return handleWinOutcome(bot, chatId, session, "done");
  if (action === "w:skip") return handleWinOutcome(bot, chatId, session, "skip");
  if (action === "w:swap") return swapWin(bot, chatId, session);

  return showBetterMe(bot, chatId, session);
}
