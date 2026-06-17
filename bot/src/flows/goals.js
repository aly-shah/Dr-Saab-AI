import { t } from "../i18n.js";
import { send, sanitizeMd, langOf } from "../utils.js";
import { goalsKeyboard, backKeyboard } from "../keyboards.js";
import { updateUser } from "../supabase.js";
import { applyScores } from "../scores.js";

// Human-readable label for the onboarding primary_goal choices.
const GOAL_LABEL = {
  lower_a1c: "Lower my HbA1c",
  lose_weight: "Lose weight",
  eat_healthy: "Eat healthier",
  exercise: "Exercise more",
  consistent: "Stay consistent",
  understand: "Understand my diabetes",
};

function currentGoal(user) {
  if (user.goals) return user.goals;
  if (user.primary_goal) return GOAL_LABEL[user.primary_goal] || user.primary_goal;
  return null;
}

export async function showGoals(bot, chatId, session) {
  session.state = "idle";
  const lang = langOf(session);
  const goal = currentGoal(session.user);
  const line = goal ? t(lang, "goals_current", { goal: sanitizeMd(goal) }) : t(lang, "goals_none");
  await send(bot, chatId, `${t(lang, "goals_title")}\n\n${line}`, {
    keyboard: goalsKeyboard(lang),
    markdown: true,
  });
}

export async function startGoalSet(bot, chatId, session) {
  session.state = "goals";
  const lang = langOf(session);
  await send(bot, chatId, t(lang, "goals_prompt"), { keyboard: backKeyboard(lang), markdown: true });
}

export async function goalsText(bot, chatId, session, text) {
  const lang = langOf(session);
  const goal = (text || "").trim().slice(0, 200);
  if (!goal) return send(bot, chatId, t(lang, "goals_prompt"), { keyboard: backKeyboard(lang), markdown: true });

  session.user = await updateUser(session.user.id, { goals: goal });
  session.user = await applyScores(session.user, "goal_set");
  session.state = "idle";
  await send(bot, chatId, t(lang, "goals_saved", { goal: sanitizeMd(goal) }), {
    keyboard: backKeyboard(lang),
    markdown: true,
  });
}
