// Habit Builder — Better Me → Build a New Habit (spec 2026-07).
//
// One active habit per user at a time. Users pick a habit from a 5-item
// library, optionally configure a target (water = glasses, sleep = bedtime),
// then activate. The daily 7-check-in cycle is delivered via a
// reminder_schedules row (category = 'habit_daily'); the scheduler renders
// the check-in question with rotating variations. See scheduler.js.
//
// Callback prefix: `bm:hb:*`, dispatched from betterme.js when the incoming
// `bm:` action starts with `habit`. That keeps the Better Me entry surface
// intact while giving Habit Builder its own namespace.

import { t } from "../i18n.js";
import { send, langOf, sanitizeMd } from "../utils.js";
import {
  hbLibraryKeyboard,
  hbWaterTargetKeyboard,
  hbSleepTimeKeyboard,
  hbActivationKeyboard,
  hbSummaryKeyboard,
  hbStopConfirmKeyboard,
  bmBackKeyboard,
} from "../keyboards.js";
import {
  getActiveUserHabit,
  getUserHabitById,
  createUserHabit,
  updateUserHabit,
  addReminderSchedule,
  deactivateReminder,
  upsertHabitCheckIn,
} from "../supabase.js";

// -------------------------------------------------------------------
// Habit definitions
// -------------------------------------------------------------------
//
// The library is intentionally static — the spec fixes exactly five habits,
// and the daily-question templates (bm_habit_q_*) also mirror them 1:1. Any
// new habit needs entries in i18n.js, keyboards.js (library button), and here.

const HABIT_LIB = {
  move: { name_key: "bm_habit_lib_move", setup: "text", intro_key: "bm_habit_setup_move" },
  water: { name_key: "bm_habit_lib_water", setup: "water" },
  sleep: { name_key: "bm_habit_lib_sleep", setup: "sleep" },
  smoke_free: { name_key: "bm_habit_lib_smoke_free", setup: "text", intro_key: "bm_habit_setup_smoke_free" },
  no_food_after_dinner: { name_key: "bm_habit_lib_no_food_after_dinner", setup: "text", intro_key: "bm_habit_setup_no_food_after_dinner" },
};

function habitDisplayName(lang, type) {
  const def = HABIT_LIB[type];
  return def ? t(lang, def.name_key) : type;
}

// -------------------------------------------------------------------
// Time helpers — PKT-aligned scheduling
// -------------------------------------------------------------------

const TZ_OFFSET = parseInt(process.env.REMINDER_TZ_OFFSET || "5", 10); // PKT default

// First-fire timestamp: tomorrow at 09:00 in the configured local timezone.
// Users who activate late at night still get their first check-in in the
// morning of the next calendar day, not just "24h from now".
function firstFireAt() {
  const nowUtc = Date.now();
  const nowLocal = new Date(nowUtc + TZ_OFFSET * 3600 * 1000);
  // Move to *tomorrow* in local time by taking the local date and adding a day
  const tomorrowLocalDay = new Date(Date.UTC(
    nowLocal.getUTCFullYear(),
    nowLocal.getUTCMonth(),
    nowLocal.getUTCDate() + 1,
    9, 0, 0
  ));
  const utcMs = tomorrowLocalDay.getTime() - TZ_OFFSET * 3600 * 1000;
  return new Date(utcMs).toISOString();
}

