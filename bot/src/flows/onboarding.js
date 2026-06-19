import { t } from "../i18n.js";
import { send, sanitizeMd, langOf } from "../utils.js";
import {
  userTypeKeyboard,
  genderKeyboardV2,
  diabetesTypeKeyboard,
  diagnosisDurationKeyboard,
  yesNoKeyboard,
  hba1cDateKeyboard,
  readingDateKeyboard,
  addMoreKeyboard,
  monitoringHabitKeyboard,
  monitoringDeviceKeyboard,
  primaryGoalKeyboard,
  challengeKeyboard,
  motivationKeyboard,
  understandKeyboard,
  mainMenuKeyboard,
} from "../keyboards.js";
import { sendWelcomeWithLangPicker } from "../welcome.js";
import { updateUser } from "../supabase.js";
import { refreshKB } from "../kb.js";
import { resetFlow } from "../session.js";

// "Non-clinical" user types skip diabetes-specific steps (diabetes type,
// diagnosis history, HbA1c, sugar readings, diabetes meds, glucose monitoring).
// They still answer other-conditions, goal, challenge, motivation, disclaimer.
function isNonClinical(data) {
  return data.user_type === "parent" || data.user_type === "exploring";
}

// Compute the next step from the current one + collected data.
function nextStep(step, data) {
  switch (step) {
    case "name":
      return "user_type";
    case "user_type":
      return "age";
    case "age":
      return "gender";
    case "gender":
      return "city";
    case "city":
      if (isNonClinical(data)) return "other_conditions_known";
      if (data.user_type === "notsure") return "diagnosis_duration";
      return "diabetes_type";
    case "diabetes_type":
      return "diagnosis_duration";
    case "diagnosis_duration":
      return "hba1c_known";
    case "hba1c_known":
      return data.hba1c_known === "yes" ? "hba1c_value" : "sugar_known";
    case "hba1c_value":
      return "hba1c_date";
    case "hba1c_date":
      return "sugar_known";
    case "sugar_known":
      return data.sugar_known === "yes" ? "fasting_value" : "diab_meds_known";
    case "fasting_value":
      return "fasting_date";
    case "fasting_date":
      return "random_value";
    case "random_value":
      return "random_date";
    case "random_date":
      return "diab_meds_known";
    case "diab_meds_known":
      return data.diab_meds_known === "yes" ? "diab_med_entry" : "other_conditions_known";
    case "diab_med_entry":
      return "diab_meds_more";
    case "diab_meds_more":
      return data.diab_meds_more === "add" ? "diab_med_entry" : "other_conditions_known";
    case "other_conditions_known":
      if (data.other_conditions_known === "yes") return "other_conditions_details";
      return isNonClinical(data) ? "primary_goal" : "monitoring_habit";
    case "other_conditions_details":
      return "other_meds_known";
    case "other_meds_known":
      if (data.other_meds_known === "yes") return "other_med_entry";
      return isNonClinical(data) ? "primary_goal" : "monitoring_habit";
    case "other_med_entry":
      return "other_meds_more";
    case "other_meds_more":
      if (data.other_meds_more === "add") return "other_med_entry";
      return isNonClinical(data) ? "primary_goal" : "monitoring_habit";
    case "monitoring_habit":
      return data.monitoring_habit === "regularly" || data.monitoring_habit === "sometimes"
        ? "monitoring_device"
        : "primary_goal";
    case "monitoring_device":
      return "primary_goal";
    case "primary_goal":
      return "primary_challenge";
    case "primary_challenge":
      return "motivation_driver";
    case "motivation_driver":
      return "disclaimer";
    case "disclaimer":
      return null;
    default:
      return null;
  }
}

