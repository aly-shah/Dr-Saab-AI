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
  // Single layout for everyone; paid/executive-only features gate on tap with
  // an Upgrade prompt (per proposal 3.9). Weekly summary now lives under Reports.
  return {
    inline_keyboard: [
      [b("btn_glucose", "glucose"), b("btn_medication", "medication")],
      [b("btn_health", "health"), b("btn_food", "food")],
      [b("btn_coach", "coach"), b("btn_fitness", "fitness")],
      [b("btn_lab", "lab"), b("btn_goals", "goals")],
      [b("btn_challenges", "challenges"), b("btn_progress", "progress")],
      [b("btn_reports", "reports"), b("btn_learn", "learn")],
      [b("btn_executive", "executive"), b("btn_profile", "profile")],
      [b("btn_subscription", "subscription")],
    ],
  };
}

// Shown when a free user taps a paid feature: View Plans / Maybe Later.
export function upgradeKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_view_plans"), callback_data: "feat:subscription" },
        { text: t(lang, "btn_maybe_later"), callback_data: "menu" },
      ],
    ],
  };
}

export function goalsKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_set_goal"), callback_data: "goal:set" }],
      [{ text: t(lang, "btn_back"), callback_data: "menu" }],
    ],
  };
}

export function reportsKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_report_weekly"), callback_data: "rep:weekly" }],
      [{ text: t(lang, "btn_report_monthly"), callback_data: "rep:monthly" }],
      [{ text: t(lang, "btn_report_doctor"), callback_data: "rep:doctor" }],
      [{ text: t(lang, "btn_back"), callback_data: "menu" }],
    ],
  };
}

// Feature challenges keyboard (prefix `chl:` — distinct from onboarding `ch:`).
export function challengesKeyboard(lang) {
  return stack([
    { text: t(lang, "chl_a1c"), callback_data: "chl:a1c" },
    { text: t(lang, "chl_weight"), callback_data: "chl:weight" },
    { text: t(lang, "chl_walking"), callback_data: "chl:walking" },
    { text: t(lang, "chl_consistency"), callback_data: "chl:consistency" },
    { text: t(lang, "chl_ramadan"), callback_data: "chl:ramadan" },
    { text: t(lang, "chl_doctor"), callback_data: "chl:doctor" },
    { text: t(lang, "chl_corporate"), callback_data: "chl:corporate" },
    [
      { text: t(lang, "btn_my_challenges"), callback_data: "chl:mine" },
      { text: t(lang, "btn_back"), callback_data: "menu" },
    ],
  ]);
}

// Background-profile drip question: answer by typing, or Skip.
export function profileqKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_skip"), callback_data: "pq:skip" },
        { text: t(lang, "btn_back"), callback_data: "menu" },
      ],
    ],
  };
}

export function executiveKeyboard(lang) {
  return stack([
    { text: t(lang, "btn_exec_doctor"), callback_data: "ex:doctor_review" },
    { text: t(lang, "btn_exec_session"), callback_data: "ex:live_session" },
    { text: t(lang, "btn_exec_review"), callback_data: "ex:progress_review" },
    { text: t(lang, "btn_exec_priority"), callback_data: "ex:priority_help" },
    { text: t(lang, "btn_exec_content"), callback_data: "ex:premium_content" },
    { text: t(lang, "btn_back"), callback_data: "menu" },
  ]);
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

// ===================================================================
// v2 onboarding journey keyboards
// ===================================================================

// One button per row helper.
function stack(rows) {
  return { inline_keyboard: rows.map((r) => (Array.isArray(r) ? r : [r])) };
}

export function userTypeKeyboard(lang) {
  return stack([
    { text: t(lang, "ut_diabetes"), callback_data: "ut:diabetes" },
    { text: t(lang, "ut_prediabetes"), callback_data: "ut:prediabetes" },
    { text: t(lang, "ut_notsure"), callback_data: "ut:notsure" },
    { text: t(lang, "ut_parent"), callback_data: "ut:parent" },
    { text: t(lang, "ut_exploring"), callback_data: "ut:exploring" },
  ]);
}

export function genderKeyboardV2(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "g_male"), callback_data: "gender:male" },
        { text: t(lang, "g_female"), callback_data: "gender:female" },
      ],
      [{ text: t(lang, "g_prefer_not"), callback_data: "gender:prefer_not" }],
    ],
  };
}

export function diabetesTypeKeyboard(lang) {
  return stack([
    [
      { text: t(lang, "dt_type1"), callback_data: "dt:type1" },
      { text: t(lang, "dt_type2"), callback_data: "dt:type2" },
    ],
    [
      { text: t(lang, "dt_prediabetes"), callback_data: "dt:prediabetes" },
      { text: t(lang, "dt_gestational"), callback_data: "dt:gestational" },
    ],
    { text: t(lang, "dt_notsure"), callback_data: "dt:notsure" },
  ]);
}

