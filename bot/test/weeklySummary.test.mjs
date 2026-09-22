// Weekly summary is now written from the numbers (no AI call). The figures
// must match what periodStats(user, 7) reports, and each rule branch must
// pick the right "watch" and "focus" line.
//
// Run: node --test test/weeklySummary.test.mjs

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const { buildWeeklySummary } = await import("../src/weeklySummaryText.js");
const { showSummary } = await import("../src/flows/progress.js");
const { getSession } = await import("../src/session.js");
const supabase = await import("../src/supabase.js");

const STATS = {
  days: 7, glucoseCount: 10, glucoseAvg: 132, glucoseMin: 88, glucoseMax: 190,
  inRangePct: 80, medicationCount: 6, healthCount: 5,
};
const user = (extra = {}) => ({ streak: 4, medications: "Metformin 500mg", ...extra });

test("every number in the summary comes from the stats", () => {
  const out = buildWeeklySummary(user(), STATS, "en");
  assert.match(out, /\*10\* readings/);
  assert.match(out, /average \*132 mg\/dL\*/);
  assert.match(out, /lowest 88, highest 190/);
  assert.match(out, /\*80%\* of those readings/);
  assert.match(out, /Medication logged \*6\* times/);
  assert.match(out, /Check-ins: \*5\*/);
  assert.match(out, /\*4-day\* logging streak/);
  assert.equal(out.split("\n").length, 8, out);
});

test("no invented numbers: nothing appears that isn't in the stats", () => {
  const out = buildWeeklySummary(user(), STATS, "en");
  const allowed = new Set(["10", "132", "88", "190", "80", "6", "5", "4", "70", "15"]);
  for (const n of out.match(/\d+/g) || []) assert.ok(allowed.has(n), `unexpected number ${n} in: ${out}`);
});

test("a low reading is flagged and drives the focus", () => {
  const out = buildWeeklySummary(user(), { ...STATS, glucoseMin: 62 }, "en");
  assert.match(out, /below 70 mg\/dL/);
  assert.match(out, /share that with your doctor/);
});

test("a high average is flagged", () => {
  const out = buildWeeklySummary(user(), { ...STATS, glucoseAvg: 210 }, "en");
  assert.match(out, /average is running high/);
});

test("too few readings asks for more logging first", () => {
  const out = buildWeeklySummary(user(), { ...STATS, glucoseCount: 3 }, "en");
  assert.match(out, /log at least one reading every day/);
});

test("low time-in-range suggests the post-meal walk", () => {
  const out = buildWeeklySummary(user(), { ...STATS, inRangePct: 40 }, "en");
  assert.match(out, /15-minute walk/);
});

test("medicines on file but none logged asks for medicine logging", () => {
  const out = buildWeeklySummary(user(), { ...STATS, medicationCount: 0 }, "en");
  assert.match(out, /No medication logged this week/);
  assert.match(out, /log your medicines each day/);
});

test("a user with no medicines on file is not nagged about them", () => {
  const out = buildWeeklySummary(user({ medications: "" }), { ...STATS, medicationCount: 0 }, "en");
  assert.ok(!/medication/i.test(out), out);
});

test("a good week just says keep going", () => {
  const out = buildWeeklySummary(user(), STATS, "en");
  assert.match(out, /healthy range/);
  assert.match(out, /keep your routine/i);
});

test("no readings at all still produces a summary", () => {
  const out = buildWeeklySummary(user(), { ...STATS, glucoseCount: 0, glucoseAvg: null, glucoseMin: null, glucoseMax: null, inRangePct: null }, "en");
  assert.match(out, /No blood sugar readings/);
  assert.ok(!/NaN|null|undefined/.test(out), out);
});

for (const lang of ["ur", "roman_ur"]) {
  test(`${lang}: translated, with the same numbers and no leftover keys`, () => {
    const out = buildWeeklySummary(user(), STATS, lang);
    assert.ok(!/wsum_/.test(out), `untranslated key in: ${out}`);
    assert.ok(!/\{[a-z_]+\}/.test(out), `unfilled placeholder in: ${out}`);
    assert.match(out, /132/);
    assert.match(out, /80/);
  });
}

test("showSummary sends the summary with no AI call", async () => {
  const chatId = 9400;
  const base = await supabase.getOrCreateUser(`tg-ws-${chatId}`, "telegram");
  const u = await supabase.updateUser(base.id, { onboarded: true, language: "en", tier: "free", user_type: "diabetes" });
  await supabase.addGlucoseFull(u.id, { value: 120, unit: "mg_dl", measure_kind: "fasting", context: "fasting" });
  await supabase.addGlucoseFull(u.id, { value: 150, unit: "mg_dl", measure_kind: "random", context: "random" });

  const sent = [];
  const bot = { sendMessage: async (id, text, opts) => { sent.push(text); return { message_id: 1 }; }, sendChatAction: async () => {} };
  const session = getSession(chatId);
  session.user = u;
  session.userFetchedAt = Date.now();

  await showSummary(bot, chatId, session);

  const all = sent.join("\n");
  assert.match(all, /Your week at a glance/);
  assert.match(all, /\*2\* readings/);
  assert.match(all, /average \*135 mg\/dL\*/, all); // (120 + 150) / 2
  assert.ok(!/something is off|try again/i.test(all), all);
});
