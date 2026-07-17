import { t, LANGUAGES } from "./i18n.js";
import { isPaid } from "./tiers.js";
import { config } from "./config.js";

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
      [b("btn_lab", "lab"), b("btn_challenges", "challenges")],
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

// ===================================================================
// Challenges v1.0 (2026-07) — spec keyboards. Callback prefix `chal:`
// (distinct from the legacy `chl:` module above, which stays wired for
// backwards-compat so any old deep link keeps working).
// ===================================================================

// Main hub — Active / Join / Rankings / History / Back.
// keepEmoji: challenge buttons carry load-bearing icons (🔥, 🏆, 🏅) that the
// spec explicitly designs around; opt this keyboard out of the emoji stripper.
export function chalMainKeyboard(lang) {
  const b = (key, action) => ({ text: t(lang, key), callback_data: `chal:${action}` });
  return { ...stack([
    b("btn_chal_active",   "active"),
    b("btn_chal_join",     "browse"),
    b("btn_chal_rankings", "rankings"),
    b("btn_chal_history",  "history"),
    { text: t(lang, "btn_back"), callback_data: "menu" },
  ]), keepEmoji: true };
}

// Available challenges picker (spec §5).
export function chalAvailableKeyboard(lang) {
  const b = (code, key) => ({ text: t(lang, key), callback_data: `chal:def:${code}` });
  return { ...stack([
    b("hba1c_90d",         "chal_type_hba1c"),
    b("activity_30d",      "chal_type_activity"),
    b("healthy_plate_30d", "chal_type_healthy_plate"),
    { text: t(lang, "btn_back"), callback_data: "chal:menu" },
  ]), keepEmoji: true };
}

// Challenge intro card — Join / How It Works / Back (spec §6.2, §7.1, §8.1).
export function chalIntroKeyboard(lang, code) {
  return { ...stack([
    { text: t(lang, "btn_chal_join_now"), callback_data: `chal:join:${code}` },
    { text: t(lang, "btn_chal_how"),      callback_data: `chal:how:${code}` },
    { text: t(lang, "btn_back"),          callback_data: "chal:browse" },
  ]), keepEmoji: true };
}

// "How It Works" back button — returns to the challenge intro.
export function chalHowBackKeyboard(lang, code) {
  return { inline_keyboard: [[
    { text: t(lang, "btn_back"), callback_data: `chal:def:${code}` },
  ]]};
}

// HbA1c baseline collection — Upload / Enter / Cancel (spec §6.4 step 1).
export function chalHba1cCollectKeyboard(lang) {
  return { ...stack([
    { text: t(lang, "btn_chal_upload"), callback_data: "chal:hba1c_upload_hint" },
    { text: t(lang, "btn_chal_enter"),  callback_data: "chal:hba1c_enter_hint" },
    { text: t(lang, "btn_chal_cancel"), callback_data: "chal:menu" },
  ]), keepEmoji: true };
}

// HbA1c reuse dialog — Yes / Add Another / Cancel (spec §6.4).
export function chalHba1cReuseKeyboard(lang) {
  return { ...stack([
    { text: t(lang, "btn_chal_reuse_yes"),     callback_data: "chal:hba1c_reuse_yes" },
    { text: t(lang, "btn_chal_reuse_another"), callback_data: "chal:hba1c_reuse_no" },
    { text: t(lang, "btn_chal_cancel"),        callback_data: "chal:menu" },
  ]), keepEmoji: true };
}

// Final-result prompt (HbA1c end) — Upload / Enter / Remind Me Later.
export function chalHba1cFinalKeyboard(lang) {
  return { ...stack([
    { text: t(lang, "btn_chal_upload"),       callback_data: "chal:hba1c_final_upload_hint" },
    { text: t(lang, "btn_chal_enter"),        callback_data: "chal:hba1c_final_enter_hint" },
    { text: t(lang, "btn_chal_remind_later"), callback_data: "chal:hba1c_final_later" },
  ]), keepEmoji: true };
}

// Rankings picker — one row per currently-active challenge def.
export function chalRankingsPickerKeyboard(lang, defs) {
  const rows = (defs || []).map((d) => [{
    text: t(lang, {
      hba1c: "chal_type_hba1c",
      activity: "chal_type_activity",
      healthy_plate: "chal_type_healthy_plate",
    }[d.challenge_type] || "btn_chal_rankings"),
    callback_data: `chal:rank:${d.challenge_code}`,
  }]);
  rows.push([{ text: t(lang, "btn_back"), callback_data: "chal:menu" }]);
  return { inline_keyboard: rows };
}

