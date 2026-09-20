// Feedback command (trial feedback inbox, 2026-09-19).
//
// Any user — patient or doctor, onboarded or not — types "Feedback" (or
// "/feedback", "فیڈبیک") and then sends their feedback as text, a screenshot
// or a voice note. "Feedback <text>" or a screenshot captioned "Feedback …"
// is saved in one go. The submission lands in the `feedback` table and shows
// up in the admin panel's Feedback inbox with its attachments.
//
// After the thank-you, extra screenshots / voice notes sent within
// APPEND_WINDOW_MS are added to the same submission — WhatsApp delivers a
// multi-photo send as separate messages, and without this the 2nd…nth
// screenshot would be routed to Explain My Report.
//
// Whatever the user was doing before (a flow, onboarding, a coach chat) is
// restored afterwards, so giving feedback never loses their place.

import { t } from "../i18n.js";
import { send, langOf, hasAttachment, photoDataUrl, documentBuffer } from "../utils.js";
import { createFeedback, appendFeedback } from "../supabase.js";
import { logError } from "../log.js";

const APPEND_WINDOW_MS = 2 * 60 * 1000;
// Base64 data URLs are ~4/3 of the file. Anything bigger than this is almost
// certainly a video or a huge document, which we don't want inline in the DB.
const MAX_ATTACHMENT_CHARS = 20 * 1024 * 1024;

const KEYWORD_RE = /^\/?(?:feed\s?back|فیڈ\s?بیک|فیڈبیک)(?=$|[\s:,.!-])[\s:,.!-]*/i;
const CANCEL_RE = /^\/?(?:cancel|back|exit|stop|menu|منسوخ|wapas)$/i;

// "Feedback" / "feedback: the menu is slow" → { rest: "" | "the menu is slow" }.
// Returns null when the message isn't the feedback command.
export function parseFeedbackCommand(text) {
  const s = String(text || "").trim();
  const m = KEYWORD_RE.exec(s);
  if (!m) return null;
  return { rest: s.slice(m[0].length).trim() };
}

function inAppendWindow(session) {
  return !!session.feedbackAppend && Date.now() < session.feedbackAppend.until;
}

// True when a voice note / media message should be handed to this flow.
// Used by the WhatsApp and web adapters, which otherwise treat a voice note
// as a standalone "voice note saved" message.
export function wantsFeedbackMedia(session) {
  return session?.state === "feedback" || inAppendWindow(session);
}

function hasFeedbackMedia(msg) {
  return hasAttachment(msg) || !!msg?.__audioDataUrl || !!msg?.voice || !!msg?.audio;
}

function mimeOf(dataUrl) {
  return /^data:([^;,]+)/.exec(dataUrl || "")?.[1] || null;
}

