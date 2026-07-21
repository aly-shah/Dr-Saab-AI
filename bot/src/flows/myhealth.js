// ❤️ My Health — the user's canonical, conversational health profile.
// Spec: "My Health" (2026-07).
//
// One-time 7-question guided setup builds the profile; afterwards the user
// simply tells DrSaab what changed in free text and the AI updates the right
// record. There are NO submenus — the whole feature is one conversation.
//
// Profile states (users.health_profile_status):
//   not_started → show intro + Start
//   in_progress → resume automatically from the next unanswered question
//   completed   → show the health summary; free text becomes an AI-driven update
//
// users.health_setup_step holds the NEXT unanswered question (1..7) so setup
// resumes seamlessly across restarts.

import { t } from "../i18n.js";
import { send, typing, langOf, sanitizeMd, photoDataUrl } from "../utils.js";
import { resetFlow } from "../session.js";
import { backKeyboard } from "../keyboards.js";
import {
  myHealthStartKeyboard,
  myHealthConfirmKeyboard,
  myHealthContextKeyboard,
  myHealthSummaryKeyboard,
  myHealthUpdateConfirmKeyboard,
} from "../keyboards.js";
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
  saveProfileAnswer,
} from "../supabase.js";
import {
  extractHealthConditions,
  extractHealthMedications,
  extractHealthMetrics,
  extractLifestyle,
  extractHealthGoal,
  extractAboutYou,
  parseHealthUpdate,
} from "../openai.js";
import { refreshKB } from "../kb.js";
import { errorKey } from "../errors.js";

const TOTAL_STEPS = 7;

// Steps 2–4 (conditions / medications / metrics) extract structured records
// and show a Yes / Edit confirmation card. Q1 (About You), Q5 (lifestyle),
// Q6 (goal), Q7 (anything else) save with an inline ack.
const CONFIRM_STEPS = new Set([2, 3, 4]);

// Step-agnostic i18n keys let us re-order questions without churning strings.
const QUESTION_PROMPT_KEY = {
  1: "mh_q_aboutyou",
  2: "mh_q_conditions",
  3: "mh_q_medications",
  4: "mh_q_metrics",
  5: "mh_q_lifestyle",
  6: "mh_q_goal",
  7: "mh_q_anything",
};

// Short label for each completed question, used in the "welcome back" recap.
const QUESTION_RECAP_KEY = {
  1: "mh_recap_aboutyou",
  2: "mh_recap_conditions",
  3: "mh_recap_medications",
  4: "mh_recap_metrics",
  5: "mh_recap_lifestyle",
  6: "mh_recap_goal",
  7: "mh_recap_anything",
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
    session.step = "update";
    return showSummary(bot, chatId, session);
  }

  if (status === "in_progress") {
    // Resume automatically — never restart, never ask "do you want to continue".
    const next = clampStep(session.user.health_setup_step) || 1;
    const doneKeys = [];
    for (let q = 1; q < next; q++) doneKeys.push(t(lang, QUESTION_RECAP_KEY[q]));
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
  // meds, metrics) is not deleted; only the 7-step guided flow re-runs.
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

  // Completed profile → free-text AI-driven update.
  if (session.step === "update") return handleUpdate(bot, chatId, session, val, imageDataUrl);
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

  // Q1 "About You" has a special layout: show what we already know from
  // onboarding, and ask only for what's missing (or ask for confirmation).
  if (q === 1) {
    const known = knownAboutYou(session.user);
    const known_block = renderAboutYouLines(lang, known);
    const missing = Object.keys(known).filter((k) => known[k] == null);
    let ask;
    if (missing.length === 0) ask = t(lang, "mh_q_aboutyou_ask_confirm");
    else if (missing.length === 4) ask = t(lang, "mh_q_aboutyou_ask_none");
    else ask = t(lang, "mh_q_aboutyou_ask_missing", { missing: missingList(lang, missing) });
    const body = t(lang, "mh_q_aboutyou", {
      known_block: known_block ? `${known_block}\n\n` : "",
      ask,
    });
    return send(bot, chatId, `${header}\n\n${body}`, {
      keyboard: myHealthStepKeyboard(lang, q),
      markdown: true,
    });
  }

  const body = t(lang, QUESTION_PROMPT_KEY[q]);
  return send(bot, chatId, `${header}\n\n${body}`, {
    keyboard: myHealthStepKeyboard(lang, q),
    markdown: true,
  });
}