// Back-to-Challenges button used at flow endpoints.
export function chalBackKeyboard(lang) {
  return { inline_keyboard: [[
    { text: t(lang, "btn_back"), callback_data: "chal:menu" },
  ]]};
}

// Active-challenge detail screen — opt-out toggle + withdraw + back.
// `optIn` reflects the current leaderboard_opt_in state so the label swaps
// between "Show me on leaderboard" / "Hide me from leaderboard".
export function chalDetailKeyboard(lang, ucId, optIn) {
  const rows = [
    [{
      text: t(lang, optIn ? "btn_chal_hide_ranking" : "btn_chal_show_ranking"),
      callback_data: `chal:toggle_leaderboard:${ucId}`,
    }],
    [{ text: t(lang, "btn_chal_withdraw"), callback_data: `chal:withdraw:${ucId}` }],
    [{ text: t(lang, "btn_back"), callback_data: "chal:active" }],
  ];
  return { inline_keyboard: rows };
}

// Withdraw confirmation (destructive action — spec §15 status = withdrawn_by_user).
export function chalWithdrawConfirmKeyboard(lang, ucId) {
  return { inline_keyboard: [[
    { text: t(lang, "btn_chal_withdraw_confirm"), callback_data: `chal:withdraw_confirm:${ucId}` },
    { text: t(lang, "btn_chal_cancel"),           callback_data: `chal:view:${ucId}` },
  ]]};
}

// Active-challenges list — one tap-able row per active challenge, so users
// can drill into the §7.5 progress card.
export function chalActiveListKeyboard(lang, ucs) {
  const rows = (ucs || []).map((uc) => [{
    text: activeListButtonText(lang, uc),
    callback_data: `chal:view:${uc.id}`,
  }]);
  rows.push([{ text: t(lang, "btn_back"), callback_data: "chal:menu" }]);
  return { inline_keyboard: rows };
}

function activeListButtonText(lang, uc) {
  if (uc.def_type === "activity" || uc.challenge_type === "activity") {
    return t(lang, "chal_type_activity");
  }
  if (uc.def_type === "healthy_plate" || uc.challenge_type === "healthy_plate") {
    return t(lang, "chal_type_healthy_plate");
  }
  return t(lang, "chal_type_hba1c");
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

// Keyboard shown on the "Explain My Report" prompt.
//
// Both "📸 Take a Photo" and "📎 Attach Report" were removed 2026-07-14:
// WhatsApp/Telegram callback buttons cannot open the camera or file picker,
// so they were misleading affordances. The intro copy now asks the user
// directly to send the report in the chat (photo / image / PDF / text),
// which works via the client's native paperclip on every channel.
export function labStartKeyboard(lang) {
  return {
    inline_keyboard: [
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
// ❤️ My Health (spec "Main Menu Revision v2.1", 2026-07)
// ===================================================================
// Not-started screen — Start plus a My Doctor entry (Doctor & Referral v1.0
// requires the item under My Health regardless of profile-setup progress).
export function myHealthStartKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_mh_start"), callback_data: "mh:start" }],
      [{ text: t(lang, "btn_my_doctor"), callback_data: "mydoc:open" }],
      [{ text: t(lang, "btn_back"), callback_data: "menu" }],
    ],
  };
}

// Yes / Edit confirmation card shown after AI extraction (Q1–Q3).
export function myHealthConfirmKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_mh_yes"), callback_data: "mh:ok" },
        { text: t(lang, "btn_mh_edit"), callback_data: "mh:edit" },
      ],
    ],
  };
}

// Fasting / Random / Post-meal picker for an ambiguous glucose reading.
export function myHealthContextKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_mh_ctx_fasting"), callback_data: "mh:ctx:fasting" },
        { text: t(lang, "btn_mh_ctx_random"), callback_data: "mh:ctx:random" },
        { text: t(lang, "btn_mh_ctx_postmeal"), callback_data: "mh:ctx:post_meal" },
      ],
    ],
  };
}

// Returning-user summary card actions (spec 2026-07: Update / Main Menu).
// "My Doctor" (Doctor & Referral module v1.0) is added between so patients
// can link, change, or remove their doctor from within My Health.
export function myHealthSummaryKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_mh_update_profile"), callback_data: "mh:update_profile" }],
      [{ text: t(lang, "btn_my_doctor"), callback_data: "mydoc:open" }],
      [{ text: t(lang, "btn_mh_main_menu"), callback_data: "menu" }],
    ],
  };
}