// Prompt for the current step.
async function promptStep(bot, chatId, session) {
  const lang = langOf(session);
  const s = session.step;
  switch (s) {
    case "name":
      return send(bot, chatId, t(lang, "ask_name_v2"), { markdown: true });
    case "user_type":
      return send(bot, chatId, t(lang, "ask_user_type"), {
        keyboard: userTypeKeyboard(lang),
        markdown: true,
      });
    case "age":
      return send(bot, chatId, t(lang, "ask_age_v2"), { markdown: true });
    case "gender":
      return send(bot, chatId, t(lang, "ask_gender"), {
        keyboard: genderKeyboardV2(lang),
        markdown: true,
      });
    case "city":
      return send(bot, chatId, t(lang, "ask_city_v2"), { markdown: true });
    case "diabetes_type":
      return send(bot, chatId, t(lang, "ask_diabetes_type"), {
        keyboard: diabetesTypeKeyboard(lang),
        markdown: true,
      });
    case "diagnosis_duration":
      return send(bot, chatId, t(lang, "ask_diagnosis_duration"), {
        keyboard: diagnosisDurationKeyboard(lang),
        markdown: true,
      });
    case "hba1c_known":
      return send(bot, chatId, t(lang, "ask_hba1c_known"), {
        keyboard: yesNoKeyboard(lang),
        markdown: true,
      });
    case "hba1c_value":
      return send(bot, chatId, t(lang, "ask_hba1c_value"), { markdown: true });
    case "hba1c_date":
      return send(bot, chatId, t(lang, "ask_hba1c_date"), {
        keyboard: hba1cDateKeyboard(lang),
        markdown: true,
      });
    case "sugar_known":
      return send(bot, chatId, t(lang, "ask_sugar_known"), {
        keyboard: yesNoKeyboard(lang),
        markdown: true,
      });
    case "fasting_value":
      return send(bot, chatId, t(lang, "ask_fasting_value"), { markdown: true });
    case "fasting_date":
      return send(bot, chatId, t(lang, "ask_fasting_date"), {
        keyboard: readingDateKeyboard(lang),
        markdown: true,
      });
    case "random_value":
      return send(bot, chatId, t(lang, "ask_random_value"), { markdown: true });
    case "random_date":
      return send(bot, chatId, t(lang, "ask_random_date"), {
        keyboard: readingDateKeyboard(lang),
        markdown: true,
      });
    case "diab_meds_known":
      return send(bot, chatId, t(lang, "ask_diab_meds_known"), {
        keyboard: yesNoKeyboard(lang),
        markdown: true,
      });
    case "diab_med_entry":
      return send(bot, chatId, t(lang, "ask_diab_med_entry"), { markdown: true });
    case "diab_meds_more":
      return send(bot, chatId, t(lang, "ask_diab_meds_more"), {
        keyboard: addMoreKeyboard(lang),
        markdown: true,
      });
    case "other_conditions_known":
      return send(bot, chatId, t(lang, "ask_other_conditions_known"), {
        keyboard: yesNoKeyboard(lang),
        markdown: true,
      });
    case "other_conditions_details":
      return send(bot, chatId, t(lang, "ask_other_conditions_details"), { markdown: true });
    case "other_meds_known":
      return send(bot, chatId, t(lang, "ask_other_meds_known"), {
        keyboard: yesNoKeyboard(lang),
        markdown: true,
      });
    case "other_med_entry":
      return send(bot, chatId, t(lang, "ask_other_med_entry"), { markdown: true });
    case "other_meds_more":
      return send(bot, chatId, t(lang, "ask_other_meds_more_prompt"), {
        keyboard: addMoreKeyboard(lang),
        markdown: true,
      });
    case "monitoring_habit":
      return send(bot, chatId, t(lang, "ask_monitoring_habit"), {
        keyboard: monitoringHabitKeyboard(lang),
        markdown: true,
      });
    case "monitoring_device":
      return send(bot, chatId, t(lang, "ask_monitoring_device"), {
        keyboard: monitoringDeviceKeyboard(lang),
        markdown: true,
      });
    case "primary_goal":
      return send(bot, chatId, t(lang, "ask_primary_goal"), {
        keyboard: primaryGoalKeyboard(lang),
        markdown: true,
      });
    case "primary_challenge":
      return send(bot, chatId, t(lang, "ask_primary_challenge"), {
        keyboard: challengeKeyboard(lang),
        markdown: true,
      });
    case "motivation_driver":
      return send(bot, chatId, t(lang, "ask_motivation_driver"), {
        keyboard: motivationKeyboard(lang),
        markdown: true,
      });
    case "disclaimer":
      return send(bot, chatId, t(lang, "disclaimer_v2"), {
        keyboard: understandKeyboard(lang),
        markdown: true,
      });
    default:
      return finish(bot, chatId, session);
  }
}

