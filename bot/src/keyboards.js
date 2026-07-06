import { t, LANGUAGES } from "./i18n.js";
import { isPaid } from "./tiers.js";

// Inline keyboards use callback_data (language-independent), so menus
// work the same regardless of the user's chosen language.

export function languageKeyboard(lang = "en", currentCode = lang, backCb = "menu") {
  // Prefix the currently-selected language with ● (and others with ○) so the
  // user can see at a glance which one is active. Geometric shapes survive the
  // emoji stripper in utils.js.
  return {
    inline_keyboard: [
      ...LANGUAGES.map((l) => [{
        text: `${l.code === currentCode ? "●" : "○"} ${l.label}`,
        callback_data: `lang:${l.code}`,
      }]),
      [{ text: t(lang, "btn_back"), callback_data: backCb }],
    ],
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

// Legacy single-goal keyboard, kept so any old deep-link that lands on it still
// works. New flow starts from goalsListKeyboard below.
export function goalsKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_set_goal"), callback_data: "goal:add" }],
      [{ text: t(lang, "btn_back"), callback_data: "menu" }],
    ],
  };
}

// ---- My Goals (2026-07): up to 3 active goals per user ----
export const GOAL_MAX_ACTIVE = 3;

// Suggestion keys map to i18n strings `goalsug_<key>`. `other` opens a
// free-text prompt. Order matches the spec.
export const GOAL_SUGGESTIONS = [
  "lower_a1c",
  "lose_weight",
  "exercise_more",
  "walk_more",
  "improve_blood_sugar",
  "take_meds",
  "eat_healthy",
  "improve_cholesterol",
  "improve_bp",
  "sleep_better",
  "prepare_surgery",
  "run_5k",
];

// Home screen for My Goals: one row per active goal (opens detail), plus
// "Add a goal" if under the cap. Empty state falls back to just Add + Back.
export function goalsListKeyboard(lang, activeGoals = []) {
  const rows = [];
  for (const g of activeGoals) {
    const label = truncate(g.title || "goal", 40);
    rows.push([{ text: label, callback_data: `goal:view:${g.id}` }]);
  }
  if (activeGoals.length < GOAL_MAX_ACTIVE) {
    rows.push([{ text: t(lang, "btn_goal_add"), callback_data: "goal:add" }]);
  }
  rows.push([{ text: t(lang, "btn_back"), callback_data: "menu" }]);
  return { inline_keyboard: rows };
}

export function goalSuggestionsKeyboard(lang) {
  const rows = [];
  for (let i = 0; i < GOAL_SUGGESTIONS.length; i += 2) {
    const row = [];
    for (const key of GOAL_SUGGESTIONS.slice(i, i + 2)) {
      row.push({ text: t(lang, `goalsug_${key}`), callback_data: `goalsug:${key}` });
    }
    rows.push(row);
  }
  rows.push([{ text: t(lang, "goalsug_other"), callback_data: "goalsug:other" }]);
  rows.push([{ text: t(lang, "btn_back"), callback_data: "feat:goals" }]);
  return { inline_keyboard: rows };
}

// Motivation / target-date prompt: single Skip button (both fields are optional).
export function goalSkipKeyboard(lang, action) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_skip"), callback_data: `goal:skip:${action}` }],
      [{ text: t(lang, "btn_back"), callback_data: "feat:goals" }],
    ],
  };
}

// Detail view for a single active goal — edit / mark complete / delete.
export function goalDetailKeyboard(lang, goalId) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_goal_edit"), callback_data: `goal:edit:${goalId}` }],
      [{ text: t(lang, "btn_goal_complete"), callback_data: `goal:complete:${goalId}` }],
      [{ text: t(lang, "btn_goal_delete"), callback_data: `goal:delete:${goalId}` }],
      [{ text: t(lang, "btn_back"), callback_data: "feat:goals" }],
    ],
  };
}

export function goalEditKeyboard(lang, goalId) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_goal_edit_title"), callback_data: `goaledit:${goalId}:title` }],
      [{ text: t(lang, "btn_goal_edit_motivation"), callback_data: `goaledit:${goalId}:motivation` }],
      [{ text: t(lang, "btn_goal_edit_target"), callback_data: `goaledit:${goalId}:target` }],
      [{ text: t(lang, "btn_back"), callback_data: `goal:view:${goalId}` }],
    ],
  };
}

