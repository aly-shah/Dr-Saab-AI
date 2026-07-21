import { t } from "../i18n.js";
import { send, typing, langOf, isPremium, photoDataUrl } from "../utils.js";
import { backKeyboard } from "../keyboards.js";
import { askDrsaabReply } from "../openai.js";
import { errorKey } from "../errors.js";
import {
  saveCoachMessage,
  weeklyStats,
  recentGlucose,
  latestWeight,
  recentLabReports,
  listMedications,
  listActiveGoals,
} from "../supabase.js";
import { applyScores } from "../scores.js";
import { pushHistory } from "../session.js";

// Ask DrSaab — open natural-language conversation. Free-tier ready.
//   - Free users: cheap personalisation (weekly stats only), basic model.
//   - Paid users: deep personalisation (glucose / weight / labs / meds /
//     goals) and, when configured, the OpenAI-backed model.

export async function startAskDrsaab(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "askdrsaab";
  session.history = [];
  await send(bot, chatId, t(lang, "askdrsaab_prompt"), {
    keyboard: backKeyboard(lang),
    markdown: true,
  });
}

export async function askDrsaabText(bot, chatId, session, text, msg) {
  const lang = langOf(session);
  const user = session.user;

  const imageDataUrl = msg ? await photoDataUrl(bot, msg) : null;
  const userText = (text || msg?.caption || "").trim();
  if (!userText && !imageDataUrl) {
    return send(bot, chatId, t(lang, "askdrsaab_prompt"), {
      keyboard: backKeyboard(lang),
      markdown: true,
    });
  }

  await typing(bot, chatId);
  try {
    const paid = isPremium(user);
    const personalCtx = await buildContext(user, paid);
    const reply = await askDrsaabReply(user, session.history, userText, {
      imageDataUrl,
      personalCtx,
      paid,
    });

    pushHistory(session, "user", userText || "[image]");
    pushHistory(session, "assistant", reply);
    saveCoachMessage(user.id, "coach", "user", userText || "[image]");
    saveCoachMessage(user.id, "coach", "assistant", reply);

    await send(bot, chatId, reply, { keyboard: backKeyboard(lang) });
    session.user = await applyScores(user, "coach");
  } catch (e) {
    console.error("askdrsaab error:", e?.message);
    await send(bot, chatId, t(lang, errorKey(e)), { keyboard: backKeyboard(lang) });
  }
}

// Compact personalisation string. Cheap for free users (one query), richer
// for paid users. Failures on any single lookup are swallowed so the reply
// still goes out — a missing glucose count is not worth failing the turn.
async function buildContext(user, paid) {
  const lines = [];
  try {
    const stats = await weeklyStats(user.id);
    if (stats?.glucoseAvg != null) {
      lines.push(
        `Last 7 days glucose: avg ${stats.glucoseAvg} mg/dL over ${stats.glucoseCount} readings (range ${stats.glucoseMin}-${stats.glucoseMax}).`
      );
    }
    if (stats?.medicationCount) lines.push(`Medication logs (7d): ${stats.medicationCount}.`);
  } catch {
    /* ignore */
  }
  if (user.streak) lines.push(`${user.streak}-day logging streak.`);
  if (user.latest_hba1c) lines.push(`Latest self-reported HbA1c: ${user.latest_hba1c}%.`);
  if (user.motivation_driver) lines.push(`Motivation driver: ${user.motivation_driver}.`);

  if (!paid) return lines.length ? `Recent data:\n${lines.join("\n")}` : "";

  const [recent, weight, labs, meds, goals] = await Promise.all([
    recentGlucose(user.id, 6).catch(() => []),
    latestWeight(user.id).catch(() => null),
    recentLabReports(user.id, 2).catch(() => []),
    listMedications(user.id).catch(() => []),
    listActiveGoals(user.id).catch(() => []),
  ]);

  if (recent.length) {
    lines.push(
      `Recent glucose readings (newest first): ${recent
        .map((r) => `${r.value_mgdl}(${r.context || "random"})`)
        .join(", ")}.`
    );
  }
  if (weight) lines.push(`Latest weight: ${weight} kg.`);
  if (labs.length) {
    const summary = labs
      .map((l) => {
        const date = l.created_at ? new Date(l.created_at).toISOString().slice(0, 10) : "?";
        const keyValues = (Array.isArray(l.values) ? l.values : [])
          .filter((v) => /hba1c|glucose|ldl|hdl|triglycer|cholesterol|creatinine|egfr/i.test(v.test || ""))
          .slice(0, 5)
          .map((v) => `${v.test}=${v.result}${v.unit ? " " + v.unit : ""}`)
          .join(", ");
        return `${date}: ${keyValues || "(no key values captured)"}`;
      })
      .join(" | ");
    lines.push(`Recent labs: ${summary}`);
  }
  if (meds.length) {
    lines.push(
      `Current medications: ${meds
        .map((m) => `${m.name}${m.dose ? " " + m.dose : ""}${m.frequency ? ` (${m.frequency})` : ""}`)
        .join("; ")}.`
    );
  }
  if (goals.length) {
    lines.push(`Active goals: ${goals.map((g) => g.title).join("; ")}.`);
  }

  return lines.length ? `Recent data:\n${lines.join("\n")}` : "";
}
