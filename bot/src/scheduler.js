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
  getUserHabitById,
  updateUserHabit,
  upsertHabitCheckIn,
  getUserChallengeById,
  updateUserChallenge,
  getChallengeDefById,
  listChallengesToExpire,
  listDueChallengeDoctorNotifications,
  markChallengeDoctorNotificationSent,
  getDoctorById,
  enqueueChallengeDoctorNotification,
  lastDoctorNotificationOfType,
} from "./supabase.js";
import { send, sanitizeMd } from "./utils.js";
import { t } from "./i18n.js";
import { composeDailyMessage } from "./composer.js";
import { config } from "./config.js";
import { hbDailyKeyboard, chalHba1cFinalKeyboard } from "./keyboards.js";
import { formatTime12h } from "./flows/habitbuilder.js";
import { computeAndPersistScores } from "./flows/challengeEngine.js";

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
    try {
      // Habit Builder daily check-in: rotating variation + inline Yes/Not
      // Today/Stop Reminders keyboard. Falls back to the generic template
      // path if the habit row can't be loaded (e.g. removed between the
      // dueReminders read and now).
      if (r.category === "habit_daily") {
        const rendered = await renderHabitCheckIn(r, lang);
        if (rendered) {
          await send(bot, chat, rendered.text, {
            keyboard: rendered.keyboard,
            markdown: true,
          });
          const nextIso = bumpNextFire(r);
          await markReminderFired(r.id, nextIso);
          continue;
        }
      }
      // Challenges v1.0 daily/weekly check-in prompt.
      // §13 requires challenge nudges to stay within the "one combined
      // system message per user per day" rule. If the composer has already
      // sent today's message, we defer the challenge nudge by a day so the
      // user isn't double-messaged — the final-result prompt is *not*
      // subject to this cap (it's transactional).
      if (r.category === "challenge_checkin") {
        const today = todayLocalDate();
        const already = await alreadySentToday(u.id, today).catch(() => false);
        if (already) {
          const skipIso = new Date(Date.now() + 86400 * 1000).toISOString();
          await markReminderFired(r.id, skipIso);
          continue;
        }
        const rendered = await renderChallengeCheckin(r, lang);
        if (rendered) {
          await send(bot, chat, rendered.text, { markdown: true });
          const nextIso = bumpNextFire(r);
          await markReminderFired(r.id, nextIso);
          continue;
        }
      }
      // Challenges v1.0 HbA1c final-result prompt (fires from ~7 days before
      // end_date until the user submits or the challenge auto-expires).
      if (r.category === "challenge_final_result_prompt") {
        const rendered = await renderChallengeFinalPrompt(r, lang);
        if (rendered) {
          await send(bot, chat, rendered.text, {
            keyboard: rendered.keyboard, markdown: true,
          });
          const nextIso = bumpNextFire(r);
          await markReminderFired(r.id, nextIso);
          continue;
        }
      }
      const templateKey = `reminder_template_${r.category}`;
      const body = t(lang, templateKey, { name: r.label || "" });
      await send(bot, chat, body, { markdown: true });
      const nextIso = bumpNextFire(r);
      await markReminderFired(r.id, nextIso);
    } catch (e) {
      console.error("reminder send/mark:", e?.message);
    }
  }
}

// Habit Builder daily check-in renderer. Picks the next variation (1/2/3)
// without repeating yesterday's, seeds a habit_check_ins row with the sent
// timestamp, and returns text + inline keyboard for send(). Returns null if
// the habit row is missing or its reminders have been disabled.
async function renderHabitCheckIn(reminderRow, lang) {
  const habit = await getUserHabitById(reminderRow.target_id).catch(() => null);
  if (!habit) return null;
  if (habit.reminder_status !== "enabled") return null;

  const questionKey = `bm_habit_q_${habit.habit_type}`;
  const questionArgs = {};
  if (habit.habit_type === "water") questionArgs.target = habit.target_value ?? "";
  if (habit.habit_type === "sleep") questionArgs.target = formatTime12h(habit.target_time || "");
  const question = t(lang, questionKey, questionArgs);

  const variation = pickVariation(habit);
  let text;
  if (variation === 3) {
    const streak = habit.current_streak || 0;
    const key = streak > 0 ? "bm_habit_daily_v3" : "bm_habit_daily_v3_zero";
    text = t(lang, key, { question, streak, name: habit.habit_name || "" });
  } else {
    text = t(lang, `bm_habit_daily_v${variation}`, { question });
  }

  const nowIso = new Date().toISOString();
  const today = todayLocalDate();
  await upsertHabitCheckIn({
    user_habit_id: habit.id,
    user_id: habit.user_id,
    log_date: today,
    reminder_sent_at: nowIso,
    message_variation_id: variation,
  }).catch((e) => console.error("upsert habit_check_in:", e?.message));
  await updateUserHabit(habit.id, { last_variation: variation }).catch(() => {});

  return { text, keyboard: hbDailyKeyboard(lang, habit.id) };
}

