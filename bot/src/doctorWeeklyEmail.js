// Weekly doctor report email.
//
// At the end of every week (default Sunday 18:00 Pakistan time — see
// config.doctorWeeklyEmail) each doctor receives the Weekly Patient Snapshots
// PDF — the same document as Doctor menu → Patient Reports → Weekly Patient
// Snapshots — on the professional email they gave during doctor onboarding
// (doctors.email).
//
// Who gets one:
//   • doctors with at least one ACTIVE connected patient, and
//   • a valid email on file.
// A doctor with no connected patients gets nothing — no empty report.
//
// How it runs: a 15-minute timer calls runDoctorWeeklyEmailTick(). Nothing is
// queued; each tick works out the most recent send slot ("week key" = that
// slot's date) and emails every eligible doctor not yet covered for it. The
// doctor_report_emails row is claimed BEFORE sending, so a doctor can never be
// emailed twice for one week, even across restarts or two bot processes. If
// the bot was down at the slot, the send still happens for up to GRACE_HOURS
// afterwards; past that the week is skipped rather than sent stale.

import { config } from "./config.js";
import {
  listDoctorsWithEmail,
  doctorPatientStats,
  getUserById,
  claimDoctorReportEmail,
  finishDoctorReportEmail,
  saveGeneratedDocument,
} from "./supabase.js";
import { assembleDoctorReport } from "./doctorReportData.js";
import { renderDoctorWeeklyPdf } from "./doctorReportPdf.js";
import { dayKey } from "./snapshotData.js";
import { sendMail as smtpSend, mailEnabled } from "./mailer.js";
import { logError, logWarn, logOk } from "./log.js";

const TZ_OFFSET = parseInt(process.env.REMINDER_TZ_OFFSET || "5", 10); // PKT default
const HOUR_MS = 3600 * 1000;
export const GRACE_HOURS = 24;

const EMAIL_RE = /^[^ @]+@[^ @]+[.][^ @]+$/;
export const validEmail = (s) => EMAIL_RE.test(String(s || "").trim());

// The most recent weekly send slot at or before `now`.
//   weekKey  — the slot's local date, "2026-09-20"
//   due      — true while now is within GRACE_HOURS after the slot
export function weeklySlot(now = new Date(), { day = config.doctorWeeklyEmail.day, hour = config.doctorWeeklyEmail.hour } = {}) {
  const local = new Date(new Date(now).getTime() + TZ_OFFSET * HOUR_MS); // read with getUTC*
  const slot = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), hour, 0, 0));
  let back = (local.getUTCDay() - day + 7) % 7;
  if (back === 0 && local.getTime() < slot.getTime()) back = 7; // send day, before the hour
  slot.setUTCDate(slot.getUTCDate() - back);
  const age = local.getTime() - slot.getTime();
  return { weekKey: slot.toISOString().slice(0, 10), due: age >= 0 && age < GRACE_HOURS * HOUR_MS };
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const safeName = (s) => String(s || "doctor").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "doctor";

