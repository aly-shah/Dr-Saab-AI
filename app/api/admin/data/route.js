import { q } from "@/lib/db";
import { isAuthed } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!isAuthed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

  try {
    const [
      totals,
      tiers,
      statuses,
      signups,
      messages,
      glucoseByDay,
      patients,
      leaderboard,
    ] = await Promise.all([
      q(`select
           count(*) filter (where coalesce(u.user_type,'') <> 'doctor')::int                 as total_patients,
           count(*) filter (where onboarded and coalesce(u.user_type,'') <> 'doctor')::int   as onboarded,
           count(*) filter (where coalesce(u.user_type,'') = 'doctor')::int                  as total_doctors,
           coalesce(sum(kb.message_count),0)::int                       as total_messages,
           count(*) filter (where kb.last_seen >= now() - interval '1 day')::int  as active_today,
           count(*) filter (where kb.last_seen >= now() - interval '7 days')::int as active_week
         from users u left join patient_kb kb on kb.user_id = u.id`),
      q(`select tier, count(*)::int as n from users group by tier`),
      q(`select coalesce(diabetes_status,'unknown') as status, count(*)::int as n
         from users where onboarded group by 1 order by 2 desc`),
      q(`select to_char(d::date,'MM-DD') as day, count(u.id)::int as n
         from generate_series(now()::date - interval '13 days', now()::date, interval '1 day') d
         left join users u on u.created_at::date = d::date
         group by d order by d`),
      q(`select to_char(d::date,'MM-DD') as day, count(c.id)::int as n
         from generate_series(now()::date - interval '13 days', now()::date, interval '1 day') d
         left join coach_messages c on c.created_at::date = d::date and c.role='user'
         group by d order by d`),
      q(`select to_char(d::date,'MM-DD') as day, round(avg(g.value_mgdl))::int as avg
         from generate_series(now()::date - interval '13 days', now()::date, interval '1 day') d
         left join glucose_logs g on g.created_at::date = d::date
         group by d order by d`),
      q(`select u.id, u.name, u.age, u.gender, u.city, u.language, u.diabetes_status,
                u.tier, u.streak, u.created_at,
                (select d.name from doctors d where d.id = u.doctor_id and u.doctor_link_status = 'active') as doctor_name,
                coalesce(kb.message_count,0) as message_count, kb.last_seen,
                (select round(avg(value_mgdl)) from glucose_logs g
                   where g.user_id=u.id and g.created_at >= now() - interval '7 days') as glucose_avg_week
         from users u left join patient_kb kb on kb.user_id=u.id
         where u.onboarded and coalesce(u.user_type,'') <> 'doctor'
         order by kb.last_seen desc nulls last
         limit 200`),
      q(`select u.id, u.name, u.city, u.streak,
                coalesce(kb.message_count,0) as messages,
                (select count(*) from glucose_logs g
                   where g.user_id=u.id and g.created_at >= now() - interval '7 days') as readings_week
         from users u left join patient_kb kb on kb.user_id=u.id
         where u.onboarded and coalesce(u.user_type,'') <> 'doctor'
         order by u.streak desc, readings_week desc, messages desc
         limit 10`),
    ]);

    return Response.json({
      totals: totals[0],
      tiers,
      statuses,
      signups,
      messages,
      glucoseByDay,
      patients,
      leaderboard,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