// Target-date reminder — Yes / Not Yet.
export function goalReviewKeyboard(lang, goalId) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_goal_review_yes"), callback_data: `goalrev:${goalId}:yes` },
        { text: t(lang, "btn_goal_review_notyet"), callback_data: `goalrev:${goalId}:notyet` },
      ],
    ],
  };
}

// Follow-up when the user says Yes (goal achieved).
export function goalReviewYesKeyboard(lang, goalId) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_goal_review_new"), callback_data: `goalrev:${goalId}:new` }],
      [{ text: t(lang, "btn_goal_review_continue"), callback_data: `goalrev:${goalId}:continue` }],
      [{ text: t(lang, "btn_goal_review_remove"), callback_data: `goalrev:${goalId}:remove` }],
    ],
  };
}

// Follow-up when the user says Not Yet.
export function goalReviewNotYetKeyboard(lang, goalId) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_goal_review_continue"), callback_data: `goalrev:${goalId}:continue` }],
      [{ text: t(lang, "btn_goal_review_update_target"), callback_data: `goalrev:${goalId}:updatetarget` }],
      [{ text: t(lang, "btn_goal_review_remove"), callback_data: `goalrev:${goalId}:remove` }],
    ],
  };
}

function truncate(s, n) {
  const str = String(s || "");
  return str.length <= n ? str : str.slice(0, n - 1) + "…";
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

// `target` is the callback_data the Back button fires. Defaults to "menu"
// (main menu). Pass e.g. "feat:subscription" to bounce back to a parent
// screen from a nested one.
export function backKeyboard(lang, target = "menu") {
  return { inline_keyboard: [[{ text: t(lang, "btn_back"), callback_data: target }]] };
}

// Keyboard shown on the "Explain My Report" prompt. The "Upload Image" button
// is a UX affordance: the web chat frontend intercepts it and opens a native
// file picker; on Telegram / WhatsApp it just prints instructions on where to
// find the attach control in that client.
export function labStartKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_upload_lab"), callback_data: "feat:upload_lab" }],
      [{ text: t(lang, "btn_back"), callback_data: "menu" }],
    ],
  };
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
    { text: t(lang, "ut_healthier"), callback_data: "ut:healthier" },
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
  // Prediabetes intentionally omitted — already covered by the user_type
  // question ("I have prediabetes") asked one step earlier.
  return stack([
    [
      { text: t(lang, "dt_type1"), callback_data: "dt:type1" },
      { text: t(lang, "dt_type2"), callback_data: "dt:type2" },
    ],
    { text: t(lang, "dt_gestational"), callback_data: "dt:gestational" },
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

// Multi-select label decorator. Uses geometric shapes (●/○) so cleanKeyboard
// (which strips most emoji/symbols) leaves them intact.
function markSelected(label, selected) {
  return `${selected ? "●" : "○"} ${label}`;
}

export function primaryGoalKeyboard(lang, selected = []) {
  const sel = new Set(selected);
  const opt = (key, val) => ({
    text: markSelected(t(lang, key), sel.has(val)),
    callback_data: `pg:${val}`,
  });
  return stack([
    opt("pg_lower_a1c", "lower_a1c"),
    opt("pg_lose_weight", "lose_weight"),
    opt("pg_eat_healthy", "eat_healthy"),
    opt("pg_exercise", "exercise"),
    opt("pg_consistent", "consistent"),
    opt("pg_understand", "understand"),
    { text: t(lang, "btn_multi_done"), callback_data: "pg:__done" },
  ]);
}

export function challengeKeyboard(lang, selected = []) {
  const sel = new Set(selected);
  const opt = (key, val) => ({
    text: markSelected(t(lang, key), sel.has(val)),
    callback_data: `ch:${val}`,
  });
  return stack([
    [opt("ch_diet", "diet"), opt("ch_exercise", "exercise")],
    [opt("ch_motivation", "motivation"), opt("ch_meds", "meds")],
    [opt("ch_stress", "stress"), opt("ch_time", "time")],
    opt("ch_understand", "understand"),
    { text: t(lang, "btn_multi_done"), callback_data: "ch:__done" },
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
// A single profile-based row is prepended above the defaults when the user's
// onboarding selection matches one of the special-case profiles.
export function mainMenuKeyboardV2(lang, user) {
  const b = (key, action) => ({ text: t(lang, key), callback_data: `feat:${action}` });
  const rows = [];
  const profileBtn = profileMenuButton(lang, user);
  if (profileBtn) rows.push(profileBtn);
  rows.push(
    b("btn_checkin", "checkin"),
    b("btn_foodhelp", "foodhelp"),
    b("btn_checkreport", "lab"),
    b("btn_myprogress", "myprogress"),
    b("btn_askdrsaab", "askdrsaab"),
    b("btn_more", "more"),
  );
  return stack(rows);
}

// Maps a user's onboarding profile to the one condition-specific menu button
// they should see. Returns null for Type 2 and other users who get only the
// default six items.
function profileMenuButton(lang, user) {
  const b = (key, action) => ({ text: t(lang, key), callback_data: `pfl:${action}` });
  const ut = user?.user_type;
  const dt = user?.diabetes_status;
  if (ut === "diabetes" && dt === "type1") return b("btn_p_type1", "type1");
  if (ut === "diabetes" && dt === "type2") return b("btn_p_type2", "type2");
  if (ut === "diabetes" && dt === "gestational") return b("btn_p_gestational", "gestational");
  if (ut === "prediabetes") return b("btn_p_prediabetes", "prediabetes");
  if (ut === "healthier") return b("btn_p_healthier", "healthier");
  return null;
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
    b("btn_fh_label", "label"),
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

// More — spec 2026-07: four items only (Reminders, Language, Subscription,
// Account). Goals / Challenges / Executive stay callable via their `feat:`
// deep links (Goals is still on the top-level menu as "Goals & Progress");
// they're just no longer surfaced from this screen.
export function moreKeyboard(lang) {
  const b = (key, action) => ({ text: t(lang, key), callback_data: `mo:${action}` });
  return stack([
    b("btn_more_reminders", "reminders"),
    b("btn_more_language", "language"),
    b("btn_more_subscription_v2", "subscription"),
    b("btn_more_account", "account"),
    { text: t(lang, "btn_main_menu"), callback_data: "menu" },
  ]);
}

// Reminders category prefs — one row per category with an inline On/Off state.
// The scheduler consults these master flags before firing any reminder in that
// category, so a "medication" row set to Off silences every med schedule the
// user has without deleting them.
export const REMINDER_CATEGORIES = [
  { key: "blood_sugar",     labelKey: "rem_cat_blood_sugar",     icon: "🩸", prefField: "pref_rem_blood_sugar" },
  { key: "med_consistency", labelKey: "rem_cat_medication",      icon: "💊", prefField: "pref_rem_med_consistency" },
  { key: "goals",           labelKey: "rem_cat_goals",           icon: "🎯", prefField: "pref_rem_goals" },
  { key: "coaching",        labelKey: "rem_cat_coaching",        icon: "💬", prefField: "pref_rem_coaching" },
];

export function remindersPrefsKeyboard(lang, user) {
  const rows = REMINDER_CATEGORIES.map((cat) => {
    // Default true when the column hasn't been set — matches the schema default.
    const on = user?.[cat.prefField] !== false;
    const label = t(lang, "rem_pref_row", {
      icon: cat.icon,
      label: t(lang, cat.labelKey).replace(/^\S+\s/, ""),
      state: t(lang, on ? "rem_cat_on" : "rem_cat_off"),
    });
    return { text: label, callback_data: `remp:${cat.key}` };
  });
  rows.push({ text: t(lang, "btn_back"), callback_data: "feat:more" });
  return stack(rows);
}

// Subscription screen. Manage / Billing only appear for paid users — free
// users just see Upgrade + Back.
export function subscriptionKeyboard(lang, user) {
  const rows = [{ text: t(lang, "btn_sub_upgrade"), callback_data: "sub:upgrade" }];
  if (isPaid(user)) {
    rows.push({ text: t(lang, "btn_sub_manage"), callback_data: "sub:manage" });
    rows.push({ text: t(lang, "btn_sub_billing"), callback_data: "sub:billing" });
  }
  rows.push({ text: t(lang, "btn_back"), callback_data: "feat:more" });
  return stack(rows);
}

export function accountKeyboard(lang) {
  return stack([
    { text: t(lang, "btn_account_edit"), callback_data: "acct:edit" },
    { text: t(lang, "btn_account_deactivate"), callback_data: "acct:deactivate" },
    { text: t(lang, "btn_account_close"), callback_data: "acct:close" },
    { text: t(lang, "btn_back"), callback_data: "feat:more" },
  ]);
}

// Confirmation dialogs for Deactivate / Close. Two-button rows so the
// destructive action sits next to Cancel and can't be mistapped from a menu.
export function deactivateConfirmKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_confirm_deactivate"), callback_data: "acct:deactivate_confirm" },
        { text: t(lang, "btn_cancel"), callback_data: "feat:account" },
      ],
    ],
  };
}

export function closeConfirmKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_confirm_close"), callback_data: "acct:close_confirm" },
        { text: t(lang, "btn_cancel"), callback_data: "feat:account" },
      ],
    ],
  };
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