// "Restart your health profile?" confirmation before wiping health_setup_step.
export function myHealthUpdateConfirmKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_mh_update_yes"), callback_data: "mh:update_confirm" },
        { text: t(lang, "btn_mh_update_no"),  callback_data: "mh:update_cancel" },
      ],
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
  // Onboarding question that also carries the diabetes-type selection — the
  // onboarding callback handler maps each value onto user_type + diabetes_status.
  // "Gestational Diabetes" removed 2026-07-14 (too niche for MVP); the Pregnancy
  // Support menu remains reachable for any legacy users already tagged as
  // gestational.
  return stack([
    { text: t(lang, "ut_type1"),       callback_data: "ut:type1" },
    { text: t(lang, "ut_type2"),       callback_data: "ut:type2" },
    { text: t(lang, "ut_prediabetes"), callback_data: "ut:prediabetes" },
    { text: t(lang, "ut_healthier"),   callback_data: "ut:healthier" },
    { text: t(lang, "ut_doctor"),      callback_data: "ut:doctor" },
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

// New 6-item top menu per the Build 1 spec. Old features (Challenges,
// Executive) move under "More" — see moreKeyboard below — so nothing is lost.
// A single profile-based row is prepended above the defaults when the user's
// onboarding selection matches one of the special-case profiles.
export function mainMenuKeyboardV2(lang, user) {
  // Doctors get their own three-item main menu (Doctor & Referral module).
  // The patient menu is available from within "My Health".
  if (user?.user_type === "doctor") return doctorMenuKeyboard(lang, user, { showTest: config.testActivationEnabled });
  const b = (key, action) => ({ text: t(lang, key), callback_data: `feat:${action}` });
  const rows = [];
  // ❤️ My Health sits at the top of the menu (spec v2.1, 2026-07).
  rows.push(b("btn_myhealth", "myhealth"));
  const profileBtn = profileMenuButton(lang, user);
  if (profileBtn) rows.push(profileBtn);
  rows.push(
    b("btn_checkin", "checkin"),
    b("btn_foodhelp", "foodhelp"),
    b("btn_checkreport", "lab"),
    b("btn_askdrsaab", "askdrsaab"),
    b("btn_challenges", "challenges"),
    b("btn_more", "more"),
  );
  // keepEmoji: the main menu is designed to show its icons, so opt this
  // keyboard out of the send-time emoji stripper (see utils.cleanKeyboard).
  return { ...stack(rows), keepEmoji: true };
}

// ===================================================================
// Doctor & Referral module (v1.0)
// ===================================================================
export function doctorMenuKeyboard(lang, user, { showTest = false } = {}) {
  const b = (key, action) => ({ text: t(lang, key), callback_data: `doc:${action}` });
  const rows = [
    b("btn_doc_reports",  "reports"),
    b("btn_doc_referral", "referral"),
    b("btn_doc_myhealth", "myhealth"),
  ];
  // Dual-use doctors (Yes to personal-health, or later opted in via My Health)
  // get a bottom button to jump into their patient menu.
  if (user?.diabetes_status) {
    rows.push(b("btn_doc_switch_patient", "switch_patient"));
  }
  // QA affordance: simulate the "10-patient cap reached" notification a
  // real 11th-patient link attempt would send. Hidden when
  // TEST_ACTIVATION_ENABLED=false.
  if (showTest) {
    rows.push(b("btn_doc_test_dp", "test_dp"));
  }
  return { ...stack(rows), keepEmoji: true };
}

// Patient main menu shown to a doctor who tapped "Switch to Patient Menu".
// Same items a normal patient sees, plus a bottom button to switch back to
// the doctor menu. Kept separate from mainMenuKeyboardV2 so that keyboard
// stays the canonical patient menu for actual patients.
export function patientMenuForDoctorKeyboard(lang, user) {
  const b = (key, action) => ({ text: t(lang, key), callback_data: `feat:${action}` });
  const rows = [b("btn_myhealth", "myhealth")];
  const profileBtn = profileMenuButton(lang, user);
  if (profileBtn) rows.push(profileBtn);
  rows.push(
    b("btn_checkin", "checkin"),
    b("btn_foodhelp", "foodhelp"),
    b("btn_checkreport", "lab"),
    b("btn_askdrsaab", "askdrsaab"),
    b("btn_challenges", "challenges"),
    b("btn_more", "more"),
    { text: t(lang, "btn_doc_switch_doctor"), callback_data: "doc:menu" },
  );
  return { ...stack(rows), keepEmoji: true };
}

// Yes/No used by doctor onboarding (dual-use question). Distinct prefix so
// it doesn't collide with the generic yesNoKeyboard.
export function docYesNoKeyboard(lang) {
  return {
    inline_keyboard: [[
      { text: t(lang, "btn_yes"), callback_data: "doc:patient_yes" },
      { text: t(lang, "btn_no"),  callback_data: "doc:patient_no" },
    ]],
  };
}

// Back-to-doctor-menu button used by Reports / Referral Code screens.
export function doctorBackKeyboard(lang) {
  return { inline_keyboard: [[{ text: t(lang, "btn_back"), callback_data: "doc:menu" }]] };
}

// Reports timeframe picker — spec Reporting Engine calls out weekly + monthly.
export function doctorReportsWindowKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_doc_rep_weekly"),  callback_data: "doc:reports_weekly" }],
      [{ text: t(lang, "btn_doc_rep_monthly"), callback_data: "doc:reports_monthly" }],
      [{ text: t(lang, "btn_doc_rep_all"),     callback_data: "doc:reports_all" }],
      [{ text: t(lang, "btn_back"),            callback_data: "doc:menu" }],
    ],
  };
}

