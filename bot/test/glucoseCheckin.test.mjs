// Check-In → Blood Sugar: a typed reading must be saved as a glucose row,
// never bounced to the Explain My Report flow.
//
// Regression: the universal shortcut router ran BEFORE the state switch,
// so "HbA1c 7.2" (one of the examples in the check-in prompt itself) was
// detected as a structured HbA1c reading and routed to startLab.
//
// Run: node --test test/glucoseCheckin.test.mjs

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.REMINDER_TZ_OFFSET = "5";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const { handleMessage, handleCallback } = await import("../src/bot.js");
const { getSession } = await import("../src/session.js");
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

let nextChat = 7000;
async function seedChat() {
  const chatId = nextChat++;
  const base = await supabase.getOrCreateUser(`tg-bs-${chatId}`, "telegram");
  const user = await supabase.updateUser(base.id, {
    onboarded: true,
    language: "en",
    tier: "free",
    user_type: "patient",
  });
  const session = getSession(chatId);
  session.user = user;
  session.userFetchedAt = Date.now();
  return { chatId, user, session };
}

const msg = (chatId, text) => ({ chat: { id: chatId }, from: { id: chatId }, text });
const allText = (bot) => bot.sent.map((s) => s.text).join("\n");

for (const input of ["HbA1c 7.2", "glucose 140 fasting", "Fasting 112", "Random 145"]) {
  test(`check-in: "${input}" is saved as a reading, not routed to Explain My Report`, async () => {
    const { chatId, user, session } = await seedChat();
    const bot = makeFakeBot();
    session.state = "glucose"; // user tapped Check-In → Blood Sugar

    await handleMessage(bot, msg(chatId, input));

    assert.notEqual(session.state, "lab", "must not enter the lab-report flow");
    assert.ok(!/Explain My Report/i.test(allText(bot)), `got: ${allText(bot)}`);
    assert.equal(await supabase.countGlucose(user.id), 1, "one glucose row saved");
    const [row] = await supabase.recentGlucose(user.id, 1);
    if (/hba1c/i.test(input)) {
      assert.equal(row.measure_kind ?? row.context, "hba1c");
      assert.equal(Number(row.value_mgdl ?? row.value), 7.2);
    } else if (/fasting/i.test(input)) {
      assert.equal(row.measure_kind ?? row.context, "fasting");
    }
    assert.ok(/saved/i.test(allText(bot)), `confirmation expected, got: ${allText(bot)}`);
  });
}

test('menu: "HbA1c 7.2" typed from idle logs the reading instead of opening Explain My Report', async () => {
  const { chatId, user, session } = await seedChat();
  const bot = makeFakeBot();
  session.state = "idle";

  await handleMessage(bot, msg(chatId, "HbA1c 7.2"));

  assert.notEqual(session.state, "lab");
  assert.ok(!/Explain My Report/i.test(allText(bot)), `got: ${allText(bot)}`);
  assert.equal(await supabase.countGlucose(user.id), 1);
});

test("save-reading offer: Yes on an HbA1c value logs it", async () => {
  const { chatId, user, session } = await seedChat();
  const bot = makeFakeBot();
  session.state = "idle";

  await handleCallback(bot, {
    id: "q1",
    from: { id: chatId },
    message: { chat: { id: chatId } },
    data: "saveq:hba1c:6.9:yes",
  });

  assert.notEqual(session.state, "lab");
  assert.equal(await supabase.countGlucose(user.id), 1);
  const [row] = await supabase.recentGlucose(user.id, 1);
  assert.equal(Number(row.value_mgdl ?? row.value), 6.9);
});

// Shortcut from idle: a timing named in the sentence must be picked up,
// not asked for again ("My random sugar is 145" used to re-ask).
for (const [input, kind, value] of [
  ["My random sugar is 145", "random", 145],
  ["my fasting sugar is 110", "fasting", 110],
  ["sugar after lunch 180", "post_meal", 180],
  ["sugar 160 after breakfast", "post_meal", 160],
  ["sugar before bed 130", "bedtime", 130],
  ["meri sugar khane se pehle 120 thi", "pre_meal", 120],
  ["sugar khali pait 105", "fasting", 105],
]) {
  test(`shortcut: "${input}" logs as ${kind} without asking for timing`, async () => {
    const { chatId, user, session } = await seedChat();
    const bot = makeFakeBot();
    session.state = "idle";

    await handleMessage(bot, msg(chatId, input));

    assert.notEqual(session.step, "await_context", `re-asked: ${allText(bot)}`);
    assert.equal(await supabase.countGlucose(user.id), 1, `got: ${allText(bot)}`);
    const [row] = await supabase.recentGlucose(user.id, 1);
    assert.equal(row.measure_kind ?? row.context, kind);
    assert.equal(Number(row.value_mgdl ?? row.value), value);
  });
}

test("shortcut: \"My sugar is 145\" with no timing still asks for it", async () => {
  const { chatId, user, session } = await seedChat();
  const bot = makeFakeBot();
  session.state = "idle";

  await handleMessage(bot, msg(chatId, "My sugar is 145"));

  assert.equal(session.step, "await_context");
  assert.equal(await supabase.countGlucose(user.id), 0);

  await handleMessage(bot, msg(chatId, "khane ke baad"));
  const [row] = await supabase.recentGlucose(user.id, 1);
  assert.equal(row.measure_kind ?? row.context, "post_meal");
  assert.equal(Number(row.value_mgdl ?? row.value), 145);
});

test("save-reading offer: timing from the question rides along", async () => {
  const { chatId, user, session } = await seedChat();
  const bot = makeFakeBot();
  session.state = "idle";

  await handleCallback(bot, {
    id: "q2",
    from: { id: chatId },
    message: { chat: { id: chatId } },
    data: "saveq:glucose:140:yes:fasting",
  });

  assert.equal(await supabase.countGlucose(user.id), 1);
  const [row] = await supabase.recentGlucose(user.id, 1);
  assert.equal(row.measure_kind ?? row.context, "fasting");
});
