import "dotenv/config";
import { red } from "./log.js";

const groqKey = process.env.GROQ_API_KEY?.trim();
const openaiKey = process.env.OPENAI_API_KEY?.trim();
const llmKey = groqKey || openaiKey;

if (!llmKey) {
  console.error(red("\n✖ No LLM key. Provide GROQ_API_KEY (recommended) or OPENAI_API_KEY in .env\n"));
  process.exit(1);
}

const usingGroq = !!groqKey;

const databaseUrl = process.env.DATABASE_URL?.trim() || "";
const supabaseUrl = process.env.SUPABASE_URL?.trim() || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

// WhatsApp is now the primary delivery channel; Telegram is optional. The bot
// boots as long as AT LEAST ONE channel is configured (validated below).
const telegramToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || "";

export const config = {
  telegramToken,
  telegramEnabled: !!telegramToken,

  llm: {
    provider: usingGroq ? "groq" : "openai",
    apiKey: llmKey,
    baseURL: usingGroq
      ? "https://api.groq.com/openai/v1"
      : process.env.LLM_BASE_URL?.trim() || undefined,
    model: process.env.LLM_MODEL?.trim() || (usingGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini"),
    visionModel:
      process.env.LLM_VISION_MODEL?.trim() ||
      (usingGroq ? "meta-llama/llama-4-scout-17b-16e-instruct" : "gpt-4o-mini"),

    // Paid-tier routing for Ask DrSaab (spec: free = basic AI, paid = OpenAI).
    // If BOTH GROQ and OPENAI keys are present, paid users hit OpenAI directly
    // via a second client. Otherwise paidModel just picks a stronger model on
    // the same client (or falls back to the default model when unset).
    paidApiKey: usingGroq && openaiKey ? openaiKey : null,
    paidModel: process.env.LLM_PAID_MODEL?.trim() || (openaiKey ? "gpt-4o-mini" : null),
  },

  // Database selection priority: Postgres (DATABASE_URL) → Supabase → in-memory.
  // In-memory data resets on restart — handy for the very first quick test.
  databaseUrl,
  supabaseUrl,
  supabaseKey,
  hasPostgres: !!databaseUrl,
  hasSupabase: !!(supabaseUrl && supabaseKey),

  defaultTier: process.env.DEFAULT_TIER?.trim() || "free",

  // WhatsApp number that receives payment-submission alerts for the Subscription
  // Module (spec §9 — Yasir Abbasi). Digits-only, no '+', matches the shape
  // normalizePhone() produces so the bot can reach the admin directly.
  // Testing (2026-07-17): temporarily routed to +92 334 3873622 for verification.
  // Swap the two lines below to restore Yasir's number.
  adminNotifyWhatsapp: process.env.ADMIN_NOTIFY_WHATSAPP?.replace(/\D/g, "") || "923343873622",
  // adminNotifyWhatsapp: process.env.ADMIN_NOTIFY_WHATSAPP?.replace(/\D/g, "") || "923242895065",

  // Subscription QA affordance — shows the 🧪 test buttons (upgrade
  // Test Activate + doctor Test DP Cap Flow) globally to every user.
  // Defaults to false in prod so real users never see them; individual
  // admins can still unlock them per-account by sending ADMIN_PASSWORD
  // (see the isTestModeFor() helper in utils.js).
  testActivationEnabled: String(process.env.TEST_ACTIVATION_ENABLED ?? "false").toLowerCase() === "true",

  // Shared password that promotes the sender's account to `is_admin=true`.
  // An admin sees the same 🧪 test buttons as when the global flag is on.
  // Change or unset this in prod to lock the door.
  adminPassword: process.env.ADMIN_PASSWORD?.trim() || "admin123@",
  useWebhook: String(process.env.USE_WEBHOOK).toLowerCase() === "true",
  webhookUrl: process.env.WEBHOOK_URL?.trim() || "",
  port: parseInt(process.env.PORT || "8080", 10),

  // Engagement Engine — Build 1. The daily composer runs once per user per
  // day at MSG_COMPOSER_HOUR (PKT). INACTIVITY_EXIT_DAYS is the threshold
  // above which a user is considered Inactive and receives no system nudges.
  // MSG_BLOCK_COOLDOWN_DAYS is the default cooldown when a block row has no
  // explicit `cooldown_days`. Any of these are overridden at read time by
  // matching rows in the `engagement_config` table (see engagement.js).
  composer: {
    hour: parseInt(process.env.MSG_COMPOSER_HOUR || "8", 10),
    inactivityExitDays: parseInt(process.env.INACTIVITY_EXIT_DAYS || "14", 10),
    blockCooldownDays: parseInt(process.env.MSG_BLOCK_COOLDOWN_DAYS || "7", 10),
  },

  // WhatsApp adapter (the contracted delivery channel). Supports two providers
  // that speak the SAME Cloud API payloads/webhooks:
  //   • "meta"      — Meta Graph API directly (needs a token + phone number id)
  //   • "360dialog" — 360dialog BSP, which proxies the Cloud API (needs only a
  //                   single D360-API-KEY; the number is bound to that key)
  // Auto-detects 360dialog when D360_API_KEY is set; override with WHATSAPP_PROVIDER.
  whatsapp: {
    provider:
      process.env.WHATSAPP_PROVIDER?.trim().toLowerCase() ||
      (process.env.D360_API_KEY?.trim() ? "360dialog" : "meta"),

    // Meta Cloud API (direct)
    token: process.env.WHATSAPP_TOKEN?.trim() || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || "",
    apiVersion: process.env.WHATSAPP_API_VERSION?.trim() || "v21.0",

    // 360dialog (BSP)
    apiKey: process.env.D360_API_KEY?.trim() || "",
    baseUrl: process.env.D360_BASE_URL?.trim() || "https://waba-v2.360dialog.io",

    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN?.trim() || "drsaab-verify",
    port: parseInt(process.env.WHATSAPP_PORT || "8082", 10),
    get enabled() {
      return this.provider === "360dialog" ? !!this.apiKey : !!(this.token && this.phoneNumberId);
    },
  },
};

// TELEGRAM DISABLED — the channel guard used to require WhatsApp OR Telegram.
// With Telegram commented out (see index.js) the web chat GUI is always
// available, so a warning is enough — don't exit if only WhatsApp is missing.
if (!config.whatsapp.enabled) {
  console.warn(
    "   ⚠ WhatsApp not configured — running with the web chat GUI only. Set D360_API_KEY (360dialog) or WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID (Meta Cloud API) to enable it."
  );
}
// Original guard, preserved for when Telegram is re-enabled:
// if (!config.telegramEnabled && !config.whatsapp.enabled) {
//   console.error(red("\n✖ No messaging channel configured."));
//   console.error(red("  Set WhatsApp credentials (D360_API_KEY for 360dialog, or"));
//   console.error(red("  WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID for Meta Cloud API),"));
//   console.error(red("  and/or TELEGRAM_BOT_TOKEN for the optional Telegram channel.\n"));
//   process.exit(1);
// }
