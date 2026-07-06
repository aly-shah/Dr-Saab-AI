// My Account — More → 👤 My Account (2026-07 spec).
//
// Displays the user's identity + membership summary and hosts the destructive
// account controls (Deactivate / Close). Editing profile fields is stubbed
// with an Ask DrSaab handoff for now.

import { t } from "../i18n.js";
import { send, sanitizeMd, langOf } from "../utils.js";
import {
  accountKeyboard,
  deactivateConfirmKeyboard,
  closeConfirmKeyboard,
  backKeyboard,
} from "../keyboards.js";
import { setAccountStatus, deactivateAllReminders } from "../supabase.js";
import { clearSession, resetFlow } from "../session.js";

const DIABETES_LABEL_KEY = {
  type1: "dt_type1",
  type2: "dt_type2",
  prediabetes: "dt_prediabetes",
  gestational: "dt_gestational",
  notsure: "dt_notsure",
  atrisk: "ds_atrisk",
};

function diabetesLabel(lang, user) {
  const key = DIABETES_LABEL_KEY[user?.diabetes_status];
  if (!key) return t(lang, "account_field_empty");
  return t(lang, key);
}

// The users table stores the WhatsApp phone number as `telegram_id` (bigint)
// for source=whatsapp — the column is reused across both channels.
function whatsappNumber(lang, user) {
  if (user?.source !== "whatsapp" || !user?.telegram_id) return t(lang, "account_field_empty");
  return `+${user.telegram_id}`;
}

function memberSince(user) {
  if (!user?.created_at) return null;
  const d = new Date(user.created_at);
  if (Number.isNaN(d.getTime())) return null;
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export async function showAccount(bot, chatId, session) {
  resetFlow(chatId);
  const lang = langOf(session);
  const u = session.user || {};
  const body = t(lang, "account_body", {
    name: sanitizeMd(u.name || t(lang, "account_field_empty")),
    email: t(lang, "account_field_empty"), // no email column yet — placeholder
    whatsapp: whatsappNumber(lang, u),
    joined: memberSince(u) || t(lang, "account_field_empty"),
    diabetes: diabetesLabel(lang, u),
  });
  return send(bot, chatId, `${t(lang, "account_title")}\n\n${body}`, {
    keyboard: accountKeyboard(lang),
    markdown: true,
  });
}

export async function startEditProfile(bot, chatId, session) {
  const lang = langOf(session);
  return send(bot, chatId, t(lang, "edit_profile_stub"), {
    keyboard: backKeyboard(lang, "feat:account"),
    markdown: true,
  });
}

export async function showDeactivateConfirm(bot, chatId, session) {
  const lang = langOf(session);
  return send(
    bot,
    chatId,
    `${t(lang, "deactivate_confirm_title")}\n\n${t(lang, "deactivate_confirm_body")}`,
    { keyboard: deactivateConfirmKeyboard(lang), markdown: true }
  );
}

export async function doDeactivate(bot, chatId, session) {
  const lang = langOf(session);
  const updated = await setAccountStatus(session.user.id, "inactive").catch((e) => {
    console.error("deactivate error:", e?.message);
    return null;
  });
  if (updated) session.user = updated;
  await send(bot, chatId, t(lang, "deactivate_done"), { markdown: true });
  // Clear the in-memory session so the next message goes through the
  // reactivation path in handleMessage rather than resuming a menu.
  clearSession(chatId);
}

export async function showCloseConfirm(bot, chatId, session) {
  const lang = langOf(session);
  return send(
    bot,
    chatId,
    `${t(lang, "close_confirm_title")}\n\n${t(lang, "close_confirm_body")}`,
    { keyboard: closeConfirmKeyboard(lang), markdown: true }
  );
}

export async function doClose(bot, chatId, session) {
  const lang = langOf(session);
  const uid = session.user?.id;
  if (uid) {
    await setAccountStatus(uid, "closed").catch((e) => console.error("close error:", e?.message));
    // Stop the scheduler from firing anything against a closed account.
    await deactivateAllReminders(uid).catch(() => {});
  }
  await send(bot, chatId, t(lang, "close_done"), { markdown: true });
  clearSession(chatId);
}
