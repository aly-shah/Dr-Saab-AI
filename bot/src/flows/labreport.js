import { t } from "../i18n.js";
import { send, typing, langOf, photoDataUrl } from "../utils.js";
import { isPaid } from "../tiers.js";
import { backKeyboard, labStartKeyboard } from "../keyboards.js";
import { explainLab } from "../openai.js";
import { addLabReport, countLabReportsSince, recentLabReports } from "../supabase.js";

// Free-tier ceiling. Paid users are unlimited. Spec: free users get a plan
// limit rather than a hard block — see the "Explain My Report" write-up.
const FREE_MONTHLY_LIMIT = 3;

const firstOfThisMonthIso = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
};

// Compact one-line-per-value summary of the last few reports, sent to the LLM
// as context so it can call out improvement / worsening.
function priorValuesLine(reports) {
  if (!reports?.length) return "";
  const lines = [];
  for (const r of reports) {
    const when = r.created_at ? String(r.created_at).slice(0, 10) : "";
    const vals = Array.isArray(r.values) ? r.values : [];
    for (const v of vals) {
      const test = v?.test || "";
      const result = v?.result || "";
      const unit = v?.unit ? ` ${v.unit}` : "";
      if (test && result) lines.push(`${when} · ${test}: ${result}${unit}`);
    }
  }
  return lines.join("\n");
}

export async function startLab(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "lab";
  await send(bot, chatId, t(lang, "lab_prompt"), { keyboard: labStartKeyboard(lang), markdown: true });
}

// Handler for the "📎 Upload Image" button on the lab prompt.
// - Web chat: intercepted by the frontend to open a native file picker before
//   the callback is even sent; this handler is a no-op fallback there.
// - Telegram / WhatsApp: bots can't trigger the client's file picker, so we
//   just remind the user to use the built-in attach control.
export async function handleUploadLabButton(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "lab";
  await send(bot, chatId, t(lang, "upload_lab_hint"), { keyboard: labStartKeyboard(lang), markdown: true });
}

export async function labText(bot, chatId, session, text, msg) {
  const lang = langOf(session);

  // Free-tier monthly cap. Paid users bypass entirely.
  if (!isPaid(session.user)) {
    const used = await countLabReportsSince(session.user.id, firstOfThisMonthIso());
    if (used >= FREE_MONTHLY_LIMIT) {
      return send(bot, chatId, t(lang, "lab_limit_reached", { limit: FREE_MONTHLY_LIMIT }), {
        keyboard: backKeyboard(lang),
        markdown: true,
      });
    }
  }

  const imageDataUrl = msg ? await photoDataUrl(bot, msg) : null;
  const userText = (text || msg?.caption || "").trim();
  if (!userText && !imageDataUrl) {
    return send(bot, chatId, t(lang, "lab_prompt"), { keyboard: backKeyboard(lang), markdown: true });
  }

  await typing(bot, chatId);
  try {
    const prior = await recentLabReports(session.user.id, 3).catch(() => []);
    const priorLine = priorValuesLine(prior);

    const { analysis, metadata, values, labSource } = await explainLab(
      session.user,
      userText,
      imageDataUrl,
      priorLine
    );

    // Auto-save: analysis text + structured extraction. Never asks the user.
    await addLabReport(session.user.id, userText || "[image]", analysis, {
      metadata,
      values,
      lab_source: labSource,
    });

    await send(bot, chatId, analysis, { keyboard: backKeyboard(lang), markdown: true });
    await send(bot, chatId, t(lang, "lab_disclaimer"), { markdown: true });
    await send(bot, chatId, t(lang, "lab_saved"), { markdown: true });
  } catch (e) {
    console.error("lab error:", e?.message);
    const key = e?.aiLimited ? "error_ai_limit" : "error_generic";
    await send(bot, chatId, t(lang, key), { keyboard: backKeyboard(lang) });
  }
}
