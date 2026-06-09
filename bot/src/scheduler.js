// Proactive, TEMPLATE-ONLY messages (no AI cost): daily log reminders,
// streak protection, inactivity win-backs, and a weekly summary.
// Runs inside the bot process; only messages real Telegram users.

import { allActiveUsers, updateUser, weeklyStats } from "./supabase.js";
import { send } from "./utils.js";
import { t } from "./i18n.js";
import { estHbA1c } from "./clinic.js";

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

async function runTick(bot) {
  const { hour, dow, date } = nowParts();
  let users;
  try {
    users = await allActiveUsers();
  } catch (e) {
    return console.error("scheduler query:", e?.message);
  }
  if (!users?.length) return;

  for (const u of users) {
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

export function startScheduler(bot) {
  const tick = () => runTick(bot).catch((e) => console.error("scheduler:", e?.message));
  setInterval(tick, 15 * 60 * 1000); // every 15 minutes
  setTimeout(tick, 30 * 1000); // and shortly after boot
  console.log("   Scheduler on (reminders/streak/summary/inactivity, template-only).");
}