// Q1 (About You) is essential — no Skip. Q7 (Anything Else) has "Nothing else"
// as a valid typed answer, so Skip is redundant. Every other step offers Skip.
function myHealthStepKeyboard(lang, q) {
  if (q === 1 || q === 7) return { inline_keyboard: [] };
  return { inline_keyboard: [[{ text: t(lang, "btn_mh_skip"), callback_data: "mh:skip" }]] };
}

// Snapshot the About You fields from the users row. Values are trimmed to
// simple scalars; nulls mean "missing" and drive the Q1 pre-fill logic.
function knownAboutYou(u) {
  return {
    gender: u?.gender || null,
    age: Number.isInteger(u?.age) && u.age > 0 ? u.age : null,
    height_cm: u?.height_cm != null ? Number(u.height_cm) : null,
    weight_kg: u?.weight_kg != null ? Number(u.weight_kg) : null,
  };
}

function renderAboutYouLines(lang, known) {
  const lines = [];
  if (known.gender) lines.push(t(lang, "mh_aboutyou_line_gender", { value: prettyGender(lang, known.gender) }));
  if (known.age != null) lines.push(t(lang, "mh_aboutyou_line_age", { value: known.age }));
  if (known.height_cm != null) lines.push(t(lang, "mh_aboutyou_line_height", { value: known.height_cm }));
  if (known.weight_kg != null) lines.push(t(lang, "mh_aboutyou_line_weight", { value: known.weight_kg }));
  return lines.join("\n");
}

function prettyGender(lang, g) {
  const m = { male: "Male", female: "Female", other: "Other" };
  return m[g] || g;
}

function missingList(lang, missing) {
  const labels = missing.map((k) => t(lang, `mh_q_aboutyou_missing_${k === "height_cm" ? "height" : k === "weight_kg" ? "weight" : k}`));
  return joinList(lang, labels);
}

