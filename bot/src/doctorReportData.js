// Doctor-side reports — data assembly (no AI, no rendering).
//
// Two documents share this:
//   • Weekly Patient Snapshots — one summary page for all connected patients
//     followed by one Patient Health Snapshot page per patient.
//   • Patient Health Snapshot — the same per-patient page for one patient.
//
// Reporting period = the last 7 days ending today (Pakistan time). Each
// patient is built on top of assembleSnapshotData() (the paid patient report)
// so numbers never disagree between the two report families.

import { getUserById, countLabReportsSince } from "./supabase.js";
import {
  assembleSnapshotData,
  bucketOf,
  dayKey,
  fmtDate,
  fmtTime,
  DIABETES_LABEL,
} from "./snapshotData.js";

const DAY_MS = 86400000;

// Stable, human-friendly patient id derived from the uuid: "DS-10024".
export function patientDisplayId(userId) {
  // djb2 over the whole id — works for uuids and the memory backend's short ids.
  let h = 5381;
  for (const ch of String(userId || "")) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  return `DS-${10000 + (h % 90000)}`;
}

// "8 – 14 Sep 2026" or "27 Jul – 2 Aug 2026".
export function periodLabel(start, end) {
  const [sy, sm, sd] = dayKey(start).split("-").map(Number);
  const [ey, em, ed] = dayKey(end).split("-").map(Number);
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (sy === ey && sm === em) return `${sd} – ${ed} ${MON[em - 1]} ${ey}`;
  if (sy === ey) return `${sd} ${MON[sm - 1]} – ${ed} ${MON[em - 1]} ${ey}`;
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}

// Overall status from the last 14 days of readings (+ HbA1c).
//   good   — ≤20% of readings out of range
//   warn   — ≤50% out of range (or HbA1c ≥ 7.5)
//   urgent — more than half out of range (or HbA1c ≥ 9)
//   none   — no readings in the window
export function overallStatus(snapshot) {
  const series = snapshot.trends.weekly.series;
  const rows = snapshot.raw?.glucose || [];
  const cut = Date.now() - 14 * DAY_MS;
  const recent = rows.filter((r) => new Date(r.created_at).getTime() >= cut);
  let out = 0;
  for (const r of recent) {
    const v = Number(r.value_mgdl);
    const b = bucketOf(r.context);
    const hi = b === "fasting" ? 130 : 180;
    if (!(v >= 70 && v <= hi)) out += 1;
  }
  const a1c = snapshot.latest.hba1c?.value ?? null;
  if (!recent.length && a1c == null) return { key: "none", label: "No data", tone: "muted" };
  const ratio = recent.length ? out / recent.length : 0;
  if (ratio > 0.5 || (a1c != null && a1c >= 9)) return { key: "urgent", label: "Needs Urgent Attention", tone: "bad" };
  if (ratio > 0.2 || (a1c != null && a1c >= 7.5)) return { key: "warn", label: "Needs Attention", tone: "warn" };
  void series;
  return { key: "good", label: "Good", tone: "good" };
}

function weekCounts(snapshot, since, reportsThisWeek) {
  const ts = (r) => new Date(r.created_at).getTime();
  const g = (snapshot.raw?.glucose || []).filter((r) => ts(r) >= since);
  const h = (snapshot.raw?.health || []).filter((r) => ts(r) >= since);
  const m = (snapshot.raw?.medLogs || []).filter((r) => ts(r) >= since);
  const weights = h.filter((r) => r.weight_kg != null);
  const activity = h.filter((r) => r.steps != null || (r.note && r.weight_kg == null));
  const latestW = weights.length ? weights[weights.length - 1] : null;
  return {
    fasting: g.filter((r) => bucketOf(r.context) === "fasting").length,
    random: g.filter((r) => bucketOf(r.context) !== "fasting").length,
    glucose: g.length,
    medication: m.length,
    activity: activity.length,
    weight: weights.length,
    reports: reportsThisWeek,
    latestWeight: latestW ? { value: Math.round(Number(latestW.weight_kg) * 10) / 10, date: fmtDate(latestW.created_at) } : null,
  };
}

