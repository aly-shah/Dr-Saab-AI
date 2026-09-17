// Tests for the weekly doctor report email (src/doctorWeeklyEmail.js).
//
// Run:  cd bot && node --test test/doctorWeeklyEmail.test.mjs
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
process.env.DOCTOR_WEEKLY_EMAIL_DAY = "0";
process.env.DOCTOR_WEEKLY_EMAIL_HOUR = "18";
process.env.DOCTOR_WEEKLY_EMAIL_ENABLED = "true";
process.env.REMINDER_TZ_OFFSET = "5";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const supabase = await import("../src/supabase.js");
const { weeklySlot, validEmail, buildDoctorEmail, emailDoctorWeeklyReport, runDoctorWeeklyEmailTick } =
  await import("../src/doctorWeeklyEmail.js");

const DAY = 86400000;
const rnd = () => Math.random().toString(36).slice(2, 8);

// Pakistan local time -> the UTC instant. 2026-09-20 is a Sunday.
const pkt = (iso) => new Date(iso + "+05:00");

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

async function seedDoctor({ email, name = "Ayesha Khan" } = {}) {
  const base = await supabase.getOrCreateUser(`doc-${rnd()}`, "telegram");
  const user = await supabase.updateUser(base.id, { onboarded: true, language: "en", user_type: "doctor", name });
  const doc = await supabase.createDoctor({ user_id: user.id, name, email, specialization: "Diabetologist", referral_code: `DS#${rnd().toUpperCase()}` });
  return { user, doc };
}

async function seedPatient(doctorId, name, { status = "active" } = {}) {
  const base = await supabase.getOrCreateUser(`pt-${rnd()}`, "telegram");
  const u = await supabase.updateUser(base.id, {
    onboarded: true, language: "en", name, age: 45, gender: "male", diabetes_status: "type2", tier: "free",
    latest_hba1c: 6.4, doctor_id: doctorId, doctor_link_status: status,
  });
  for (let d = 6; d >= 0; d--) {
    await supabase.addGlucoseFull(u.id, { value: 112, context: "fasting", created_at: new Date(Date.now() - d * DAY).toISOString() });
  }
  return u;
}

const rowsFor = async (doctorId) => (await supabase._doctorReportEmailRows()).filter((r) => r.doctor_id === doctorId);

test("weeklySlot: Sunday 18:00 PKT opens a 24 h window", () => {
  assert.deepEqual(weeklySlot(pkt("2026-09-20T17:59:00")), { weekKey: "2026-09-13", due: false }, "just before the slot");
  assert.deepEqual(weeklySlot(pkt("2026-09-20T18:00:00")), { weekKey: "2026-09-20", due: true }, "at the slot");
  assert.deepEqual(weeklySlot(pkt("2026-09-20T23:50:00")), { weekKey: "2026-09-20", due: true });
  assert.deepEqual(weeklySlot(pkt("2026-09-21T09:00:00")), { weekKey: "2026-09-20", due: true }, "catch-up next morning");
  assert.deepEqual(weeklySlot(pkt("2026-09-21T18:00:00")), { weekKey: "2026-09-20", due: false }, "grace over");
  assert.deepEqual(weeklySlot(pkt("2026-09-17T12:00:00")), { weekKey: "2026-09-13", due: false }, "mid-week");
  // Custom slot: Friday 20:00.
  assert.deepEqual(weeklySlot(pkt("2026-09-18T20:30:00"), { day: 5, hour: 20 }), { weekKey: "2026-09-18", due: true });
});

test("validEmail", () => {
  assert.ok(validEmail("dr.ayesha@clinic.pk"));
  assert.ok(validEmail("  a@b.co "));
  for (const bad of ["", null, "skip", "a@b", "a b@c.com", "@c.com"]) assert.ok(!validEmail(bad), String(bad));
});

test("doctor with patients gets the PDF on their email; body has no patient names", async () => {
  const { doc } = await seedDoctor({ email: "ayesha@clinic.pk" });
  await seedPatient(doc.id, "Bilal Ahmed");
  await seedPatient(doc.id, "Sana Tariq");
  const box = mailbox();
  const r = await emailDoctorWeeklyReport(doc, "2026-09-20", { sendMail: box.sendMail });
  assert.deepEqual(r, { status: "sent", patients: 2 });
  assert.equal(box.sent.length, 1);
  const m = box.sent[0];
  assert.equal(m.to, "ayesha@clinic.pk");
  assert.match(m.subject, /weekly patient report/i);
  assert.match(m.text, /Dr\. Ayesha Khan/);
  assert.match(m.text, /2 connected patients/);
  for (const part of [m.subject, m.text, m.html]) {
    assert.ok(!/Bilal|Sana/.test(part), "patient names stay inside the PDF");
  }
  assert.equal(m.attachments.length, 1);
  assert.match(m.attachments[0].filename, /^DrSaab-Weekly-Patient-Snapshots-Ayesha-Khan-\d{4}-\d{2}-\d{2}\.pdf$/);
  assert.equal(m.attachments[0].content.subarray(0, 5).toString(), "%PDF-");
  const rows = await rowsFor(doc.id);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].status, "sent");
  assert.equal(rows[0].patient_count, 2);
});

