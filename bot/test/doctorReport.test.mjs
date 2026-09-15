// Tests for the doctor-side PDF reports: Weekly Patient Snapshots and the
// single Patient Health Snapshot (Doctor menu → Patient Reports).
//
// Run:  cd bot && node --test test/doctorReport.test.mjs
//
// Memory backend, no AI (these reports are rule-based).

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
const { assembleDoctorReport, patientDisplayId, periodLabel, quickNotes } = await import("../src/doctorReportData.js");
const { renderDoctorWeeklyPdf, renderPatientSnapshotPdf } = await import("../src/doctorReportPdf.js");
const { showDoctorReports, showPatientPicker, sendWeeklySnapshots, sendPatientSnapshot } = await import("../src/flows/doctorReports.js");
const { doctorCallback } = await import("../src/flows/doctor.js");

const DAY = 86400000;

function makeFakeBot() {
  const sent = [], docs = [];
  return {
    sent, docs,
    sendMessage: async (chatId, text, opts) => { sent.push({ chatId, text, opts }); return { message_id: sent.length }; },
    sendDocument: async (chatId, buffer, opts, fileOpts) => { docs.push({ chatId, buffer, opts, fileOpts }); return { ok: true }; },
    sendChatAction: async () => {},
    answerCallbackQuery: async () => {},
    getFileLink: async () => null,
  };
}
const makeSession = (user) => ({ state: "idle", step: null, data: {}, history: [], user });
const lastText = (bot) => bot.sent[bot.sent.length - 1]?.text || "";
const buttons = (bot) => (bot.sent[bot.sent.length - 1]?.opts?.reply_markup?.inline_keyboard || []).flat();
const pageCount = (pdf) => (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;

async function seedDoctor() {
  const base = await supabase.getOrCreateUser(`doc-${Math.random().toString(36).slice(2)}`, "telegram");
  const user = await supabase.updateUser(base.id, { onboarded: true, language: "en", user_type: "doctor", name: "Ayesha Khan" });
  const doc = await supabase.createDoctor({ user_id: user.id, name: "Ayesha Khan", specialization: "Diabetologist", referral_code: `DS#${Math.random().toString(36).slice(2, 6).toUpperCase()}` });
  return { user, doc };
}

async function seedPatient(doctorId, name, { fasting = 110, random = 160, a1c = 6.4, days = 14 } = {}) {
  const base = await supabase.getOrCreateUser(`pt-${Math.random().toString(36).slice(2)}`, "telegram");
  const u = await supabase.updateUser(base.id, {
    onboarded: true, language: "en", name, age: 45, gender: "male", diabetes_status: "type2", height_cm: 175, weight_kg: 82,
    latest_hba1c: a1c, doctor_id: doctorId, doctor_link_status: "active", doctor_linked_date: new Date(Date.now() - 100 * DAY).toISOString(),
  });
  const now = Date.now();
  for (let d = days - 1; d >= 0; d--) {
    const at = new Date(now - d * DAY); at.setHours(7, 0, 0, 0);
    await supabase.addGlucoseFull(u.id, { value: fasting, context: "fasting", created_at: at.toISOString() });
    const at2 = new Date(now - d * DAY); at2.setHours(19, 0, 0, 0);
    await supabase.addGlucoseFull(u.id, { value: random, context: "random", created_at: at2.toISOString() });
  }
  await supabase.addMedication(u.id, "Metformin", "500mg");
  await supabase.addHealthLog(u.id, { steps: 5000 });
  await supabase.addHealthLog(u.id, { weight_kg: 82 });
  return u;
}

test("patientDisplayId is stable and looks like DS-#####", () => {
  const a = patientDisplayId("3f2a9c1e-1111-2222-3333-444444444444");
  assert.match(a, /^DS-\d{5}$/);
  assert.equal(a, patientDisplayId("3f2a9c1e-1111-2222-3333-444444444444"));
  assert.notEqual(a, patientDisplayId("u2"));
});

test("periodLabel collapses same-month ranges", () => {
  const end = new Date("2026-08-02T12:00:00+05:00").getTime();
  assert.equal(periodLabel(end - 6 * DAY, end), "27 Jul – 2 Aug 2026");
  const end2 = new Date("2026-09-15T12:00:00+05:00").getTime();
  assert.equal(periodLabel(end2 - 6 * DAY, end2), "9 – 15 Sep 2026");
});

test("quickNotes are factual counts", () => {
  const notes = quickNotes([{ week: { glucose: 1, medication: 0, activity: 0 } }], { good: 1, warn: 0, urgent: 0, none: 0 }, { reports: 0 });
  assert.equal(notes[0], "1 patient is doing well overall.");
  assert.match(notes[notes.length - 1], /next pages/);
});

test("assembleDoctorReport: statuses, ordering, totals, and both PDFs", async () => {
  const { user: docUser, doc } = await seedDoctor();
  await seedPatient(doc.id, "Good Patient", { fasting: 105, random: 150, a1c: 6.2 });
  await seedPatient(doc.id, "Urgent Patient", { fasting: 170, random: 260, a1c: 9.4 });
  await seedPatient(doc.id, "Watch Patient", { fasting: 118, random: 150, a1c: 7.8 });
  const patients = await supabase.doctorPatientStats(doc.id);
  assert.equal(patients.length, 3);

  const report = await assembleDoctorReport(docUser, doc, patients);
  assert.equal(report.doctor.name, "Dr. Ayesha Khan");
  assert.deepEqual(report.patients.map((p) => p.status.key), ["urgent", "warn", "good"], "worst first");
  assert.equal(report.totals.patients, 3);
  assert.equal(report.totals.glucose, 3 * 14, "7 days × 2 readings × 3 patients");
  assert.equal(report.totals.medicationActive, 3);
  assert.deepEqual(report.breakdown, { good: 1, warn: 1, urgent: 1, none: 0 });
  assert.equal(report.patients[0].week.fasting, 7);
  assert.match(report.patients[0].connectedOn, /\d{4}$/);

  const weekly = await renderDoctorWeeklyPdf(report);
  assert.equal(weekly.subarray(0, 5).toString(), "%PDF-");
  assert.equal(pageCount(weekly), 4, "1 summary page + 3 patient pages");

  const single = await renderPatientSnapshotPdf(report, 1);
  assert.equal(single.subarray(0, 5).toString(), "%PDF-");
  assert.equal(pageCount(single), 1);
});

test("Patient Reports screen offers the PDF actions and the picker lists patients", async () => {
  const { user: docUser, doc } = await seedDoctor();
  const p1 = await seedPatient(doc.id, "Ali Raza");
  await seedPatient(doc.id, "Zara Khan");
  const session = makeSession(docUser);
  const bot = makeFakeBot();

  await showDoctorReports(bot, 1, session);
  assert.match(lastText(bot), /Connected Patients:\* 2/);
  assert.deepEqual(buttons(bot).map((b) => b.callback_data), ["doc:snap_all", "doc:snap_pick", "doc:menu"]);

  await showPatientPicker(bot, 1, session);
  const picks = buttons(bot);
  assert.equal(picks.length, 3, "two patients + back");
  assert.equal(picks[0].text, "Ali Raza");
  assert.equal(picks[0].callback_data, `doc:snap_p:${p1.id}`);
  assert.equal(picks[2].callback_data, "doc:reports");
});

test("doctorCallback routes snap_all / snap_p and delivers PDFs", async () => {
  const { user: docUser, doc } = await seedDoctor();
  const p1 = await seedPatient(doc.id, "Ali Raza");
  const session = makeSession(docUser);
  const bot = makeFakeBot();

  await doctorCallback(bot, 2, session, "doc:snap_all");
  assert.equal(bot.docs.length, 1);
  assert.match(bot.docs[0].fileOpts.filename, /^DrSaab-Weekly-Patient-Snapshots-\d{4}-\d{2}-\d{2}\.pdf$/);
  assert.match(bot.docs[0].opts.caption, /1 connected patient/);
  assert.equal(pageCount(bot.docs[0].buffer), 2);

  await doctorCallback(bot, 2, session, `doc:snap_p:${p1.id}`);
  assert.equal(bot.docs.length, 2);
  assert.match(bot.docs[1].fileOpts.filename, /^DrSaab-Patient-Snapshot-Ali-Raza-/);
  assert.match(bot.docs[1].opts.caption, /Ali Raza \(DS-\d{5}\)/);

  await doctorCallback(bot, 2, session, "doc:snap_p:not-a-patient");
  assert.match(lastText(bot), /no longer connected/);
  assert.equal(bot.docs.length, 2);
});

test("a doctor with no patients gets the empty-state text, no PDF", async () => {
  const { user: docUser } = await seedDoctor();
  const session = makeSession(docUser);
  const bot = makeFakeBot();
  await sendWeeklySnapshots(bot, 3, session);
  assert.match(lastText(bot), /No patients are linked/);
  assert.equal(bot.docs.length, 0);
  await sendPatientSnapshot(bot, 3, session, "x");
  assert.match(lastText(bot), /no longer connected/);
});
