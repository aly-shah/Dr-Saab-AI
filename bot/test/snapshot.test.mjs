// Tests for 📊 Generate Report — the Executive Health Snapshot.
//
// Run:  cd bot && node --test test/snapshot.test.mjs
//
// Memory backend, no database and no AI: the pure data layer (readings
// parser, sufficiency rule, score, assembly), the PDF renderer, and the
// conversational flow up to the point where it would call the model.

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.D360_API_KEY = "";
process.env.WHATSAPP_TOKEN = "";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const supabase = await import("../src/supabase.js");
const {
  assembleSnapshotData,
  fallbackInsights,
  glucoseSufficiency,
  missingProfileFields,
  computeScore,
  labStatus,
  dailySeries,
} = await import("../src/snapshotData.js");
const { renderSnapshotPdf } = await import("../src/snapshotPdf.js");
const { startSnapshot, snapshotText, snapshotCallback, parseReadings } = await import("../src/flows/snapshot.js");

const DAY = 86400000;

function makeFakeBot() {
  const sent = [];
  const docs = [];
  return {
    sent,
    docs,
    sendMessage: async (chatId, text, opts) => {
      sent.push({ chatId, text, opts });
      return { message_id: sent.length };
    },
    sendDocument: async (chatId, buffer, opts, fileOpts) => {
      docs.push({ chatId, buffer, opts, fileOpts });
      return { ok: true };
    },
    sendChatAction: async () => {},
    getFileLink: async () => null,
  };
}

function makeSession(user) {
  return { state: "idle", step: null, data: {}, history: [], user };
}

async function seedUser(overrides = {}) {
  const base = await supabase.getOrCreateUser(`tg-${Math.random().toString(36).slice(2)}`, "telegram");
  return supabase.updateUser(base.id, { onboarded: true, language: "en", tier: "consistency", ...overrides });
}

const lastText = (bot) => bot.sent[bot.sent.length - 1]?.text || "";

const FULL_PROFILE = {
  name: "Yasir Abbasi",
  age: 46,
  gender: "male",
  diabetes_status: "type2",
  height_cm: 175,
  weight_kg: 82,
};

async function seedReadings(userId, days = 14) {
  const now = Date.now();
  for (let d = days - 1; d >= 0; d--) {
    const at = new Date(now - d * DAY);
    at.setHours(7, 15, 0, 0);
    await supabase.addGlucoseFull(userId, { value: 110 + d, context: "fasting", created_at: at.toISOString() });
    const at2 = new Date(now - d * DAY);
    at2.setHours(19, 0, 0, 0);
    await supabase.addGlucoseFull(userId, { value: 160 + d, context: "random", created_at: at2.toISOString() });
  }
}

// ---- readings parser --------------------------------------------------------

test("parseReadings: one per line with context and date", () => {
  const now = new Date("2026-09-15T10:00:00+05:00").getTime();
  const out = parseReadings("110 fasting 12 Sep\n165 random 12 sep\n98 fasting yesterday\n7.2 fasting today", now);
  assert.equal(out.length, 4);
  assert.deepEqual(out.map((r) => r.value), [110, 165, 98, 130]); // 7.2 mmol/L → 130 mg/dL
  assert.deepEqual(out.map((r) => r.context), ["fasting", "random", "fasting", "fasting"]);
  assert.equal(out[0].created_at.slice(0, 10), "2026-09-12");
  assert.equal(out[2].created_at.slice(0, 10), "2026-09-14");
  assert.equal(out[3].created_at.slice(0, 10), "2026-09-15");
});

test("parseReadings: ignores nonsense and keeps the reading value separate from dates", () => {
  const now = new Date("2026-09-15T10:00:00+05:00").getTime();
  assert.equal(parseReadings("hello there", now).length, 0);
  const out = parseReadings("12/9 random 175", now);
  assert.equal(out.length, 1);
  assert.equal(out[0].value, 175);
  assert.equal(out[0].created_at.slice(0, 10), "2026-09-12");
});

// ---- data layer ------------------------------------------------------------

test("glucoseSufficiency mirrors the printed rule", () => {
  const now = Date.now();
  const rows = [];
  for (let i = 0; i < 3; i++) {
    rows.push({ value_mgdl: 110, context: "fasting", created_at: new Date(now - i * DAY).toISOString() });
    rows.push({ value_mgdl: 170, context: "random", created_at: new Date(now - i * DAY).toISOString() });
  }
  const s = glucoseSufficiency(rows, now);
  assert.equal(s.weekly.enough, true);
  assert.equal(s.monthly.enough, false); // 6 < 8 total
  rows.push({ value_mgdl: 6.4, context: "hba1c", created_at: new Date(now).toISOString() });
  assert.equal(glucoseSufficiency(rows, now).total, 6, "HbA1c rows are not glucose readings");
});

