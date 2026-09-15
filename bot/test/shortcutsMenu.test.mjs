// ⚡ Shortcuts main-menu item → Quick Shortcuts card.
//
// Run: node --test test/shortcutsMenu.test.mjs

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const { handleCallback } = await import("../src/bot.js");
const { getSession } = await import("../src/session.js");
const { mainMenuKeyboardV2 } = await import("../src/keyboards.js");
const supabase = await import("../src/supabase.js");

function makeFakeBot() {
  const sent = [];
  return {
    sent,
    sendMessage: async (chatId, text, opts) => { sent.push({ chatId, text, opts }); return { message_id: sent.length }; },
    sendChatAction: async () => {},
    answerCallbackQuery: async () => {},
  };
}

test("main menu lists a Shortcuts button and tapping it shows every shortcut", async () => {
  const base = await supabase.getOrCreateUser(`tg-sc-${Math.random().toString(36).slice(2)}`, "telegram");
  const user = await supabase.updateUser(base.id, { onboarded: true, language: "en", tier: "free" });

  const buttons = mainMenuKeyboardV2("en", user).inline_keyboard.flat();
  const btn = buttons.find((b) => /shortcuts/i.test(b.text));
  assert.ok(btn, "menu has a Shortcuts button");

  const chatId = 6001;
  const session = getSession(chatId);
  session.user = user;
  session.userFetchedAt = Date.now();
  const bot = makeFakeBot();
  await handleCallback(bot, { id: "q", from: { id: chatId }, message: { chat: { id: chatId } }, data: btn.callback_data });

  const text = bot.sent.at(-1)?.text || "";
  assert.ok(text.includes("Quick Shortcuts"), text);
  for (const word of ["menu", "help", "health", "sugar", "meds", "food", "report", "progress", "challenge", "doctor"]) {
    assert.ok(text.includes(`*${word}*`), `card lists the "${word}" shortcut`);
  }
  const kb = bot.sent.at(-1)?.opts?.reply_markup?.inline_keyboard?.flat() || [];
  assert.ok(kb.some((b) => b.callback_data === btn.callback_data), "main menu shown under the card");
});
