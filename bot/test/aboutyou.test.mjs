// ❤️ My Health → Q1 "About You": gender / age / height / weight typed in one
// message, separated by spaces or commas. Numbers without a unit are not
// guessed — the bot explicitly asks the user to add the unit (kg, cm, years).
//
// Run: node --test test/aboutyou.test.mjs

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.REMINDER_TZ_OFFSET = "5";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const { extractAboutYou } = await import("../src/openai.js");
const { myHealthText } = await import("../src/flows/myhealth.js");
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
const lastText = (bot) => bot.sent[bot.sent.length - 1]?.text || "";
const allText = (bot) => bot.sent.map((s) => s.text).join("\n");

async function seedQ1User(overrides = {}) {
  const base = await supabase.getOrCreateUser(`tg-about-${Math.random().toString(36).slice(2)}`, "telegram");
  const user = await supabase.updateUser(base.id, {
    onboarded: true,
    language: "en",
    tier: "free",
    health_profile_status: "in_progress",
    health_setup_step: 1,
    gender: null,
    age: null,
    height_cm: null,
    weight_kg: null,
    ...overrides,
  });
  const session = { state: "myhealth", step: "q1", data: {}, history: [], user };
  return { user, session };
}
const persisted = (user) => supabase.getOrCreateUser(user.telegram_id, "telegram");

test("extractAboutYou: units and labels are recognised, bare numbers are reported", () => {
  const a = extractAboutYou("male, 42, 174cm, 78kg");
  assert.equal(a.gender, "male");
  assert.equal(a.age, 42);
  assert.equal(a.height_cm, 174);
  assert.equal(a.weight_kg, 78);
  assert.deepEqual(a.unitless, [42]);
  assert.equal(a.ageFromBare, true);

  const b = extractAboutYou("78 170 male");
  assert.equal(b.gender, "male");
  assert.equal(b.height_cm, undefined);
  assert.equal(b.weight_kg, undefined);
  assert.deepEqual(b.unitless, [78, 170]);

  const c = extractAboutYou("female 62 kg, 1.68 m, 32 years");
  assert.equal(c.gender, "female", "'m' after a number is metres, not male");
  assert.equal(c.weight_kg, 62);
  assert.equal(c.height_cm, 168);
  assert.equal(c.age, 32);
  assert.deepEqual(c.unitless, []);

  const d = extractAboutYou("weight 80, height 175, age 50");
  assert.equal(d.weight_kg, 80);
  assert.equal(d.height_cm, 175);
  assert.equal(d.age, 50);
  assert.deepEqual(d.unitless, []);

  assert.deepEqual(extractAboutYou("5 ft 8 in, 70 kg").unitless, []);
});

test("Q1: numbers without units → gender is kept, the bot asks for units, then everything saves", async () => {
  const { user, session } = await seedQ1User();
  const bot = makeFakeBot();

  await myHealthText(bot, 4001, session, "78 170 male");

  let row = await persisted(user);
  assert.equal(row.gender, "male", "the unambiguous part is saved");
  assert.equal(row.weight_kg, null, "78 must not be guessed as weight");
  assert.equal(row.height_cm, null);
  assert.equal(row.age, null, "78 must not be guessed as age");
  assert.ok(lastText(bot).includes("78, 170") && lastText(bot).includes("add the unit"), lastText(bot));
  assert.equal(session.step, "q1", "still on About You");

  await myHealthText(bot, 4001, session, "78 kg, 170 cm, 42 years");
  row = await persisted(user);
  assert.equal(row.weight_kg, 78);
  assert.equal(row.height_cm, 170);
  assert.equal(row.age, 42);
  assert.equal(session.step, "q2", "advanced to the next question");
});

test("Q1: comma-separated with units saves everything in one go", async () => {
  const { user, session } = await seedQ1User();
  const bot = makeFakeBot();
  await myHealthText(bot, 4002, session, "female, 32 years, 168 cm, 62 kg");
  const row = await persisted(user);
  assert.deepEqual([row.gender, row.age, row.height_cm, row.weight_kg], ["female", 32, 168, 62]);
  assert.equal(session.step, "q2");
});

test("Q1: a lone bare number is accepted as the age only when height and weight are already known", async () => {
  const { user, session } = await seedQ1User({ gender: "male", height_cm: 175, weight_kg: 80 });
  const bot = makeFakeBot();
  await myHealthText(bot, 4003, session, "42");
  assert.equal((await persisted(user)).age, 42);
  assert.equal(session.step, "q2");
});

test("Q1: a bare number while everything is known asks for units instead of overwriting the age", async () => {
  const { user, session } = await seedQ1User({ gender: "male", age: 42, height_cm: 175, weight_kg: 80 });
  const bot = makeFakeBot();
  await myHealthText(bot, 4004, session, "76");
  const row = await persisted(user);
  assert.equal(row.age, 42);
  assert.equal(row.weight_kg, 80);
  assert.ok(allText(bot).includes("add the unit"), allText(bot));
  assert.equal(session.step, "q1");

  await myHealthText(bot, 4004, session, "76 kg");
  assert.equal((await persisted(user)).weight_kg, 76);
});
