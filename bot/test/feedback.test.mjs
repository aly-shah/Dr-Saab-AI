// "Feedback" command → feedback inbox (flows/feedback.js).
//
// Run: node --test test/feedback.test.mjs

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const { handleMessage, handleCallback } = await import("../src/bot.js");
const { getSession } = await import("../src/session.js");
const { parseFeedbackCommand, wantsFeedbackMedia } = await import("../src/flows/feedback.js");
const supabase = await import("../src/supabase.js");

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
const OGG = "data:audio/ogg;base64,T2dnUwACAAAAAAAAAAA=";

function makeFakeBot() {
  const sent = [];
  return {
    sent,
    sendMessage: async (chatId, text, opts) => { sent.push({ chatId, text, opts }); return { message_id: sent.length }; },
    sendChatAction: async () => {},
    answerCallbackQuery: async () => {},
  };
}

let nextChat = 7100;
async function setup({ onboarded = true, name = "Feedback Tester" } = {}) {
  const chatId = nextChat++;
  const base = await supabase.getOrCreateUser(`tg-fb-${chatId}`, "telegram");
  const user = await supabase.updateUser(base.id, { onboarded, language: "en", tier: "free", name });
  const session = getSession(chatId);
  session.user = user;
  session.userFetchedAt = Date.now();
  session.source = "telegram";
  return { chatId, session, user, bot: makeFakeBot() };
}

const say = (bot, chatId, text, extra = {}) =>
  handleMessage(bot, { chat: { id: chatId }, from: { id: chatId }, text, ...extra });

async function feedbackFor(userId) {
  return (await supabase.listFeedback()).filter((f) => f.user_id === userId);
}

test("parseFeedbackCommand recognises the command and keeps the rest", () => {
  assert.deepEqual(parseFeedbackCommand("Feedback"), { rest: "" });
  assert.deepEqual(parseFeedbackCommand("  feedback  "), { rest: "" });
  assert.deepEqual(parseFeedbackCommand("/feedback"), { rest: "" });
  assert.deepEqual(parseFeedbackCommand("FEEDBACK: menu is slow"), { rest: "menu is slow" });
  assert.deepEqual(parseFeedbackCommand("feed back the app is great"), { rest: "the app is great" });
  assert.deepEqual(parseFeedbackCommand("فیڈبیک"), { rest: "" });
  assert.equal(parseFeedbackCommand("feedbacks"), null);
  assert.equal(parseFeedbackCommand("I have feedback"), null);
  assert.equal(parseFeedbackCommand(""), null);
});

test("Feedback → prompt, then the text is saved and thanked", async () => {
  const { chatId, session, user, bot } = await setup();
  await say(bot, chatId, "Feedback");
  assert.equal(session.state, "feedback");
  assert.match(bot.sent.at(-1).text, /screenshot/i);

  await say(bot, chatId, "The glucose chart is hard to read");
  assert.match(bot.sent.at(-1).text, /Thank you for your feedback! I will pass this on to my technical team/);
  assert.equal(session.state, "idle");

  const [fb] = await feedbackFor(user.id);
  assert.equal(fb.message, "The glucose chart is hard to read");
  assert.equal(fb.user_name, "Feedback Tester");
  assert.equal(fb.source, "telegram");
  assert.equal(fb.status, "new");
  assert.equal(fb.attachments.length, 0);
});

test("Feedback with text in the same message is saved in one go", async () => {
  const { chatId, user, bot } = await setup();
  await say(bot, chatId, "feedback: reminders came twice today");
  assert.match(bot.sent.at(-1).text, /Thank you for your feedback/);
  const [fb] = await feedbackFor(user.id);
  assert.equal(fb.message, "reminders came twice today");
});

test("a screenshot is stored as an attachment, not sent to Explain My Report", async () => {
  const { chatId, session, user, bot } = await setup();
  await say(bot, chatId, "Feedback");
  await say(bot, chatId, "this button does nothing", { __imageDataUrl: PNG });
  assert.match(bot.sent.at(-1).text, /Thank you for your feedback/);
  assert.notEqual(session.state, "lab");

  const [fb] = await feedbackFor(user.id);
  assert.equal(fb.message, "this button does nothing");
  assert.deepEqual(fb.attachments.map((a) => [a.kind, a.mime]), [["image", "image/png"]]);

  // A second screenshot straight after is added to the same feedback.
  assert.ok(wantsFeedbackMedia(session));
  await say(bot, chatId, "", { __imageDataUrl: PNG });
  assert.match(bot.sent.at(-1).text, /Added to your feedback/);
  const all = await feedbackFor(user.id);
  assert.equal(all.length, 1);
  assert.equal(all[0].attachments.length, 2);

  // Typing something else ends that window.
  session.state = "glucose";
  await say(bot, chatId, "hello");
  assert.equal(session.feedbackAppend, undefined);
  assert.equal(wantsFeedbackMedia(session), false);
});

test("a voice note is stored as an audio attachment", async () => {
  const { chatId, user, bot } = await setup();
  await say(bot, chatId, "Feedback");
  await say(bot, chatId, "", { __audioDataUrl: OGG });
  assert.match(bot.sent.at(-1).text, /Thank you for your feedback/);
  const [fb] = await feedbackFor(user.id);
  assert.equal(fb.message, "");
  assert.deepEqual(fb.attachments.map((a) => a.kind), ["audio"]);
});

test("an empty message re-asks; cancel saves nothing and goes back", async () => {
  const { chatId, session, user, bot } = await setup();
  await say(bot, chatId, "Feedback");
  await say(bot, chatId, "   ");
  assert.match(bot.sent.at(-1).text, /couldn't find anything to save/);
  assert.equal(session.state, "feedback");

  await say(bot, chatId, "cancel");
  assert.ok(bot.sent.some((m) => /no feedback sent/i.test(m.text)));
  assert.equal(session.state, "idle");
  assert.equal((await feedbackFor(user.id)).length, 0);
});

test("feedback given mid-flow puts the user back in that flow", async () => {
  const { chatId, session, bot } = await setup();
  session.state = "glucose";
  session.step = "value";
  session.data = { kind: "fasting" };
  await say(bot, chatId, "Feedback");
  await say(bot, chatId, "the sugar screen is confusing");
  assert.equal(session.state, "glucose");
  assert.equal(session.step, "value");
  assert.deepEqual(session.data, { kind: "fasting" });
});

test("a user who hasn't finished onboarding can still send feedback", async () => {
  const { chatId, session, user, bot } = await setup({ onboarded: false });
  session.state = "onboarding";
  session.step = "name";
  await say(bot, chatId, "Feedback the signup asks too many questions");
  assert.match(bot.sent.at(-1).text, /Thank you for your feedback/);
  assert.equal(session.state, "onboarding");
  assert.equal(session.step, "name");
  assert.equal((await feedbackFor(user.id)).length, 1);
});

test("tapping a button while asked for feedback leaves the feedback flow", async () => {
  const { chatId, session, bot } = await setup();
  await say(bot, chatId, "Feedback");
  assert.equal(session.state, "feedback");
  await handleCallback(bot, { id: "q", from: { id: chatId }, message: { chat: { id: chatId } }, data: "menu" });
  assert.notEqual(session.state, "feedback");
});
