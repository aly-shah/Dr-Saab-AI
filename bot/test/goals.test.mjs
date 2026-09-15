// ❤️ My Health → Goals (returning-user sub-menu).
//
// Once the 7-question setup is complete, My Health opens on a sub-menu. The
// Goals item asks a first-time user for achievable goals, stores them
// verbatim (active user_health_goal row + users.goals mirror), and on later
// visits lists them back and offers to update.
//
// Run: node --test test/goals.test.mjs

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.REMINDER_TZ_OFFSET = "5";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const { startMyHealth, myHealthText, myHealthCallback } = await import("../src/flows/myhealth.js");
const { handleMessage } = await import("../src/bot.js");
const { getSession } = await import("../src/session.js");
const { assembleSnapshotData } = await import("../src/snapshotData.js");
const { splitGoalLines } = await import("../src/utils.js");
const supabase = await import("../src/supabase.js");

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

function makeSession(user) {
  return { state: "idle", step: null, data: {}, history: [], user };
}

async function seedUser(overrides = {}) {
  const base = await supabase.getOrCreateUser(`tg-goals-${Math.random().toString(36).slice(2)}`, "telegram");
  return await supabase.updateUser(base.id, {
    onboarded: true,
    language: "en",
    tier: "free",
    health_profile_status: "completed",
    ...overrides,
  });
}

const lastText = (bot) => bot.sent[bot.sent.length - 1]?.text || "";
const lastButtons = (bot) =>
  (bot.sent.at(-1)?.opts?.reply_markup?.inline_keyboard || []).flat().map((b) => b.callback_data);

const GOALS = "lose 5kg, reduce HbA1c by 1%, go to the gym 3 times a week";

test("splitGoalLines: commas, semicolons and newlines separate goals; 1,000 stays intact", () => {
  assert.deepEqual(splitGoalLines(GOALS), ["lose 5kg", "reduce HbA1c by 1%", "go to the gym 3 times a week"]);
  assert.deepEqual(splitGoalLines("walk 10,000 steps daily; sleep 7 hours\n- no sweet chai"), [
    "walk 10,000 steps daily",
    "sleep 7 hours",
    "no sweet chai",
  ]);
  assert.deepEqual(splitGoalLines("   "), []);
});

test("first time: Goals asks for achievable goals, stores them, returns to the sub-menu", async () => {
  const user = await seedUser();
  const session = makeSession(user);
  const bot = makeFakeBot();

  await startMyHealth(bot, 2001, session);
  assert.equal(session.step, "menu");
  assert.ok(lastButtons(bot).includes("mh:goals"), "sub-menu shows Goals");

  await myHealthCallback(bot, 2001, session, "mh:goals");
  assert.equal(session.step, "goals_input");
  assert.ok(lastText(bot).includes("Let's set up your health goals"), `got: ${lastText(bot)}`);
  assert.ok(lastText(bot).includes("reduce HbA1c by 1%"));

  await myHealthText(bot, 2001, session, GOALS);

  const stored = await supabase.getLatestHealthGoal(user.id);
  assert.equal(stored?.goal, GOALS, "active health goal row holds the goals verbatim");
  const persisted = await supabase.getOrCreateUser(user.telegram_id, "telegram");
  assert.equal(persisted.goals, GOALS, "users.goals mirror (AI context / reports baseline)");
  assert.equal(persisted.primary_goal, GOALS);

  const texts = bot.sent.map((s) => s.text).join("\n");
  assert.ok(texts.includes("Goals saved"), "confirmation shown");
  assert.ok(texts.includes("• lose 5kg") && texts.includes("• go to the gym 3 times a week"), "goals listed back");
  assert.equal(session.step, "menu", "back on the sub-menu afterwards");
});

test("returning: Goals lists the stored goals and asks to update; No keeps them", async () => {
  const user = await seedUser();
  await supabase.addHealthGoal(user.id, { goal: GOALS });
  const session = makeSession(user);
  const bot = makeFakeBot();

  await startMyHealth(bot, 2002, session);
  await myHealthCallback(bot, 2002, session, "mh:goals");

  assert.equal(session.step, "goals_view");
  assert.ok(lastText(bot).includes("Here are the goals I have stored for you"), `got: ${lastText(bot)}`);
  assert.ok(lastText(bot).includes("• reduce HbA1c by 1%"));
  assert.ok(lastText(bot).includes("Do you want to update them?"));
  assert.ok(lastButtons(bot).includes("mh:goals_yes") && lastButtons(bot).includes("mh:goals_no"));

  await myHealthCallback(bot, 2002, session, "mh:goals_no");
  assert.equal((await supabase.getLatestHealthGoal(user.id)).goal, GOALS, "unchanged");
  assert.equal(session.step, "menu");
});

