import { t } from "../i18n.js";
import { send, typing, langOf, isPremium, photoDataUrl } from "../utils.js";
import { backKeyboard } from "../keyboards.js";
import { explainLab } from "../openai.js";
import { addLabReport } from "../supabase.js";

export async function startLab(bot, chatId, session) {
  const lang = langOf(session);
  if (!isPremium(session.user)) {
    return send(bot, chatId, t(lang, "premium_required"), { keyboard: backKeyboard(lang), markdown: true });
  }
  session.state = "lab";
  await send(bot, chatId, t(lang, "lab_prompt"), { keyboard: backKeyboard(lang), markdown: true });
}

export async function labText(bot, chatId, session, text, msg) {
  const lang = langOf(session);
  if (!isPremium(session.user)) {
    return send(bot, chatId, t(lang, "premium_required"), { keyboard: backKeyboard(lang), markdown: true });
  }

  const imageDataUrl = msg ? await photoDataUrl(bot, msg) : null;
  const userText = (text || msg?.caption || "").trim();
  if (!userText && !imageDataUrl) {
    return send(bot, chatId, t(lang, "lab_prompt"), { keyboard: backKeyboard(lang), markdown: true });
  }

  await typing(bot, chatId);
  try {
    const analysis = await explainLab(session.user, userText, imageDataUrl);
    addLabReport(session.user.id, userText || "[image]", analysis);
    await send(bot, chatId, analysis, { keyboard: backKeyboard(lang) });
    await send(bot, chatId, t(lang, "disclaimer"), { markdown: true });
  } catch (e) {
    console.error("lab error:", e?.message);
    await send(bot, chatId, t(lang, "error_generic"), { keyboard: backKeyboard(lang) });
  }
}
