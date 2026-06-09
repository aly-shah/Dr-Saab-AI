// Lightweight HTTP API that exposes the SAME bot logic to a web chat GUI.
// A "virtual bot" captures whatever the flows would have sent to Telegram and
// returns it as JSON: [{ text, rows:[[{label,data}]] }].

import http from "node:http";
import { handleMessage, handleCallback } from "./bot.js";

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
    } else {
      await handleMessage(vbot, {
        chat: { id: sessionId },
        from: { id: sessionId },
        text: payload,
        __source: "web",
      });
    }
  } catch (e) {
    console.error("web process error:", e?.message);
    buffer.push({ text: "😕 Something went wrong. Please try again.", rows: [] });
  }
  return buffer;
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
    if (req.method === "POST" && req.url === "/web/message") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", async () => {
        try {
          const { sessionId, type = "text", text = "", data = "" } = JSON.parse(body || "{}");
          if (sessionId === undefined || sessionId === null) {
            return sendJson(res, 400, { error: "sessionId required" });
          }
          const messages = await processWeb(sessionId, type, type === "callback" ? data : text);
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
