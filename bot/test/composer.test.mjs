// Unit tests for the Engagement Engine (Build 1). Node's built-in test
// runner — no dependency add.
//
// Run:  cd bot && node --test test/composer.test.mjs
//
// The composer's data access is dependency-injected through a `deps` bag
// (see composeDailyMessage in src/composer.js), so this file drives it
// with hand-rolled fakes — no DB required. We do need supabase.js to load
// cleanly (composer imports it), so we stub the boot-time env checks first.

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.REMINDER_TZ_OFFSET = "5";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const { composeDailyMessage } = await import("../src/composer.js");
const engagement = await import("../src/engagement.js");
const placeholders = await import("../src/placeholders.js");

// ---- Fixtures: five spec blocks per kind, English + Roman Urdu. ----
// We reuse the seed-row shape from schema.sql so the fake mirrors prod.
const BLOCKS = [
  // greetings
  { id: "G-EN-001", kind: "greeting", language: "english", age_brackets: ["any"], window: "morning",   text: "Good morning{first_name_optional}, quick health check-in for today.", sort_order: 10 },
  { id: "G-EN-002", kind: "greeting", language: "english", age_brackets: ["any"], window: "afternoon", text: "Quick afternoon check-in{first_name_optional}.", sort_order: 20 },
  { id: "G-EN-003", kind: "greeting", language: "english", age_brackets: ["any"], window: "evening",   text: "Evening check-in{first_name_optional}.", sort_order: 30 },
  { id: "G-EN-004", kind: "greeting", language: "english", age_brackets: ["50-64","65+"], window: "morning", text: "Assalam o Alaikum{first_name_optional}. Hope your day has started well.", sort_order: 40 },
  { id: "G-RU-002", kind: "greeting", language: "roman_urdu", age_brackets: ["any"], window: "afternoon", text: "Salaam{first_name_optional}, afternoon ka chota sa check-in.", sort_order: 20 },
  // reminder summaries
  { id: "R-EN-001", kind: "reminder_summary", language: "english", age_brackets: ["any"], reminder_type: "generic",    text: "For today: {due_reminders}." },
  { id: "R-EN-002", kind: "reminder_summary", language: "english", age_brackets: ["any"], reminder_type: "medication", text: "Please remember your {medication_name} at {reminder_time}." },
  { id: "R-EN-003", kind: "reminder_summary", language: "english", age_brackets: ["any"], reminder_type: "glucose",    text: "If today is a sugar-check day, send me your reading when convenient." },
  // coaching
  { id: "C-EN-HE-001",   kind: "coaching", language: "english", age_brackets: ["any"],         engagement: "HE",   text: "You are already showing consistency. Today, just keep the rhythm going." },
  { id: "C-EN-E-001",    kind: "coaching", language: "english", age_brackets: ["any"],         engagement: "E",    text: "You are building the right routine. Small daily actions matter more than perfect days." },
  { id: "C-EN-LOW-001",  kind: "coaching", language: "english", age_brackets: ["any"],         engagement: "LOW",  text: "A quick update today will help me understand where you are and guide you better." },
  { id: "C-EN-RISK-001", kind: "coaching", language: "english", age_brackets: ["16-19","20-34"], engagement: "RISK", text: "You have not disappeared, right? Send one small update and we are back on track." },
  { id: "C-EN-RISK-002", kind: "coaching", language: "english", age_brackets: ["50-64","65+"], engagement: "RISK", text: "Whenever you feel ready, send me one small update. We can restart gently." },
  { id: "C-RU-RISK-001", kind: "coaching", language: "roman_urdu", age_brackets: ["16-19","20-34"], engagement: "RISK", text: "Ghost to nahi kar diya DrSaab ko? Ek choti update bhej dein, phir track pe." },
  // milestones
  { id: "M-EN-T7",  kind: "milestone", language: "english", age_brackets: ["any"], milestone: "T7",  text: "One week complete. The win is not perfection; the win is staying connected to your health." },
  { id: "M-EN-T21", kind: "milestone", language: "english", age_brackets: ["any"], milestone: "T21", text: "21 days in. This is your first real consistency checkpoint. You have taken {days_active_21d} active steps so far." },
  // inactivity
  { id: "I-EN-D4", kind: "inactivity", language: "english",    age_brackets: ["any"],         trigger_days: 4, text: "Haven't heard from you in a few days. Send me a quick update when you can." },
  { id: "I-EN-D7B",kind: "inactivity", language: "english",    age_brackets: ["50-64","65+"], trigger_days: 7, text: "It has been a few days. Whenever convenient, send me one update so we can continue." },
  { id: "I-RU-D4", kind: "inactivity", language: "roman_urdu", age_brackets: ["any"],         trigger_days: 4, text: "Kuch din se update nahi aayi. Jab ho sake quick update bhej dein." },
  // CTAs
  { id: "CTA-EN-001", kind: "cta", language: "english",    age_brackets: ["any"], text: "Reply with your update when ready." },
  { id: "CTA-EN-002", kind: "cta", language: "english",    age_brackets: ["any"], text: "Send me one reading, meal, medicine update, or question." },
  { id: "CTA-RU-001", kind: "cta", language: "roman_urdu", age_brackets: ["any"], text: "Ready hon to update bhej dein." },
];

