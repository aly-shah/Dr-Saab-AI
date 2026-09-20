import { q } from "@/lib/db";
import { isAuthed } from "@/lib/adminAuth";
import { ensureFeedbackTables } from "@/lib/feedback";

export const dynamic = "force-dynamic";

const STATUSES = new Set(["new", "read"]);

// Feedback inbox: every "Feedback" submission from the bot, newest first.
// Attachments are listed by id/kind only — the bytes are served one at a time
// by /api/admin/feedback/file so the list stays small.
export async function GET(req) {
  if (!isAuthed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    await ensureFeedbackTables();
    const items = await q(
      `select f.id, f.user_id, f.user_name, f.user_phone, f.user_type, f.source,
              f.message, f.status, f.created_at,
              coalesce(u.name, f.user_name) as name,
              coalesce(
                (select json_agg(json_build_object('id', a.id, 'kind', a.kind, 'mime', a.mime, 'filename', a.filename)
                                 order by a.created_at)
                   from feedback_attachments a where a.feedback_id = f.id),
                '[]') as attachments
         from feedback f
         left join users u on u.id = f.user_id
        order by f.created_at desc
        limit 500`
    );
    return Response.json({ items });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// Mark one item read / unread: { id, status: "read" | "new" }.
export async function PATCH(req) {
  if (!isAuthed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }
  const { id, status } = body || {};
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  if (!STATUSES.has(status)) return Response.json({ error: "status must be new or read" }, { status: 400 });
  try {
    await ensureFeedbackTables();
    const rows = await q(`update feedback set status = $2 where id = $1 returning id, status`, [id, status]);
    if (!rows[0]) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
