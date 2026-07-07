// Placeholder injection for the daily message composer.
//
// The composer's block texts carry {tokens} that are filled from the user's
// context at send time. This module is deliberately small and pure: it
// takes a template + a values bag and returns the final string.
//
// Contract: no raw `{...}` token may leave this function. If a template
// references a placeholder we don't have a value for (typo in a seed row,
// a new admin-added block using a key we don't know yet), the token is
// stripped and a warning is logged so the operator can find and fix the
// bad block by id.
//
// Supported placeholders and their safe fallbacks:
//
//   Token                    Value source                     Fallback
//   ─────                    ────────────                     ────────
//   {first_name_optional}    ", " + firstName if known        ""
//   {due_reminders}          localised comma-joined labels    lang default
//   {medication_name}        first medication reminder label  lang default
//   {reminder_time}          "HH:MM" from that reminder       lang default
//   {days_active_21d}        engagement.daysActiveInWindow    "0"

import { logWarn } from "./log.js";

const LANG_FALLBACKS = {
  english: {
    due_reminders:   "your daily check-in",
    medication_name: "your medicine",
    reminder_time:   "today",
  },
  roman_urdu: {
    due_reminders:   "aaj ka check-in",
    medication_name: "apni dawa",
    reminder_time:   "aaj",
  },
};

function fallbackFor(key, language) {
  return LANG_FALLBACKS[language]?.[key] ?? LANG_FALLBACKS.english[key] ?? "";
}

// Build the placeholder bag from the user + context objects the composer
// already has. Returns { key: string } — everything is stringified so the
// caller never has to guard for numbers/null.
export function buildValues({ user, language, firstName, dueReminders, medicationName, reminderTime, daysActive21d }) {
  const first = firstName || "";
  return {
    first_name_optional: first ? `, ${first}` : "",
    due_reminders:   dueReminders?.length ? dueReminders.join(", ") : fallbackFor("due_reminders", language),
    medication_name: medicationName || fallbackFor("medication_name", language),
    reminder_time:   reminderTime   || fallbackFor("reminder_time",   language),
    days_active_21d: String(daysActive21d ?? 0),
  };
}

const TOKEN_RE = /\{([a-z0-9_]+)\}/gi;

// `render(template, values, { blockId })` substitutes every {token} and
// sweeps up any leftovers. The optional blockId flows into the warn log so
// operators can find the offending row instantly.
export function render(template, values, { blockId } = {}) {
  if (!template) return "";
  let unknown = [];
  const filled = String(template).replace(TOKEN_RE, (_m, key) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) return String(values[key] ?? "");
    unknown.push(key);
    return "";
  });
  if (unknown.length) {
    logWarn(
      "composer placeholder",
      `unknown token(s) in ${blockId || "block"}: ${unknown.join(", ")} — stripped`
    );
  }
  // Collapse any double spaces left behind by an empty {first_name_optional}
  // and tidy stray whitespace around punctuation.
  return filled.replace(/ {2,}/g, " ").replace(/ +([.,!?])/g, "$1").trim();
}
