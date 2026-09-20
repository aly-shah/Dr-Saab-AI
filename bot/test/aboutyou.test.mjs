// extractAboutYou(): gender / age / height / weight typed in one message,
// separated by spaces or commas. Numbers without a unit are reported, not
// guessed. Used by the Health Snapshot's missing-profile questions (My Health
// no longer has an "About You" question since 2026-09-19).
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
