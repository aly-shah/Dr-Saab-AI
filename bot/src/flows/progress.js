import { t } from "../i18n.js";
import { send, typing, langOf } from "../utils.js";
import { backKeyboard } from "../keyboards.js";
import { recentGlucose, latestWeight, weeklyStats } from "../supabase.js";
import { weeklySummary } from "../openai.js";
import { estHbA1c, bmi, bmiCategory } from "../clinic.js";

export async function showProgress(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "idle";

  const [readings, weight, stats] = await Promise.all([
    recentGlucose(session.user.id, 5),
    latestWeight(session.user.id),
    weeklyStats(session.user.id),
  ]);

  // Clinical estimates (formulas only, no AI)
  const hba1c = estHbA1c(stats.glucoseAvg);
  const bmiVal = bmi(weight ?? session.user.weight_kg, session.user.height_cm);
  const clinicLines = [];
  if (hba1c != null) clinicLines.push(`${t(lang, "clinic_hba1c")}: *${hba1c}%*`);
  if (bmiVal != null) clinicLines.push(`${t(lang, "clinic_bmi")}: *${bmiVal}* (${bmiCategory(bmiVal)})`);
  const clinicBlock = clinicLines.length ? "\n\n" + clinicLines.join("\n") : "";

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

  // Four-score panel (proposal §3.3)
  const u = session.user;
  const scoresBlock =
    `\n\n${t(lang, "scores_title")}\n` +
    t(lang, "scores_body", {
      consistency: u.consistency_score ?? 50,
      motivation: u.motivation_score ?? 50,
      risk: u.risk_score ?? 50,
      engagement: u.engagement_score ?? 50,
    });

  await send(bot, chatId, `${t(lang, "progress_title")}\n\n${body}${clinicBlock}${scoresBlock}`, {
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

// Recent Activity — last 7 days at a glance. No AI; just structured counts +
// the most recent glucose readings. Cheap to build, helps the user feel like
// the bot remembers them.
export async function showRecentActivity(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "idle";

  const [readings, stats] = await Promise.all([
    recentGlucose(session.user.id, 5),
    weeklyStats(session.user.id),
  ]);

  if (!readings.length && !stats.medicationCount && !stats.healthCount) {
    return send(bot, chatId, t(lang, "recent_none"), { keyboard: backKeyboard(lang), markdown: true });
  }

  const lines = [];
  if (readings.length) {
    lines.push("*Recent glucose:*");
    for (const r of readings) {
      const d = new Date(r.created_at);
      const when = `${d.getMonth() + 1}/${d.getDate()}`;
      lines.push(`• ${r.value_mgdl} mg/dL (${r.context}) — ${when}`);
    }
    lines.push("");
  }
  lines.push(`Glucose checks (7d): *${stats.glucoseCount}*`);
  lines.push(`Medications logged (7d): *${stats.medicationCount}*`);
  lines.push(`Check-ins (7d): *${stats.healthCount}*`);

  await send(bot, chatId, `${t(lang, "recent_title")}\n\n${lines.join("\n")}`, {
    keyboard: backKeyboard(lang),
    markdown: true,
  });
}
