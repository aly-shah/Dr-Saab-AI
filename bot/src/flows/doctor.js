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
  doctorReportsWindowKeyboard,
  patientMenuForDoctorKeyboard,
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
  session.patientMode = false;
  const lang = langOf(session);
  const name = sanitizeMd(session.user.name || "");
  return send(bot, chatId, t(lang, "doc_menu_title", { name }), {
    keyboard: doctorMenuKeyboard(lang, session.user),
    markdown: true,
  });
}

// Flip the doctor into patient mode and land them on the patient main menu.
// Only reachable via the doc:switch_patient button, which the keyboard only
// renders when the doctor has a diabetes_status (i.e. is_patient=true).
async function showDoctorPatientMenu(bot, chatId, session) {
  resetFlow(chatId);
  session.patientMode = true;
  const lang = langOf(session);
  return send(bot, chatId, t(lang, "menu_v2_title"), {
    keyboard: patientMenuForDoctorKeyboard(lang, session.user),
    markdown: true,
    keepEmoji: true,
  });
}

// Route `doc:*` callbacks that arrive for a doctor already past onboarding.
// Onboarding-time `doc:patient_yes|doc:patient_no` never reach here — the
// dispatcher in bot.js keeps them in doctorOnboardingCallback while
// session.state === "doctor_onboarding".
export async function doctorCallback(bot, chatId, session, data) {
  const action = data.split(":")[1];
  if (action === "menu")     return showDoctorMenu(bot, chatId, session);
  if (action === "reports")  return showReportsWindowPicker(bot, chatId, session);
  if (action === "referral") return showReferralCode(bot, chatId, session);
  if (action === "myhealth") return openDoctorMyHealth(bot, chatId, session);
  if (action === "switch_patient") return showDoctorPatientMenu(bot, chatId, session);
  if (action === "reports_weekly")  return showPatientReports(bot, chatId, session, "weekly");
  if (action === "reports_monthly") return showPatientReports(bot, chatId, session, "monthly");
  if (action === "reports_all")     return showPatientReports(bot, chatId, session, "all");
}

