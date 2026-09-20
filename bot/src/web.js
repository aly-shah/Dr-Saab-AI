// Lightweight HTTP API that exposes the SAME bot logic to a web chat GUI.
// A "virtual bot" captures whatever the flows would have sent to Telegram and
// returns it as JSON: [{ text, rows:[[{label,data}]] }].

import http from "node:http";
import { handleMessage, handleCallback } from "./bot.js";
import { parseDataUrl, isPdfMime, isImageMime, extractPdfText } from "./pdf.js";
import { saveUnanalysedReport, inlineUpload } from "./flows/labreport.js";
import { getOrCreateUser, getUserById, getDoctorById, doctorPatientStats, saveVoiceNote } from "./supabase.js";
import { getSession } from "./session.js";
import { wantsFeedbackMedia } from "./flows/feedback.js";
import { t } from "./i18n.js";
import { config } from "./config.js";
import { assembleSnapshotData, fallbackInsights } from "./snapshotData.js";
import { renderSnapshotPdf } from "./snapshotPdf.js";
import { snapshotInsights } from "./openai.js";
import { assembleDoctorReport } from "./doctorReportData.js";
import { renderDoctorWeeklyPdf, renderPatientSnapshotPdf } from "./doctorReportPdf.js";
import { dayKey } from "./snapshotData.js";
import { logWarn, logError } from "./log.js";
import { runBroadcast, resolveRecipients, AUDIENCES } from "./broadcast.js";

// Channel adapters the admin broadcast sends through — the same map the
// scheduler gets ({ whatsapp, telegram }); index.js registers it at boot.
let broadcastBots = {};
export function setBroadcastChannels(bots) {
  broadcastBots = bots || {};
}

function createVirtualBot(buffer) {
  return {
    async sendMessage(_chatId, text, opts = {}) {
      const kb = opts.reply_markup?.inline_keyboard;
      const rows = kb
        ? kb.map((row) => row.map((b) => ({ label: b.text, data: b.callback_data })))
        : [];
      buffer.push({ text: text ?? "", rows });
      return { message_id: buffer.length };
    },
    // A generated file (the Health Snapshot PDF) rides along as a data URL;
    // the /bot page renders it as a download card under the caption.
    async sendDocument(_chatId, fileBuf, opts = {}, fileOpts = {}) {
      const kb = opts.reply_markup?.inline_keyboard;
      const rows = kb
        ? kb.map((row) => row.map((b) => ({ label: b.text, data: b.callback_data })))
        : [];
      const mime = fileOpts.contentType || "application/pdf";
      buffer.push({
        text: opts.caption ?? "",
        rows,
        file: {
          name: fileOpts.filename || "document.pdf",
          mime,
          size: fileBuf.length,
          dataUrl: `data:${mime};base64,${Buffer.from(fileBuf).toString("base64")}`,
        },
      });
      return { message_id: buffer.length };
    },
    async sendChatAction() {},
    async answerCallbackQuery() {},
    async getFileLink() {
      return null; // photos not supported over the web demo
    },
    async setMyCommands() {},
    on() {},
  };
}

