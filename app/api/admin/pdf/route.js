import { isAuthed } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Generates a PDF report through the bot's web API (which owns the data
// layer, the AI client and the pdfkit renderers) and streams it back.
//
//   /api/admin/pdf?kind=patient&userId=…                 Executive Health Snapshot
//   /api/admin/pdf?kind=doctor_weekly&doctorId=…         Weekly Patient Snapshots (all patients)
//   /api/admin/pdf?kind=doctor_patient&doctorId=…&userId=…  one Patient Health Snapshot
//   add &download=1 to save instead of previewing inline.
const BOT_API_URL = process.env.BOT_API_URL || "http://localhost:8081/web/message";
const REPORT_URL = BOT_API_URL.replace(/\/web\/message\/?$/, "") + "/web/admin/report";

export async function GET(req) {
  if (!isAuthed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") || "";
  const userId = url.searchParams.get("userId") || undefined;
  const doctorId = url.searchParams.get("doctorId") || undefined;
  if (!["patient", "doctor_weekly", "doctor_patient"].includes(kind)) {
    return Response.json({ error: "kind must be patient, doctor_weekly or doctor_patient" }, { status: 400 });
  }
  const password = process.env.ADMIN_PASSWORD?.trim() || "";
  if (!password) return Response.json({ error: "ADMIN_PASSWORD is not set" }, { status: 503 });

  let res;
  try {
    res = await fetch(REPORT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ kind, userId, doctorId }),
      // Reports can take ~20 s when the AI writes the summaries.
      signal: AbortSignal.timeout(120_000),
    });
  } catch (e) {
    return Response.json(
      { error: "The DrSaab bot engine is not reachable. Start it with `npm start` in bot/ and try again." },
      { status: 502 }
    );
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return Response.json({ error: data.error || `report failed (${res.status})` }, { status: res.status });
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  const filename = (res.headers.get("x-filename") || "DrSaab-Report.pdf").replace(/["\\\r\n]/g, "");
  const disposition = url.searchParams.get("download") ? "attachment" : "inline";
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(bytes.length),
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
