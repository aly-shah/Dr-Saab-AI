import { q } from "@/lib/db";
import { isAuthed } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Columns the patient lists share (Patients page and a doctor's patient list).
const PATIENT_COLS = `
  u.id, u.name, u.age, u.gender, u.city, u.language, u.diabetes_status,
  u.tier, u.streak, u.created_at, u.doctor_linked_date, u.latest_hba1c,
  coalesce(kb.message_count,0) as message_count, kb.last_seen,
  (select round(avg(value_mgdl)) from glucose_logs g
     where g.user_id=u.id and g.created_at >= now() - interval '7 days') as glucose_avg_week`;

// GET            → every doctor (registered through the bot, or a referral
//                  code created here) with their connected-patient count.
// GET ?id=<uuid> → one doctor plus the patients linked to them (My Health →
//                  My Doctor), newest activity first.
export async function GET(req) {
  if (!isAuthed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  try {
    if (id) {
      const [doctor] = await q(
        `select d.id, d.name, d.email, d.specialization, d.practice_location, d.referral_code,
                d.is_patient, d.created_at, d.last_login, d.user_id,
                u.language, u.tier, u.sub_status, kb.last_seen
           from doctors d
           left join users u on u.id = d.user_id
           left join patient_kb kb on kb.user_id = d.user_id
          where d.id = $1`,
        [id]
      );
      if (!doctor) return Response.json({ error: "not found" }, { status: 404 });
      const patients = await q(
        `select ${PATIENT_COLS}
           from users u left join patient_kb kb on kb.user_id = u.id
          where u.doctor_id = $1 and u.doctor_link_status = 'active'
          order by kb.last_seen desc nulls last, u.name`,
        [id]
      );
      return Response.json({ doctor, patients });
    }
    const doctors = await q(
      `select d.id, d.name, d.email, d.specialization, d.practice_location, d.referral_code,
              d.is_patient, d.created_at, d.last_login, d.user_id,
              u.language, kb.last_seen,
              (select count(*)::int from users p
                 where p.doctor_id = d.id and p.doctor_link_status = 'active') as patients,
              (select count(*)::int from users p
                 where d.referral_code is not null and lower(p.doctor_code) = lower(d.referral_code)) as referrals
         from doctors d
         left join users u on u.id = d.user_id
         left join patient_kb kb on kb.user_id = d.user_id
        order by patients desc, kb.last_seen desc nulls last, d.created_at desc`
    );
    return Response.json({ doctors });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// Create a doctor referral code by hand (no bot account behind it). Patients
// who enter the code under My Health → My Doctor get linked to this row.
export async function POST(req) {
  if (!isAuthed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  let body = {};
  try {
    body = await req.json();
  } catch {}
  const name = (body.name || "").trim();
  const code = (body.code || "").trim().toUpperCase();
  if (!name || !code) return Response.json({ error: "name and code required" }, { status: 400 });
  if (!/^DS#[A-Z0-9]{4}$/.test(code)) {
    return Response.json({ error: "Code must look like DS#AB12 (DS# + 4 letters/digits) — that's the format patients type in the bot" }, { status: 400 });
  }
  try {
    const rows = await q(`insert into doctors (name, referral_code) values ($1, $2) returning *`, [name, code]);
    return Response.json({ doctor: rows[0] });
  } catch (e) {
    if (String(e.message).includes("duplicate")) {
      return Response.json({ error: "That code already exists" }, { status: 409 });
    }
    return Response.json({ error: e.message }, { status: 500 });
  }
}
