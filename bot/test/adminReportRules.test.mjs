// Admin-panel patient PDFs use the rule-based copy, never the AI
// (2026-09-22). Every sentence must still be filled in, and the numbers must
// come from the same facts block the AI used.
//
// Run: node --test test/adminReportRules.test.mjs

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";

import { strict as assert } from "node:assert";
import { test } from "node:test";
import fs from "node:fs";

const { fallbackInsights, assembleSnapshotData } = await import("../src/snapshotData.js");
const { renderSnapshotPdf } = await import("../src/snapshotPdf.js");
const supabase = await import("../src/supabase.js");

test("web.js never calls the AI for admin reports", () => {
  const src = fs.readFileSync(new URL("../src/web.js", import.meta.url), "utf8");
  assert.ok(!/snapshotInsights/.test(src), "web.js must not import or call snapshotInsights");
  assert.ok(/fallbackInsights\(data\)/.test(src));
});

function baseData(over = {}) {
  return {
    trends: {
      weekly: { enough: true, fasting: { avg: 118, min: 95, max: 140 }, random: { avg: 150, min: 110, max: 190 }, total: 14 },
      monthly: { enough: true, fasting: { avg: 124, min: 90, max: 165 }, random: { avg: 158, min: 100, max: 240 }, total: 60 },
    },
    latest: { hba1c: { value: 6.8, level: "good" } },
    labs: { items: [] },
    lifestyle: { weightDelta: -2, checkins: 12, activeChallenges: 1 },
    score: { total: 72, rating: "Good", components: [{ key: "glucose", label: "Glucose Logging Consistency", score: 32, max: 40 }] },
    medicines: [],
    goals: ["Lose 5 kg by December"],
    ...over,
  };
}

test("all four narrative fields are filled, with the real numbers", () => {
  const ins = fallbackInsights(baseData());
  assert.match(ins.weekly_summary, /118 mg\/dL/);
  assert.match(ins.weekly_summary, /95–140/);
  assert.match(ins.monthly_summary, /124 mg\/dL/);
  assert.match(ins.monthly_summary, /60 readings/);
  assert.ok(ins.score_message.length > 10);
  assert.equal(ins.insights.length, 3);
  for (const i of ins.insights) {
    assert.ok(["good", "warn", "info"].includes(i.tone));
    assert.ok(i.text.length > 10);
    assert.ok(!/undefined|null|NaN/.test(i.text), i.text);
  }
});

test("every score rating produces a score message", () => {
  for (const rating of ["Excellent", "Good", "Fair", "Needs Focus"]) {
    const ins = fallbackInsights(baseData({ score: { total: 60, rating, components: [{ key: "glucose", score: 20, max: 40 }] } }));
    assert.ok(ins.score_message && ins.score_message.length > 10, rating);
  }
});

test("the patient's goal is referenced when logging is already good", () => {
  const ins = fallbackInsights(baseData());
  assert.ok(ins.insights.some((i) => /Lose 5 kg by December/.test(i.text)), JSON.stringify(ins.insights));
});

test("weak logging outranks the goal", () => {
  const ins = fallbackInsights(baseData({ score: { total: 30, rating: "Needs Focus", components: [{ key: "glucose", score: 10, max: 40 }] } }));
  assert.ok(ins.insights.some((i) => /more consistently/.test(i.text)));
  assert.ok(!ins.insights.some((i) => /Lose 5 kg/.test(i.text)));
});

test("a high HbA1c is flagged as a warning", () => {
  const ins = fallbackInsights(baseData({ latest: { hba1c: { value: 9.1, level: "bad" } } }));
  assert.equal(ins.insights[0].tone, "warn");
  assert.match(ins.insights[0].text, /9\.1%/);
});

test("thin data says what to log instead of inventing a trend", () => {
  const ins = fallbackInsights(baseData({
    trends: { weekly: { enough: false, fasting: {}, random: {} }, monthly: { enough: false, fasting: {}, random: {} } },
    latest: {},
  }));
  assert.match(ins.weekly_summary, /Not enough readings/);
  assert.match(ins.monthly_summary, /needs at least/);
  assert.ok(!/undefined|NaN/.test(ins.weekly_summary + ins.monthly_summary));
});

test("a real admin PDF renders from the rule-based copy", async () => {
  const base = await supabase.getOrCreateUser("tg-admin-pdf-1", "telegram");
  const user = await supabase.updateUser(base.id, { onboarded: true, name: "Test Patient", language: "en", tier: "premium", user_type: "diabetes" });
  for (const [v, k] of [[110, "fasting"], [145, "random"], [122, "fasting"], [170, "random"]]) {
    await supabase.addGlucoseFull(user.id, { value: v, unit: "mg_dl", measure_kind: k, context: k });
  }
  const data = await assembleSnapshotData(user);
  const pdf = await renderSnapshotPdf(data, fallbackInsights(data));
  assert.ok(Buffer.isBuffer(pdf) && pdf.length > 20000, `pdf too small: ${pdf?.length}`);
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
});