test("dailySeries buckets by Pakistan day and averages duplicates", () => {
  const now = new Date("2026-09-15T12:00:00+05:00").getTime();
  const rows = [
    { value_mgdl: 100, context: "fasting", created_at: "2026-09-15T02:00:00+05:00" },
    { value_mgdl: 120, context: "fasting", created_at: "2026-09-15T08:00:00+05:00" },
    { value_mgdl: 180, context: "post_meal", created_at: "2026-09-14T20:00:00+05:00" },
  ];
  const s = dailySeries(rows, 3, now);
  assert.equal(s.length, 3);
  assert.equal(s[2].fasting, 110);
  assert.equal(s[1].random, 180);
  assert.equal(s[0].fasting, null);
});

test("missingProfileFields lists what the PDF cannot do without", () => {
  assert.deepEqual(missingProfileFields({}), ["name", "age", "gender", "diabetes", "height", "weight"]);
  assert.deepEqual(missingProfileFields({ ...FULL_PROFILE, weight_kg: null }), ["weight"]);
  assert.deepEqual(missingProfileFields(FULL_PROFILE), []);
});

test("labStatus maps extraction statuses to report labels", () => {
  assert.deepEqual(labStatus({ status: "in_range" }), { label: "Normal", tone: "good" });
  assert.deepEqual(labStatus({ status: "borderline", result: "118", reference_range: "<100" }), { label: "Borderline High", tone: "warn" });
  assert.deepEqual(labStatus({ status: "out_of_range", result: "22", reference_range: "30-100" }), { label: "Low", tone: "bad" });
  assert.deepEqual(labStatus({ status: "unknown" }), { label: "—", tone: "muted" });
});

test("computeScore never exceeds 100 and does not punish users with no medicines", () => {
  const now = Date.now();
  const days = (n, extra = {}) => Array.from({ length: n }, (_, i) => ({ created_at: new Date(now - i * DAY).toISOString(), ...extra }));
  const full = computeScore({
    glucose30: days(30),
    medLogs30: days(30),
    health30: days(30, { steps: 5000, weight_kg: 80 }),
    hasMeds: true,
    activeChallenges: 1,
    pastChallenges: 0,
  });
  assert.equal(full.total, 100);
  assert.equal(full.rating, "Excellent");
  const noMeds = computeScore({ glucose30: days(30), medLogs30: [], health30: [], hasMeds: false, activeChallenges: 0, pastChallenges: 0 });
  assert.equal(noMeds.components.find((c) => c.key === "medication").score, 20);
  const empty = computeScore({ glucose30: [], medLogs30: [], health30: [], hasMeds: false, activeChallenges: 0, pastChallenges: 0 });
  assert.equal(empty.total, 0);
  assert.equal(empty.rating, "Needs Focus");
});

test("assembleSnapshotData + renderSnapshotPdf work on a nearly empty record", async () => {
  const user = await seedUser(FULL_PROFILE);
  const data = await assembleSnapshotData(user);
  assert.equal(data.profile.bmi, 26.8);
  assert.equal(data.profile.bmiCategory, "Overweight");
  assert.equal(data.latest.fasting, null);
  assert.equal(data.trends.weekly.enough, false);
  assert.equal(data.labs.items.length, 0);
  assert.equal(data.medicines.length, 0);
  const ins = fallbackInsights(data);
  assert.equal(ins.insights.length, 3);
  assert.ok(ins.weekly_summary.length > 20);
  const pdf = await renderSnapshotPdf(data, ins);
  assert.ok(Buffer.isBuffer(pdf));
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdf.length > 20_000, "PDF should embed fonts and content");
});

test("assembleSnapshotData picks up readings, labs, medicines and HbA1c", async () => {
  const user = await seedUser({ ...FULL_PROFILE, latest_hba1c: 7.4 });
  await seedReadings(user.id, 14);
  await supabase.addHealthMedication(user.id, { name: "Metformin", dose: "500 mg", frequency: "twice daily" });
  await supabase.addLabReport(user.id, "labs", "ok", {
    metadata: { report_date: "2026-08-20" },
    values: [
      { test: "HbA1c", result: "6.9", unit: "%", status: "borderline" },
      { test: "LDL Cholesterol", result: "118", unit: "mg/dL", reference_range: "<100", status: "borderline" },
      { test: "Fasting glucose", result: "104", unit: "mg/dL", status: "in_range" },
    ],
  });
  const data = await assembleSnapshotData(user);
  assert.equal(data.trends.weekly.enough, true);
  assert.equal(data.trends.weekly.fasting.count, 14);
  assert.equal(data.latest.fasting.value, 110);
  assert.equal(data.latest.fasting.level, "good");
  assert.equal(data.latest.hba1c.value, 6.9, "lab-report HbA1c (dated) beats the undated self-report");
  assert.deepEqual(data.labs.items.map((l) => l.name), ["LDL Cholesterol"], "glucose-type labs live in section 2, not here");
  assert.equal(data.medicines[0].name, "Metformin");
  assert.match(data.facts, /Metformin/);
});