// Patient-side: "My Doctor" screens.
export function myDoctorNoneKeyboard(lang) {
  return stack([
    { text: t(lang, "btn_add_doctor"), callback_data: "mydoc:add" },
    { text: t(lang, "btn_back"),       callback_data: "feat:myhealth" },
  ]);
}
export function myDoctorLinkedKeyboard(lang) {
  return stack([
    { text: t(lang, "btn_change_doctor"), callback_data: "mydoc:change" },
    { text: t(lang, "btn_remove_doctor"), callback_data: "mydoc:remove" },
    { text: t(lang, "btn_back"),          callback_data: "feat:myhealth" },
  ]);
}
export function myDoctorConfirmKeyboard(lang) {
  return {
    inline_keyboard: [[
      { text: t(lang, "btn_confirm_link"), callback_data: "mydoc:confirm" },
      { text: t(lang, "btn_cancel_link"),  callback_data: "mydoc:cancel" },
    ]],
  };
}
export function myDoctorRemoveConfirmKeyboard(lang) {
  return {
    inline_keyboard: [[
      { text: t(lang, "btn_confirm_remove"), callback_data: "mydoc:remove_confirm" },
      { text: t(lang, "btn_cancel_link"),    callback_data: "mydoc:cancel" },
    ]],
  };
}