export function diagnosisDurationKeyboard(lang) {
  return stack([
    { text: t(lang, "dh_lt1"), callback_data: "dh:lt1" },
    { text: t(lang, "dh_1_5"), callback_data: "dh:1_5" },
    { text: t(lang, "dh_6_10"), callback_data: "dh:6_10" },
    { text: t(lang, "dh_gt10"), callback_data: "dh:gt10" },
    { text: t(lang, "dh_notsure"), callback_data: "dh:notsure" },
  ]);
}

export function yesNoKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_yes"), callback_data: "yn:yes" },
        { text: t(lang, "btn_no"), callback_data: "yn:no" },
      ],
    ],
  };
}

export function hba1cDateKeyboard(lang) {
  return stack([
    { text: t(lang, "hd_1m"), callback_data: "hd:1m" },
    { text: t(lang, "hd_1_3"), callback_data: "hd:1_3" },
    { text: t(lang, "hd_3_6"), callback_data: "hd:3_6" },
    { text: t(lang, "hd_gt6"), callback_data: "hd:gt6" },
  ]);
}

export function readingDateKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "rd_today"), callback_data: "rd:today" },
        { text: t(lang, "rd_week"), callback_data: "rd:week" },
      ],
      [
        { text: t(lang, "rd_month"), callback_data: "rd:month" },
        { text: t(lang, "rd_notremember"), callback_data: "rd:notremember" },
      ],
    ],
  };
}

export function addMoreKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_add_another"), callback_data: "more:add" },
        { text: t(lang, "btn_no_more"), callback_data: "more:no" },
      ],
    ],
  };
}

export function monitoringHabitKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "mh_regularly"), callback_data: "mh:regularly" },
        { text: t(lang, "mh_sometimes"), callback_data: "mh:sometimes" },
      ],
      [
        { text: t(lang, "mh_rarely"), callback_data: "mh:rarely" },
        { text: t(lang, "mh_never"), callback_data: "mh:never" },
      ],
    ],
  };
}

export function monitoringDeviceKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "md_glucometer"), callback_data: "md:glucometer" },
        { text: t(lang, "md_cgm"), callback_data: "md:cgm" },
      ],
      [{ text: t(lang, "md_both"), callback_data: "md:both" }],
    ],
  };
}

export function primaryGoalKeyboard(lang) {
  return stack([
    { text: t(lang, "pg_lower_a1c"), callback_data: "pg:lower_a1c" },
    { text: t(lang, "pg_lose_weight"), callback_data: "pg:lose_weight" },
    { text: t(lang, "pg_eat_healthy"), callback_data: "pg:eat_healthy" },
    { text: t(lang, "pg_exercise"), callback_data: "pg:exercise" },
    { text: t(lang, "pg_consistent"), callback_data: "pg:consistent" },
    { text: t(lang, "pg_understand"), callback_data: "pg:understand" },
  ]);
}

export function challengeKeyboard(lang) {
  return stack([
    [
      { text: t(lang, "ch_diet"), callback_data: "ch:diet" },
      { text: t(lang, "ch_exercise"), callback_data: "ch:exercise" },
    ],
    [
      { text: t(lang, "ch_motivation"), callback_data: "ch:motivation" },
      { text: t(lang, "ch_meds"), callback_data: "ch:meds" },
    ],
    [
      { text: t(lang, "ch_stress"), callback_data: "ch:stress" },
      { text: t(lang, "ch_time"), callback_data: "ch:time" },
    ],
    { text: t(lang, "ch_understand"), callback_data: "ch:understand" },
  ]);
}

export function motivationKeyboard(lang) {
  return stack([
    [
      { text: t(lang, "mt_family"), callback_data: "mt:family" },
      { text: t(lang, "mt_health"), callback_data: "mt:health" },
    ],
    [
      { text: t(lang, "mt_longer"), callback_data: "mt:longer" },
      { text: t(lang, "mt_complications"), callback_data: "mt:complications" },
    ],
    { text: t(lang, "mt_looking"), callback_data: "mt:looking" },
    { text: t(lang, "mt_faith"), callback_data: "mt:faith" },
  ]);
}

export function understandKeyboard(lang) {
  return {
    inline_keyboard: [[{ text: t(lang, "btn_understand"), callback_data: "ok:understand" }]],
  };
}

// ===================================================================
// Build 1 menu hierarchy (simplified spec, 2-level cap)
// ===================================================================

