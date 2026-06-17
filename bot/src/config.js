import "dotenv/config";

function required(name) {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    console.error(`\n❌ Missing required environment variable: ${name}`);
    console.error("   Copy .env.example to .env and fill it in.\n");
    process.exit(1);
  }
  return v.trim();
}

const groqKey = process.env.GROQ_API_KEY?.trim();
const openaiKey = process.env.OPENAI_API_KEY?.trim();
const llmKey = groqKey || openaiKey;

if (!llmKey) {
  console.error("\n❌ Provide GROQ_API_KEY (recommended) or OPENAI_API_KEY in .env\n");
  process.exit(1);
}

const usingGroq = !!groqKey;

const databaseUrl = process.env.DATABASE_URL?.trim() || "";
const supabaseUrl = process.env.SUPABASE_URL?.trim() || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

export const config = {
  telegramToken: required("TELEGRAM_BOT_TOKEN"),

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
  },

  // Database selection priority: Postgres (DATABASE_URL) → Supabase → in-memory.
  // In-memory data resets on restart — handy for the very first quick test.
  databaseUrl,
  supabaseUrl,
  supabaseKey,
  hasPostgres: !!databaseUrl,
  hasSupabase: !!(supabaseUrl && supabaseKey),

  defaultTier: process.env.DEFAULT_TIER?.trim() || "free",
  useWebhook: String(process.env.USE_WEBHOOK).toLowerCase() === "true",
  webhookUrl: process.env.WEBHOOK_URL?.trim() || "",
  port: parseInt(process.env.PORT || "8080", 10),

  // WhatsApp Cloud API adapter (the contracted delivery channel). Only starts
  // when a token + phone number id are present; needs the client's Meta access.
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN?.trim() || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN?.trim() || "drsaab-verify",
    apiVersion: process.env.WHATSAPP_API_VERSION?.trim() || "v21.0",
    port: parseInt(process.env.WHATSAPP_PORT || "8082", 10),
    get enabled() {
      return !!(this.token && this.phoneNumberId);
    },
  },
};