// One patient → everything the per-patient page and the summary row need.
export async function assemblePatientReport(user, { since, now = Date.now() }) {
  const snapshot = await assembleSnapshotData(user, now);
  const reports = await countLabReportsSince(user.id, new Date(since).toISOString()).catch(() => 0);
  const week = weekCounts(snapshot, since, reports);
  // Latest weight overall (any time), with its date, for the profile card.
  const allWeights = (snapshot.raw?.health || []).filter((r) => r.weight_kg != null);
  const lw = allWeights.length ? allWeights[allWeights.length - 1] : null;
  return {
    user,
    id: patientDisplayId(user.id),
    name: snapshot.profile.name,
    age: snapshot.profile.age,
    gender: snapshot.profile.gender,
    diabetesType: DIABETES_LABEL[user.diabetes_status] || snapshot.profile.diabetesType,
    connectedOn: user.doctor_linked_date ? fmtDate(user.doctor_linked_date) : "—",
    weightLatest: lw
      ? { value: Math.round(Number(lw.weight_kg) * 10) / 10, date: fmtDate(lw.created_at) }
      : snapshot.profile.weight_kg != null
        ? { value: snapshot.profile.weight_kg, date: null }
        : null,
    snapshot,
    week,
    status: overallStatus(snapshot),
  };
}

// All connected patients of a doctor → summary + per-patient reports.
export async function assembleDoctorReport(doctorUser, doctorRow, patientRows, now = Date.now()) {
  const end = now;
  const since = now - 6 * DAY_MS; // 7 calendar days including today
  const startOfSince = new Date(dayKey(since) + "T00:00:00+05:00").getTime();

  const patients = [];
  for (const row of patientRows || []) {
    const user = (await getUserById(row.id).catch(() => null)) || row;
    patients.push(await assemblePatientReport(user, { since: startOfSince, now }));
  }
  // Worst status first so the doctor sees who needs attention at a glance.
  const order = { urgent: 0, warn: 1, good: 2, none: 3 };
  patients.sort((a, b) => (order[a.status.key] ?? 9) - (order[b.status.key] ?? 9) || String(a.name).localeCompare(String(b.name)));

  const sum = (k) => patients.reduce((a, p) => a + (p.week[k] || 0), 0);
  const active = (k) => patients.filter((p) => (p.week[k] || 0) > 0).length;
  const totals = {
    glucose: sum("glucose"),
    fasting: sum("fasting"),
    random: sum("random"),
    medication: sum("medication"),
    medicationActive: active("medication"),
    activity: sum("activity"),
    activityActive: active("activity"),
    weight: sum("weight"),
    weightActive: active("weight"),
    reports: sum("reports"),
    reportsActive: active("reports"),
    patients: patients.length,
  };
  const breakdown = {
    good: patients.filter((p) => p.status.key === "good").length,
    warn: patients.filter((p) => p.status.key === "warn").length,
    urgent: patients.filter((p) => p.status.key === "urgent").length,
    none: patients.filter((p) => p.status.key === "none").length,
  };

  const doctorName = String(doctorRow?.name || doctorUser?.name || "").trim();
  return {
    doctor: {
      name: /^(dr\.?|doctor)\b/i.test(doctorName) ? doctorName : doctorName ? `Dr. ${doctorName}` : "Doctor",
      specialization: doctorRow?.specialization || "",
    },
    period: { start: startOfSince, end, label: periodLabel(startOfSince, end) },
    generatedAt: new Date(now),
    generatedLabel: fmtDate(now),
    generatedTime: fmtTime(now),
    patients,
    totals,
    breakdown,
    notes: quickNotes(patients, breakdown, totals),
  };
}

// Rule-based "Quick notes" — short, factual, no AI needed.
export function quickNotes(patients, breakdown, totals) {
  const n = patients.length;
  const plural = (k, one, many) => `${k} ${k === 1 ? one : many}`;
  const notes = [];
  if (!n) {
    notes.push("No patients are connected yet. Share your referral code to start receiving snapshots.");
    return notes;
  }
  if (breakdown.good) notes.push(`${plural(breakdown.good, "patient is", "patients are")} doing well overall.`);
  if (breakdown.warn) notes.push(`${plural(breakdown.warn, "patient has", "patients have")} readings that need attention.`);
  if (breakdown.urgent) notes.push(`${plural(breakdown.urgent, "patient needs", "patients need")} urgent attention — review their readings first.`);
  if (breakdown.none) notes.push(`${plural(breakdown.none, "patient has", "patients have")} not logged any glucose readings recently.`);
  const inactive = patients.filter((p) => p.week.glucose === 0 && p.week.medication === 0 && p.week.activity === 0);
  if (inactive.length && inactive.length !== breakdown.none) {
    notes.push(`${plural(inactive.length, "patient was", "patients were")} inactive this week (no check-ins at all).`);
  }
  if (totals.reports) notes.push(`${plural(totals.reports, "new lab report was", "new lab reports were")} uploaded this week.`);
  notes.push("Please review individual patient snapshots on the next pages for more details.");
  return notes.slice(0, 5);
}
