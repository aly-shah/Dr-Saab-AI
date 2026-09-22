// ❤️ My Health — the user's canonical, conversational health profile.
// Spec: "My Health" (2026-07).
//
// One-time 5-question guided setup builds the profile; afterwards the user
// lands on a small sub-menu (Goals, My Health Summary, Update Profile, My
// Doctor). Free text typed on the sub-menu or the summary is still an
// AI-driven update ("My weight is now 79 kg").
//
// Profile states (users.health_profile_status):
//   not_started → show intro + Start
//   in_progress → resume automatically from the next unanswered question
//   completed   → show the sub-menu; Goals / Summary / free-text updates
//
// users.health_setup_step holds the NEXT unanswered question (1..5) so setup
// resumes seamlessly across restarts.

import { t } from "../i18n.js";
import { send, typing, langOf, sanitizeMd, photoDataUrl, splitGoalLines } from "../utils.js";
import { resetFlow } from "../session.js";
import { backKeyboard } from "../keyboards.js";
import {
  myHealthStartKeyboard,
  myHealthConfirmKeyboard,
  myHealthContextKeyboard,
  myHealthSummaryKeyboard,
  myHealthUpdateConfirmKeyboard,
  myHealthMenuKeyboard,
  myHealthGoalsKeyboard,
  myHealthGoalsInputKeyboard,
  myHealthTrendsKeyboard,
} from "../keyboards.js";
import { assembleTrendData, analyzeTrends, renderTrends } from "../trends.js";
import { startSnapshot } from "./snapshot.js";
import {
  updateUser,
  addConditions,
  listConditions,
  setConditionStatus,
  addHealthMedication,
  deactivateMedicationByName,
  listMedications,
  addHealthMetric,
  latestMetrics,
  upsertLifestyle,
  getLifestyle,
  addHealthGoal,
  getLatestHealthGoal,
} from "../supabase.js";
import {
  extractHealthConditions,
  extractHealthMedications,
  extractHealthMetrics,
  extractHealthGoal,
  parseHealthUpdate,
} from "../openai.js";
import { refreshKB } from "../kb.js";
import { errorKey } from "../errors.js";

// The setup questions, in order (2026-09-19: shortened from 7 to 5 — About
// You, Lifestyle and Anything Else were dropped, City added). Step numbers
// are positions in this list; reorder here and everything follows.
const QUESTIONS = ["metrics", "conditions", "medications", "goal", "city"];
const TOTAL_STEPS = QUESTIONS.length;
const kindOf = (q) => QUESTIONS[q - 1] || null;

// These extract structured records and show a Yes / Edit confirmation card;
// goal and city save with an inline ack.
const CONFIRM_KINDS = new Set(["metrics", "conditions", "medications"]);

const QUESTION_PROMPT_KEY = {
  metrics: "mh_q_metrics",
  conditions: "mh_q_conditions",
  medications: "mh_q_medications",
  goal: "mh_q_goal",
  city: "mh_q_city",
};

// Short label for each completed question, used in the "welcome back" recap.
const QUESTION_RECAP_KEY = {
  metrics: "mh_recap_metrics",
  conditions: "mh_recap_conditions",
  medications: "mh_recap_medications",
  goal: "mh_recap_goal",
  city: "mh_recap_city",
};

// ===================================================================
// Entry point
// ===================================================================
export async function startMyHealth(bot, chatId, session) {
  resetFlow(chatId);
  session.state = "myhealth";
  const lang = langOf(session);
  const status = session.user.health_profile_status || "not_started";

  if (status === "completed") {
    return showHealthMenu(bot, chatId, session);
  }

  if (status === "in_progress") {
    // Resume automatically — never restart, never ask "do you want to continue".
    const next = clampStep(session.user.health_setup_step) || 1;
    const doneKeys = [];
    for (let q = 1; q < next; q++) doneKeys.push(t(lang, QUESTION_RECAP_KEY[kindOf(q)]));
    const recap = doneKeys.length
      ? t(lang, "mh_resume_welcome", { done: joinList(lang, doneKeys) })
      : t(lang, "mh_resume_welcome_nostep");
    await send(bot, chatId, recap, { markdown: true });
    return promptQuestion(bot, chatId, session, next);
  }

  // not_started
  session.step = "intro";
  return send(bot, chatId, t(lang, "mh_intro"), {
    keyboard: myHealthStartKeyboard(lang),
    markdown: true,
  });
}

