import { t } from "../i18n.js";
import { send, sanitizeMd, langOf } from "../utils.js";
import {
  goalsListKeyboard,
  goalSuggestionsKeyboard,
  goalSkipKeyboard,
  goalDetailKeyboard,
  goalEditKeyboard,
  goalReviewYesKeyboard,
  goalReviewNotYetKeyboard,
  GOAL_SUGGESTIONS,
  GOAL_MAX_ACTIVE,
} from "../keyboards.js";
import {
  listActiveGoals,
  getGoal,
  addGoal,
  updateGoal,
} from "../supabase.js";
import { applyScores } from "../scores.js";

// Session sub-state keys used by the goals flow.
//   session.state = "goals"
//   session.step  = "add:custom"     | "add:motivation" | "add:target"
//                 | "edit:title"     | "edit:motivation" | "edit:target"
//                 | "review_target"                  (target-date update after Not-Yet)
//   session.data.goalDraft = { title, suggestion_key, motivation, target_date, target_hint }
//   session.data.goalId    = id of the goal being edited / reviewed

// ---------- helpers ----------

const SKIP_WORDS = new Set(["skip", "چھوڑیں", "chhorein", "chhorayn", "no", "-", "none"]);
const isSkip = (s) => SKIP_WORDS.has(String(s || "").trim().toLowerCase());

// Very forgiving date parser. Accepts ISO / real dates ("31 December 2026"),
// relative phrases ("in 6 months", "6 months mein", "3 hafte"), or well-known
// milestones ("before eid", "eid se pehle", "ramadan"). If it can't lock a
// hard date, returns { date: null, hint: original } so we still show something.
function parseTargetDate(input) {
  const raw = String(input || "").trim();
  if (!raw) return { date: null, hint: null };

  // ISO date first
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return { date: raw, hint: null };

  // Real date via Date parser (Chrome / Node handles "31 December 2026")
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
    return { date: parsed.toISOString().slice(0, 10), hint: null };
  }

  // "in N days/weeks/months/years" — accept English + Roman-Urdu ordering
  const rel = raw.toLowerCase().match(
    /(\d+)\s*(day|days|week|weeks|month|months|year|years|hafta|hafte|mahina|mahine|maah|saal|sal)/,
  );
  if (rel) {
    const n = parseInt(rel[1], 10);
    const kind = rel[2];
    const d = new Date();
    if (/day/.test(kind)) d.setDate(d.getDate() + n);
    else if (/(week|hafta|hafte)/.test(kind)) d.setDate(d.getDate() + n * 7);
    else if (/(month|mahina|mahine|maah)/.test(kind)) d.setMonth(d.getMonth() + n);
    else if (/(year|saal|sal)/.test(kind)) d.setFullYear(d.getFullYear() + n);
    return { date: d.toISOString().slice(0, 10), hint: raw };
  }

  // Fuzzy / non-parseable — keep the raw text so we can echo it back later.
  return { date: null, hint: raw };
}

function labelForGoal(g, lang) {
  if (!g) return "";
  if (g.title) return g.title;
  if (g.suggestion_key) return t(lang, `goalsug_${g.suggestion_key}`);
  return "";
}

function formatTarget(g, lang) {
  if (!g) return "";
  if (g.target_hint) return g.target_hint;
  if (g.target_date) return g.target_date;
  return t(lang, "goal_detail_no_target");
}

// ---------- entry: list ----------

export async function showGoals(bot, chatId, session) {
  session.state = "idle";
  session.step = null;
  session.data = { ...(session.data || {}), goalDraft: null, goalId: null };
  const lang = langOf(session);

  const goals = await listActiveGoals(session.user.id).catch(() => []);
  if (!goals.length) {
    return send(bot, chatId, t(lang, "goals_none"), {
      keyboard: goalsListKeyboard(lang, []),
      markdown: true,
    });
  }
  const header = t(lang, "goals_list_header", { count: goals.length, max: GOAL_MAX_ACTIVE });
  return send(bot, chatId, header, {
    keyboard: goalsListKeyboard(lang, goals),
    markdown: true,
  });
}

// ---------- add ----------

