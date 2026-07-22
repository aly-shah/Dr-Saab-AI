import { t } from "../i18n.js";
import { send, typing, langOf, photoDataUrl, documentBuffer, isPremium } from "../utils.js";
import { isPaid } from "../tiers.js";
import { backKeyboard, labStartKeyboard } from "../keyboards.js";
import { explainLab } from "../openai.js";
import { addLabReport, countLabReportsSince, recentLabReports } from "../supabase.js";
import { extractPdfText, isPdfMime } from "../pdf.js";
import { awardEventToChallenges } from "./challengeEngine.js";
import { errorKey } from "../errors.js";
import { isFoodQuestion } from "../shortcuts.js";
import { askDrsaabText } from "./askdrsaab.js";
import { coachText } from "./coach.js";

// Common lab / clinical test names. When the user's message mentions any of
// these we treat the text as lab input; otherwise it's delegated out of the
// lab flow so a food or lifestyle sentence ("I had paratha and chai", "can
// I eat biryani?") gets a real answer instead of a "no values found" reply
// from the report parser. A short numeric-only paste ("6.5, 145, 210") is
// also allowed through — genuine OCR results sometimes drop the test names.
const LAB_TERMS_RE =
  /\b(hba1c|a1c|glucose|fbs|ppbs|rbs|cholesterol|ldl|hdl|triglycerid|creatinine|urea|egfr|hemoglobin|haemoglobin|hgb|tsh|thyroid|t3|t4|alt|ast|sgpt|sgot|bilirubin|albumin|calcium|sodium|potassium|wbc|rbc|platelet|hematocrit|hct|mcv|uric\s*acid|ferritin|vitamin\s*[db](?:12)?|c[- ]?peptide|insulin\s*level|report|lab|blood\s*test)\b/i;

function looksLikeNumericOnly(text) {
  const stripped = String(text).replace(/[\d.,%\s\-:/]/g, "");
  if (stripped.length) return false;
  return /\d/.test(text);
}

function looksLikeLabInput(text) {
  if (!text) return false;
  if (LAB_TERMS_RE.test(text)) return true;
  if (looksLikeNumericOnly(text)) return true;
  return false;
}

function extractHba1cValue(values) {
  if (!Array.isArray(values)) return null;
  const hit = values.find((v) => /hba1c|a1c/i.test(v?.test || ""));
  if (!hit?.result) return null;
  const m = String(hit.result).match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) && n >= 4 && n <= 20 ? n : null;
}

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

  const imageDataUrl = msg ? await photoDataUrl(bot, msg) : null;
  const hasDocAttachment = !!(msg?.document?.file_id || msg?.__documentBuffer);
  let userText = (text || msg?.caption || "").trim();

  // Off-topic guard (flexible mode). When there's no attachment and the
  // user's message doesn't look like lab data — most commonly a food or
  // lifestyle question — hand it off to the coach that actually answers
  // that type of question, rather than sending it through the report
  // parser and getting a "no values found" response. Food questions go to
  // the Food Coach for paid users; everything else goes to Ask DrSaab.
  if (!imageDataUrl && !hasDocAttachment && userText && !looksLikeLabInput(userText)) {
    if (isFoodQuestion(userText) && isPremium(session.user)) {
      session.state = "food";
      session.history = [];
      if (session.data) delete session.data.foodRestaurantId;
      return coachText(bot, chatId, session, userText, msg);
    }
    session.state = "askdrsaab";
    session.history = [];
    return askDrsaabText(bot, chatId, session, userText, msg);
  }

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

    const {
      analysis,
      metadata,
      values,
      labSource,
      unreadable,
      partialUnreadable,
      unreadableReason,
    } = await explainLab(session.user, userText, imageDataUrl, priorLine);

    // Fully unreadable image: ask for a clearer photo instead of falling
    // through to the generic error. Only applies when the user actually sent
    // an image (a garbled text paste is handled by the generic path).
    if (unreadable && imageDataUrl) {
      return send(bot, chatId, t(lang, "lab_image_unreadable"), {
        keyboard: backKeyboard(lang),
        markdown: true,
      });
    }

    // Guard: an empty reply from the LLM (Groq occasionally returns "" under
    // load) would send a blank message that the transport silently rejects,
    // leaving the user staring at a disclaimer with nothing above it. Treat
    // it as a generic failure so they see a real message and can retry.
    // Also treat JSON-shaped output as empty — the user must never see raw
    // JSON from the model, even if a future code path forgets to strip it.
    const trimmed = String(analysis || "").trim();
    if (!trimmed || /^[{[]/.test(trimmed) || /^"[a-zA-Z_][\w-]*"\s*:/.test(trimmed)) {
      throw new Error("empty or JSON-shaped analysis from LLM");
    }

    // Send the analysis first, so a follow-up failure (e.g. history insert)
    // doesn't hide the answer we already have from the user.
    await send(bot, chatId, analysis, { keyboard: backKeyboard(lang), markdown: true });

    // If part of the image was unclear, tell the user which part was skipped
    // so they know the analysis above is incomplete and can resend that
    // section. The reason string comes from the model — if it's missing we
    // fall back to a generic note.
    if (partialUnreadable && imageDataUrl) {
      const noteKey = unreadableReason ? "lab_partial_unreadable" : "lab_partial_unreadable_generic";
      await send(bot, chatId, t(lang, noteKey, { reason: unreadableReason }), { markdown: true });
    }

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

    // Challenges hook: every valid, analyzable report earns 3 participation
    // points. If it contains a fresh HbA1c we also surface the value so the
    // engine can drive HbA1c-specific behaviour (e.g. warn on stale baselines).
    awardEventToChallenges(session.user, "lab_report", {
      hba1c: extractHba1cValue(values),
    }).catch(() => {});
  } catch (e) {
    console.error("lab error:", e?.stack || e?.message || e);
    await send(bot, chatId, t(lang, errorKey(e)), { keyboard: backKeyboard(lang) });
  }
}
