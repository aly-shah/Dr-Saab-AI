// WhatsApp Cloud API adapter (foundation).
//
// This is the contracted delivery channel. The conversation logic is shared
// with Telegram — we reuse handleMessage / handleCallback and only translate
// the transport here:
//   • inbound  : Cloud-API webhook → Telegram-shaped msg/query objects
//   • outbound : a "virtual bot"   → Cloud-API messages (text + interactive)
//
// Works with two providers that speak the SAME Cloud API (see config.js):
//   • Meta directly  — set WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID
//   • 360dialog (BSP)— set D360_API_KEY (recommended: one key, no FB app needed)
// 360dialog forwards Meta's exact webhook JSON, so the inbound parsing below is
// unchanged. Until one provider is configured the adapter stays dormant and the
// Telegram adapter keeps running.

import http from "node:http";
import { config } from "./config.js";
import { handleMessage, handleCallback } from "./bot.js";
import { logError } from "./log.js";
import { describeWhatsAppError } from "./errors.js";
import { t } from "./i18n.js";
import { getSession } from "./session.js";
import { langOf } from "./utils.js";

// Safety net: if a flow throws (e.g. the Groq/LLM API rate-limited us), tell the
// WhatsApp user what happened instead of leaving them with silence. Flows that
// call the LLM already catch and send their own message, so this only fires for
// genuinely unhandled errors. A 429 is flagged as `aiLimited` in openai.js.
async function replyOnError(bot, to, e) {
  const lang = langOf(getSession(to));
  const key = e?.aiLimited ? "error_ai_limit" : "error_generic";
  await bot.sendMessage(to, t(lang, key)).catch(() => {});
}

const GRAPH = "https://graph.facebook.com";

function api() {
  const w = config.whatsapp;
  if (w.provider === "360dialog") {
    // 360dialog Cloud API: identical message payloads to Meta, but a different
    // host + auth header, and no phone-number-id in the path (the API key is
    // already bound to the WhatsApp number).
    return {
      url: `${w.baseUrl.replace(/\/$/, "")}/messages`,
      headers: { "D360-API-KEY": w.apiKey, "Content-Type": "application/json" },
    };
  }
  return {
    url: `${GRAPH}/${w.apiVersion}/${w.phoneNumberId}/messages`,
    headers: { Authorization: `Bearer ${w.token}`, "Content-Type": "application/json" },
  };
}

async function sendRaw(payload) {
  const { url, headers } = api();
  try {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
    if (!res.ok) {
      const body = await res.text();
      logError("WhatsApp send", describeWhatsAppError(res.status, body, config.whatsapp.provider));
    }
  } catch (e) {
    logError("WhatsApp send", `network error reaching the WhatsApp API: ${e?.message}`);
  }
}

// Resolve an inbound WhatsApp media id to a base64 data URL for the vision model.
// It is a two-step flow on the Cloud API: GET the media id → a (short-lived,
// authenticated) download URL, then GET that URL with the same auth.
//   • Meta direct : both calls use the Bearer token, the URL is on graph.facebook.com
//   • 360dialog   : both calls use the D360-API-KEY; the returned URL must be
//                   fetched through 360dialog's own host, so we swap the origin.
async function fetchMediaDataUrl(mediaId) {
  const w = config.whatsapp;
  try {
    if (w.provider === "360dialog") {
      const base = w.baseUrl.replace(/\/$/, "");
      const headers = { "D360-API-KEY": w.apiKey };
      const metaRes = await fetch(`${base}/${mediaId}`, { headers });
      if (!metaRes.ok) {
        logError("WhatsApp media", describeWhatsAppError(metaRes.status, await metaRes.text(), w.provider), "resolve URL");
        return null;
      }
      const { url, mime_type } = await metaRes.json();
      const u = new URL(url);
      const binRes = await fetch(`${base}${u.pathname}${u.search}`, { headers });
      if (!binRes.ok) {
        logError("WhatsApp media", describeWhatsAppError(binRes.status, await binRes.text(), w.provider), "download");
        return null;
      }
      const buf = Buffer.from(await binRes.arrayBuffer());
      return `data:${mime_type || "image/jpeg"};base64,${buf.toString("base64")}`;
    }
    // Meta Cloud API (direct)
    const headers = { Authorization: `Bearer ${w.token}` };
    const metaRes = await fetch(`${GRAPH}/${w.apiVersion}/${mediaId}`, { headers });
    if (!metaRes.ok) {
      logError("WhatsApp media", describeWhatsAppError(metaRes.status, await metaRes.text(), w.provider), "resolve URL");
      return null;
    }
    const { url, mime_type } = await metaRes.json();
    const binRes = await fetch(url, { headers });
    if (!binRes.ok) {
      logError("WhatsApp media", describeWhatsAppError(binRes.status, await binRes.text(), w.provider), "download");
      return null;
    }
    const buf = Buffer.from(await binRes.arrayBuffer());
    return `data:${mime_type || "image/jpeg"};base64,${buf.toString("base64")}`;
  } catch (e) {
    logError("WhatsApp media", `could not download image: ${e?.message}`);
    return null;
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

// A Telegram-bot-shaped object the shared flows (and the scheduler) can call.
// Each call becomes a WhatsApp Graph API request to the given chat (phone
// number). Exported so the scheduler can push proactive messages to WA users.
export function whatsappBot() {
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
      // Not used on WhatsApp: inbound images are pre-resolved to a data URL in
      // onInbound() and passed via msg.__imageDataUrl (see utils.photoDataUrl).
      return null;
    },
    async setMyCommands() {},
    on() {},
  };
}

