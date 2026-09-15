// Onboarding "is this you?" — shared by patient and doctor onboarding.
//
// When the email a new user types already belongs to another DrSaab
// account (a patient's users.email or a doctor's doctors.email) we ask
// whether it's the same person. Yes → that account's chat identity becomes
// this chat (adoptIdentity), its profile and history come back, and the
// placeholder row created for this chat is dropped. No → ask for a
// different email and carry on with the fresh profile.

import { t } from "./i18n.js";
import { send, sanitizeMd, langOf } from "./utils.js";
import { emailMatchKeyboard, mainMenuKeyboardV2 } from "./keyboards.js";
import { getUserByEmail, adoptIdentity } from "./supabase.js";
import { resetFlow } from "./session.js";
import { refreshKB } from "./kb.js";
import { logError } from "./log.js";

// Look for another account on this email. Returns the row or null; a lookup
// failure counts as "no match" so onboarding never blocks on it.
export async function findEmailOwner(email, currentUserId) {
  try {
    return await getUserByEmail(email, currentUserId);
  } catch (e) {
    logError("email match lookup", e?.message);
    return null;
  }
}

// Ask "is this you?" and park the flow on the email_match step.
export async function askEmailMatch(bot, chatId, session, email, other, prefix) {
  const lang = langOf(session);
  session.data.email = email;
  session.data.emailMatch = { id: other.id, name: other.name || null, onboarded: !!other.onboarded };
  session.step = "email_match";
  const first = String(other.name || "").trim().split(/\s+/)[0];
  const hint = first ? t(lang, "email_match_hint", { name: sanitizeMd(first) }) : "";
  return send(bot, chatId, t(lang, "email_match_found", { email: sanitizeMd(email), hint }), {
    keyboard: emailMatchKeyboard(lang, prefix),
    markdown: true,
  });
}

// Typed yes/no while on the email_match step (English, Urdu, Roman Urdu).
export function parseYesNo(text) {
  const s = String(text || "").trim().toLowerCase();
  if (/^(y|yes|yeah|yep|ji|jee|haan|han|ہاں|جی|yes it'?s me|it'?s me|me)\.?$/i.test(s)) return "yes";
  if (/^(n|no|nope|nahi|nahin|nai|نہیں|not me|no it'?s not)\.?$/i.test(s)) return "no";
  return null;
}

// "Yes, it's me": link this chat to the existing account. Returns true when
// the existing account was fully onboarded (the caller is done — the menu
// has been shown), false when onboarding should continue on that account.
// Throws nothing: on failure the user is told and the email step is re-asked
// by the caller (returns null).
export async function adoptEmailMatch(bot, chatId, session) {
  const lang = langOf(session);
  const match = session.data?.emailMatch;
  if (!match?.id) return null;
  let adopted;
  try {
    adopted = await adoptIdentity(match.id, session.user.id);
  } catch (e) {
    logError("email match adopt", e?.message);
    await send(bot, chatId, t(lang, "email_match_failed"), { markdown: true });
    return null;
  }
  session.user = adopted;
  session.userFetchedAt = Date.now();
  // Keep the language the user just picked on this chat.
  const language = session.data?.language || adopted.language || lang;
  if (adopted.language !== language) {
    try {
      const { updateUser } = await import("./supabase.js");
      session.user = await updateUser(adopted.id, { language });
    } catch { /* best-effort */ }
  }
  if (session.user.onboarded) {
    resetFlow(chatId);
    // resetFlow works on the stored session; also clear the object we hold in
    // case the caller passed a detached copy (tests, future adapters).
    session.state = "idle";
    session.step = null;
    session.data = {};
    await refreshKB(session.user).catch(() => {});
    const name = sanitizeMd(session.user.name || "");
    await send(bot, chatId, t(language, name ? "email_match_restored" : "email_match_restored_noname", { name }), { markdown: true });
    const isDoctor = session.user.user_type === "doctor";
    await send(bot, chatId, t(language, isDoctor ? "doc_menu_title" : "menu_v2_title", { name }), {
      keyboard: mainMenuKeyboardV2(language, session.user),
      markdown: true,
      keepEmoji: !isDoctor,
    });
    return true;
  }
  await send(bot, chatId, t(language, "email_match_continue"), { markdown: true });
  return false;
}

// "No, not me": clear the pending match and ask for another email.
export async function declineEmailMatch(bot, chatId, session) {
  const lang = langOf(session);
  session.data.email = null;
  session.data.emailMatch = null;
  session.step = "email";
  return send(bot, chatId, t(lang, "email_match_use_other"), { markdown: true });
}
