import { t } from "../i18n.js";
import { send, typing, langOf, photoDataUrl, documentBuffer } from "../utils.js";
import { isPaid } from "../tiers.js";
import { backKeyboard, labStartKeyboard } from "../keyboards.js";
import { explainLab } from "../openai.js";
import { addLabReport, countLabReportsSince, recentLabReports } from "../supabase.js";
import { extractPdfText, isPdfMime } from "../pdf.js";

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

export async function labText(bot, chatId, session, text, msg) {
  const lang = langOf(session);

  // Free-tier monthly cap. Paid users bypass entirely. If the count query
  // itself fails (DB down / schema missing) we fail-open so a background DB
  // hiccup can't block a paying-adjacent feature from running at all.
  if (!isPaid(session.user)) {
    const used = await countLabReportsSince(session.user.id, firstOfThisMonthIso()).catch(() => 0);
    if (used >= FREE_MONTHLY_LIMIT) {
      return send(bot, chatId, t(lang, "lab_limit_reached", { limit: FREE_MONTHLY_LIMIT }), {
        keyboard: backKeyboard(lang),
        markdown: true,
      });
    }
  }

  const imageDataUrl = msg ? await photoDataUrl(bot, msg) : null;
  let userText = (text || msg?.caption || "").trim();

  // PDF attachment: vision models can't read PDFs. Extract text server-side
  // and feed it in as if the user had typed the values themselves. Applies to
  // Telegram documents and to the pre-resolved WhatsApp path (both surface
  // through documentBuffer). Web PDFs are handled earlier in web.js.
  if (!imageDataUrl && msg) {
    const doc = await documentBuffer(bot, msg);
    if (doc && isPdfMime(doc.mime)) {
      const extracted = await extractPdfText(doc.buffer);
      if (extracted) {
        userText = [userText, extracted].filter(Boolean).join("\n\n");
      } else {
        return send(bot, chatId, t(lang, "lab_pdf_unreadable"), {
          keyboard: backKeyboard(lang),
          markdown: true,
        });
      }
    } else if (doc && !doc.mime.startsWith("image/")) {
      return send(bot, chatId, t(lang, "lab_unsupported_file"), {
        keyboard: backKeyboard(lang),
        markdown: true,
      });
    }
  }

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

    // Guard: an empty reply from the LLM (Groq occasionally returns "" under
    // load) would send a blank message that the transport silently rejects,
    // leaving the user staring at a disclaimer with nothing above it. Treat
    // it as a generic failure so they see a real message and can retry.
    if (!analysis || !String(analysis).trim()) {
      throw new Error("empty analysis from LLM");
    }

    // Send the analysis first, so a follow-up failure (e.g. history insert)
    // doesn't hide the answer we already have from the user.
    await send(bot, chatId, analysis, { keyboard: backKeyboard(lang), markdown: true });
    await send(bot, chatId, t(lang, "lab_disclaimer"), { markdown: true });

    // History save is best-effort. If the DB is misconfigured the user still
    // gets their explanation; we just log the failure and skip the "saved" note.
    try {
      await addLabReport(session.user.id, userText || "[image]", analysis, {
        metadata,
        values,
        lab_source: labSource,
      });
      await send(bot, chatId, t(lang, "lab_saved"), { markdown: true });
    } catch (dbErr) {
      console.error("lab history save failed:", dbErr?.stack || dbErr?.message || dbErr);
    }
  } catch (e) {
    console.error("lab error:", e?.stack || e?.message || e);
    const key = e?.aiLimited ? "error_ai_limit" : "error_generic";
    await send(bot, chatId, t(lang, key), { keyboard: backKeyboard(lang) });
  }
}
