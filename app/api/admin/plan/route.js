import { q } from "@/lib/db";
import { isAuthed } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Manual plan change from the patient drawer. Writes the same user columns the
// bot's own approval path writes (bot/src/flows/subscription.js), so a plan
// granted here behaves exactly like a paid one: features unlock immediately,
// renewal reminders fire, and the scheduler auto-downgrades it on expiry.
const TIERS = new Set(["free", "consistency", "executive"]);
const MONTHS = new Set([1, 6, 12]);

// Same month arithmetic the bot uses, so "1 month" lands on the same date the
// patient would have got by paying: clamp to the last day of the target month
// rather than rolling over (31 Mar + 1 month = 30 Apr, not 1 May).
function addMonths(date, months) {
  const d = new Date(date.getTime());
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months);
  if (d.getUTCDate() < day) d.setUTCDate(0);
  return d;
}

export async function POST(req) {
  if (!isAuthed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const { id, tier } = body || {};
  // months: 1 | 6 | 12 for a dated plan, null/absent for one that never expires
  // (comped staff and test accounts) — the lifecycle tick skips a null expiry.
  const months = body?.months == null ? null : Number(body.months);

  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  if (!TIERS.has(tier)) return Response.json({ error: "unknown plan" }, { status: 400 });
  if (months !== null && !MONTHS.has(months)) {
    return Response.json({ error: "months must be 1, 6, 12 or empty" }, { status: 400 });
  }

  try {
    const rows = await q(`select id, user_type, sub_plan_code from users where id=$1`, [id]);
    const user = rows[0];
    if (!user) return Response.json({ error: "not found" }, { status: 404 });

    // A doctor on Doctor Pro is gated by sub_plan_code, not by tier. Rewriting
    // the plan code here would silently cancel their Doctor Pro, so leave the
    // subscription columns alone for them and move the patient-side tier only
    // — the same split the bot makes when it activates a doctor_pro plan.
    const onDoctorPro = String(user.sub_plan_code || "").startsWith("doctor_pro");

    let patch;
    if (onDoctorPro) {
      patch = { tier };
    } else if (tier === "free") {
      patch = {
        tier: "free",
        sub_status: "free",
        sub_plan_code: null,
        sub_activated_at: null,
        sub_expires_at: null,
        sub_last_reminder: null,
      };
    } else {
      const now = new Date();
      patch = {
        tier,
        sub_status: "active",
        sub_plan_code: months ? `${tier}_${months}m` : `${tier}_manual`,
        sub_activated_at: now.toISOString(),
        sub_expires_at: months ? addMonths(now, months).toISOString() : null,
        sub_last_reminder: null,
      };
    }

    const cols = Object.keys(patch);
    const set = cols.map((c, i) => `${c} = $${i + 2}`).join(", ");
    const updated = await q(
      `update users set ${set} where id = $1
       returning id, tier, sub_status, sub_plan_code, sub_activated_at, sub_expires_at`,
      [id, ...cols.map((c) => patch[c])],
    );

    return Response.json({ ok: true, user: updated[0], doctorProPreserved: onDoctorPro });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