// Maps a user's onboarding profile to the one condition-specific menu button
// they should see. Returns null for Type 2 and other users who get only the
// default six items.
function profileMenuButton(lang, user) {
  const b = (key, action) => ({ text: t(lang, key), callback_data: `pfl:${action}` });
  const ut = user?.user_type;
  const dt = user?.diabetes_status;
  // Doctors in patient mode carry user_type='doctor' but diabetes_status
  // captures the patient-side condition — match on the condition alone for
  // them so the profile-specific row still surfaces.
  if (dt === "type1" && (ut === "diabetes" || ut === "doctor")) return b("btn_p_type1", "type1");
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

// More — spec 2026-07: four items only (Reminders, Language, Subscription,
// Account). Challenges / Executive stay callable via their `feat:` deep links;
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

// ===================================================================
// Subscription upgrade flow (MVP) — spec §2–§8. Callback prefix `sub:`.
// Every screen below keeps a Back that returns to the parent within the
// flow, matching the spec's navigation.
// ===================================================================

// §2 — Upgrade menu (Consistency / Executive / Back).
export function upsellMenuKeyboard(lang) {
  return stack([
    { text: t(lang, "btn_upsell_consistency"), callback_data: "sub:pick:consistency" },
    { text: t(lang, "btn_upsell_executive"),   callback_data: "sub:pick:executive" },
    { text: t(lang, "btn_back"),               callback_data: "feat:subscription" },
  ]);
}

// §2b — Executive placeholder (Consistency / Back).
export function upsellExecUnavailableKeyboard(lang) {
  return stack([
    { text: t(lang, "btn_upsell_consistency"), callback_data: "sub:pick:consistency" },
    { text: t(lang, "btn_back"),               callback_data: "sub:upgrade" },
  ]);
}

// §3 — Consistency offers (1M / 6M / 12M / Back).
export function upsellOffersKeyboard(lang) {
  return stack([
    { text: t(lang, "btn_upsell_1m"),  callback_data: "sub:plan:1m" },
    { text: t(lang, "btn_upsell_6m"),  callback_data: "sub:plan:6m" },
    { text: t(lang, "btn_upsell_12m"), callback_data: "sub:plan:12m" },
    { text: t(lang, "btn_back"),       callback_data: "sub:upgrade" },
  ]);
}

// §4 — Plan confirmation (Continue / Change Plan / Back). The extra
// "🧪 Test Activate" row is a QA affordance that skips payment collection
// and hits the same activation code path an admin approval would. Hide it
// in production by setting TEST_ACTIVATION_ENABLED=false.
export function upsellConfirmKeyboard(lang, { showTest = false } = {}) {
  const rows = [
    { text: t(lang, "btn_upsell_continue"),    callback_data: "sub:continue" },
    { text: t(lang, "btn_upsell_change_plan"), callback_data: "sub:pick:consistency" },
    { text: t(lang, "btn_back"),               callback_data: "sub:pick:consistency" },
  ];
  if (showTest) {
    rows.splice(1, 0, { text: t(lang, "btn_upsell_test_activate"), callback_data: "sub:test" });
  }
  return stack(rows);
}

// §5 — Payment method picker (Bank / JazzCash / Back).
export function payMethodKeyboard(lang) {
  return stack([
    { text: t(lang, "btn_pay_bank"),     callback_data: "sub:pay:bank" },
    { text: t(lang, "btn_pay_jazzcash"), callback_data: "sub:pay:jazzcash" },
    { text: t(lang, "btn_back"),         callback_data: "sub:continue" },
  ]);
}

// §6 / §7 — Bank / JazzCash payment card (I've Paid / Cancel).
export function payProofKeyboard(lang) {
  return stack([
    { text: t(lang, "btn_pay_ive_paid"), callback_data: "sub:paid" },
    { text: t(lang, "btn_pay_cancel"),   callback_data: "sub:cancel" },
  ]);
}

// ===================================================================
// Doctor Pro Addendum (§4 §5) — same callback prefix `sub:`.
// ===================================================================

// §5 — Doctor Pro benefits card. Continue jumps straight to the payment
// method picker (no per-plan confirmation card — there's only one price).
// The extra "🧪 Test Activate" row skips payment for QA and mirrors the
// upsellConfirmKeyboard affordance; hide it via TEST_ACTIVATION_ENABLED=false.
export function doctorProBenefitsKeyboard(lang, { showTest = false } = {}) {
  const rows = [
    { text: t(lang, "btn_dp_continue"), callback_data: "sub:continue" },
    { text: t(lang, "btn_back"),        callback_data: "feat:subscription" },
  ];
  if (showTest) {
    rows.splice(1, 0, { text: t(lang, "btn_upsell_test_activate"), callback_data: "sub:test" });
  }
  return stack(rows);
}

// §4 — cap-reached prompt shown to the doctor when a patient tried to
// link while the doctor was at 10 active patients.
export function doctorProCapKeyboard(lang) {
  return {
    inline_keyboard: [[
      { text: t(lang, "btn_dp_upgrade"), callback_data: "sub:pick:doctor_pro" },
      { text: t(lang, "btn_dp_later"),   callback_data: "sub:later" },
    ]],
  };
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

// "Save this reading?" offer shown after a clinical question that
// included a numeric value (§6 disambiguation rule 2). The value is
// baked into callback_data so the handler can log without needing to
// re-parse the message.
export function saveReadingOfferKeyboard(lang, kind, value) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_yes"), callback_data: `saveq:${kind}:${value}:yes` },
        { text: t(lang, "btn_no"), callback_data: `saveq:${kind}:${value}:no` },
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

// Prediabetes — top-level Healthy Living menu (spec 2026-07).
export function prediabetesMenuKeyboard(lang) {
  const b = (key, action) => ({ text: t(lang, key), callback_data: `pd:${action}` });
  return stack([
    b("btn_pd_wins",     "wins"),
    b("btn_pd_gym",      "gym"),
    b("btn_pd_cravings", "cravings"),
    { text: t(lang, "btn_main_menu"), callback_data: "menu" },
  ]);
}

// 10-Minute Wins: after showing a suggestion, offer to do it or reroll.
// Back returns to the Healthy Living menu.
export function pdWinsChoiceKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_pd_wins_do"),      callback_data: "pd:wins_do" },
        { text: t(lang, "btn_pd_wins_another"), callback_data: "pd:wins_again" },
      ],
      [{ text: t(lang, "btn_back"), callback_data: "feat:prediabetes" }],
    ],
  };
}

// The delayed "did you complete it?" follow-up.
export function pdWinsFollowupKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_pd_wins_yes"),   callback_data: "pd:wins_yes" },
        { text: t(lang, "btn_pd_wins_notyet"), callback_data: "pd:wins_notyet" },
      ],
    ],
  };
}

// Shown alongside the "go get it done" nudge so the user can mark the
// activity done immediately instead of waiting for the 15-minute check-in.
export function pdWinsGoKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_pd_wins_done"), callback_data: "pd:wins_yes" }],
      [{ text: t(lang, "btn_back"), callback_data: "feat:prediabetes" }],
    ],
  };
}