async function processWeb(sessionId, type, payload) {
  const buffer = [];
  const vbot = createVirtualBot(buffer);
  try {
    if (type === "callback") {
      await handleCallback(vbot, {
        id: "web",
        data: payload,
        message: { chat: { id: sessionId } },
        from: { id: sessionId },
        __source: "web",
      });
    } else if (type === "image" || type === "file") {
      // Web upload: frontend already read the file as a data URL. Two shapes:
      //   • image (image/jpeg, image/png, …) → passed as __imageDataUrl so the
      //     shared flows send it to the vision model.
      //   • PDF (application/pdf) → text is extracted here and passed as the
      //     message text, so the lab flow can analyse it as if the user typed
      //     the values. Vision models can't read PDFs directly.
      const { dataUrl, caption, fileName } = payload || {};
      const parsed = parseDataUrl(dataUrl);
      if (parsed && isPdfMime(parsed.mime)) {
        const text = await extractPdfText(parsed.buffer);
        if (!text) {
          // We return before the lab flow runs, so record the upload here:
          // a scan we cannot read is still the patient's document and has to
          // show up under their name in the admin panel.
          try {
            const user = await getOrCreateUser(sessionId, "web");
            await saveUnanalysedReport(
              user.id,
              caption?.trim() || "[pdf]",
              inlineUpload("pdf", dataUrl, fileName),
              "pdf_no_text",
              "PDF carried no extractable text (likely a scan)",
            );
          } catch (saveErr) {
            console.error("web pdf save failed:", saveErr?.message || saveErr);
          }
          buffer.push({
            text:
              "I received the PDF but couldn't read any text from it — it may be a scanned image. Please share a photo or screenshot of the report instead.",
            // Same "Resend Report" chip the flows attach to an unreadable
            // upload — the page opens the file picker on this callback.
            rows: [[{ label: "Resend Report", data: "lab:retry" }]],
          });
          return buffer;
        }
        const combined = [caption?.trim(), text].filter(Boolean).join("\n\n");
        await handleMessage(vbot, {
          chat: { id: sessionId },
          from: { id: sessionId },
          text: combined,
          // The PDF has already become text above, but the flows still want the
          // original so it can be attached to the saved report and viewed in
          // the admin panel. Deliberately NOT __documentBuffer: that would send
          // the lab flow through a second, redundant text extraction.
          __documentDataUrl: dataUrl,
          __documentMime: parsed.mime,
          __documentName: fileName || "",
          __source: "web",
        });
      } else if (parsed && isImageMime(parsed.mime)) {
        await handleMessage(vbot, {
          chat: { id: sessionId },
          from: { id: sessionId },
          text: caption || "",
          caption: caption || "",
          __imageDataUrl: dataUrl,
          __documentName: fileName || "",
          __source: "web",
        });
      } else if (parsed && parsed.mime.toLowerCase().startsWith("audio/")) {
        // Audio file — part of a "Feedback" submission, or (like a WhatsApp
        // voice note) saved to the user's conversation and acknowledged.
        if (wantsFeedbackMedia(getSession(sessionId))) {
          await handleMessage(vbot, {
            chat: { id: sessionId },
            from: { id: sessionId },
            text: caption || "",
            caption: caption || "",
            __audioDataUrl: dataUrl,
            __source: "web",
          });
        } else {
          const user = await getOrCreateUser(sessionId, "web");
          await saveVoiceNote(user.id, dataUrl);
          buffer.push({ text: t(user?.language || "en", "voice_note_saved"), rows: [] });
        }
      } else {
        buffer.push({
          text:
            "That file type isn't supported yet — please attach a photo, an image file, or a PDF of your report.",
          rows: [],
        });
      }
    } else {
      await handleMessage(vbot, {
        chat: { id: sessionId },
        from: { id: sessionId },
        text: payload,
        __source: "web",
      });
    }
  } catch (e) {
    // Log the full stack so backend failures (missing columns, bad env, etc.)
    // are debuggable from server logs instead of just showing the user a
    // generic message with no signal in the log.
    console.error("web process error:", e?.stack || e?.message || e);
    buffer.push({ text: "😕 Something went wrong. Please try again.", rows: [] });
  }
  return buffer;
}

// ---------------------------------------------------------------------------
// Admin PDF reports (website admin panel → /api/admin/pdf → here).
//
// The panel already authenticates the admin; it forwards the shared
// ADMIN_PASSWORD in the x-admin-password header so this endpoint is never
// reachable without it. Returns the PDF bytes with a filename header.
//   { kind: "patient",        userId }            → Executive Health Snapshot
//   { kind: "doctor_weekly",  doctorId }          → Weekly Patient Snapshots
//   { kind: "doctor_patient", doctorId, userId }  → one Patient Health Snapshot
// ---------------------------------------------------------------------------
async function buildAdminReport({ kind, userId, doctorId }) {
  if (kind === "patient") {
    const user = await getUserById(userId);
    if (!user) return { error: "patient not found", status: 404 };
    const data = await assembleSnapshotData(user);
    let insights;
    try {
      insights = await snapshotInsights(user, data.facts);
    } catch (e) {
      logWarn("Admin patient report AI", `using built-in summaries — ${e?.message}`);
      insights = fallbackInsights(data);
    }
    const pdf = await renderSnapshotPdf(data, insights);
    return { pdf, filename: `DrSaab-Health-Snapshot-${safeName(user.name)}-${dayKey(data.generatedAt)}.pdf` };
  }
  const doc = await getDoctorById(doctorId);
  if (!doc) return { error: "doctor not found", status: 404 };
  const doctorUser = doc.user_id ? await getUserById(doc.user_id).catch(() => null) : null;
  const patients = await doctorPatientStats(doc.id);
  if (kind === "doctor_weekly") {
    if (!patients.length) return { error: "this doctor has no connected patients", status: 400 };
    const report = await assembleDoctorReport(doctorUser || { name: doc.name }, doc, patients);
    const pdf = await renderDoctorWeeklyPdf(report);
    return { pdf, filename: `DrSaab-Weekly-Patient-Snapshots-${safeName(doc.name)}-${dayKey(report.generatedAt)}.pdf` };
  }
  if (kind === "doctor_patient") {
    const target = patients.find((p) => String(p.id) === String(userId));
    if (!target) return { error: "patient is not connected to this doctor", status: 404 };
    const report = await assembleDoctorReport(doctorUser || { name: doc.name }, doc, [target]);
    const pdf = await renderPatientSnapshotPdf(report, 0);
    return { pdf, filename: `DrSaab-Patient-Snapshot-${safeName(report.patients[0].name)}-${dayKey(report.generatedAt)}.pdf` };
  }
  return { error: "unknown report kind", status: 400 };
}