export async function startAddGoal(bot, chatId, session) {
  const lang = langOf(session);
  const goals = await listActiveGoals(session.user.id).catch(() => []);
  if (goals.length >= GOAL_MAX_ACTIVE) {
    return send(bot, chatId, t(lang, "goals_full", { max: GOAL_MAX_ACTIVE }), {
      keyboard: goalsListKeyboard(lang, goals),
      markdown: true,
    });
  }
  session.state = "goals";
  session.step = "add:pick";
  session.data = { ...(session.data || {}), goalDraft: {} };
  return send(bot, chatId, t(lang, "goal_pick_prompt"), {
    keyboard: goalSuggestionsKeyboard(lang),
    markdown: true,
  });
}

export async function pickGoalSuggestion(bot, chatId, session, key) {
  const lang = langOf(session);
  session.data = session.data || {};
  session.data.goalDraft = session.data.goalDraft || {};

  if (key === "other") {
    session.state = "goals";
    session.step = "add:custom";
    return send(bot, chatId, t(lang, "goal_custom_prompt"), {
      keyboard: goalSkipKeyboard(lang, "cancel"),
      markdown: true,
    });
  }

  if (!GOAL_SUGGESTIONS.includes(key)) return showGoals(bot, chatId, session);
  session.data.goalDraft = {
    suggestion_key: key,
    title: t(lang, `goalsug_${key}`),
  };
  return promptMotivation(bot, chatId, session);
}

async function handleAddCustom(bot, chatId, session, text) {
  const lang = langOf(session);
  const title = String(text || "").trim().slice(0, 200);
  if (!title) {
    return send(bot, chatId, t(lang, "goal_custom_prompt"), {
      keyboard: goalSkipKeyboard(lang, "cancel"),
      markdown: true,
    });
  }
  session.data.goalDraft = { suggestion_key: "custom", title };
  return promptMotivation(bot, chatId, session);
}

async function promptMotivation(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "goals";
  session.step = "add:motivation";
  return send(bot, chatId, t(lang, "goal_motivation_prompt"), {
    keyboard: goalSkipKeyboard(lang, "motivation"),
    markdown: true,
  });
}

async function handleMotivation(bot, chatId, session, text) {
  const lang = langOf(session);
  const value = String(text || "").trim().slice(0, 500);
  session.data.goalDraft = session.data.goalDraft || {};
  if (value && !isSkip(value)) {
    session.data.goalDraft.motivation = value;
    await send(bot, chatId, t(lang, "goal_motivation_saved"), { markdown: true });
  }
  return promptTargetDate(bot, chatId, session);
}

async function promptTargetDate(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "goals";
  session.step = "add:target";
  return send(bot, chatId, t(lang, "goal_target_prompt"), {
    keyboard: goalSkipKeyboard(lang, "target"),
    markdown: true,
  });
}

async function handleTargetDate(bot, chatId, session, text) {
  const lang = langOf(session);
  const raw = String(text || "").trim();
  if (raw && !isSkip(raw)) {
    const { date, hint } = parseTargetDate(raw);
    session.data.goalDraft = session.data.goalDraft || {};
    if (date) session.data.goalDraft.target_date = date;
    if (hint) session.data.goalDraft.target_hint = hint.slice(0, 100);
    await send(bot, chatId, t(lang, "goal_target_saved"), { markdown: true });
  } else {
    await send(bot, chatId, t(lang, "goal_target_skipped"), { markdown: true });
  }
  return finalizeAdd(bot, chatId, session);
}

async function finalizeAdd(bot, chatId, session) {
  const lang = langOf(session);
  const draft = session.data?.goalDraft || {};
  if (!draft.title) {
    // Safety net — bounce back to picker
    session.data.goalDraft = null;
    return startAddGoal(bot, chatId, session);
  }
  try {
    await addGoal(session.user.id, {
      title: draft.title,
      suggestion_key: draft.suggestion_key || null,
      motivation: draft.motivation || null,
      target_date: draft.target_date || null,
      target_hint: draft.target_hint || null,
    });
    session.user = await applyScores(session.user, "goal_set");
  } catch (e) {
    console.error("addGoal failed:", e?.message);
  }
  session.state = "idle";
  session.step = null;
  session.data.goalDraft = null;
  await send(bot, chatId, t(lang, "goal_added", { goal: sanitizeMd(draft.title) }), {
    markdown: true,
  });
  return showGoals(bot, chatId, session);
}

// ---------- detail / manage ----------