test("returning: Yes → new goals replace the old ones", async () => {
  const user = await seedUser();
  await supabase.addHealthGoal(user.id, { goal: GOALS });
  const session = makeSession(user);
  const bot = makeFakeBot();

  await startMyHealth(bot, 2003, session);
  await myHealthCallback(bot, 2003, session, "mh:goals");
  await myHealthCallback(bot, 2003, session, "mh:goals_yes");
  assert.equal(session.step, "goals_input");
  assert.ok(lastText(bot).includes("updated goals"));

  const NEW = "lose 8kg; walk 30 minutes daily";
  await myHealthText(bot, 2003, session, NEW);

  assert.equal((await supabase.getLatestHealthGoal(user.id)).goal, NEW);
  const persisted = await supabase.getOrCreateUser(user.telegram_id, "telegram");
  assert.equal(persisted.goals, NEW);

  // Next visit lists the new goals.
  const bot2 = makeFakeBot();
  await myHealthCallback(bot2, 2003, session, "mh:goals");
  assert.ok(lastText(bot2).includes("• walk 30 minutes daily"));
  assert.ok(!lastText(bot2).includes("lose 5kg"));
});

test("returning: typing new goals instead of answering yes/no saves them", async () => {
  const user = await seedUser();
  await supabase.addHealthGoal(user.id, { goal: GOALS });
  const session = makeSession(user);
  const bot = makeFakeBot();

  await startMyHealth(bot, 2004, session);
  await myHealthCallback(bot, 2004, session, "mh:goals");
  await myHealthText(bot, 2004, session, "reduce HbA1c to under 7");

  assert.equal((await supabase.getLatestHealthGoal(user.id)).goal, "reduce HbA1c to under 7");
});

test("goals typed through the real message router are not hijacked by the sugar shortcut", async () => {
  const chatId = 2005;
  const user = await seedUser();
  const session = getSession(chatId);
  session.user = user;
  session.userFetchedAt = Date.now();
  session.state = "myhealth";
  session.step = "goals_input";
  const bot = makeFakeBot();

  await handleMessage(bot, { chat: { id: chatId }, from: { id: chatId }, text: "reduce my sugar to 120, lose 5kg" });

  assert.equal(session.state, "myhealth", "stayed in My Health");
  assert.equal((await supabase.getLatestHealthGoal(user.id)).goal, "reduce my sugar to 120, lose 5kg");
  assert.equal(await supabase.countGlucose(user.id), 0, "no glucose reading was logged");
});

test("snapshot report: stored goals appear in the facts block as the baseline", async () => {
  const user = await seedUser({ name: "Test Patient", age: 45, gender: "male", height_cm: 170, weight_kg: 80 });
  await supabase.addHealthGoal(user.id, { goal: GOALS });
  const fresh = await supabase.getOrCreateUser(user.telegram_id, "telegram");

  const data = await assembleSnapshotData(fresh);

  assert.deepEqual(data.goals, ["lose 5kg", "reduce HbA1c by 1%", "go to the gym 3 times a week"]);
  assert.ok(data.facts.includes("Patient's stated goals (baseline for this report): lose 5kg; reduce HbA1c by 1%"), data.facts);
});

test("sub-menu: paid users get Health Snapshot under My Health and it starts the report flow", async () => {
  const user = await seedUser({ tier: "consistency", name: "Paid Patient", age: 50, gender: "male", diabetes_status: "type2", height_cm: 170, weight_kg: 80 });
  const session = makeSession(user);
  const bot = makeFakeBot();

  await startMyHealth(bot, 2006, session);
  const buttons = lastButtons(bot);
  assert.ok(buttons.includes("mh:snapshot"), "Health Snapshot listed for a paid user");
  const label = bot.sent.at(-1).opts.reply_markup.inline_keyboard.flat().find((b) => b.callback_data === "mh:snapshot").text;
  assert.ok(label.includes("Health Snapshot"), label);

  await myHealthCallback(bot, 2006, session, "mh:snapshot");
  assert.equal(session.state, "snapshot", "snapshot flow started from My Health");
});

test("sub-menu: free users do not see Health Snapshot", async () => {
  const user = await seedUser({ tier: "free" });
  const session = makeSession(user);
  const bot = makeFakeBot();
  await startMyHealth(bot, 2007, session);
  assert.ok(!lastButtons(bot).includes("mh:snapshot"));
});
