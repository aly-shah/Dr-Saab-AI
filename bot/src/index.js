import TelegramBot from "node-telegram-bot-api";
import { config } from "./config.js";
import { registerHandlers } from "./bot.js";
import { startWebServer } from "./web.js";

const options = config.useWebhook
  ? { webHook: { port: config.port } }
  : { polling: { interval: 300, autoStart: true } };

const bot = new TelegramBot(config.telegramToken, options);

if (config.useWebhook) {
  if (!config.webhookUrl) {
    console.error("❌ USE_WEBHOOK=true but WEBHOOK_URL is empty.");
    process.exit(1);
  }
  const url = `${config.webhookUrl.replace(/\/$/, "")}/bot${config.telegramToken}`;
  await bot.setWebHook(url);
  console.log(`✅ DrSaab bot running via webhook on port ${config.port}`);
  console.log(`   Webhook: ${url}`);
} else {
  console.log("✅ DrSaab bot running with long polling.");
}

registerHandlers(bot);

// Web chat GUI API (always on) — powers the /bot page on the website.
startWebServer();

bot
  .setMyCommands([
    { command: "start", description: "Start / restart DrSaab" },
    { command: "menu", description: "Show the main menu" },
    { command: "cancel", description: "Cancel the current action" },
  ])
  .catch(() => {});

bot.on("polling_error", (e) => console.error("polling_error:", e?.message || e));
bot.on("webhook_error", (e) => console.error("webhook_error:", e?.message || e));

process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));

console.log(
  `   LLM: ${config.llm.provider} · ${config.llm.model} · Default tier: ${config.defaultTier}`
);
