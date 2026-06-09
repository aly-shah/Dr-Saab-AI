// Per-patient knowledge base. Built entirely from structured data we already
// store (profile + logs) — NO extra AI calls, so it costs nothing to keep
// fresh. A compact slice is injected into coach prompts for personalization;
// the full text is shown in the admin dashboard.

import { recentGlucose, weeklyStats, latestWeight, upsertKB } from "./supabase.js";

export async function buildKBContent(user) {
  const [recent, stats, weight] = await Promise.all([
    recentGlucose(user.id, 6),
    weeklyStats(user.id),
    latestWeight(user.id),
  ]);

  const lines = [
    `# Patient: ${user.name || "Unknown"}`,
    `Age: ${user.age ?? "-"}  ·  Gender: ${user.gender ?? "-"}  ·  City: ${user.city ?? "-"}  ·  Language: ${user.language}`,
    `Diabetes status: ${user.diabetes_status ?? "-"}`,
    `Height: ${user.height_cm ?? "-"} cm  ·  Weight: ${weight ?? user.weight_kg ?? "-"} kg`,
    `Goals: ${user.goals ?? "-"}`,
    `Medications: ${user.medications ?? "-"}`,
    `Plan: ${user.tier}  ·  Streak: ${user.streak || 0} day(s)`,
    `This week — readings: ${stats.glucoseCount}, avg: ${stats.glucoseAvg ?? "-"} mg/dL (range ${stats.glucoseMin ?? "-"}–${stats.glucoseMax ?? "-"}), meds: ${stats.medicationCount}, check-ins: ${stats.healthCount}`,
  ];
  if (recent.length) {
    lines.push(`Recent glucose: ${recent.map((r) => `${r.value_mgdl}(${r.context})`).join(", ")}`);
  }
  return lines.join("\n");
}

// A short, token-cheap version for the LLM prompt.
export function compactKB(user, stats) {
  const bits = [];
  if (stats?.glucoseAvg != null) bits.push(`recent avg glucose ${stats.glucoseAvg} mg/dL over ${stats.glucoseCount} readings`);
  if (user.streak) bits.push(`${user.streak}-day logging streak`);
  return bits.length ? `Recent data: ${bits.join("; ")}.` : "";
}

export async function refreshKB(user) {
  try {
    await upsertKB(user.id, await buildKBContent(user));
  } catch (e) {
    console.error("kb refresh failed:", e?.message);
  }
}