// Gym Plan questions.
export function pdGymExperienceKeyboard(lang) {
  const b = (key, val) => ({ text: t(lang, key), callback_data: `pd:gymexp:${val}` });
  return stack([[b("btn_pd_gym_exp_never", "never"), b("btn_pd_gym_exp_beginner", "beginner"), b("btn_pd_gym_exp_regular", "regular")]]);
}

export function pdGymDaysKeyboard(lang) {
  const b = (n) => ({ text: String(n === 5 ? "5+" : n), callback_data: `pd:gymdays:${n}` });
  return { inline_keyboard: [[b(2), b(3), b(4), b(5)]] };
}

export function pdGymGoalKeyboard(lang) {
  const b = (key, val) => ({ text: t(lang, key), callback_data: `pd:gymgoal:${val}` });
  return stack([
    b("btn_pd_gym_goal_lose",     "lose_weight"),
    b("btn_pd_gym_goal_build",    "build_muscle"),
    b("btn_pd_gym_goal_fitness",  "improve_fitness"),
    b("btn_pd_gym_goal_bloodsugar", "improve_bloodsugar"),
  ]);
}

// Regenerate / back after a gym plan is delivered.
export function pdGymDoneKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_pd_gym_regen"), callback_data: "pd:gym" }],
      [{ text: t(lang, "btn_back"), callback_data: "feat:prediabetes" }],
    ],
  };
}

// Beat the Cravings: sugary drink picker.
export function pdCravingsDrinkKeyboard(lang) {
  const b = (key, val) => ({ text: t(lang, key), callback_data: `pd:drink:${val}` });
  return stack([
    [b("btn_pd_drink_coke", "coke"),       b("btn_pd_drink_pepsi", "pepsi")],
    [b("btn_pd_drink_7up", "7up"),         b("btn_pd_drink_sprite", "sprite")],
    [b("btn_pd_drink_mtn", "mountain_dew"), b("btn_pd_drink_energy", "energy")],
    [b("btn_pd_drink_tea", "sweet_tea"),   b("btn_pd_drink_other", "other")],
  ]);
}

// Beat the Cravings: junk food picker.
export function pdCravingsJunkKeyboard(lang) {
  const b = (key, val) => ({ text: t(lang, key), callback_data: `pd:junk:${val}` });
  return stack([
    [b("btn_pd_junk_burgers", "burgers"), b("btn_pd_junk_pizza", "pizza")],
    [b("btn_pd_junk_fries", "fries"),     b("btn_pd_junk_chips", "chips")],
    [b("btn_pd_junk_biscuits", "biscuits"), b("btn_pd_junk_cakes", "cakes")],
    [b("btn_pd_junk_choco", "chocolate"), b("btn_pd_junk_fast", "fast_food")],
    [b("btn_pd_junk_other", "other")],
  ]);
}

// Beat the Cravings: one-change commitment picker.
export function pdCravingsCommitKeyboard(lang) {
  const b = (key, val) => ({ text: t(lang, key), callback_data: `pd:commit:${val}` });
  return {
    ...stack([
      b("btn_pd_commit_skip_sugary", "skip_sugary"),
      b("btn_pd_commit_skip_junk",   "skip_junk"),
      b("btn_pd_commit_walk10",      "walk10"),
      b("btn_pd_commit_one_plate",   "one_plate"),
      b("btn_pd_commit_wait10",      "wait10"),
      b("btn_pd_commit_other",       "other"),
    ]),
    keepEmoji: true,
  };
}

// Return-to-menu after a cravings step or a final message.
export function pdBackKeyboard(lang) {
  return {
    inline_keyboard: [[{ text: t(lang, "btn_back"), callback_data: "feat:prediabetes" }]],
  };
}

// Better Me — top-level menu for user_type=healthier (spec 2026-07).
// "My Health Journey" removed 2026-07-14 — the health summary now lives
// exclusively in My Health, so a second surface for it was redundant.
export function betterMeMenuKeyboard(lang) {
  const b = (key, action) => ({ text: t(lang, key), callback_data: `bm:${action}` });
  return stack([
    b("btn_bm_habit",   "habit"),
    b("btn_bm_fitness", "fitness"),
    b("btn_bm_wins",    "wins"),
    { text: t(lang, "btn_main_menu"), callback_data: "menu" },
  ]);
}

