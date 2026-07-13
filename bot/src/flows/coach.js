import { t } from "../i18n.js";
import { send, typing, langOf, isPremium, photoDataUrl } from "../utils.js";
import { backKeyboard } from "../keyboards.js";
import { coachReply } from "../openai.js";
import { saveCoachMessage, weeklyStats } from "../supabase.js";
import { applyScores } from "../scores.js";
import { compactKB } from "../kb.js";
import { pushHistory } from "../session.js";

const PROMPT_KEY = {
  coach: "coach_prompt",
  food: "food_prompt",
  fitness: "fitness_prompt",
  label: "foodhelp_label_prompt",
  analyze: "foodhelp_analyze_prompt",
};

// kind: 'coach' | 'food' | 'fitness'  (all premium)
// promptKeyOverride: optional i18n key to use in place of the default intro
// (used by Food Help sub-options that want to skip the generic Food Coach
// intro and jump straight to their own prompt with the Back-to-Menu button).
export async function startCoach(bot, chatId, session, kind, promptKeyOverride) {
  const lang = langOf(session);
  if (!isPremium(session.user)) {
    return send(bot, chatId, t(lang, "premium_required"), { keyboard: backKeyboard(lang), markdown: true });
  }
  session.state = kind;
  session.history = [];
  const promptKey = promptKeyOverride || PROMPT_KEY[kind];
  await send(bot, chatId, t(lang, promptKey), { keyboard: backKeyboard(lang), markdown: true });
}

export async function coachText(bot, chatId, session, text, msg) {
  const lang = langOf(session);
  const kind = session.state; // coach | food | fitness

  if (!isPremium(session.user)) {
    return send(bot, chatId, t(lang, "premium_required"), { keyboard: backKeyboard(lang), markdown: true });
  }

  const imageDataUrl = msg ? await photoDataUrl(bot, msg) : null;
  const userText = (text || msg?.caption || "").trim();
  if (!userText && !imageDataUrl) {
    return send(bot, chatId, t(lang, PROMPT_KEY[kind]), { keyboard: backKeyboard(lang), markdown: true });
  }

  await typing(bot, chatId);
  try {
    // cheap personalization: one DB read, no extra AI cost
    let extra = "";
    try {
      extra = compactKB(session.user, await weeklyStats(session.user.id));
    } catch {
      /* ignore */
    }
    const reply = await coachReply(session.user, session.history, userText, kind, imageDataUrl, extra);

    pushHistory(session, "user", userText || "[image]");
    pushHistory(session, "assistant", reply);
    saveCoachMessage(session.user.id, kind, "user", userText || "[image]");
    saveCoachMessage(session.user.id, kind, "assistant", reply);

    // Nutrition Label Scanner replies open with 😀/😬/😞 and use 🟢🟡🔴 in the
    // Rating line — preserve those glyphs instead of running them through the
    // global emoji stripper.
    const keepEmoji = kind === "label";
    await send(bot, chatId, reply, { keyboard: backKeyboard(lang), keepEmoji });
    session.user = await applyScores(session.user, "coach");
  } catch (e) {
    console.error("coach error:", e?.message);
    const key = e?.aiLimited ? "error_ai_limit" : "error_generic";
    await send(bot, chatId, t(lang, key), { keyboard: backKeyboard(lang) });
  }
}