async function telegramFileDataUrl(bot, fileId, mime) {
  try {
    const link = await bot.getFileLink(fileId);
    const res = await fetch(link);
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch (e) {
    logError("Feedback", `voice note download failed: ${e?.message}`);
    return null;
  }
}

// Everything attached to one inbound message, as feedback_attachments rows.
async function collectAttachments(bot, msg) {
  const out = [];
  const image = await photoDataUrl(bot, msg).catch(() => null);
  if (image) {
    out.push({ kind: "image", mime: mimeOf(image), filename: msg.__documentName || null, data_url: image });
  } else if (msg.__documentDataUrl) {
    out.push({
      kind: "document",
      mime: msg.__documentMime || mimeOf(msg.__documentDataUrl),
      filename: msg.__documentName || null,
      data_url: msg.__documentDataUrl,
    });
  } else {
    const doc = await documentBuffer(bot, msg).catch(() => null);
    if (doc?.buffer) {
      out.push({
        kind: "document",
        mime: doc.mime,
        filename: msg.__documentName || msg.document?.file_name || null,
        data_url: `data:${doc.mime};base64,${doc.buffer.toString("base64")}`,
      });
    }
  }

  let audio = msg.__audioDataUrl || null;
  const tgAudio = msg.voice || msg.audio;
  if (!audio && tgAudio?.file_id) {
    audio = await telegramFileDataUrl(bot, tgAudio.file_id, tgAudio.mime_type || "audio/ogg");
  }
  if (audio) out.push({ kind: "audio", mime: mimeOf(audio), filename: null, data_url: audio });

  return out.filter((a) => a.data_url && a.data_url.length <= MAX_ATTACHMENT_CHARS);
}

// The user's own words. A web PDF arrives with its extracted text as
// msg.text — that's the document, not the user's message, so skip it.
function messageText(msg, fallback) {
  if (msg.__documentDataUrl) return String(msg.caption || "").trim();
  return String(fallback || msg.text || msg.caption || "").trim();
}

function remember(session) {
  // Don't overwrite what we saved on the first "Feedback" if the user types
  // it again while already in the flow.
  if (session.state === "feedback" && session.feedbackPrev) return;
  session.feedbackPrev = {
    state: session.state,
    step: session.step,
    data: session.data,
    history: session.history,
  };
}

function restore(session) {
  const prev = session.feedbackPrev || { state: "idle", step: null, data: {}, history: [] };
  session.state = prev.state;
  session.step = prev.step;
  session.data = prev.data || {};
  session.history = prev.history || [];
  delete session.feedbackPrev;
}

async function save(bot, chatId, session, text, attachments) {
  const lang = langOf(session);
  const user = session.user || {};
  try {
    const fb = await createFeedback(
      {
        user_id: user.id || null,
        user_name: user.name || null,
        user_phone: user.phone_number || (user.telegram_id != null ? String(user.telegram_id) : null),
        user_type: user.user_type || "patient",
        source: session.source || "telegram",
        message: text,
      },
      attachments,
    );
    session.feedbackAppend = { id: fb.id, until: Date.now() + APPEND_WINDOW_MS };
    restore(session);
    return send(bot, chatId, t(lang, "feedback_thanks"));
  } catch (e) {
    logError("Feedback", `could not save feedback: ${e?.message}`);
    return send(bot, chatId, t(lang, "feedback_failed"));
  }
}

// "Feedback" typed (from any state). Saves straight away when the same
// message already carries the feedback; otherwise asks for it.
export async function startFeedback(bot, chatId, session, rest, msg) {
  remember(session);
  delete session.feedbackAppend;
  const attachments = await collectAttachments(bot, msg);
  if (rest || attachments.length) return save(bot, chatId, session, rest, attachments);
  session.state = "feedback";
  session.step = "await";
  session.data = {};
  return send(bot, chatId, t(langOf(session), "feedback_prompt"), { markdown: true });
}

// Next message while in the feedback state. `showMenu` comes from bot.js
// (importing it here would be circular).
export async function feedbackText(bot, chatId, session, text, msg, { showMenu } = {}) {
  const lang = langOf(session);
  const body = messageText(msg, text);
  if (CANCEL_RE.test(body) && !hasFeedbackMedia(msg)) {
    restore(session);
    await send(bot, chatId, t(lang, "feedback_cancelled"));
    if (session.user?.onboarded && session.state === "idle" && showMenu) return showMenu(bot, chatId, session);
    return;
  }
  const attachments = await collectAttachments(bot, msg);
  if (!body && !attachments.length) {
    return send(bot, chatId, t(lang, "feedback_empty"), { markdown: true });
  }
  return save(bot, chatId, session, body, attachments);
}

// A button tap means the user moved on without sending feedback — put them
// back where they were so their next typed message isn't saved as feedback.
export function leaveFeedback(session) {
  if (session?.state === "feedback") restore(session);
}

// Called for every inbound message before normal routing. Returns true when
// the message was an extra screenshot / voice note for the feedback the user
// just sent (and has been added to it). Any plain text ends the window.
export async function maybeAppendFeedback(bot, chatId, session, msg) {
  if (!session.feedbackAppend) return false;
  if (!inAppendWindow(session) || !hasFeedbackMedia(msg)) {
    delete session.feedbackAppend;
    return false;
  }
  const attachments = await collectAttachments(bot, msg);
  if (!attachments.length) return false;
  try {
    await appendFeedback(session.feedbackAppend.id, {
      text: messageText(msg),
      attachments,
    });
    session.feedbackAppend.until = Date.now() + APPEND_WINDOW_MS;
    await send(bot, chatId, t(langOf(session), "feedback_added"));
  } catch (e) {
    logError("Feedback", `could not add to feedback: ${e?.message}`);
    await send(bot, chatId, t(langOf(session), "feedback_failed"));
  }
  return true;
}
