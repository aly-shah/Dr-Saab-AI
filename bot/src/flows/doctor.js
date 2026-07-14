// Doctor & Referral module (v1.0) — main menu + Patient Reports + Referral
// Code + patient-side "My Doctor".
//
// Doctor onboarding is in doctorOnboarding.js. This file covers everything a
// doctor sees post-onboarding, plus the patient-side flow for linking to a
// doctor by referral code.

import { t } from "../i18n.js";
import { send, sanitizeMd, langOf } from "../utils.js";
import { resetFlow } from "../session.js";
import {
  doctorMenuKeyboard,
  doctorBackKeyboard,
  myDoctorNoneKeyboard,
  myDoctorLinkedKeyboard,
  myDoctorConfirmKeyboard,
  myDoctorRemoveConfirmKeyboard,
  backKeyboard,
} from "../keyboards.js";
import {
  getDoctorByUserId,
  getDoctorByReferralCode,
  getDoctorById,
  updateDoctor,
  updateUser,
  doctorPatientStats,
} from "../supabase.js";
import { startMyHealth } from "./myhealth.js";

// ===================================================================
// Doctor main menu
// ===================================================================
export async function showDoctorMenu(bot, chatId, session) {
  resetFlow(chatId);
  const lang = langOf(session);
  const name = sanitizeMd(session.user.name || "");
  return send(bot, chatId, t(lang, "doc_menu_title", { name }), {
    keyboard: doctorMenuKeyboard(lang),
    markdown: true,
  });
}

// Route `doc:*` callbacks that arrive for a doctor already past onboarding.
// Onboarding-time `doc:patient_yes|doc:patient_no` never reach here — the
// dispatcher in bot.js keeps them in doctorOnboardingCallback while
// session.state === "doctor_onboarding".
export async function doctorCallback(bot, chatId, session, data) {
  const action = data.split(":")[1];
  if (action === "menu")     return showDoctorMenu(bot, chatId, session);
  if (action === "reports")  return showPatientReports(bot, chatId, session);
  if (action === "referral") return showReferralCode(bot, chatId, session);
  if (action === "myhealth") {
    // "My Health" from the doctor menu reuses the patient My Health module.
    return startMyHealth(bot, chatId, session);
  }
}

// ===================================================================
// Referral code screen
// ===================================================================
async function showReferralCode(bot, chatId, session) {
  const lang = langOf(session);
  const doc = await getDoctorByUserId(session.user.id).catch(() => null);
  const code = doc?.referral_code || "—";
  const body = `${t(lang, "doc_referral_title")}\n\n${t(lang, "doc_referral_body", { code })}`;
  return send(bot, chatId, body, { keyboard: doctorBackKeyboard(lang), markdown: true });
}

// ===================================================================
// Patient reports (aggregated)
// ===================================================================
function fmtAvg(nums, digits = 1, suffix = "") {
  const clean = nums.filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (!clean.length) return "—";
  const avg = clean.reduce((a, b) => a + b, 0) / clean.length;
  return `${avg.toFixed(digits)}${suffix}`;
}

// Simple "engagement" bucket derived from average engagement_score across
// linked patients. Matches the wording used elsewhere in the app.
function engagementLabel(avg) {
  if (avg == null) return "—";
  if (avg >= 75) return "High";
  if (avg >= 50) return "Moderate";
  if (avg >= 25) return "Low";
  return "Very Low";
}

