// Daily Message Composer — Build 1.
//
// Rules-based (no live LLM) assembly of one system message per active user
// per day. The pipeline:
//
//   1. resolve language + age bracket + PKT window,
//   2. compute engagement score → level (HE / E / LOW / RISK / INACTIVE),
//   3. pick one block of each applicable kind (greeting → milestone →
//      reminder summary → coaching → inactivity → CTA) filtered by
//      language, age bracket, engagement, window / milestone / trigger-days
//      as appropriate,
//   4. skip block ids that were used within their cooldown window,
//   5. inject placeholders through placeholders.render (safe fallbacks +
//      residual-token sweep),
//   6. return the composed text + audit info for daily_message_log.
//
// The composer never sends messages itself. scheduler.js drives the tick
// and owns the transport (bot.sendMessage), the log write, and the
// per-day idempotency check — that keeps this module pure and testable.

import * as db from "./supabase.js";
import {
  ageBracketMatches,
  ageBracketOf,
  blockCooldownDays,
  composerLanguage,
  computeEngagementScore,
  daysSince,
  firstNameOf,
  inactivityExitDays,
  levelFor,
  milestoneFor,
  pktHour,
  resolveThresholds,
  resolveWeights,
  windowFromHour,
} from "./engagement.js";
import { buildValues, render } from "./placeholders.js";

const daysAgoISO = (n) => new Date(Date.now() - n * 86400000).toISOString();

// Deterministic tie-break: hash(user.id + today) → non-negative int. This
// keeps composer runs reproducible in tests and rotates block variants
// day-over-day rather than always taking sort_order[0].
function seedIndex(user, todayDate, listLength) {
  if (!listLength) return -1;
  const seed = String(user?.id || "") + todayDate;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % listLength;
}

// Cooldown-aware picker. `blocks` is already filtered for the kind's
// specific metadata (window / engagement / age). `recentIds` is a
// Map<block_id, last_sent_iso>. Returns the block object or null.
function pickBlock(blocks, recentIds, cooldownDefault, now, user, todayDate) {
  if (!blocks.length) return null;
  const eligible = blocks.filter((b) => {
    const lastAt = recentIds.get(b.id);
    if (!lastAt) return true;
    const cd = Number(b.cooldown_days ?? cooldownDefault);
    return daysSince(lastAt) >= cd;
  });
  const pool = eligible.length ? eligible : blocks; // fall through if all on cooldown
  return pool[seedIndex(user, todayDate, pool.length)];
}

// Return the smallest reminder-summary block match. Prefers the typed
// variant (medication / glucose / walk) that matches the user's due
// categories today; falls back to the generic block otherwise.
function pickReminderSummary(blocks, dueReminders, recentIds, cooldownDefault, user, todayDate) {
  const categories = new Set((dueReminders || []).map((r) => r.category));
  const typeMap = { medication: "medication", glucose: "glucose", activity: "walk" };
  for (const [cat, blockType] of Object.entries(typeMap)) {
    if (categories.has(cat)) {
      const typed = blocks.filter((b) => b.reminder_type === blockType);
      const picked = pickBlock(typed, recentIds, cooldownDefault, null, user, todayDate);
      if (picked) return picked;
    }
  }
  const generic = blocks.filter((b) => b.reminder_type === "generic");
  return pickBlock(generic, recentIds, cooldownDefault, null, user, todayDate);
}

// A greeting always fires. Filter by window (morning/afternoon/evening) and
// age bracket, allowing `window = 'any'` blocks to match every window.
function pickGreeting(all, language, ageBracket, window, recentIds, cooldownDefault, user, todayDate) {
  const pool = all
    .filter((b) => b.kind === "greeting" && b.language === language)
    .filter((b) => !b.window || b.window === "any" || b.window === window)
    .filter((b) => ageBracketMatches(ageBracket, b.age_brackets));
  return pickBlock(pool, recentIds, cooldownDefault, null, user, todayDate);
}

function pickCoaching(all, language, ageBracket, level, recentIds, cooldownDefault, user, todayDate) {
  const pool = all
    .filter((b) => b.kind === "coaching" && b.language === language && b.engagement === level)
    .filter((b) => ageBracketMatches(ageBracket, b.age_brackets));
  return pickBlock(pool, recentIds, cooldownDefault, null, user, todayDate);
}

function pickMilestone(all, language, milestone) {
  if (!milestone) return null;
  const pool = all.filter(
    (b) => b.kind === "milestone" && b.language === language && b.milestone === milestone
  );
  // Milestones don't rotate — pick the first (sort_order) so replays match.
  return pool[0] || null;
}