// The email carries counts only — patient names and readings stay inside the
// attached PDF, never in the message body or subject.
export function buildDoctorEmail(report) {
  const b = report.breakdown;
  const n = report.patients.length;
  const patientsWord = n === 1 ? "patient" : "patients";
  const rows = [
    ["Doing well", b.good],
    ["Needs attention", b.warn],
    ["Urgent attention", b.urgent],
    ["No recent readings", b.none],
  ].filter(([, v]) => v > 0);
  const subject = `DrSaab weekly patient report — ${report.period.label}`;
  const text = [
    `Dear ${report.doctor.name},`,
    "",
    `Your DrSaab weekly patient report for ${report.period.label} is attached. It covers ${n} connected ${patientsWord}.`,
    "",
    ...rows.map(([k, v]) => `  ${k}: ${v}`),
    "",
    "The PDF opens with a summary of all your patients, followed by one Patient Health Snapshot page per patient.",
    "",
    "This report contains confidential patient health information and is intended only for the treating doctor. " +
      "You are receiving it because patients connected to you on DrSaab using your referral code.",
    "",
    "DrSaab AI",
  ].join("\n");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#1f2937;max-width:560px">
<p>Dear ${esc(report.doctor.name)},</p>
<p>Your DrSaab weekly patient report for <strong>${esc(report.period.label)}</strong> is attached. It covers <strong>${n}</strong> connected ${patientsWord}.</p>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:12px 0">
${rows.map(([k, v]) => `<tr><td style="padding:4px 24px 4px 0;color:#4b5563">${esc(k)}</td><td style="padding:4px 0;font-weight:bold">${v}</td></tr>`).join("\n")}
</table>
<p>The PDF opens with a summary of all your patients, followed by one Patient Health Snapshot page per patient.</p>
<p style="font-size:12px;color:#6b7280">This report contains confidential patient health information and is intended only for the treating doctor. You are receiving it because patients connected to you on DrSaab using your referral code.</p>
<p>DrSaab AI</p>
</div>`;
  return { subject, text, html };
}

// Build + email one doctor's weekly report. Returns
//   { status: "sent" | "skipped" | "failed", reason?, patients? }
// `force` bypasses the once-per-week claim (manual test sends).
export async function emailDoctorWeeklyReport(doc, weekKey, { sendMail = smtpSend, force = false, now = Date.now() } = {}) {
  const email = String(doc.email || "").trim();
  if (!validEmail(email)) return { status: "skipped", reason: "invalid email" };

  const patients = await doctorPatientStats(doc.id);
  if (!patients.length) return { status: "skipped", reason: "no connected patients" };

  if (!force && !(await claimDoctorReportEmail(doc.id, weekKey, email))) {
    return { status: "skipped", reason: "already handled this week" };
  }

  try {
    const doctorUser = doc.user_id ? await getUserById(doc.user_id).catch(() => null) : null;
    const report = await assembleDoctorReport(doctorUser || { name: doc.name }, doc, patients, now);
    const pdf = await renderDoctorWeeklyPdf(report);
    const filename = `DrSaab-Weekly-Patient-Snapshots-${safeName(doc.name)}-${dayKey(report.generatedAt)}.pdf`;
    await sendMail({
      to: email,
      ...buildDoctorEmail(report),
      attachments: [{ filename, content: pdf, contentType: "application/pdf" }],
    });
    // The email is out: a failure to record that must NOT fall into the catch
    // below, which would mark the week 'failed' and send a second copy.
    if (!force) {
      await finishDoctorReportEmail(doc.id, weekKey, { status: "sent", patient_count: report.patients.length, error: null })
        .catch((e) => logError("Doctor weekly email", "sent, but could not record it: " + (e?.message || e)));
    }
    // Same record the chat flow keeps, so the admin panel lists the document.
    if (doc.user_id) {
      saveGeneratedDocument(doc.user_id, "doctor_weekly", `data:application/pdf;base64,${pdf.toString("base64")}`,
        `Weekly Patient Snapshots emailed to ${email} — ${report.patients.length} patients (${report.period.label})`).catch(() => {});
    }
    return { status: "sent", patients: report.patients.length };
  } catch (e) {
    const reason = String(e?.message || e).slice(0, 500);
    logError("Doctor weekly email", `${doc.name || doc.id} <${email}>: ${reason}`);
    if (!force) {
      await finishDoctorReportEmail(doc.id, weekKey, { status: "failed", patient_count: patients.length, error: reason }).catch(() => {});
    }
    return { status: "failed", reason };
  }
}

let running = false;

// One scheduler pass. Safe to call every 15 minutes: outside the send window
// it returns at once, inside it each doctor is handled at most once per week
// (failed sends are retried on later ticks, 3 attempts in total).
export async function runDoctorWeeklyEmailTick({ now = new Date(), sendMail, enabled = mailEnabled() } = {}) {
  if (!config.doctorWeeklyEmail.enabled || !enabled) return { ran: false, reason: "disabled" };
  const { weekKey, due } = weeklySlot(now);
  if (!due) return { ran: false, reason: "not due", weekKey };
  if (running) return { ran: false, reason: "already running", weekKey };
  running = true;
  const tally = { ran: true, weekKey, sent: 0, failed: 0, skipped: 0 };
  try {
    const doctors = await listDoctorsWithEmail();
    for (const doc of doctors) {
      let r;
      try {
        r = await emailDoctorWeeklyReport(doc, weekKey, { sendMail, now: new Date(now).getTime() });
      } catch (e) {
        // Claim/lookup failed (database trouble) — leave it for the next tick.
        logError("Doctor weekly email", `${doc.name || doc.id}: ${e?.message || e}`);
        r = { status: "failed" };
      }
      tally[r.status] += 1;
    }
    if (tally.sent || tally.failed) {
      logOk(`Doctor weekly email (${weekKey}): ${tally.sent} sent, ${tally.failed} failed, ${tally.skipped} skipped.`);
    }
  } finally {
    running = false;
  }
  return tally;
}

// Independent of the chat scheduler: email needs no WhatsApp/Telegram channel.
export function startDoctorWeeklyEmail() {
  const c = config.doctorWeeklyEmail;
  if (!c.enabled) return console.log("   Doctor weekly email off (DOCTOR_WEEKLY_EMAIL_ENABLED=false).");
  if (!mailEnabled()) {
    return logWarn("Doctor weekly email", "off — set SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_FROM in bot/.env to enable it.");
  }
  const tick = () => runDoctorWeeklyEmailTick().catch((e) => logError("Doctor weekly email", e?.message || String(e)));
  setInterval(tick, 15 * 60 * 1000);
  setTimeout(tick, 60 * 1000); // and shortly after boot, to catch a missed slot
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  console.log(`   Doctor weekly email on (${DAYS[c.day] || "Sunday"} ${c.hour}:00 PKT).`);
}
