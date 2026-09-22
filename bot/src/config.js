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
    // Groq retired the Llama chat models — a key that once worked now gets
    // 404 model_not_found on every text call. Verified against the live
    // catalog 2026-09-11: openai/gpt-oss-120b is the production text model.
    model: process.env.LLM_MODEL?.trim() || (usingGroq ? "openai/gpt-oss-120b" : "gpt-4o-mini"),
    visionModel:
      process.env.LLM_VISION_MODEL?.trim() ||
      // qwen/qwen3.6-27b was retired by Groq (404) by 2026-09-22.
      (usingGroq ? "qwen/qwen3.8-27b" : "gpt-4o-mini"),

    // When BOTH GROQ and OPENAI keys are present, OpenAI answers every AI call
    // (chat, photos, labs, reports) and Groq is only a backup for when OpenAI
    // fails. gpt-4.1-mini for photos: gpt-4o-mini bills ~25k tokens per photo.
    paidApiKey: usingGroq && openaiKey ? openaiKey : null,
    paidModel: process.env.LLM_PAID_MODEL?.trim() || (openaiKey ? "gpt-4o-mini" : null),
    paidVisionModel: process.env.LLM_PAID_VISION_MODEL?.trim() || "gpt-4.1-mini",
    // Behind-the-scenes JSON extraction (My Health answers → structured data)
    // never reaches the user as prose, so it runs on the cheapest model:
    // gpt-4.1-nano is ~33% the input price of gpt-4o-mini.
    paidExtractModel: process.env.LLM_PAID_EXTRACT_MODEL?.trim() || "gpt-4.1-nano",
  },

  // Database selection priority: Postgres (DATABASE_URL) → Supabase → in-memory.
  // In-memory data resets on restart — handy for the very first quick test.
  databaseUrl,
  supabaseUrl,
  supabaseKey,
  hasPostgres: !!databaseUrl,
  hasSupabase: !!(supabaseUrl && supabaseKey),

  defaultTier: process.env.DEFAULT_TIER?.trim() || "free",

  // WhatsApp numbers that receive payment-submission alerts for the Subscription
  // Module (spec §9). Digits-only, no '+', matches the shape normalizePhone()
  // produces so the bot can reach the admin directly. ADMIN_NOTIFY_WHATSAPP may
  // be a single number or a comma-separated list; every number receives the
  // payment card and any of them can Approve/Reject/Better.
  adminNotifyWhatsapps: (process.env.ADMIN_NOTIFY_WHATSAPP || "923343873622,923242895065")
    .split(",")
    .map((n) => n.replace(/\D/g, ""))
    .filter(Boolean),

  // Subscription QA affordance — shows the 🧪 test buttons (upgrade
  // Test Activate + doctor Test DP Cap Flow) globally to every user.
  // Defaults to false in prod so real users never see them; individual
  // admins can still unlock them per-account by sending ADMIN_PASSWORD
  // (see the isTestModeFor() helper in utils.js).
  testActivationEnabled: String(process.env.TEST_ACTIVATION_ENABLED ?? "false").toLowerCase() === "true",

  // Shared password that promotes the sender's account to `is_admin=true`.
  // An admin sees the same 🧪 test buttons as when the global flag is on.
  // Sourced only from ADMIN_PASSWORD (same var the website admin uses); with
  // it unset there is no password and the promotion shortcut is disabled.
  adminPassword: process.env.ADMIN_PASSWORD?.trim() || "",
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

  // Outbound email (SMTP). Only used by the weekly doctor report email for
  // now. Works with any SMTP provider (Gmail app password, Brevo, SES, ...).
  // Leave SMTP_HOST empty to keep email off — the weekly job then no-ops.
  mail: {
    host: process.env.SMTP_HOST?.trim() || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    // true = implicit TLS (port 465); false = STARTTLS upgrade (port 587).
    secure: process.env.SMTP_SECURE
      ? String(process.env.SMTP_SECURE).toLowerCase() === "true"
      : parseInt(process.env.SMTP_PORT || "587", 10) === 465,
    user: process.env.SMTP_USER?.trim() || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.MAIL_FROM?.trim() || process.env.SMTP_USER?.trim() || "",
    get enabled() {
      return !!(this.host && this.from);
    },
  },

  // Weekly doctor report email: every doctor with at least one connected
  // patient and an email on file gets the Weekly Patient Snapshots PDF.
  // Day is 0=Sunday .. 6=Saturday, hour is 0-23, both in Pakistan time.
  doctorWeeklyEmail: {
    enabled: String(process.env.DOCTOR_WEEKLY_EMAIL_ENABLED ?? "true").toLowerCase() !== "false",
    day: parseInt(process.env.DOCTOR_WEEKLY_EMAIL_DAY || "0", 10),
    hour: parseInt(process.env.DOCTOR_WEEKLY_EMAIL_HOUR || "18", 10),
  },

  // Doctor free plan (doctorCap.js): the weekly summary covers the first
  // DOCTOR_FREE_PATIENT_CAP linked patients unless the doctor is on DrPremium.
  // Doctors who pass the limit are told to write to this address to upgrade.
  doctorUpgradeContact: process.env.DOCTOR_UPGRADE_CONTACT?.trim() || "yasir@drsaabcoach.com",

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
