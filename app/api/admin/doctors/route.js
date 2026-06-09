import { q } from "@/lib/db";
import { isAuthed } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// List doctors with their referral counts (case-insensitive code match).
export async function GET(req) {
  if (!isAuthed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const doctors = await q(
      `select d.id, d.name, d.code, d.created_at,
              (select count(*) from users u where lower(u.doctor_code) = lower(d.code)) as referrals
       from doctors d
       order by referrals desc, d.created_at desc`
    );
    return Response.json({ doctors });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// Create a doctor referral code.
export async function POST(req) {
  if (!isAuthed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  let body = {};
  try {
    body = await req.json();
  } catch {}
  const name = (body.name || "").trim();
  const code = (body.code || "").trim();
  if (!name || !code) return Response.json({ error: "name and code required" }, { status: 400 });

  try {
    const rows = await q(`insert into doctors (name, code) values ($1, $2) returning *`, [name, code]);
    return Response.json({ doctor: rows[0] });
  } catch (e) {
    if (String(e.message).includes("duplicate")) {
      return Response.json({ error: "That code already exists" }, { status: 409 });
    }
    return Response.json({ error: e.message }, { status: 500 });
  }
}