function safeName(s) {
  return String(s || "report").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "report";
}

function handleAdminReport(req, res) {
  const expected = config.adminPassword;
  if (!expected) return sendJson(res, 503, { error: "ADMIN_PASSWORD is not configured on the bot" });
  if ((req.headers["x-admin-password"] || "") !== expected) return sendJson(res, 401, { error: "unauthorized" });
  let body = "";
  req.on("data", (c) => {
    body += c;
    if (body.length > 64 * 1024) req.destroy();
  });
  req.on("end", async () => {
    try {
      const params = JSON.parse(body || "{}");
      const out = await buildAdminReport(params);
      if (out.error) return sendJson(res, out.status || 400, { error: out.error });
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Length": out.pdf.length,
        "X-Filename": out.filename,
      });
      res.end(out.pdf);
    } catch (e) {
      logError("Admin report", e?.message || String(e));
      console.error(e?.stack || e);
      sendJson(res, 500, { error: e?.message || "report failed" });
    }
  });
}

// Ad hoc messaging (website admin panel → /api/admin/broadcast → here).
//   { audience, dryRun: true } → { recipients }
//   { text, audience }         → { recipients, sent, failed, skipped, id }
function handleAdminBroadcast(req, res) {
  const expected = config.adminPassword;
  if (!expected) return sendJson(res, 503, { error: "ADMIN_PASSWORD is not configured on the bot" });
  if ((req.headers["x-admin-password"] || "") !== expected) return sendJson(res, 401, { error: "unauthorized" });
  let body = "";
  req.on("data", (c) => {
    body += c;
    if (body.length > 64 * 1024) req.destroy();
  });
  req.on("end", async () => {
    try {
      const { text = "", audience = "all", dryRun = false, sentBy = "admin" } = JSON.parse(body || "{}");
      if (!AUDIENCES.includes(audience)) return sendJson(res, 400, { error: "audience must be all, patients or doctors" });
      if (dryRun) {
        const users = await resolveRecipients(audience);
        return sendJson(res, 200, { recipients: users.length, audience });
      }
      if (!Object.values(broadcastBots).some(Boolean)) {
        return sendJson(res, 503, { error: "no messaging channel is configured on the bot (WhatsApp is off)" });
      }
      const out = await runBroadcast(broadcastBots, { text, audience, sentBy });
      sendJson(res, 200, out);
    } catch (e) {
      logError("Admin broadcast", e?.message || String(e));
      sendJson(res, e?.message?.startsWith("message ") ? 400 : 500, { error: e?.message || "broadcast failed" });
    }
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

export function startWebServer() {
  const port = parseInt(process.env.WEB_API_PORT || "8081", 10);

  const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method === "GET" && req.url === "/web/health") {
      return sendJson(res, 200, { ok: true });
    }
    if (req.method === "POST" && req.url === "/web/admin/report") {
      return handleAdminReport(req, res);
    }
    if (req.method === "POST" && req.url === "/web/admin/broadcast") {
      return handleAdminBroadcast(req, res);
    }
    if (req.method === "POST" && req.url === "/web/message") {
      let body = "";
      // Base64-encoded lab-report images can easily exceed the tiny default
      // limit, so cap generously (~10 MB post-encoding) but reject beyond that.
      const MAX_BYTES = 10 * 1024 * 1024;
      let aborted = false;
      req.on("data", (c) => {
        body += c;
        if (body.length > MAX_BYTES) {
          aborted = true;
          req.destroy();
        }
      });
      req.on("end", async () => {
        if (aborted) return sendJson(res, 413, { error: "payload too large" });
        try {
          const parsed = JSON.parse(body || "{}");
          const {
            sessionId,
            type = "text",
            text = "",
            data = "",
            dataUrl = "",
            caption = "",
            fileName = "",
          } = parsed;
          if (sessionId === undefined || sessionId === null) {
            return sendJson(res, 400, { error: "sessionId required" });
          }
          let payload;
          if (type === "callback") payload = data;
          // fileName is what the admin panel labels the stored report with —
          // it was being dropped here, so every web upload landed unnamed.
          else if (type === "image" || type === "file") payload = { dataUrl, caption, fileName };
          else payload = text;
          const messages = await processWeb(sessionId, type, payload);
          return sendJson(res, 200, { messages });
        } catch (e) {
          return sendJson(res, 500, { error: e?.message || "error" });
        }
      });
      return;
    }
    res.writeHead(404);
    res.end();
  });

  server.listen(port, () => {
    console.log(`   Web chat API on http://localhost:${port}/web/message`);
  });
  return server;
}
