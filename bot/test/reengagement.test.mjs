// 24-hour re-engagement sequence — acceptance criteria from the Messaging
// System Developer Specification v1.0 (§14), run on the memory backend.
//
// Run: node --test test/reengagement.test.mjs

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const { ageBracketFor, ageOf, messageFor, renderMessage, MESSAGES } = await import("../src/reengagementMessages.js");
const { stageFor, runReengagementTick, noteInbound } = await import("../src/reengagement.js");
const { handleMessage } = await import("../src/bot.js");
const { getSession } = await import("../src/session.js");
const supabase = await import("../src/supabase.js");

const H = 3600 * 1000;
const T0 = Date.parse("2026-09-14T10:00:00Z"); // "Monday 10:00" in the spec example
const at = (hours) => new Date(T0 + hours * H);
const iso = (hours) => at(hours).toISOString();

function fakeChannel(failFor = new Set()) {
  const sent = [];
  return { sent, sendMessage: async (to, text) => { sent.push({ to, text }); return { message_id: 1, ok: !failFor.has(String(to)) }; } };
}

async function seedUser(over = {}) {
  const base = await supabase.getOrCreateUser(`92300${Math.floor(Math.random() * 1e7)}`, "whatsapp");
  return await supabase.updateUser(base.id, {
    onboarded: true, language: "en", tier: "free", name: "Ayesha Khan", age: 30,
    last_user_message_at: iso(0), ...over,
  });
}
const fresh = (u) => supabase.getUserById(u.id);

test("age brackets: DOB or age → A/B/C/D/E, unknown → C", () => {
  const now = new Date("2026-09-15T00:00:00Z");
  assert.equal(ageBracketFor({ age: 19 }, now), "A");
  assert.equal(ageBracketFor({ age: 25 }, now), "B");
  assert.equal(ageBracketFor({ age: 49 }, now), "C");
  assert.equal(ageBracketFor({ age: 65 }, now), "D");
  assert.equal(ageBracketFor({ age: 66 }, now), "E");
  assert.equal(ageBracketFor({}, now), "C");
  assert.equal(ageOf({ date_of_birth: "1980-03-10" }, now), 46);
  assert.equal(ageOf({ date_of_birth: "10/03/1958" }, now), 68);
  assert.equal(ageOf({ date_of_birth: "1999", age: 40 }, now), 27, "DOB wins over the age column");
  assert.equal(ageBracketFor({ date_of_birth: "10/03/1958" }, now), "E");
});

test("message library: 3 cycles × 2 types × 5 brackets, first name filled or gracefully dropped", () => {
  for (const c of [1, 2, 3]) for (const t of ["feature", "behaviour"]) for (const b of ["A", "B", "C", "D", "E"]) {
    assert.ok(MESSAGES[c][t][b].length > 40, `${c}/${t}/${b} present`);
  }
  assert.ok(messageFor({ cycle: 1, type: "feature", bracket: "B", firstName: "Ayesha" }).startsWith("Ayesha, keeping track"));
  assert.ok(messageFor({ cycle: 1, type: "feature", bracket: "B", firstName: "" }).startsWith("Keeping track"));
  assert.equal(renderMessage("You don't have to be perfect, {{first_name}}. Keep going.", ""), "You don't have to be perfect. Keep going.");
  assert.equal(renderMessage("Hey {{first_name}} 👋 Small habits add up.", ""), "Hey 👋 Small habits add up.");
  assert.ok(messageFor({ cycle: 2, type: "feature", bracket: "A" }).includes("Explain My Report"));
  assert.ok(messageFor({ cycle: 3, type: "behaviour", bracket: "E", firstName: "Bibi" }).startsWith("Bibi, looking after"));
});

test("stageFor: 12 h → feature, 23 h → behaviour, window closes at 24 h, markers are per episode", () => {
  const u = { last_user_message_at: iso(0), reengagement_cycle: 1 };
  assert.equal(stageFor(u, at(11.9).getTime()), null);
  assert.equal(stageFor(u, at(12).getTime()), "feature");
  assert.equal(stageFor({ ...u, reengagement_feature_sent_at: iso(12) }, at(15).getTime()), null, "feature already sent this episode");
  assert.equal(stageFor({ ...u, reengagement_feature_sent_at: iso(12) }, at(23).getTime()), "behaviour");
  assert.equal(stageFor({ ...u, reengagement_feature_sent_at: iso(12), reengagement_behaviour_sent_at: iso(23) }, at(23.5).getTime()), null);
  assert.equal(stageFor(u, at(24).getTime()), null, "WhatsApp window closed");
  // A marker from a PREVIOUS episode does not block the new one.
  assert.equal(stageFor({ ...u, reengagement_feature_sent_at: iso(-30) }, at(12).getTime()), "feature");
  assert.equal(stageFor({ ...u, reengagement_cycle: 4 }, at(12).getTime()), null, "sequence completed");
  assert.equal(stageFor({ ...u, reengagement_enabled: false }, at(12).getTime()), null, "opted out");
});

