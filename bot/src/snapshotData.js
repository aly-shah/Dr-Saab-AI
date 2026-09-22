// Executive Health Snapshot — data assembly.
//
// Pulls everything the "Generate Report" PDF needs out of the user's record
// and turns it into plain numbers/strings: profile, latest glucose results,
// 14-day and 90-day trend series, other lab results, current medicines,
// lifestyle counters, the DrSaab Health Score, plus a compact "facts" block
// the AI uses to write the summaries. No AI and no rendering here, so every
// function is unit-testable against the memory backend.

import {
  snapshotRaw,
  recentLabReports,
  latestMetrics,
  listMedications,
  listUserChallengesActive,
  listUserChallengesHistory,
  getLatestHealthGoal,
} from "./supabase.js";
import { bmi, bmiCategory } from "./clinic.js";
import { splitGoalLines } from "./utils.js";

export const TZ = "Asia/Karachi";
const DAY_MS = 86400000;

// Data thresholds printed at the bottom of the trends card and used by the
// flow to decide whether to ask the user for more readings first.
export const TREND_RULES = {
  weeklyDays: 14,
  weeklyMinFasting: 3,
  weeklyMinRandom: 3,
  monthlyDays: 90,
  monthlyMinTotal: 8,
  monthlyMinFasting: 3,
  monthlyMinRandom: 3,
};

// ---------------------------------------------------------------------------
// Dates (everything user-facing is in Pakistan time)
// ---------------------------------------------------------------------------
export function dayKey(d) {
  // en-CA formats as YYYY-MM-DD, which sorts and compares as a plain string.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(d));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "24 Jul 2026" (withYear) or "24 Jul" in Pakistan time.
export function fmtDate(d, withYear = true) {
  const [y, m, day] = dayKey(d).split("-").map(Number);
  return `${day} ${MONTHS[m - 1]}${withYear ? " " + y : ""}`;
}

export function fmtMonth(d) {
  const [y, m] = dayKey(d).split("-").map(Number);
  return `${MONTHS[m - 1]} '${String(y).slice(2)}`;
}

export function fmtTime(d) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(d));
}

// ---------------------------------------------------------------------------
// Glucose helpers
// ---------------------------------------------------------------------------

// glucose_logs.context is fasting | pre_meal | post_meal | bedtime | random,
// and (via addGlucoseFull) "hba1c" for percentages typed into the sugar
// flow. The report follows the sample: two series, fasting and random.
export function bucketOf(context) {
  const c = String(context || "").toLowerCase();
  if (c === "hba1c") return "hba1c";
  if (c.startsWith("fast")) return "fasting";
  return "random";
}

// Traffic-light status for a reading. Levels: good | above | high | low.
export function glucoseStatus(value, bucket) {
  const v = Number(value);
  if (!Number.isFinite(v)) return { level: "unknown", label: "—" };
  if (bucket === "hba1c") {
    if (v < 7) return { level: "good", label: "Good" };
    if (v <= 8) return { level: "above", label: "Above Target" };
    return { level: "high", label: "High" };
  }
  if (v < 70) return { level: "low", label: "Low" };
  const goodMax = bucket === "fasting" ? 130 : 180;
  const aboveMax = bucket === "fasting" ? 180 : 250;
  if (v <= goodMax) return { level: "good", label: "Good" };
  if (v <= aboveMax) return { level: "above", label: "Above Target" };
  return { level: "high", label: "High" };
}

function within(rows, sinceMs, now) {
  return rows.filter((r) => {
    const t = new Date(r.created_at).getTime();
    return Number.isFinite(t) && t >= now - sinceMs && t <= now + DAY_MS;
  });
}

