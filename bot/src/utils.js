// Remove characters that would break Telegram legacy-Markdown when we
// embed user-provided text inside a formatted message.
export function sanitizeMd(s = "") {
  return String(s).replace(/[*_`\[\]]/g, "");
}

// Strip emoji/pictographs so replies read clean and professional (keeps the
// avatar icon in the web UI as the only visual mark). Preserves dashes/·.
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{200D}]/gu;

export function stripEmoji(s = "") {
  return String(s)
    .replace(EMOJI_RE, "")
    .replace(/[ \t]{2,}/g, " ")
    .split("\n")
    .map((l) => l.replace(/^[ \t]+/, "").replace(/[ \t]+$/, ""))
    .join("\n")
    .trim();
}

function cleanKeyboard(kb) {
  if (!kb?.inline_keyboard) return kb;
  // A keyboard can opt out of emoji stripping by setting `keepEmoji: true`
  // (e.g. the main menu, which is designed to show its icons). Drop the flag
  // before it reaches Telegram, which rejects unknown reply_markup fields.
  const { keepEmoji, ...rest } = kb;
  if (keepEmoji) return rest;
  return {
    ...rest,
    inline_keyboard: rest.inline_keyboard.map((row) =>
      row.map((b) => (b && typeof b.text === "string" ? { ...b, text: stripEmoji(b.text) } : b))
    ),
  };
}

/**
 * Safe message sender. Uses legacy Markdown for our own UI strings, and
 * transparently retries as plain text if Telegram rejects the formatting.
 */
// The main-menu title always leads with the 🩺 DrSaab header across all
// languages. Its icons are load-bearing (users lose orientation without them),
// so force keepEmoji whenever we detect that header — belt-and-braces so a
// caller that forgets the flag can't strip them.
const KEEP_EMOJI_PREFIX = "🩺 DrSaab";

export async function send(bot, chatId, text, { keyboard = null, markdown = false, keepEmoji = false } = {}) {
  if (typeof text === "string" && text.startsWith(KEEP_EMOJI_PREFIX)) keepEmoji = true;
  if (!keepEmoji) text = stripEmoji(text);
  const opts = {};
  if (keyboard) opts.reply_markup = cleanKeyboard(keyboard);
  if (markdown) opts.parse_mode = "Markdown";
  try {
    return await bot.sendMessage(chatId, text, opts);
  } catch (e) {
    if (markdown) {
      try {
        return await bot.sendMessage(chatId, text, keyboard ? { reply_markup: cleanKeyboard(keyboard) } : {});
      } catch (e2) {
        console.error("sendMessage retry failed:", e2?.message);
      }
    } else {
      console.error("sendMessage failed:", e?.message);
    }
  }
}

// Telegram chat action (e.g. "typing…")
export async function typing(bot, chatId) {
  try {
    await bot.sendChatAction(chatId, "typing");
  } catch {
    /* ignore */
  }
}

// Return a base64 data URL for any image attached to the message, suitable for
// the vision model. Adapters that resolve media themselves (e.g. WhatsApp)
// pass it pre-computed as msg.__imageDataUrl; Telegram downloads on demand.
// Accepts either `msg.photo` (compressed image) or `msg.document` when the
// document's mime type is image/* (a user who attaches a JPG/PNG as "File"
// rather than "Photo" in the Telegram client). Returns null otherwise; PDFs
// travel through the separate documentBuffer() path below.
export async function photoDataUrl(bot, msg) {
  if (msg?.__imageDataUrl) return msg.__imageDataUrl;
  const photos = msg?.photo;
  if (photos?.length) {
    const fileId = photos[photos.length - 1].file_id;
    try {
      const link = await bot.getFileLink(fileId);
      const res = await fetch(link);
      const buf = Buffer.from(await res.arrayBuffer());
      return `data:image/jpeg;base64,${buf.toString("base64")}`;
    } catch (e) {
      console.error("photo download failed:", e?.message);
      return null;
    }
  }
  const doc = msg?.document;
  if (doc?.file_id && typeof doc.mime_type === "string" && doc.mime_type.startsWith("image/")) {
    try {
      const link = await bot.getFileLink(doc.file_id);
      const res = await fetch(link);
      const buf = Buffer.from(await res.arrayBuffer());
      return `data:${doc.mime_type};base64,${buf.toString("base64")}`;
    } catch (e) {
      console.error("image document download failed:", e?.message);
      return null;
    }
  }
  return null;
}

// Download a Telegram document (or return a WhatsApp-provided buffer) as a
// { mime, buffer } pair. Used for PDFs on the lab-report flow — the caller
// then extracts text via pdf.js. Returns null if there's no document.
export async function documentBuffer(bot, msg) {
  if (msg?.__documentBuffer && msg?.__documentMime) {
    return { mime: msg.__documentMime, buffer: msg.__documentBuffer };
  }
  const doc = msg?.document;
  if (!doc?.file_id) return null;
  try {
    const link = await bot.getFileLink(doc.file_id);
    const res = await fetch(link);
    const buf = Buffer.from(await res.arrayBuffer());
    return { mime: doc.mime_type || "application/octet-stream", buffer: buf };
  } catch (e) {
    console.error("document download failed:", e?.message);
    return null;
  }
}

// Back-compat shim: "premium" now means any paid plan (Consistency Coach or
// Executive Coach). See tiers.js for the full plan model.
import { isPaid } from "./tiers.js";
export function isPremium(user) {
  return isPaid(user);
}

export function langOf(session) {
  return session?.data?.language || session?.user?.language || "en";
}
