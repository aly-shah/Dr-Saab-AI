// 📈 My Health → Trends.
//
// Deterministic analysis of the user's stored health data — fasting and
// random glucose, HbA1c and weight — compared against the goals they set
// under My Health → Goals. No AI: every line is computed from the rows, so
// the section is instant, free and unit-testable on the memory backend.
//
// Rules (spec 2026-09-15):
//   • no data at all → ask the user to add health data consistently
//   • limited data   → list the last entries, most recent first
//   • enough data    → trend (early vs recent average / first vs latest)
//   • no goals       → ask for goals to get a better analysis
//   • goals          → each goal compared with the matching metric

import {
  recentGlucose,
  recentWeights,
  latestMetrics,
  recentLabReports,
  getLatestHealthGoal,
} from "./supabase.js";
import { bucketOf, glucoseStatus, fmtDate, dayKey } from "./snapshotData.js";
import { splitGoalLines, sanitizeMd } from "./utils.js";
import { t } from "./i18n.js";

const DAY_MS = 86400000;
export const TREND_WINDOW_DAYS = 90;
export const MIN_READINGS_FOR_TREND = 4; // per glucose kind, inside the window
export const MIN_SPAN_DAYS = 7; // first → last must cover at least a week
const GLUCOSE_STEP = 5; // mg/dL change before we call it a move
const HBA1C_STEP = 0.2; // percentage points
const WEIGHT_STEP = 0.5; // kg
const LIST_LIMIT = 5; // entries shown when data is limited
const RECENT_GLUCOSE_N = 7; // readings averaged as the "current" glucose level

