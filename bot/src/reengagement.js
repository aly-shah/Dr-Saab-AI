// 24-hour WhatsApp re-engagement sequence — Messaging System Developer
// Specification v1.0 (15 Sep 2026).
//
// After a user's inbound message, WhatsApp allows free-form replies for 24
// hours. If the user goes quiet we may send, inside that window:
//   • 12 h inactive → Feature promo for the current cycle
//   • 23 h inactive → Behaviour promo for the current cycle
// A user goes through at most three completed cycles (6 messages, ever).
//
// Business rules (spec §12) and how they map here:
//   1/3/4  The timer is users.last_user_message_at, written ONLY by
//          noteInbound() from the inbound path in bot.js; our own sends never
//          touch it.
//   2/8    There are no queued jobs to cancel: the scheduler tick recomputes
//          the stage from last_user_message_at every time, and a "sent" marker
//          older than the latest inbound message simply no longer counts.
//          A reply between 12 h and 23 h therefore leaves the cycle untouched.
//   5/6/7  The cycle advances only after a behaviour promo is delivered;
//          after cycle 3 the sequence is marked completed / disabled.
//   9      Opt-out = the Coaching reminders toggle (users.pref_rem_coaching)
//          or reengagement_enabled = false; both are excluded in the query.
//   10/§13 Every attempt is logged (reengagement_log) and a reply within
//          60 minutes is recorded for the conversion KPI.

import {
  listReengagementCandidates,
  noteUserInbound,
  markReengagementReplies,
  logReengagement,
  updateUser,
} from "./supabase.js";
import { send } from "./utils.js";
import { logError } from "./log.js";
import { firstNameOf } from "./engagement.js";
import { ageBracketFor, messageFor } from "./reengagementMessages.js";

const HOUR = 3600 * 1000;
export const FEATURE_AFTER_MS = 12 * HOUR;
export const BEHAVIOUR_AFTER_MS = 23 * HOUR;
export const WINDOW_MS = 24 * HOUR;
export const MAX_CYCLES = 3;

// Trigger A — every inbound user message or button tap (bot.js).
export async function noteInbound(userId, now = new Date()) {
  const iso = now.toISOString();
  await noteUserInbound(userId, iso);
  await markReengagementReplies(userId, iso).catch((e) => logError("Re-engagement reply mark", e?.message));
}

function chatIdFor(user) {
  if ((user.source || "telegram") === "whatsapp") return user.phone_number || user.telegram_id;
  return user.telegram_id;
}

// Which message, if any, is due for this user right now. Pure so it can be
// unit-tested against the spec's acceptance criteria.
export function stageFor(user, nowMs = Date.now()) {
  const last = Date.parse(user?.last_user_message_at || "");
  if (!Number.isFinite(last)) return null;
  const inactive = nowMs - last;
  if (inactive >= WINDOW_MS) return null; // the WhatsApp window has closed
  if (user.reengagement_enabled === false) return null;
  const cycle = Number(user.reengagement_cycle ?? 1);
  if (!(cycle >= 1 && cycle <= MAX_CYCLES)) return null;
  const doneThisEpisode = (iso) => {
    const t = Date.parse(iso || "");
    return Number.isFinite(t) && t >= last;
  };
  if (inactive >= BEHAVIOUR_AFTER_MS) return doneThisEpisode(user.reengagement_behaviour_sent_at) ? null : "behaviour";
  if (inactive >= FEATURE_AFTER_MS) return doneThisEpisode(user.reengagement_feature_sent_at) ? null : "feature";
  return null;
}

// Triggers B and C — called from the scheduler tick (every 15 minutes).
export async function runReengagementTick(bots, now = new Date()) {
  const nowMs = now.getTime();
  const users = await listReengagementCandidates(
    new Date(nowMs - WINDOW_MS).toISOString(),
    new Date(nowMs - FEATURE_AFTER_MS).toISOString()
  );
  const out = { feature: 0, behaviour: 0, failed: 0, skipped: 0 };
  for (const u of users || []) {
    const stage = stageFor(u, nowMs);
    if (!stage) continue;
    const bot = bots?.[u.source || "telegram"];
    const chat = chatIdFor(u);
    if (!bot || !chat) {
      out.skipped++;
      continue;
    }
    const cycle = Number(u.reengagement_cycle ?? 1);
    const bracket = ageBracketFor(u, now);
    const text = messageFor({ cycle, type: stage, bracket, firstName: firstNameOf(u) });
    if (!text) continue;

    let ok = false;
    try {
      const r = await send(bot, chat, text, { keepEmoji: true });
      ok = !!r && r.ok !== false;
    } catch (e) {
      logError("Re-engagement send", `${u.id}: ${e?.message}`);
    }

    // Mark the attempt for this episode either way (no retries inside the
    // same window); only a DELIVERED behaviour promo advances the cycle.
    const nowIso = now.toISOString();
    const patch = stage === "feature"
      ? { reengagement_feature_sent_at: nowIso }
      : { reengagement_behaviour_sent_at: nowIso };
    patch.reengagement_cycle = cycle; // make the (defaulted) cycle explicit on the row
    if (stage === "behaviour" && ok) {
      const next = cycle + 1;
      patch.reengagement_cycle = next;
      if (next > MAX_CYCLES) patch.reengagement_enabled = false; // sequence completed
    }
    await updateUser(u.id, patch).catch((e) => logError("Re-engagement mark", e?.message));

    const last = Date.parse(u.last_user_message_at);
    await logReengagement({
      user_id: u.id,
      message_type: stage,
      cycle,
      age_bracket: bracket,
      scheduled_at: new Date(last + (stage === "feature" ? FEATURE_AFTER_MS : BEHAVIOUR_AFTER_MS)).toISOString(),
      sent_at: nowIso,
      delivery_status: ok ? "sent" : "failed",
    }).catch((e) => logError("Re-engagement log", e?.message));

    if (ok) out[stage]++;
    else out.failed++;
  }
  return out;
}
