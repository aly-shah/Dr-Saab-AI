// Facebook "join the page" ad → WhatsApp pre-filled
// "How can I join the DrSaab Community?". Must reply "You have already
// joined!", then start onboarding straight at the name question (no
// language picker). Already-onboarded users get the menu instead.
//
// Run: node --test test/joinAd.test.mjs

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const { handleMessage } = await import("../src/bot.js");
const { getSession } = await import("../src/session.js");
const supabase = await import("../src/supabase.js");
const { isJoinMessage } = await import("../src/welcome.js");

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

let nextChat = 9100;
async function seedChat(patch) {
  const chatId = nextChat++;
  const base = await supabase.getOrCreateUser(`tg-join-${chatId}`, "telegram");
  const user = patch ? await supabase.updateUser(base.id, patch) : base;
  const session = getSession(chatId);
  session.user = user;
  session.userFetchedAt = Date.now();
  return { chatId, session };
}

const msg = (chatId, text) => ({ chat: { id: chatId }, from: { id: chatId }, text });
const AD_TEXT = "How can I join the DrSaab Community?";
const hasLangPicker = (bot) =>
  bot.sent.some((s) => JSON.stringify(s.opts || {}).includes("lang:"));

test("isJoinMessage matches the ad text, not unrelated joins", () => {
  assert.ok(isJoinMessage(AD_TEXT));
  assert.ok(isJoinMessage("I want to join Dr Saab"));
  assert.ok(!isJoinMessage("join the type 1 community"));
  assert.ok(!isJoinMessage("hi"));
});

test("new user tapping the ad: joined message, welcome, then name — no language picker", async () => {
  const { chatId, session } = await seedChat();
  const bot = makeFakeBot();

  await handleMessage(bot, msg(chatId, AD_TEXT));

  assert.equal(bot.sent[0].text, "You have already joined! Welcome to DrSaab,");
  assert.ok(/welcome to DrSaab/i.test(bot.sent[1].text), bot.sent[1].text);
  assert.ok(/full name/i.test(bot.sent[2].text), bot.sent[2].text);
  assert.ok(!hasLangPicker(bot), "no language picker");
  assert.equal(session.state, "onboarding");
  assert.equal(session.step, "name");

  // Next reply is taken as their name.
  await handleMessage(bot, msg(chatId, "Ali Khan"));
  assert.equal(session.data.name, "Ali Khan");
});

test("onboarded user tapping the ad: joined message then the menu", async () => {
  const { chatId, session } = await seedChat({
    onboarded: true, language: "en", tier: "free", user_type: "diabetes", name: "Sara",
  });
  const bot = makeFakeBot();

  await handleMessage(bot, msg(chatId, AD_TEXT));

  assert.equal(bot.sent[0].text, "You have already joined! Welcome to DrSaab,");
  assert.ok(JSON.stringify(bot.sent[1].opts || {}).includes("feat:"), "main menu shown");
  assert.notEqual(session.state, "onboarding");
});

test("/start for a new user skips the language picker too", async () => {
  const { chatId, session } = await seedChat();
  const bot = makeFakeBot();

  await handleMessage(bot, msg(chatId, "/start"));

  assert.ok(!hasLangPicker(bot));
  assert.equal(session.step, "name");
});

test("Urdu salaam greeting starts onboarding in Urdu", async () => {
  const { chatId, session } = await seedChat();
  const bot = makeFakeBot();
  session.state = "onboarding";
  session.step = "name";

  await handleMessage(bot, msg(chatId, "السلام علیکم"));

  assert.equal(session.data.language, "ur");
  assert.equal(session.step, "name");
  assert.ok(!hasLangPicker(bot));
});