// Are there enough readings to draw the two trend charts? Mirrors the rule
// printed on the report so the flow's "please add readings" prompt and the
// PDF never disagree.
export function glucoseSufficiency(rows, now = Date.now()) {
  const R = TREND_RULES;
  const real = (rows || []).filter((r) => bucketOf(r.context) !== "hba1c");
  const w = within(real, R.weeklyDays * DAY_MS, now);
  const m = within(real, R.monthlyDays * DAY_MS, now);
  const count = (arr, b) => arr.filter((r) => bucketOf(r.context) === b).length;
  const weekly = { fasting: count(w, "fasting"), random: count(w, "random"), total: w.length };
  weekly.enough = weekly.fasting >= R.weeklyMinFasting && weekly.random >= R.weeklyMinRandom;
  const monthly = { fasting: count(m, "fasting"), random: count(m, "random"), total: m.length };
  monthly.enough =
    monthly.total >= R.monthlyMinTotal &&
    monthly.fasting >= R.monthlyMinFasting &&
    monthly.random >= R.monthlyMinRandom;
  return { weekly, monthly, total: real.length };
}

// Per-day averaged series for the last `days` days, oldest first.
// [{ key:"2026-07-18", date:Date, fasting:number|null, random:number|null }]
export function dailySeries(rows, days, now = Date.now()) {
  const byDay = new Map();
  for (const r of rows || []) {
    const b = bucketOf(r.context);
    if (b === "hba1c") continue;
    const v = Number(r.value_mgdl);
    if (!Number.isFinite(v)) continue;
    const key = dayKey(r.created_at);
    const slot = byDay.get(key) || { fasting: [], random: [] };
    slot[b].push(v);
    byDay.set(key, slot);
  }
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * DAY_MS);
    const key = dayKey(date);
    const slot = byDay.get(key);
    const avg = (arr) => (arr && arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
    out.push({ key, date, fasting: avg(slot?.fasting), random: avg(slot?.random) });
  }
  return out;
}

