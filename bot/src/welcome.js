// Welcome banner + greeting-scenario detection for the v2 journey.
//
// Three entry scenarios per spec:
//   eng    — "Hi" / "Hello" / "Hey" (or /start)        → English welcome
//   salaam — "Salaam" / "As Salaam Alaikum" / "ASA"     → English welcome (Walaikumussalam prefix)
//   urdu   — "السلام علیکم"                            → Native-Urdu welcome
// There is no language picker any more (2026-09-22): the scenario sets
// the starting language and users can switch later under More → Language.

import { t } from "./i18n.js";
import { send } from "./utils.js";

const SCENARIO_KEYS = {
  eng: "welcome_eng",
  salaam: "welcome_salaam",
  urdu: "welcome_urdu_intent",
};

// Native Urdu greeting → Urdu welcome. Everything else uses English copy.
export function scenarioLang(scenario) {
  return scenario === "urdu" ? "ur" : "en";
}

export async function sendWelcome(bot, chatId, scenario = "eng", lang = scenarioLang(scenario)) {
  const key = SCENARIO_KEYS[scenario] || "welcome_eng";
  // keepEmoji: the welcome banner intentionally shows the 👋 wave.
  await send(bot, chatId, t(lang, key), { markdown: true, keepEmoji: true });
}

// The Facebook "join the page" ad opens WhatsApp with a pre-filled
// "How can I join the DrSaab Community?". Any "join" + "DrSaab" message
// counts, so small edits to the ad text keep working. "DrSaab" is required
// so "join the Type 1 community" still reaches the T1 Community feature.
export function isJoinMessage(text) {
  if (!text) return false;
  const s = String(text).toLowerCase();
  return /\bjoin/.test(s) && /dr\.?\s*saa?b/.test(s);
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
