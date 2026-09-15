// User Status: Idle / Low / Medium / High from active days in the last 30.
//
// Run: node --test test/userStatus.test.mjs

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.REMINDER_TZ_OFFSET = "5";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const { statusForActiveDays, computeUserStatus, refreshActivityStatuses } = await import("../src/userStatus.js");
const { handleMessage, handleCallback } = await import("../src/bot.js");
const { getSession } = await import("../src/session.js");
const supabase = await import("../src/supabase.js");

const DAY = 86400000;
const dayKeyAgo = (n) => supabase.activityDayKey(new Date(Date.now() - n * DAY));

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

async function seedUser() {
  const base = await supabase.getOrCreateUser(`tg-status-${Math.random().toString(36).slice(2)}`, "telegram");
  return await supabase.updateUser(base.id, { onboarded: true, language: "en", tier: "free" });
}

test("thresholds: 0 → Idle, 1 → Low, 2–3 → Medium, 4+ → High", () => {
  assert.equal(statusForActiveDays(0), "idle");
  assert.equal(statusForActiveDays(1), "low");
  assert.equal(statusForActiveDays(2), "medium");
  assert.equal(statusForActiveDays(3), "medium");
  assert.equal(statusForActiveDays(4), "high");
  assert.equal(statusForActiveDays(20), "high");
});

test("active days count distinct days inside the 30-day window only", async () => {
  const user = await seedUser();
  assert.deepEqual(await computeUserStatus(user.id), { status: "idle", activeDays: 0 });

  await supabase.recordActivityDay(user.id, dayKeyAgo(2));
  await supabase.recordActivityDay(user.id, dayKeyAgo(2)); // same day twice — still one day
  await supabase.recordActivityDay(user.id, dayKeyAgo(45)); // outside the window
  assert.deepEqual(await computeUserStatus(user.id), { status: "low", activeDays: 1 });

  await supabase.recordActivityDay(user.id, dayKeyAgo(10));
  await supabase.recordActivityDay(user.id, dayKeyAgo(29)); // edge: 30th day still counts
  assert.equal((await computeUserStatus(user.id)).status, "medium");

  await supabase.recordActivityDay(user.id, dayKeyAgo(0));
  assert.deepEqual(await computeUserStatus(user.id), { status: "high", activeDays: 4 });
});

test("a typed message and a button tap both mark today as an active day", async () => {
  const chatId = 5001;
  const user = await seedUser();
  const session = getSession(chatId);
  session.user = user;
  session.userFetchedAt = Date.now();
  const bot = makeFakeBot();

  await handleMessage(bot, { chat: { id: chatId }, from: { id: chatId }, text: "menu" });
  assert.equal((await computeUserStatus(user.id)).activeDays, 1);

  const user2 = await seedUser();
  const chat2 = 5002;
  const s2 = getSession(chat2);
  s2.user = user2;
  s2.userFetchedAt = Date.now();
  await handleCallback(bot, { id: "q", from: { id: chat2 }, message: { chat: { id: chat2 } }, data: "menu" });
  assert.equal((await computeUserStatus(user2.id)).activeDays, 1);
});

test("refreshActivityStatuses mirrors the status onto the user row", async () => {
  const a = await seedUser();
  const b = await seedUser();
  for (const n of [1, 3, 5, 9]) await supabase.recordActivityDay(b.id, dayKeyAgo(n));

  const changed = await refreshActivityStatuses([a, b]);
  assert.equal(changed, 2);
  assert.equal((await supabase.getUserById(a.id)).activity_status, "idle");
  assert.equal((await supabase.getUserById(b.id)).activity_status, "high");

  // Unchanged rows are not rewritten.
  const fresh = [await supabase.getUserById(a.id), await supabase.getUserById(b.id)];
  assert.equal(await refreshActivityStatuses(fresh), 0);
});