function fakeDeps({ activity, lastAt, due = [], recent = new Map(), daysActive21d = 0, cfg = {} }) {
  return {
    getEngagementConfig: async () => cfg,
    listMessageBlocks: async ({ language }) => BLOCKS.filter((b) => b.language === language),
    activityCountsSince: async () => activity,
    lastInteractionAt: async () => lastAt,
    userDueReminders: async () => due,
    recentBlockIdsForUser: async () => recent,
    daysActiveInWindow: async () => daysActive21d,
  };
}

// A morning-in-PKT Date object. Composer uses REMINDER_TZ_OFFSET=5, so an
// 03:30 UTC clock corresponds to 08:30 PKT — inside "morning".
function morningPKT(dateISO) {
  return new Date(`${dateISO}T03:30:00Z`);
}

// ---- Tests ----

test("engaged user gets greeting + coaching + CTA in English", async () => {
  const user = {
    id: "u1", name: "Yasir Ahmed", age: 40, language: "en",
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  };
  const deps = fakeDeps({
    activity: { glucose: 5, medication: 8, checkin: 3, wellbeing: 1, coach: 2, in_range: 4 },
    lastAt: new Date().toISOString(),
  });
  const out = await composeDailyMessage(user, { now: morningPKT("2026-07-07"), deps });
  assert.ok(out, "expected a composed message");
  assert.equal(out.engagement_level, "E");
  assert.deepEqual(out.block_ids, ["G-EN-001", "C-EN-E-001", "CTA-EN-001"]);
  assert.ok(out.text.includes("Yasir"), "should include first name");
  assert.ok(!/\{[^}]+\}/.test(out.text), "no raw placeholders in final text");
});

test("inactive user (14+ days silent) returns null — no system nudge", async () => {
  const user = { id: "u2", name: "A", age: 30, language: "en", created_at: new Date().toISOString() };
  const deps = fakeDeps({
    activity: { glucose: 0, medication: 0, checkin: 0, wellbeing: 0, coach: 0, in_range: 0 },
    lastAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  });
  const out = await composeDailyMessage(user, { now: morningPKT("2026-07-07"), deps });
  assert.equal(out, null);
});

test("at-risk 20-34 user on day 4 gets English inactivity block and Roman Urdu when lang=ur", async () => {
  const baseUser = {
    id: "u3", name: "Sara", age: 24,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  };
  const activity = { glucose: 0, medication: 0, checkin: 0, wellbeing: 0, coach: 0, in_range: 0 };
  const lastAt = new Date(Date.now() - 4 * 86400000).toISOString();

  const en = await composeDailyMessage(
    { ...baseUser, language: "en" },
    { now: morningPKT("2026-07-07"), deps: fakeDeps({ activity, lastAt }) }
  );
  assert.equal(en.engagement_level, "RISK");
  assert.ok(en.block_ids.includes("I-EN-D4"), "expected the 4-day inactivity block");
  assert.ok(en.block_ids.includes("C-EN-RISK-001"), "20-34 gets the youth risk coaching");

  const ru = await composeDailyMessage(
    { ...baseUser, language: "ur" },
    { now: morningPKT("2026-07-07"), deps: fakeDeps({ activity, lastAt }) }
  );
  assert.ok(ru.block_ids.includes("I-RU-D4"), "ur falls back to Roman Urdu inactivity");
  assert.ok(ru.block_ids.includes("C-RU-RISK-001"));
});

