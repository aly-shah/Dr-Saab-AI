// Doctor & Referral module (v1.0) — main menu + Patient Reports + Referral
// Code + patient-side "My Doctor".
//
// Doctor onboarding is in doctorOnboarding.js. This file covers everything a
// doctor sees post-onboarding, plus the patient-side flow for linking to a
// doctor by referral code.

import { t } from "../i18n.js";
import { send, sanitizeMd, langOf, isTestModeFor } from "../utils.js";
import { resetFlow } from "../session.js";
import {
  doctorMenuKeyboard,
  doctorBackKeyboard,
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
  getUserById,
  updateDoctor,
  updateUser,
  doctorPatientStats,
} from "../supabase.js";
import { startMyHealth } from "./myhealth.js";
import {
  isDoctorPro,
  DOCTOR_FREE_PATIENT_CAP,
  notifyDoctorCapReached,
  renderDoctorCapPrompt,
} from "./subscription.js";

// ===================================================================
// Doctor main menu
// ===================================================================
export async function showDoctorMenu(bot, chatId, session) {
  resetFlow(chatId);
  session.patientMode = false;
  const lang = langOf(session);
  const name = sanitizeMd(session.user.name || "");
  const atCap = await isDoctorAtFreeCap(session.user).catch(() => false);
  return send(bot, chatId, t(lang, "doc_menu_title", { name }), {
    keyboard: doctorMenuKeyboard(lang, session.user, {
      showTest: isTestModeFor(session.user),
      atCap,
    }),
    markdown: true,
  });
}

// True when this doctor is on the free plan and has already hit the
// 10-patient limit. Used by showDoctorMenu to surface the persistent
// "Upgrade to Doctor Pro" button. Doctor Pro subscribers never see it.
async function isDoctorAtFreeCap(doctorUser) {
  if (!doctorUser || doctorUser.user_type !== "doctor") return false;
  if (isDoctorPro(doctorUser)) return false;
  const doc = await getDoctorByUserId(doctorUser.id).catch(() => null);
  if (!doc?.id) return false;
  const patients = await doctorPatientStats(doc.id).catch(() => []);
  return patients.length >= DOCTOR_FREE_PATIENT_CAP;
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
  if (action === "reports")  return showPatientList(bot, chatId, session);
  if (action === "referral") return showReferralCode(bot, chatId, session);
  if (action === "myhealth") return openDoctorMyHealth(bot, chatId, session);
  if (action === "switch_patient") return showDoctorPatientMenu(bot, chatId, session);
  if (action === "reports_weekly" || action === "reports_monthly" || action === "reports_all") {
    return showPatientList(bot, chatId, session);
  }
  if (action === "test_dp") return simulateDpCap(bot, chatId, session);
}

// QA helper — fires the exact cap-reached prompt a real 11th-patient link
// attempt would send. Renders on the current bot so it works on every
// channel (web, WhatsApp, Telegram) rather than only WhatsApp.
async function simulateDpCap(bot, chatId, session) {
  const lang = langOf(session);
  if (!isTestModeFor(session.user)) {
    return send(bot, chatId, t(lang, "test_activation_disabled"), { markdown: true });
  }
  return renderDoctorCapPrompt(bot, chatId, lang, t(lang, "dp_test_patient_name"));
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
// Patient reports — simple count + numbered list of connected patients.
// ===================================================================
async function showPatientList(bot, chatId, session) {
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

  const list = patients
    .map((p, i) => `${i + 1}. ${sanitizeMd(p.name || "—")}`)
    .join("\n");
  const body = t(lang, "doc_reports_body", { patients: patients.length, list });

  return send(bot, chatId, body, {
    keyboard: doctorBackKeyboard(lang),
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

// Prepend "Dr. " to a doctor's display name unless the doctor already
// wrote it in themselves (matches "Dr", "Dr.", or "Doctor" at the start).
export function withDrPrefix(name) {
  const s = String(name || "").trim();
  if (!s) return s;
  if (/^(dr\.?|doctor)\b/i.test(s)) return s;
  return `Dr. ${s}`;
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
        name: sanitizeMd(withDrPrefix(doc.name)),
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

  // The "no doctor" screen tells the user to type a DS#XXXX code, so put
  // the session into await_code up front — otherwise a code typed before
  // tapping "Add Doctor" falls through to the AI.
  session.state = "my_doctor";
  session.step = "await_code";
  if (!session.data) session.data = {};
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
      name: sanitizeMd(withDrPrefix(doc.name)),
    }), {
      keyboard: myDoctorRemoveConfirmKeyboard(lang),
      markdown: true,
    });
  }

  if (action === "confirm") {
    const pending = session.data?.pendingDoctor;
    if (!pending) return showMyDoctor(bot, chatId, session);

    // Addendum §4 — free doctors are capped at 10 active patients. Skip
    // the check when the patient is already linked to this doctor (re-
    // confirming an existing link is not a new patient).
    const capped = await isDoctorAtCap(pending, session.user);
    if (capped) {
      session.data.pendingDoctor = null;
      resetFlow(chatId);
      await send(bot, chatId, t(lang, "dp_patient_cap_reached", {
        name: sanitizeMd(withDrPrefix(pending.name)),
      }), { markdown: true });
      // Fire-and-forget the doctor-side notification.
      const doctorUser = await getUserById(pending.user_id).catch(() => null);
      if (doctorUser) notifyDoctorCapReached(doctorUser, session.user.name).catch(() => {});
      return showMyDoctor(bot, chatId, session);
    }

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
      name: sanitizeMd(withDrPrefix(pending.name)),
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
    name: sanitizeMd(withDrPrefix(doc.name)),
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

// Addendum §2/§7 — returns true when `doctor` already has the free-plan
// max (10) active patients and isn't on Doctor Pro. `linkingPatient` lets
// us skip the count when the patient is re-confirming an existing link.
async function isDoctorAtCap(doctor, linkingPatient) {
  if (!doctor?.id) return false;

  const doctorUser = await getUserById(doctor.user_id).catch(() => null);
  if (isDoctorPro(doctorUser)) return false;

  const patients = await doctorPatientStats(doctor.id).catch(() => []);
  const activeCount = patients.length;
  if (activeCount < DOCTOR_FREE_PATIENT_CAP) return false;

  // Already linked to this doctor? Not a new patient — allow through.
  if (linkingPatient?.doctor_id === doctor.id
      && linkingPatient?.doctor_link_status === "active") {
    return false;
  }
  return true;
}
