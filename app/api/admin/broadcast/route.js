import { q } from "@/lib/db";
import { isAuthed } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Ad hoc messaging: send one custom message to users from the admin panel.
//
//   GET  /api/admin/broadcast                    → { items: [...] }  last 50 broadcasts
//   POST /api/admin/broadcast { audience, dryRun: true }   → { recipients }
//   POST /api/admin/broadcast { text, audience }           → { recipients, sent, failed, skipped }
//
// The sending itself happens in the bot engine (bot/src/broadcast.js), which
// owns the channel adapters; this route proxies to it with the shared
// ADMIN_PASSWORD, the same way PDF reports are generated.
const BOT_API_URL = process.env.BOT_API_URL || "http://localhost:8081/web/message";
const BROADCAST_URL = BOT_API_URL.replace(/\/web\/message\/?$/, "") + "/web/admin/broadcast";
const AUDIENCES = new Set(["all", "patients", "doctors"]);
const MAX_CHARS = 4000;

export async function GET(req) {
  if (!isAuthed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const items = await q(
      `select id, text, audience, recipients, sent, failed, skipped, sent_by, created_at
       from admin_broadcasts order by created_at desc limit 50`
    );
    return Response.json({ items });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  if (!isAuthed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const audience = AUDIENCES.has(body?.audience) ? body.audience : "all";
  const dryRun = body?.dryRun === true;
  const text = String(body?.text || "").trim();
  if (!dryRun) {
    if (!text) return Response.json({ error: "message text is required" }, { status: 400 });
    if (text.length > MAX_CHARS) {
      return Response.json({ error: `message is longer than ${MAX_CHARS} characters` }, { status: 400 });
    }
  }
  const password = process.env.ADMIN_PASSWORD?.trim() || "";
  if (!password) return Response.json({ error: "ADMIN_PASSWORD is not set" }, { status: 503 });

  let res;
  try {
    res = await fetch(BROADCAST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ text, audience, dryRun, sentBy: "admin panel" }),
      // Sending to a few hundred users one by one can take a while.
      signal: AbortSignal.timeout(600_000),
    });
  } catch {
    return Response.json(
      { error: "The DrSaab bot engine is not reachable. Start it with `npm start` in bot/ and try again." },
      { status: 502 }
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return Response.json({ error: data.error || `broadcast failed (${res.status})` }, { status: res.status });
  return Response.json(data);
}
