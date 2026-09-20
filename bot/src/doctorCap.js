// Doctor free plan — 10-patient limit on the weekly Doctor Summary Report
// (2026-09-19 spec).
//
//   • Patients are NEVER blocked from adding a doctor. Every link is saved and
//     their data is stored as usual.
//   • A doctor on the free plan gets their FIRST 10 linked patients (oldest
//     link first) in the weekly summary — the Sunday email and the in-bot
//     Weekly Patient Snapshots. Anyone past 10 is held back until the doctor
//     upgrades to DrPremium.
//   • DrPremium = the admin switched it on by hand (doctors.dr_premium), or the
//     doctor has an active paid Doctor Pro plan (isDoctorPro).
//   • When the 11th patient links, the doctor is emailed once (and told in the
//     bot) that they've reached the free limit and who to contact to upgrade.

import { config } from "./config.js";
import { isDoctorPro, DOCTOR_FREE_PATIENT_CAP, notifyDoctorCapReached } from "./flows/subscription.js";
import { doctorPatientStats, getUserById, claimDoctorCapEmail, releaseDoctorCapEmail } from "./supabase.js";
import { sendMail as smtpSend, mailEnabled } from "./mailer.js";
import { logError, logWarn, logOk } from "./log.js";

export { DOCTOR_FREE_PATIENT_CAP };

const EMAIL_RE = /^[^ @]+@[^ @]+[.][^ @]+$/;

export function isDoctorPremium(doctorUser, doctorRow) {
  return !!doctorRow?.dr_premium || isDoctorPro(doctorUser);
}

const linkedAt = (p) => new Date(p.doctor_linked_date || p.created_at || 0).getTime() || 0;

// Oldest link first, so the doctor's first 10 patients are the ones that stay
// in the report — a new patient never pushes an existing one out.
export function splitReportablePatients(patients, premium) {
  const sorted = [...(patients || [])].sort(
    (a, b) => linkedAt(a) - linkedAt(b) || String(a.id).localeCompare(String(b.id)),
  );
  if (premium) return { included: sorted, held: [] };
  return {
    included: sorted.slice(0, DOCTOR_FREE_PATIENT_CAP),
    held: sorted.slice(DOCTOR_FREE_PATIENT_CAP),
  };
}

// Everything a weekly-report builder needs for one doctor.
export async function reportablePatients(doctorRow, doctorUser) {
  const all = doctorRow?.id ? await doctorPatientStats(doctorRow.id) : [];
  const user = doctorUser !== undefined
    ? doctorUser
    : doctorRow?.user_id ? await getUserById(doctorRow.user_id).catch(() => null) : null;
  const premium = isDoctorPremium(user, doctorRow);
  return { all, premium, ...splitReportablePatients(all, premium) };
}

function drName(doctorRow, doctorUser) {
  const n = String(doctorRow?.name || doctorUser?.name || "").trim();
  if (!n) return "Doctor";
  return /^(dr\.?|doctor)\b/i.test(n) ? n : `Dr. ${n}`;
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function buildCapEmail(doctorRow, doctorUser, patientCount) {
  const name = drName(doctorRow, doctorUser);
  const cap = DOCTOR_FREE_PATIENT_CAP;
  const contact = config.doctorUpgradeContact;
  const subject = `You've reached your DrSaab free limit of ${cap} patients`;
  const text = [
    `Dear ${name},`,
    "",
    `${patientCount} patients have now connected to you on DrSaab — thank you for recommending us.`,
    "",
    `You've reached the free limit of ${cap} patients. Your weekly Doctor Summary Report will continue to cover your first ${cap} patients.`,
    `Patients who connect after that are still linked to you and their health data is saved as usual, but they will not appear in your weekly report until you upgrade to DrPremium.`,
    "",
    `For higher patient volumes, please contact us at ${contact} to upgrade.`,
    "",
    "DrSaab AI",
  ].join("\n");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#1f2937;max-width:560px">
<p>Dear ${esc(name)},</p>
<p><strong>${patientCount}</strong> patients have now connected to you on DrSaab — thank you for recommending us.</p>
<p>You've reached the <strong>free limit of ${cap} patients</strong>. Your weekly Doctor Summary Report will continue to cover your first ${cap} patients.</p>
<p>Patients who connect after that are still linked to you and their health data is saved as usual, but they will not appear in your weekly report until you upgrade to <strong>DrPremium</strong>.</p>
<p>For higher patient volumes, please contact us at <a href="mailto:${esc(contact)}">${esc(contact)}</a> to upgrade.</p>
<p>DrSaab AI</p>
</div>`;
  return { subject, text, html };
}

// Called after a patient links to a doctor. Once the doctor is past the free
// limit (and not on DrPremium), sends the one-time free-limit email plus the
// in-bot notice. Never throws — linking must not fail because of it.
//   → { status: "premium" | "under" | "already" | "sent" | "no-email" | "mail-off" | "failed", count? }
export async function notifyDoctorIfOverCap(doctorRow, patientName, { sendMail = smtpSend } = {}) {
  try {
    if (!doctorRow?.id) return { status: "under" };
    const doctorUser = doctorRow.user_id ? await getUserById(doctorRow.user_id).catch(() => null) : null;
    if (isDoctorPremium(doctorUser, doctorRow)) return { status: "premium" };
    const count = (await doctorPatientStats(doctorRow.id)).length;
    if (count <= DOCTOR_FREE_PATIENT_CAP) return { status: "under", count };

    // Atomic claim: only one link ever sends it, even if two patients link at once.
    if (!(await claimDoctorCapEmail(doctorRow.id))) return { status: "already", count };

    if (doctorUser) notifyDoctorCapReached(doctorUser, patientName).catch(() => {});

    const email = String(doctorRow.email || "").trim();
    if (!EMAIL_RE.test(email)) {
      logWarn("Doctor free limit", `${drName(doctorRow)} passed ${DOCTOR_FREE_PATIENT_CAP} patients but has no valid email — limit email not sent.`);
      return { status: "no-email", count };
    }
    if (!mailEnabled() && sendMail === smtpSend) {
      logError("Doctor free limit", `${drName(doctorRow)} <${email}> passed ${DOCTOR_FREE_PATIENT_CAP} patients, but email is not configured (SMTP_HOST / MAIL_FROM) — limit email not sent.`);
      return { status: "mail-off", count };
    }
    try {
      await sendMail({ to: email, ...buildCapEmail(doctorRow, doctorUser, count) });
      logOk(`Doctor free-limit email sent to ${drName(doctorRow)} <${email}> (${count} patients)`);
      return { status: "sent", count };
    } catch (e) {
      // Let the next patient link try again.
      await releaseDoctorCapEmail(doctorRow.id).catch(() => {});
      logError("Doctor free limit", `email to ${email} failed: ${e?.message || e}`);
      return { status: "failed", count };
    }
  } catch (e) {
    logError("Doctor free limit", e?.message || String(e));
    return { status: "failed" };
  }
}
