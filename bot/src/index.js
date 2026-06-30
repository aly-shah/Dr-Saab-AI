import TelegramBot from "node-telegram-bot-api";
import { config } from "./config.js";
import { registerHandlers } from "./bot.js";
import { startWebServer } from "./web.js";
import { startScheduler } from "./scheduler.js";
import { startWhatsApp, whatsappBot } from "./whatsapp.js";
import { logError } from "./log.js";
import { describeTelegramError } from "./errors.js";

// WhatsApp Cloud API is the primary delivery channel. Telegram now runs only as
// an optional fallback (when TELEGRAM_BOT_TOKEN is set). Both share the exact
// same conversation logic in bot.js — see whatsapp.js for the transport bridge.

let telegram = null;

if (config.telegramEnabled) {
  const options = config.useWebhook
    ? { webHook: { port: config.port } }
    : { polling: { interval: 300, autoStart: true } };

  telegram = new TelegramBot(config.telegramToken, options);

  if (config.useWebhook) {
    if (!config.webhookUrl) {
      console.error("❌ USE_WEBHOOK=true but WEBHOOK_URL is empty.");
      process.exit(1);
    }
    const url = `${config.webhookUrl.replace(/\/$/, "")}/bot${config.telegramToken}`;
    try {
      await telegram.setWebHook(url);
      console.log(`✅ DrSaab Telegram fallback via webhook on port ${config.port}`);
      console.log(`   Webhook: ${url}`);
    } catch (e) {
      logError("Telegram webhook setup", describeTelegramError(e), url);
    }
  } else {
    console.log("✅ DrSaab Telegram fallback running with long polling.");
  }

  registerHandlers(telegram);

  telegram
    .setMyCommands([
      { command: "start", description: "Start / restart DrSaab" },
      { command: "menu", description: "Show the main menu" },
      { command: "home", description: "Go to the main menu" },
      { command: "help", description: "How to use DrSaab" },
      { command: "upgrade", description: "See plans & upgrade" },
      { command: "cancel", description: "Cancel the current action" },
    ])
    .catch(() => {});

  telegram.on("polling_error", (e) => logError("Telegram polling", describeTelegramError(e)));
  telegram.on("webhook_error", (e) => logError("Telegram webhook", describeTelegramError(e)));
} else {
  console.log("   Telegram adapter: dormant (set TELEGRAM_BOT_TOKEN to enable the fallback).");
}

// Web chat GUI API (always on) — powers the /bot page on the website.
startWebServer();

// WhatsApp Cloud API adapter (primary channel). Same flow logic as Telegram —
// see whatsapp.js. Starts only if WHATSAPP_* / D360_API_KEY env vars are set.
startWhatsApp();

// Proactive template reminders / streak / summary / win-back (no AI cost).
// Routed to each user on their own channel (WhatsApp or Telegram).
startScheduler({
  telegram,
  whatsapp: config.whatsapp.enabled ? whatsappBot() : null,
});

process.on("unhandledRejection", (e) => logError("Unhandled rejection", e?.message || String(e)));
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));

console.log(
  `   LLM: ${config.llm.provider} · ${config.llm.model} · Default tier: ${config.defaultTier}`
);
