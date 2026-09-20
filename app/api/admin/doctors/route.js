import { q } from "@/lib/db";
import { isAuthed } from "@/lib/adminAuth";
import { ensureDoctorPlanColumns, DOCTOR_PRO_SQL, DOCTOR_FREE_PATIENT_CAP } from "@/lib/doctorPlan";

export const dynamic = "force-dynamic";

// Columns the patient lists share (Patients page and a doctor's patient list).
const PATIENT_COLS = `
  u.id, u.name, u.age, u.gender, u.city, u.language, u.diabetes_status,
  u.tier, u.streak, u.created_at, u.doctor_linked_date, u.latest_hba1c, u.phone_number,
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
    await ensureDoctorPlanColumns();
    if (id) {
      const [doctor] = await q(
        `select d.id, d.name, d.email, d.specialization, d.practice_location, d.referral_code,
                d.is_patient, d.created_at, d.last_login, d.user_id,
                d.dr_premium, d.dr_premium_at, d.cap_email_sent_at,
                ${DOCTOR_PRO_SQL} as doctor_pro, u.sub_expires_at,
                u.language, u.tier, u.sub_status, u.phone_number, kb.last_seen
           from doctors d
           left join users u on u.id = d.user_id
           left join patient_kb kb on kb.user_id = d.user_id
          where d.id = $1`,
        [id]
      );
      if (!doctor) return Response.json({ error: "not found" }, { status: 404 });
      doctor.premium = !!(doctor.dr_premium || doctor.doctor_pro);
      // in_report: the patient is in the doctor's weekly summary — every one on
      // DrPremium, otherwise the first 10 by link date (same rule as the bot's
      // splitReportablePatients in bot/src/doctorCap.js).
      const patients = await q(
        `select * from (
           select ${PATIENT_COLS},
                  row_number() over (order by coalesce(u.doctor_linked_date, u.created_at) asc nulls first, u.id) as link_rank
             from users u left join patient_kb kb on kb.user_id = u.id
            where u.doctor_id = $1 and u.doctor_link_status = 'active'
         ) p
         order by p.last_seen desc nulls last, p.name`,
        [id]
      );
      for (const p of patients) p.in_report = doctor.premium || Number(p.link_rank) <= DOCTOR_FREE_PATIENT_CAP;
      return Response.json({ doctor, patients, cap: DOCTOR_FREE_PATIENT_CAP });
    }
    const doctors = await q(
      `select d.id, d.name, d.email, d.specialization, d.practice_location, d.referral_code,
              d.is_patient, d.created_at, d.last_login, d.user_id,
              d.dr_premium, ${DOCTOR_PRO_SQL} as doctor_pro,
              u.language, u.phone_number, kb.last_seen,
              (select count(*)::int from users p
                 where p.doctor_id = d.id and p.doctor_link_status = 'active') as patients,
              (select count(*)::int from users p
                 where d.referral_code is not null and lower(p.doctor_code) = lower(d.referral_code)) as referrals
         from doctors d
         left join users u on u.id = d.user_id
         left join patient_kb kb on kb.user_id = d.user_id
        order by patients desc, kb.last_seen desc nulls last, d.created_at desc`
    );
    for (const d of doctors) d.premium = !!(d.dr_premium || d.doctor_pro);
    return Response.json({ doctors, cap: DOCTOR_FREE_PATIENT_CAP });
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

// Switch DrPremium on or off by hand: { id, dr_premium: true | false }.
// On = every linked patient is in the doctor's weekly summary. Paid Doctor Pro
// (on the doctor's bot account) is separate and not touched here.
export async function PATCH(req) {
  if (!isAuthed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  let body = {};
  try {
    body = await req.json();
  } catch {}
  const { id } = body || {};
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  if (typeof body.dr_premium !== "boolean") {
    return Response.json({ error: "dr_premium must be true or false" }, { status: 400 });
  }
  try {
    await ensureDoctorPlanColumns();
    const rows = await q(
      `update doctors
          set dr_premium = $2,
              dr_premium_at = case when $2 then now() else null end
        where id = $1
        returning id, dr_premium, dr_premium_at`,
      [id, body.dr_premium]
    );
    if (!rows[0]) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ doctor: rows[0] });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
