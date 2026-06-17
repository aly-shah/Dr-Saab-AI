import { t } from "../i18n.js";
import { send, langOf } from "../utils.js";
import { profileqKeyboard, backKeyboard } from "../keyboards.js";
import { saveProfileAnswer } from "../supabase.js";
import { nextProfileQuestion } from "../profileQuestions.js";

// Natural drip: ask a background question every Nth return to the menu, so the
// signup stays short but the profile fills in over time (proposal §3.6).
// Off by default — enable with PROFILE_DRIP=true once cadence is tuned.
const DRIP_ENABLED = String(process.env.PROFILE_DRIP).toLowerCase() === "true";
const DRIP_EVERY = parseInt(process.env.PROFILE_DRIP_EVERY || "4", 10);

// Ask the next background question now. Returns true if one was asked.
export async function askProfileQuestion(bot, chatId, session) {
  const q = nextProfileQuestion(session.user);
  if (!q) return false;
  const lang = langOf(session);
  session.state = "profileq";
  session.data = { ...(session.data || {}), profileqKey: q.key };
  await send(bot, chatId, `${t(lang, "profileq_intro")}\n\n${q.q}`, {
    keyboard: profileqKeyboard(lang),
    markdown: true,
  });
  return true;
}

// Drip controller — call when the user lands back on the menu.
export async function maybeAskProfileQuestion(bot, chatId, session) {
  if (!DRIP_ENABLED) return false;
  const n = (session.data?.menuVisits || 0) + 1;
  session.data = { ...(session.data || {}), menuVisits: n };
  if (n % DRIP_EVERY !== 0) return false;
  return askProfileQuestion(bot, chatId, session);
}

// User typed an answer to the current background question.
export async function profileqText(bot, chatId, session, text) {
  const lang = langOf(session);
  const key = session.data?.profileqKey;
  session.state = "idle";
  if (key) {
    await saveProfileAnswer(session.user.id, key, (text || "").trim().slice(0, 300));
    session.user = { ...session.user, profile_answers: { ...(session.user.profile_answers || {}), [key]: text } };
  }
  await send(bot, chatId, t(lang, "profileq_saved"), { keyboard: backKeyboard(lang), markdown: true });
}

// User tapped Skip — record an empty answer so we don't re-ask the same one.
export async function skipProfileQuestion(bot, chatId, session) {
  const lang = langOf(session);
  const key = session.data?.profileqKey;
  session.state = "idle";
  if (key) {
    await saveProfileAnswer(session.user.id, key, "");
    session.user = { ...session.user, profile_answers: { ...(session.user.profile_answers || {}), [key]: "" } };
  }
  await send(bot, chatId, t(lang, "profileq_saved"), { keyboard: backKeyboard(lang), markdown: true });
}
