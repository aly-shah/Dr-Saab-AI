import { q } from "@/lib/db";
import { isAuthed } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!isAuthed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  try {
    const [user, kb, glucose, messages, meds, health] = await Promise.all([
      q(`select * from users where id=$1`, [id]),
      q(`select content, message_count, last_seen, updated_at from patient_kb where user_id=$1`, [id]),
      q(`select value_mgdl, context, created_at from glucose_logs
         where user_id=$1 order by created_at desc limit 30`, [id]),
      q(`select kind, role, content, created_at from coach_messages
         where user_id=$1 order by created_at desc limit 40`, [id]),
      q(`select name, dose, created_at from medication_logs
         where user_id=$1 order by created_at desc limit 10`, [id]),
      q(`select weight_kg, steps, mood, sleep_hours, water_glasses, created_at from health_logs
         where user_id=$1 order by created_at desc limit 10`, [id]),
    ]);

    if (!user[0]) return Response.json({ error: "not found" }, { status: 404 });

    return Response.json({
      user: user[0],
      kb: kb[0] || null,
      glucose: glucose.reverse(), // chronological for the chart
      messages,
      meds,
      health,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
