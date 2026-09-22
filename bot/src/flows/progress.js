import { t } from "../i18n.js";
import { send, langOf } from "../utils.js";
import { backKeyboard } from "../keyboards.js";
import { periodStats } from "../supabase.js";
import { buildWeeklySummary } from "../weeklySummaryText.js";

// Weekly Summary — used by Reports (feat:summary / rep:weekly). The
// standalone Goals & Progress screen was retired in the 2026-07 revision;
// its data-trend rollup now lives inside ❤️ My Health.
export async function showSummary(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "idle";

  // Written from the numbers, not by the AI — same facts, no tokens, and the
  // wording is properly localised. periodStats adds the in-range % that
  // weeklyStats does not carry.
  const stats = await periodStats(session.user.id, 7);
  if (stats.glucoseCount === 0 && stats.healthCount === 0 && stats.medicationCount === 0) {
    return send(bot, chatId, t(lang, "no_data_week"), { keyboard: backKeyboard(lang), markdown: true });
  }

  const summary = buildWeeklySummary(session.user, stats, lang);
  return send(bot, chatId, summary, { keyboard: backKeyboard(lang), markdown: true, keepEmoji: true });
}