// Canonical form for a WhatsApp sender's number: digits only, no '+', no
// spaces, no leading zeros. Meta's Cloud API already sends this shape, but
// 360dialog has been observed to occasionally include a '+' prefix. We
// normalise here so the same physical user always maps to the same identity
// (and the same in-memory session key) regardless of formatting.
function normalizePhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits.replace(/^0+/, "");
}

async function onInbound(value) {
  const messages = value?.messages;
  if (!messages || !messages.length) return; // status callbacks etc.
  const bot = whatsappBot();

  for (const m of messages) {
    const from = normalizePhone(m.from); // canonical E.164 digits
    if (m.type === "interactive") {
      const reply = m.interactive?.button_reply || m.interactive?.list_reply;
      if (!reply) continue;
      await handleCallback(bot, {
        id: m.id,
        data: reply.id,
        message: { chat: { id: from } },
        from: { id: from },
        __source: "whatsapp",
      }).catch((e) => {
        logError("WhatsApp inbound (button)", e?.message);
        return replyOnError(bot, from, e);
      });
    } else {
      // Image messages feed the food/lab vision coaches. Resolve the media to a
      // base64 data URL up front; the caption (if any) becomes the message text.
      const imageDataUrl = m.type === "image" && m.image?.id ? await fetchMediaDataUrl(m.image.id) : null;
      const text = m.text?.body ?? m.button?.text ?? m.image?.caption ?? "";
      await handleMessage(bot, {
        chat: { id: from },
        from: { id: from },
        text,
        __imageDataUrl: imageDataUrl,
        __source: "whatsapp",
      }).catch((e) => {
        logError("WhatsApp inbound (message)", e?.message);
        return replyOnError(bot, from, e);
      });
    }
  }
}

export function startWhatsApp() {
  if (!config.whatsapp.enabled) {
    console.log(
      "   WhatsApp adapter: dormant (set D360_API_KEY for 360dialog, or WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID for Meta)."
    );
    return;
  }
  const { port, verifyToken, provider } = config.whatsapp;

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
              onInbound(change.value).catch((e) => logError("WhatsApp inbound", e?.message));
            }
          }
        } catch (e) {
          logError("WhatsApp webhook", `could not parse inbound payload: ${e?.message}`);
        }
      });
      return;
    }

    res.writeHead(404);
    res.end("not found");
  });

  server.on("error", (e) => {
    if (e?.code === "EADDRINUSE")
      logError("WhatsApp adapter", `port ${port} is already in use — set WHATSAPP_PORT to a free port.`);
    else logError("WhatsApp adapter", `webhook server error: ${e?.message}`);
  });

  server.listen(port, () => {
    console.log(`   WhatsApp adapter (${provider}) on http://localhost:${port}/whatsapp/webhook`);
  });
}
