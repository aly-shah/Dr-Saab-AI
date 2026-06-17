// WhatsApp Cloud API adapter (foundation).
//
// This is the contracted delivery channel. The conversation logic is shared
// with Telegram — we reuse handleMessage / handleCallback and only translate
// the transport here:
//   • inbound  : Meta webhook  → Telegram-shaped msg/query objects
//   • outbound : a "virtual bot" → Graph API messages (text + interactive)
//
// It only starts when WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID are set
// (i.e. once the client grants Meta access + a verified number). Until then it
// stays dormant and the Telegram adapter keeps running.

import http from "node:http";
import { config } from "./config.js";
import { handleMessage, handleCallback } from "./bot.js";

const GRAPH = "https://graph.facebook.com";

function api() {
  const { apiVersion, phoneNumberId, token } = config.whatsapp;
  return {
    url: `${GRAPH}/${apiVersion}/${phoneNumberId}/messages`,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  };
}

async function sendRaw(payload) {
  const { url, headers } = api();
  try {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
    if (!res.ok) console.error("whatsapp send failed:", res.status, await res.text());
  } catch (e) {
    console.error("whatsapp send error:", e?.message);
  }
}

// Map our inline_keyboard rows → WhatsApp interactive. WhatsApp allows at most
// 3 reply buttons; anything larger becomes a single-section list (max 10 rows).
const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

function interactiveFor(text, rows) {
  const buttons = rows.flat().filter((b) => b && b.callback_data);
  if (buttons.length === 0) return null;
  if (buttons.length <= 3) {
    return {
      type: "button",
      body: { text: trunc(text || "…", 1024) },
      action: {
        buttons: buttons.map((b) => ({
          type: "reply",
          reply: { id: trunc(b.callback_data, 256), title: trunc(stripMd(b.text), 20) },
        })),
      },
    };
  }
  return {
    type: "list",
    body: { text: trunc(text || "…", 1024) },
    action: {
      button: "Choose",
      sections: [
        {
          rows: buttons.slice(0, 10).map((b) => ({
            id: trunc(b.callback_data, 200),
            title: trunc(stripMd(b.text), 24),
          })),
        },
      ],
    },
  };
}

function stripMd(s = "") {
  return String(s).replace(/[*_`]/g, "");
}

// A Telegram-bot-shaped object the shared flows can call. Each call becomes a
// WhatsApp Graph API request to the given chat (phone number).
function virtualBot() {
  return {
    async sendMessage(to, text, opts = {}) {
      const kb = opts.reply_markup?.inline_keyboard;
      const interactive = kb ? interactiveFor(text, kb) : null;
      if (interactive) {
        await sendRaw({ messaging_product: "whatsapp", to: String(to), type: "interactive", interactive });
      } else {
        await sendRaw({
          messaging_product: "whatsapp",
          to: String(to),
          type: "text",
          text: { body: trunc(stripMd(text || "…"), 4096) },
        });
      }
      return { message_id: Date.now() };
    },
    async sendChatAction() {},
    async answerCallbackQuery() {},
    async getFileLink() {
      return null; // media download via the WhatsApp media API — TODO
    },
    async setMyCommands() {},
    on() {},
  };
}

async function onInbound(value) {
  const messages = value?.messages;
  if (!messages || !messages.length) return; // status callbacks etc.
  const bot = virtualBot();

  for (const m of messages) {
    const from = m.from; // sender phone number (digits) — fits a bigint key
    if (m.type === "interactive") {
      const reply = m.interactive?.button_reply || m.interactive?.list_reply;
      if (!reply) continue;
      await handleCallback(bot, {
        id: m.id,
        data: reply.id,
        message: { chat: { id: from } },
        from: { id: from },
        __source: "whatsapp",
      }).catch((e) => console.error("wa callback error:", e?.message));
    } else {
      const text = m.text?.body ?? m.button?.text ?? "";
      await handleMessage(bot, {
        chat: { id: from },
        from: { id: from },
        text,
        __source: "whatsapp",
      }).catch((e) => console.error("wa message error:", e?.message));
    }
  }
}

export function startWhatsApp() {
  if (!config.whatsapp.enabled) {
    console.log("   WhatsApp adapter: dormant (set WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID to enable).");
    return;
  }
  const { port, verifyToken } = config.whatsapp;

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);

    // Meta webhook verification handshake.
    if (req.method === "GET" && url.pathname === "/whatsapp/webhook") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      if (mode === "subscribe" && token === verifyToken) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        return res.end(challenge || "");
      }
      res.writeHead(403);
      return res.end("forbidden");
    }

    // Inbound messages.
    if (req.method === "POST" && url.pathname === "/whatsapp/webhook") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        res.writeHead(200);
        res.end("ok"); // ack immediately; process async
        try {
          const data = JSON.parse(body || "{}");
          for (const entry of data.entry || []) {
            for (const change of entry.changes || []) {
              onInbound(change.value).catch((e) => console.error("wa inbound error:", e?.message));
            }
          }
        } catch (e) {
          console.error("wa webhook parse error:", e?.message);
        }
      });
      return;
    }

    res.writeHead(404);
    res.end("not found");
  });

  server.listen(port, () => {
    console.log(`   WhatsApp adapter on http://localhost:${port}/whatsapp/webhook`);
  });
}
