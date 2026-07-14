// Doctor onboarding flow (spec: Doctor & Referral Module v1.0).
//
// Runs after the user has picked "🩺 I'm a Doctor" on the user_type screen.
// At that point onboarding has already captured `name` and `date_of_birth`,
// so this flow only needs to collect specialty, practice location, email,
// and the "do you also want to use DrSaab for personal health?" question.
//
// On completion:
//   • create a doctors row with a permanent DS#XXXX referral code
//   • flip the users row to user_type='doctor' + onboarded=true
//   • either land on the doctor main menu (patient use = No) or immediately
//     start the standard patient onboarding branch (patient use = Yes).

import { t } from "../i18n.js";
import { send, sanitizeMd, langOf } from "../utils.js";
import { resetFlow } from "../session.js";
import {
  doctorMenuKeyboard,
  docYesNoKeyboard,
  userTypeKeyboard,
} from "../keyboards.js";
import {
  updateUser,
  createDoctor,
  doctorReferralCodeExists,
  getDoctorByUserId,
} from "../supabase.js";
import { refreshKB } from "../kb.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- Referral code ----------
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity

function randomCode() {
  let s = "";
  for (let i = 0; i < 4; i++) {
    s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `DS#${s}`;
}

// Try a handful of times before giving up. With 32^4 = ~1M codes, collisions
// are practically impossible for the MVP.
async function generateUniqueReferralCode() {
  for (let i = 0; i < 8; i++) {
    const code = randomCode();
    const exists = await doctorReferralCodeExists(code).catch(() => false);
    if (!exists) return code;
  }
  throw new Error("Could not allocate a unique referral code");
}

// ---------- Flow ----------
// Entry point: user just tapped "I'm a Doctor" on the user_type screen.
// Onboarding has already captured `name` (session.data.name).
export async function startDoctorOnboarding(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "doctor_onboarding";
  session.step = "specialty";
  if (!session.data) session.data = {};
  session.data.user_type = "doctor";
  return send(bot, chatId, t(lang, "doc_ask_specialty"), { markdown: true });
}

// Restart-safe re-prompt for the current step.
async function promptStep(bot, chatId, session) {
  const lang = langOf(session);
  switch (session.step) {
    case "specialty":
      return send(bot, chatId, t(lang, "doc_ask_specialty"), { markdown: true });
    case "location":
      return send(bot, chatId, t(lang, "doc_ask_location"), { markdown: true });
    case "email":
      return send(bot, chatId, t(lang, "doc_ask_email"), { markdown: true });
    case "patient_use":
      return send(bot, chatId, t(lang, "doc_ask_patient_use"), {
        keyboard: docYesNoKeyboard(lang),
        markdown: true,
      });
    case "user_type":
      // Legacy path — user backed out of doctor flow; re-show user_type.
      return send(bot, chatId, t(lang, "ask_user_type"), {
        keyboard: userTypeKeyboard(lang),
        markdown: true,
      });
    default:
      return;
  }
}

export async function doctorOnboardingText(bot, chatId, session, text) {
  const lang = langOf(session);
  const val = (text || "").trim();
  if (!val) return promptStep(bot, chatId, session);

  switch (session.step) {
    case "specialty":
      session.data.specialization = val.slice(0, 100);
      session.step = "location";
      return promptStep(bot, chatId, session);

    case "location":
      session.data.practice_location = val.slice(0, 120);
      session.step = "email";
      return promptStep(bot, chatId, session);

    case "email": {
      const email = val.toLowerCase();
      if (!EMAIL_RE.test(email)) {
        return send(bot, chatId, t(lang, "doc_email_invalid"), { markdown: true });
      }
      session.data.email = email;
      session.step = "patient_use";
      return promptStep(bot, chatId, session);
    }

    case "patient_use":
      // They typed instead of tapping — nudge them back to the buttons.
      return promptStep(bot, chatId, session);

    default:
      return;
  }
}

export async function doctorOnboardingCallback(bot, chatId, session, data) {
  // Only patient_use answers come through here — all earlier steps are typed.
  if (session.step !== "patient_use") return;
  const parts = data.split(":");
  if (parts[0] !== "doc") return;
  if (parts[1] === "patient_yes") {
    session.data.is_patient = true;
    return finishDoctorSetup(bot, chatId, session, /* continueAsPatient */ true);
  }
  if (parts[1] === "patient_no") {
    session.data.is_patient = false;
    return finishDoctorSetup(bot, chatId, session, /* continueAsPatient */ false);
  }
}

async function finishDoctorSetup(bot, chatId, session, continueAsPatient) {
  const lang = langOf(session);
  const d = session.data;
  const userId = session.user.id;

  // Flip user row to doctor. Onboarded=true only when they aren't continuing
  // into patient onboarding — otherwise the patient branch will set it once
  // that flow completes.
  const userPatch = {
    language: d.language || session.user.language || lang,
    name: d.name ?? session.user.name ?? null,
    date_of_birth: d.date_of_birth ?? session.user.date_of_birth ?? null,
    age: d.age ?? session.user.age ?? null,
    age_bracket: session.user.age_bracket ?? null,
    user_type: "doctor",
    disclaimer_accepted: true,
    onboarded: !continueAsPatient,
  };
  session.user = await updateUser(userId, userPatch);

  const referralCode = await generateUniqueReferralCode();
  const doctorRow = await createDoctor({
    user_id: userId,
    name: session.user.name || d.name || "Doctor",
    email: d.email,
    specialization: d.specialization,
    practice_location: d.practice_location,
    referral_code: referralCode,
    is_patient: !!d.is_patient,
    last_login: new Date().toISOString(),
  });

  await refreshKB(session.user).catch(() => {});

  const name = sanitizeMd(session.user.name || "");
  await send(
    bot,
    chatId,
    t(lang, "doc_setup_complete", { name, code: doctorRow.referral_code }),
    { markdown: true }
  );

  if (continueAsPatient) {
    // Hand off to the standard patient onboarding for DOB + diabetes type.
    // Lazy import to avoid a cycle with onboarding.js.
    const mod = await import("./onboarding.js");
    return mod.startPatientBranchForDoctor(bot, chatId, session);
  }

  // Land the doctor on their main menu.
  resetFlow(chatId);
  return send(bot, chatId, t(lang, "doc_menu_title", { name }), {
    keyboard: doctorMenuKeyboard(lang),
    markdown: true,
  });
}

// Helper: has this user already been onboarded as a doctor?
export async function isDoctorUser(user) {
  if (!user || user.user_type !== "doctor") return false;
  return true;
}

// Helper: fetch the doctors row for the currently logged-in doctor.
export async function fetchDoctorProfile(user) {
  if (!user || user.user_type !== "doctor") return null;
  return getDoctorByUserId(user.id).catch(() => null);
}
