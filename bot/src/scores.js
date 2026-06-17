// Four-score engine (per proposal §3.3): Consistency, Motivation, Risk,
// Engagement. All start at 50 and move on real events. No AI cost — these are
// cheap heuristic nudges persisted on the users row.

import { updateUser } from "./supabase.js";

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

// Per-event score deltas. Risk is "good when high" (in-range readings raise it).
const EVENTS = {
  log_glucose:    { consistency_score: +1, engagement_score: +2 },
  log_med:        { consistency_score: +1, engagement_score: +1 },
  checkin:        { consistency_score: +1, engagement_score: +2 },
  in_range:       { risk_score: +3 },
  out_range:      { risk_score: -2 },
  coach:          { engagement_score: +3, motivation_score: +1 },
  lab:            { engagement_score: +2 },
  goal_set:       { motivation_score: +5 },
  challenge_join: { motivation_score: +4, engagement_score: +2 },
};

/**
 * Apply one or more score events and persist. Returns the updated user (or the
 * original user with the patch merged if the write fails).
 *   session.user = await applyScores(session.user, "log_glucose", "in_range");
 */
export async function applyScores(user, ...kinds) {
  if (!user) return user;
  const patch = {};
  let checkins = 0;
  for (const kind of kinds) {
    const deltas = EVENTS[kind];
    if (!deltas) continue;
    for (const [field, d] of Object.entries(deltas)) {
      const base = patch[field] ?? Number(user[field] ?? 50);
      patch[field] = clamp(base + d);
    }
    if (kind === "checkin") checkins += 1;
  }
  if (checkins) patch.total_checkins = Number(user.total_checkins || 0) + checkins;
  if (Object.keys(patch).length === 0) return user;
  try {
    return await updateUser(user.id, patch);
  } catch (e) {
    console.error("score update failed:", e?.message);
    return { ...user, ...patch };
  }
}

// Helper used by the glucose flow to classify a reading for the risk score.
export function glucoseInRange(value, context) {
  const v = Number(value);
  if (Number.isNaN(v) || v < 70) return false;
  return v <= (context === "fasting" ? 130 : 180);
}
