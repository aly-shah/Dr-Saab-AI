// Ad hoc messaging (2026-09-15) — one custom message from the admin panel
// to every user, sent on each user's own channel.
//
// The admin panel calls the bot's POST /web/admin/broadcast (web.js), which
// resolves the recipients, sends, and logs one admin_broadcasts row with the
// counts. Recipients are the same "active" set the scheduler messages:
// onboarded, account active, on WhatsApp or Telegram. A user whose channel
// is not configured on this bot is counted as skipped, never mis-routed.
//
// WhatsApp only delivers business-initiated free-form text to users who
// wrote in the last 24 hours (otherwise a template is required); those
// rejections come back as `ok: false` from the adapter and count as failed.

import { allActiveUsers, logAdminBroadcast } from "./supabase.js";
import { send } from "./utils.js";
import { logError } from "./log.js";

export const AUDIENCES = ["all", "patients", "doctors"];
export const MAX_BROADCAST_CHARS = 4000;

export function filterAudience(users, audience) {
  const list = users || [];
  if (audience === "patients") return list.filter((u) => (u.user_type || "patient") !== "doctor");
  if (audience === "doctors") return list.filter((u) => u.user_type === "doctor");
  return list;
}

export async function resolveRecipients(audience = "all") {
  const users = await allActiveUsers();
  return filterAudience(users, AUDIENCES.includes(audience) ? audience : "all");
}

// Transport-level chat id: Telegram uses the numeric id, WhatsApp the E.164
// number (legacy rows kept the phone in telegram_id before the identity split).
function chatIdFor(user) {
  if ((user.source || "telegram") === "whatsapp") return user.phone_number || user.telegram_id;
  return user.telegram_id;
}

export async function sendBroadcastTo(bots, users, text) {
  const result = { recipients: users.length, sent: 0, failed: 0, skipped: 0 };
  for (const u of users) {
    const bot = bots?.[u.source || "telegram"];
    const chat = chatIdFor(u);
    if (!bot || !chat) {
      result.skipped++;
      continue;
    }
    try {
      // keepEmoji: the admin typed the message exactly as it should arrive.
      const r = await send(bot, chat, text, { keepEmoji: true });
      if (r && r.ok !== false) result.sent++;
      else result.failed++;
    } catch (e) {
      result.failed++;
      logError("Broadcast send", `${u.id}: ${e?.message}`);
    }
  }
  return result;
}

export async function runBroadcast(bots, { text, audience = "all", sentBy = "admin" } = {}) {
  const clean = String(text || "").trim();
  if (!clean) throw new Error("message text is required");
  if (clean.length > MAX_BROADCAST_CHARS) {
    throw new Error(`message is longer than ${MAX_BROADCAST_CHARS} characters`);
  }
  const aud = AUDIENCES.includes(audience) ? audience : "all";
  const users = await resolveRecipients(aud);
  const result = await sendBroadcastTo(bots, users, clean);
  const row = await logAdminBroadcast({ text: clean, audience: aud, ...result, sent_by: sentBy }).catch((e) => {
    logError("Broadcast log", e?.message);
    return null;
  });
  return { ...result, audience: aud, id: row?.id || null };
}