// ---- Check-In v2 keyboards (2026-07) ----

export function wellbeingMoodKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "wb_btn_great"), callback_data: "wb:great" },
        { text: t(lang, "wb_btn_good"), callback_data: "wb:good" },
      ],
      [{ text: t(lang, "wb_btn_okay"), callback_data: "wb:okay" }],
      [
        { text: t(lang, "wb_btn_notgreat"), callback_data: "wb:notgreat" },
        { text: t(lang, "wb_btn_poor"), callback_data: "wb:poor" },
      ],
      [{ text: t(lang, "btn_main_menu"), callback_data: "menu" }],
    ],
  };
}

// T1 Community — top-level section for Type 1 users (spec 2026-07).
export function t1CommunityKeyboard(lang) {
  const b = (key, action) => ({ text: t(lang, key), callback_data: `t1:${action}` });
  return stack([
    b("btn_t1c_support",   "support"),
    b("btn_t1c_blogs",     "blogs"),
    b("btn_t1c_videos",    "videos"),
    b("btn_t1c_dailylife", "dailylife"),
    b("btn_t1c_events",    "events"),
    { text: t(lang, "btn_main_menu"), callback_data: "menu" },
  ]);
}

// Daily Life — three category submenus. Each opens a topic list.
export function t1DailyLifeCategoriesKeyboard(lang) {
  const b = (key, cat) => ({ text: t(lang, key), callback_data: `t1:dl:${cat}` });
  return stack([
    b("btn_t1c_dl_children", "children_parents"),
    b("btn_t1c_dl_teens",    "teens_young_adults"),
    b("btn_t1c_dl_adults",   "adults"),
    { text: t(lang, "btn_back"), callback_data: "feat:t1community" },
  ]);
}

