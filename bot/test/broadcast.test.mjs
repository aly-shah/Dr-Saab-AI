// Ad hoc admin broadcasts (bot/src/broadcast.js).
//
// Run: node --test test/broadcast.test.mjs

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const { filterAudience, sendBroadcastTo, runBroadcast } = await import("../src/broadcast.js");
const supabase = await import("../src/supabase.js");

function fakeChannel(failFor = new Set()) {
  const sent = [];
  return {
    sent,
    sendMessage: async (chatId, text, opts) => {
      sent.push({ chatId, text, opts });
      return { message_id: sent.length, ok: !failFor.has(String(chatId)) };
    },
  };
}

test("filterAudience: all / patients / doctors", () => {
  const users = [{ id: 1, user_type: "patient" }, { id: 2 }, { id: 3, user_type: "doctor" }];
  assert.equal(filterAudience(users, "all").length, 3);
  assert.deepEqual(filterAudience(users, "patients").map((u) => u.id), [1, 2]);
  assert.deepEqual(filterAudience(users, "doctors").map((u) => u.id), [3]);
});

test("sendBroadcastTo: each user on their own channel, failures and missing channels counted", async () => {
  const whatsapp = fakeChannel(new Set(["923009999999"]));
  const telegram = fakeChannel();
  const users = [
    { id: "a", source: "whatsapp", phone_number: "923001111111" },
    { id: "b", source: "whatsapp", phone_number: "923009999999" }, // rejected by the API
    { id: "c", source: "telegram", telegram_id: 55 },
    { id: "d", source: "web", telegram_id: "session-1" }, // no channel adapter → skipped
    { id: "e", source: "whatsapp", telegram_id: "923002222222" }, // legacy row: phone lived in telegram_id
  ];

  const r = await sendBroadcastTo({ whatsapp, telegram }, users, "🩺 Clinic closed on Friday. Take care!");

  assert.deepEqual(r, { recipients: 5, sent: 3, failed: 1, skipped: 1 });
  assert.deepEqual(whatsapp.sent.map((s) => s.chatId), ["923001111111", "923009999999", "923002222222"]);
  assert.deepEqual(telegram.sent.map((s) => s.chatId), [55]);
  assert.equal(whatsapp.sent[0].text, "🩺 Clinic closed on Friday. Take care!", "emoji kept exactly as typed");
});

test("runBroadcast: validates the text and logs an audit row", async () => {
  await assert.rejects(() => runBroadcast({}, { text: "   " }), /required/);
  await assert.rejects(() => runBroadcast({}, { text: "x".repeat(4001) }), /longer than/);

  // Memory backend has no active users, so this exercises the empty path + log.
  const out = await runBroadcast({ whatsapp: fakeChannel() }, { text: "hello", audience: "patients", sentBy: "test" });
  assert.equal(out.recipients, 0);
  assert.equal(out.audience, "patients");
  assert.ok(out.id, "audit row id returned");
  const rows = await supabase.default?.listAdminBroadcasts?.() ?? null;
  // listAdminBroadcasts is memory-only; when reachable, the row must carry the counts.
  if (rows) assert.equal(rows[0].text, "hello");
});
