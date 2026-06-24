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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_TOKENS = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sept: 9, sep: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

// Best-effort DOB extractor. Returns a merge over `existing` of any fields it
// can pull from the new text. The flow re-prompts until day, month, and year
// are all set.
function parseDob(text, existing = {}) {
  const out = { day: existing.day ?? null, month: existing.month ?? null, year: existing.year ?? null };
  const lower = (text || "").toLowerCase();
  const currentYear = new Date().getFullYear();

  const sortedNames = Object.keys(MONTH_TOKENS).sort((a, b) => b.length - a.length);
  for (const name of sortedNames) {
    if (new RegExp(`\\b${name}\\b`).test(lower)) {
      out.month = MONTH_TOKENS[name];
      break;
    }
  }

  const iso = text.match(/\b(19\d{2}|20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/);
  if (iso) {
    out.year = out.year ?? parseInt(iso[1], 10);
    out.month = out.month ?? parseInt(iso[2], 10);
    out.day = out.day ?? parseInt(iso[3], 10);
  } else {
    const dmy = text.match(/\b(\d{1,2})[-\/.](\d{1,2})(?:[-\/.](\d{2,4}))?\b/);
    if (dmy) {
      const a = parseInt(dmy[1], 10);
      const b = parseInt(dmy[2], 10);
      if (a >= 1 && a <= 31 && b >= 1 && b <= 12) {
        out.day = out.day ?? a;
        out.month = out.month ?? b;
      } else if (a >= 1 && a <= 12 && b >= 1 && b <= 31) {
        out.month = out.month ?? a;
        out.day = out.day ?? b;
      }
      if (dmy[3]) {
        const yrNum = parseInt(dmy[3], 10);
        const fullYr = yrNum < 100 ? (yrNum > 30 ? 1900 + yrNum : 2000 + yrNum) : yrNum;
        out.year = out.year ?? fullYr;
      }
    }
  }

  if (!out.year) {
    const yr = text.match(/\b(19\d{2}|20\d{2})\b/);
    if (yr) out.year = parseInt(yr[1], 10);
  }

  if (out.month && !out.day) {
    const matches = [...text.matchAll(/\b(\d{1,2})\b/g)].map((m) => parseInt(m[1], 10));
    for (const n of matches) {
      if (n >= 1 && n <= 31) { out.day = n; break; }
    }
  }

  if (out.month && (out.month < 1 || out.month > 12)) out.month = null;
  if (out.day && (out.day < 1 || out.day > 31)) out.day = null;
  if (out.year && (out.year < 1900 || out.year > currentYear)) out.year = null;

  return out;
}

function dobMissingPieces(dob, lang) {
  const missing = [];
  if (!dob.day) missing.push(lang === "ur" ? "دن" : "day");
  if (!dob.month) missing.push(lang === "ur" ? "مہینہ" : "month");
  if (!dob.year) missing.push(lang === "ur" ? "سال" : "year");
  return missing;
}

function formatDob(dob) {
  return `${dob.day} ${MONTH_NAMES[dob.month - 1]} ${dob.year}`;
}

// Only user_type=diabetes goes through the full clinical funnel (diabetes type,
// diagnosis history, HbA1c, sugar readings, diabetes meds, monitoring habits).
// Everyone else (prediabetes, build-healthier, parent, exploring) skips the
// clinical block and jumps from city -> other_conditions.
function isNonClinical(data) {
  return data.user_type !== "diabetes";
}

// Compute the next step from the current one + collected data.
function nextStep(step, data) {
  switch (step) {
    case "name":
      return "user_type";
    case "user_type":
      // Ask "Do you know which type you have?" right after user_type, but
      // only for users who said they have diabetes.
      return data.user_type === "diabetes" ? "diabetes_type" : "dob";
    case "diabetes_type":
      return "dob";
    case "dob":
      return "gender";
    case "gender":
      return "city";
    case "city":
      if (isNonClinical(data)) return "other_conditions_known";
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
    case "dob":
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
      return send(
        bot,
        chatId,
        `${t(lang, "ask_primary_goal")}\n\n${t(lang, "multi_select_hint")}`,
        {
          keyboard: primaryGoalKeyboard(lang, session.data.primary_goals || []),
          markdown: true,
        }
      );
    case "primary_challenge":
      return send(
        bot,
        chatId,
        `${t(lang, "ask_primary_challenge")}\n\n${t(lang, "multi_select_hint")}`,
        {
          keyboard: challengeKeyboard(lang, session.data.primary_challenges || []),
          markdown: true,
        }
      );
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
    primary_goal: Array.isArray(d.primary_goals) && d.primary_goals.length
      ? d.primary_goals.join("; ")
      : null,
    primary_challenge: Array.isArray(d.primary_challenges) && d.primary_challenges.length
      ? d.primary_challenges.join("; ")
      : null,
    motivation_driver: d.motivation_driver ?? null,
    disclaimer_accepted: true,
    onboarded: true,
  };

  // Legacy single-line summary fields kept for backward compat with old code paths.
  if (Array.isArray(d.diab_meds) && d.diab_meds.length) {
    patch.medications = d.diab_meds.join("; ");
  }
  if (Array.isArray(d.primary_goals) && d.primary_goals.length) {
    patch.goals = d.primary_goals.map((k) => t(lang, `pg_${k}`)).join("; ");
  }

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
    case "dob": {
      const partial = parseDob(val, session.data.dob_partial || {});
      session.data.dob_partial = partial;
      const missing = dobMissingPieces(partial, lang);
      if (missing.length) {
        const missingStr = missing.length === 3
          ? (lang === "ur" ? "دن، مہینہ اور سال" : "day, month and year")
          : missing.join(lang === "ur" ? " اور " : " and ");
        return send(bot, chatId, t(lang, "ask_dob_missing", { missing: missingStr }), { markdown: true });
      }
      session.data.date_of_birth = formatDob(partial);
      const derivedAge = new Date().getFullYear() - partial.year;
      if (derivedAge >= 1 && derivedAge <= 120) session.data.age = derivedAge;
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
    const current = session.data.primary_goals || [];
    if (value === "__done") {
      if (!current.length) {
        // Need at least one selection — re-prompt with the same keyboard.
        return promptStep(bot, chatId, session);
      }
      return advance(bot, chatId, session);
    }
    const idx = current.indexOf(value);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(value);
    session.data.primary_goals = current;
    return promptStep(bot, chatId, session);
  }
  if (kind === "ch" && session.step === "primary_challenge") {
    const current = session.data.primary_challenges || [];
    if (value === "__done") {
      if (!current.length) {
        return promptStep(bot, chatId, session);
      }
      return advance(bot, chatId, session);
    }
    const idx = current.indexOf(value);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(value);
    session.data.primary_challenges = current;
    return promptStep(bot, chatId, session);
  }
  if (kind === "mt" && session.step === "motivation_driver") {
    session.data.motivation_driver = value;
    return advance(bot, chatId, session);
  }
  if (kind === "ok" && session.step === "disclaimer") {
    return finish(bot, chatId, session);
  }
}
