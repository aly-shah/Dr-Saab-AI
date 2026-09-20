// Doctor free plan: 10 patients in the weekly report (src/doctorCap.js).
//
// Run:  cd bot && node --test test/doctorCap.test.mjs
//
// Memory backend, no SMTP — sendMail is injected.

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.D360_API_KEY = "";
process.env.WHATSAPP_TOKEN = "";
process.env.SMTP_HOST = "";
process.env.DOCTOR_UPGRADE_CONTACT = "";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const supabase = await import("../src/supabase.js");
const { splitReportablePatients, reportablePatients, notifyDoctorIfOverCap, isDoctorPremium, buildCapEmail } =
  await import("../src/doctorCap.js");
const { emailDoctorWeeklyReport } = await import("../src/doctorWeeklyEmail.js");
const { myDoctorCallback } = await import("../src/flows/doctor.js");
const { showDoctorReports } = await import("../src/flows/doctorReports.js");
const { getSession } = await import("../src/session.js");

const DAY = 86400000;
const rnd = () => Math.random().toString(36).slice(2, 8);
const CONTACT = "yasir@drsaabcoach.com";

function mailbox({ failTimes = 0 } = {}) {
  const sent = [];
  let failures = failTimes;
  const sendMail = async (msg) => {
    if (failures > 0) { failures -= 1; throw new Error("smtp down"); }
    sent.push(msg);
    return { accepted: [msg.to] };
  };
  return { sent, sendMail };
}

function fakeBot() {
  const sent = [];
  return {
    sent,
    sendMessage: async (chatId, text, opts) => { sent.push({ chatId, text, opts }); return { message_id: sent.length }; },
    sendChatAction: async () => {},
    answerCallbackQuery: async () => {},
  };
}

async function seedDoctor({ email = `dr-${rnd()}@clinic.pk`, name = "Ayesha Khan" } = {}) {
  const base = await supabase.getOrCreateUser(`doc-${rnd()}`, "telegram");
  const user = await supabase.updateUser(base.id, { onboarded: true, language: "en", user_type: "doctor", name });
  const doc = await supabase.createDoctor({ user_id: user.id, name, email, specialization: "Diabetologist", referral_code: `DS#${rnd().toUpperCase()}` });
  return { user, doc };
}

// Patient #i linked i days after a fixed start, so link order is known.
const START = Date.now() - 60 * DAY;
async function seedPatient(doctorId, i, { glucose = false } = {}) {
  const base = await supabase.getOrCreateUser(`pt-${rnd()}`, "telegram");
  const u = await supabase.updateUser(base.id, {
    onboarded: true, language: "en", name: `Patient ${String(i).padStart(2, "0")}`, age: 45, gender: "male",
    diabetes_status: "type2", tier: "free", latest_hba1c: 6.4,
    doctor_id: doctorId, doctor_link_status: "active", doctor_linked_date: new Date(START + i * DAY).toISOString(),
  });
  if (glucose) await supabase.addGlucoseFull(u.id, { value: 112, context: "fasting", created_at: new Date().toISOString() });
  return u;
}

async function seedPatients(doctorId, n, opts) {
  const out = [];
  // Seed newest-first so the split can't be relying on insertion order.
  for (let i = n; i >= 1; i--) out.unshift(await seedPatient(doctorId, i, opts));
  return out;
}

test("splitReportablePatients keeps the first 10 who linked; DrPremium keeps everyone", () => {
  const ps = Array.from({ length: 13 }, (_, i) => ({ id: `p${i}`, doctor_linked_date: new Date(START + (13 - i) * DAY) }));
  const free = splitReportablePatients(ps, false);
  assert.equal(free.included.length, 10);
  assert.equal(free.held.length, 3);
  assert.deepEqual(free.held.map((p) => p.id), ["p2", "p1", "p0"], "the three most recent links are held back");
  const prem = splitReportablePatients(ps, true);
  assert.equal(prem.included.length, 13);
  assert.equal(prem.held.length, 0);
});

test("isDoctorPremium: admin DrPremium flag or active paid Doctor Pro", () => {
  assert.equal(isDoctorPremium({ user_type: "doctor" }, { dr_premium: false }), false);
  assert.equal(isDoctorPremium(null, { dr_premium: true }), true, "code-only doctor switched on in admin");
  const pro = { user_type: "doctor", sub_status: "active", sub_plan_code: "doctor_pro_1m", sub_expires_at: new Date(Date.now() + DAY).toISOString() };
  assert.equal(isDoctorPremium(pro, { dr_premium: false }), true);
  assert.equal(isDoctorPremium({ ...pro, sub_expires_at: new Date(Date.now() - DAY).toISOString() }, {}), false, "expired Doctor Pro");
});

