-- ============================================================
-- DrSaab AI — Postgres / Supabase schema (MVP)
-- Local Postgres:   psql "$DATABASE_URL" -f db/schema.sql
-- Supabase:         paste into the SQL Editor and run.
-- gen_random_uuid() is built into Postgres 13+ core (no extension needed).
-- ============================================================

-- ---------- Users ----------
create table if not exists public.users (
  id              uuid primary key default gen_random_uuid(),
  telegram_id     bigint unique not null,
  name            text,
  age             int,
  gender          text,
  city            text,
  language        text default 'en',           -- 'en' | 'ur' | 'roman_ur'
  height_cm       numeric,
  weight_kg       numeric,
  diabetes_status text,                          -- type1 | type2 | prediabetes | gestational | atrisk | notsure
  goals           text,
  medications     text,
  doctor_code     text,
  challenge_code  text,
  team_code       text,
  tier            text default 'free',           -- 'free' | 'consistency' | 'executive' (legacy: 'consistency_builder')
  streak          int  default 0,
  last_log_date   date,
  onboarded       boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ---------- Glucose logs ----------
create table if not exists public.glucose_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  value_mgdl  numeric not null,
  context     text default 'random',             -- fasting | pre_meal | post_meal | bedtime | random
  note        text,
  created_at  timestamptz default now()
);
create index if not exists glucose_logs_user_idx on public.glucose_logs(user_id, created_at desc);

-- ---------- Medication logs ----------
create table if not exists public.medication_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  name        text not null,
  dose        text,
  taken       boolean default true,
  created_at  timestamptz default now()
);
create index if not exists medication_logs_user_idx on public.medication_logs(user_id, created_at desc);

-- ---------- Daily health check-ins ----------
create table if not exists public.health_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.users(id) on delete cascade,
  weight_kg     numeric,
  steps         int,
  mood          text,
  sleep_hours   numeric,
  water_glasses int,
  note          text,
  created_at    timestamptz default now()
);
create index if not exists health_logs_user_idx on public.health_logs(user_id, created_at desc);

-- ---------- Lab reports ----------
create table if not exists public.lab_reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  raw_input   text,
  analysis    text,
  created_at  timestamptz default now()
);
create index if not exists lab_reports_user_idx on public.lab_reports(user_id, created_at desc);

-- ---------- Coach message history (optional, for context/audit) ----------
create table if not exists public.coach_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  kind        text,                               -- coach | food | fitness
  role        text,                               -- user | assistant
  content     text,
  created_at  timestamptz default now()
);
create index if not exists coach_messages_user_idx on public.coach_messages(user_id, created_at desc);

-- ---------- Per-patient knowledge base (built from structured data, no AI) ----------
create table if not exists public.patient_kb (
  user_id       uuid primary key references public.users(id) on delete cascade,
  content       text,
  message_count int default 0,
  last_seen     timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ---------- Doctors / referral codes (created in the admin dashboard) ----------
create table if not exists public.doctors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text unique not null,
  created_at  timestamptz default now()
);

-- ---------- Columns added over time (safe to re-run) ----------
alter table public.users add column if not exists source            text default 'telegram';
alter table public.users add column if not exists last_reminder_date date;
alter table public.users add column if not exists last_streak_date   date;
alter table public.users add column if not exists last_winback_date  date;
alter table public.users add column if not exists last_summary_date  date;

-- v2 onboarding journey (DrSaab MVP – ENG/URDU/WhatsApp-Urdu)
alter table public.users add column if not exists user_type           text;   -- diabetes | prediabetes | notsure | parent | exploring
alter table public.users add column if not exists date_of_birth       text;   -- free-form (free-text answer)
alter table public.users add column if not exists diagnosis_duration  text;   -- lt1 | 1_5 | 6_10 | gt10 | notsure
alter table public.users add column if not exists latest_hba1c        numeric;
alter table public.users add column if not exists hba1c_date_bucket   text;   -- 1m | 1_3 | 3_6 | gt6
alter table public.users add column if not exists latest_fasting_sugar numeric;
alter table public.users add column if not exists fasting_reading_date text;  -- today | week | month | notremember
alter table public.users add column if not exists latest_random_sugar numeric;
alter table public.users add column if not exists random_reading_date text;
alter table public.users add column if not exists diabetes_meds       jsonb;  -- array of {name+dose+frequency} strings
alter table public.users add column if not exists other_conditions    text;
alter table public.users add column if not exists non_diabetes_meds   jsonb;
alter table public.users add column if not exists monitoring_habit    text;   -- regularly | sometimes | rarely | never
alter table public.users add column if not exists monitoring_device   text;   -- glucometer | cgm | both
alter table public.users add column if not exists primary_goal        text;
alter table public.users add column if not exists primary_challenge   text;
alter table public.users add column if not exists motivation_driver   text;
alter table public.users add column if not exists disclaimer_accepted boolean default false;

-- Per-patient coaching scores (defaults per spec)
alter table public.users add column if not exists consistency_score   int default 50;
alter table public.users add column if not exists motivation_score    int default 50;
alter table public.users add column if not exists risk_score          int default 50;
alter table public.users add column if not exists engagement_score    int default 50;
alter table public.users add column if not exists total_checkins      int default 0;

-- keep updated_at fresh on users
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists users_touch on public.users;
create trigger users_touch before update on public.users
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Feature build (proposal §3.6 / §3.7 / §3.8) — added 2026-06
-- ============================================================

-- ---------- Challenges joined by users (§3.7) ----------
create table if not exists public.user_challenges (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.users(id) on delete cascade,
  challenge_type text not null,            -- a1c|weight|walking|consistency|ramadan|doctor|corporate
  code           text,                     -- doctor / corporate code, if any
  status         text default 'active',    -- active | completed | left
  started_at     timestamptz default now(),
  ended_at       timestamptz
);
create index if not exists user_challenges_user_idx on public.user_challenges(user_id, status);

-- ---------- Executive service requests (§3.8) ----------
create table if not exists public.service_requests (
  id           bigint generated always as identity primary key,
  user_id      uuid references public.users(id) on delete cascade,
  service_type text not null,              -- doctor_review|live_session|progress_review|priority_help|premium_content
  status       text default 'requested',  -- requested | scheduled | done | cancelled
  note         text,
  created_at   timestamptz default now()
);
create index if not exists service_requests_user_idx on public.service_requests(user_id, created_at desc);

-- ---------- Background profile answers (§3.6, ~60 fields, drip-filled) ----------
alter table public.users add column if not exists profile_answers jsonb default '{}'::jsonb;
