// Proactive, TEMPLATE-ONLY messages (no AI cost): daily log reminders,
// streak protection, inactivity win-backs, a weekly summary, and any
// user-created reminder schedules (Build 1).
// Runs inside the bot process. Each user is messaged on their OWN channel
// (WhatsApp or Telegram) by picking the matching virtual bot from `bots`.

import {
  allActiveUsers,
  updateUser,
  weeklyStats,
  dueReminders,
  markReminderFired,
  goalsDueForReview,
  updateGoal,
} from "./supabase.js";
import { send, sanitizeMd } from "./utils.js";
import { t } from "./i18n.js";
import { estHbA1c } from "./clinic.js";
import { goalReviewKeyboard } from "./keyboards.js";

const TZ_OFFSET = parseInt(process.env.REMINDER_TZ_OFFSET || "5", 10); // PKT default
const HOUR_REMINDER = parseInt(process.env.HOUR_REMINDER || "8", 10);
const HOUR_WINBACK = parseInt(process.env.HOUR_WINBACK || "18", 10);
const HOUR_STREAK = parseInt(process.env.HOUR_STREAK || "20", 10);
const HOUR_SUMMARY = parseInt(process.env.HOUR_SUMMARY || "9", 10); // Sundays

function nowParts() {
  const d = new Date(Date.now() + TZ_OFFSET * 3600 * 1000);
  return { hour: d.getUTCHours(), dow: d.getUTCDay(), date: d.toISOString().slice(0, 10) };
}
const daysSince = (ts) => (ts ? (Date.now() - new Date(ts).getTime()) / 86400000 : 9999);

// Pick the virtual bot for a user's channel. Falls back to whichever channel is
// configured so a user is never silently skipped if `source` is missing.
function botFor(bots, user) {
  const src = user.source || "telegram";
  return bots[src] || bots.whatsapp || bots.telegram || null;
}

// Build 1: user-created reminder schedules — fire any that are due, then bump
// next_fire_at by frequency_days. Uses the same users list the rest of the
// tick already loaded, so we don't add an extra round-trip.
async function fireDueReminders(bots, usersById) {
  let due;
  try {
    due = await dueReminders(new Date().toISOString());
  } catch (e) {
    return console.error("reminders query:", e?.message);
  }
  if (!due?.length) return;
  for (const r of due) {
    const u = usersById.get(r.user_id);
    if (!u) continue;
    const bot = botFor(bots, u);
    if (!bot) continue;
    const lang = u.language || "en";
    const templateKey = `reminder_template_${r.category}`;
    const body = t(lang, templateKey, { name: r.label || "" });
    try {
      await send(bot, u.telegram_id, body, { markdown: true });
      const nextIso = bumpNextFire(r);
      await markReminderFired(r.id, nextIso);
    } catch (e) {
      console.error("reminder send/mark:", e?.message);
    }
  }
}

async function fireGoalReviews(bots, usersById) {
  let due;
  try {
    due = await goalsDueForReview(new Date().toISOString().slice(0, 10));
  } catch (e) {
    return console.error("goal reviews query:", e?.message);
  }
  if (!due?.length) return;
  for (const g of due) {
    const u = usersById.get(g.user_id);
    if (!u) continue;
    const bot = botFor(bots, u);
    if (!bot) continue;
    const lang = u.language || "en";
    try {
      await send(
        bot,
        u.telegram_id,
        t(lang, "goal_review_prompt", { goal: sanitizeMd(g.title || "") }),
        { keyboard: goalReviewKeyboard(lang, g.id), markdown: true },
      );
      await updateGoal(u.id, g.id, { review_sent_at: new Date().toISOString() });
    } catch (e) {
      console.error("goal review send:", e?.message);
    }
  }
}

function bumpNextFire(r) {
  const period = (r.frequency_days || 1) * 86400 * 1000;
  const base = r.next_fire_at ? new Date(r.next_fire_at).getTime() : Date.now();
  let next = base + period;
  // skip past any further missed periods so we don't burst on restart
  while (next <= Date.now()) next += period;
  return new Date(next).toISOString();
}

async function runTick(bots) {
  const { hour, dow, date } = nowParts();
  let users;
  try {
    users = await allActiveUsers();
  } catch (e) {
    return console.error("scheduler query:", e?.message);
  }
  if (!users?.length) return;

  // Fire user-created reminders (Build 1). Independent of the daily-template
  // logic below — both can run on the same tick.
  const usersById = new Map(users.map((u) => [u.id, u]));
  await fireDueReminders(bots, usersById);

  // Goal target-date reviews (2026-07 spec). Fires once per goal whose
  // target_date is on or before today. We stamp review_sent_at so a goal
  // never gets asked twice — the user's answer resets it if they update
  // the target from the review flow.
  await fireGoalReviews(bots, usersById);

  for (const u of users) {
    const bot = botFor(bots, u);
    if (!bot) continue; // no configured channel for this user
    const lang = u.language || "en";
    const chat = u.telegram_id;
    try {
      // 1) Morning reminder to log fasting sugar
      if (hour === HOUR_REMINDER && u.last_reminder_date !== date && u.last_log_date !== date) {
        await send(bot, chat, t(lang, "reminder_daily"), { markdown: true });
        await updateUser(u.id, { last_reminder_date: date });
        continue;
      }
      // 2) Weekly summary (Sunday)
      if (dow === 0 && hour === HOUR_SUMMARY && u.last_summary_date !== date) {
        const s = await weeklyStats(u.id);
        if (s.glucoseCount > 0 || s.medicationCount > 0 || s.healthCount > 0) {
          await send(
            bot,
            chat,
            t(lang, "summary_push", {
              count: s.glucoseCount,
              avg: s.glucoseAvg ?? "-",
              min: s.glucoseMin ?? "-",
              max: s.glucoseMax ?? "-",
              hba1c: estHbA1c(s.glucoseAvg) ?? "-",
              streak: u.streak || 0,
            }),
            { markdown: true }
          );
        }
        await updateUser(u.id, { last_summary_date: date });
        continue;
      }
      // 3) Streak protection (evening)
      if (hour === HOUR_STREAK && (u.streak || 0) > 0 && u.last_log_date !== date && u.last_streak_date !== date) {
        await send(bot, chat, t(lang, "reminder_streak", { streak: u.streak }), { markdown: true });
        await updateUser(u.id, { last_streak_date: date });
        continue;
      }
      // 4) Inactivity win-back (>= 3 days idle, at most once every 4 days)
      if (hour === HOUR_WINBACK && daysSince(u.last_seen) >= 3 && daysSince(u.last_winback_date) >= 4) {
        await send(bot, chat, t(lang, "reminder_winback"), { markdown: true });
        await updateUser(u.id, { last_winback_date: date });
      }
    } catch (e) {
      // invalid chat (e.g. user blocked the bot) — skip quietly
    }
  }
}

// `bots` maps a user `source` ("whatsapp" / "telegram") to its virtual bot.
// A missing channel is simply skipped — see botFor().
export function startScheduler(bots = {}) {
  if (!bots.whatsapp && !bots.telegram) {
    console.log("   Scheduler off (no messaging channel configured).");
    return;
  }
  const tick = () => runTick(bots).catch((e) => console.error("scheduler:", e?.message));
  setInterval(tick, 15 * 60 * 1000); // every 15 minutes
  setTimeout(tick, 30 * 1000); // and shortly after boot
  console.log("   Scheduler on (reminders/streak/summary/inactivity, template-only).");
}
