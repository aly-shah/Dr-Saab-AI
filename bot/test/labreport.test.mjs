// Tests for the "Explain My Report" upload record. Every file a patient sends
// must end up on their lab_reports row so the admin panel shows it under the
// patient - including the paths that never reach the AI (free-tier cap hit,
// upload arriving from an unrelated flow). Uses the memory backend (no
// external DB) and never calls the LLM.
//
// Run:  cd bot && node --test test/labreport.test.mjs

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-stub";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "test-stub";
process.env.DATABASE_URL = "";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.REMINDER_TZ_OFFSET = "5";

import { strict as assert } from "node:assert";
import { test } from "node:test";

const { labText, inlineUpload, uploadFromMessage } = await import("../src/flows/labreport.js");
const { hasAttachment } = await import("../src/utils.js");
const supabase = await import("../src/supabase.js");

const PNG = "data:image/png;base64,iVBORw0KGgo=";
const PDF = "data:application/pdf;base64,JVBERi0xLjQK";

function makeFakeBot() {
  const sent = [];
  return {
    sent,
    sendMessage: async (chatId, text, opts) => {
      sent.push({ chatId, text, opts });
      return { message_id: sent.length };
    },
    sendChatAction: async () => {},
    getFileLink: async () => null,
  };
}

async function seedUser(overrides = {}) {
  const base = await supabase.getOrCreateUser(`tg-${Math.random().toString(36).slice(2)}`, "telegram");
  return await supabase.updateUser(base.id, { onboarded: true, language: "en", tier: "free", ...overrides });
}

const lastText = (bot) => bot.sent.at(-1)?.text || "";

test("hasAttachment: a web PDF (text pre-extracted) still counts as an upload", () => {
  assert.equal(hasAttachment({ text: "HbA1c 7.1", __documentDataUrl: PDF, __documentMime: "application/pdf" }), true);
  assert.equal(hasAttachment({ text: "hello" }), false);
});

test("uploadFromMessage keeps the original file and name for web / WhatsApp / Telegram shapes", () => {
  assert.deepEqual(
    uploadFromMessage({ __documentDataUrl: PDF, __documentMime: "application/pdf", __documentName: "cbc.pdf" }, null),
    { media_type: "pdf", media_data: PDF, file_name: "cbc.pdf" },
  );
  assert.deepEqual(uploadFromMessage({ __documentName: "photo.jpg" }, PNG), {
    media_type: "image", media_data: PNG, file_name: "photo.jpg",
  });
  assert.equal(uploadFromMessage({ document: { file_name: "tg.png" } }, PNG).file_name, "tg.png");
  assert.deepEqual(uploadFromMessage({}, null), {});
});

test("inlineUpload: an oversized file keeps its name so the admin panel shows it was sent", () => {
  const huge = "data:application/pdf;base64," + "A".repeat(13 * 1024 * 1024);
  assert.deepEqual(inlineUpload("pdf", huge, "big.pdf"), { file_name: "big.pdf" });
});

test("free user over the monthly cap: upload is saved for the admin panel, not analysed", async () => {
  const user = await seedUser();
  // Three analysed reports this month use up the free allowance.
  for (let i = 0; i < 3; i++) {
    await supabase.addLabReport(user.id, "HbA1c 7", "analysis", { values: [{ test: "HbA1c", result: "7" }] });
  }
  const bot = makeFakeBot();
  const session = { state: "lab", step: null, data: {}, history: [], user };

  await labText(bot, 1, session, "", { __imageDataUrl: PNG, __documentName: "report.png" });

  assert.ok(lastText(bot).includes("free report analyses"), "user should see the limit message");
  const rows = await supabase.listLabReports(user.id);
  assert.equal(rows.length, 4, "the capped upload must still be recorded");
  const kept = rows[0];
  assert.equal(kept.analysis, null);
  assert.equal(kept.metadata?.status, "limit_reached");
  assert.equal(kept.media_type, "image");
  assert.equal(kept.file_name, "report.png");
  // ...and it does not eat next month's allowance.
  assert.equal(await supabase.countLabReportsSince(user.id, "2000-01-01T00:00:00Z"), 3);
});

test("free user over the cap sending a web PDF: file is saved with the extracted text", async () => {
  const user = await seedUser();
  for (let i = 0; i < 3; i++) await supabase.addLabReport(user.id, "x", "analysis", {});
  const bot = makeFakeBot();
  const session = { state: "lab", step: null, data: {}, history: [], user };

  await labText(bot, 1, session, "Glucose 140 mg/dL", {
    text: "Glucose 140 mg/dL",
    __documentDataUrl: PDF,
    __documentMime: "application/pdf",
    __documentName: "lipid.pdf",
  });

  const kept = (await supabase.listLabReports(user.id))[0];
  assert.equal(kept.metadata?.status, "limit_reached");
  assert.equal(kept.media_type, "pdf");
  assert.equal(kept.file_name, "lipid.pdf");
  assert.equal(kept.raw_input, "Glucose 140 mg/dL");
});
