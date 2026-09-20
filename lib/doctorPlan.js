import { pool } from "@/lib/db";

// Doctor free plan (bot/src/doctorCap.js): the weekly Doctor Summary Report
// covers a free doctor's first 10 linked patients. DrPremium lifts that — set
// by hand here (doctors.dr_premium) or by a paid Doctor Pro plan on the
// doctor's bot account. Same columns as DOCTOR_CAP_DDL in bot/src/supabase.js
// and bot/db/schema.sql — keep the three in sync.
export const DOCTOR_FREE_PATIENT_CAP = 10;

const DDL = `
  alter table doctors add column if not exists dr_premium        boolean not null default false;
  alter table doctors add column if not exists dr_premium_at     timestamptz;
  alter table doctors add column if not exists cap_email_sent_at timestamptz;
`;

const g = globalThis;

export function ensureDoctorPlanColumns() {
  if (!g.__drsaabDoctorPlanReady) {
    g.__drsaabDoctorPlanReady = pool.query(DDL).catch((e) => {
      g.__drsaabDoctorPlanReady = null;
      throw e;
    });
  }
  return g.__drsaabDoctorPlanReady;
}

// SQL: true when the doctor's bot account (alias `u`) has an active paid
// Doctor Pro plan — mirrors isDoctorPro() in bot/src/flows/subscription.js.
export const DOCTOR_PRO_SQL = `(u.user_type = 'doctor' and u.sub_status = 'active'
  and coalesce(u.sub_plan_code, '') like 'doctor_pro%'
  and (u.sub_expires_at is null or u.sub_expires_at > now()))`;
