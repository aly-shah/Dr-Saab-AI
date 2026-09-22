// AI usage tightening (2026-09-22): smaller photos, trimmed chat history,
// template replies for small talk, and no AI call for "none" answers.
//
// Run: node --test test/aiUsage.test.mjs

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";

import { strict as assert } from "node:assert";
import { test } from "node:test";
import sharp from "sharp";

const { shrinkImages, trimHistory } = await import("../src/openai.js");
const { detectSmallTalk, smallTalkReplyKey } = await import("../src/smalltalk.js");
const { handleMessage } = await import("../src/bot.js");
const { getSession } = await import("../src/session.js");
const supabase = await import("../src/supabase.js");

test("shrinkImages scales a big photo down to the max side", async () => {
  const big = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#c33" } }).jpeg().toBuffer();
  const url = `data:image/jpeg;base64,${big.toString("base64")}`;
  const [msg] = await shrinkImages([{ role: "user", content: [{ type: "text", text: "meal" }, { type: "image_url", image_url: { url } }] }], 1024);
  const out = Buffer.from(msg.content[1].image_url.url.split(",")[1], "base64");
  const meta = await sharp(out).metadata();
  assert.equal(Math.max(meta.width, meta.height), 1024);
  assert.equal(msg.content[0].text, "meal");
});

test("shrinkImages leaves small photos and text-only messages alone", async () => {
  const small = await sharp({ create: { width: 400, height: 300, channels: 3, background: "#3c3" } }).jpeg().toBuffer();
  const url = `data:image/jpeg;base64,${small.toString("base64")}`;
  const [msg] = await shrinkImages([{ role: "user", content: [{ type: "image_url", image_url: { url } }] }], 1024);
  const meta = await sharp(Buffer.from(msg.content[0].image_url.url.split(",")[1], "base64")).metadata();
  assert.equal(meta.width, 400);
  const text = [{ role: "user", content: "hello" }];
  assert.equal(await shrinkImages(text, 1024), text);
});

test("trimHistory keeps the last 6 messages and clips long ones", () => {
  const h = Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `m${i} ` + "x".repeat(i === 11 ? 2000 : 10) }));
  const out = trimHistory(h);
  assert.equal(out.length, 6);
  assert.ok(out[0].content.startsWith("m6"));
  assert.ok(out[5].content.length <= 601);
});

test("small talk detection: whole-message only", () => {
  assert.equal(detectSmallTalk("Thank you so much!"), "thanks");
  assert.equal(detectSmallTalk("👍"), "ack");
  assert.equal(detectSmallTalk("theek hai"), "ack");
  assert.equal(detectSmallTalk("Allah Hafiz"), "bye");
  assert.equal(detectSmallTalk("thanks, what about rice?"), null);
  assert.equal(detectSmallTalk("is 145 ok"), null);
});

test("small talk after DrSaab asked a question still goes to the AI", () => {
  const asked = { history: [{ role: "assistant", content: "Would you like a meal plan?" }] };
  const told = { history: [{ role: "assistant", content: "Walk 10 minutes after meals." }] };
  assert.equal(smallTalkReplyKey(asked, "ok"), null);
  assert.equal(smallTalkReplyKey(told, "ok"), "smalltalk_ack");
  assert.equal(smallTalkReplyKey(told, "ok", true), null, "photos always go to the AI");
});

function makeFakeBot() {
  const sent = [];
  return {
    sent,
    sendMessage: async (chatId, text, opts) => { sent.push({ chatId, text, opts }); return { message_id: sent.length }; },
    sendChatAction: async () => {},
    answerCallbackQuery: async () => {},
    getFileLink: async () => null,
  };
}

test('idle "thanks" gets a template reply without an AI call', async () => {
  const chatId = 9300;
  const base = await supabase.getOrCreateUser(`tg-st-${chatId}`, "telegram");
  const user = await supabase.updateUser(base.id, { onboarded: true, language: "en", tier: "free", user_type: "diabetes" });
  const session = getSession(chatId);
  session.user = user;
  session.userFetchedAt = Date.now();
  const bot = makeFakeBot();

  await handleMessage(bot, { chat: { id: chatId }, from: { id: chatId }, text: "thanks" });

  // The stub Groq key would fail any real AI call with an error message.
  assert.ok(/You're welcome/.test(bot.sent.map((s) => s.text).join("\n")), JSON.stringify(bot.sent.map((s) => s.text)));
});