// ---- flow ------------------------------------------------------------------

test("free users get the upgrade prompt and never enter the flow", async () => {
  const user = await seedUser({ ...FULL_PROFILE, tier: "free" });
  const session = makeSession(user);
  const bot = makeFakeBot();
  await startSnapshot(bot, 1, session);
  assert.equal(session.state, "idle");
  assert.match(lastText(bot), /Consistency Coach/);
  assert.equal(bot.docs.length, 0);
});

test("missing profile fields are asked in order and saved to the user", async () => {
  const user = await seedUser({ name: "Sana", age: null, gender: null, diabetes_status: null, height_cm: null, weight_kg: null });
  const session = makeSession(user);
  const bot = makeFakeBot();

  await startSnapshot(bot, 2, session);
  assert.equal(session.state, "snapshot");
  assert.equal(session.step, "age");
  assert.match(bot.sent[0].text, /few details are missing/);

  await snapshotText(bot, 2, session, "abc");
  assert.equal(session.step, "age", "invalid age re-asks");
  await snapshotText(bot, 2, session, "38 years");
  assert.equal(session.user.age, 38);
  assert.equal(session.step, "gender");

  await snapshotCallback(bot, 2, session, "snap:gender:female");
  assert.equal(session.user.gender, "female");
  assert.equal(session.step, "diabetes");

  await snapshotCallback(bot, 2, session, "snap:dt:type2");
  assert.equal(session.user.diabetes_status, "type2");
  assert.equal(session.step, "height");

  await snapshotText(bot, 2, session, "5 ft 4");
  assert.equal(session.user.height_cm, 163);
  assert.equal(session.step, "weight");

  await snapshotText(bot, 2, session, "68 kg");
  assert.equal(session.user.weight_kg, 68);
  // Profile complete → not enough readings → asks for them (skippable).
  assert.equal(session.step, "readings");
  assert.match(lastText(bot), /3 fasting/);
  assert.match(lastText(bot), /0 fasting/);
});

test("pasted readings are saved with their dates and the flow moves on", async () => {
  const user = await seedUser(FULL_PROFILE);
  await supabase.addHealthMedication(user.id, { name: "Metformin", dose: "500 mg", frequency: "twice daily" });
  const session = makeSession(user);
  const bot = makeFakeBot();
  await startSnapshot(bot, 3, session);
  assert.equal(session.step, "readings");

  await snapshotText(bot, 3, session, "nonsense");
  assert.equal(session.step, "readings");
  assert.match(lastText(bot), /couldn't find any readings/);

  await snapshotText(bot, 3, session, "110 fasting today\n165 random today\n104 fasting yesterday\n150 random yesterday");
  const raw = await supabase.snapshotRaw(user.id);
  assert.equal(raw.glucose.length, 4);
  assert.ok(bot.sent.some((m) => /Saved 4 reading/.test(m.text)));
  // Still short of 3+3 → second (last) ask with updated counts.
  assert.equal(session.step, "readings_more");
  assert.match(lastText(bot), /2 fasting/);
});

test("Skip on the medicines question is honoured", async () => {
  const user = await seedUser(FULL_PROFILE);
  await seedReadings(user.id, 14);
  const session = makeSession(user);
  const bot = makeFakeBot();
  await startSnapshot(bot, 4, session);
  assert.equal(session.step, "meds", "enough readings → goes straight to medicines");
  assert.equal(session.data.snap.medsAsked, true);
  // "none" typed → continue; generation then runs (AI unreachable → fallback copy).
  await snapshotText(bot, 4, session, "none");
  assert.equal(session.state, "idle", "flow ends after generation");
  assert.equal(bot.docs.length, 1, "PDF delivered as a document");
  assert.match(bot.docs[0].fileOpts.filename, /^DrSaab-Health-Snapshot-\d{4}-\d{2}-\d{2}\.pdf$/);
  assert.equal(bot.docs[0].buffer.subarray(0, 5).toString(), "%PDF-");
  assert.match(bot.docs[0].opts.caption, /Health Score/);
  assert.ok(bot.sent.some((m) => /Key insights/.test(m.text)));
});
