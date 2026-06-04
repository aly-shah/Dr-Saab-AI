import { t } from "../i18n.js";
import { send, typing, langOf } from "../utils.js";
import { backKeyboard } from "../keyboards.js";
import { recentGlucose, latestWeight, weeklyStats } from "../supabase.js";
import { weeklySummary } from "../openai.js";

export async function showProgress(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "idle";

  const [readings, weight] = await Promise.all([
    recentGlucose(session.user.id, 5),
    latestWeight(session.user.id),
  ]);

  const readingsText = readings.length
    ? readings
        .map((r) => {
          const d = new Date(r.created_at);
          const when = `${d.getMonth() + 1}/${d.getDate()}`;
          return `• ${r.value_mgdl} mg/dL (${r.context}) — ${when}`;
        })
        .join("\n")
    : t(lang, "no_readings");

  const body = t(lang, "progress_body", {
    streak: session.user.streak || 0,
    weight: weight ? `${weight} kg` : (session.user.weight_kg ? `${session.user.weight_kg} kg` : "—"),
    readings: readingsText,
  });

  await send(bot, chatId, `${t(lang, "progress_title")}\n\n${body}`, {
    keyboard: backKeyboard(lang),
    markdown: true,
  });
}

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
    await send(bot, chatId, t(lang, "error_generic"), { keyboard: backKeyboard(lang) });
  }
}
