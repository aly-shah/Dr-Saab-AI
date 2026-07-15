// Challenges scoring engine (spec §9, §10, §16, §18).
//
// Every meaningful DrSaab event (a glucose reading, a med log, a qualifying
// activity, a meal analysis, a lab report upload) that arrives while a user
// has at least one active challenge is routed through
// `awardEventToChallenges` here. This module then:
//
//   1) Finds all active challenges for the user.
//   2) Applies the daily-cap + per-week-cap + duplicate rules from spec §10.
//   3) Updates each challenge's outcome (active-day / plate count) if the
//      event is a first-of-its-kind qualifying event for that day.
//   4) Awards participation points (capped at 10/day across all events).
//   5) Bumps the user's current/best participation streak on any qualifying
//      event so tie-breaks (§9.2) have real data to work with.
//   6) Persists the event and refreshes the cohort's normalised scores.
//   7) Writes a daily leaderboard snapshot row (spec §14) so historical
//      rankings survive later score recomputes.
//
// The tracking / coach / lab flows just fire-and-forget:
//   awardEventToChallenges(session.user, "glucose", { value_mgdl }).catch(...);
// so a missing DB or a failed hook never blocks the primary flow.

import {
  listUcActiveByUser,
  listChallengeEventsForDay,
  insertChallengeEvent,
  updateUserChallenge,
  listCohortResults,
  countChallengeEventsInDays,
  insertLeaderboardSnapshot,
  getChallengeDefById,
} from "../supabase.js";

const TZ_OFFSET = parseInt(process.env.REMINDER_TZ_OFFSET || "5", 10);

export const HBA1C_BANDS = {
  lt7:      "<7",
  b7_8_9:   "7-8.9",
  b9_10_9:  "9-10.9",
  b11_plus: "11+",
};

