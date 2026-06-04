// Remove characters that would break Telegram legacy-Markdown when we
// embed user-provided text inside a formatted message.
export function sanitizeMd(s = "") {
  return String(s).replace(/[*_`\[\]]/g, "");
}

/**
 * Safe message sender. Uses legacy Markdown for our own UI strings, and
 * transparently retries as plain text if Telegram rejects the formatting.
 */
export async function send(bot, chatId, text, { keyboard = null, markdown = false } = {}) {
  const opts = {};
  if (keyboard) opts.reply_markup = keyboard;
  if (markdown) opts.parse_mode = "Markdown";
  try {
    return await bot.sendMessage(chatId, text, opts);
  } catch (e) {
    if (markdown) {
      try {
        return await bot.sendMessage(chatId, text, keyboard ? { reply_markup: keyboard } : {});
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

// Download the largest photo in a message and return a base64 data URL
// suitable for OpenAI vision. Returns null if there's no photo.
export async function photoDataUrl(bot, msg) {
  const photos = msg.photo;
  if (!photos || !photos.length) return null;
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

export function isPremium(user) {
  return user?.tier === "consistency_builder";
}

export function langOf(session) {
  return session?.data?.language || session?.user?.language || "en";
}