export async function showGoalDetail(bot, chatId, session, goalId) {
  const lang = langOf(session);
  const g = await getGoal(session.user.id, goalId).catch(() => null);
  if (!g) return showGoals(bot, chatId, session);

  const lines = [t(lang, "goal_detail_title", { goal: sanitizeMd(g.title || "") })];
  lines.push(
    g.motivation
      ? t(lang, "goal_detail_motivation", { motivation: sanitizeMd(g.motivation) })
      : t(lang, "goal_detail_no_motivation"),
  );
  lines.push(
    g.target_date || g.target_hint
      ? t(lang, "goal_detail_target", { target: sanitizeMd(formatTarget(g, lang)) })
      : t(lang, "goal_detail_no_target"),
  );
  session.state = "idle";
  session.step = null;
  session.data = { ...(session.data || {}), goalId: g.id };
  return send(bot, chatId, lines.join("\n"), {
    keyboard: goalDetailKeyboard(lang, g.id),
    markdown: true,
  });
}

export async function completeGoal(bot, chatId, session, goalId) {
  const lang = langOf(session);
  await updateGoal(session.user.id, goalId, {
    status: "completed",
    completed_at: new Date().toISOString(),
  }).catch(() => null);
  await send(bot, chatId, t(lang, "goal_completed_ack"), { markdown: true });
  return showGoals(bot, chatId, session);
}

export async function deleteGoal(bot, chatId, session, goalId) {
  const lang = langOf(session);
  await updateGoal(session.user.id, goalId, { status: "removed" }).catch(() => null);
  await send(bot, chatId, t(lang, "goal_deleted_ack"), { markdown: true });
  return showGoals(bot, chatId, session);
}

// ---------- edit ----------

export async function showEditMenu(bot, chatId, session, goalId) {
  const lang = langOf(session);
  const g = await getGoal(session.user.id, goalId).catch(() => null);
  if (!g) return showGoals(bot, chatId, session);
  session.state = "idle";
  session.step = null;
  session.data = { ...(session.data || {}), goalId };
  return send(bot, chatId, t(lang, "goal_detail_title", { goal: sanitizeMd(g.title || "") }), {
    keyboard: goalEditKeyboard(lang, goalId),
    markdown: true,
  });
}

export async function startEditField(bot, chatId, session, goalId, field) {
  const lang = langOf(session);
  session.state = "goals";
  session.step = `edit:${field}`;
  session.data = { ...(session.data || {}), goalId };
  const promptKey =
    field === "title"
      ? "goal_edit_title_prompt"
      : field === "motivation"
      ? "goal_edit_motivation_prompt"
      : "goal_edit_target_prompt";
  return send(bot, chatId, t(lang, promptKey), {
    keyboard: goalSkipKeyboard(lang, `edit_${field}`),
    markdown: true,
  });
}

async function handleEditField(bot, chatId, session, field, text) {
  const lang = langOf(session);
  const goalId = session.data?.goalId;
  if (!goalId) return showGoals(bot, chatId, session);
  const raw = String(text || "").trim();

  const patch = {};
  if (field === "title") {
    if (!raw) {
      return send(bot, chatId, t(lang, "goal_edit_title_prompt"), {
        keyboard: goalSkipKeyboard(lang, "edit_title"),
        markdown: true,
      });
    }
    patch.title = raw.slice(0, 200);
    patch.suggestion_key = "custom";
  } else if (field === "motivation") {
    patch.motivation = isSkip(raw) ? null : raw.slice(0, 500);
  } else if (field === "target") {
    if (isSkip(raw)) {
      patch.target_date = null;
      patch.target_hint = null;
    } else {
      const { date, hint } = parseTargetDate(raw);
      patch.target_date = date;
      patch.target_hint = hint ? hint.slice(0, 100) : null;
    }
    patch.review_sent_at = null; // re-enable review reminder
  }

  await updateGoal(session.user.id, goalId, patch).catch(() => null);
  session.state = "idle";
  session.step = null;
  return showGoalDetail(bot, chatId, session, goalId);
}

// ---------- target-date review ----------