function todayLocalDate() {
  const d = new Date(Date.now() + TZ_OFFSET * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

function yesterdayLocalDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Participation-point table (spec §10). Daily cap and per-event cap live in
// the same object so the engine reads them together. `per_week` is checked
// against the challenge_events table via countChallengeEventsInDays.
const PARTICIPATION_RULES = {
  glucose:            { points: 2, per_day: 1 },
  medication:         { points: 2, per_day: 1 },
  activity:           { points: 2, per_day: 1 },
  meal:               { points: 2, per_day: 2 },
  weight:             { points: 1, per_week: 1 },
  wellbeing:          { points: 1, per_day: 1 },
  lab_report:         { points: 3, per_day: 3 },
  challenge_checkin:  { points: 2, per_week: 1 },
};

const DAILY_PARTICIPATION_CAP = 10;

// Type-whitelist for §7.4 (Activity Challenge). Any recognised token qualifies
// a log — the parser in tracking.js already broadens to "any activity word".
const ACTIVITY_TYPE_TOKENS = [
  "walk", "walked", "walking", "run", "ran", "running", "jog", "jogged", "jogging",
  "gym", "workout", "weights", "strength",
  "swim", "swam", "swimming",
  "cycle", "cycling", "cycled", "bike", "biking",
  "sport", "sports", "cricket", "football", "tennis", "basketball", "badminton",
  "home workout", "hiit",
  "yoga", "mobility", "stretch", "stretching", "pilates",
];

// -------------------------------------------------------------------
// Public entry point
// -------------------------------------------------------------------

/**
 * Route a DrSaab event into every active challenge for the user.
 * @param {object} user  users row
 * @param {string} eventType  glucose | medication | activity | meal | weight |
 *                            wellbeing | lab_report | challenge_checkin
 * @param {object} [payload]  optional event details
 *   payload.duration_min  → for activity (must be >= 20 to qualify)
 *   payload.activity_text → raw user text (used to validate activity type)
 *   payload.healthy_plate → for meal (true if classified 🟢 Healthy Plate)
 *   payload.hba1c         → for lab_report (percentage, if extracted)
 *   payload.source_id     → uuid of the originating log row (best-effort)
 * @returns {Promise<Array<{uc_id, healthy_plate_delta, active_days, outcome_value, rank, total}>>}
 *   Per-challenge results, so callers (e.g. coach.js) can surface a Healthy
 *   Plate confirmation with the fresh count + rank.
 */
export async function awardEventToChallenges(user, eventType, payload = {}) {
  if (!user?.id) return [];
  const ucs = await listUcActiveByUser(user.id).catch(() => []);
  if (!ucs.length) return [];

  const today = todayLocalDate();
  const results = [];

  for (const uc of ucs) {
    try {
      const res = await applyEventToChallenge(uc, eventType, payload, today);
      if (res) results.push(res);
    } catch (e) {
      console.error("challenge apply:", e?.message);
    }
  }
  return results;
}

// -------------------------------------------------------------------
// Per-challenge application
// -------------------------------------------------------------------
async function applyEventToChallenge(uc, eventType, payload, today) {
  // Ignore events fired outside the challenge's start/end window (e.g. an
  // event captured after end_date, before the scheduler flips to expired).
  if (uc.start_date && today < uc.start_date) return null;
  if (uc.end_date && today > uc.end_date) return null;

  const priorEvents = await listChallengeEventsForDay(uc.id, today).catch(() => []);
  const dayPointsSoFar = priorEvents.reduce((n, e) => n + (e.participation_points || 0), 0);
  const dayEventCount = (type) => priorEvents.filter((e) => e.event_type === type).length;

  const rule = PARTICIPATION_RULES[eventType];
  let points = 0;
  if (rule) {
    let capOk = true;
    if (rule.per_day != null) {
      capOk = dayEventCount(eventType) < rule.per_day;
    } else if (rule.per_week != null) {
      // Weekly cap: count this event type across the last 7 calendar days.
      const weekCount = await countChallengeEventsInDays(uc.id, eventType, 7).catch(() => 0);
      capOk = weekCount < rule.per_week;
    }
    if (capOk) {
      points = Math.min(rule.points, Math.max(0, DAILY_PARTICIPATION_CAP - dayPointsSoFar));
    }
  }

  // Outcome delta. Only counted once per calendar day per challenge (spec §7
  // for activity, spec §8 for Healthy Plate). The Healthy Plate daily cap of
  // 2 mirrors the meal-analysis participation cap.
  let outcomeDelta = 0;
  let hpDelta = 0;
  let recordEvent = points > 0;

  if (uc.challenge_type === "activity" && eventType === "activity") {
    const duration = Number(payload.duration_min) || 0;
    const type = validActivityType(payload.activity_text || "");
    if (duration >= 20 && type && dayEventCount("activity_qualifying") === 0) {
      outcomeDelta = 1;
      recordEvent = true;
      await insertChallengeEvent({
        user_challenge_id: uc.id,
        user_id: uc.user_id,
        event_type: "activity_qualifying",
        event_date: today,
        source_kind: "activity",
        source_id: payload.source_id || null,
        outcome_delta: 1,
        participation_points: 0,
        verified: true,
        metadata: { duration_min: duration, type },
      }).catch(() => {});
    }
  }

  if (uc.challenge_type === "healthy_plate" && eventType === "meal") {
    if (payload.healthy_plate) {
      const priorHp = dayEventCount("healthy_plate_hit");
      if (priorHp < 2) {
        outcomeDelta = 1;
        hpDelta = 1;
        recordEvent = true;
        await insertChallengeEvent({
          user_challenge_id: uc.id,
          user_id: uc.user_id,
          event_type: "healthy_plate_hit",
          event_date: today,
          source_kind: "meal",
          source_id: payload.source_id || null,
          outcome_delta: 1,
          participation_points: 0,
          verified: true,
          metadata: {},
        }).catch(() => {});
      }
    }
  }

  if (!recordEvent) {
    return { uc_id: uc.id, healthy_plate_delta: 0, outcome_value: uc.outcome_value || 0, rank: uc.rank, total: null };
  }

  await insertChallengeEvent({
    user_challenge_id: uc.id,
    user_id: uc.user_id,
    event_type: eventType,
    event_date: today,
    source_kind: eventType,
    source_id: payload.source_id || null,
    outcome_delta: outcomeDelta || null,
    participation_points: points,
    verified: true,
    metadata: payload || null,
  }).catch((e) => console.error("insertChallengeEvent:", e?.message));

  // Streak update: any qualifying-for-participation event bumps the day's
  // streak. Continues yesterday's streak → +1; skipped day resets to 1.
  const nowIso = new Date().toISOString();
  const patch = {
    participation_points: (uc.participation_points || 0) + points,
    last_participation_at: nowIso,
  };
  if (outcomeDelta) {
    patch.outcome_value = (Number(uc.outcome_value) || 0) + outcomeDelta;
  }

  const lastStreak = uc.last_streak_date;
  if (lastStreak !== today) {
    const yesterday = yesterdayLocalDate(today);
    const nextStreak = lastStreak === yesterday ? (uc.current_streak || 0) + 1 : 1;
    patch.current_streak = nextStreak;
    patch.best_streak = Math.max(uc.best_streak || 0, nextStreak);
    patch.last_streak_date = today;
  }

  await updateUserChallenge(uc.id, patch).catch((e) => console.error("uc patch:", e?.message));

  // Recompute normalised scores + rank for the whole cohort so this user's
  // row and every peer's rank stay in sync. Cheap for MVP cohort sizes; a
  // snapshot table row is also written so historical ranks survive later
  // recomputes (spec §14).
  let rank = null;
  let total = null;
  try {
    const scoring = await computeAndPersistScores(uc.challenge_id, uc.user_id);
    rank = scoring.rank;
    total = scoring.total;
  } catch (e) { console.error("recompute:", e?.message); }

  return {
    uc_id: uc.id,
    challenge_type: uc.challenge_type,
    healthy_plate_delta: hpDelta,
    activity_day_delta: uc.challenge_type === "activity" ? outcomeDelta : 0,
    outcome_value: (Number(uc.outcome_value) || 0) + outcomeDelta,
    rank, total,
  };
}

function validActivityType(text) {
  const s = String(text || "").toLowerCase();
  return ACTIVITY_TYPE_TOKENS.find((tok) => s.includes(tok)) || null;
}

// -------------------------------------------------------------------
// Cohort scoring & ranking (spec §9)
// -------------------------------------------------------------------

// Normalise a numeric array to 0..100 within the cohort. Higher input = higher
// output. Empty / uniform arrays produce zeros (nothing to rank on).
function normalizeArray(values) {
  const finite = values.map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (!finite.length) return values.map(() => 0);
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const range = max - min;
  if (range <= 0) return values.map(() => 100);
  return values.map((v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.round(((n - min) / range) * 100);
  });
}

/**
 * Recompute outcome/participation/final scores for a challenge cohort and
 * write them back to each user_challenges row. Returns the caller's rank.
 * For HbA1c, ranking happens *inside baseline bands* (spec §9.3).
 */
export async function computeAndPersistScores(challengeId, targetUserId) {
  const cohort = await listCohortResults(challengeId).catch(() => []);
  if (!cohort.length) return { rank: null, total: 0, band: null };

  const isHba1c = cohort.some((r) => r.baseline_value != null && r.baseline_unit === "%");
  const snapshotDate = todayLocalDate();

  // Group by band (HbA1c) or a single global bucket for the others.
  const groups = new Map();
  for (const r of cohort) {
    const key = isHba1c ? (r.baseline_band || "unbanded") : "global";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  let outRank = null;
  let outBand = null;
  let outTotal = 0;

  for (const [band, rows] of groups) {
    const outcomeValues = rows.map((r) => Number(r.outcome_value) || 0);
    const participationValues = rows.map((r) => Number(r.participation_points) || 0);
    const outcomeScores = normalizeArray(outcomeValues);
    const participationScores = normalizeArray(participationValues);

    const finalScores = rows.map((_, i) =>
      Math.round(outcomeScores[i] * 0.7 + participationScores[i] * 0.3)
    );

    // Ranking pool: HbA1c rows without a final value stay in the cohort for
    // scoring but are excluded from the ranking (spec §11).
    const rankable = rows
      .map((r, i) => ({ r, i, final: finalScores[i], out: outcomeValues[i] }))
      .filter(({ r }) => !isHba1c || r.final_value != null || r.status === "completed");

    // Tie-break stack (spec §9.2): outcome → participation → streak → earlier
    // completion. Applied in that order after final_score, which already
    // encodes outcome+participation but at coarse resolution.
    rankable.sort((a, b) => {
      if (b.final !== a.final) return b.final - a.final;
      if (b.out !== a.out) return b.out - a.out;
      const pa = Number(a.r.participation_points) || 0;
      const pb = Number(b.r.participation_points) || 0;
      if (pb !== pa) return pb - pa;
      const sa = Number(a.r.current_streak) || 0;
      const sb = Number(b.r.current_streak) || 0;
      if (sb !== sa) return sb - sa;
      // Earlier completion wins the tie.
      const ta = a.r.completed_at ? new Date(a.r.completed_at).getTime() : Number.MAX_SAFE_INTEGER;
      const tb = b.r.completed_at ? new Date(b.r.completed_at).getTime() : Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });

    for (let rank = 0; rank < rankable.length; rank++) {
      const { r, i } = rankable[rank];
      const percentile = rankable.length > 1
        ? Math.round(((rankable.length - (rank + 1)) / (rankable.length - 1)) * 100)
        : 100;
      const patch = {
        outcome_score: outcomeScores[i],
        participation_score: participationScores[i],
        final_score: finalScores[i],
        rank: rank + 1,
        percentile,
      };
      await updateUserChallenge(r.id, patch).catch(() => {});
      await insertLeaderboardSnapshot({
        challenge_id: challengeId,
        snapshot_date: snapshotDate,
        user_challenge_id: r.id,
        outcome_score: outcomeScores[i],
        participation_score: participationScores[i],
        final_score: finalScores[i],
        rank: rank + 1,
        percentile,
        baseline_band: isHba1c ? band : null,
      }).catch(() => {});
      if (r.user_id === targetUserId) {
        outRank = rank + 1;
        outTotal = rankable.length;
        outBand = isHba1c ? band : null;
      }
    }

    // Un-ranked rows (HbA1c users still waiting on final) still get their
    // scores persisted so the summary card can render them.
    for (const r of rows) {
      const notRanked = isHba1c && r.final_value == null && r.status !== "completed";
      if (notRanked) {
        const i = rows.indexOf(r);
        const patch = {
          outcome_score: outcomeScores[i],
          participation_score: participationScores[i],
          final_score: finalScores[i],
          rank: null,
          percentile: null,
        };
        await updateUserChallenge(r.id, patch).catch(() => {});
        await insertLeaderboardSnapshot({
          challenge_id: challengeId,
          snapshot_date: snapshotDate,
          user_challenge_id: r.id,
          outcome_score: outcomeScores[i],
          participation_score: participationScores[i],
          final_score: finalScores[i],
          rank: null,
          percentile: null,
          baseline_band: isHba1c ? band : null,
        }).catch(() => {});
      }
    }
  }

  return { rank: outRank, total: outTotal, band: outBand };
}