// One button per topic. Long titles are truncated for the inline button but
// the full title is sent again with the PDF link on tap.
export function t1DailyLifeTopicsKeyboard(lang, topics) {
  const rows = topics.map((tp) => [
    { text: truncate(tp.title, 60), callback_data: `t1:dt:${tp.id}` },
  ]);
  rows.push([{ text: t(lang, "btn_back"), callback_data: "t1:dailylife" }]);
  return { inline_keyboard: rows };
}

// T1-only periodic confidence check (spec 2026-07).
export function t1ConfidenceKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "t1c_btn_very"),      callback_data: "t1c:very" }],
      [{ text: t(lang, "t1c_btn_mostly"),    callback_data: "t1c:mostly" }],
      [{ text: t(lang, "t1c_btn_sometimes"), callback_data: "t1c:sometimes" }],
      [{ text: t(lang, "t1c_btn_help"),      callback_data: "t1c:help" }],
    ],
  };
}

export function medConfirmKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "med_btn_yes"), callback_data: "medconf:yes" },
        { text: t(lang, "med_btn_edit"), callback_data: "medconf:edit" },
        { text: t(lang, "med_btn_add"), callback_data: "medconf:add" },
      ],
    ],
  };
}

export function medConsistencyOfferKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_yes"), callback_data: "medcp:yes" },
        { text: t(lang, "btn_no"), callback_data: "medcp:no" },
      ],
    ],
  };
}

export function medConsistencyAnswerKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "medcp_btn_yes"), callback_data: "medcpans:yes" },
        { text: t(lang, "medcp_btn_no"), callback_data: "medcpans:no" },
      ],
    ],
  };
}

export function medConsistencyReasonKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "medcp_reason_forgot"), callback_data: "medcpreason:forgot" },
        { text: t(lang, "medcp_reason_busy"), callback_data: "medcpreason:busy" },
      ],
      [
        { text: t(lang, "medcp_reason_side_effects"), callback_data: "medcpreason:side_effects" },
        { text: t(lang, "medcp_reason_ranout"), callback_data: "medcpreason:ran_out" },
      ],
      [{ text: t(lang, "medcp_reason_other"), callback_data: "medcpreason:other" }],
    ],
  };
}

export function medSatisfactionKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "medsat_btn_yes"), callback_data: "medsat:yes" },
        { text: t(lang, "medsat_btn_notsure"), callback_data: "medsat:not_sure" },
        { text: t(lang, "medsat_btn_no"), callback_data: "medsat:no" },
      ],
    ],
  };
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