test("the 11th patient triggers one free-limit email naming the upgrade contact", async () => {
  const { doc } = await seedDoctor();
  await seedPatients(doc.id, 10);
  const box = mailbox();

  assert.equal((await notifyDoctorIfOverCap(doc, "P10", { sendMail: box.sendMail })).status, "under", "10 is still within the limit");
  assert.equal(box.sent.length, 0);

  await seedPatient(doc.id, 11);
  const r = await notifyDoctorIfOverCap(doc, "Patient 11", { sendMail: box.sendMail });
  assert.deepEqual(r, { status: "sent", count: 11 });
  assert.equal(box.sent.length, 1);
  const m = box.sent[0];
  assert.equal(m.to, doc.email);
  assert.match(m.subject, /free limit of 10 patients/);
  assert.match(m.text, /Dear Dr\. Ayesha Khan/);
  assert.ok(m.text.includes(CONTACT) && m.html.includes(CONTACT), "contact address in both parts");
  assert.match(m.text, /still linked to you and their health data is saved/);
  assert.match(m.text, /DrPremium/);

  await seedPatient(doc.id, 12);
  assert.equal((await notifyDoctorIfOverCap(doc, "Patient 12", { sendMail: box.sendMail })).status, "already");
  assert.equal(box.sent.length, 1, "sent once only");
});

test("a failed send is retried on the next link; DrPremium doctors are never emailed", async () => {
  const { doc } = await seedDoctor();
  await seedPatients(doc.id, 11);
  const down = mailbox({ failTimes: 1 });
  assert.equal((await notifyDoctorIfOverCap(doc, "x", { sendMail: down.sendMail })).status, "failed");
  await seedPatient(doc.id, 12);
  assert.equal((await notifyDoctorIfOverCap(doc, "y", { sendMail: down.sendMail })).status, "sent");
  assert.equal(down.sent.length, 1);

  const { doc: prem } = await seedDoctor();
  await supabase.updateDoctor(prem.id, { dr_premium: true });
  await seedPatients(prem.id, 11);
  const box = mailbox();
  const premRow = await supabase.getDoctorById(prem.id);
  assert.equal((await notifyDoctorIfOverCap(premRow, "z", { sendMail: box.sendMail })).status, "premium");
  assert.equal(box.sent.length, 0);
});

test("a patient is never refused: the 11th link is saved like any other", async () => {
  const { doc } = await seedDoctor();
  await seedPatients(doc.id, 10);
  const base = await supabase.getOrCreateUser(`pt-${rnd()}`, "telegram");
  const patient = await supabase.updateUser(base.id, { onboarded: true, language: "en", name: "Eleventh", tier: "free" });

  const chatId = 8800 + Math.floor(Math.random() * 1000);
  const session = getSession(chatId);
  session.user = patient;
  session.userFetchedAt = Date.now();
  session.state = "my_doctor";
  session.data = { pendingDoctor: doc };
  const bot = fakeBot();
  await myDoctorCallback(bot, chatId, session, "mydoc:confirm");

  const saved = await supabase.getUserById(patient.id);
  assert.equal(saved.doctor_id, doc.id);
  assert.equal(saved.doctor_link_status, "active");
  assert.ok(saved.doctor_linked_date, "link date recorded");
  assert.ok(!bot.sent.some((m) => /isn't accepting new patients/.test(m.text)), "no refusal message");
  assert.equal((await supabase.doctorPatientStats(doc.id)).length, 11);
});

test("weekly email: free doctor gets their first 10 patients plus a note; DrPremium gets all", async () => {
  const { doc } = await seedDoctor();
  const patients = await seedPatients(doc.id, 12, { glucose: true });
  const box = mailbox();
  const r = await emailDoctorWeeklyReport(doc, "2026-09-20", { sendMail: box.sendMail, force: true });
  assert.deepEqual(r, { status: "sent", patients: 10 });
  const m = box.sent[0];
  assert.match(m.text, /covers 10 connected patients/);
  assert.match(m.text, /2 more connected patients are not included/);
  assert.ok(m.text.includes(CONTACT) && m.html.includes(CONTACT));

  const { included, held } = await reportablePatients(doc);
  assert.deepEqual(held.map((p) => p.id).sort(), [patients[10].id, patients[11].id].sort(), "the two latest links are the ones held");
  assert.equal(included.length, 10);

  await supabase.updateDoctor(doc.id, { dr_premium: true });
  const premRow = await supabase.getDoctorById(doc.id);
  const box2 = mailbox();
  const r2 = await emailDoctorWeeklyReport(premRow, "2026-09-20", { sendMail: box2.sendMail, force: true });
  assert.deepEqual(r2, { status: "sent", patients: 12 });
  assert.doesNotMatch(box2.sent[0].text, /not included/);
});

test("in the bot, a free doctor's Patient Reports lists 10 and says how many are held back", async () => {
  const { user, doc } = await seedDoctor();
  await seedPatients(doc.id, 13);
  const chatId = 9900 + Math.floor(Math.random() * 90);
  const session = getSession(chatId);
  session.user = user;
  session.userFetchedAt = Date.now();
  const bot = fakeBot();
  await showDoctorReports(bot, chatId, session);
  const text = bot.sent.at(-1).text;
  assert.match(text, /Connected Patients:\* 10/);
  assert.match(text, /\*3 more\* connected patient/);
  assert.ok(text.includes(CONTACT));
  assert.ok(!text.includes("Patient 13"), "the newest link is not listed");
  assert.ok(text.includes("Patient 01"), "the first link is listed");
});

test("buildCapEmail escapes the doctor's name in the HTML part", () => {
  const { html } = buildCapEmail({ name: "<b>Evil</b>" }, null, 11);
  assert.ok(!html.includes("<b>Evil</b>"));
  assert.ok(html.includes("&lt;b&gt;Evil&lt;/b&gt;"));
});