test("meds due today → medication reminder-summary variant with placeholders filled", async () => {
  const now = morningPKT("2026-07-07");
  const user = {
    id: "u4", name: "", age: 55, language: "en",
    // Anchor onboarding age to the fixed clock so we don't collide with the
    // 90-day milestone on real Date.now().
    created_at: new Date(now.getTime() - 60 * 86400000).toISOString(),
  };
  const due = [{ category: "medication", label: "Metformin 500mg", time_of_day: "20:00" }];
  const deps = fakeDeps({
    activity: { glucose: 10, medication: 20, checkin: 5, wellbeing: 0, coach: 0, in_range: 6 },
    lastAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
    due,
  });
  const out = await composeDailyMessage(user, { now, deps });
  assert.ok(out, "expected a message");
  assert.ok(out.block_ids.includes("R-EN-002"), "medication summary picked");
  assert.ok(out.text.includes("Metformin 500mg"));
  assert.ok(out.text.includes("20:00"));
  assert.ok(!/^,|,,/.test(out.text), "no orphan leading/double comma from empty first_name_optional");
});

test("day-7 milestone displaces coaching", async () => {
  const now = morningPKT("2026-07-07");
  const user = {
    id: "u5", name: "Ali", age: 40, language: "en",
    created_at: new Date(now.getTime() - 7 * 86400000).toISOString(),
  };
  const deps = fakeDeps({
    activity: { glucose: 6, medication: 6, checkin: 2, wellbeing: 0, coach: 1, in_range: 3 },
    lastAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
  });
  const out = await composeDailyMessage(user, { now, deps });
  assert.ok(out.block_ids.includes("M-EN-T7"), `expected M-EN-T7 in ${out.block_ids.join(",")}`);
  assert.ok(!out.block_ids.some((id) => id.startsWith("C-EN-")), "coaching skipped on milestone day");
});

test("unknown placeholder is stripped, not left raw", () => {
  const out = placeholders.render(
    "Hello{first_name_optional} — welcome {mystery} home.",
    placeholders.buildValues({ language: "english", firstName: "Yas" })
  );
  assert.ok(!/\{[^}]+\}/.test(out), `no raw placeholders in "${out}"`);
  assert.ok(out.includes("Yas"));
});

test("engagement levelFor honours INACTIVE cutoff", () => {
  const thresholds = { level_he_min: 75, level_e_min: 55, level_low_min: 35 };
  assert.equal(engagement.levelFor(90, 2, thresholds, 14), "HE");
  assert.equal(engagement.levelFor(60, 2, thresholds, 14), "E");
  assert.equal(engagement.levelFor(40, 2, thresholds, 14), "LOW");
  assert.equal(engagement.levelFor(10, 2, thresholds, 14), "RISK");
  assert.equal(engagement.levelFor(90, 20, thresholds, 14), "INACTIVE");
});

test("ageBracketOf maps to spec brackets", () => {
  assert.equal(engagement.ageBracketOf({ age: 17 }), "16-19");
  assert.equal(engagement.ageBracketOf({ age: 25 }), "20-34");
  assert.equal(engagement.ageBracketOf({ age: 55 }), "50-64");
  assert.equal(engagement.ageBracketOf({ age: 70 }), "65+");
  assert.equal(engagement.ageBracketOf({}), "any");
});

test("ageBracketMatches supports 50+ compound", () => {
  assert.equal(engagement.ageBracketMatches("50-64", ["50+"]), true);
  assert.equal(engagement.ageBracketMatches("65+",  ["50+"]), true);
  assert.equal(engagement.ageBracketMatches("20-34",["50+"]), false);
  assert.equal(engagement.ageBracketMatches("20-34",["any"]), true);
});
