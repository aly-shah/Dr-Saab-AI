// Welcome banner + greeting-scenario detection for the v2 journey.
//
// Three entry scenarios per spec:
//   eng    — "Hi" / "Hello" / "Hey" (or /start)        → English welcome
//   salaam — "Salaam" / "As Salaam Alaikum" / "ASA"     → English welcome (Walaikumussalam prefix)
//   urdu   — "السلام علیکم"                            → Native-Urdu welcome
// All three show the same 3-button language picker.

import { t } from "./i18n.js";
import { send } from "./utils.js";

function langPickerKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "English", callback_data: "lang:en" }],
      [{ text: "اردو", callback_data: "lang:ur" }],
      [{ text: "WhatsApp Urdu", callback_data: "lang:roman_ur" }],
    ],
  };
}

const SCENARIO_KEYS = {
  eng: "welcome_eng",
  salaam: "welcome_salaam",
  urdu: "welcome_urdu_intent",
};

// Native Urdu greeting → Urdu welcome. Everything else uses English copy.
function scenarioLang(scenario) {
  return scenario === "urdu" ? "ur" : "en";
}

export async function sendWelcomeWithLangPicker(bot, chatId, scenario = "eng") {
  const key = SCENARIO_KEYS[scenario] || "welcome_eng";
  const lang = scenarioLang(scenario);
  await send(bot, chatId, t(lang, key), { keyboard: langPickerKeyboard(), markdown: true });
}

// Returns "eng" | "salaam" | "urdu" | null.
export function detectGreetingScenario(text) {
  if (!text) return null;
  const s = String(text).trim();
  if (!s) return null;

  // Urdu script salam first.
  if (/السلام\s*ع?ل?ی?ک?م?/.test(s)) return "urdu";

  const lower = s.toLowerCase();

  // Latin salaam variants. Check before generic English greetings since
  // "as" alone counts too.
  if (
    /^as$/.test(lower) ||
    /^asa$/.test(lower) ||
    /^a\.?s\.?a?\.?$/.test(lower) ||
    /\bassalam/.test(lower) ||
    /\bas[-\s]*salaa?m/.test(lower) ||
    /^salaa?m[\s!.,?]*$/.test(lower) ||
    /^salaa?m\s+(alaikum|aleikum|alekum|walekum)/.test(lower) ||
    /walaikum/.test(lower)
  ) {
    return "salaam";
  }

  // Generic English greetings.
  if (/^(hi+|hello+|hey+|helo+|hola)[\s!.,?]*$/.test(lower)) return "eng";

  return null;
}