async function advance(bot, chatId, session) {
  const ns = nextStep(session.step, session.data);
  if (!ns) return finish(bot, chatId, session);
  session.step = ns;
  return promptStep(bot, chatId, session);
}

async function finish(bot, chatId, session) {
  const d = session.data;
  const lang = d.language || session.user?.language || "en";

  // Pack medication arrays as JSON strings for the jsonb columns; pg + Supabase
  // both accept stringified JSON for jsonb.
  const diabMedsJson = Array.isArray(d.diab_meds) && d.diab_meds.length
    ? JSON.stringify(d.diab_meds)
    : null;
  const otherMedsJson = Array.isArray(d.other_meds) && d.other_meds.length
    ? JSON.stringify(d.other_meds)
    : null;

  // Build 1 profile axes — derived from existing data, no extra onboarding step.
  // age_bracket: child <13, teen 13–17, adult ≥18. Falls back to null if age
  // unknown (we never ask separately, per the spec).
  let ageBracket = null;
  if (typeof d.age === "number") {
    if (d.age < 13) ageBracket = "child";
    else if (d.age < 18) ageBracket = "teen";
    else ageBracket = "adult";
  }
  // newly_diagnosed: anyone who picked "less than 1 year" for diagnosis duration.
  const newlyDiagnosed = d.diagnosis_duration === "lt1";

  const patch = {
    name: d.name ?? null,
    age: d.age ?? null,
    gender: d.gender ?? null,
    city: d.city ?? null,
    language: lang,
    user_type: d.user_type ?? null,
    date_of_birth: d.date_of_birth ?? null,
    diabetes_status: d.diabetes_type ?? null,
    diagnosis_duration: d.diagnosis_duration ?? null,
    age_bracket: ageBracket,
    newly_diagnosed: newlyDiagnosed,
    latest_hba1c: d.latest_hba1c ?? null,
    hba1c_date_bucket: d.hba1c_date_bucket ?? null,
    latest_fasting_sugar: d.latest_fasting_sugar ?? null,
    fasting_reading_date: d.fasting_reading_date ?? null,
    latest_random_sugar: d.latest_random_sugar ?? null,
    random_reading_date: d.random_reading_date ?? null,
    diabetes_meds: diabMedsJson,
    other_conditions: d.other_conditions ?? null,
    non_diabetes_meds: otherMedsJson,
    monitoring_habit: d.monitoring_habit ?? null,
    monitoring_device: d.monitoring_device ?? null,
    primary_goal: d.primary_goal ?? null,
    primary_challenge: d.primary_challenge ?? null,
    motivation_driver: d.motivation_driver ?? null,
    disclaimer_accepted: true,
    onboarded: true,
  };

  // Legacy single-line summary fields kept for backward compat with old code paths.
  if (Array.isArray(d.diab_meds) && d.diab_meds.length) {
    patch.medications = d.diab_meds.join("; ");
  }
  if (d.primary_goal) patch.goals = d.primary_goal;

  const updated = await updateUser(session.user.id, patch);
  session.user = updated;
  resetFlow(chatId);
  session.user = updated;
  await refreshKB(updated).catch(() => {});

  const name = sanitizeMd(updated.name || "");
  await send(bot, chatId, t(lang, "profile_complete_v2", { name }), { markdown: true });
  await send(bot, chatId, t(lang, "menu_title"), {
    keyboard: mainMenuKeyboard(lang),
    markdown: true,
  });
}

