import { q } from "@/lib/db";
import { isAuthed } from "@/lib/adminAuth";
import { ensureFeedbackTables } from "@/lib/feedback";

export const dynamic = "force-dynamic";

const SAFE_INLINE = /^(image\/(png|jpe?g|gif|webp|heic|heif)|audio\/[a-z0-9.+-]+|video\/(mp4|webm|ogg)|application\/pdf)$/;

// One feedback attachment (screenshot / voice note / file) as raw bytes, so
// the inbox can use it directly as an <img> / <audio> src or a download link.
// ?download=1 forces a download instead of opening it in the browser.
export async function GET(req) {
  if (!isAuthed(req)) return new Response("unauthorized", { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("id required", { status: 400 });
  try {
    await ensureFeedbackTables();
    const rows = await q(`select mime, filename, kind, data_url from feedback_attachments where id = $1`, [id]);
    const a = rows[0];
    if (!a) return new Response("not found", { status: 404 });

    const m = /^data:([^;,]+)?(;base64)?,/.exec(a.data_url || "");
    if (!m) return new Response("attachment is not stored as a data URL", { status: 500 });
    const payload = a.data_url.slice(m[0].length);
    const bytes = m[2] ? Buffer.from(payload, "base64") : Buffer.from(decodeURIComponent(payload), "utf8");
    const mime = (a.mime || m[1] || "application/octet-stream").toLowerCase();
    const ext = (mime.split("/")[1] || "bin").split(";")[0];
    const name = (a.filename || `feedback-${a.kind}-${id.slice(0, 8)}.${ext}`).replace(/["\r\n]/g, "");
    // Users choose what they upload. Only render types that can't run script
    // inline on the admin origin; anything else (HTML, SVG, …) is a download.
    const safeInline = SAFE_INLINE.test(mime);
    const disposition = safeInline && !url.searchParams.get("download") ? "inline" : "attachment";

    return new Response(bytes, {
      headers: {
        "Content-Type": safeInline ? mime : "application/octet-stream",
        // Chrome's PDF viewer won't load under a sandbox CSP; a PDF can't run
        // script on this origin anyway.
        ...(mime === "application/pdf"
          ? {}
          : { "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self' data:; media-src 'self' data:" }),
        "Content-Length": String(bytes.length),
        "Content-Disposition": `${disposition}; filename="${name}"`,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
