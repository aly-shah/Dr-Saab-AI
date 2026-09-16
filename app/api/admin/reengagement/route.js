import { q } from "@/lib/db";
import { isAuthed } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Re-engagement KPI (Messaging System spec §13): for each of the six prompts,
// how many were sent, delivered, and answered within 60 minutes.
export async function GET(req) {
  if (!isAuthed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const rows = await q(
      `select message_type, cycle,
              count(*)::int                                                    as sent_count,
              count(*) filter (where delivery_status = 'sent')::int            as delivered_count,
              count(*) filter (where user_replied_after_message)::int          as replied_within_60m,
              round(avg(extract(epoch from (replied_at - sent_at)))
                    filter (where user_replied_after_message))::int            as avg_reply_seconds
       from reengagement_log
       group by message_type, cycle
       order by cycle, message_type desc`
    );
    const byBracket = await q(
      `select age_bracket, count(*)::int as sent_count,
              count(*) filter (where user_replied_after_message)::int as replied_within_60m
       from reengagement_log group by age_bracket order by age_bracket`
    );
    return Response.json({ rows, byBracket });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
