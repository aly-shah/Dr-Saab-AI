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
  tier            text default 'free',           -- 'free' | 'consistency_builder'
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
