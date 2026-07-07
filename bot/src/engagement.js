// Engagement Engine — Build 1.
//
// Pure computation of the daily-composer inputs:
//   • an engagement SCORE (0..100) derived from the last 30 days of the
//     user's own actions, weighted by tunable coefficients;
//   • an engagement LEVEL — one of HE, E, LOW, RISK, INACTIVE;
//   • supporting numbers the composer needs (days-since-interaction,
//     days-active-in-21d, day-N from onboarding, PKT window).
//
// The users table also carries a running `engagement_score` maintained by
// scores.js — that number tunes menus and tier gating for the rest of the
// app. This module derives a fresh score from concrete signals for the
// composer's own decision-making; it does not mutate the persisted column.
//
// All weights + thresholds have safe defaults; rows in `engagement_config`
// override them at read time so operators can retune without shipping code.

import { config } from "./config.js";

const DEFAULT_WEIGHTS = {
  w_glucose: 3,
  w_medication: 2,
  w_checkin: 4,
  w_coach: 2,
  w_in_range: 1,
  w_last_seen_recent: 5,
};

const DEFAULT_THRESHOLDS = {
  level_he_min: 75,
  level_e_min: 55,
  level_low_min: 35,
};

// PKT window boundaries for the greeting block. Match the offset used by
// scheduler.js so "morning" here means the same wall-clock hour the tick
// fires at.
const TZ_OFFSET = parseInt(process.env.REMINDER_TZ_OFFSET || "5", 10);

export function pktHour(date = new Date()) {
  return new Date(date.getTime() + TZ_OFFSET * 3600 * 1000).getUTCHours();
}

export function windowFromHour(hour) {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  return "evening";
}

// Resolve config -> weights + thresholds. `cfgRows` is the {key: value_num}
// map returned by getEngagementConfig(). Missing keys fall back to defaults
// so the composer still works on a fresh install with no config rows.
export function resolveWeights(cfgRows = {}) {
  const out = { ...DEFAULT_WEIGHTS };
  for (const k of Object.keys(out)) if (cfgRows[k] != null) out[k] = Number(cfgRows[k]);
  return out;
}

export function resolveThresholds(cfgRows = {}) {
  const out = { ...DEFAULT_THRESHOLDS };
  for (const k of Object.keys(out)) if (cfgRows[k] != null) out[k] = Number(cfgRows[k]);
  return out;
}

export function inactivityExitDays(cfgRows = {}) {
  const v = cfgRows.inactivity_exit_days;
  return v != null ? Number(v) : config.composer.inactivityExitDays;
}

export function blockCooldownDays(cfgRows = {}) {
  const v = cfgRows.block_cooldown_days;
  return v != null ? Number(v) : config.composer.blockCooldownDays;
}

// Score is capped at 100 by construction. The `activity` object comes from
// `activityCountsSince(userId, 30d)`; last_seen_recent is 1 when the user
// was seen within the last 3 days and adds a small consistent boost.
export function computeEngagementScore(activity, lastSeenRecent, weights = DEFAULT_WEIGHTS) {
  const raw =
    (activity.glucose    || 0) * weights.w_glucose +
    (activity.medication || 0) * weights.w_medication +
    (activity.checkin    || 0) * weights.w_checkin +
    (activity.wellbeing  || 0) * weights.w_checkin +
    (activity.coach      || 0) * weights.w_coach +
    (activity.in_range   || 0) * weights.w_in_range +
    (lastSeenRecent ? weights.w_last_seen_recent : 0);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

// Maps a numeric score + days-since-interaction into the five levels the
// composer selects from. INACTIVE trumps the score — once a user has been
// silent longer than the exit threshold, no system nudges go out.
export function levelFor(score, daysSinceInteraction, thresholds = DEFAULT_THRESHOLDS, exitDays = 14) {
  if (daysSinceInteraction >= exitDays) return "INACTIVE";
  if (score >= thresholds.level_he_min)  return "HE";
  if (score >= thresholds.level_e_min)   return "E";
  if (score >= thresholds.level_low_min) return "LOW";
  return "RISK";
}

// Age-bracket resolution — the spec buckets used by the block metadata.
// Falls back to "any" when age is unknown so the composer can still pick
// a generic block (rather than skip the user entirely).
export function ageBracketOf(user) {
  const a = Number(user?.age);
  if (!Number.isFinite(a) || a <= 0) return "any";
  if (a <= 15) return "child";
  if (a <= 19) return "16-19";
  if (a <= 34) return "20-34";
  if (a <= 49) return "35-49";
  if (a <= 64) return "50-64";
  return "65+";
}

// "50+" is a compound bracket used by a couple of coaching blocks — treat it
// as a match for 50-64 and 65+ ages. Called from composer.js block-filter.
export function ageBracketMatches(userBracket, blockBrackets) {
  if (!blockBrackets || blockBrackets.length === 0) return true;
  if (blockBrackets.includes("any")) return true;
  if (blockBrackets.includes(userBracket)) return true;
  if (blockBrackets.includes("50+") && (userBracket === "50-64" || userBracket === "65+")) return true;
  return false;
}

// Days since the composer last had a signal from this user. Uses the
// lastInteractionAt value from supabase.js (patient_kb.last_seen OR the
// most-recent log). Returns Infinity when we've never seen them.
export function daysSince(iso) {
  if (!iso) return Infinity;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / 86400000);
}

export function daysBetween(a, b = new Date()) {
  if (!a) return 0;
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

// Language normalisation for the composer. The block table stores rows in
// 'english' and 'roman_urdu'; script-Urdu users fall back to Roman Urdu
// (per Build 1 direction).
export function composerLanguage(user) {
  const l = String(user?.language || "en").toLowerCase();
  if (l === "roman_ur" || l === "ur") return "roman_urdu";
  return "english";
}

// Milestone match: is today an anniversary (T7/T21/T40/T66/T90) of the
// user's onboarding? Uses users.created_at as the join date. Returns the
// milestone code or null.
const MILESTONES = ["T7", "T21", "T40", "T66", "T90"];
export function milestoneFor(user, today = new Date()) {
  const days = daysBetween(user?.created_at, today);
  const hit = MILESTONES.find((m) => Number(m.slice(1)) === days);
  return hit || null;
}

// First-name split from users.name — safe for empty/single-word names. Used
// by the {first_name_optional} placeholder, which renders as ", First"
// (leading comma + space) so blocks read naturally when the name is empty.
export function firstNameOf(user) {
  const raw = String(user?.name || "").trim();
  if (!raw) return "";
  return raw.split(/\s+/)[0];
}