function todayLocalDate() {
  const d = new Date(Date.now() + TZ_OFFSET * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

// Format a 24h "HH:MM" as a friendly 12h string. Used inside daily check-in
// questions for the sleep habit (e.g. target_time = "22:30" → "10:30 PM").
export function formatTime12h(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || "");
  if (!m) return hhmm || "";
  let h = parseInt(m[1], 10);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${suffix}`;
}

// -------------------------------------------------------------------
// Entry point
// -------------------------------------------------------------------

export async function showHabitBuilder(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "betterme";
  session.step = null;
  session.data = session.data || {};

  const active = await getActiveUserHabit(session.user.id).catch(() => null);
  if (active) {
    return showActiveHabitSummary(bot, chatId, session, active);
  }

  session.step = "hb_pick";
  session.data.hb = {};
  await send(
    bot,
    chatId,
    `${t(lang, "bm_habit_title")}\n\n${t(lang, "bm_habit_intro")}`,
    { keyboard: hbLibraryKeyboard(lang), markdown: true },
  );
}

// -------------------------------------------------------------------
// Active-habit summary (spec §18)
// -------------------------------------------------------------------

function statusLabel(lang, habit) {
  const state = habit.lifecycle_state;
  if (habit.reminder_status === "disabled" || state === "reminders_disabled")
    return t(lang, "bm_habit_status_disabled");
  if (state === "paused") return t(lang, "bm_habit_status_paused");
  if (state === "setup_pending") return t(lang, "bm_habit_status_setup");
  return t(lang, "bm_habit_status_daily");
}

// completed / responded counts within the *current cycle* — Phase 1 shows
// zeros until a check-in is recorded; the scheduler is what advances them.
// Phase 2 will source these from an aggregate query on habit_check_ins.
async function showActiveHabitSummary(bot, chatId, session, habit) {
  const lang = langOf(session);
  session.step = null;
  session.data = {};

  const title = t(lang, "bm_habit_summary_title");
  const body = t(lang, "bm_habit_summary_body", {
    name: sanitizeMd(habit.habit_name || ""),
    status: statusLabel(lang, habit),
    streak: habit.current_streak ?? 0,
    completed: 0,
    responded: 0,
  });
  const guidance = t(lang, "bm_habit_already_active_body");
  await send(bot, chatId, `${title}\n\n${body}\n\n${guidance}`, {
    keyboard: hbSummaryKeyboard(lang, habit.id),
    markdown: true,
  });
}

// -------------------------------------------------------------------
// Setup flow
// -------------------------------------------------------------------

async function beginSetup(bot, chatId, session, habitType) {
  const lang = langOf(session);
  const def = HABIT_LIB[habitType];
  if (!def) return showHabitBuilder(bot, chatId, session);

  session.data = session.data || {};
  session.data.hb = { type: habitType, name: habitDisplayName(lang, habitType) };

  if (def.setup === "water") {
    session.step = "hb_water_pick";
    return send(bot, chatId, t(lang, "bm_habit_setup_water_q"), {
      keyboard: hbWaterTargetKeyboard(lang),
      markdown: true,
    });
  }
  if (def.setup === "sleep") {
    session.step = "hb_sleep_pick";
    return send(bot, chatId, t(lang, "bm_habit_setup_sleep_q"), {
      keyboard: hbSleepTimeKeyboard(lang),
      markdown: true,
    });
  }
  // No custom setup — show intro + activation card
  session.step = "hb_activate";
  const intro = t(lang, def.intro_key);
  const activation = t(lang, "bm_habit_activation_msg");
  return send(bot, chatId, `${intro}\n\n${activation}`, {
    keyboard: hbActivationKeyboard(lang),
    markdown: true,
  });
}

async function showActivation(bot, chatId, session) {
  const lang = langOf(session);
  session.step = "hb_activate";
  await send(bot, chatId, t(lang, "bm_habit_activation_msg"), {
    keyboard: hbActivationKeyboard(lang),
    markdown: true,
  });
}

// -------------------------------------------------------------------
// Activation (creates the user_habit + optional reminder_schedule)
// -------------------------------------------------------------------

async function activateHabit(bot, chatId, session, { withReminders }) {
  const lang = langOf(session);
  const hb = session.data?.hb;
  if (!hb?.type) return showHabitBuilder(bot, chatId, session);

  // Defence-in-depth alongside the DB's partial unique index. The user could
  // theoretically race two Start taps; the DB will still reject the second.
  const active = await getActiveUserHabit(session.user.id).catch(() => null);
  if (active) return showActiveHabitSummary(bot, chatId, session, active);

  const today = todayLocalDate();
  const created = await createUserHabit(session.user.id, {
    habit_type: hb.type,
    habit_name: hb.name || habitDisplayName(lang, hb.type),
    target_value: hb.target_value ?? null,
    target_unit: hb.target_unit ?? null,
    target_time: hb.target_time ?? null,
    lifecycle_state: "daily_cycle",
    habit_status: "active",
    reminder_status: withReminders ? "enabled" : "disabled",
    reminder_frequency: withReminders ? "daily" : "manual_only",
    current_cycle_number: 1,
    cycle_start_date: today,
    cycle_end_date: null,
  }).catch((e) => {
    console.error("createUserHabit:", e?.message);
    return null;
  });

  if (!created) {
    // Most likely: partial unique index rejected because another habit is
    // already active. Recover by showing the active habit.
    const now = await getActiveUserHabit(session.user.id).catch(() => null);
    if (now) return showActiveHabitSummary(bot, chatId, session, now);
    return send(bot, chatId, t(lang, "bm_habit_cancelled"), {
      keyboard: bmBackKeyboard(lang),
      markdown: true,
    });
  }

  if (withReminders) {
    const rem = await addReminderSchedule(session.user.id, {
      category: "habit_daily",
      target_id: created.id,
      label: created.habit_name,
      time_of_day: "09:00",
      frequency_days: 1,
      next_fire_at: firstFireAt(),
    }).catch((e) => {
      console.error("addReminderSchedule (habit):", e?.message);
      return null;
    });
    if (rem?.id) {
      await updateUserHabit(created.id, { reminder_schedule_id: rem.id }).catch(() => {});
    }
  }

  session.state = "idle";
  session.step = null;
  session.data = {};

  const key = withReminders ? "bm_habit_started_reminders" : "bm_habit_started_silent";
  await send(bot, chatId, t(lang, key), {
    keyboard: bmBackKeyboard(lang),
    markdown: true,
  });
}

// -------------------------------------------------------------------
// Daily-answer handling (Yes / Not Today / Stop Reminders)
// -------------------------------------------------------------------

async function handleDailyAnswer(bot, chatId, session, habitId, answer) {
  const lang = langOf(session);
  const habit = await getUserHabitById(habitId).catch(() => null);
  if (!habit || habit.user_id !== session.user.id) return; // silently ignore stale callbacks

  if (answer === "stop") {
    return promptStopConfirm(bot, chatId, session, habit);
  }

  const today = todayLocalDate();
  const completed = answer === "yes";
  await upsertHabitCheckIn({
    user_habit_id: habit.id,
    user_id: habit.user_id,
    log_date: today,
    response_status: completed ? "completed" : "not_completed",
    completed,
    response_received_at: new Date().toISOString(),
  }).catch((e) => console.error("upsertHabitCheckIn:", e?.message));

  // Streak book-keeping — increment on yes, reset on no (per spec §9).
  const nextStreak = completed ? (habit.current_streak || 0) + 1 : 0;
  const nextBest = Math.max(habit.best_streak || 0, nextStreak);
  await updateUserHabit(habit.id, {
    current_streak: nextStreak,
    best_streak: nextBest,
  }).catch(() => {});

  const ackKey = completed ? "bm_habit_ack_yes" : "bm_habit_ack_no";
  await send(bot, chatId, t(lang, ackKey), { markdown: true });
}

// -------------------------------------------------------------------
// Stop reminders
// -------------------------------------------------------------------

async function promptStopConfirm(bot, chatId, session, habit) {
  const lang = langOf(session);
  await send(bot, chatId, t(lang, "bm_habit_stop_confirm", {
    name: sanitizeMd(habit.habit_name || ""),
  }), {
    keyboard: hbStopConfirmKeyboard(lang, habit.id),
    markdown: true,
  });
}

async function stopReminders(bot, chatId, session, habitId) {
  const lang = langOf(session);
  const habit = await getUserHabitById(habitId).catch(() => null);
  if (!habit || habit.user_id !== session.user.id) return;

  if (habit.reminder_schedule_id) {
    await deactivateReminder(session.user.id, habit.reminder_schedule_id).catch(() => {});
  }
  await updateUserHabit(habit.id, {
    reminder_status: "disabled",
    reminder_frequency: "manual_only",
    lifecycle_state: "reminders_disabled",
  }).catch(() => {});

  await send(bot, chatId, t(lang, "bm_habit_stop_done", {
    name: sanitizeMd(habit.habit_name || ""),
  }), {
    keyboard: bmBackKeyboard(lang),
    markdown: true,
  });
}

// -------------------------------------------------------------------
// Text handler for the "Other amount / Other time" prompts
// -------------------------------------------------------------------

export async function habitBuilderText(bot, chatId, session, text) {
  const lang = langOf(session);
  const value = (text || "").trim();
  if (!value) return false;

  if (session.step === "hb_water_other") {
    const n = parseInt(value.replace(/[^\d]/g, ""), 10);
    if (!Number.isInteger(n) || n < 1 || n > 50) {
      await send(bot, chatId, t(lang, "bm_habit_setup_water_other_q"), { markdown: true });
      return true;
    }
    session.data.hb = { ...(session.data.hb || {}), target_value: n, target_unit: "glasses" };
    return showActivation(bot, chatId, session);
  }

  if (session.step === "hb_sleep_other") {
    const parsed = parseBedtime(value);
    if (!parsed) {
      await send(bot, chatId, t(lang, "bm_habit_setup_sleep_other_q"), { markdown: true });
      return true;
    }
    session.data.hb = { ...(session.data.hb || {}), target_time: parsed, target_unit: "time" };
    return showActivation(bot, chatId, session);
  }

  return false; // not a habit-builder step; caller should try other handlers
}

// Accepts "10:30 PM", "10:30pm", "22:30", "10 pm", "10:30". Returns "HH:MM" (24h).
function parseBedtime(input) {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i.exec(input.trim());
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const meridiem = m[3]?.toLowerCase();
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  if (meridiem === "pm" && h < 12) h += 12;
  if (meridiem === "am" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

// -------------------------------------------------------------------
// Callback dispatcher — called from betterme.js when action starts with
// "habit" (top-level entry) or "hb:" (sub-actions).
// -------------------------------------------------------------------

export async function dispatchHabitBuilder(bot, chatId, session, action) {
  const lang = langOf(session);

  // Entry point from Better Me menu.
  if (action === "habit") return showHabitBuilder(bot, chatId, session);

  if (!action.startsWith("hb:")) return showHabitBuilder(bot, chatId, session);
  const sub = action.slice("hb:".length);

  // Habit picker
  if (sub.startsWith("pick:")) {
    return beginSetup(bot, chatId, session, sub.slice("pick:".length));
  }

  // Target setters
  if (sub.startsWith("target:water:")) {
    const v = sub.slice("target:water:".length);
    if (v === "other") {
      session.step = "hb_water_other";
      return send(bot, chatId, t(lang, "bm_habit_setup_water_other_q"), { markdown: true });
    }
    const n = parseInt(v, 10);
    if (!Number.isInteger(n)) return showHabitBuilder(bot, chatId, session);
    session.data.hb = { ...(session.data.hb || {}), target_value: n, target_unit: "glasses" };
    return showActivation(bot, chatId, session);
  }
  if (sub.startsWith("target:sleep:")) {
    const v = sub.slice("target:sleep:".length);
    if (v === "other") {
      session.step = "hb_sleep_other";
      return send(bot, chatId, t(lang, "bm_habit_setup_sleep_other_q"), { markdown: true });
    }
    if (!/^\d{2}:\d{2}$/.test(v)) return showHabitBuilder(bot, chatId, session);
    session.data.hb = { ...(session.data.hb || {}), target_time: v, target_unit: "time" };
    return showActivation(bot, chatId, session);
  }

  // Activation
  if (sub === "activate") return activateHabit(bot, chatId, session, { withReminders: true });
  if (sub === "activate_silent") return activateHabit(bot, chatId, session, { withReminders: false });
  if (sub === "cancel") {
    session.state = "idle";
    session.step = null;
    session.data = {};
    return send(bot, chatId, t(lang, "bm_habit_cancelled"), {
      keyboard: bmBackKeyboard(lang),
      markdown: true,
    });
  }

  // Daily-answer callbacks from a scheduler-sent check-in.
  if (sub.startsWith("answer:")) {
    const rest = sub.slice("answer:".length);
    const idx = rest.lastIndexOf(":");
    if (idx < 0) return;
    const habitId = rest.slice(0, idx);
    const answer = rest.slice(idx + 1);
    return handleDailyAnswer(bot, chatId, session, habitId, answer);
  }

  // Stop-reminders flow
  if (sub.startsWith("stop_confirm:")) {
    return stopReminders(bot, chatId, session, sub.slice("stop_confirm:".length));
  }
  if (sub.startsWith("stop:")) {
    const habit = await getUserHabitById(sub.slice("stop:".length)).catch(() => null);
    if (!habit || habit.user_id !== session.user.id) return showHabitBuilder(bot, chatId, session);
    return promptStopConfirm(bot, chatId, session, habit);
  }

  return showHabitBuilder(bot, chatId, session);
}