// Rotate 1 → 2 → 3 → 1 …, but never send the same variation two days in a
// row. Deterministic enough to be readable, random enough that fresh users
// don't always start with variation 1.
function pickVariation(habit) {
  const last = habit.last_variation;
  if (!last) return 1 + Math.floor(Math.random() * 3);
  return (last % 3) + 1;
}

function todayLocalDate() {
  const d = new Date(Date.now() + TZ_OFFSET * 3600 * 1000);
  return d.toISOString().slice(0, 10);
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

// -------------------------------------------------------------------
// Challenges v1.0 — render helpers, doctor notifications, auto-expire
// -------------------------------------------------------------------

// Pick the right supportive template per challenge type. Returns null if
// the challenge row has vanished (removed / cascade-deleted).
async function renderChallengeCheckin(reminderRow, lang) {
  const uc = await getUserChallengeById(reminderRow.target_id).catch(() => null);
  if (!uc || !["active", "joined"].includes(uc.status)) return null;
  const def = uc.challenge_id ? await getChallengeDefById(uc.challenge_id).catch(() => null) : null;
  const type = def?.challenge_type || uc.challenge_type;
  if (type === "activity") {
    return { text: t(lang, "chal_reminder_activity", { active_days: uc.outcome_value || 0 }) };
  }
  if (type === "healthy_plate") {
    return { text: t(lang, "chal_reminder_healthy_plate", { count: uc.outcome_value || 0 }) };
  }
  return { text: t(lang, "chal_reminder_hba1c") };
}

async function renderChallengeFinalPrompt(reminderRow, lang) {
  const uc = await getUserChallengeById(reminderRow.target_id).catch(() => null);
  if (!uc || uc.final_value != null) return null;
  if (!["active", "awaiting_final_result"].includes(uc.status)) return null;

  // Flip status so the Challenges hub reflects the pending action.
  if (uc.status !== "awaiting_final_result") {
    await updateUserChallenge(uc.id, { status: "awaiting_final_result" }).catch(() => {});
  }

  const kb = chalHba1cFinalKeyboard(lang);
  // Rewrite the "Upload" / "Enter" callbacks to carry the specific uc id so
  // the flow knows which row to attach the final result to.
  for (const row of kb.inline_keyboard || []) {
    for (const btn of row) {
      if (btn.callback_data === "chal:hba1c_final_upload_hint"
        || btn.callback_data === "chal:hba1c_final_enter_hint") {
        btn.callback_data = `chal:hba1c_final:${uc.id}`;
      }
    }
  }

  const text =
    `${t(lang, "chal_hba1c_final_prompt_title")}\n\n${t(lang, "chal_hba1c_final_prompt_body")}`;
  return { text, keyboard: kb };
}

// Fire doctor notifications queued by the challenges engine. Rate-limited
// per doctor per day so a busy doctor doesn't get spammed by every patient
// event — the "one combined system message per user per day" spec rule
// applies here too.
async function fireDoctorNotifications(bots, usersById, doctorLastSentByDay) {
  const nowIso = new Date().toISOString();
  const due = await listDueChallengeDoctorNotifications(nowIso).catch(() => []);
  if (!due.length) return;
  for (const n of due) {
    try {
      const doctor = await getDoctorById(n.doctor_id).catch(() => null);
      if (!doctor) { await markChallengeDoctorNotificationSent(n.id).catch(() => {}); continue; }
      const doctorUser = usersById.get(doctor.user_id);
      if (!doctorUser) { await markChallengeDoctorNotificationSent(n.id).catch(() => {}); continue; }

      // Per-doctor per-day cap. `joined` / `completed` messages always fire
      // since they're one-shot; only `weekly_update` obeys the daily cap.
      const dayKey = new Date().toISOString().slice(0, 10);
      const doctorKey = `${doctor.id}:${dayKey}`;
      if (n.notification_type === "weekly_update" && doctorLastSentByDay.has(doctorKey)) {
        continue; // leave sent_at null so we retry tomorrow
      }

      const bot = botFor(bots, doctorUser);
      const chat = chatIdFor(doctorUser);
      if (!bot || !chat) { await markChallengeDoctorNotificationSent(n.id).catch(() => {}); continue; }
      const lang = doctorUser.language || "en";
      const patientUser = usersById.get(n.user_id) || {};
      const patientName = sanitizeMd(patientUser.name || "patient");
      const p = n.payload || {};
      let text;
      if (n.notification_type === "joined") {
        text = t(lang, "chal_dr_joined", {
          patient: patientName,
          challenge: p.challenge_name || "Challenge",
          start: p.start_date || "—",
          end: p.end_date || "—",
        });
      } else if (n.notification_type === "completed") {
        const isHba1c = p.challenge_type === "hba1c";
        const fmtVal = (v) => (v == null ? "—" : isHba1c ? `${Number(v).toFixed(1)}%` : String(v));
        const outcomeStr = isHba1c && p.outcome_value != null
          ? (p.outcome_value >= 0
              ? `↓ ${Number(p.outcome_value).toFixed(1)} pp`
              : `↑ ${(-Number(p.outcome_value)).toFixed(1)} pp`)
          : (p.outcome_value != null ? String(p.outcome_value) : "—");
        text = t(lang, "chal_dr_completed", {
          patient: patientName,
          challenge: p.challenge_name || p.challenge_type || "Challenge",
          baseline: fmtVal(p.baseline_value),
          final: fmtVal(p.final_value),
          outcome: outcomeStr,
          participation: p.participation_points ?? "—",
          rank: p.rank != null ? `${p.rank}${p.total ? "/" + p.total : ""}` : "—",
          percentile: p.percentile != null ? `${p.percentile}` : "—",
          status: p.status || "completed",
        });
      } else if (n.notification_type === "incomplete") {
        text = t(lang, "chal_dr_incomplete", {
          patient: patientName,
          challenge: p.challenge_type || "Challenge",
          reason: p.reason || "no final result submitted",
        });
      } else {
        text = t(lang, "chal_dr_weekly", {
          patient: patientName,
          challenge: p.challenge_type || p.challenge_name || "Challenge",
          progress: p.progress || "—",
          participation: p.participation || "—",
          rank: p.rank || "—",
          status: p.status || "active",
        });
      }
      await send(bot, chat, text, { markdown: true });
      await markChallengeDoctorNotificationSent(n.id);
      if (n.notification_type === "weekly_update") doctorLastSentByDay.set(doctorKey, true);
    } catch (e) {
      console.error("doctor notif send:", e?.message);
    }
  }
}

// Weekly doctor summary — one `weekly_update` notification per patient per
// challenge per 7 days. Runs on every tick but only enqueues a fresh row if
// the previous weekly update for that patient×challenge is at least 7 days
// old. Delivery uses the same rate-limited path as `joined` / `completed`.
async function enqueueWeeklyDoctorSummaries() {
  // Pull every active challenge. `listChallengesToExpire` filters
  // status in ('active','awaiting_final_result') AND end_date < cutoff, so a
  // far-future cutoff returns every active row that has an end_date — which
  // is exactly the set we care about (challenges without a doctor link are
  // skipped in the loop below).
  const rows = await listChallengesToExpire("9999-12-31").catch(() => []);
  const now = Date.now();
  for (const uc of rows) {
    if (!uc.doctor_id) continue;
    if (!["active", "awaiting_final_result"].includes(uc.status)) continue;
    try {
      const last = await lastDoctorNotificationOfType(uc.doctor_id, uc.user_id, "weekly_update");
      const lastTs = last?.scheduled_for ? new Date(last.scheduled_for).getTime() : 0;
      if (lastTs && (now - lastTs) < 7 * 86400 * 1000) continue;

      // Skip patients who have received no participation this week — nothing
      // meaningful to report yet.
      if (!uc.last_participation_at) continue;
      const lastPart = new Date(uc.last_participation_at).getTime();
      if ((now - lastPart) > 7 * 86400 * 1000) continue;

      const def = uc.challenge_id ? await getChallengeDefById(uc.challenge_id).catch(() => null) : null;
      const progressStr = summariseProgress(uc, def);
      const participationLevel = participationBucket(uc.participation_points || 0);

      await enqueueChallengeDoctorNotification({
        doctor_id: uc.doctor_id,
        user_id: uc.user_id,
        user_challenge_id: uc.id,
        notification_type: "weekly_update",
        payload: {
          challenge_type: uc.challenge_type,
          challenge_name: def?.name || uc.challenge_type,
          progress: progressStr,
          participation: participationLevel,
          rank: uc.rank != null ? `${uc.rank}${uc.percentile != null ? ` (p${uc.percentile})` : ""}` : "—",
          status: uc.status,
        },
        scheduled_for: new Date().toISOString(),
      });
    } catch (e) {
      console.error("weekly doctor summary enqueue:", e?.message);
    }
  }
}

function summariseProgress(uc, def) {
  const type = def?.challenge_type || uc.challenge_type;
  if (type === "activity") return `${uc.outcome_value || 0} active days`;
  if (type === "healthy_plate") return `${uc.outcome_value || 0} Healthy Plates`;
  if (type === "hba1c") {
    const dur = def?.duration_days || 90;
    const start = uc.start_date ? new Date(`${uc.start_date}T00:00:00Z`).getTime() : Date.now();
    const day = Math.max(1, Math.min(dur, Math.round((Date.now() - start) / 86400000) + 1));
    return `day ${day} of ${dur} · ${uc.participation_points || 0} participation pts · streak ${uc.current_streak || 0}`;
  }
  return "in progress";
}

function participationBucket(points) {
  if (points >= 40) return "High";
  if (points >= 20) return "Moderate";
  if (points >= 5)  return "Low";
  return "Very Low";
}

// Auto-expire challenges whose end_date is past. HbA1c rows without a final
// result become `expired_incomplete`; automatic-outcome rows just close as
// `completed` (their outcome_value is already up to date). A 7-day grace
// period is given after end_date for the user to submit an HbA1c final.
async function expireDueChallenges(usersById) {
  const cutoff = new Date(Date.now() - 7 * 86400 * 1000).toISOString().slice(0, 10);
  const rows = await listChallengesToExpire(cutoff).catch(() => []);
  for (const uc of rows) {
    try {
      const isHba1c = uc.challenge_type === "hba1c";
      if (isHba1c && uc.final_value == null) {
        await updateUserChallenge(uc.id, {
          status: "expired_incomplete",
          completed_at: new Date().toISOString(),
        });
        // Doctor notification
        if (uc.doctor_id) {
          await enqueueChallengeDoctorNotification({
            doctor_id: uc.doctor_id,
            user_id: uc.user_id,
            user_challenge_id: uc.id,
            notification_type: "incomplete",
            payload: { challenge_type: uc.challenge_type,
                       reason: "no final HbA1c submitted" },
            scheduled_for: new Date().toISOString(),
          });
        }
        continue;
      }
      // Automatic outcome — close and recompute the cohort ranks.
      await updateUserChallenge(uc.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
      });
      await computeAndPersistScores(uc.challenge_id, uc.user_id).catch(() => {});
      if (uc.doctor_id) {
        await enqueueChallengeDoctorNotification({
          doctor_id: uc.doctor_id,
          user_id: uc.user_id,
          user_challenge_id: uc.id,
          notification_type: "completed",
          payload: {
            challenge_type: uc.challenge_type,
            outcome_value: uc.outcome_value,
            rank: uc.rank, total: null,
          },
          scheduled_for: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("chal expire:", e?.message);
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

  // Challenges v1.0: enqueue weekly doctor summaries (§12.3), fire any
  // queued doctor notifications, and auto-expire rows past their end_date +
  // grace period. All are safe to run every tick — enqueueing dedupes on
  // its own 7-day cooldown, sends are idempotent via sent_at, and expiry
  // targets terminal statuses.
  await enqueueWeeklyDoctorSummaries().catch((e) =>
    console.error("chal weekly summaries:", e?.message));
  await fireDoctorNotifications(bots, usersById, new Map()).catch((e) =>
    console.error("chal doctor notifs:", e?.message));
  await expireDueChallenges(usersById).catch((e) =>
    console.error("chal expire pass:", e?.message));

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