// Habit Builder — habit library (spec §3, 5 MVP habits).
// Each row is a full-width button so the emoji + long label render cleanly on
// mobile (WhatsApp truncates two-column buttons more aggressively).
export function hbLibraryKeyboard(lang) {
  const b = (key, val) => ({ text: t(lang, key), callback_data: `bm:hb:pick:${val}` });
  return stack([
    b("bm_habit_lib_move", "move"),
    b("bm_habit_lib_water", "water"),
    b("bm_habit_lib_sleep", "sleep"),
    b("bm_habit_lib_smoke_free", "smoke_free"),
    b("bm_habit_lib_no_food_after_dinner", "no_food_after_dinner"),
    { text: t(lang, "btn_back"), callback_data: "feat:betterme" },
  ]);
}

// Water target picker (6 / 8 / 10 / other).
export function hbWaterTargetKeyboard(lang) {
  const b = (key, val) => ({ text: t(lang, key), callback_data: `bm:hb:target:water:${val}` });
  return {
    inline_keyboard: [
      [b("btn_hb_water_6", "6"), b("btn_hb_water_8", "8"), b("btn_hb_water_10", "10")],
      [{ text: t(lang, "btn_hb_water_other"), callback_data: "bm:hb:target:water:other" }],
      [{ text: t(lang, "btn_back"), callback_data: "bm:habit" }],
    ],
  };
}

// Sleep target-time picker. Values are ISO-ish 24h strings so they round-trip
// through the render layer without locale drift.
export function hbSleepTimeKeyboard(lang) {
  const b = (key, val) => ({ text: t(lang, key), callback_data: `bm:hb:target:sleep:${val}` });
  return {
    inline_keyboard: [
      [b("btn_hb_sleep_1030", "22:30"), b("btn_hb_sleep_1100", "23:00"), b("btn_hb_sleep_1130", "23:30")],
      [{ text: t(lang, "btn_hb_sleep_other"), callback_data: "bm:hb:target:sleep:other" }],
      [{ text: t(lang, "btn_back"), callback_data: "bm:habit" }],
    ],
  };
}

// Habit activation — Start / Start Without Reminders / Cancel (spec §6).
export function hbActivationKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_hb_start"), callback_data: "bm:hb:activate" }],
      [{ text: t(lang, "btn_hb_start_silent"), callback_data: "bm:hb:activate_silent" }],
      [{ text: t(lang, "btn_hb_cancel"), callback_data: "bm:hb:cancel" }],
    ],
  };
}

// Daily check-in keyboard (spec §7). Stop Reminders must appear on every
// prompt; habitId is bound in the callback so scheduler-delivered messages
// remain valid even if the user has multiple future habits.
export function hbDailyKeyboard(lang, habitId) {
  return {
    inline_keyboard: [[
      { text: t(lang, "btn_hb_yes"), callback_data: `bm:hb:answer:${habitId}:yes` },
      { text: t(lang, "btn_hb_no"), callback_data: `bm:hb:answer:${habitId}:no` },
      { text: t(lang, "btn_hb_stop"), callback_data: `bm:hb:answer:${habitId}:stop` },
    ]],
  };
}

// Stop-reminders confirmation (spec §16). Pause-for-7-days is Phase 2 and is
// intentionally omitted here to avoid exposing an unimplemented action.
export function hbStopConfirmKeyboard(lang, habitId) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_hb_stop_yes"), callback_data: `bm:hb:stop_confirm:${habitId}` }],
      [{ text: t(lang, "btn_hb_keep_reminders"), callback_data: "bm:habit" }],
    ],
  };
}

// Active-habit summary card (spec §18). Only actions implemented in Phase 1
// are shown — the others (pause / remove / change target / change frequency
// / view progress) land in Phase 2.
export function hbSummaryKeyboard(lang, habitId) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_hb_stop_short"), callback_data: `bm:hb:stop:${habitId}` }],
      [{ text: t(lang, "btn_hb_main_menu"), callback_data: "menu" }],
      [{ text: t(lang, "btn_back"), callback_data: "feat:betterme" }],
    ],
  };
}

// Fitness plan Q1 (gym experience).
export function bmFitExperienceKeyboard(lang) {
  const b = (key, val) => ({ text: t(lang, key), callback_data: `bm:fitexp:${val}` });
  return stack([[
    b("btn_bm_fit_exp_never", "never"),
    b("btn_bm_fit_exp_beginner", "beginner"),
    b("btn_bm_fit_exp_regular", "regular"),
  ]]);
}

// Fitness plan Q2 (days per week).
export function bmFitDaysKeyboard(lang) {
  const b = (n) => ({ text: String(n === 5 ? "5+" : n), callback_data: `bm:fitdays:${n}` });
  return { inline_keyboard: [[b(2), b(3), b(4), b(5)]] };
}

