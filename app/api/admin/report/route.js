import { q } from "@/lib/db";
import { isAuthed } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Serves the file a patient uploaded for one lab report (report photo or PDF).
// The patient endpoint returns every other column but deliberately leaves
// media_data out — it's megabytes of base64 per row — so the drawer fetches
// each file here, on demand, straight into an <img>/<iframe> src.
export async function GET(req) {
  if (!isAuthed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  try {
    const rows = await q(
      `select media_data, media_type, file_name from lab_reports where id=$1`,
      [id]
    );
    const row = rows[0];
    if (!row?.media_data) return Response.json({ error: "not found" }, { status: 404 });

    // Stored as a self-contained data: URL — split it back into bytes plus
    // the real content type so the browser renders it inline.
    const m = String(row.media_data).match(/^data:([^;,]+);base64,(.*)$/s);
    if (!m) return Response.json({ error: "unreadable" }, { status: 500 });
    const [, mime, b64] = m;

    const headers = {
      "Content-Type": mime,
      "Cache-Control": "private, max-age=3600",
    };
    // ?download=1 saves the original instead of previewing it.
    if (url.searchParams.get("download")) {
      const name = (row.file_name || `report-${id}`).replace(/["\\\r\n]/g, "");
      headers["Content-Disposition"] = `attachment; filename="${name}"`;
    }

    return new Response(Buffer.from(b64, "base64"), { headers });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
