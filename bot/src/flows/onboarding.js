import { t } from "../i18n.js";
import { send, sanitizeMd, langOf } from "../utils.js";
import { userTypeKeyboard, mainMenuKeyboardV2, diabetesTypeKeyboard } from "../keyboards.js";
import { sendWelcomeWithLangPicker } from "../welcome.js";
import { updateUser } from "../supabase.js";
import { refreshKB } from "../kb.js";
import { resetFlow } from "../session.js";
import { startDoctorOnboarding } from "./doctorOnboarding.js";

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

// Minimal onboarding: language (via welcome) → name → birth date → user_type.
// The full clinical funnel, goals, motivation, disclaimer, etc. were removed —
// we can enrich the profile later via the drip flow.
function nextStep(step) {
  switch (step) {
    case "name":
      return "dob";
    case "dob":
      return "user_type";
    case "user_type":
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
    case "dob":
      return send(bot, chatId, t(lang, "ask_age_v2"), { markdown: true });
    case "user_type":
      return send(bot, chatId, t(lang, "ask_user_type"), {
        keyboard: userTypeKeyboard(lang),
        markdown: true,
      });
    default:
      return finish(bot, chatId, session);
  }
}

async function advance(bot, chatId, session) {
  const ns = nextStep(session.step);
  if (!ns) return finish(bot, chatId, session);
  session.step = ns;
  return promptStep(bot, chatId, session);
}

async function finish(bot, chatId, session) {
  const d = session.data;
  const lang = d.language || session.user?.language || "en";

  // age_bracket derived from the age we compute from date of birth. Null when
  // dob wasn't fully parsed.
  let ageBracket = null;
  if (typeof d.age === "number") {
    if (d.age < 13) ageBracket = "child";
    else if (d.age < 18) ageBracket = "teen";
    else ageBracket = "adult";
  }

  const patch = {
    language: lang,
    name: d.name ?? null,
    date_of_birth: d.date_of_birth ?? null,
    age: d.age ?? null,
    age_bracket: ageBracket,
    user_type: d.user_type ?? null,
    diabetes_status: d.diabetes_type ?? null,
    disclaimer_accepted: true,
    onboarded: true,
  };

  const updated = await updateUser(session.user.id, patch);
  session.user = updated;
  resetFlow(chatId);
  await refreshKB(updated).catch(() => {});

  const name = sanitizeMd(updated.name || "");
  const doneKey = name ? "profile_complete_v2" : "profile_complete_v2_noname";
  await send(bot, chatId, t(lang, doneKey, { name }), { markdown: true });
  await send(bot, chatId, t(lang, "menu_v2_title"), {
    keyboard: mainMenuKeyboardV2(lang, updated),
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
    // The remaining active step needs a button tap — nudge the user.
    case "user_type":
      return promptStep(bot, chatId, session);
    default:
      return;
  }
}

// Handle inline-button answers during onboarding.
export async function onboardingCallback(bot, chatId, session, data) {
  const [kind, value] = data.split(":");

  // Language picker — at "welcome" step (after the welcome banner). Jumps to
  // the name prompt; date of birth and user_type follow.
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
    // The five picks encode both user_type and diabetes_status; splitting them
    // back out keeps profile-menu routing (T1 community, etc.) working.
    // "doctor" is a special case — hands off to a dedicated doctor onboarding
    // flow rather than completing the patient profile here.
    if (value === "doctor") {
      return startDoctorOnboarding(bot, chatId, session);
    }
    const map = {
      type1:       { user_type: "diabetes",    diabetes_type: "type1" },
      type2:       { user_type: "diabetes",    diabetes_type: "type2" },
      prediabetes: { user_type: "prediabetes", diabetes_type: null },
      healthier:   { user_type: "healthier",   diabetes_type: null },
    };
    const m = map[value];
    if (m) {
      session.data.user_type = m.user_type;
      session.data.diabetes_type = m.diabetes_type;
    }
    return advance(bot, chatId, session);
  }
}

// Entry point used by the doctor onboarding flow when the doctor also wants
// personal patient use. At this point the users row is already flagged as
// user_type='doctor'; here we drive the patient-side questions (diabetes
// status via user_type_picker) to enrich the same profile. The doctors row is
// untouched — the doctor menu remains their landing screen.
export async function startPatientBranchForDoctor(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "doctor_patient_onboarding";
  session.step = "diabetes_type";
  if (!session.data) session.data = {};
  return send(bot, chatId, t(lang, "ask_diabetes_type"), {
    keyboard: diabetesTypeKeyboard(lang),
    markdown: true,
  });
}

// Handle the diabetes-type answer for a doctor who elected dual use. After
// this the doctor's profile carries a diabetes_status like a patient's.
export async function doctorPatientBranchCallback(bot, chatId, session, data) {
  const [kind, value] = data.split(":");
  if (kind !== "dt" || session.step !== "diabetes_type") return;

  const map = {
    type1:       { user_type: "diabetes",    diabetes_type: "type1" },
    type2:       { user_type: "diabetes",    diabetes_type: "type2" },
    gestational: { user_type: "diabetes",    diabetes_type: "gestational" },
    notsure:     { user_type: "diabetes",    diabetes_type: "notsure" },
  };
  const m = map[value];
  const patch = {
    // Keep user_type = 'doctor' — that's what drives menu selection. Save the
    // diabetes side onto diabetes_status so patient flows still work.
    diabetes_status: m?.diabetes_type ?? null,
    onboarded: true,
  };
  session.user = await updateUser(session.user.id, patch);
  resetFlow(chatId);
  await refreshKB(session.user).catch(() => {});
  const lang = langOf(session);
  const name = sanitizeMd(session.user.name || "");
  return send(bot, chatId, t(lang, "doc_menu_title", { name }), {
    keyboard: mainMenuKeyboardV2(lang, session.user),
    markdown: true,
  });
}