test("AC1/AC2/AC6: full cycle — feature at 12 h, behaviour at 23 h, cycle advances exactly once", async () => {
  const user = await seedUser({ age: 30 });
  const wa = fakeChannel();
  const bots = { whatsapp: wa };
  const mine = () => wa.sent.filter((s) => s.to === user.phone_number);

  await runReengagementTick(bots, at(11));
  assert.equal(mine().length, 0, "nothing before 12 h");
  await runReengagementTick(bots, at(12.25));
  assert.equal(mine().length, 1);
  assert.ok(mine()[0].text.startsWith("Ayesha, keeping track of your glucose"), mine()[0].text);
  await runReengagementTick(bots, at(12.5));
  assert.equal(mine().length, 1, "feature promo not repeated on the next tick");
  assert.equal((await fresh(user)).reengagement_cycle, 1, "12 h message does not advance the cycle");

  await runReengagementTick(bots, at(23.25));
  assert.equal(mine().length, 2);
  assert.ok(mine()[1].text.startsWith("Better health rarely comes"), mine()[1].text);
  assert.equal((await fresh(user)).reengagement_cycle, 2, "behaviour promo advances the cycle once");
  await runReengagementTick(bots, at(23.5));
  await runReengagementTick(bots, at(25));
  assert.equal(mine().length, 2, "nothing more this episode, nothing after the window");

  const log = await supabase.listReengagementLog(user.id);
  assert.deepEqual(log.map((r) => [r.message_type, r.cycle, r.age_bracket, r.delivery_status]),
    [["feature", 1, "B", "sent"], ["behaviour", 1, "B", "sent"]]);
  assert.equal(log[0].scheduled_at, iso(12));
});

test("AC3/AC4/AC5: a reply after the 12 h message cancels the 23 h message and keeps the cycle", async () => {
  const user = await seedUser({ age: 55 });
  const wa = fakeChannel();
  const bots = { whatsapp: wa };
  const mine = () => wa.sent.filter((s) => s.to === user.phone_number);
  await runReengagementTick(bots, at(12.25));
  assert.equal(mine().length, 1);
  assert.ok(mine()[0].text.includes("regularly recording your blood sugar"), "50-65 wording");

  await noteInbound(user.id, at(13)); // user writes back
  await runReengagementTick(bots, at(23.25));
  assert.equal(mine().length, 1, "23 h behaviour promo cancelled");
  const u = await fresh(user);
  assert.equal(u.reengagement_cycle, 1, "partial cycle does not advance");
  assert.equal(u.last_user_message_at, iso(13), "outbound sends never moved the timer; the reply did");

  // New episode from the reply: 12 h later the SAME cycle's feature goes again.
  await runReengagementTick(bots, at(13 + 12.25));
  assert.equal(mine().length, 2);
  assert.ok(mine()[1].text.includes("regularly recording your blood sugar"));
  const log = await supabase.listReengagementLog(user.id);
  assert.equal(log[0].user_replied_after_message, true, "reply within 60 min of the first prompt recorded for the KPI");
  assert.equal(log[0].replied_at, iso(13));
});

test("AC7: after three completed cycles the sequence stops for good", async () => {
  const user = await seedUser({ age: 70 });
  const wa = fakeChannel();
  const bots = { whatsapp: wa };
  const mine = () => wa.sent.filter((s) => s.to === user.phone_number);
  let start = 0;
  for (let cycle = 1; cycle <= 3; cycle++) {
    await runReengagementTick(bots, at(start + 12.1));
    await runReengagementTick(bots, at(start + 23.1));
    // user comes back the next day and goes quiet again
    start += 26;
    await noteInbound(user.id, at(start));
  }
  assert.equal(mine().length, 6, "six lifetime messages");
  const u = await fresh(user);
  assert.equal(u.reengagement_cycle, 4);
  assert.equal(u.reengagement_enabled, false);
  await runReengagementTick(bots, at(start + 12.1));
  await runReengagementTick(bots, at(start + 23.1));
  assert.equal(mine().length, 6, "no further prompts after cycle 3");
  assert.ok(mine()[4].text.includes("My Health Snapshot") && mine()[5].text.startsWith("Ayesha, looking after"), "cycle 3 texts in the 66+ wording");
});

test("opt-out and failed delivery: coaching toggle off → nothing; a failed behaviour send does not advance", async () => {
  const off = await seedUser({ pref_rem_coaching: false });
  const wa = fakeChannel();
  await runReengagementTick({ whatsapp: wa }, at(12.5));
  assert.equal(wa.sent.filter((s) => s.to === off.phone_number).length, 0);

  const user = await seedUser({ age: 40 });
  const failing = fakeChannel(new Set([user.phone_number]));
  const r = await runReengagementTick({ whatsapp: failing }, at(23.5));
  assert.ok(r.failed >= 1);
  const u = await fresh(user);
  assert.equal(u.reengagement_cycle, 1, "failed behaviour send does not consume the cycle");
  assert.ok(u.reengagement_behaviour_sent_at, "but it is not retried inside the same window");
  const log = await supabase.listReengagementLog(user.id);
  assert.equal(log[0].delivery_status, "failed");
});

test("Trigger A: a real inbound message through the bot updates the timer", async () => {
  const chatId = 7001;
  const base = await supabase.getOrCreateUser(String(chatId), "telegram");
  const user = await supabase.updateUser(base.id, { onboarded: true, language: "en", tier: "free", last_user_message_at: iso(0) });
  const session = getSession(chatId);
  session.user = user;
  session.userFetchedAt = Date.now();
  const bot = { sendMessage: async () => ({ message_id: 1 }), sendChatAction: async () => {}, answerCallbackQuery: async () => {} };
  const before = Date.now();
  await handleMessage(bot, { chat: { id: chatId }, from: { id: chatId }, text: "menu" });
  const after = await fresh(user);
  assert.ok(Date.parse(after.last_user_message_at) >= before, "timer moved to now");
});