const round1 = (v) => Math.round(Number(v) * 10) / 10;
const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
const byTimeAsc = (a, b) => a.at - b.at;
const point = (value, at, source = "log") => ({ value, at: new Date(at), source });
const spanDays = (series) => (series.length < 2 ? 0 : (series[series.length - 1].at - series[0].at) / DAY_MS);

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
export async function assembleTrendData(user, now = Date.now()) {
  const [glucoseRows, weightRows, metrics, labs, goalRow] = await Promise.all([
    recentGlucose(user.id, 400).catch(() => []),
    recentWeights(user.id, 200).catch(() => []),
    latestMetrics(user.id).catch(() => []),
    recentLabReports(user.id, 10).catch(() => []),
    getLatestHealthGoal(user.id).catch(() => null),
  ]);

  const fasting = [];
  const random = [];
  const hba1c = [];
  const weight = [];

  for (const r of glucoseRows || []) {
    const v = Number(r.value_mgdl);
    const at = new Date(r.created_at).getTime();
    if (!Number.isFinite(v) || !Number.isFinite(at)) continue;
    const b = bucketOf(r.context);
    if (b === "hba1c") {
      if (v > 3 && v < 20) hba1c.push(point(round1(v), at));
      continue;
    }
    (b === "fasting" ? fasting : random).push(point(Math.round(v), at));
  }
  for (const m of metrics || []) {
    const at = new Date(m.measurement_date || m.created_at).getTime();
    const v = Number(m.value);
    if (!Number.isFinite(at) || !Number.isFinite(v)) continue;
    if (m.metric_type === "hba1c" && v > 3 && v < 20) hba1c.push(point(round1(v), at, "profile"));
    if (m.metric_type === "weight" && v > 0) weight.push(point(round1(v), at, "profile"));
  }
  for (const rep of labs || []) {
    const values = Array.isArray(rep.values) ? rep.values : Array.isArray(rep.lab_values) ? rep.lab_values : [];
    const at = new Date(rep.metadata?.report_date || rep.created_at).getTime();
    if (!Number.isFinite(at)) continue;
    for (const v of values) {
      if (!/hba1c|a1c|glycated|glycosylated/i.test(String(v?.test || ""))) continue;
      const num = parseFloat(String(v.result || ""));
      if (num > 3 && num < 20) hba1c.push(point(round1(num), at, "lab"));
    }
  }
  for (const w of weightRows || []) {
    const v = Number(w.weight_kg);
    const at = new Date(w.created_at).getTime();
    if (v > 0 && Number.isFinite(at)) weight.push(point(round1(v), at));
  }
  if (!weight.length && Number(user.weight_kg) > 0) {
    weight.push(point(round1(user.weight_kg), user.updated_at || now, "profile"));
  }

  // The same HbA1c typed once and read again from a lab report collapses to
  // one point per day/value.
  const dedupe = (arr) => {
    const seen = new Set();
    return arr.sort(byTimeAsc).filter((p) => {
      const k = `${dayKey(p.at)}|${p.value}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  return {
    now,
    since: now - TREND_WINDOW_DAYS * DAY_MS,
    glucose: { fasting: fasting.sort(byTimeAsc), random: random.sort(byTimeAsc) },
    hba1c: dedupe(hba1c),
    weight: dedupe(weight),
    goals: splitGoalLines(goalRow?.goal || user.goals || user.primary_goal || ""),
    goalsSetAt: goalRow?.created_at ? new Date(goalRow.created_at) : null,
  };
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------
function direction(delta, step) {
  if (delta <= -step) return "down";
  if (delta >= step) return "up";
  return "steady";
}

function glucoseAnalysis(series, bucket, since) {
  if (!series.length) return { status: "none" };
  const recent = series.filter((p) => p.at.getTime() >= since);
  if (recent.length < MIN_READINGS_FOR_TREND || spanDays(recent) < MIN_SPAN_DAYS) {
    return { status: "limited", entries: series.slice(-LIST_LIMIT).reverse() };
  }
  const vals = recent.map((p) => p.value);
  const half = Math.floor(vals.length / 2);
  const early = Math.round(mean(vals.slice(0, half)));
  const late = Math.round(mean(vals.slice(half)));
  const delta = late - early;
  const inRange = recent.filter((p) => glucoseStatus(p.value, bucket).level === "good").length;
  return {
    status: "trend",
    count: recent.length,
    avg: Math.round(mean(vals)),
    early,
    late,
    delta,
    direction: direction(delta, GLUCOSE_STEP),
    inRangePct: Math.round((inRange / recent.length) * 100),
    latest: series[series.length - 1],
  };
}

function pairAnalysis(series, step, minSpan) {
  if (!series.length) return { status: "none" };
  if (series.length < 2 || spanDays(series) < minSpan) {
    return { status: "limited", entries: series.slice(-LIST_LIMIT).reverse() };
  }
  const first = series[0];
  const last = series[series.length - 1];
  const delta = round1(last.value - first.value);
  return { status: "trend", first, last, delta, direction: direction(delta, step) };
}

// Turn one goal line into a measurable target where we can.
//   { metric: "hba1c"|"weight"|"fasting"|"random"|null,
//     mode: "relative"|"absolute"|"watch"|"unmeasured", amount?, target? }
export function parseGoalTarget(line) {
  const s = String(line || "").toLowerCase();
  const num = (re) => {
    const m = s.match(re);
    return m ? parseFloat(m[1]) : null;
  };
  if (/hba1c|a1c/.test(s)) {
    const by = num(/\bby\s*(\d+(?:\.\d+)?)\s*%?/);
    if (by != null) return { metric: "hba1c", mode: "relative", amount: -by };
    const to = num(/(?:under|below|less than|to|reach|<|at|of)\s*(\d+(?:\.\d+)?)\s*%?/);
    if (to != null) return { metric: "hba1c", mode: "absolute", target: to };
    const bare = num(/\b(\d+(?:\.\d+)?)\s*%?/);
    if (bare != null && bare >= 4 && bare <= 15) return { metric: "hba1c", mode: "absolute", target: bare };
    return { metric: "hba1c", mode: "watch" };
  }
  if (/kgs?\b|kilos?\b|weight|wazan/.test(s)) {
    const n = num(/(\d+(?:\.\d+)?)\s*(?:kgs?|kilos?)/) ?? num(/(\d+(?:\.\d+)?)/);
    if (n != null && /lose|loose|reduce|drop|shed|cut|kam/.test(s)) return { metric: "weight", mode: "relative", amount: -n };
    if (n != null && /gain|put on|increase|barha/.test(s)) return { metric: "weight", mode: "relative", amount: n };
    if (n != null && n >= 30 && n <= 300) return { metric: "weight", mode: "absolute", target: n };
    return { metric: "weight", mode: "watch" };
  }
  if (/sugar|glucose|fasting|random|shakar|\bbs\b/.test(s)) {
    const bucket = /random|after|post/.test(s) ? "random" : "fasting";
    const n = num(/(?:under|below|less than|to|reach|<|around|at)\s*(\d{2,3})\b/) ?? num(/\b(\d{2,3})\b/);
    if (n != null && n >= 60 && n <= 400) return { metric: bucket, mode: "absolute", target: n };
    return { metric: bucket, mode: "watch" };
  }
  return { metric: null, mode: "unmeasured" };
}

const UNIT = { hba1c: "%", weight: " kg", fasting: " mg/dL", random: " mg/dL" };

// Baseline for a goal: the first value on record at or after the goals were
// set (with a week's grace), else the earliest point we have.
function baselinePoint(series, goalsSetAt) {
  if (goalsSetAt) {
    const cutoff = goalsSetAt.getTime() - 7 * DAY_MS;
    const hit = series.find((p) => p.at.getTime() >= cutoff);
    if (hit && hit !== series[series.length - 1]) return hit;
  }
  return series[0];
}

function currentValue(metric, series) {
  if (metric === "fasting" || metric === "random") {
    return Math.round(mean(series.slice(-RECENT_GLUCOSE_N).map((p) => p.value)));
  }
  return series[series.length - 1].value;
}

function compareGoal(goal, d) {
  const target = parseGoalTarget(goal);
  if (!target.metric) return { goal, kind: "unmeasured" };
  const series =
    target.metric === "hba1c" ? d.hba1c : target.metric === "weight" ? d.weight : d.glucose[target.metric];
  if (!series.length) return { goal, kind: "nodata", metric: target.metric };
  const unit = UNIT[target.metric];
  const current = currentValue(target.metric, series);
  const base = baselinePoint(series, d.goalsSetAt);
  const achieved = round1(current - base.value);

  if (target.mode === "relative" && series.length >= 2) {
    const done = target.amount < 0 ? achieved <= target.amount : achieved >= target.amount;
    const remaining = round1(Math.abs(target.amount - achieved));
    const wrongWay = achieved !== 0 && Math.sign(achieved) !== Math.sign(target.amount);
    return { goal, kind: done ? "done" : "relative", metric: target.metric, unit, current, achieved, remaining, wrongWay };
  }
  if (target.mode === "absolute") {
    const gap = round1(current - target.target);
    const done = target.metric === "weight" ? Math.abs(gap) <= WEIGHT_STEP : gap <= 0;
    return { goal, kind: done ? "done" : "absolute", metric: target.metric, unit, current, target: target.target, gap: round1(Math.abs(gap)), above: gap > 0 };
  }
  // "watch" (no number we could read) or a relative goal with one reading.
  return { goal, kind: "watch", metric: target.metric, unit, current, baseline: base.value, baselineDate: base.at, achieved };
}

export function analyzeTrends(d) {
  const fasting = glucoseAnalysis(d.glucose.fasting, "fasting", d.since);
  const random = glucoseAnalysis(d.glucose.random, "random", d.since);
  const hba1c = pairAnalysis(d.hba1c, HBA1C_STEP, 1);
  const weight = pairAnalysis(d.weight, WEIGHT_STEP, MIN_SPAN_DAYS);
  const hasAnyData = [fasting, random, hba1c, weight].some((a) => a.status !== "none");
  const notTracked = [
    ["fasting", fasting],
    ["random", random],
    ["hba1c", hba1c],
    ["weight", weight],
  ]
    .filter(([, a]) => a.status === "none")
    .map(([k]) => k);
  return {
    hasAnyData,
    fasting,
    random,
    hba1c,
    weight,
    notTracked,
    goals: d.goals.length ? d.goals.map((g) => compareGoal(g, d)) : null,
  };
}

// ---------------------------------------------------------------------------
// Rendering (Markdown for Telegram / WhatsApp / web)
// ---------------------------------------------------------------------------
const arrowOf = (dir) => (dir === "down" ? "↓" : dir === "up" ? "↑" : "→");
const fmtVal = (metric, v) => (metric === "hba1c" ? `${round1(v)}%` : metric === "weight" ? `${round1(v)} kg` : `${Math.round(v)} mg/dL`);
const metricName = (lang, metric) => t(lang, `mh_tr_name_${metric}`);

function wordFor(lang, metric, dir) {
  if (dir === "steady") return t(lang, "mh_tr_word_steady");
  if (metric === "weight") return t(lang, dir === "down" ? "mh_tr_word_down" : "mh_tr_word_up");
  return t(lang, dir === "down" ? "mh_tr_word_improving" : "mh_tr_word_rising");
}

function renderLimited(lang, metric, a) {
  const lines = [t(lang, "mh_tr_limited", { count: a.entries.length })];
  for (const p of a.entries) lines.push(t(lang, "mh_tr_entry", { date: fmtDate(p.at), value: fmtVal(metric, p.value) }));
  return lines;
}

function renderGlucose(lang, metric, a) {
  if (a.status === "none") return [];
  const lines = [t(lang, `mh_tr_${metric}`)];
  if (a.status === "limited") return lines.concat(renderLimited(lang, metric, a), "");
  lines.push(t(lang, "mh_tr_glucose_stats", { count: a.count, avg: a.avg, pct: a.inRangePct }));
  lines.push(
    t(lang, "mh_tr_glucose_move", {
      early: a.early,
      late: a.late,
      arrow: arrowOf(a.direction),
      delta: Math.abs(a.delta),
      word: wordFor(lang, metric, a.direction),
    })
  );
  lines.push(t(lang, "mh_tr_latest", { value: fmtVal(metric, a.latest.value), date: fmtDate(a.latest.at) }));
  lines.push("");
  return lines;
}

function renderPair(lang, metric, a) {
  if (a.status === "none") return [];
  const lines = [t(lang, `mh_tr_${metric}`)];
  if (a.status === "limited") return lines.concat(renderLimited(lang, metric, a), "");
  lines.push(
    t(lang, "mh_tr_change", {
      from: fmtVal(metric, a.first.value),
      fromDate: fmtDate(a.first.at),
      to: fmtVal(metric, a.last.value),
      toDate: fmtDate(a.last.at),
      arrow: arrowOf(a.direction),
      delta: fmtVal(metric, Math.abs(a.delta)),
      word: wordFor(lang, metric, a.direction),
    })
  );
  lines.push("");
  return lines;
}

function renderGoal(lang, c) {
  const goal = sanitizeMd(c.goal);
  const abs = (v) => fmtVal(c.metric, Math.abs(v));
  switch (c.kind) {
    case "done":
      return t(lang, "mh_tr_goal_done", { goal, current: fmtVal(c.metric, c.current) });
    case "relative":
      return t(lang, "mh_tr_goal_relative", {
        goal,
        arrow: c.achieved === 0 ? "→" : c.achieved < 0 ? "↓" : "↑",
        achieved: abs(c.achieved),
        remaining: abs(c.remaining),
        note: c.wrongWay ? t(lang, "mh_tr_goal_wrongway") : "",
      });
    case "absolute":
      return t(lang, "mh_tr_goal_absolute", {
        goal,
        current: fmtVal(c.metric, c.current),
        target: fmtVal(c.metric, c.target),
        gap: abs(c.gap),
      });
    case "watch":
      return t(lang, "mh_tr_goal_watch", {
        goal,
        current: fmtVal(c.metric, c.current),
        baseline: fmtVal(c.metric, c.baseline),
        date: fmtDate(c.baselineDate),
      });
    case "nodata":
      return t(lang, "mh_tr_goal_nodata", { goal, metric: metricName(lang, c.metric) });
    default:
      return t(lang, "mh_tr_goal_unmeasured", { goal });
  }
}

export function renderTrends(lang, a) {
  if (!a.hasAnyData) {
    const lines = [t(lang, "mh_trends_nodata")];
    if (!a.goals) lines.push("", t(lang, "mh_trends_nogoals"));
    return lines.join("\n");
  }
  const lines = [t(lang, "mh_trends_title", { days: TREND_WINDOW_DAYS }), ""];
  lines.push(...renderGlucose(lang, "fasting", a.fasting));
  lines.push(...renderGlucose(lang, "random", a.random));
  lines.push(...renderPair(lang, "hba1c", a.hba1c));
  lines.push(...renderPair(lang, "weight", a.weight));

  if (a.goals) {
    lines.push(t(lang, "mh_tr_goals_header"));
    for (const c of a.goals) lines.push(renderGoal(lang, c));
  } else {
    lines.push(t(lang, "mh_trends_nogoals"));
  }
  if (a.notTracked.length) {
    lines.push("", t(lang, "mh_tr_not_tracked", { list: a.notTracked.map((m) => metricName(lang, m)).join(", ") }));
  }
  return lines.join("\n");
}