// Inactivity blocks only fire when the user is At Risk AND today crosses
// one of the trigger-day thresholds. We pick the block whose `trigger_days`
// is the greatest value ≤ daysSinceInteraction — that lets a user who
// skipped day 4 still get the day-7 nudge on day 7.
function pickInactivity(all, language, ageBracket, days, recentIds, cooldownDefault, user, todayDate) {
  const pool = all
    .filter((b) => b.kind === "inactivity" && b.language === language)
    .filter((b) => ageBracketMatches(ageBracket, b.age_brackets))
    .filter((b) => Number(b.trigger_days) <= days)
    .sort((a, b) => Number(b.trigger_days) - Number(a.trigger_days));
  if (!pool.length) return null;
  // Only fire when the largest trigger equals the days count — otherwise
  // we'd send the day-4 message every day between day 4 and day 6.
  if (Number(pool[0].trigger_days) !== days) return null;
  return pickBlock(pool, recentIds, cooldownDefault, null, user, todayDate);
}

function pickCTA(all, language, recentIds, cooldownDefault, user, todayDate) {
  const pool = all.filter((b) => b.kind === "cta" && b.language === language);
  return pickBlock(pool, recentIds, cooldownDefault, null, user, todayDate);
}

// Compose one daily message for a user. Returns { text, block_ids,
// engagement_score, engagement_level }, or null when the user is Inactive
// (composer signals "no send today" by returning null).
//
// `deps` is a dependency-injection seam: tests pass a mock backend, prod
// passes nothing and gets the live supabase.js exports.
export async function composeDailyMessage(user, { now = new Date(), overrides = {}, deps } = {}) {
  const d = deps || db;
  const todayDate = new Date(now.getTime()).toISOString().slice(0, 10);
  const language  = composerLanguage(user);
  const ageBracket = ageBracketOf(user);
  const hour      = pktHour(now);
  const window    = windowFromHour(hour);

  // Pull config, blocks, activity signals, and the recent-block map. Runs
  // in parallel — a single scheduler tick fans out one of these per user.
  const [cfg, blocks, activity, lastAt, due] = await Promise.all([
    d.getEngagementConfig(),
    d.listMessageBlocks({ language, active: true }),
    d.activityCountsSince(user.id, daysAgoISO(30)),
    d.lastInteractionAt(user.id),
    d.userDueReminders(user.id, now.toISOString()),
  ]);

  const weights    = resolveWeights(cfg);
  const thresholds = resolveThresholds(cfg);
  const exitDays   = inactivityExitDays(cfg);
  const cooldownD  = blockCooldownDays(cfg);

  const daysSinceInteraction = daysSince(lastAt);
  const lastSeenRecent = daysSinceInteraction <= 3;
  const score = computeEngagementScore(activity, lastSeenRecent, weights);
  const level = overrides.level || levelFor(score, daysSinceInteraction, thresholds, exitDays);

  if (level === "INACTIVE") {
    return null; // no system nudges — admin campaigns are a separate path
  }

  const recentIds = await d.recentBlockIdsForUser(user.id, daysAgoISO(Math.max(cooldownD, 30)));

  const milestone = milestoneFor(user, now);
  const pickedGreeting  = pickGreeting(blocks, language, ageBracket, window, recentIds, cooldownD, user, todayDate);
  const pickedMilestone = pickMilestone(blocks, language, milestone);
  const reminderSummary = blocks.filter((b) => b.kind === "reminder_summary" && b.language === language);
  const pickedReminder  = due.length
    ? pickReminderSummary(reminderSummary, due, recentIds, cooldownD, user, todayDate)
    : null;
  const pickedCoaching  = pickCoaching(blocks, language, ageBracket, level, recentIds, cooldownD, user, todayDate);
  const pickedInactivity = level === "RISK"
    ? pickInactivity(blocks, language, ageBracket, daysSinceInteraction, recentIds, cooldownD, user, todayDate)
    : null;
  const pickedCTA = pickCTA(blocks, language, recentIds, cooldownD, user, todayDate);

  // Assemble in reading order. Milestone displaces coaching on anniversary
  // days so the user gets ONE headline moment, not two.
  const ordered = [
    pickedGreeting,
    pickedMilestone,
    pickedReminder,
    pickedMilestone ? null : pickedCoaching,
    pickedInactivity,
    // Inactivity blocks are self-closing; CTA would feel repetitive.
    pickedInactivity ? null : pickedCTA,
  ].filter(Boolean);

  if (!ordered.length) return null;

  // Placeholder values. medication_name / reminder_time come from the
  // first due medication reminder (if any) so R-*-002 reads naturally.
  const dueMed = due.find((r) => r.category === "medication");
  const daysActive21d = await d.daysActiveInWindow(user.id, 21);
  const values = buildValues({
    user,
    language,
    firstName: firstNameOf(user),
    dueReminders: (due || []).map((r) => r.label).filter(Boolean),
    medicationName: dueMed?.label || null,
    reminderTime: dueMed?.time_of_day || null,
    daysActive21d,
  });

  const parts = ordered.map((b) => render(b.text, values, { blockId: b.id }));
  const text = parts.join(" ").replace(/ {2,}/g, " ").trim();
  const block_ids = ordered.map((b) => b.id);

  return { text, block_ids, engagement_score: score, engagement_level: level };
}
