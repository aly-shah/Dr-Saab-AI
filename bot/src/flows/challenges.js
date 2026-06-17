import { t } from "../i18n.js";
import { send, langOf } from "../utils.js";
import { challengesKeyboard, backKeyboard } from "../keyboards.js";
import { joinChallenge, listChallenges } from "../supabase.js";
import { applyScores } from "../scores.js";

// Challenge type → display-name i18n key (per proposal §3.7).
export const CHALLENGE_NAME_KEY = {
  a1c: "chl_a1c",
  weight: "chl_weight",
  walking: "chl_walking",
  consistency: "chl_consistency",
  ramadan: "chl_ramadan",
  doctor: "chl_doctor",
  corporate: "chl_corporate",
};

// Doctor / corporate challenges are tied to a code (from a clinic or employer).
const CODE_REQUIRED = new Set(["doctor", "corporate"]);

export async function showChallenges(bot, chatId, session) {
  session.state = "idle";
  const lang = langOf(session);
  await send(bot, chatId, `${t(lang, "challenges_title")}\n\n${t(lang, "challenges_intro")}`, {
    keyboard: challengesKeyboard(lang),
    markdown: true,
  });
}

export async function showMyChallenges(bot, chatId, session) {
  const lang = langOf(session);
  const rows = await listChallenges(session.user.id);
  const body = rows.length
    ? `${t(lang, "my_challenges_title")}\n` +
      rows.map((r) => `• ${t(lang, CHALLENGE_NAME_KEY[r.challenge_type] || r.challenge_type)}`).join("\n")
    : t(lang, "my_challenges_none");
  await send(bot, chatId, `${t(lang, "challenges_title")}\n\n${body}`, {
    keyboard: backKeyboard(lang),
    markdown: true,
  });
}

// Called from the callback handler when a challenge button is tapped.
export async function startChallengeJoin(bot, chatId, session, type) {
  const lang = langOf(session);
  if (!CHALLENGE_NAME_KEY[type]) return showChallenges(bot, chatId, session);

  if (CODE_REQUIRED.has(type)) {
    session.state = "challenge_code";
    session.data = { ...(session.data || {}), pendingChallenge: type };
    return send(bot, chatId, t(lang, "challenge_code_prompt", { name: t(lang, CHALLENGE_NAME_KEY[type]) }), {
      keyboard: backKeyboard(lang),
      markdown: true,
    });
  }
  return finishJoin(bot, chatId, session, type, null);
}

// Text handler for the doctor/corporate code step.
export async function challengeCodeText(bot, chatId, session, text) {
  const type = session.data?.pendingChallenge;
  if (!type) return showChallenges(bot, chatId, session);
  const code = (text || "").trim().slice(0, 40);
  session.data.pendingChallenge = null;
  return finishJoin(bot, chatId, session, type, code || null);
}

async function finishJoin(bot, chatId, session, type, code) {
  const lang = langOf(session);
  session.state = "idle";
  const name = t(lang, CHALLENGE_NAME_KEY[type]);
  const { already } = await joinChallenge(session.user.id, type, code);
  if (already) {
    return send(bot, chatId, t(lang, "challenge_already", { name }), { keyboard: backKeyboard(lang), markdown: true });
  }
  session.user = await applyScores(session.user, "challenge_join");
  await send(bot, chatId, t(lang, "challenge_joined", { name }), { keyboard: backKeyboard(lang), markdown: true });
}
