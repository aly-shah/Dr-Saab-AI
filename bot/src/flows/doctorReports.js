// Doctor menu → 📊 Patient Reports → PDF snapshots.
//
//   • Weekly Patient Snapshots — one PDF: a summary page of every connected
//     patient followed by a Patient Health Snapshot page per patient.
//   • Single Patient Snapshot — pick a patient, get their page as its own PDF.
//
// Callbacks (all under the doctor `doc:` prefix, dispatched from doctor.js):
//   doc:snap_all             build + send the weekly summary
//   doc:snap_pick[:offset]   patient picker (paged, 8 per screen)
//   doc:snap_p:<userId>      build + send one patient's snapshot

import { t } from "../i18n.js";
import { send, typing, langOf, sanitizeMd, sendDocument } from "../utils.js";
import { doctorBackKeyboard, doctorReportsKeyboard, doctorPatientPickerKeyboard } from "../keyboards.js";
import { getDoctorByUserId, doctorPatientStats, saveGeneratedDocument } from "../supabase.js";
import { assembleDoctorReport } from "../doctorReportData.js";
import { renderDoctorWeeklyPdf, renderPatientSnapshotPdf } from "../doctorReportPdf.js";
import { dayKey } from "../snapshotData.js";
import { errorKey } from "../errors.js";
import { logError } from "../log.js";

export const PICKER_PAGE = 8;

async function practice(session) {
  const doc = await getDoctorByUserId(session.user.id).catch(() => null);
  const patients = doc ? await doctorPatientStats(doc.id).catch(() => []) : [];
  patients.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  return { doc, patients };
}

// Patient Reports screen: the numbered list plus the two PDF actions.
export async function showDoctorReports(bot, chatId, session) {
  const lang = langOf(session);
  const { doc, patients } = await practice(session);
  if (!patients.length) {
    const code = doc?.referral_code || "—";
    return send(bot, chatId, t(lang, "doc_reports_empty", { code }), {
      keyboard: doctorBackKeyboard(lang),
      markdown: true,
    });
  }
  const list = patients.map((p, i) => `${i + 1}. ${sanitizeMd(p.name || "—")}`).join("\n");
  const body = `${t(lang, "doc_reports_body", { patients: patients.length, list })}\n\n${t(lang, "doc_reports_pdf_hint")}`;
  return send(bot, chatId, body, { keyboard: doctorReportsKeyboard(lang), markdown: true });
}

export async function showPatientPicker(bot, chatId, session, offset = 0) {
  const lang = langOf(session);
  const { patients } = await practice(session);
  if (!patients.length) return showDoctorReports(bot, chatId, session);
  const start = Math.max(0, Math.min(offset, patients.length - 1));
  const page = patients.slice(start, start + PICKER_PAGE);
  const hasMore = start + PICKER_PAGE < patients.length;
  return send(bot, chatId, t(lang, "doc_snap_pick_title", { from: start + 1, to: start + page.length, total: patients.length }), {
    keyboard: doctorPatientPickerKeyboard(lang, page, hasMore ? start + PICKER_PAGE : null),
    markdown: true,
  });
}

export async function sendWeeklySnapshots(bot, chatId, session) {
  const lang = langOf(session);
  const { doc, patients } = await practice(session);
  if (!patients.length) return showDoctorReports(bot, chatId, session);
  await send(bot, chatId, t(lang, "doc_snap_generating_all", { n: patients.length }), { markdown: true });
  await typing(bot, chatId);
  try {
    const report = await assembleDoctorReport(session.user, doc, patients);
    const pdf = await renderDoctorWeeklyPdf(report);
    const filename = `DrSaab-Weekly-Patient-Snapshots-${dayKey(report.generatedAt)}.pdf`;
    const b = report.breakdown;
    const caption = t(lang, "doc_snap_caption_all", {
      period: report.period.label,
      n: report.patients.length,
      good: b.good,
      warn: b.warn,
      urgent: b.urgent,
    });
    const ok = await sendDocument(bot, chatId, pdf, { filename, caption, keyboard: doctorBackKeyboard(lang) });
    if (!ok) await send(bot, chatId, t(lang, "doc_snap_send_failed"), { keyboard: doctorBackKeyboard(lang), markdown: true });
    saveGeneratedDocument(session.user.id, "doctor_weekly", `data:application/pdf;base64,${pdf.toString("base64")}`,
      `Weekly Patient Snapshots generated — ${report.patients.length} patients (${report.period.label})`).catch(() => {});
  } catch (e) {
    logError("Doctor weekly snapshots", e?.message || String(e));
    console.error(e?.stack || e);
    await send(bot, chatId, t(lang, errorKey(e)), { keyboard: doctorBackKeyboard(lang) });
  }
}

export async function sendPatientSnapshot(bot, chatId, session, patientId) {
  const lang = langOf(session);
  const { doc, patients } = await practice(session);
  const target = patients.find((p) => String(p.id) === String(patientId));
  if (!target) {
    return send(bot, chatId, t(lang, "doc_snap_not_found"), { keyboard: doctorBackKeyboard(lang), markdown: true });
  }
  await send(bot, chatId, t(lang, "doc_snap_generating_one", { name: sanitizeMd(target.name || "patient") }), { markdown: true });
  await typing(bot, chatId);
  try {
    const report = await assembleDoctorReport(session.user, doc, [target]);
    const p = report.patients[0];
    const pdf = await renderPatientSnapshotPdf(report, 0);
    const safeName = String(p.name || "patient").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "patient";
    const filename = `DrSaab-Patient-Snapshot-${safeName}-${dayKey(report.generatedAt)}.pdf`;
    const caption = t(lang, "doc_snap_caption_one", {
      name: sanitizeMd(p.name),
      id: p.id,
      period: report.period.label,
      status: p.status.label,
    });
    const ok = await sendDocument(bot, chatId, pdf, { filename, caption, keyboard: doctorBackKeyboard(lang) });
    if (!ok) await send(bot, chatId, t(lang, "doc_snap_send_failed"), { keyboard: doctorBackKeyboard(lang), markdown: true });
    saveGeneratedDocument(session.user.id, "doctor_patient", `data:application/pdf;base64,${pdf.toString("base64")}`,
      `Patient Health Snapshot generated — ${p.name} (${p.id})`).catch(() => {});
  } catch (e) {
    logError("Doctor patient snapshot", e?.message || String(e));
    console.error(e?.stack || e);
    await send(bot, chatId, t(lang, errorKey(e)), { keyboard: doctorBackKeyboard(lang) });
  }
}