// ===================================================================
// Callbacks (mh:*)
// ===================================================================
export async function myHealthCallback(bot, chatId, session, data) {
  const lang = langOf(session);
  const action = data.split(":")[1];

  // A callback can arrive after the in-memory session was cleared (bot restart,
  // an intervening resetFlow). Re-assert the flow state so the user's next TYPED
  // answer routes back to myHealthText rather than falling through to showMenu.
  session.state = "myhealth";
  if (!session.data) session.data = {};

  if (action === "start") {
    try {
      session.user = await updateUser(session.user.id, {
        health_profile_status: "in_progress",
        health_setup_step: 1,
        health_setup_started_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error("myhealth start error:", e?.stack || e?.message || e);
      return send(bot, chatId, t(lang, "error_generic"), {
        keyboard: backKeyboard(lang),
        markdown: true,
      });
    }
    return promptQuestion(bot, chatId, session, 1);
  }

  // Returning-user sub-menu (completed profile) and the Goals section.
  if (action === "menu") return showHealthMenu(bot, chatId, session);
  if (action === "summary") return showSummary(bot, chatId, session);
  if (action === "goals") return showGoals(bot, chatId, session);
  if (action === "trends") return showTrends(bot, chatId, session);
  // 📊 Health Snapshot — the Executive Health Snapshot PDF (paid; the flow
  // shows the upgrade card to free users).
  if (action === "snapshot") return startSnapshot(bot, chatId, session);
  if (action === "goals_yes") return promptGoals(bot, chatId, session, true);
  if (action === "goals_no") {
    await send(bot, chatId, t(lang, "mh_goals_kept"), { markdown: true });
    return showHealthMenu(bot, chatId, session);
  }

  // Confirmation card for the current setup question.
  if (action === "ok") return commitPending(bot, chatId, session);
  if (action === "edit") {
    const q = currentQuestion(session);
    if (!q) return startMyHealth(bot, chatId, session);
    session.step = `q${q}`;
    return send(bot, chatId, t(lang, "mh_edit_reask"), { markdown: true });
  }
  if (action === "skip") {
    const q = currentQuestion(session);
    if (!q) return startMyHealth(bot, chatId, session);
    session.data.pending = null;
    return advanceAfter(bot, chatId, session, q);
  }

  // Glucose fasting/random/post-meal picker (after an ambiguous reading).
  if (action === "ctx") {
    const ctx = data.split(":")[2]; // fasting | random | post_meal
    return applyGlucoseContext(bot, chatId, session, ctx);
  }

  // "Update My Health Profile" from the summary — confirm before wiping the
  // setup step so a user who tapped by mistake can back out. History (conditions,
  // meds, metrics) is not deleted; only the 5-step guided flow re-runs.
  if (action === "update_profile") {
    return send(bot, chatId, t(lang, "mh_update_profile_confirm"), {
      keyboard: myHealthUpdateConfirmKeyboard(lang),
      markdown: true,
    });
  }
  if (action === "update_confirm") {
    try {
      session.user = await updateUser(session.user.id, {
        health_profile_status: "in_progress",
        health_setup_step: 1,
        health_setup_started_at: new Date().toISOString(),
        health_setup_completed_at: null,
      });
    } catch (e) {
      console.error("myhealth update_confirm error:", e?.stack || e?.message || e);
      return send(bot, chatId, t(lang, "error_generic"), {
        keyboard: backKeyboard(lang),
        markdown: true,
      });
    }
    return promptQuestion(bot, chatId, session, 1);
  }
  if (action === "update_cancel") {
    session.step = "update";
    return showSummary(bot, chatId, session);
  }
}

// ===================================================================
// Text handler
// ===================================================================
export async function myHealthText(bot, chatId, session, text, msg) {
  const lang = langOf(session);
  const imageDataUrl = msg ? await photoDataUrl(bot, msg) : null;
  const val = (text || msg?.caption || "").trim();

  // Intro screen: any text nudges them to tap Start.
  if (session.step === "intro") {
    return send(bot, chatId, t(lang, "mh_intro"), {
      keyboard: myHealthStartKeyboard(lang),
      markdown: true,
    });
  }

  // Goals section: the typed goals list, or a typed yes/no to "update them?".
  if (session.step === "goals_input") return saveGoals(bot, chatId, session, val);
  if (session.step === "goals_view") {
    if (/^(y|yes|yeah|yep|ok|okay|sure|update|haan|han|ji|jee)\b/i.test(val)) {
      return promptGoals(bot, chatId, session, true);
    }
    if (/^(n|no|nope|nahi|nahin|keep)\b/i.test(val)) {
      await send(bot, chatId, t(lang, "mh_goals_kept"), { markdown: true });
      return showHealthMenu(bot, chatId, session);
    }
    // They skipped the question and typed their new goals straight away.
    return saveGoals(bot, chatId, session, val);
  }

  // Completed profile (sub-menu or summary) → free-text AI-driven update.
  if (session.step === "update" || session.step === "menu") {
    return handleUpdate(bot, chatId, session, val, imageDataUrl);
  }
  if (session.step === "update_context") {
    // They typed instead of tapping — re-show the picker.
    return send(bot, chatId, t(lang, "mh_glucose_context_q"), {
      keyboard: myHealthContextKeyboard(lang),
      markdown: true,
    });
  }

  // Setup questions.
  const q = currentQuestion(session);
  if (!q) return startMyHealth(bot, chatId, session);
  if (!val && !imageDataUrl) return promptQuestion(bot, chatId, session, q);

  await typing(bot, chatId);
  try {
    return await extractForQuestion(bot, chatId, session, q, val, imageDataUrl);
  } catch (e) {
    console.error("myhealth extract error:", e?.message);
    return send(bot, chatId, t(lang, errorKey(e)), { markdown: true });
  }
}

// ===================================================================
// Setup: prompt / extract / confirm / save
// ===================================================================
async function promptQuestion(bot, chatId, session, q) {
  const lang = langOf(session);
  session.state = "myhealth";
  session.step = `q${q}`;
  if (!session.data) session.data = {};
  session.data.pending = null;
  const header = t(lang, "mh_question_of", { n: q, total: TOTAL_STEPS });
  const body = t(lang, QUESTION_PROMPT_KEY[kindOf(q)]);
  return send(bot, chatId, `${header}\n\n${body}`, {
    keyboard: myHealthStepKeyboard(lang, q),
    markdown: true,
  });
}

// Every question can be skipped.
function myHealthStepKeyboard(lang, q) {
  return { inline_keyboard: [[{ text: t(lang, "btn_mh_skip"), callback_data: "mh:skip" }]] };
}

// "No" / "none" to Q2 ("any other health conditions besides diabetes?") is a
// real answer, not a failed extraction.
const NO_ANSWER_RE = /^(no|none|nope|nothing|nil|na|n\/a|not really|no other|nahi|nahin|nai|koi nahi|koi nahin|نہیں|کوئی نہیں)\b[\s.!]*$/i;

// Q5 city: accept "Lahore", "I live in Lahore", "Karachi, Pakistan" and keep
// the city as typed (title-cased when it's Latin script).
export function parseCity(text) {
  let s = String(text || "").trim();
  s = s.replace(/^(i\s+(live|stay|am|'m)\s+(in|at|from)|i'm\s+from|im\s+from|from|in|my\s+city\s+is|city\s*[:-]?)\s+/i, "");
  s = s.replace(/\s+(city|shehar|mein|main|me)\s*$/i, "");
  s = s.replace(/[.!؟?]+$/, "").trim();
  if (!s || s.length > 60 || /^\d+$/.test(s) || !/\p{L}/u.test(s)) return null;
  if (/^[\x20-\x7E]+$/.test(s)) s = s.toLowerCase().replace(/(^|[\s,-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  return s;
}

async function extractForQuestion(bot, chatId, session, q, val, imageDataUrl) {
  const lang = langOf(session);
  const user = session.user;
  const kind = kindOf(q);

  // A plain "no" / "none" needs no AI extraction — treat it like Skip.
  if ((kind === "metrics" || kind === "medications") && !imageDataUrl && NO_ANSWER_RE.test(val)) {
    session.data.pending = null;
    return advanceAfter(bot, chatId, session, q);
  }

  if (kind === "metrics") {
    const { metrics } = await extractHealthMetrics(user, val);
    if (!metrics.length) {
      return send(bot, chatId, t(lang, "mh_none_metrics"), {
        keyboard: myHealthStepKeyboard(lang, q),
        markdown: true,
      });
    }
    session.data.pending = { metrics, original: val };
    const lines = metrics.map((m) => `• ${metricLine(m)}`).join("\n");
    session.step = `q${q}_confirm`;
    return send(bot, chatId, t(lang, "mh_confirm_intro", { lines }), {
      keyboard: myHealthConfirmKeyboard(lang),
      markdown: true,
    });
  }

  if (kind === "conditions") {
    if (NO_ANSWER_RE.test(val)) {
      await send(bot, chatId, t(lang, "mh_conditions_none_ack"), { markdown: true });
      return advanceAfter(bot, chatId, session, q);
    }
    const { conditions } = await extractHealthConditions(user, val);
    if (!conditions.length) {
      return send(bot, chatId, t(lang, "mh_none_conditions"), {
        keyboard: myHealthStepKeyboard(lang, q),
        markdown: true,
      });
    }
    session.data.pending = { conditions, original: val };
    const lines = conditions.map((c) => `• ${sanitizeMd(c)}`).join("\n");
    session.step = `q${q}_confirm`;
    return send(bot, chatId, t(lang, "mh_confirm_intro", { lines }), {
      keyboard: myHealthConfirmKeyboard(lang),
      markdown: true,
    });
  }

  if (kind === "medications") {
    const { medications } = await extractHealthMedications(user, val, imageDataUrl);
    if (!medications.length) {
      return send(bot, chatId, t(lang, "mh_none_medications"), {
        keyboard: myHealthStepKeyboard(lang, q),
        markdown: true,
      });
    }
    session.data.pending = { medications, original: val, source: imageDataUrl ? "image" : "text" };
    const lines = medications.map((m) => `• ${medLine(m)}`).join("\n");
    session.step = `q${q}_confirm`;
    return send(bot, chatId, t(lang, "mh_confirm_intro", { lines }), {
      keyboard: myHealthConfirmKeyboard(lang),
      markdown: true,
    });
  }

  if (kind === "goal") {
    const { goal } = await extractHealthGoal(user, val);
    session.data.pending = { goal };
    return commitPending(bot, chatId, session);
  }

  if (kind === "city") {
    const city = parseCity(val);
    if (!city) {
      return send(bot, chatId, t(lang, "mh_none_city"), {
        keyboard: myHealthStepKeyboard(lang, q),
        markdown: true,
      });
    }
    session.data.pending = { city };
    return commitPending(bot, chatId, session);
  }
}

// Persist session.data.pending for the current question, then advance.
async function commitPending(bot, chatId, session) {
  const lang = langOf(session);
  const q = currentQuestion(session);
  if (!q) return startMyHealth(bot, chatId, session);
  const kind = kindOf(q);
  const pending = session.data.pending || {};
  const uid = session.user.id;

  if (kind === "metrics" && pending.metrics) {
    for (const m of pending.metrics) {
      await addHealthMetric(uid, { ...m, source: "text", original_message: pending.original }).catch((e) =>
        console.error("addHealthMetric:", e?.message)
      );
      await mirrorMetricToUser(session, m);
    }
  } else if (kind === "conditions" && pending.conditions) {
    await addConditions(uid, pending.conditions, "text", pending.original).catch((e) =>
      console.error("addConditions:", e?.message)
    );
  } else if (kind === "medications" && pending.medications) {
    for (const m of pending.medications) {
      await addHealthMedication(uid, { ...m, source: pending.source, original_message: pending.original }).catch(
        (e) => console.error("addHealthMedication:", e?.message)
      );
    }
  } else if (kind === "goal" && pending.goal) {
    await addHealthGoal(uid, { goal: pending.goal }).catch((e) => console.error("addHealthGoal:", e?.message));
    session.user = await updateUser(uid, { primary_goal: pending.goal, goals: pending.goal });
  } else if (kind === "city" && pending.city) {
    // users.city feeds the AI coaches (local foods), the patient KB and the
    // profile card.
    session.user = await updateUser(uid, { city: pending.city });
  }

  // Conditions or medications affect the denormalized users row that
  // profileContext() reads at prompt time — refresh it.
  if (kind === "conditions" || kind === "medications") await denormalizeToUser(session);

  session.data.pending = null;
  if (CONFIRM_KINDS.has(kind)) await send(bot, chatId, t(lang, "mh_saved_ok"), { markdown: true });
  if (kind === "city" && pending.city) {
    await send(bot, chatId, t(lang, "mh_city_saved", { city: sanitizeMd(pending.city) }), { markdown: true });
  }
  return advanceAfter(bot, chatId, session, q);
}

// Move to the next question, or finish setup after Q5.
async function advanceAfter(bot, chatId, session, q) {
  const next = q + 1;
  if (next > TOTAL_STEPS) return finishSetup(bot, chatId, session);
  try {
    session.user = await updateUser(session.user.id, { health_setup_step: next });
  } catch (e) {
    console.error("myhealth advance error:", e?.stack || e?.message || e);
    const lang = langOf(session);
    return send(bot, chatId, t(lang, "error_generic"), {
      keyboard: backKeyboard(lang),
      markdown: true,
    });
  }
  return promptQuestion(bot, chatId, session, next);
}

async function finishSetup(bot, chatId, session) {
  const lang = langOf(session);
  try {
    session.user = await updateUser(session.user.id, {
      health_profile_status: "completed",
      health_setup_step: TOTAL_STEPS,
      health_setup_completed_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("myhealth finish error:", e?.stack || e?.message || e);
    return send(bot, chatId, t(lang, "error_generic"), {
      keyboard: backKeyboard(lang),
      markdown: true,
    });
  }
  await refreshKB(session.user).catch(() => {});
  await send(bot, chatId, t(lang, "mh_setup_complete"), { markdown: true });
  session.step = "update";
  return showSummary(bot, chatId, session);
}

// ===================================================================
// Completed profile: summary + free-text update
// ===================================================================
// ===================================================================
// Returning-user sub-menu + Goals section
// ===================================================================
export async function showHealthMenu(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "myhealth";
  session.step = "menu";
  if (session.data) session.data.pending = null;
  return send(bot, chatId, t(lang, "mh_menu_title"), {
    keyboard: myHealthMenuKeyboard(lang, session.user),
    markdown: true,
  });
}

// The goals on record: the active user_health_goal row (written by setup Q6,
// a free-text update, or this section), falling back to the users.goals
// mirror that the AI context and reports already read.
async function storedGoalsText(session) {
  const active = await getLatestHealthGoal(session.user.id).catch(() => null);
  return String(active?.goal || session.user.goals || session.user.primary_goal || "").trim();
}

function formatGoalList(text) {
  return splitGoalLines(text).map((g) => `• ${sanitizeMd(g)}`).join("\n");
}

async function showGoals(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "myhealth";
  const stored = await storedGoalsText(session);
  if (!stored) return promptGoals(bot, chatId, session, false);
  session.step = "goals_view";
  return send(bot, chatId, t(lang, "mh_goals_stored", { goals: formatGoalList(stored) }), {
    keyboard: myHealthGoalsKeyboard(lang),
    markdown: true,
  });
}

async function promptGoals(bot, chatId, session, isUpdate) {
  const lang = langOf(session);
  session.state = "myhealth";
  session.step = "goals_input";
  return send(bot, chatId, t(lang, isUpdate ? "mh_goals_update_prompt" : "mh_goals_prompt_first"), {
    keyboard: myHealthGoalsInputKeyboard(lang),
    markdown: true,
  });
}

// Store the goals verbatim (no AI rewrite): a new active user_health_goal
// row replaces the previous one, and users.goals / primary_goal are
// mirrored so the coach prompts, KB and reports pick them up as baseline.
async function saveGoals(bot, chatId, session, val) {
  const lang = langOf(session);
  const text = String(val || "").trim().slice(0, 600);
  if (!splitGoalLines(text).length) {
    return send(bot, chatId, t(lang, "mh_goals_empty_hint"), {
      keyboard: myHealthGoalsInputKeyboard(lang),
      markdown: true,
    });
  }
  const uid = session.user.id;
  try {
    await addHealthGoal(uid, { goal: text });
    session.user = await updateUser(uid, { primary_goal: text, goals: text });
  } catch (e) {
    console.error("myhealth goals save error:", e?.stack || e?.message || e);
    return send(bot, chatId, t(lang, errorKey(e)), {
      keyboard: myHealthGoalsInputKeyboard(lang),
      markdown: true,
    });
  }
  await refreshKB(session.user).catch(() => {});
  await send(bot, chatId, t(lang, "mh_goals_saved", { goals: formatGoalList(text) }), { markdown: true });
  return showHealthMenu(bot, chatId, session);
}

// 📈 Trends — stored glucose / HbA1c / weight analysed against the goals.
// Pure computation (see trends.js); the user stays on the sub-menu step so
// typed text afterwards is still a free-text health update.
async function showTrends(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "myhealth";
  session.step = "menu";
  await typing(bot, chatId);
  let text;
  try {
    const data = await assembleTrendData(session.user);
    text = renderTrends(lang, analyzeTrends(data));
  } catch (e) {
    console.error("myhealth trends error:", e?.stack || e?.message || e);
    return send(bot, chatId, t(lang, "error_generic"), {
      keyboard: myHealthMenuKeyboard(lang, session.user),
      markdown: true,
    });
  }
  return send(bot, chatId, text, { keyboard: myHealthTrendsKeyboard(lang), markdown: true });
}

async function showSummary(bot, chatId, session) {
  const lang = langOf(session);
  const uid = session.user.id;
  const [conditions, meds, metrics, life, goal] = await Promise.all([
    listConditions(uid).catch(() => []),
    listMedications(uid).catch(() => []),
    latestMetrics(uid).catch(() => []),
    getLifestyle(uid).catch(() => null),
    getLatestHealthGoal(uid).catch(() => null),
  ]);

  const byType = {};
  for (const m of metrics) byType[m.metric_type] = m;

  const lines = [t(lang, "mh_summary_header"), ""];
  const none = t(lang, "mh_summary_dash");

  lines.push(t(lang, "mh_lbl_conditions"));
  lines.push(conditions.length ? conditions.map((c) => sanitizeMd(c.condition_name)).join("\n") : none);
  lines.push("");

  lines.push(t(lang, "mh_lbl_meds"));
  lines.push(meds.length ? meds.map((m) => sanitizeMd(medLine(m))).join("\n") : none);
  lines.push("");

  if (byType.hba1c) lines.push(t(lang, "mh_lbl_hba1c"), metricValue(byType.hba1c, true), "");
  if (byType.glucose) lines.push(t(lang, "mh_lbl_glucose"), metricValue(byType.glucose, true), "");
  if (byType.weight) lines.push(t(lang, "mh_lbl_weight"), metricValue(byType.weight, true), "");
  if (byType.blood_pressure) lines.push(t(lang, "mh_lbl_bp"), metricValue(byType.blood_pressure, true), "");

  if (life?.smoking_status || life?.smoking_quantity) {
    lines.push(t(lang, "mh_lbl_smoking"), sanitizeMd(life.smoking_quantity || smokingLabel(lang, life.smoking_status)), "");
  }
  if (life?.activity_level || life?.activity_type) {
    lines.push(t(lang, "mh_lbl_activity"), sanitizeMd([life.activity_type, life.activity_level].filter(Boolean).join(" ")), "");
  }

  lines.push(t(lang, "mh_lbl_goal"));
  lines.push(goal ? sanitizeMd(goal.goal) : session.user.primary_goal ? sanitizeMd(session.user.primary_goal) : none);
  lines.push("");

  if (session.user.city) lines.push(t(lang, "mh_lbl_city"), sanitizeMd(session.user.city), "");
  lines.push(t(lang, "mh_summary_footer"));

  session.state = "myhealth";
  session.step = "update";
  return send(bot, chatId, lines.join("\n"), { keyboard: myHealthSummaryKeyboard(lang), markdown: true });
}

async function handleUpdate(bot, chatId, session, val, imageDataUrl) {
  const lang = langOf(session);
  if (!val && !imageDataUrl) {
    return send(bot, chatId, t(lang, "mh_update_hint"), { keyboard: backKeyboard(lang), markdown: true });
  }
  await typing(bot, chatId);
  let change;
  try {
    change = await parseHealthUpdate(session.user, val, imageDataUrl);
  } catch (e) {
    console.error("myhealth update error:", e?.message);
    return send(bot, chatId, t(lang, errorKey(e)), { keyboard: backKeyboard(lang), markdown: true });
  }

  // Ambiguous glucose → ask fasting / random / post-meal before saving that one.
  if (change.needs_context === "glucose" && change.metrics.some((m) => m.metric_type === "glucose")) {
    session.data.pendingUpdate = change;
    session.step = "update_context";
    return send(bot, chatId, t(lang, "mh_glucose_context_q"), {
      keyboard: myHealthContextKeyboard(lang),
      markdown: true,
    });
  }

  return applyUpdate(bot, chatId, session, change);
}

async function applyGlucoseContext(bot, chatId, session, ctx) {
  const change = session.data.pendingUpdate;
  session.data.pendingUpdate = null;
  session.step = "update";
  if (!change) return showSummary(bot, chatId, session);
  for (const m of change.metrics) {
    if (m.metric_type === "glucose" && !m.reading_context) m.reading_context = ctx;
  }
  change.needs_context = null;
  return applyUpdate(bot, chatId, session, change);
}

async function applyUpdate(bot, chatId, session, change) {
  const lang = langOf(session);
  const uid = session.user.id;
  let touched = false;

  for (const name of change.conditions.add) {
    await addConditions(uid, [name], "text", null).catch(() => {});
    touched = true;
  }
  for (const name of change.conditions.remove) {
    await setConditionStatus(uid, name, "resolved").catch(() => {});
    touched = true;
  }
  for (const m of change.medications.add) {
    await addHealthMedication(uid, { ...m, source: "text" }).catch(() => {});
    touched = true;
  }
  for (const name of change.medications.stop) {
    await deactivateMedicationByName(uid, name).catch(() => {});
    touched = true;
  }
  for (const m of change.metrics) {
    await addHealthMetric(uid, { ...m, source: "text" }).catch(() => {});
    await mirrorMetricToUser(session, m);
    touched = true;
  }
  if (change.lifestyle && Object.values(change.lifestyle).some((v) => v != null)) {
    await upsertLifestyle(uid, change.lifestyle).catch(() => {});
    touched = true;
  }
  if (change.goal) {
    await addHealthGoal(uid, { goal: change.goal }).catch(() => {});
    session.user = await updateUser(uid, { primary_goal: change.goal, goals: change.goal });
    touched = true;
  }

  const condOrMedTouched =
    change.conditions.add.length || change.conditions.remove.length ||
    change.medications.add.length || change.medications.stop.length;
  if (condOrMedTouched) await denormalizeToUser(session);

  if (touched) await refreshKB(session.user).catch(() => {});
  const reply = change.reply || t(lang, touched ? "mh_update_saved" : "mh_update_hint");
  session.step = "update";
  return send(bot, chatId, reply, { keyboard: backKeyboard(lang), markdown: true });
}

// ===================================================================
// Helpers
// ===================================================================
function clampStep(n) {
  const v = parseInt(n, 10);
  return Number.isInteger(v) && v >= 1 && v <= TOTAL_STEPS ? v : 0;
}

// The setup question currently in play, derived from session.step
// ("q3" or "q3_confirm" → 3). Returns null when not in a setup question.
function currentQuestion(session) {
  const m = /^q(\d)/.exec(session.step || "");
  return m ? parseInt(m[1], 10) : null;
}

function joinList(lang, items) {
  if (items.length <= 1) return items[0] || "";
  const sep = lang === "ur" ? " اور " : " and ";
  return items.slice(0, -1).join("، ") + sep + items[items.length - 1];
}

// Denormalize the active conditions + medications onto the user row as text.
// profileContext() (openai.js) reads users.other_conditions / users.medications,
// so this keeps every coach reply grounded in the latest My Health data without
// extra DB reads at prompt time.
async function denormalizeToUser(session) {
  const uid = session.user.id;
  const [conditions, meds] = await Promise.all([
    listConditions(uid).catch(() => []),
    listMedications(uid).catch(() => []),
  ]);
  const patch = {
    other_conditions: conditions.map((c) => c.condition_name).join(", ") || null,
    medications: meds.map((m) => medLine(m)).join("; ") || null,
  };
  session.user = await updateUser(uid, patch).catch(() => session.user);
}

async function mirrorMetricToUser(session, m) {
  const patch = {};
  if (m.metric_type === "weight" && m.value != null) patch.weight_kg = m.value;
  if (m.metric_type === "height" && m.value != null) patch.height_cm = m.value;
  if (m.metric_type === "hba1c" && m.value != null) patch.latest_hba1c = m.value;
  if (Object.keys(patch).length) {
    session.user = await updateUser(session.user.id, patch).catch(() => session.user);
  }
}

function medLine(m) {
  const bits = [m.name];
  if (m.dose) bits.push(m.dose);
  if (m.frequency) bits.push(`(${m.frequency})`);
  return bits.join(" ");
}

// `withDate` appends the measurement date (summary view) when known.
function metricLine(m, withDate = false) {
  let s;
  switch (m.metric_type) {
    case "hba1c":
      s = `HbA1c: ${m.value}%`;
      break;
    case "glucose":
      s = `Glucose: ${m.value} mg/dL${m.reading_context ? ` (${prettyContext(m.reading_context)})` : ""}`;
      break;
    case "weight":
      s = `Weight: ${m.value} kg`;
      break;
    case "height":
      s = `Height: ${m.value} cm`;
      break;
    case "waist":
      s = `Waist: ${m.value} cm`;
      break;
    case "blood_pressure":
      s = `Blood Pressure: ${m.value}/${m.secondary_value ?? "?"} mmHg`;
      break;
    default:
      s = `${m.metric_type}: ${m.value ?? ""}`;
  }
  if (withDate && m.measurement_date) s += ` (${m.measurement_date})`;
  return s;
}

// Value-only rendering for the summary (the bold label is already above it).
// `withDate` appends the measurement date in parentheses when known.
function metricValue(m, withDate = false) {
  let s;
  switch (m.metric_type) {
    case "hba1c":
      s = `${m.value}%`;
      break;
    case "glucose":
      s = `${m.value} mg/dL${m.reading_context ? ` (${prettyContext(m.reading_context)})` : ""}`;
      break;
    case "weight":
      s = `${m.value} kg`;
      break;
    case "height":
      s = `${m.value} cm`;
      break;
    case "waist":
      s = `${m.value} cm`;
      break;
    case "blood_pressure":
      s = `${m.value}/${m.secondary_value ?? "?"} mmHg`;
      break;
    default:
      s = `${m.value ?? ""}`;
  }
  if (withDate && m.measurement_date) s += ` (${m.measurement_date})`;
  return s;
}

function prettyContext(c) {
  return { fasting: "Fasting", random: "Random", post_meal: "Post-meal" }[c] || c;
}

function smokingLabel(lang, status) {
  return t(lang, `mh_smoking_${status}`);
}
