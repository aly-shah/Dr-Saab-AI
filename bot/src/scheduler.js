// Proactive template messages — no live LLM cost. Two paths run inside
// the bot process:
//
//   1. The Engagement Engine's Daily Message Composer (Build 1). Once per
//      active user per day, at MSG_COMPOSER_HOUR (PKT), it composes a
//      single system message from admin-editable blocks and sends it on
//      the user's own channel (WhatsApp or Telegram). At most one row per
//      (user_id, date) lands in daily_message_log — the DB unique index
//      is the source of truth for "already sent today".
//
//   2. Per-user reminder schedules. These are transactional (the user
//      themselves created the reminder), so they run independently of the
//      composer and are not constrained by the 1/day system-message cap.
//
// The pre-Build-1 morning-reminder / streak / weekly-summary / winback
// branches have been removed — the composer replaces all four with
// per-user personalised blocks. Their i18n keys stay in the translation
// file for now; other code may still reference them.
//
// Each user is messaged on their OWN channel by picking the matching
// virtual bot from `bots`.

import {
  allActiveUsers,
  alreadySentToday,
  dueReminders,
  logDailyMessage,
  markReminderFired,
} from "./supabase.js";
import { send } from "./utils.js";
import { t } from "./i18n.js";
import { composeDailyMessage } from "./composer.js";
import { config } from "./config.js";

const TZ_OFFSET = parseInt(process.env.REMINDER_TZ_OFFSET || "5", 10); // PKT default

function nowParts() {
  const d = new Date(Date.now() + TZ_OFFSET * 3600 * 1000);
  return { hour: d.getUTCHours(), date: d.toISOString().slice(0, 10) };
}

// Pick the virtual bot for a user's channel. Falls back to whichever channel is
// configured so a user is never silently skipped if `source` is missing.
function botFor(bots, user) {
  const src = user.source || "telegram";
  return bots[src] || bots.whatsapp || bots.telegram || null;
}

// Resolve the transport-level "chat id" for a user. Telegram uses the
// numeric id; WhatsApp uses the E.164 phone number. Handles legacy rows
// where a WhatsApp user's phone lived in telegram_id before the identity
// split.
function chatIdFor(user) {
  if ((user.source || "telegram") === "whatsapp") {
    return user.phone_number || user.telegram_id;
  }
  return user.telegram_id;
}

// Build 1: user-created reminder schedules — fire any that are due, then
// bump next_fire_at by frequency_days. Independent of the composer cap.
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
    const chat = chatIdFor(u);
    if (!bot || !chat) continue;
    const lang = u.language || "en";
    const templateKey = `reminder_template_${r.category}`;
    const body = t(lang, templateKey, { name: r.label || "" });
    try {
      await send(bot, chat, body, { markdown: true });
      const nextIso = bumpNextFire(r);
      await markReminderFired(r.id, nextIso);
    } catch (e) {
      console.error("reminder send/mark:", e?.message);
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

// Fire the daily composer for every eligible user once per day. Guards:
//   • only at the configured composer hour (a 15-minute tick may see the
//     hour twice, but the DB unique constraint stops a duplicate send);
//   • skip users with a row for today already (fast path — avoids the
//     compose work when we know we're going to fail the unique insert);
//   • composeDailyMessage returns null for Inactive users → skip;
//   • log first, then send. On successful log-insert send; if the log
//     insert lost the race with another instance, skip the send — the
//     other instance's message has already gone.
async function fireDailyComposer(bots, users, todayDate) {
  for (const u of users) {
    const bot = botFor(bots, u);
    const chat = chatIdFor(u);
    if (!bot || !chat) continue;
    try {
      if (await alreadySentToday(u.id, todayDate)) continue;
      const composed = await composeDailyMessage(u);
      if (!composed) continue;
      const inserted = await logDailyMessage({
        user_id: u.id,
        date: todayDate,
        engagement_score: composed.engagement_score,
        engagement_level: composed.engagement_level,
        block_ids: composed.block_ids,
        message: composed.text,
        channel: u.source || "telegram",
      });
      if (!inserted) continue; // another instance already sent — skip
      console.log(
        `composer: sent ${composed.block_ids.join("+")} to ${u.id} (${composed.engagement_level}/${composed.engagement_score})`
      );
      await send(bot, chat, composed.text, { markdown: false });
    } catch (e) {
      // A broken chat (blocked bot, invalid number) shouldn't stop the tick.
      console.error("composer tick:", u.id, e?.message);
    }
  }
}

async function runTick(bots) {
  const { hour, date } = nowParts();
  let users;
  try {
    users = await allActiveUsers();
  } catch (e) {
    return console.error("scheduler query:", e?.message);
  }
  if (!users?.length) return;

  const usersById = new Map(users.map((u) => [u.id, u]));

  // Independent, user-opted-in paths — run every tick.
  await fireDueReminders(bots, usersById);

  // Composer path — runs once per day at the configured hour. The DB
  // unique constraint (user_id, date) is the ultimate idempotency guard,
  // so a late tick that catches the hour a second time won't double-send.
  if (hour === config.composer.hour) {
    await fireDailyComposer(bots, users, date);
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
  console.log(
    `   Scheduler on (composer at ${config.composer.hour}:00 PKT, plus reminders).`
  );
}