// New 6-item top menu per the Build 1 spec. Old features (Challenges, Goals,
// Executive) move under "More" — see moreKeyboard below — so nothing is lost.
export function mainMenuKeyboardV2(lang) {
  const b = (key, action) => ({ text: t(lang, key), callback_data: `feat:${action}` });
  return stack([
    b("btn_checkin", "checkin"),
    b("btn_foodhelp", "foodhelp"),
    b("btn_checkreport", "lab"),
    b("btn_myprogress", "myprogress"),
    b("btn_askdrsaab", "askdrsaab"),
    b("btn_more", "more"),
  ]);
}

export function checkInKeyboard(lang) {
  const b = (key, action) => ({ text: t(lang, key), callback_data: `ci:${action}` });
  return stack([
    b("btn_ci_bloodsugar", "bsugar"),
    b("btn_ci_medication", "med"),
    b("btn_ci_weight", "weight"),
    b("btn_ci_activity", "activity"),
    b("btn_ci_symptoms", "symptoms"),
    { text: t(lang, "btn_main_menu"), callback_data: "menu" },
  ]);
}

export function foodHelpKeyboard(lang) {
  const b = (key, action) => ({ text: t(lang, key), callback_data: `fh:${action}` });
  return stack([
    b("btn_fh_analyze", "analyze"),
    b("btn_fh_caneat", "caneat"),
    b("btn_fh_restaurant", "restaurant"),
    b("btn_fh_snacks", "snacks"),
    { text: t(lang, "btn_main_menu"), callback_data: "menu" },
  ]);
}

export function myProgressKeyboard(lang) {
  const b = (key, action) => ({ text: t(lang, key), callback_data: `mp:${action}` });
  return stack([
    b("btn_mp_weekly", "weekly"),
    b("btn_mp_monthly", "monthly"),
    b("btn_mp_trends", "trends"),
    b("btn_mp_recent", "recent"),
    { text: t(lang, "btn_main_menu"), callback_data: "menu" },
  ]);
}

// More — also home to Challenges / Goals / Executive (kept, not deleted).
export function moreKeyboard(lang) {
  const b = (key, action) => ({ text: t(lang, key), callback_data: `mo:${action}` });
  return stack([
    b("btn_more_reminders", "reminders"),
    b("btn_more_language", "language"),
    b("btn_more_plan", "plan"),
    b("btn_more_subscription", "subscription"),
    b("btn_more_support", "support"),
    b("btn_more_goals", "goals"),
    b("btn_more_challenges", "challenges"),
    b("btn_more_executive", "executive"),
    { text: t(lang, "btn_main_menu"), callback_data: "menu" },
  ]);
}

export function medFrequencyKeyboard(lang) {
  return stack([
    { text: t(lang, "btn_med_freq_once"), callback_data: "medfreq:once_daily" },
    { text: t(lang, "btn_med_freq_morn_eve"), callback_data: "medfreq:morning_evening" },
    { text: t(lang, "btn_med_freq_three"), callback_data: "medfreq:three_times" },
    { text: t(lang, "btn_med_freq_other"), callback_data: "medfreq:other" },
  ]);
}

// Generic "want a reminder?" yes/no with a typed key so the callback handler
// can tell which flow it belongs to.
export function reminderOfferKeyboard(lang, key) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_yes"), callback_data: `remoffer:${key}:yes` },
        { text: t(lang, "btn_no"), callback_data: `remoffer:${key}:no` },
      ],
    ],
  };
}

export function reminderFrequencyKeyboard(lang) {
  return stack([
    { text: t(lang, "btn_freq_daily"), callback_data: "remfreq:1" },
    { text: t(lang, "btn_freq_3x_week"), callback_data: "remfreq:2" },
    { text: t(lang, "btn_freq_weekly"), callback_data: "remfreq:7" },
  ]);
}

export function activityDaysKeyboard(lang) {
  return {
    inline_keyboard: [
      [1, 2, 3, 4].map((n) => ({ text: String(n), callback_data: `actgoal:${n}` })),
      [5, 6, 7].map((n) => ({ text: String(n), callback_data: `actgoal:${n}` })),
    ],
  };
}

// Render the user's active reminders with a Cancel button on each row.
export function remindersListKeyboard(lang, items) {
  const rows = items.map((r) => [
    { text: t(lang, "btn_reminder_cancel", { label: r.label || r.category }).slice(0, 60), callback_data: `remcancel:${r.id}` },
  ]);
  rows.push([{ text: t(lang, "btn_back"), callback_data: "feat:more" }]);
  return { inline_keyboard: rows };
}
