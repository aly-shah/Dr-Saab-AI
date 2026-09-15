// ❤️ My Health → Trends.
//
// Stored glucose (fasting / random), HbA1c and weight are analysed and
// compared against the user's goals. No data → "add data consistently";
// limited data → last entries newest first; no goals → "enter your goals".
//
// Run: node --test test/trends.test.mjs

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.REMINDER_TZ_OFFSET = "5";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const { startMyHealth, myHealthCallback } = await import("../src/flows/myhealth.js");
const { assembleTrendData, analyzeTrends, renderTrends, parseGoalTarget } = await import("../src/trends.js");
const supabase = await import("../src/supabase.js");

const DAY = 86400000;
const daysAgo = (n) => new Date(Date.now() - n * DAY).toISOString();

function makeFakeBot() {
  const sent = [];
  return {
    sent,
    sendMessage: async (chatId, text, opts) => {
      sent.push({ chatId, text, opts });
      return { message_id: sent.length };
    },
    sendChatAction: async () => {},
    answerCallbackQuery: async () => {},
    getFileLink: async () => null,
  };
}
const makeSession = (user) => ({ state: "idle", step: null, data: {}, history: [], user });
const lastText = (bot) => bot.sent[bot.sent.length - 1]?.text || "";
const lastButtons = (bot) =>
  (bot.sent.at(-1)?.opts?.reply_markup?.inline_keyboard || []).flat().map((b) => b.callback_data);

async function seedUser(overrides = {}) {
  const base = await supabase.getOrCreateUser(`tg-trends-${Math.random().toString(36).slice(2)}`, "telegram");
  return await supabase.updateUser(base.id, {
    onboarded: true,
    language: "en",
    tier: "free",
    health_profile_status: "completed",
    ...overrides,
  });
}

async function render(user) {
  const fresh = await supabase.getOrCreateUser(user.telegram_id, "telegram");
  return renderTrends("en", analyzeTrends(await assembleTrendData(fresh)));
}

test("parseGoalTarget reads the common goal phrasings", () => {
  assert.deepEqual(parseGoalTarget("lose 5kg"), { metric: "weight", mode: "relative", amount: -5 });
  assert.deepEqual(parseGoalTarget("reduce HbA1c by 1%"), { metric: "hba1c", mode: "relative", amount: -1 });
  assert.deepEqual(parseGoalTarget("HbA1c under 7"), { metric: "hba1c", mode: "absolute", target: 7 });
  assert.deepEqual(parseGoalTarget("get my fasting sugar below 120"), { metric: "fasting", mode: "absolute", target: 120 });
  assert.deepEqual(parseGoalTarget("reach 75 kg"), { metric: "weight", mode: "absolute", target: 75 });
  assert.equal(parseGoalTarget("go to the gym 3 times a week").mode, "unmeasured");
});

test("no data: asks the user to add health data consistently (and goals)", async () => {
  const user = await seedUser();
  const text = await render(user);
  assert.ok(text.includes("add your health data consistently"), text);
  assert.ok(text.includes("haven't set any goals"), text);
});

test("limited data: lists the last entries, most recent first", async () => {
  const user = await seedUser();
  await supabase.addGlucoseFull(user.id, { value: 150, context: "fasting", created_at: daysAgo(3) });
  await supabase.addGlucoseFull(user.id, { value: 132, context: "fasting", created_at: daysAgo(1) });
  const text = await render(user);
  assert.ok(text.includes("not enough for a trend yet"), text);
  const i150 = text.indexOf("150 mg/dL");
  const i132 = text.indexOf("132 mg/dL");
  assert.ok(i132 > -1 && i150 > -1 && i132 < i150, "newest entry listed first: " + text);
  assert.ok(text.includes("Not tracked yet: random sugar, HbA1c, weight"), text);
});

test("enough data: trends for fasting sugar, HbA1c and weight, compared against goals", async () => {
  const user = await seedUser({ name: "Trend Tester" });
  // Fasting: 10 readings over 20 days, improving 150 → 118.
  const fasting = [150, 148, 145, 140, 136, 130, 126, 122, 120, 118];
  for (let i = 0; i < fasting.length; i++) {
    await supabase.addGlucoseFull(user.id, { value: fasting[i], context: "fasting", created_at: daysAgo(20 - i * 2) });
  }
  // HbA1c: 8.1 two months ago → 7.4 yesterday.
  await supabase.addGlucoseFull(user.id, { value: 8.1, context: "hba1c", created_at: daysAgo(60) });
  await supabase.addGlucoseFull(user.id, { value: 7.4, context: "hba1c", created_at: daysAgo(1) });
  // Weight: 82 → 80.5 over a month.
  await supabase.addHealthLog(user.id, { weight_kg: 82, created_at: daysAgo(30) });
  await supabase.addHealthLog(user.id, { weight_kg: 81.2, created_at: daysAgo(15) });
  await supabase.addHealthLog(user.id, { weight_kg: 80.5, created_at: daysAgo(1) });
  await supabase.addHealthGoal(user.id, { goal: "lose 5kg, reduce HbA1c by 1%, go to the gym 3 times a week" });

  const text = await render(user);

  assert.ok(text.includes("Fasting sugar"), text);
  assert.ok(text.includes("10 readings"), text);
  assert.ok(text.includes("improving"), text);
  assert.ok(text.includes("8.1% (") && text.includes("7.4% ("), text);
  assert.ok(text.includes("82 kg (") && text.includes("80.5 kg ("), text);
  assert.ok(text.includes("Against your goals"), text);
  assert.ok(text.includes("lose 5kg — ↓ 1.5 kg so far, 3.5 kg to go"), text);
  assert.ok(text.includes("reduce HbA1c by 1% — ↓ 0.7% so far, 0.3% to go"), text);
  assert.ok(text.includes("go to the gym 3 times a week — I can't measure this"), text);
  assert.ok(text.includes("Not tracked yet: random sugar"), text);
});

test("goal achieved and absolute targets are reported", async () => {
  const user = await seedUser();
  await supabase.addHealthLog(user.id, { weight_kg: 80, created_at: daysAgo(40) });
  await supabase.addHealthLog(user.id, { weight_kg: 74.5, created_at: daysAgo(1) });
  await supabase.addGlucoseFull(user.id, { value: 7.9, context: "hba1c", created_at: daysAgo(2) });
  await supabase.addHealthGoal(user.id, { goal: "lose 5kg; HbA1c under 7" });
  const text = await render(user);
  assert.ok(text.includes("lose 5kg — ✅ achieved (74.5 kg now)"), text);
  assert.ok(text.includes("HbA1c under 7 — now 7.9%, target 7% (0.9% to go)"), text);
});

test("sub-menu: Trends button opens the card and offers Check In / Goals", async () => {
  const user = await seedUser();
  const session = makeSession(user);
  const bot = makeFakeBot();
  await startMyHealth(bot, 3001, session);
  assert.ok(lastButtons(bot).includes("mh:trends"), "sub-menu offers Trends");

  await myHealthCallback(bot, 3001, session, "mh:trends");
  assert.equal(session.state, "myhealth");
  assert.equal(session.step, "menu");
  assert.ok(lastText(bot).includes("Health Trends"), lastText(bot));
  assert.ok(lastButtons(bot).includes("feat:checkin") && lastButtons(bot).includes("mh:goals"));
});
