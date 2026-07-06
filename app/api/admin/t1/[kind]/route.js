import { q } from "@/lib/db";
import { isAuthed } from "@/lib/adminAuth";
import { kindConfig, coerceRow, selectColumns } from "@/lib/adminT1";

export const dynamic = "force-dynamic";

function guard(req) {
  if (!isAuthed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  return null;
}

export async function GET(req, { params }) {
  const unauth = guard(req);
  if (unauth) return unauth;
  const { kind } = await params;
  const cfg = kindConfig(kind);
  if (!cfg) return Response.json({ error: "unknown kind" }, { status: 404 });

  const cols = selectColumns(kind).join(", ");
  const orderBy = kind === "events"
    ? "event_date nulls last, sort_order, id"
    : "sort_order, id";

  try {
    const rows = await q(`select ${cols} from ${cfg.table} order by ${orderBy}`);
    return Response.json({ rows });
  } catch (e) {
    return Response.json({ error: e?.message || "db error" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const unauth = guard(req);
  if (unauth) return unauth;
  const { kind } = await params;
  const cfg = kindConfig(kind);
  if (!cfg) return Response.json({ error: "unknown kind" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { values, error } = coerceRow(kind, body);
  if (error) return Response.json({ error }, { status: 400 });

  const cols = Object.keys(values);
  const vals = cols.map((k) => values[k]);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
  try {
    const rows = await q(
      `insert into ${cfg.table} (${cols.join(", ")}) values (${placeholders}) returning *`,
      vals
    );
    return Response.json({ row: rows[0] });
  } catch (e) {
    return Response.json({ error: e?.message || "db error" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const unauth = guard(req);
  if (unauth) return unauth;
  const { kind } = await params;
  const cfg = kindConfig(kind);
  if (!cfg) return Response.json({ error: "unknown kind" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const id = parseInt(body?.id, 10);
  if (!Number.isFinite(id)) return Response.json({ error: "id required" }, { status: 400 });

  const { values, error } = coerceRow(kind, body, { partial: true });
  if (error) return Response.json({ error }, { status: 400 });

  const cols = Object.keys(values);
  if (!cols.length) return Response.json({ error: "nothing to update" }, { status: 400 });

  const set = cols.map((k, i) => `${k} = $${i + 1}`).join(", ");
  try {
    const rows = await q(
      `update ${cfg.table} set ${set} where id = $${cols.length + 1} returning *`,
      [...cols.map((k) => values[k]), id]
    );
    if (!rows[0]) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ row: rows[0] });
  } catch (e) {
    return Response.json({ error: e?.message || "db error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const unauth = guard(req);
  if (unauth) return unauth;
  const { kind } = await params;
  const cfg = kindConfig(kind);
  if (!cfg) return Response.json({ error: "unknown kind" }, { status: 404 });

  const url = new URL(req.url);
  const id = parseInt(url.searchParams.get("id"), 10);
  if (!Number.isFinite(id)) return Response.json({ error: "id required" }, { status: 400 });

  try {
    await q(`delete from ${cfg.table} where id = $1`, [id]);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e?.message || "db error" }, { status: 500 });
  }
}
