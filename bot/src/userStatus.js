// User Status (spec 2026-09-15) — how often a person actually uses DrSaab.
//
//   Idle   – no interaction in the last 30 days
//   Low    – interacted on 1 day in the last 30 days
//   Medium – 2–3 days
//   High   – 4 or more days
//
// An "interaction" is any inbound message or button tap; bot.js records one
// row per user per Pakistan-time day in user_activity_days. The status is
// computed from that table (activeDaysInLast) and mirrored onto
// users.activity_status once a day by the scheduler so doctor views and
// flows can read it without recounting. The admin panel computes the same
// rule live in SQL (app/api/admin/data/route.js) — keep the thresholds here
// and there in sync.

import { activeDaysInLast, updateUser } from "./supabase.js";

export const STATUS_WINDOW_DAYS = 30;
export const USER_STATUSES = ["idle", "low", "medium", "high"];

export function statusForActiveDays(days) {
  const n = Number(days) || 0;
  if (n <= 0) return "idle";
  if (n === 1) return "low";
  if (n <= 3) return "medium";
  return "high";
}

export function statusLabel(status) {
  return { idle: "Idle", low: "Low", medium: "Medium", high: "High" }[status] || "—";
}

export async function computeUserStatus(userId) {
  const activeDays = await activeDaysInLast(userId, STATUS_WINDOW_DAYS);
  return { status: statusForActiveDays(activeDays), activeDays };
}

// Recompute for a list of user rows and persist any change. Returns the
// number of rows updated. Called once per local day from the scheduler.
export async function refreshActivityStatuses(users) {
  let changed = 0;
  for (const u of users || []) {
    try {
      const { status } = await computeUserStatus(u.id);
      if (u.activity_status === status) continue;
      await updateUser(u.id, { activity_status: status, activity_status_at: new Date().toISOString() });
      changed++;
    } catch (e) {
      console.error("activity status:", u.id, e?.message);
    }
  }
  return changed;
}
