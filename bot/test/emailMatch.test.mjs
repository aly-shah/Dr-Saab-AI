// Onboarding "is this you?" — an email that already belongs to another account.
//
// Run:  cd bot && node --test test/emailMatch.test.mjs

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.D360_API_KEY = "";
process.env.WHATSAPP_TOKEN = "";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const supabase = await import("../src/supabase.js");
const { onboardingText, onboardingCallback } = await import("../src/flows/onboarding.js");
const { doctorOnboardingText, doctorOnboardingCallback } = await import("../src/flows/doctorOnboarding.js");
const { parseYesNo } = await import("../src/emailMatch.js");

function makeFakeBot() {
  const sent = [];
  return {
    sent,
    sendMessage: async (chatId, text, opts) => { sent.push({ chatId, text, opts }); return { message_id: sent.length }; },
    sendChatAction: async () => {},
    getFileLink: async () => null,
  };
}
const lastText = (bot) => bot.sent[bot.sent.length - 1]?.text || "";
const lastButtons = (bot) => (bot.sent[bot.sent.length - 1]?.opts?.reply_markup?.inline_keyboard || []).flat().map((b) => b.callback_data);
const rnd = () => Math.random().toString(36).slice(2);

// A brand-new chat identity parked on the email step of patient onboarding.
async function newcomerAtEmail(source = "telegram") {
  const tgId = source === "whatsapp" ? `92300${Math.floor(Math.random() * 1e6)}` : Math.floor(Math.random() * 1e9);
  const user = await supabase.getOrCreateUser(tgId, source);
  const session = { state: "onboarding", step: "email", data: { language: "en", name: "New Person" }, history: [], user, source };
  return { tgId, user, session };
}

test("parseYesNo understands English, Roman Urdu and Urdu", () => {
  assert.equal(parseYesNo("yes"), "yes");
  assert.equal(parseYesNo("Ji"), "yes");
  assert.equal(parseYesNo("haan"), "yes");
  assert.equal(parseYesNo("no"), "no");
  assert.equal(parseYesNo("nahi"), "no");
  assert.equal(parseYesNo("maybe"), null);
});

test("getUserByEmail finds patients by users.email and doctors by doctors.email, case-insensitively", async () => {
  const a = await supabase.getOrCreateUser(rnd(), "telegram");
  await supabase.updateUser(a.id, { email: "Ali@Example.com", onboarded: true });
  const found = await supabase.getUserByEmail("ali@example.com");
  assert.equal(found.id, a.id);
  assert.equal(await supabase.getUserByEmail("ali@example.com", a.id), null, "excludes the asking user");

  const d = await supabase.getOrCreateUser(rnd(), "telegram");
  await supabase.updateUser(d.id, { user_type: "doctor", onboarded: true, name: "Ayesha" });
  await supabase.createDoctor({ user_id: d.id, name: "Ayesha", email: "dr@clinic.com", referral_code: "DS#TEST" });
  assert.equal((await supabase.getUserByEmail("DR@clinic.com")).id, d.id);
  assert.equal(await supabase.getUserByEmail("nobody@example.com"), null);
});

test("a known email asks 'is this you?' instead of advancing", async () => {
  const existing = await supabase.getOrCreateUser(rnd(), "telegram");
  await supabase.updateUser(existing.id, { email: "yasir@example.com", name: "Yasir Abbasi", onboarded: true, tier: "consistency" });
  const { session } = await newcomerAtEmail();
  const bot = makeFakeBot();

  await onboardingText(bot, 1, session, "YASIR@example.com");
  assert.equal(session.step, "email_match");
  assert.match(lastText(bot), /already exists/);
  assert.match(lastText(bot), /Yasir\b/, "shows the first name as a hint");
  assert.deepEqual(lastButtons(bot), ["em:email_yes", "em:email_no"]);
});