async function extractForQuestion(bot, chatId, session, q, val, imageDataUrl) {
  const lang = langOf(session);
  const user = session.user;

  // Q1 — About You. Regex extractor (no AI call). Handles "ok" confirmation
  // when all 4 fields are already known; parses any subset of gender/age/
  // height/weight from natural language; re-prompts if still incomplete.
  if (q === 1) {
    const parsed = extractAboutYou(val);
    const patch = {};
    if (parsed.gender) patch.gender = parsed.gender;
    if (parsed.age != null) patch.age = parsed.age;
    if (parsed.height_cm != null) patch.height_cm = parsed.height_cm;
    if (parsed.weight_kg != null) patch.weight_kg = parsed.weight_kg;

    const missingBefore = Object.entries(knownAboutYou(user)).filter(([, v]) => v == null).map(([k]) => k);

    if (parsed.ackOnly && !missingBefore.length) {
      await send(bot, chatId, t(lang, "mh_aboutyou_ok_ack"), { markdown: true });
      return advanceAfter(bot, chatId, session, q);
    }

    if (!Object.keys(patch).length && !parsed.ackOnly) {
      return send(bot, chatId, t(lang, "mh_none_aboutyou"), {
        keyboard: myHealthStepKeyboard(lang, q),
        markdown: true,
      });
    }

    if (Object.keys(patch).length) {
      session.user = await updateUser(user.id, patch).catch(() => user);
      await send(bot, chatId, t(lang, "mh_aboutyou_updated"), { markdown: true });
    }

    const missingAfter = Object.entries(knownAboutYou(session.user)).filter(([, v]) => v == null).map(([k]) => k);
    if (missingAfter.length === 0) return advanceAfter(bot, chatId, session, q);
    // Still missing some fields — re-ask just for those.
    return send(bot, chatId, t(lang, "mh_q_aboutyou_ask_missing", { missing: missingList(lang, missingAfter) }), {
      keyboard: myHealthStepKeyboard(lang, q),
      markdown: true,
    });
  }

  if (q === 2) {
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

  if (q === 3) {
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

  if (q === 4) {
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

  if (q === 5) {
    const life = await extractLifestyle(user, val);
    session.data.pending = { lifestyle: { ...life, original_message: val } };
    return commitPending(bot, chatId, session);
  }

  if (q === 6) {
    const { goal } = await extractHealthGoal(user, val);
    session.data.pending = { goal };
    return commitPending(bot, chatId, session);
  }

  // Q7 — Anything Else? Free-text catch-all. "Nothing else" / "none" / "no"
  // are shortcuts that advance without saving anything.
  if (q === 7) {
    const clean = String(val || "").trim();
    if (!clean || /^(nothing(\s+else)?|none|no|n\/?a|nope|nothing to add)\.?$/i.test(clean)) {
      await send(bot, chatId, t(lang, "mh_anything_none_ack"), { markdown: true });
      return advanceAfter(bot, chatId, session, q);
    }
    session.data.pending = { anything_else: clean.slice(0, 800) };
    return commitPending(bot, chatId, session);
  }
}

// Persist session.data.pending for the current question, then advance.
async function commitPending(bot, chatId, session) {
  const lang = langOf(session);
  const q = currentQuestion(session);
  if (!q) return startMyHealth(bot, chatId, session);
  const pending = session.data.pending || {};
  const uid = session.user.id;

  if (q === 2 && pending.conditions) {
    await addConditions(uid, pending.conditions, "text", pending.original).catch((e) =>
      console.error("addConditions:", e?.message)
    );
  } else if (q === 3 && pending.medications) {
    for (const m of pending.medications) {
      await addHealthMedication(uid, { ...m, source: pending.source, original_message: pending.original }).catch(
        (e) => console.error("addHealthMedication:", e?.message)
      );
    }
  } else if (q === 4 && pending.metrics) {
    for (const m of pending.metrics) {
      await addHealthMetric(uid, { ...m, source: "text", original_message: pending.original }).catch((e) =>
        console.error("addHealthMetric:", e?.message)
      );
      await mirrorMetricToUser(session, m);
    }
  } else if (q === 5 && pending.lifestyle) {
    await upsertLifestyle(uid, pending.lifestyle).catch((e) => console.error("upsertLifestyle:", e?.message));
  } else if (q === 6 && pending.goal) {
    await addHealthGoal(uid, { goal: pending.goal }).catch((e) => console.error("addHealthGoal:", e?.message));
    session.user = await updateUser(uid, { primary_goal: pending.goal, goals: pending.goal });
  } else if (q === 7 && pending.anything_else) {
    // Free-text catch-all lives in the users.profile_answers JSONB store so
    // no new column is needed. The coach's system prompt already surfaces
    // profile_answers via profileContext() → the note reaches the LLM.
    await saveProfileAnswer(uid, "mh_anything_else", pending.anything_else).catch((e) =>
      console.error("saveProfileAnswer (anything_else):", e?.message)
    );
  }

  // Conditions (Q2) or medications (Q3) affect the denormalized users row
  // that profileContext() reads at prompt time — refresh it.
  if (q === 2 || q === 3) await denormalizeToUser(session);

  session.data.pending = null;
  if (CONFIRM_STEPS.has(q)) await send(bot, chatId, t(lang, "mh_saved_ok"), { markdown: true });
  if (q === 7 && pending.anything_else) await send(bot, chatId, t(lang, "mh_anything_saved"), { markdown: true });
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