test("doctor with no patients (or only inactive links) gets nothing, and no log row", async () => {
  const { doc } = await seedDoctor({ email: "empty@clinic.pk" });
  await seedPatient(doc.id, "Pending Patient", { status: "pending" });
  const box = mailbox();
  const r = await emailDoctorWeeklyReport(doc, "2026-09-20", { sendMail: box.sendMail });
  assert.equal(r.status, "skipped");
  assert.equal(r.reason, "no connected patients");
  assert.equal(box.sent.length, 0);
  assert.equal((await rowsFor(doc.id)).length, 0, "a patient connecting later in the window still triggers a send");
});

test("doctor without a usable email is skipped", async () => {
  const { doc } = await seedDoctor({ email: "not-an-email" });
  await seedPatient(doc.id, "Some Patient");
  const box = mailbox();
  const r = await emailDoctorWeeklyReport(doc, "2026-09-20", { sendMail: box.sendMail });
  assert.deepEqual(r, { status: "skipped", reason: "invalid email" });
  assert.equal(box.sent.length, 0);
});

test("never twice in one week; again the next week", async () => {
  const { doc } = await seedDoctor({ email: "once@clinic.pk" });
  await seedPatient(doc.id, "Only Patient");
  const box = mailbox();
  assert.equal((await emailDoctorWeeklyReport(doc, "2026-09-20", { sendMail: box.sendMail })).status, "sent");
  const again = await emailDoctorWeeklyReport(doc, "2026-09-20", { sendMail: box.sendMail });
  assert.equal(again.status, "skipped");
  assert.equal(box.sent.length, 1);
  assert.equal((await emailDoctorWeeklyReport(doc, "2026-09-27", { sendMail: box.sendMail })).status, "sent");
  assert.equal(box.sent.length, 2);
});

test("a failed send is retried on later ticks, at most 3 attempts", async () => {
  const { doc } = await seedDoctor({ email: "flaky@clinic.pk" });
  await seedPatient(doc.id, "Only Patient");
  const box = mailbox({ failTimes: 1 });
  const first = await emailDoctorWeeklyReport(doc, "2026-09-20", { sendMail: box.sendMail });
  assert.equal(first.status, "failed");
  assert.equal((await rowsFor(doc.id))[0].status, "failed");
  const second = await emailDoctorWeeklyReport(doc, "2026-09-20", { sendMail: box.sendMail });
  assert.equal(second.status, "sent");
  assert.equal((await rowsFor(doc.id))[0].attempts, 2);

  const { doc: dead } = await seedDoctor({ email: "dead@clinic.pk" });
  await seedPatient(dead.id, "Only Patient");
  const down = mailbox({ failTimes: 99 });
  const statuses = [];
  for (let i = 0; i < 5; i++) statuses.push((await emailDoctorWeeklyReport(dead, "2026-09-20", { sendMail: down.sendMail })).status);
  assert.deepEqual(statuses, ["failed", "failed", "failed", "skipped", "skipped"]);
});

test("tick: only inside the window, only eligible doctors, idempotent", async () => {
  const { doc: a } = await seedDoctor({ email: "tick-a@clinic.pk", name: "Tick A" });
  await seedPatient(a.id, "P One");
  const { doc: b } = await seedDoctor({ email: "tick-b@clinic.pk", name: "Tick B" }); // no patients
  const { doc: c } = await seedDoctor({ email: null, name: "Tick C" }); // no email
  await seedPatient(c.id, "P Two");
  const box = mailbox();

  const early = await runDoctorWeeklyEmailTick({ now: pkt("2026-10-03T12:00:00"), sendMail: box.sendMail, enabled: true });
  assert.equal(early.ran, false);
  assert.equal(box.sent.length, 0);

  const off = await runDoctorWeeklyEmailTick({ now: pkt("2026-10-04T18:05:00"), sendMail: box.sendMail, enabled: false });
  assert.equal(off.ran, false, "email not configured -> nothing happens");

  const run = await runDoctorWeeklyEmailTick({ now: pkt("2026-10-04T18:05:00"), sendMail: box.sendMail, enabled: true });
  assert.equal(run.ran, true);
  assert.equal(run.weekKey, "2026-10-04");
  const to = box.sent.map((m) => m.to);
  assert.ok(to.includes("tick-a@clinic.pk"));
  assert.ok(!to.includes("tick-b@clinic.pk"));
  assert.equal((await rowsFor(b.id)).length, 0);
  assert.equal((await rowsFor(c.id)).length, 0);

  const before = box.sent.length;
  const rerun = await runDoctorWeeklyEmailTick({ now: pkt("2026-10-04T18:20:00"), sendMail: box.sendMail, enabled: true });
  assert.equal(rerun.sent, 0);
  assert.equal(box.sent.length, before, "second tick in the same window sends nothing");
});

test("buildDoctorEmail escapes the doctor name in HTML", () => {
  const { html } = buildDoctorEmail({
    doctor: { name: "Dr. <b>X</b>" }, period: { label: "14 – 20 Sep 2026" },
    patients: [{}], breakdown: { good: 1, warn: 0, urgent: 0, none: 0 },
  });
  assert.ok(html.includes("Dr. &lt;b&gt;X&lt;/b&gt;"));
  assert.ok(!html.includes("Needs attention"), "zero rows are left out");
});
