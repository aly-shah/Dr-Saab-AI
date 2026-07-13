// Tests for the My Health question-sequence flow. Uses Node's built-in test
// runner and the memory backend from supabase.js (no external DB).
//
// Run:  cd bot && node --test test/myhealth.test.mjs
//
// The tests cover both the NEW user path (not_started → intro → Start →
// Q1..Q5 → completed) and the REPEAT user paths (in_progress resume, and
// completed profile → summary). They also lock in the state-preservation fix:
// a callback arriving after the in-memory session was cleared (bot restart,
// intervening resetFlow) must re-assert session.state = "myhealth" so the
// user's next TYPED answer routes back to myHealthText rather than showMenu.

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.REMINDER_TZ_OFFSET = "5";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const { startMyHealth, myHealthText, myHealthCallback } = await import(
  "../src/flows/myhealth.js"
);
const supabase = await import("../src/supabase.js");

// ---- Fakes -----------------------------------------------------------------

// A "bot" that just records every send so the test can inspect what the user
// would have seen. Mirrors the shape utils.send() invokes internally.
function makeFakeBot() {
  const sent = [];
  return {
    sent,
    sendMessage: async (chatId, text, opts) => {
      sent.push({ chatId, text, opts });
      return { message_id: sent.length };
    },
    sendChatAction: async () => {},
    getFileLink: async () => null,
  };
}

// A fresh in-memory session that mirrors what session.getSession would return.
// Kept local to each test so parallel runs stay isolated.
function makeSession(user) {
  return { state: "idle", step: null, data: {}, history: [], user };
}

// The tests seed a user via the memory backend so its id + row shape match what
// the flow expects (updateUser reads/writes the same map).
async function seedUser(overrides = {}) {
  const base = await supabase.getOrCreateUser(
    `tg-${Math.random().toString(36).slice(2)}`,
    "telegram"
  );
  return await supabase.updateUser(base.id, {
    onboarded: true,
    language: "en",
    ...overrides,
  });
}

// Grab the last message the bot sent (what the user is currently looking at).
function lastText(bot) {
  return bot.sent[bot.sent.length - 1]?.text || "";
}

// ---- Tests -----------------------------------------------------------------

test("new user: intro screen shown with Start button", async () => {
  const user = await seedUser({ health_profile_status: "not_started" });
  const session = makeSession(user);
  const bot = makeFakeBot();

  await startMyHealth(bot, 1001, session);

  assert.equal(session.state, "myhealth");
  assert.equal(session.step, "intro");
  assert.ok(lastText(bot).includes("My Health"), "intro should include the header");
  const keyboard = bot.sent.at(-1)?.opts?.reply_markup?.inline_keyboard;
  assert.ok(
    keyboard?.some((row) => row.some((b) => b.callback_data === "mh:start")),
    "intro screen must offer the Start button"
  );
});

test("new user: tapping Start moves to Q1 and persists state", async () => {
  const user = await seedUser({ health_profile_status: "not_started" });
  const session = makeSession(user);
  session.state = "myhealth";
  session.step = "intro";
  const bot = makeFakeBot();

  await myHealthCallback(bot, 1002, session, "mh:start");

  assert.equal(session.state, "myhealth");
  assert.equal(session.step, "q1");
  const persisted = await supabase.getOrCreateUser(user.telegram_id, "telegram");
  assert.equal(persisted.health_profile_status, "in_progress");
  assert.equal(persisted.health_setup_step, 1);
  assert.ok(lastText(bot).includes("Question 1 of 5"));
});

test("regression: mh:start after a lost session re-asserts myhealth state", async () => {
  // Bot restarted between showing the intro and the user tapping Start. The
  // getSession() call returns a fresh { state: "idle" } session. Before the
  // fix, promptQuestion would send Q1 but leave state=idle, so the user's Q1
  // answer routed to showMenu. After the fix, myHealthCallback re-asserts
  // state so the text handler receives the answer.
  const user = await seedUser({
    health_profile_status: "in_progress",
    health_setup_step: 1,
  });
  const session = makeSession(user); // state="idle" — simulates post-restart
  const bot = makeFakeBot();

  await myHealthCallback(bot, 1003, session, "mh:start");

  assert.equal(
    session.state,
    "myhealth",
    "callback must re-assert state so typed Q1 answer routes to myHealthText"
  );
  assert.equal(session.step, "q1");
});

test("new user: OK on Q1 confirmation advances to Q2 and saves conditions", async () => {
  const user = await seedUser({
    health_profile_status: "in_progress",
    health_setup_step: 1,
  });
  const session = makeSession(user);
  session.state = "myhealth";
  session.step = "q1_confirm";
  session.data.pending = {
    conditions: ["Type 2 Diabetes", "High Blood Pressure"],
    original: "type 2 diabetes and htn",
  };
  const bot = makeFakeBot();

  await myHealthCallback(bot, 1004, session, "mh:ok");

  assert.equal(session.state, "myhealth");
  assert.equal(session.step, "q2");
  assert.equal(session.data.pending, null);
  const stored = await supabase.listConditions(user.id);
  assert.deepEqual(
    stored.map((c) => c.condition_name).sort(),
    ["High Blood Pressure", "Type 2 Diabetes"]
  );
  const persisted = await supabase.getOrCreateUser(user.telegram_id, "telegram");
  assert.equal(persisted.health_setup_step, 2);
  // Save ack + Q2 prompt should both have been sent.
  const texts = bot.sent.map((m) => m.text).join("\n");
  assert.ok(texts.includes("Saved"), "Q1 confirm should send a Saved ack");
  assert.ok(texts.includes("Question 2 of 5"), "should advance to Q2");
});