// Fitness plan Q3 (main goal).
export function bmFitGoalKeyboard(lang) {
  const b = (key, val) => ({ text: t(lang, key), callback_data: `bm:fitgoal:${val}` });
  return stack([
    b("btn_bm_fit_goal_lose",     "lose_weight"),
    b("btn_bm_fit_goal_build",    "build_muscle"),
    b("btn_bm_fit_goal_fitness",  "improve_fitness"),
    b("btn_bm_fit_goal_overall",  "improve_overall"),
  ]);
}

// After a plan is delivered — regenerate or back.
export function bmFitDoneKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_bm_fit_regen"), callback_data: "bm:fitness" }],
      [{ text: t(lang, "btn_back"), callback_data: "feat:betterme" }],
    ],
  };
}

// 10-Minute Wins — spec 2026-07 three-button layout. Swap is on its own row
// because it's a distinct meta-action ("give me a different challenge"),
// separate from the Done/Not Today outcome pair.
export function bmWinsChoiceKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_bm_wins_done"), callback_data: "bm:w:done" },
        { text: t(lang, "btn_bm_wins_skip"), callback_data: "bm:w:skip" },
      ],
      [{ text: t(lang, "btn_bm_wins_swap"), callback_data: "bm:w:swap" }],
      [{ text: t(lang, "btn_back"),         callback_data: "feat:betterme" }],
    ],
  };
}

// Simple Back-to-Better-Me button used at flow end-points.
export function bmBackKeyboard(lang) {
  return {
    inline_keyboard: [[{ text: t(lang, "btn_back"), callback_data: "feat:betterme" }]],
  };
}

// Pregnancy Support — top-level menu for gestational-diabetes users (spec 2026-07).
export function pregnancyMenuKeyboard(lang) {
  const b = (key, action) => ({ text: t(lang, key), callback_data: `pg:${action}` });
  return stack([
    b("btn_pg_progress",  "progress"),
    b("btn_pg_healthy",   "tips"),
    b("btn_pg_checklist", "checklist"),
    { text: t(lang, "btn_main_menu"), callback_data: "menu" },
  ]);
}

// Yes / No / Not Sure — used for the "previous GDM?" question.
export function pgYesNoNotSureKeyboard(lang, key) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_pg_yes"),     callback_data: `pg:${key}:yes` },
        { text: t(lang, "btn_pg_no"),      callback_data: `pg:${key}:no` },
      ],
      [
        { text: t(lang, "btn_pg_notsure"), callback_data: `pg:${key}:notsure` },
      ],
    ],
  };
}

// Yes / No — used for first-pregnancy and insulin questions.
export function pgYesNoKeyboard(lang, key) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_pg_yes"), callback_data: `pg:${key}:yes` },
        { text: t(lang, "btn_pg_no"),  callback_data: `pg:${key}:no` },
      ],
    ],
  };
}

// Skip button for optional text steps (doctor, delivery hospital).
export function pgSkipKeyboard(lang, key) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_skip"), callback_data: `pg:skip:${key}` }],
    ],
  };
}

// Progress view — Edit Details / Update Week / Back.
export function pgProgressViewKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t(lang, "btn_pg_edit_all"),    callback_data: "pg:edit" }],
      [{ text: t(lang, "btn_pg_update_week"), callback_data: "pg:updateweek" }],
      [{ text: t(lang, "btn_back"),           callback_data: "feat:pregnancy" }],
    ],
  };
}

// Healthy Pregnancy tip — Helpful / Show Me Another.
export function pgTipFeedbackKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, "btn_pg_tip_helpful"), callback_data: "pg:tiphelp" },
        { text: t(lang, "btn_pg_tip_another"), callback_data: "pg:tipagain" },
      ],
      [{ text: t(lang, "btn_back"), callback_data: "feat:pregnancy" }],
    ],
  };
}

// Pregnancy Checklist — one topic per row.
export function pgChecklistTopicsKeyboard(lang, topics) {
  const rows = topics.map((tp) => [
    { text: truncate(tp.title, 60), callback_data: `pg:cl:${tp.id}` },
  ]);
  rows.push([{ text: t(lang, "btn_back"), callback_data: "feat:pregnancy" }]);
  return { inline_keyboard: rows };
}

// Simple Back-to-Pregnancy button used at flow end-points.
export function pgBackKeyboard(lang) {
  return {
    inline_keyboard: [[{ text: t(lang, "btn_back"), callback_data: "feat:pregnancy" }]],
  };
}

// Back-to-checklist-list button, used when the user is one level deeper
// (viewing a single topic's PDF or placeholder).
export function pgBackToChecklistKeyboard(lang) {
  return {
    inline_keyboard: [[{ text: t(lang, "btn_back"), callback_data: "pg:checklist" }]],
  };
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