function seriesStats(series, field) {
  const vals = series.map((d) => d[field]).filter((v) => v != null);
  if (!vals.length) return { count: 0, avg: null, min: null, max: null, first: null, last: null };
  return {
    count: vals.length,
    avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    min: Math.min(...vals),
    max: Math.max(...vals),
    first: vals[0],
    last: vals[vals.length - 1],
  };
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export const DIABETES_LABEL = {
  type1: "Type 1 Diabetes",
  type2: "Type 2 Diabetes",
  prediabetes: "Prediabetes",
  gestational: "Gestational Diabetes",
  atrisk: "At Risk",
  notsure: "Not specified",
};

const GENDER_LABEL = { male: "Male", female: "Female", other: "Other" };

// Profile fields the PDF cannot do without. The flow asks for each missing
// one before generating. Order = the order the questions are asked.
export const REQUIRED_PROFILE_FIELDS = ["name", "age", "gender", "diabetes", "height", "weight"];

export function missingProfileFields(user) {
  const u = user || {};
  const missing = [];
  if (!String(u.name || "").trim()) missing.push("name");
  if (!(Number(u.age) > 0)) missing.push("age");
  if (!GENDER_LABEL[String(u.gender || "").toLowerCase()]) missing.push("gender");
  if (!u.diabetes_status) missing.push("diabetes");
  if (!(Number(u.height_cm) > 0)) missing.push("height");
  if (!(Number(u.weight_kg) > 0)) missing.push("weight");
  return missing;
}

function bmiLabel(cat) {
  return { underweight: "Underweight", healthy: "Healthy", overweight: "Overweight", obese: "Obese" }[cat] || "";
}

// ---------------------------------------------------------------------------
// Other lab results
// ---------------------------------------------------------------------------
const LAB_NAMES = [
  [/hba1c|a1c|glycated|glycosylated/i, null],
  [/(fasting|random|post|pre)[\s-]*(plasma|blood)?\s*(glucose|sugar)|\bfbs\b|\bfpg\b|\brbs\b|^glucose$/i, null],
  [/creatinine/i, "Creatinine"],
  [/\begfr\b|\bgfr\b/i, "eGFR"],
  [/\bldl\b/i, "LDL Cholesterol"],
  [/\bhdl\b/i, "HDL Cholesterol"],
  [/triglycer/i, "Triglycerides"],
  [/total\s*cholesterol|^cholesterol/i, "Total Cholesterol"],
  [/vitamin\s*d\b|25[\s-]*oh/i, "Vitamin D"],
  [/vitamin\s*b\s*12|\bb12\b/i, "Vitamin B12"],
  [/\balt\b|sgpt/i, "ALT (SGPT)"],
  [/\bast\b|sgot/i, "AST (SGOT)"],
  [/\burea\b|\bbun\b/i, "Urea"],
  [/uric/i, "Uric Acid"],
  [/microalbumin|albumin/i, "Urine Albumin"],
  [/\btsh\b/i, "TSH"],
  [/ha?emoglobin|\bhb\b/i, "Hemoglobin"],
  [/blood\s*pressure|\bbp\b/i, "Blood Pressure"],
];

function labDisplayName(test) {
  const raw = String(test || "").trim();
  if (!raw) return null;
  for (const [re, name] of LAB_NAMES) {
    if (re.test(raw)) return name; // null = belongs to the glucose section
  }
  // Unknown test: keep it, tidied and shortened.
  const tidy = raw.replace(/\s+/g, " ");
  return tidy.length > 22 ? tidy.slice(0, 21) + "…" : tidy;
}

function parseRange(ref) {
  const s = String(ref || "").replace(/,/g, "");
  let m = s.match(/(-?\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(-?\d+(?:\.\d+)?)/);
  if (m) return { lo: Number(m[1]), hi: Number(m[2]) };
  m = s.match(/[<≤]\s*=?\s*(\d+(?:\.\d+)?)/);
  if (m) return { lo: null, hi: Number(m[1]) };
  m = s.match(/[>≥]\s*=?\s*(\d+(?:\.\d+)?)/);
  if (m) return { lo: Number(m[1]), hi: null };
  return null;
}

// tone: good | warn | bad | muted
export function labStatus(v) {
  const status = String(v?.status || "").toLowerCase();
  const num = parseFloat(String(v?.result || "").replace(/,/g, ""));
  const range = parseRange(v?.reference_range);
  if (status === "in_range") return { label: "Normal", tone: "good" };
  if (status === "borderline") {
    if (range && Number.isFinite(num)) {
      if (range.hi != null && num > range.hi) return { label: "Borderline High", tone: "warn" };
      if (range.lo != null && num < range.lo) return { label: "Borderline Low", tone: "warn" };
    }
    return { label: "Borderline", tone: "warn" };
  }
  if (status === "out_of_range") {
    if (range && Number.isFinite(num)) {
      if (range.hi != null && num > range.hi) return { label: "High", tone: "bad" };
      if (range.lo != null && num < range.lo) return { label: "Low", tone: "bad" };
    }
    return { label: "Abnormal", tone: "bad" };
  }
  return { label: "—", tone: "muted" };
}

function bpStatus(sys, dia) {
  if (!(sys > 0)) return { label: "—", tone: "muted" };
  if (sys < 130 && (dia == null || dia < 85)) return { label: "Normal", tone: "good" };
  if (sys < 140 && (dia == null || dia < 90)) return { label: "Borderline", tone: "warn" };
  return { label: "High", tone: "bad" };
}

function reportDate(rep) {
  const rd = rep?.metadata?.report_date;
  if (rd) {
    const t = new Date(rd).getTime();
    if (Number.isFinite(t) && t > 0) return fmtDate(t);
  }
  return rep?.created_at ? fmtDate(rep.created_at) : null;
}

async function assembleLabs(userId, metrics) {
  const reports = await recentLabReports(userId, 10).catch(() => []);
  const seen = new Set();
  const labs = [];
  let latestDate = null;
  for (const rep of reports || []) {
    const values = Array.isArray(rep.values) ? rep.values : [];
    for (const v of values) {
      const name = labDisplayName(v?.test);
      if (!name || seen.has(name) || name === "Blood Pressure") continue;
      const result = String(v?.result ?? "").trim();
      if (!result) continue;
      seen.add(name);
      if (!latestDate) latestDate = rep.metadata?.report_date || rep.created_at || null;
      labs.push({
        name,
        value: `${result}${v?.unit ? " " + String(v.unit).trim() : ""}`,
        date: reportDate(rep),
        ...labStatus(v),
      });
    }
  }
  const bp = (metrics || []).find((m) => m.metric_type === "blood_pressure" && m.value != null);
  if (bp) {
    labs.push({
      name: "Blood Pressure",
      date: bp.measurement_date || bp.created_at ? fmtDate(bp.measurement_date || bp.created_at) : null,
      value: `${Math.round(bp.value)}/${bp.secondary_value != null ? Math.round(bp.secondary_value) : "—"} mmHg`,
      ...bpStatus(Number(bp.value), bp.secondary_value != null ? Number(bp.secondary_value) : null),
    });
  }
  return { items: labs.slice(0, 8), total: labs.length, latestDate };
}

// ---------------------------------------------------------------------------
// Medicines
// ---------------------------------------------------------------------------
const FREQ_LABEL = {
  once_daily: "once daily",
  morning_evening: "morning & evening",
  three_times: "three times daily",
  twice_daily: "twice daily",
  other: "",
};

function prettyFrequency(f) {
  if (!f) return "";
  const s = String(f).trim();
  if (FREQ_LABEL[s] !== undefined) return FREQ_LABEL[s];
  return s.replace(/_/g, " ");
}

export async function currentMedicines(user) {
  const rows = await listMedications(user.id).catch(() => []);
  const meds = (rows || [])
    .filter((m) => m && m.name)
    .map((m) => ({
      name: String(m.name).trim(),
      dose: m.dose ? String(m.dose).trim() : "",
      frequency: prettyFrequency(m.frequency),
    }));
  if (meds.length) return meds;

  // Onboarding captured medicines as plain strings — fall back to those.
  const fromJson = []
    .concat(Array.isArray(user.diabetes_meds) ? user.diabetes_meds : [])
    .concat(Array.isArray(user.non_diabetes_meds) ? user.non_diabetes_meds : [])
    .map((s) => (typeof s === "string" ? s : s?.name || ""))
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromJson.length) return fromJson.map((name) => ({ name, dose: "", frequency: "" }));

  const text = String(user.medications || "").trim();
  if (!text || /^(none|no|nil|n\/a|-)$/i.test(text)) return [];
  return text
    .split(/[;\n]|,\s(?=[A-Za-z])/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((name) => ({ name, dose: "", frequency: "" }));
}

// ---------------------------------------------------------------------------
// Health score (0–100). Cheap, explainable, no AI.
// ---------------------------------------------------------------------------
function distinctDays(rows) {
  return new Set((rows || []).map((r) => dayKey(r.created_at))).size;
}

export function computeScore({ glucose30, medLogs30, health30, hasMeds, activeChallenges, pastChallenges }) {
  const ratio = (n, target) => Math.min(1, n / target);
  const gDays = distinctDays(glucose30);
  const glucoseR = ratio(gDays, 24); // ~6 days a week
  const medDays = distinctDays(medLogs30);
  const medR = hasMeds ? ratio(medDays, 24) : glucoseR; // no medicines on record → don't penalise
  const actDays = distinctDays(health30.filter((h) => h.steps != null || (h.note && !h.weight_kg)));
  const actR = ratio(actDays, 12); // ~3 a week
  const weightN = health30.filter((h) => h.weight_kg != null).length;
  const weightR = ratio(weightN, 4);
  const chalR = activeChallenges > 0 ? 1 : pastChallenges > 0 ? 0.6 : 0;

  const components = [
    { key: "glucose", label: "Glucose Logging Consistency", score: Math.round(glucoseR * 40), max: 40 },
    { key: "medication", label: "Medication Adherence", score: Math.round(medR * 20), max: 20 },
    { key: "activity", label: "Activity Logging", score: Math.round(actR * 20), max: 20 },
    { key: "weight", label: "Weight Logging", score: Math.round(weightR * 10), max: 10 },
    { key: "challenge", label: "Challenge Participation", score: Math.round(chalR * 10), max: 10 },
  ];
  const total = components.reduce((a, c) => a + c.score, 0);
  const rating =
    total >= 85 ? "Excellent" : total >= 70 ? "Good" : total >= 50 ? "Fair" : "Needs Focus";
  return { total, rating, components };
}

// ---------------------------------------------------------------------------
// Assemble everything
// ---------------------------------------------------------------------------
export async function assembleSnapshotData(user, now = Date.now()) {
  const [raw, metrics, meds, activeChal, pastChal, goalRow] = await Promise.all([
    snapshotRaw(user.id),
    latestMetrics(user.id).catch(() => []),
    currentMedicines(user),
    listUserChallengesActive(user.id).catch(() => []),
    listUserChallengesHistory(user.id).catch(() => []),
    getLatestHealthGoal(user.id).catch(() => null),
  ]);

  // The patient's stated goals (My Health → Goals) — the baseline the
  // report's insights are written against.
  const goals = splitGoalLines(goalRow?.goal || user.goals || user.primary_goal || "");

  const glucoseAll = (raw.glucose || []).filter((r) => bucketOf(r.context) !== "hba1c");
  const hba1cLogs = (raw.glucose || []).filter((r) => bucketOf(r.context) === "hba1c");

  // ---- profile ----
  const bmiVal = bmi(user.weight_kg, user.height_cm);
  const profile = {
    name: String(user.name || "").trim() || "—",
    age: Number(user.age) > 0 ? Number(user.age) : null,
    gender: GENDER_LABEL[String(user.gender || "").toLowerCase()] || "—",
    diabetesType: DIABETES_LABEL[user.diabetes_status] || (user.diabetes_status ? String(user.diabetes_status) : "—"),
    height_cm: Number(user.height_cm) > 0 ? Number(user.height_cm) : null,
    weight_kg: Number(user.weight_kg) > 0 ? Number(user.weight_kg) : null,
    bmi: bmiVal,
    bmiCategory: bmiLabel(bmiCategory(bmiVal)),
  };

  // ---- latest readings ----
  const newest = (b) => {
    const rows = glucoseAll.filter((r) => bucketOf(r.context) === b);
    return rows.length ? rows[rows.length - 1] : null;
  };
  const latestOf = (b) => {
    const r = newest(b);
    if (r) {
      return {
        value: Math.round(Number(r.value_mgdl)),
        unit: "mg/dL",
        date: fmtDate(r.created_at),
        time: fmtTime(r.created_at),
        at: new Date(r.created_at),
        ...glucoseStatus(r.value_mgdl, b),
      };
    }
    // Onboarding self-report (no timestamp — the bucket is a rough age).
    const v = b === "fasting" ? user.latest_fasting_sugar : user.latest_random_sugar;
    if (Number(v) > 0) {
      return { value: Math.round(Number(v)), unit: "mg/dL", date: "Self-reported", time: "—", at: null, ...glucoseStatus(v, b) };
    }
    return null;
  };

  // HbA1c: newest of user.latest_hba1c, health_metrics, typed "6.4 hba1c",
  // and lab-report extractions.
  let hba1c = null;
  const consider = (value, when, label) => {
    const v = Number(value);
    if (!(v > 3 && v < 20)) return;
    const t = when ? new Date(when).getTime() : 0;
    if (!hba1c || t > hba1c.t) hba1c = { value: Math.round(v * 10) / 10, t, dateLabel: label || (when ? fmtDate(when) : "Self-reported") };
  };
  const mA1c = (metrics || []).find((m) => m.metric_type === "hba1c");
  if (mA1c) consider(mA1c.value, mA1c.measurement_date || mA1c.created_at);
  for (const r of hba1cLogs) consider(r.value_mgdl, r.created_at);
  if (user.latest_hba1c != null) consider(user.latest_hba1c, user.updated_at, "Self-reported");
  const reportsForA1c = await recentLabReports(user.id, 5).catch(() => []);
  for (const rep of reportsForA1c || []) {
    for (const v of Array.isArray(rep.values) ? rep.values : []) {
      if (/hba1c|a1c|glycated|glycosylated/i.test(String(v?.test || ""))) {
        consider(parseFloat(String(v.result || "")), rep.metadata?.report_date || rep.created_at);
      }
    }
  }
  const latest = {
    fasting: latestOf("fasting"),
    random: latestOf("random"),
    hba1c: hba1c
      ? { value: hba1c.value, unit: "%", date: hba1c.dateLabel, time: "—", ...glucoseStatus(hba1c.value, "hba1c") }
      : null,
  };

  // ---- trends ----
  const sufficiency = glucoseSufficiency(glucoseAll, now);
  const weekly = dailySeries(glucoseAll, TREND_RULES.weeklyDays, now);
  const monthly = dailySeries(glucoseAll, TREND_RULES.monthlyDays, now);
  const trendOf = (series, suff) => ({
    series,
    fasting: seriesStats(series, "fasting"),
    random: seriesStats(series, "random"),
    total: suff.total,
    fastingReadings: suff.fasting,
    randomReadings: suff.random,
    enough: suff.enough,
  });
  const trends = {
    weekly: trendOf(weekly, sufficiency.weekly),
    monthly: trendOf(monthly, sufficiency.monthly),
  };

  // ---- labs ----
  const labs = await assembleLabs(user.id, metrics);

  // ---- lifestyle ----
  const health = raw.health || [];
  const cut30 = now - 30 * DAY_MS;
  const cut60 = now - 60 * DAY_MS;
  const ts = (r) => new Date(r.created_at).getTime();
  const this30 = health.filter((h) => ts(h) >= cut30);
  const prev30 = health.filter((h) => ts(h) >= cut60 && ts(h) < cut30);
  const weights = health.filter((h) => h.weight_kg != null);
  const latestW = weights.length ? weights[weights.length - 1] : null;
  let weightLatest = latestW ? Number(latestW.weight_kg) : profile.weight_kg;
  let weightDelta = null;
  if (latestW) {
    const older = weights.filter((w) => ts(latestW) - ts(w) >= 21 * DAY_MS);
    const ref = older.length ? older[older.length - 1] : null;
    if (ref) weightDelta = Math.round((Number(latestW.weight_kg) - Number(ref.weight_kg)) * 10) / 10;
  }
  const chalNames = (activeChal || []).map((c) => c.def_name || prettyChallenge(c.challenge_type)).filter(Boolean);
  const lifestyle = {
    checkins: this30.length,
    checkinsPrev: prev30.length,
    checkinsPct: prev30.length ? Math.round(((this30.length - prev30.length) / prev30.length) * 100) : null,
    weightLatest: weightLatest != null ? Math.round(weightLatest * 10) / 10 : null,
    weightDelta,
    activeChallenges: chalNames.length,
    challengeNames: chalNames.slice(0, 2),
  };

  // ---- score ----
  const score = computeScore({
    glucose30: glucoseAll.filter((r) => ts(r) >= cut30),
    medLogs30: raw.medLogs || [],
    health30: this30,
    hasMeds: meds.length > 0,
    activeChallenges: chalNames.length,
    pastChallenges: (pastChal || []).length,
  });

  const data = {
    generatedAt: new Date(now),
    generatedLabel: fmtDate(now),
    profile,
    latest,
    trends,
    labs,
    medicines: meds.slice(0, 6),
    lifestyle,
    goals,
    score,
  };
  data.facts = factsBlock(data);
  // Raw rows (90d glucose, 60d health logs, 30d medication logs) for callers
  // that need their own windows — the doctor's weekly report counts 7 days.
  data.raw = { glucose: glucoseAll, health, medLogs: raw.medLogs || [] };
  return data;
}

function prettyChallenge(type) {
  return (
    {
      hba1c: "HbA1c Challenge",
      activity: "Activity Challenge",
      healthy_plate: "Healthy Plate Challenge",
      a1c: "HbA1c Challenge",
      weight: "Weight Challenge",
      walking: "10K Steps Challenge",
      consistency: "Consistency Challenge",
      ramadan: "Ramadan Challenge",
    }[type] || (type ? String(type).replace(/_/g, " ") : "")
  );
}

// Compact plain-text facts for the AI writer (and handy in logs).
export function factsBlock(d) {
  const L = [];
  const p = d.profile;
  L.push(`Patient: ${p.name}, ${p.age ?? "?"} y, ${p.gender}, ${p.diabetesType}. Height ${p.height_cm ?? "?"} cm, weight ${p.weight_kg ?? "?"} kg, BMI ${p.bmi ?? "?"}${p.bmiCategory ? " (" + p.bmiCategory + ")" : ""}.`);
  const lr = d.latest;
  L.push(
    `Latest fasting: ${lr.fasting ? `${lr.fasting.value} mg/dL on ${lr.fasting.date} (${lr.fasting.label})` : "none"}; latest random: ${lr.random ? `${lr.random.value} mg/dL on ${lr.random.date} (${lr.random.label})` : "none"}; HbA1c: ${lr.hba1c ? `${lr.hba1c.value}% (${lr.hba1c.date}, ${lr.hba1c.label})` : "none on record"}.`
  );
  const w = d.trends.weekly;
  L.push(
    `Last 14 days: ${w.total} readings (${w.fasting.count} fasting days avg ${w.fasting.avg ?? "-"} range ${w.fasting.min ?? "-"}-${w.fasting.max ?? "-"}, first ${w.fasting.first ?? "-"} last ${w.fasting.last ?? "-"}; ${w.random.count} random days avg ${w.random.avg ?? "-"} range ${w.random.min ?? "-"}-${w.random.max ?? "-"}, first ${w.random.first ?? "-"} last ${w.random.last ?? "-"}). Enough for weekly trend: ${w.enough ? "yes" : "no"}.`
  );
  const m = d.trends.monthly;
  L.push(
    `Last 90 days: ${m.total} readings (${m.fasting.count} fasting days avg ${m.fasting.avg ?? "-"}, ${m.random.count} random days avg ${m.random.avg ?? "-"}). Enough for monthly trend: ${m.enough ? "yes" : "no"}.`
  );
  if (d.labs.items.length) {
    L.push(`Other labs: ${d.labs.items.map((l) => `${l.name} ${l.value} (${l.label})`).join("; ")}.`);
  } else {
    L.push("Other labs: none on record.");
  }
  L.push(d.medicines.length ? `Medicines: ${d.medicines.map((m) => [m.name, m.dose, m.frequency].filter(Boolean).join(" ")).join("; ")}.` : "Medicines: none on record.");
  const ls = d.lifestyle;
  L.push(
    `Lifestyle: ${ls.checkins} check-ins in last 30 days (${ls.checkinsPrev} the 30 days before); weight ${ls.weightLatest ?? "?"} kg${ls.weightDelta != null ? ` (${ls.weightDelta > 0 ? "+" : ""}${ls.weightDelta} kg vs ~1 month ago)` : ""}; active challenges: ${ls.activeChallenges}${ls.challengeNames.length ? " (" + ls.challengeNames.join(", ") + ")" : ""}.`
  );
  L.push(
    `Health score ${d.score.total}/100 (${d.score.rating}): ${d.score.components.map((c) => `${c.label} ${c.score}/${c.max}`).join(", ")}.`
  );
  const goals = Array.isArray(d.goals) ? d.goals : [];
  L.push(
    goals.length
      ? `Patient's stated goals (baseline for this report): ${goals.join("; ")}.`
      : "Patient's stated goals: none set yet."
  );
  return L.join("\n");
}

// ---------------------------------------------------------------------------
// Deterministic fallback copy — used when the AI call fails so the report
// still ships. Same shape as snapshotInsights() in openai.js.
// ---------------------------------------------------------------------------
export function fallbackInsights(d) {
  const w = d.trends.weekly;
  const m = d.trends.monthly;
  const insights = [];

  const weekly_summary = w.enough
    ? `Your fasting readings averaged ${w.fasting.avg} mg/dL over the last 14 days (range ${w.fasting.min}–${w.fasting.max}), ${w.fasting.avg <= 130 ? "within the usual target" : "above the usual target"}. Random readings averaged ${w.random.avg} mg/dL${w.random.max > 180 ? " with some higher spikes worth watching" : " and stayed fairly steady"}.`
    : `Not enough readings in the last 14 days to describe a weekly trend yet. Log a fasting and a random reading on most days and this summary will fill in.`;

  const monthly_summary = m.enough
    ? `Over the last 90 days your fasting average was ${m.fasting.avg} mg/dL and your random average ${m.random.avg} mg/dL across ${m.total} readings. ${m.fasting.avg <= 130 ? "Fasting control is holding well — keep the routine that is working." : "Fasting readings run above target — consistent meals, movement and medicine timing can help bring them down."}`
    : `A monthly trend needs at least ${TREND_RULES.monthlyMinTotal} readings over 90 days. Keep logging regularly and your long-term picture will appear here.`;

  if (d.latest.hba1c) {
    const h = d.latest.hba1c;
    insights.push(
      h.level === "good"
        ? { tone: "good", text: `Your HbA1c of ${h.value}% is within target. Keep up the good work.` }
        : { tone: "warn", text: `Your HbA1c of ${h.value}% is above target. Discuss it with your doctor and keep logging so the next test shows the trend.` }
    );
  } else {
    insights.push({ tone: "info", text: "No HbA1c on record yet. Upload your latest lab report so DrSaab can track it here." });
  }

  if (w.random.avg != null && w.fasting.avg != null && w.random.avg - w.fasting.avg > 40) {
    insights.push({ tone: "warn", text: "Random readings run well above your fasting numbers. A short walk after meals and a smaller dinner can flatten those peaks." });
  } else if (d.lifestyle.weightDelta != null && d.lifestyle.weightDelta < 0) {
    insights.push({ tone: "good", text: `Weight is down ${Math.abs(d.lifestyle.weightDelta)} kg versus a month ago — a real win for your sugar control.` });
  } else if (d.labs.items.some((l) => l.tone === "bad" || l.tone === "warn")) {
    const l = d.labs.items.find((x) => x.tone === "bad" || x.tone === "warn");
    insights.push({ tone: "warn", text: `${l.name} is ${l.label.toLowerCase()} (${l.value}). Share this with your doctor at your next visit.` });
  } else {
    insights.push({ tone: "info", text: "Pair each fasting reading with a random one later in the day to reveal how meals affect you." });
  }

  // Third slot: the patient's own goal, when they have set one and their
  // logging is already good. The PDF prints goals nowhere else, so without
  // this the report would never reference what they are working towards.
  // Weak logging outranks it — nothing else works until the data is there.
  const g = d.score.components.find((c) => c.key === "glucose");
  const consistency =
    g && g.score >= 30
      ? { tone: "good", text: "Your glucose logging is consistent — that is what makes these insights reliable." }
      : { tone: "info", text: "Logging your glucose more consistently will help us give you even better insights." };
  const goal = (Array.isArray(d.goals) ? d.goals : [])[0];
  if (goal && g && g.score >= 30) {
    insights.push({ tone: "info", text: `Your goal: ${String(goal).slice(0, 90)}. Keep logging weekly so the next report can measure progress against it.` });
  } else {
    insights.push(consistency);
  }

  const score_message = {
    Excellent: "Outstanding! You are managing your health with real discipline. Keep this rhythm going.",
    Good: "Great job! You're taking charge of your health. Keep building on your consistency.",
    Fair: "You're on the right track. A few more logged days each week will lift this score quickly.",
    "Needs Focus": "Let's rebuild the habit together: one fasting reading each morning is the best place to start.",
  }[d.score.rating];

  return { weekly_summary, monthly_summary, score_message, insights: insights.slice(0, 3) };
}