// ===================================================================
// Public entry points
// ===================================================================

// Kick off onboarding from the very start (welcome + language picker).
export async function startOnboarding(bot, chatId, session, scenario = "eng") {
  session.state = "onboarding";
  session.step = "welcome";
  session.data = {};
  return sendWelcomeWithLangPicker(bot, chatId, scenario);
}

// Handle typed answers during onboarding.
export async function onboardingText(bot, chatId, session, text) {
  const lang = langOf(session);
  const val = (text || "").trim();
  if (!val) return;

  switch (session.step) {
    case "welcome":
      // User typed instead of tapping a language button — re-prompt.
      return sendWelcomeWithLangPicker(bot, chatId, "eng");
    case "name": {
      const name = val.slice(0, 60);
      session.data.name = name;
      const first = name.split(/\s+/)[0] || name;
      session.data.first_name = first;
      await send(bot, chatId, t(lang, "name_ack", { name: sanitizeMd(first) }), { markdown: true });
      return advance(bot, chatId, session);
    }
    case "age": {
      // Accept either an age (1–120) or a date of birth string.
      const isPureNumber = /^\d{1,3}$/.test(val);
      if (isPureNumber) {
        const n = parseInt(val, 10);
        if (n < 1 || n > 120) return send(bot, chatId, t(lang, "invalid_number"));
        session.data.age = n;
      } else {
        // Treat as DOB free text. Try to extract a 4-digit year to derive age too.
        session.data.date_of_birth = val.slice(0, 40);
        const yearMatch = val.match(/(19|20)\d{2}/);
        if (yearMatch) {
          const yr = parseInt(yearMatch[0], 10);
          const thisYr = new Date().getFullYear();
          const derived = thisYr - yr;
          if (derived >= 1 && derived <= 120) session.data.age = derived;
        }
      }
      return advance(bot, chatId, session);
    }
    case "city":
      session.data.city = val.slice(0, 60);
      return advance(bot, chatId, session);
    case "hba1c_value": {
      const cleaned = val.replace(/%/g, "").trim();
      const n = parseFloat(cleaned);
      if (Number.isNaN(n) || n < 3 || n > 20) return send(bot, chatId, t(lang, "invalid_number"));
      session.data.latest_hba1c = n;
      return advance(bot, chatId, session);
    }
    case "fasting_value": {
      if (/^skip$/i.test(val)) {
        session.data.latest_fasting_sugar = null;
        session.step = "random_value";
        return promptStep(bot, chatId, session);
      }
      const n = parseFloat(val);
      if (Number.isNaN(n) || n < 30 || n > 700) return send(bot, chatId, t(lang, "invalid_number"));
      session.data.latest_fasting_sugar = n;
      return advance(bot, chatId, session);
    }
    case "random_value": {
      if (/^skip$/i.test(val)) {
        session.data.latest_random_sugar = null;
        session.step = "diab_meds_known";
        return promptStep(bot, chatId, session);
      }
      const n = parseFloat(val);
      if (Number.isNaN(n) || n < 30 || n > 700) return send(bot, chatId, t(lang, "invalid_number"));
      session.data.latest_random_sugar = n;
      return advance(bot, chatId, session);
    }
    case "diab_med_entry": {
      const entry = val.slice(0, 200);
      session.data.diab_meds = [...(session.data.diab_meds || []), entry];
      return advance(bot, chatId, session);
    }
    case "other_conditions_details":
      session.data.other_conditions = val.slice(0, 400);
      return advance(bot, chatId, session);
    case "other_med_entry": {
      const entry = val.slice(0, 200);
      session.data.other_meds = [...(session.data.other_meds || []), entry];
      return advance(bot, chatId, session);
    }
    // Steps that require button taps — gently nudge.
    case "user_type":
    case "gender":
    case "diabetes_type":
    case "diagnosis_duration":
    case "hba1c_known":
    case "hba1c_date":
    case "sugar_known":
    case "fasting_date":
    case "random_date":
    case "diab_meds_known":
    case "diab_meds_more":
    case "other_conditions_known":
    case "other_meds_known":
    case "other_meds_more":
    case "monitoring_habit":
    case "monitoring_device":
    case "primary_goal":
    case "primary_challenge":
    case "motivation_driver":
    case "disclaimer":
      return promptStep(bot, chatId, session);
    default:
      return;
  }
}