// Called by the callback handler when the user answers Yes/Not Yet / follow-up.
export async function handleReviewAction(bot, chatId, session, goalId, action) {
  const lang = langOf(session);
  const g = await getGoal(session.user.id, goalId).catch(() => null);
  if (!g) return showGoals(bot, chatId, session);

  switch (action) {
    case "yes":
      await send(bot, chatId, t(lang, "goal_review_yes_prompt"), {
        keyboard: goalReviewYesKeyboard(lang, goalId),
        markdown: true,
      });
      return;
    case "notyet":
      await send(bot, chatId, t(lang, "goal_review_notyet_prompt"), {
        keyboard: goalReviewNotYetKeyboard(lang, goalId),
        markdown: true,
      });
      return;
    case "new":
      // mark this one complete then start Add
      await updateGoal(session.user.id, goalId, {
        status: "completed",
        completed_at: new Date().toISOString(),
      }).catch(() => null);
      await send(bot, chatId, t(lang, "goal_completed_ack"), { markdown: true });
      return startAddGoal(bot, chatId, session);
    case "continue":
      // clear review timestamp so scheduler will fire again after a new target
      await updateGoal(session.user.id, goalId, { review_sent_at: new Date().toISOString() }).catch(() => null);
      return send(bot, chatId, t(lang, "goal_review_continue_ack"), { markdown: true });
    case "remove":
      await updateGoal(session.user.id, goalId, { status: "removed" }).catch(() => null);
      return send(bot, chatId, t(lang, "goal_review_remove_ack"), { markdown: true });
    case "updatetarget":
      session.state = "goals";
      session.step = "review_target";
      session.data = { ...(session.data || {}), goalId };
      return send(bot, chatId, t(lang, "goal_review_update_target_prompt"), {
        keyboard: goalSkipKeyboard(lang, "review_target"),
        markdown: true,
      });
    default:
      return;
  }
}

async function handleReviewTargetInput(bot, chatId, session, text) {
  const lang = langOf(session);
  const goalId = session.data?.goalId;
  if (!goalId) return showGoals(bot, chatId, session);
  const raw = String(text || "").trim();
  if (!raw || isSkip(raw)) {
    session.state = "idle";
    session.step = null;
    return showGoalDetail(bot, chatId, session, goalId);
  }
  const { date, hint } = parseTargetDate(raw);
  await updateGoal(session.user.id, goalId, {
    target_date: date,
    target_hint: hint ? hint.slice(0, 100) : null,
    review_sent_at: null,
  }).catch(() => null);
  await send(bot, chatId, t(lang, "goal_target_saved"), { markdown: true });
  session.state = "idle";
  session.step = null;
  return showGoalDetail(bot, chatId, session, goalId);
}

// Skip callback dispatcher for the various goal steps (Add motivation / target,
// or Edit motivation/target). Cancels back to the goal list for the initial
// picker.
export async function handleSkipAction(bot, chatId, session, action) {
  if (!action || action === "cancel") return showGoals(bot, chatId, session);
  if (action === "motivation") return promptTargetDate(bot, chatId, session);
  if (action === "target") return finalizeAdd(bot, chatId, session);
  if (action === "edit_title") return showGoalDetail(bot, chatId, session, session.data?.goalId);
  if (action === "edit_motivation") return handleEditField(bot, chatId, session, "motivation", "");
  if (action === "edit_target") return handleEditField(bot, chatId, session, "target", "");
  if (action === "review_target") return handleReviewTargetInput(bot, chatId, session, "");
  return showGoals(bot, chatId, session);
}

// ---------- text router (called from bot.js when session.state === "goals") ----------

export async function goalsText(bot, chatId, session, text) {
  const step = session.step || "";
  if (step === "add:custom") return handleAddCustom(bot, chatId, session, text);
  if (step === "add:motivation") return handleMotivation(bot, chatId, session, text);
  if (step === "add:target") return handleTargetDate(bot, chatId, session, text);
  if (step === "edit:title") return handleEditField(bot, chatId, session, "title", text);
  if (step === "edit:motivation") return handleEditField(bot, chatId, session, "motivation", text);
  if (step === "edit:target") return handleEditField(bot, chatId, session, "target", text);
  if (step === "review_target") return handleReviewTargetInput(bot, chatId, session, text);
  // Fallback for stale sessions: return to the list.
  return showGoals(bot, chatId, session);
}

// Kept exported for backwards-compat with older bot.js dispatch that mapped
// `goal:set` (legacy button) to the entry-point.
export const startGoalSet = startAddGoal;