test("new user: OK on Q2 saves medications and advances to Q3", async () => {
  const user = await seedUser({
    health_profile_status: "in_progress",
    health_setup_step: 2,
  });
  const session = makeSession(user);
  session.state = "myhealth";
  session.step = "q2_confirm";
  session.data.pending = {
    medications: [
      { name: "Metformin", dose: "500mg", frequency: "twice daily", generic_name: null },
    ],
    original: "metformin 500mg twice",
    source: "text",
  };
  const bot = makeFakeBot();

  await myHealthCallback(bot, 1005, session, "mh:ok");

  assert.equal(session.step, "q3");
  const meds = await supabase.listMedications(user.id);
  const found = meds.find((m) => m.name === "Metformin");
  assert.ok(found, "Metformin should be persisted");
  assert.equal(found.dose, "500mg");
});

test("new user: OK on Q3 saves metrics and advances to Q4", async () => {
  const user = await seedUser({
    health_profile_status: "in_progress",
    health_setup_step: 3,
  });
  const session = makeSession(user);
  session.state = "myhealth";
  session.step = "q3_confirm";
  session.data.pending = {
    metrics: [
      { metric_type: "hba1c", value: 7.2, unit: "%", secondary_value: null, reading_context: null, measurement_date: null },
      { metric_type: "weight", value: 81, unit: "kg", secondary_value: null, reading_context: null, measurement_date: null },
    ],
    original: "hba1c 7.2, weight 81",
  };
  const bot = makeFakeBot();

  await myHealthCallback(bot, 1006, session, "mh:ok");

  assert.equal(session.step, "q4");
  const latest = await supabase.latestMetrics(user.id);
  const byType = Object.fromEntries(latest.map((m) => [m.metric_type, m]));
  assert.ok(byType.hba1c, "hba1c saved");
  assert.equal(Number(byType.hba1c.value), 7.2);
  assert.ok(byType.weight, "weight saved");
  // Mirror-to-user should have kept the summary-view fields in sync.
  const persisted = await supabase.getOrCreateUser(user.telegram_id, "telegram");
  assert.equal(Number(persisted.latest_hba1c), 7.2);
  assert.equal(Number(persisted.weight_kg), 81);
});

test("new user: Skip on Q4 advances to Q5 without saving lifestyle", async () => {
  const user = await seedUser({
    health_profile_status: "in_progress",
    health_setup_step: 4,
  });
  const session = makeSession(user);
  session.state = "myhealth";
  session.step = "q4";
  const bot = makeFakeBot();

  await myHealthCallback(bot, 1007, session, "mh:skip");

  assert.equal(session.step, "q5");
  const life = await supabase.getLifestyle(user.id);
  assert.equal(life, null, "no lifestyle row created on Skip");
});

test("new user: Skip on Q5 finishes setup and shows the summary", async () => {
  const user = await seedUser({
    health_profile_status: "in_progress",
    health_setup_step: 5,
  });
  const session = makeSession(user);
  session.state = "myhealth";
  session.step = "q5";
  const bot = makeFakeBot();

  await myHealthCallback(bot, 1008, session, "mh:skip");

  assert.equal(session.state, "myhealth");
  assert.equal(session.step, "update", "completed profile should sit in update mode");
  const persisted = await supabase.getOrCreateUser(user.telegram_id, "telegram");
  assert.equal(persisted.health_profile_status, "completed");
  assert.equal(persisted.health_setup_step, 5);
  const texts = bot.sent.map((m) => m.text).join("\n");
  assert.ok(texts.includes("your health profile is ready"), "completion message shown");
  assert.ok(texts.includes("Here's what I currently know"), "summary shown after completion");
});

test("repeat user: in_progress resumes at the next unanswered question", async () => {
  const user = await seedUser({
    health_profile_status: "in_progress",
    health_setup_step: 3,
  });
  const session = makeSession(user);
  const bot = makeFakeBot();

  await startMyHealth(bot, 1009, session);

  assert.equal(session.state, "myhealth");
  assert.equal(session.step, "q3");
  const texts = bot.sent.map((m) => m.text).join("\n");
  assert.ok(texts.includes("Welcome back"), "resume banner shown");
  assert.ok(
    texts.includes("your health conditions") && texts.includes("your medicines"),
    "recap should list what was already covered (Q1, Q2)"
  );
  assert.ok(texts.includes("Question 3 of 5"), "next question is Q3");
});

test("repeat user: completed profile lands on the summary and accepts free-text updates", async () => {
  const user = await seedUser({ health_profile_status: "completed" });
  await supabase.addConditions(user.id, ["Type 2 Diabetes"], "text", null);
  const session = makeSession(user);
  const bot = makeFakeBot();

  await startMyHealth(bot, 1010, session);

  assert.equal(session.state, "myhealth");
  assert.equal(session.step, "update", "completed users get the summary + update prompt");
  assert.ok(lastText(bot).includes("My Health"));
  assert.ok(lastText(bot).includes("Type 2 Diabetes"), "summary shows saved condition");
});

test("regression: mh:ok on q1_confirm after a lost session re-asserts state", async () => {
  const user = await seedUser({
    health_profile_status: "in_progress",
    health_setup_step: 1,
  });
  const session = makeSession(user); // state="idle" — post-restart
  session.step = "q1_confirm";
  session.data.pending = { conditions: ["Type 2 Diabetes"], original: "t2d" };
  const bot = makeFakeBot();

  await myHealthCallback(bot, 1011, session, "mh:ok");

  assert.equal(
    session.state,
    "myhealth",
    "callback must re-assert state so the next answer routes to myHealthText"
  );
  assert.equal(session.step, "q2");
});
