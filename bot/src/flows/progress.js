import { t } from "../i18n.js";
import { send, typing, langOf, sanitizeMd } from "../utils.js";
import { backKeyboard } from "../keyboards.js";
import {
  recentGlucose,
  latestWeight,
  weeklyStats,
  periodStats,
  listActiveGoals,
  recentLabReports,
} from "../supabase.js";
import { weeklySummary, progressReport } from "../openai.js";
import { estHbA1c, bmi, bmiCategory } from "../clinic.js";
import { isPaid } from "../tiers.js";

// ============================================================
// My Progress (2026-07 spec)
// ============================================================
//
// Free users get a short, motivating summary + a Premium teaser.
// Paid users get a comprehensive AI progress report (goal progress,
// biggest win, biggest opportunity, personalised recommendations).
// Both variants share the same underlying data blob so the two
// pipelines stay in sync as we add signals over time.

// Upgrade CTA appended to free-tier reports. Keeps the free experience
// useful on its own while making the paid value clear.
function upgradeBlock(lang) {
  return `\n\n${t(lang, "progress_free_upgrade")}`;
}

// Rough per-goal quantitative summary the AI can use. We compute what we can
// server-side (weight-loss goals get a kg-delta line, blood-sugar goals get
// the average) so the model doesn't hallucinate numbers.
function goalDataHints(goals, data) {
  const hints = [];
  for (const g of goals || []) {
    const t = String(g.suggestion_key || "").toLowerCase();
    if (t === "lose_weight" && data.weight != null) {
      hints.push(`Weight goal — current weight ${data.weight} kg.`);
    } else if (t === "lower_a1c" && data.hba1c) {
      hints.push(`HbA1c goal — estimated HbA1c ${data.hba1c}% from ${data.glucoseCount} readings.`);
    } else if (t === "improve_blood_sugar" && data.inRangePct != null) {
      hints.push(`Blood sugar goal — ${data.inRangePct}% of readings in range.`);
    } else if ((t === "walk_more" || t === "exercise_more") && data.activityCount != null) {
      hints.push(`Activity goal — ${data.activityCount} entries in last 30 days.`);
    } else if (t === "take_meds" && data.medicationCount != null) {
      hints.push(`Medication goal — ${data.medicationCount} logs in last 30 days.`);
    }
  }
  return hints.length ? hints.join(" ") : null;
}

// Small yes/no test: do we have enough signal for a meaningful report?
function hasEnoughData(user, monthly, goalsCount) {
  return (
    goalsCount > 0 ||
    (monthly?.glucoseCount || 0) >= 3 ||
    (monthly?.medicationCount || 0) >= 3 ||
    (monthly?.healthCount || 0) >= 2 ||
    (user?.total_checkins || 0) >= 3
  );
}

// Compact prior-lab summary the model can reference (last report, if any).
function summariseLatestLab(reports) {
  if (!reports?.length) return null;
  const latest = reports[0];
  const bits = [];
  if (latest?.metadata?.report_type) bits.push(latest.metadata.report_type);
  const vals = Array.isArray(latest?.values) ? latest.values : [];
  const flagged = vals.filter((v) => v?.status === "out_of_range").slice(0, 3);
  if (flagged.length) {
    bits.push(`flagged: ${flagged.map((v) => `${v.test} ${v.result}`).join(", ")}`);
  }
  if (latest?.created_at) bits.push(`dated ${String(latest.created_at).slice(0, 10)}`);
  return bits.join(" · ") || null;
}

export async function showProgress(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "idle";

  await send(bot, chatId, t(lang, "progress_generating"), { markdown: true });
  await typing(bot, chatId);

  // Pull everything we know, in parallel. Missing signals just become "no data".
  const [goals, monthly, weekly, recent, weight, labs] = await Promise.all([
    listActiveGoals(session.user.id).catch(() => []),
    periodStats(session.user.id, 30).catch(() => ({})),
    weeklyStats(session.user.id).catch(() => ({})),
    recentGlucose(session.user.id, 5).catch(() => []),
    latestWeight(session.user.id).catch(() => null),
    recentLabReports(session.user.id, 3).catch(() => []),
  ]);

  if (!hasEnoughData(session.user, monthly, goals.length)) {
    return send(bot, chatId, t(lang, "progress_low_data"), {
      keyboard: backKeyboard(lang),
      markdown: true,
    });
  }

  const data = {
    goals,
    glucoseCount: monthly.glucoseCount,
    glucoseAvg: monthly.glucoseAvg,
    inRangePct: monthly.inRangePct,
    hba1c: estHbA1c(monthly.glucoseAvg),
    weight: weight ?? session.user.weight_kg,
    weightTrend: null,
    activityCount: null,
    medicationCount: monthly.medicationCount,
    wellbeingCount: null,
    labSummary: summariseLatestLab(labs),
    streak: session.user.streak || 0,
    recentReadings: recent,
    hints: goalDataHints(goals, {
      weight: weight ?? session.user.weight_kg,
      hba1c: estHbA1c(monthly.glucoseAvg),
      inRangePct: monthly.inRangePct,
      activityCount: monthly.healthCount,
      medicationCount: monthly.medicationCount,
      glucoseCount: monthly.glucoseCount,
    }),
  };
  // The AI report expects `activityCount` / `wellbeingCount`, but we only
  // have combined health-log counts today — pass those under both names so
  // the prompt reads sensibly.
  data.activityCount = monthly.healthCount;
  data.wellbeingCount = monthly.healthCount;

  const variant = isPaid(session.user) ? "paid" : "free";

  let body;
  try {
    body = await progressReport(session.user, data, variant);
  } catch (e) {
    console.error("progressReport error:", e?.message);
    return send(bot, chatId, t(lang, e?.aiLimited ? "error_ai_limit" : "error_generic"), {
      keyboard: backKeyboard(lang),
      markdown: true,
    });
  }

  // Small deterministic Goals header so the user always sees their goals
  // reflected — the AI narrative expands on the progress.
  const goalsHeader = t(lang, "progress_goals_header");
  const goalsList = goals.length
    ? goals.map((g, i) => `${i + 1}. ${sanitizeMd(g.title || "")}`).join("\n")
    : t(lang, "progress_no_goals");

  const intro = variant === "paid" ? `${t(lang, "progress_paid_intro")}\n\n` : "";
  let full = `${t(lang, "progress_title")}\n\n${intro}${goalsHeader}\n${goalsList}\n\n${body}`;
  if (variant === "free") full += upgradeBlock(lang);

  return send(bot, chatId, full, {
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
    const key = e?.aiLimited ? "error_ai_limit" : "error_generic";
    await send(bot, chatId, t(lang, key), { keyboard: backKeyboard(lang) });
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