// Spec: "If the doctor has not completed patient onboarding, launch it.
// Otherwise open the standard patient menus." Doctors who picked "No" to
// dual-use during onboarding have no diabetes_status set — we ask it here
// (a one-question patient onboarding) and mark is_patient=true so the
// doctors row reflects the change before the health-profile flow starts.
async function openDoctorMyHealth(bot, chatId, session) {
  const u = session.user;
  const needsPatientOnboarding = !u.diabetes_status;
  if (needsPatientOnboarding) {
    // Lazy import to avoid a circular dep with onboarding.js.
    const { startPatientBranchForDoctor } = await import("./onboarding.js");
    // Flip is_patient on the doctors row so aggregated views know the doctor
    // is also a patient. Best-effort — failure shouldn't block the flow.
    try {
      const doc = await getDoctorByUserId(u.id);
      if (doc) await updateDoctor(doc.id, { is_patient: true, patient_profile_id: u.id });
    } catch { /* non-fatal */ }
    // Signal the callback handler to land in My Health (not the doctor menu)
    // after the diabetes-type answer, since that's what the doctor tapped.
    if (!session.data) session.data = {};
    session.data.afterPatientBranch = "myhealth";
    return startPatientBranchForDoctor(bot, chatId, session);
  }
  return startMyHealth(bot, chatId, session);
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

// Show the timeframe picker (Weekly / Monthly / All-time) — spec Reporting
// Engine. If nobody's linked yet, skip straight to the empty state.
async function showReportsWindowPicker(bot, chatId, session) {
  const lang = langOf(session);
  const doc = await getDoctorByUserId(session.user.id).catch(() => null);
  if (!doc) return showDoctorMenu(bot, chatId, session);
  const patients = await doctorPatientStats(doc.id).catch(() => []);
  if (!patients.length) {
    return send(bot, chatId, t(lang, "doc_reports_empty", { code: doc.referral_code || "—" }), {
      keyboard: doctorBackKeyboard(lang),
      markdown: true,
    });
  }
  return send(bot, chatId, t(lang, "doc_reports_pick_window"), {
    keyboard: doctorReportsWindowKeyboard(lang),
    markdown: true,
  });
}

// `window`: 'weekly' | 'monthly' | 'all'. Defaults to weekly so a doctor who
// somehow lands here via a legacy button still gets a bounded, useful view.
async function showPatientReports(bot, chatId, session, window = "weekly") {
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

  const windowLabelKey = window === "monthly"
    ? "doc_reports_window_monthly"
    : window === "all"
      ? "doc_reports_window_all"
      : "doc_reports_window_weekly";
  const windowLine = t(lang, windowLabelKey);
  const windowDays = window === "monthly" ? 30 : window === "all" ? Infinity : 7;

  const engagements = patients.map((p) => p.engagement_score).filter((n) => typeof n === "number");
  const avgEngagement = engagements.length ? engagements.reduce((a, b) => a + b, 0) / engagements.length : null;

  const smis = patients.map(computeSmi).filter((n) => typeof n === "number");
  const avgSmi = smis.length ? smis.reduce((a, b) => a + b, 0) / smis.length : null;

  const hba1cs = patients.map((p) => p.latest_hba1c).filter((n) => typeof n === "number");
  const weights = patients.map((p) => Number(p.weight_kg)).filter((n) => Number.isFinite(n));

  // Activity/adherence: MVP proxy — % of patients with any recent activity
  // in the chosen window. Real adherence engine can plug in later.
  const now = Date.now();
  const windowMs = Number.isFinite(windowDays) ? windowDays * 86400000 : Infinity;
  const activeInWindow = patients.filter((p) => {
    if (!p.last_log_date) return false;
    const ts = new Date(p.last_log_date).getTime();
    if (!Number.isFinite(ts)) return false;
    return windowMs === Infinity ? true : (now - ts) <= windowMs;
  }).length;
  const activityPct = patients.length ? Math.round((activeInWindow / patients.length) * 100) : 0;
  const activityLabel = windowDays === Infinity
    ? `${activityPct}% ever logged`
    : `${activityPct}% logged in last ${windowDays} days`;

  // Adherence approximated from consistency_score for now — same rationale as
  // SMI: use a signal we already collect until a dedicated metric exists.
  const consistencies = patients.map((p) => p.consistency_score).filter((n) => typeof n === "number");
  const avgConsistency = consistencies.length ? consistencies.reduce((a, b) => a + b, 0) / consistencies.length : null;

  // Red/green flag heuristics — kept intentionally simple for MVP. The strings
  // fall back to language-specific defaults if no flag qualifies.
  const greenLines = [];
  const redLines = [];
  const actionLines = [];

  if (activityPct >= 60) greenLines.push(`• ${activeInWindow}/${patients.length} patients active in this window`);
  if (avgEngagement != null && avgEngagement >= 60) greenLines.push(`• Engagement average is ${Math.round(avgEngagement)} — healthy`);
  if (avgConsistency != null && avgConsistency >= 60) greenLines.push(`• Medication adherence tracking is strong`);

  // Stale = no log in double the window (or 14+ days for all-time).
  const staleThreshMs = Number.isFinite(windowDays) ? windowDays * 2 * 86400000 : 14 * 86400000;
  const stale = patients.filter((p) => !p.last_log_date || (now - new Date(p.last_log_date).getTime()) > staleThreshMs);
  if (stale.length) redLines.push(`• ${stale.length} patient(s) haven't logged recently`);
  const highA1c = patients.filter((p) => typeof p.latest_hba1c === "number" && p.latest_hba1c >= 8.5);
  if (highA1c.length) redLines.push(`• ${highA1c.length} patient(s) with HbA1c ≥ 8.5%`);
  if (avgEngagement != null && avgEngagement < 40) redLines.push(`• Engagement average is low (${Math.round(avgEngagement)})`);

  if (stale.length) actionLines.push(`• Nudge the ${stale.length} inactive patient(s) to log a check-in`);
  if (highA1c.length) actionLines.push(`• Schedule review with the ${highA1c.length} high-HbA1c patient(s)`);
  if (avgEngagement != null && avgEngagement < 50) actionLines.push(`• Send a group message to lift engagement`);

  const green = greenLines.length ? greenLines.join("\n") : t(lang, "doc_reports_green_default");
  const red = redLines.length ? redLines.join("\n") : t(lang, "doc_reports_red_default");
  const actions = actionLines.length ? actionLines.join("\n") : t(lang, "doc_reports_actions_default");

  const body = t(lang, "doc_reports_title") + "\n" + windowLine + "\n\n" + t(lang, "doc_reports_body", {
    patients: patients.length,
    engagement: engagementLabel(avgEngagement) + (avgEngagement != null ? ` (${Math.round(avgEngagement)})` : ""),
    smi: avgSmi != null ? `${Math.round(avgSmi)}/100` : "—",
    hba1c: fmtAvg(hba1cs, 1, "%"),
    weight: fmtAvg(weights, 1, " kg"),
    activity: activityLabel,
    adherence: avgConsistency != null ? `${Math.round(avgConsistency)}/100` : "—",
    green,
    red,
    actions,
  });

  return send(bot, chatId, body, {
    keyboard: doctorReportsWindowKeyboard(lang),
    markdown: true,
  });
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
    const nowIso = new Date().toISOString();
    session.user = await updateUser(session.user.id, {
      doctor_id: pending.id,
      doctor_referral_code: pending.referral_code,
      doctor_link_status: "active",
      doctor_linked_date: nowIso,
      linked_date: nowIso, // spec-named alias, kept in sync
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
