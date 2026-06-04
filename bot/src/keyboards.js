import { t, LANGUAGES } from "./i18n.js";

// Inline keyboards use callback_data (language-independent), so menus
// work the same regardless of the user's chosen language.

export function languageKeyboard() {
  return {
    inline_keyboard: LANGUAGES.map((l) => [{ text: l.label, callback_data: `lang:${l.code}` }]),
  };
}

export function genderKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "g_male"), callback_data: "gender:male" },
        { text: t(lang, "g_female"), callback_data: "gender:female" },
        { text: t(lang, "g_other"), callback_data: "gender:other" },
      ],
    ],
  };
}

export function diabetesKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "ds_type1"), callback_data: "ds:type1" },
        { text: t(lang, "ds_type2"), callback_data: "ds:type2" },
      ],
      [
        { text: t(lang, "ds_prediabetes"), callback_data: "ds:prediabetes" },
        { text: t(lang, "ds_gestational"), callback_data: "ds:gestational" },
      ],
      [
        { text: t(lang, "ds_atrisk"), callback_data: "ds:atrisk" },
        { text: t(lang, "ds_notsure"), callback_data: "ds:notsure" },
      ],
    ],
  };
}

export function skipKeyboard(lang) {
  return { inline_keyboard: [[{ text: t(lang, "btn_skip"), callback_data: "skip" }]] };
}

export function mainMenuKeyboard(lang) {
  const b = (key, action) => ({ text: t(lang, key), callback_data: `feat:${action}` });
  return {
    inline_keyboard: [
      [b("btn_glucose", "glucose"), b("btn_medication", "medication")],
      [b("btn_health", "health"), b("btn_progress", "progress")],
      [b("btn_coach", "coach"), b("btn_food", "food")],
      [b("btn_fitness", "fitness"), b("btn_lab", "lab")],
      [b("btn_summary", "summary"), b("btn_learn", "learn")],
      [b("btn_profile", "profile"), b("btn_subscription", "subscription")],
    ],
  };
}

export function backKeyboard(lang) {
  return { inline_keyboard: [[{ text: t(lang, "btn_back"), callback_data: "menu" }]] };
}

export function profileKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "change_language"), callback_data: "feat:language" }],
      [{ text: t(lang, "btn_back"), callback_data: "menu" }],
    ],
  };
}