// Handle inline-button answers during onboarding.
export async function onboardingCallback(bot, chatId, session, data) {
  const [kind, value] = data.split(":");

  // Language picker — at "welcome" step (after the welcome banner).
  if (kind === "lang" && session.step === "welcome") {
    session.data.language = value;
    if (session.user) {
      // persist language eagerly so any later /menu reflects it
      try {
        const u = await updateUser(session.user.id, { language: value });
        session.user = u;
      } catch {
        /* best-effort */
      }
    }
    session.step = "name";
    return promptStep(bot, chatId, session);
  }

  if (kind === "ut" && session.step === "user_type") {
    session.data.user_type = value;
    return advance(bot, chatId, session);
  }
  if (kind === "gender" && session.step === "gender") {
    session.data.gender = value;
    return advance(bot, chatId, session);
  }
  if (kind === "dt" && session.step === "diabetes_type") {
    session.data.diabetes_type = value;
    return advance(bot, chatId, session);
  }
  if (kind === "dh" && session.step === "diagnosis_duration") {
    session.data.diagnosis_duration = value;
    return advance(bot, chatId, session);
  }
  if (kind === "yn") {
    const yn = value; // "yes" | "no"
    switch (session.step) {
      case "hba1c_known":
        session.data.hba1c_known = yn;
        return advance(bot, chatId, session);
      case "sugar_known":
        session.data.sugar_known = yn;
        return advance(bot, chatId, session);
      case "diab_meds_known":
        session.data.diab_meds_known = yn;
        return advance(bot, chatId, session);
      case "other_conditions_known":
        session.data.other_conditions_known = yn;
        return advance(bot, chatId, session);
      case "other_meds_known":
        session.data.other_meds_known = yn;
        return advance(bot, chatId, session);
      default:
        return;
    }
  }
  if (kind === "hd" && session.step === "hba1c_date") {
    session.data.hba1c_date_bucket = value;
    return advance(bot, chatId, session);
  }
  if (kind === "rd") {
    if (session.step === "fasting_date") {
      session.data.fasting_reading_date = value;
      return advance(bot, chatId, session);
    }
    if (session.step === "random_date") {
      session.data.random_reading_date = value;
      return advance(bot, chatId, session);
    }
  }
  if (kind === "more") {
    if (session.step === "diab_meds_more") {
      session.data.diab_meds_more = value;
      return advance(bot, chatId, session);
    }
    if (session.step === "other_meds_more") {
      session.data.other_meds_more = value;
      return advance(bot, chatId, session);
    }
  }
  if (kind === "mh" && session.step === "monitoring_habit") {
    session.data.monitoring_habit = value;
    return advance(bot, chatId, session);
  }
  if (kind === "md" && session.step === "monitoring_device") {
    session.data.monitoring_device = value;
    return advance(bot, chatId, session);
  }
  if (kind === "pg" && session.step === "primary_goal") {
    session.data.primary_goal = value;
    return advance(bot, chatId, session);
  }
  if (kind === "ch" && session.step === "primary_challenge") {
    session.data.primary_challenge = value;
    return advance(bot, chatId, session);
  }
  if (kind === "mt" && session.step === "motivation_driver") {
    session.data.motivation_driver = value;
    return advance(bot, chatId, session);
  }
  if (kind === "ok" && session.step === "disclaimer") {
    return finish(bot, chatId, session);
  }
}
