// Weekly summary — written from the numbers, no AI call.
//
// Replaces openai.js#weeklySummary (2026-09-22). The AI was only ever given
// counts, an average, a range and the streak, so the same facts are assembled
// here from `periodStats(user, 7)`: identical numbers, zero tokens, and the
// wording is localised properly instead of being translated by the model.
//
// Shape matches what the prompt asked the model for: celebrate consistency,
// gently flag anything to watch, and give ONE focus for next week.

import { t } from "./i18n.js";

// Thresholds match the rest of the app (see supabase.periodStats and
// tracking.js): in-range is ≤130 fasting / ≤180 otherwise, low is <70.
const LOW = 70;
const AVG_HIGH = 180;
const AVG_MODERATE = 140;
const READINGS_PER_WEEK_TARGET = 7;
const IN_RANGE_TARGET = 50;
const CHECKIN_TARGET = 3;

// "Anything to watch" — first match wins, most clinically relevant first.
function watchKey(stats) {
  if (!stats.glucoseCount) return null;
  if (stats.glucoseMin != null && stats.glucoseMin < LOW) return "wsum_watch_low";
  if (stats.glucoseAvg != null && stats.glucoseAvg > AVG_HIGH) return "wsum_watch_high";
  if (stats.glucoseAvg != null && stats.glucoseAvg > AVG_MODERATE) return "wsum_watch_mid";
  return "wsum_watch_good";
}

// The single focus for next week — first match wins.
function focusKey(stats, hasMeds) {
  if (stats.glucoseCount < READINGS_PER_WEEK_TARGET) return "wsum_focus_log_more";
  if (stats.glucoseMin != null && stats.glucoseMin < LOW) return "wsum_focus_low";
  if (stats.inRangePct != null && stats.inRangePct < IN_RANGE_TARGET) return "wsum_focus_range";
  if (hasMeds && !stats.medicationCount) return "wsum_focus_meds";
  if (stats.healthCount < CHECKIN_TARGET) return "wsum_focus_checkin";
  return "wsum_focus_keep";
}

/**
 * @param {object} user   user row (streak, medications)
 * @param {object} stats  periodStats(user.id, 7)
 * @param {string} lang   en | ur | roman_ur
 * @returns {string} the summary shown to the user
 */
export function buildWeeklySummary(user, stats, lang = "en") {
  const hasMeds = !!String(user?.medications || "").trim();
  const streak = Number(user?.streak) || 0;
  const lines = [t(lang, "wsum_title")];

  if (stats.glucoseCount) {
    lines.push(
      t(lang, "wsum_readings", {
        count: stats.glucoseCount,
        avg: stats.glucoseAvg,
        min: stats.glucoseMin,
        max: stats.glucoseMax,
      }),
    );
    if (stats.inRangePct != null) lines.push(t(lang, "wsum_inrange", { pct: stats.inRangePct }));
  } else {
    lines.push(t(lang, "wsum_no_readings"));
  }

  if (stats.medicationCount) lines.push(t(lang, "wsum_meds", { count: stats.medicationCount }));
  else if (hasMeds) lines.push(t(lang, "wsum_meds_none"));

  if (stats.healthCount) lines.push(t(lang, "wsum_checkins", { count: stats.healthCount }));
  if (streak > 0) lines.push(t(lang, "wsum_streak", { days: streak }));

  const watch = watchKey(stats);
  if (watch) lines.push(t(lang, watch));
  lines.push(t(lang, focusKey(stats, hasMeds)));

  return lines.join("\n");
}
