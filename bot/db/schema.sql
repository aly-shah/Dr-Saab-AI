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
alter table public.users add column if not exists user_type           text;   -- diabetes | prediabetes | healthier | notsure | parent | exploring
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

-- ============================================================
-- Build 1 menu / profile additions (spec dated 2026-06)
-- ============================================================

-- Profile axis: child (<13), teen (13–17), adult (≥18). Derived from age at
-- onboarding when known. Separate from diabetes type — combined they replace
-- the bundled-label profile in the spec.
alter table public.users add column if not exists age_bracket           text;   -- child | teen | adult
alter table public.users add column if not exists newly_diagnosed       boolean default false;
alter table public.users add column if not exists weekly_activity_goal_days int;

-- ---------- Medications master (one row per medication a user is on) ----------
-- medication_logs stays the per-dose journal (one row per intake). This table
-- captures the standing prescription so we can ask "is this new?" and offer a
-- reminder once, not every time the user logs the same drug.
create table if not exists public.medications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.users(id) on delete cascade,
  name             text not null,
  dose             text,
  frequency        text,                    -- once_daily | morning_evening | three_times | other
  reminder_enabled boolean default false,
  active           boolean default true,
  created_at       timestamptz default now()
);
create index if not exists medications_user_idx on public.medications(user_id, active);

-- ---------- Symptoms log ----------
create table if not exists public.symptom_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  symptoms    text not null,
  created_at  timestamptz default now()
);
create index if not exists symptom_logs_user_idx on public.symptom_logs(user_id, created_at desc);

-- ---------- Reminder schedules (user-driven, opt-in) ----------
-- One row per active reminder. The scheduler fires when now ≥ next_fire_at
-- (cheap interval poll), then bumps next_fire_at by `frequency_days`.
create table if not exists public.reminder_schedules (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.users(id) on delete cascade,
  category        text not null,            -- glucose | medication | weight | activity | lab | doctor
  target_id       uuid,                     -- e.g. medication id, when relevant
  label           text,                     -- short user-facing label
  time_of_day     text,                     -- 'HH:MM' (local; PKT)
  frequency_days  int default 1,            -- 1 = daily, 7 = weekly, 30 = monthly
  active          boolean default true,
  next_fire_at    timestamptz,
  last_fired_at   timestamptz,
  created_at      timestamptz default now()
);
create index if not exists reminder_schedules_active_idx on public.reminder_schedules(active, next_fire_at);
create index if not exists reminder_schedules_user_idx   on public.reminder_schedules(user_id, active);

-- ============================================================
-- Check-In v2 additions (2026-07)
-- ============================================================

-- Blood sugar unit + measurement label (Fasting / Random / HbA1c).
-- Values are always stored in mg/dL for consistency; unit records what
-- the user originally entered so the display layer can echo it back.
alter table public.glucose_logs add column if not exists unit          text default 'mg_dl';   -- mg_dl | mmol_l | hba1c
alter table public.glucose_logs add column if not exists measure_kind  text;                   -- fasting | random | hba1c | pre_meal | post_meal | bedtime

-- Insulin fields on the medications master (optional; text-entry flow only)
alter table public.medications add column if not exists units          text;   -- e.g. "20"
alter table public.medications add column if not exists is_insulin     boolean default false;
alter table public.medications add column if not exists preferred_time text;   -- HH:MM or free-text (e.g. "before breakfast")

-- Wellbeing check-ins (replaces "Symptoms" from a UX standpoint)
create table if not exists public.wellbeing_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  score       int not null,                                -- 1..5 (1=Poor, 5=Great)
  label       text,                                        -- great|good|okay|notgreat|poor
  note        text,                                        -- optional free-text follow-up
  category    text,                                        -- physical|emotional|diabetes|medication|sleep|lifestyle|urgent|unclassified
  created_at  timestamptz default now()
);
create index if not exists wellbeing_logs_user_idx on public.wellbeing_logs(user_id, created_at desc);

-- Medication Consistency Program state (one row per user, opt-in)
create table if not exists public.med_consistency (
  user_id           uuid primary key references public.users(id) on delete cascade,
  enrolled          boolean default true,
  phase             int default 1,                         -- 1=daily 7d, 2=weekly 2w, 3=biweekly
  yes_streak        int default 0,                         -- consecutive 'yes' answers in current phase
  last_asked_at     timestamptz,
  last_answered_at  timestamptz,
  created_at        timestamptz default now()
);

-- Medication Consistency responses (one row per answered check-in)
create table if not exists public.med_consistency_responses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  taken       boolean not null,
  reason      text,                                        -- forgot|busy|side_effects|ran_out|other
  created_at  timestamptz default now()
);
create index if not exists med_consistency_responses_user_idx on public.med_consistency_responses(user_id, created_at desc);

-- Medication Satisfaction survey responses (30-day)
create table if not exists public.med_satisfaction (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  response    text not null,                                -- yes | not_sure | no
  note        text,
  created_at  timestamptz default now()
);
create index if not exists med_satisfaction_user_idx on public.med_satisfaction(user_id, created_at desc);
