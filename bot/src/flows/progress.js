import { t } from "../i18n.js";
import { send, typing, langOf } from "../utils.js";
import { backKeyboard } from "../keyboards.js";
import { weeklyStats } from "../supabase.js";
import { weeklySummary } from "../openai.js";

// Weekly Summary — used by Reports (feat:summary / rep:weekly). The
// standalone Goals & Progress screen was retired in the 2026-07 revision;
// its data-trend rollup now lives inside ❤️ My Health.
export async function showSummary(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "idle";

  await send(bot, chatId, t(lang, "summary_generating"), { markdown: true });

  const stats = await weeklyStats(session.user.id);
  if (stats.glucoseCount === 0 && stats.healthCount === 0 && stats.medicationCount === 0) {
    return send(bot, chatId, t(lang, "no_data_week"), { keyboard: backKeyboard(lang), markdown: true });
  }

  await typing(bot, chatId);
  try {
    const summary = await weeklySummary(session.user, stats);
    await send(bot, chatId, summary, { keyboard: backKeyboard(lang) });
  } catch (e) {
    console.error("summary error:", e?.message);
    const key = e?.aiLimited ? "error_ai_limit" : "error_generic";
    await send(bot, chatId, t(lang, key), { keyboard: backKeyboard(lang) });
  }
}