test("Yes → this chat becomes the existing account (data restored, placeholder deleted)", async () => {
  const existing = await supabase.getOrCreateUser(rnd(), "telegram");
  await supabase.updateUser(existing.id, { email: "yasir2@example.com", name: "Yasir Abbasi", onboarded: true, latest_hba1c: 6.4, language: "ur" });
  await supabase.addGlucoseFull(existing.id, { value: 110, context: "fasting" });
  const { tgId, user: placeholder, session } = await newcomerAtEmail();
  const bot = makeFakeBot();

  await onboardingText(bot, 2, session, "yasir2@example.com");
  await onboardingCallback(bot, 2, session, "em:email_yes");

  assert.equal(session.user.id, existing.id, "session now runs the existing account");
  assert.equal(session.user.latest_hba1c, 6.4, "history came back");
  assert.equal(session.user.language, "en", "keeps the language chosen on this chat");
  assert.equal(session.state, "idle", "onboarding is over — the account was already onboarded");
  assert.equal((await supabase.getUserByTelegramId(tgId)).id, existing.id, "the chat identity now maps to the existing row");
  assert.equal(await supabase.getUserById(placeholder.id), null, "placeholder row removed");
  assert.equal((await supabase.recentGlucose(existing.id, 5)).length, 1);
  assert.ok(bot.sent.some((m) => /Welcome back, \*Yasir Abbasi\*/.test(m.text)));
  assert.ok(bot.sent[bot.sent.length - 1].opts?.reply_markup, "main menu shown");
});

test("Yes on a half-finished account continues onboarding on that account", async () => {
  const existing = await supabase.getOrCreateUser(rnd(), "telegram");
  await supabase.updateUser(existing.id, { email: "half@example.com", name: "Half Done", onboarded: false });
  const { session } = await newcomerAtEmail();
  const bot = makeFakeBot();

  await onboardingText(bot, 3, session, "half@example.com");
  await onboardingText(bot, 3, session, "haan"); // typed yes
  assert.equal(session.user.id, existing.id);
  assert.equal(session.state, "onboarding");
  assert.equal(session.step, "dob", "wizard resumes at date of birth");
});

test("No → asks for a different email and stays on the email step", async () => {
  const existing = await supabase.getOrCreateUser(rnd(), "telegram");
  await supabase.updateUser(existing.id, { email: "taken@example.com", onboarded: true });
  const { user: placeholder, session } = await newcomerAtEmail();
  const bot = makeFakeBot();

  await onboardingText(bot, 4, session, "taken@example.com");
  await onboardingCallback(bot, 4, session, "em:email_no");
  assert.equal(session.step, "email");
  assert.equal(session.data.email, null);
  assert.match(lastText(bot), /different email/);
  assert.equal(session.user.id, placeholder.id, "still the new account");

  await onboardingText(bot, 4, session, "fresh@example.com");
  assert.equal(session.step, "dob", "a free email advances normally");
  assert.equal(session.data.email, "fresh@example.com");
});

test("WhatsApp: the phone number moves onto the existing account", async () => {
  const existing = await supabase.getOrCreateUser(rnd(), "telegram");
  await supabase.updateUser(existing.id, { email: "wa@example.com", name: "Sana", onboarded: true });
  const { tgId: phone, session } = await newcomerAtEmail("whatsapp");
  const bot = makeFakeBot();
  await onboardingText(bot, 5, session, "wa@example.com");
  await onboardingCallback(bot, 5, session, "em:email_yes");
  const byPhone = await supabase.getUserByPhoneNumber(phone);
  assert.equal(byPhone.id, existing.id);
  assert.equal(byPhone.source, "whatsapp");
});

test("doctor onboarding: known email asks, Yes restores the doctor account", async () => {
  const docUser = await supabase.getOrCreateUser(rnd(), "telegram");
  await supabase.updateUser(docUser.id, { user_type: "doctor", name: "Ayesha Khan", onboarded: true });
  await supabase.createDoctor({ user_id: docUser.id, name: "Ayesha Khan", email: "ayesha@clinic.com", referral_code: "DS#AB12" });

  const placeholder = await supabase.getOrCreateUser(rnd(), "telegram");
  const session = { state: "doctor_onboarding", step: "email", data: { language: "en", name: "Ayesha Khan" }, history: [], user: placeholder };
  const bot = makeFakeBot();

  await doctorOnboardingText(bot, 6, session, "ayesha@clinic.com");
  assert.equal(session.step, "email_match");
  assert.deepEqual(lastButtons(bot), ["doc:email_yes", "doc:email_no"]);

  await doctorOnboardingCallback(bot, 6, session, "doc:email_yes");
  assert.equal(session.user.id, docUser.id);
  assert.equal(session.user.user_type, "doctor");
  assert.equal(session.state, "idle");
  assert.match(lastText(bot), /Doctor Menu/);
});
