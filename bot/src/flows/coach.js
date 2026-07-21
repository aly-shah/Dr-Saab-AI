import { t } from "../i18n.js";
import { send, typing, langOf, isPremium, photoDataUrl } from "../utils.js";
import { backKeyboard } from "../keyboards.js";
import { coachReply } from "../openai.js";
import { errorKey } from "../errors.js";
import { saveCoachMessage, weeklyStats } from "../supabase.js";
import { applyScores } from "../scores.js";
import { compactKB } from "../kb.js";
import { pushHistory } from "../session.js";
import { matchRestaurant, restaurantHint, PK_RESTAURANTS } from "../restaurants.js";
import { awardEventToChallenges } from "./challengeEngine.js";

// Meal-analysis outcome parser for the Healthy Plate challenge.
// The MEAL ANALYSER system prompt (openai.js) tags every meal with a
// coloured circle in its "*Blood sugar impact:*" line:
//   🟢 Low     → Healthy Plate (counts)
//   🟡 Moderate → not a Healthy Plate
//   🔴 High    → not a Healthy Plate
// The label scanner uses the same colour convention on its "*Rating:*" line.
function isHealthyPlateReply(kind, reply) {
  if (!reply) return false;
  if (kind !== "analyze" && kind !== "label") return false;
  // Look for a green marker on the impact / rating line specifically so a
  // "healthy swap" mention with 🟢 elsewhere in the reply doesn't false-fire.
  const line = String(reply).split("\n").find((l) => /impact|rating/i.test(l));
  return line ? /🟢/.test(line) : false;
}

// Report the meal to the challenges engine and — if the user is in a Healthy
// Plate challenge — send the follow-up 🟢/🟡 confirmation from spec §8.4 with
// the fresh count + rank.
async function reportMealForChallenges(bot, chatId, user, lang, kind, reply) {
  if (kind !== "analyze" && kind !== "food" && kind !== "label") return;
  const isHealthy = isHealthyPlateReply(kind, reply);
  try {
    const results = await awardEventToChallenges(user, "meal", { healthy_plate: isHealthy });
    const hpResult = (results || []).find((r) => r.challenge_type === "healthy_plate");
    if (!hpResult) return;
    if (hpResult.healthy_plate_delta > 0) {
      const { t } = await import("../i18n.js");
      const { send } = await import("../utils.js");
      await send(bot, chatId, t(lang, "chal_hp_meal_hit", {
        count: hpResult.outcome_value,
        rank: hpResult.rank ?? "—",
        total: hpResult.total ?? "—",
      }), { markdown: true, keepEmoji: true });
    } else if (!isHealthy) {
      const { t } = await import("../i18n.js");
      const { send } = await import("../utils.js");
      await send(bot, chatId, t(lang, "chal_hp_meal_miss"), { markdown: true, keepEmoji: true });
    }
  } catch (e) {
    console.error("hp meal reply:", e?.message);
  }
}

const PROMPT_KEY = {
  coach: "coach_prompt",
  food: "food_prompt",
  fitness: "fitness_prompt",
  label: "foodhelp_label_prompt",
  analyze: "foodhelp_analyze_prompt",
};

// kind: 'coach' | 'food' | 'fitness'  (all premium)
// promptKeyOverride: optional i18n key to use in place of the default intro
// (used by Food Help sub-options that want to skip the generic Food Coach
// intro and jump straight to their own prompt with the Back-to-Menu button).
export async function startCoach(bot, chatId, session, kind, promptKeyOverride) {
  const lang = langOf(session);
  if (!isPremium(session.user)) {
    return send(bot, chatId, t(lang, "premium_required"), { keyboard: backKeyboard(lang), markdown: true });
  }
  session.state = kind;
  session.history = [];
  // Restaurant cache belongs to a single food conversation — reset on entry.
  if (session.data) delete session.data.foodRestaurantId;
  const promptKey = promptKeyOverride || PROMPT_KEY[kind];
  await send(bot, chatId, t(lang, promptKey), { keyboard: backKeyboard(lang), markdown: true });
}

export async function coachText(bot, chatId, session, text, msg) {
  const lang = langOf(session);
  const kind = session.state; // coach | food | fitness

  if (!isPremium(session.user)) {
    return send(bot, chatId, t(lang, "premium_required"), { keyboard: backKeyboard(lang), markdown: true });
  }

  const imageDataUrl = msg ? await photoDataUrl(bot, msg) : null;
  const userText = (text || msg?.caption || "").trim();
  if (!userText && !imageDataUrl) {
    return send(bot, chatId, t(lang, PROMPT_KEY[kind]), { keyboard: backKeyboard(lang), markdown: true });
  }

  await typing(bot, chatId);
  try {
    // cheap personalization: one DB read, no extra AI cost
    let extra = "";
    try {
      extra = compactKB(session.user, await weeklyStats(session.user.id));
    } catch {
      /* ignore */
    }

    // Restaurant Guidance: detect a Pakistani restaurant in the current
    // message; if none, fall back to the one detected earlier in this
    // conversation. This lets follow-up questions ("what should I order?")
    // stay grounded on the restaurant the user first mentioned.
    let restaurant = null;
    if (kind === "food") {
      session.data = session.data || {};
      const fresh = matchRestaurant(userText);
      if (fresh) {
        session.data.foodRestaurantId = fresh.id;
        restaurant = fresh;
      } else if (session.data.foodRestaurantId) {
        restaurant = PK_RESTAURANTS.find((r) => r.id === session.data.foodRestaurantId) || null;
      }
      if (restaurant) {
        const hint = restaurantHint(restaurant);
        extra = extra ? `${extra}\n\n${hint}` : hint;
      }
      // Send the menu link once per restaurant match, so the user has a
      // tap-through even before the AI reply finishes streaming.
      if (fresh?.menu_url && session.data.foodRestaurantMenuSentId !== fresh.id) {
        session.data.foodRestaurantMenuSentId = fresh.id;
        await send(bot, chatId, `📍 *${fresh.name}* menu: ${fresh.menu_url}`, { markdown: true });
      }
    }

    const reply = await coachReply(session.user, session.history, userText, kind, imageDataUrl, extra);

    pushHistory(session, "user", userText || "[image]");
    pushHistory(session, "assistant", reply);
    saveCoachMessage(session.user.id, kind, "user", userText || "[image]");
    saveCoachMessage(session.user.id, kind, "assistant", reply);

    // Nutrition Label Scanner replies open with 😀/😬/😞 and use 🟢🟡🔴 in the
    // Rating line — preserve those glyphs instead of running them through the
    // global emoji stripper.
    const keepEmoji = kind === "label";
    await send(bot, chatId, reply, { keyboard: backKeyboard(lang), keepEmoji });
    session.user = await applyScores(session.user, "coach");
    reportMealForChallenges(bot, chatId, session.user, lang, kind, reply);
  } catch (e) {
    console.error("coach error:", e?.message);
    await send(bot, chatId, t(lang, errorKey(e)), { keyboard: backKeyboard(lang) });
  }
}