// SMI = Self-Management Index. We already track four per-patient sub-scores
// (consistency, motivation, risk-inverse, engagement) — averaging them gives
// a coarse but useful practice-wide SMI for MVP reporting.
function computeSmi(p) {
  const parts = [p.consistency_score, p.motivation_score, p.engagement_score];
  if (typeof p.risk_score === "number") parts.push(100 - p.risk_score);
  const valid = parts.filter((n) => typeof n === "number");
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

async function showPatientReports(bot, chatId, session) {
  const lang = langOf(session);
  const doc = await getDoctorByUserId(session.user.id).catch(() => null);
  const patients = doc ? await doctorPatientStats(doc.id).catch(() => []) : [];

  if (!patients.length) {
    const code = doc?.referral_code || "—";
    return send(bot, chatId, t(lang, "doc_reports_empty", { code }), {
      keyboard: doctorBackKeyboard(lang),
      markdown: true,
    });
  }

  const engagements = patients.map((p) => p.engagement_score).filter((n) => typeof n === "number");
  const avgEngagement = engagements.length ? engagements.reduce((a, b) => a + b, 0) / engagements.length : null;

  const smis = patients.map(computeSmi).filter((n) => typeof n === "number");
  const avgSmi = smis.length ? smis.reduce((a, b) => a + b, 0) / smis.length : null;

  const hba1cs = patients.map((p) => p.latest_hba1c).filter((n) => typeof n === "number");
  const weights = patients.map((p) => Number(p.weight_kg)).filter((n) => Number.isFinite(n));

  // Activity/adherence: MVP proxy — % of patients with any recent activity
  // (last_log_date within 7 days). Real adherence engine can plug in later.
  const now = Date.now();
  const activeLast7 = patients.filter((p) => {
    if (!p.last_log_date) return false;
    const ts = new Date(p.last_log_date).getTime();
    return Number.isFinite(ts) && now - ts <= 7 * 86400000;
  }).length;
  const activityPct = patients.length ? Math.round((activeLast7 / patients.length) * 100) : 0;

  // Adherence approximated from consistency_score for now — same rationale as
  // SMI: use a signal we already collect until a dedicated metric exists.
  const consistencies = patients.map((p) => p.consistency_score).filter((n) => typeof n === "number");
  const avgConsistency = consistencies.length ? consistencies.reduce((a, b) => a + b, 0) / consistencies.length : null;

  // Red/green flag heuristics — kept intentionally simple for MVP. The strings
  // fall back to language-specific defaults if no flag qualifies.
  const greenLines = [];
  const redLines = [];
  const actionLines = [];

  if (activityPct >= 60) greenLines.push(`• ${activeLast7}/${patients.length} patients logged in the last 7 days`);
  if (avgEngagement != null && avgEngagement >= 60) greenLines.push(`• Engagement average is ${Math.round(avgEngagement)} — healthy`);
  if (avgConsistency != null && avgConsistency >= 60) greenLines.push(`• Medication adherence tracking is strong`);

  const stale = patients.filter((p) => !p.last_log_date || (now - new Date(p.last_log_date).getTime()) > 14 * 86400000);
  if (stale.length) redLines.push(`• ${stale.length} patient(s) haven't logged in 2+ weeks`);
  const highA1c = patients.filter((p) => typeof p.latest_hba1c === "number" && p.latest_hba1c >= 8.5);
  if (highA1c.length) redLines.push(`• ${highA1c.length} patient(s) with HbA1c ≥ 8.5%`);
  if (avgEngagement != null && avgEngagement < 40) redLines.push(`• Engagement average is low (${Math.round(avgEngagement)})`);

  if (stale.length) actionLines.push(`• Nudge the ${stale.length} inactive patient(s) to log a check-in`);
  if (highA1c.length) actionLines.push(`• Schedule review with the ${highA1c.length} high-HbA1c patient(s)`);
  if (avgEngagement != null && avgEngagement < 50) actionLines.push(`• Send a group message to lift engagement`);

  const green = greenLines.length ? greenLines.join("\n") : t(lang, "doc_reports_green_default");
  const red = redLines.length ? redLines.join("\n") : t(lang, "doc_reports_red_default");
  const actions = actionLines.length ? actionLines.join("\n") : t(lang, "doc_reports_actions_default");

  const body = t(lang, "doc_reports_title") + "\n\n" + t(lang, "doc_reports_body", {
    patients: patients.length,
    engagement: engagementLabel(avgEngagement) + (avgEngagement != null ? ` (${Math.round(avgEngagement)})` : ""),
    smi: avgSmi != null ? `${Math.round(avgSmi)}/100` : "—",
    hba1c: fmtAvg(hba1cs, 1, "%"),
    weight: fmtAvg(weights, 1, " kg"),
    activity: `${activityPct}% logged in last 7 days`,
    adherence: avgConsistency != null ? `${Math.round(avgConsistency)}/100` : "—",
    green,
    red,
    actions,
  });

  return send(bot, chatId, body, { keyboard: doctorBackKeyboard(lang), markdown: true });
}

// ===================================================================
// Patient-side: My Doctor (Add / Change / Remove)
// ===================================================================
const REFERRAL_RE = /^DS#[A-Z0-9]{4}$/i;

function normalizeCode(raw) {
  return String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
}

export async function showMyDoctor(bot, chatId, session) {
  resetFlow(chatId);
  const lang = langOf(session);
  const user = session.user;

  if (user.doctor_id && user.doctor_link_status === "active") {
    const doc = await getDoctorById(user.doctor_id).catch(() => null);
    if (doc) {
      const linked = user.doctor_linked_date
        ? new Date(user.doctor_linked_date).toISOString().slice(0, 10)
        : "—";
      const body = t(lang, "my_doctor_title_linked", {
        name: sanitizeMd(doc.name || ""),
        specialty: sanitizeMd(doc.specialization || "—"),
        location: sanitizeMd(doc.practice_location || "—"),
        linked,
      });
      return send(bot, chatId, body, {
        keyboard: myDoctorLinkedKeyboard(lang),
        markdown: true,
      });
    }
  }

  return send(bot, chatId, t(lang, "my_doctor_title_none"), {
    keyboard: myDoctorNoneKeyboard(lang),
    markdown: true,
  });
}

export async function myDoctorCallback(bot, chatId, session, data) {
  const lang = langOf(session);
  const action = data.split(":")[1];

  if (action === "open") return showMyDoctor(bot, chatId, session);

  if (action === "add" || action === "change") {
    session.state = "my_doctor";
    session.step = "await_code";
    if (!session.data) session.data = {};
    return send(bot, chatId, t(lang, "my_doctor_ask_code"), {
      keyboard: backKeyboard(lang, "feat:myhealth"),
      markdown: true,
    });
  }

  if (action === "remove") {
    const doc = session.user.doctor_id
      ? await getDoctorById(session.user.doctor_id).catch(() => null)
      : null;
    if (!doc) return showMyDoctor(bot, chatId, session);
    session.state = "my_doctor";
    session.step = "await_remove";
    return send(bot, chatId, t(lang, "my_doctor_remove_confirm", {
      name: sanitizeMd(doc.name || ""),
    }), {
      keyboard: myDoctorRemoveConfirmKeyboard(lang),
      markdown: true,
    });
  }

  if (action === "confirm") {
    const pending = session.data?.pendingDoctor;
    if (!pending) return showMyDoctor(bot, chatId, session);
    session.user = await updateUser(session.user.id, {
      doctor_id: pending.id,
      doctor_referral_code: pending.referral_code,
      doctor_link_status: "active",
      doctor_linked_date: new Date().toISOString(),
    });
    session.data.pendingDoctor = null;
    resetFlow(chatId);
    await send(bot, chatId, t(lang, "my_doctor_linked_ok", {
      name: sanitizeMd(pending.name || ""),
    }), { markdown: true });
    return showMyDoctor(bot, chatId, session);
  }

  if (action === "remove_confirm") {
    session.user = await updateUser(session.user.id, {
      doctor_id: null,
      doctor_link_status: "removed",
    });
    resetFlow(chatId);
    await send(bot, chatId, t(lang, "my_doctor_removed_ok"), { markdown: true });
    return showMyDoctor(bot, chatId, session);
  }

  if (action === "cancel") {
    resetFlow(chatId);
    return showMyDoctor(bot, chatId, session);
  }
}

export async function myDoctorText(bot, chatId, session, text) {
  const lang = langOf(session);
  if (session.step !== "await_code") return;

  const code = normalizeCode(text);
  if (!REFERRAL_RE.test(code)) {
    return send(bot, chatId, t(lang, "my_doctor_code_invalid"), { markdown: true });
  }
  const doc = await getDoctorByReferralCode(code).catch(() => null);
  if (!doc) {
    return send(bot, chatId, t(lang, "my_doctor_not_found"), { markdown: true });
  }
  session.data.pendingDoctor = doc;
  session.step = "confirm_link";
  return send(bot, chatId, t(lang, "my_doctor_confirm", {
    name: sanitizeMd(doc.name || ""),
    specialty: sanitizeMd(doc.specialization || "—"),
    location: sanitizeMd(doc.practice_location || "—"),
  }), {
    keyboard: myDoctorConfirmKeyboard(lang),
    markdown: true,
  });
}

// Convenience: is this session currently a doctor's session?
export function isDoctorSession(session) {
  return session?.user?.user_type === "doctor";
}
