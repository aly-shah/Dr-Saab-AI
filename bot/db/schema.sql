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

-- Structured extraction columns added 2026-07 for the "Explain My Report" spec.
-- `metadata`   — report metadata shown to the user (lab, patient, date, doctor…)
-- `lab_values` — array of extracted lab values with status (in_range / borderline / out_of_range)
--                (named `lab_values`, not `values`, because VALUES is a reserved word in Postgres)
-- `lab_source` — silent market-intel snapshot of the source lab (name/branch/address/format)
alter table public.lab_reports add column if not exists metadata   jsonb;
alter table public.lab_reports add column if not exists lab_values jsonb;
alter table public.lab_reports add column if not exists lab_source jsonb;

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
-- Inbound media (e.g. WhatsApp voice notes) stored inline so it shows in the
-- admin Conversation view. media_data is a self-contained data: URL (base64),
-- so no external file storage is required.
alter table public.coach_messages add column if not exists media_type text;   -- 'audio' | null
alter table public.coach_messages add column if not exists media_data text;   -- data:<mime>;base64,... | null

-- ---------- Per-patient knowledge base (built from structured data, no AI) ----------
create table if not exists public.patient_kb (
  user_id       uuid primary key references public.users(id) on delete cascade,
  content       text,
  message_count int default 0,
  last_seen     timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ---------- Doctors / referral codes ----------
-- Row represents a healthcare professional using DrSaab. `user_id` links to
-- the users row that holds their Telegram/WhatsApp identity (a doctor uses
-- the exact same channel as a patient — user_type='doctor' switches the menu).
create table if not exists public.doctors (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.users(id) on delete cascade,
  name              text not null,
  email             text,
  specialization    text,
  practice_location text,
  referral_code     text unique not null,
  is_patient        boolean default false,     -- true if the doctor also uses DrSaab for personal health
  last_login        timestamptz,
  created_at        timestamptz default now()
);
create index if not exists doctors_user_idx on public.doctors(user_id);

-- Backwards-compat: preserve legacy `code` column for any historical rows.
alter table public.doctors add column if not exists user_id           uuid references public.users(id) on delete cascade;
alter table public.doctors add column if not exists email             text;
alter table public.doctors add column if not exists specialization    text;
alter table public.doctors add column if not exists practice_location text;
alter table public.doctors add column if not exists referral_code     text unique;
alter table public.doctors add column if not exists is_patient        boolean default false;
alter table public.doctors add column if not exists last_login        timestamptz;
-- If any legacy row has `code` set but not `referral_code`, mirror it.
-- `code` won't exist on a fresh install — wrap in an existence check so the
-- migration is safe to run against both new and legacy databases.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'doctors' and column_name = 'code'
  ) then
    execute 'update public.doctors set referral_code = code where referral_code is null and code is not null';
  end if;
end $$;

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

-- More → My Account (2026-07 spec). Deactivated users keep all data; any
-- inbound message auto-reactivates them. Closed accounts are terminal from
-- the app's point of view — data is retained per privacy policy but the
-- user has to re-register to use DrSaab again.
alter table public.users add column if not exists account_status text default 'active';
  -- 'active' | 'inactive' | 'closed'
alter table public.users add column if not exists deactivated_at timestamptz;
alter table public.users add column if not exists closed_at      timestamptz;

-- More → Reminders category prefs. Individual reminder_schedules rows still
-- fire independently; these four master toggles gate categories globally so
-- the user can silence a whole area without deleting every schedule.
alter table public.users add column if not exists pref_rem_blood_sugar     boolean default true;
alter table public.users add column if not exists pref_rem_med_consistency boolean default true;
alter table public.users add column if not exists pref_rem_goals           boolean default true;
alter table public.users add column if not exists pref_rem_coaching        boolean default true;

-- Doctor & Referral module (v1.0). A patient links to their doctor by
-- entering a DS#XXXX referral code; the link is opt-in and can be removed.
alter table public.users add column if not exists doctor_id            uuid references public.doctors(id) on delete set null;
alter table public.users add column if not exists doctor_referral_code text;
alter table public.users add column if not exists doctor_link_status   text;   -- 'active' | 'removed'
alter table public.users add column if not exists doctor_linked_date   timestamptz;

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

-- ============================================================
-- My Goals (2026-07) — up to 3 active goals per user with optional
-- motivation and target date. Legacy free-text `users.goals` is kept
-- so old data isn't lost, but new goal management lives here.
-- ============================================================
create table if not exists public.user_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.users(id) on delete cascade,
  title          text not null,                              -- goal statement (short)
  suggestion_key text,                                        -- lower_a1c | lose_weight | walk_more | … | other | custom
  motivation     text,                                        -- optional "why is this important"
  target_date    date,                                        -- optional target date
  target_hint    text,                                        -- original free-text (e.g. "Before Eid") if not a hard date
  status         text default 'active',                       -- active | completed | removed
  review_sent_at timestamptz,                                 -- when the target-date review was sent
  completed_at   timestamptz,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index if not exists user_goals_user_idx    on public.user_goals(user_id, status);
create index if not exists user_goals_review_idx  on public.user_goals(status, target_date, review_sent_at);

drop trigger if exists user_goals_touch on public.user_goals;
create trigger user_goals_touch before update on public.user_goals
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Type 1 Diabetes enhancements (spec dated 2026-07)
-- ============================================================

-- T1 wellbeing: periodic confidence check. Latest answer lives on the user
-- row for cheap gating; every answer is also appended to the log for trend
-- analysis and future AI-driven coaching.
alter table public.users add column if not exists t1_confidence            text;   -- very | mostly | sometimes | help
alter table public.users add column if not exists t1_confidence_updated_at timestamptz;

create table if not exists public.t1_confidence_logs (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.users(id) on delete cascade,
  level      text not null,                                     -- very | mostly | sometimes | help
  created_at timestamptz default now()
);
create index if not exists t1_confidence_logs_user_idx on public.t1_confidence_logs(user_id, created_at desc);

-- ---------- T1 Community content ----------
-- Content in these tables is managed from the Admin Portal (spec 2026-07).
-- The bot reads the active rows in `sort_order` and renders them into the
-- corresponding T1 Community sub-menu.

create table if not exists public.t1_organizations (
  id            bigint generated always as identity primary key,
  name          text not null,
  description   text,
  logo_url      text,
  website       text,
  contact       text,
  facebook_url  text,
  instagram_url text,
  twitter_url   text,
  youtube_url   text,
  sort_order    int default 0,
  active        boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists t1_organizations_sort_idx on public.t1_organizations(active, sort_order);
drop trigger if exists t1_organizations_touch on public.t1_organizations;
create trigger t1_organizations_touch before update on public.t1_organizations
  for each row execute function public.touch_updated_at();

create table if not exists public.t1_articles (
  id          bigint generated always as identity primary key,
  title       text not null,
  summary     text,
  url         text not null,
  source      text,               -- e.g. "Meethi Zindagi", "DAP"
  audience    text,               -- newly_diagnosed | parents | exercise | ramadan | general
  tags        text[],
  sort_order  int default 0,
  active      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists t1_articles_sort_idx on public.t1_articles(active, sort_order);
drop trigger if exists t1_articles_touch on public.t1_articles;
create trigger t1_articles_touch before update on public.t1_articles
  for each row execute function public.touch_updated_at();

create table if not exists public.t1_videos (
  id          bigint generated always as identity primary key,
  title       text not null,
  description text,
  url         text not null,
  source      text,
  audience    text,
  tags        text[],
  sort_order  int default 0,
  active      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists t1_videos_sort_idx on public.t1_videos(active, sort_order);
drop trigger if exists t1_videos_touch on public.t1_videos;
create trigger t1_videos_touch before update on public.t1_videos
  for each row execute function public.touch_updated_at();

create table if not exists public.t1_daily_life_topics (
  id          bigint generated always as identity primary key,
  category    text not null,      -- children_parents | teens_young_adults | adults
  title       text not null,
  pdf_url     text,               -- storage URL of the topic PDF (populated by Admin Portal)
  sort_order  int default 0,
  active      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists t1_daily_life_topics_cat_idx on public.t1_daily_life_topics(active, category, sort_order);
drop trigger if exists t1_daily_life_topics_touch on public.t1_daily_life_topics;
create trigger t1_daily_life_topics_touch before update on public.t1_daily_life_topics
  for each row execute function public.touch_updated_at();

create table if not exists public.t1_events (
  id          bigint generated always as identity primary key,
  description text not null,      -- free-text: name — city — date — URL/contact (spec Build 1)
  event_date  date,               -- optional; used for chronological ordering when set
  url         text,
  sort_order  int default 0,
  active      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists t1_events_date_idx on public.t1_events(active, event_date, sort_order);
drop trigger if exists t1_events_touch on public.t1_events;
create trigger t1_events_touch before update on public.t1_events
  for each row execute function public.touch_updated_at();

-- ---------- Seed initial T1 content ----------
-- Runs only when the table is empty so migrations stay idempotent and the
-- Admin Portal remains the source of truth once operators start editing.

insert into public.t1_organizations (name, description, website, sort_order)
select * from (values
  ('Meethi Zindagi',
   'Patient-led organisation supporting people living with Type 1 diabetes across Pakistan through community, education and advocacy.',
   'https://meethizindagi.com', 10),
  ('The Diabetes Center (TDC)',
   'Karachi-based specialised diabetes centre offering clinical care, patient education and community programs.',
   'https://thediabetescentre.com', 20),
  ('Baqai Institute of Diabetology & Endocrinology (BIDE)',
   'Leading tertiary diabetes and endocrinology institute providing patient care, training and research.',
   'https://bide.edu.pk', 30),
  ('Diabetes Association of Pakistan (DAP)',
   'National diabetes association driving awareness, prevention and education programs across Pakistan.',
   'https://dap.org.pk', 40)
) as v(name, description, website, sort_order)
where not exists (select 1 from public.t1_organizations);

insert into public.t1_articles (title, url, source, audience, sort_order)
select * from (values
  ('Meethi Zindagi — Blogs & Articles',
   'https://meethizindagi.com/blog', 'Meethi Zindagi', 'general', 10),
  ('DAP Diabetes Digest',
   'https://dap.org.pk/diabetes-digest', 'DAP', 'general', 20)
) as v(title, url, source, audience, sort_order)
where not exists (select 1 from public.t1_articles);

insert into public.t1_videos (title, url, source, audience, sort_order)
select * from (values
  ('Type 1 Diabetes Pakistan — Educational Videos',
   'https://www.youtube.com/@Type1DiabetesPakistan',
   'Type 1 Diabetes Pakistan', 'general', 10)
) as v(title, url, source, audience, sort_order)
where not exists (select 1 from public.t1_videos);

insert into public.t1_daily_life_topics (category, title, sort_order)
select * from (values
  ('children_parents', 'Starting School with Type 1 Diabetes',      10),
  ('children_parents', 'Talking to Teachers',                        20),
  ('children_parents', 'School Lunch Ideas',                         30),
  ('children_parents', 'Sports Day Preparation',                     40),
  ('children_parents', 'School Trip Checklist',                      50),
  ('children_parents', 'Managing Diabetes During Exams',             60),
  ('teens_young_adults', 'College & University Life',                10),
  ('teens_young_adults', 'Living Away from Home',                    20),
  ('teens_young_adults', 'Exercise & Sports',                        30),
  ('teens_young_adults', 'Driving with Type 1 Diabetes',             40),
  ('teens_young_adults', 'Social Events',                            50),
  ('teens_young_adults', 'Travel Tips',                              60),
  ('adults', 'Managing Diabetes at Work',                            10),
  ('adults', 'Business Travel',                                      20),
  ('adults', 'Exercising Safely',                                    30),
  ('adults', 'Fasting During Ramadan',                               40),
  ('adults', 'Sick Day Guidance',                                    50)
) as v(category, title, sort_order)
where not exists (select 1 from public.t1_daily_life_topics);

-- ============================================================
-- WhatsApp identity (2026-07)
-- ------------------------------------------------------------
-- Historically `telegram_id` (bigint) was used as the single identity column
-- for both Telegram user IDs and WhatsApp phone numbers. That worked but was
-- confusing (misnamed) and left a theoretical collision risk between a
-- Telegram numeric ID and a WhatsApp E.164 number that happen to be equal.
--
-- We now keep two orthogonal identity columns:
--   • telegram_id  — Telegram numeric user id  (nullable for WhatsApp users)
--   • phone_number — E.164 digits-only string  (nullable for Telegram users)
-- Exactly one of the two is set per row. A unique constraint on phone_number
-- keeps repeat-contacts from creating duplicate rows.
-- ============================================================

alter table public.users add column if not exists phone_number text;

-- Backfill: for existing WhatsApp users we previously stored their number in
-- `telegram_id`. Copy it into the new column so the app can find them by
-- phone_number going forward. Idempotent — only fills rows that are still empty.
update public.users
   set phone_number = telegram_id::text
 where coalesce(source, 'telegram') = 'whatsapp'
   and phone_number is null
   and telegram_id is not null;

-- Telegram ID becomes optional (WhatsApp-only rows won't have one).
alter table public.users alter column telegram_id drop not null;

-- Unique-per-non-null phone number, so lookups + upserts by phone are safe.
create unique index if not exists users_phone_number_key
  on public.users (phone_number) where phone_number is not null;

-- ============================================================
-- Engagement Engine — Build 1 (2026-07)
-- ------------------------------------------------------------
-- Rules-based Daily Message Composer. Content lives in `message_blocks`
-- (admin-editable), tuning knobs in `engagement_config`, and every sent
-- message is audited to `daily_message_log` — the composer reads this
-- log to enforce per-block cooldown and the "one system message per user
-- per day" cap (unique on user_id, date).
-- ============================================================

create table if not exists public.message_blocks (
  id             text primary key,           -- spec id, e.g. G-EN-001
  kind           text not null,              -- greeting|reminder_summary|coaching|milestone|inactivity|cta
  language       text not null,              -- english | roman_urdu
  age_brackets   text[] default '{any}',     -- {'50-64','65+'} or {'any'}
  "window"       text,                       -- morning|afternoon|evening|any  (greeting) — quoted: reserved keyword
  engagement     text,                       -- HE|E|LOW|RISK                  (coaching)
  milestone      text,                       -- T7|T21|T40|T66|T90             (milestone)
  trigger_days   int,                        -- 2|4|7|14                       (inactivity)
  reminder_type  text,                       -- generic|medication|glucose|walk (reminder_summary)
  text           text not null,
  cooldown_days  int default 7,              -- per-block-id cooldown
  active         boolean default true,
  sort_order     int default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index if not exists message_blocks_lookup_idx
  on public.message_blocks (kind, language, active);
drop trigger if exists message_blocks_touch on public.message_blocks;
create trigger message_blocks_touch before update on public.message_blocks
  for each row execute function public.touch_updated_at();

-- Key/value tuning for weights + thresholds. Env vars in config.js act as
-- boot-time defaults; rows here override at read time inside engagement.js.
create table if not exists public.engagement_config (
  key         text primary key,
  value_num   numeric not null,
  updated_at  timestamptz default now()
);

-- Audit + cooldown + idempotency for the daily composer. The unique
-- (user_id, date) constraint IS the "max one system message per user per
-- day" rule — a duplicate insert on the same day fails with 23505 and the
-- composer treats that as "already sent, skip".
create table if not exists public.daily_message_log (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.users(id) on delete cascade,
  date              date not null,
  engagement_score  int,
  engagement_level  text,                    -- HE|E|LOW|RISK|INACTIVE
  block_ids         text[] default '{}',
  message           text,
  channel           text,                    -- whatsapp | telegram
  sent_at           timestamptz default now()
);
create unique index if not exists daily_message_log_user_date_key
  on public.daily_message_log (user_id, date);
create index if not exists daily_message_log_user_recent_idx
  on public.daily_message_log (user_id, sent_at desc);

-- ---------- Seed default engagement_config ----------
insert into public.engagement_config (key, value_num) values
  ('w_glucose',              3),
  ('w_medication',           2),
  ('w_checkin',              4),
  ('w_coach',                2),
  ('w_in_range',             1),
  ('w_last_seen_recent',     5),
  ('level_he_min',          75),
  ('level_e_min',           55),
  ('level_low_min',         35),
  ('inactivity_exit_days',  14),
  ('block_cooldown_days',    7)
on conflict (key) do nothing;

-- ---------- Seed message_blocks (spec §15.1–15.7) ----------
-- Runs only on first migration; once populated the Admin Portal owns edits.
insert into public.message_blocks
  (id, kind, language, age_brackets, "window", engagement, milestone, trigger_days, reminder_type, text, cooldown_days, sort_order)
select * from (values
  -- 15.1 Greeting — English
  ('G-EN-001','greeting','english',array['any'],'morning'  ,null,null,null,null,'Good morning{first_name_optional}, quick health check-in for today.',3,10),
  ('G-EN-002','greeting','english',array['any'],'afternoon',null,null,null,null,'Quick afternoon check-in{first_name_optional}.',3,20),
  ('G-EN-003','greeting','english',array['any'],'evening'  ,null,null,null,null,'Evening check-in{first_name_optional}.',3,30),
  ('G-EN-004','greeting','english',array['50-64','65+'],'morning',null,null,null,null,'Assalam o Alaikum{first_name_optional}. Hope your day has started well.',3,40),
  ('G-EN-005','greeting','english',array['16-19','20-34'],'any',null,null,null,null,'Salaam{first_name_optional}, tiny health update time.',3,50),
  -- 15.2 Greeting — Roman Urdu
  ('G-RU-001','greeting','roman_urdu',array['any'],'morning'  ,null,null,null,null,'Good morning{first_name_optional}, aaj ka quick health check-in.',3,10),
  ('G-RU-002','greeting','roman_urdu',array['any'],'afternoon',null,null,null,null,'Salaam{first_name_optional}, afternoon ka chota sa check-in.',3,20),
  ('G-RU-003','greeting','roman_urdu',array['any'],'evening'  ,null,null,null,null,'Shaam ka check-in{first_name_optional}.',3,30),
  ('G-RU-004','greeting','roman_urdu',array['50-64','65+'],'morning',null,null,null,null,'Assalam o Alaikum{first_name_optional}. Umeed hai aap theek hain.',3,40),
  ('G-RU-005','greeting','roman_urdu',array['16-19','20-34'],'any',null,null,null,null,'Salaam{first_name_optional}, 1 min ka health scene kar lein.',3,50),
  -- 15.3 Reminder summary — English
  ('R-EN-001','reminder_summary','english',array['any'],null,null,null,null,'generic'   ,'For today: {due_reminders}.',3,10),
  ('R-EN-002','reminder_summary','english',array['any'],null,null,null,null,'medication','Please remember your {medication_name} at {reminder_time}.',3,20),
  ('R-EN-003','reminder_summary','english',array['any'],null,null,null,null,'glucose'   ,'If today is a sugar-check day, send me your reading when convenient.',3,30),
  ('R-EN-004','reminder_summary','english',array['any'],null,null,null,null,'walk'      ,'Try to fit in your walk today, even if it is short.',3,40),
  -- 15.3 Reminder summary — Roman Urdu
  ('R-RU-001','reminder_summary','roman_urdu',array['any'],null,null,null,null,'generic'   ,'Aaj ke liye: {due_reminders}.',3,10),
  ('R-RU-002','reminder_summary','roman_urdu',array['any'],null,null,null,null,'medication','Apni {medication_name} {reminder_time} par yaad se lein.',3,20),
  ('R-RU-003','reminder_summary','roman_urdu',array['any'],null,null,null,null,'glucose'   ,'Agar aaj sugar check ka din hai, reading bhej dein jab easy ho.',3,30),
  ('R-RU-004','reminder_summary','roman_urdu',array['any'],null,null,null,null,'walk'      ,'Aaj walk fit karne ki koshish karein, choti walk bhi chalegi.',3,40),
  -- 15.4 Coaching — English
  ('C-EN-HE-001'  ,'coaching','english',array['any']         ,null,'HE'  ,null,null,null,'You are already showing consistency. Today, just keep the rhythm going.',7,10),
  ('C-EN-E-001'   ,'coaching','english',array['any']         ,null,'E'   ,null,null,null,'You are building the right routine. Small daily actions matter more than perfect days.',7,20),
  ('C-EN-LOW-001' ,'coaching','english',array['any']         ,null,'LOW' ,null,null,null,'A quick update today will help me understand where you are and guide you better.',7,30),
  ('C-EN-RISK-001','coaching','english',array['16-19','20-34'],null,'RISK',null,null,null,'You have not disappeared, right? Send one small update and we are back on track.',7,40),
  ('C-EN-RISK-002','coaching','english',array['50-64','65+'] ,null,'RISK',null,null,null,'Whenever you feel ready, send me one small update. We can restart gently.',7,50),
  -- 15.4 Coaching — Roman Urdu
  ('C-RU-HE-001'  ,'coaching','roman_urdu',array['any']         ,null,'HE'  ,null,null,null,'Aap consistency dikha rahe hain. Aaj bas rhythm maintain rakhni hai.',7,10),
  ('C-RU-E-001'   ,'coaching','roman_urdu',array['any']         ,null,'E'   ,null,null,null,'Routine ban rahi hai. Perfect din zaroori nahi, consistency zaroori hai.',7,20),
  ('C-RU-LOW-001' ,'coaching','roman_urdu',array['any']         ,null,'LOW' ,null,null,null,'Aaj ek quick update bhej dein, mujhe aapki progress samajhne mein help milegi.',7,30),
  ('C-RU-RISK-001','coaching','roman_urdu',array['16-19','20-34'],null,'RISK',null,null,null,'Ghost to nahi kar diya DrSaab ko? Ek choti update bhej dein, phir track pe.',7,40),
  ('C-RU-RISK-002','coaching','roman_urdu',array['50-64','65+'] ,null,'RISK',null,null,null,'Jab aap araam se ready hon, ek choti update bhej dein. Hum gently restart kar lenge.',7,50),
  -- 15.5 Milestone — English
  ('M-EN-T7' ,'milestone','english',array['any'],null,null,'T7' ,null,null,'One week complete. The win is not perfection; the win is staying connected to your health.',9999,10),
  ('M-EN-T21','milestone','english',array['any'],null,null,'T21',null,null,'21 days in. This is your first real consistency checkpoint. You have taken {days_active_21d} active steps so far.',9999,20),
  ('M-EN-T40','milestone','english',array['any'],null,null,'T40',null,null,'40 days in. This is where effort starts becoming identity: someone who takes diabetes seriously.',9999,30),
  ('M-EN-T66','milestone','english',array['any'],null,null,'T66',null,null,'66 days today. For many people, routines begin feeling more natural around this stage. Keep it steady.',9999,40),
  ('M-EN-T90','milestone','english',array['any'],null,null,'T90',null,null,'90 days complete. You have finished your first DrSaab coaching cycle. Next step: keep the habits, sharpen the plan.',9999,50),
  -- 15.5 Milestone — Roman Urdu
  ('M-RU-T7' ,'milestone','roman_urdu',array['any'],null,null,'T7' ,null,null,'1 hafta complete. Perfection nahi chahiye, health se connected rehna hi win hai.',9999,10),
  ('M-RU-T21','milestone','roman_urdu',array['any'],null,null,'T21',null,null,'21 din ho gaye. Yeh aapka first real consistency checkpoint hai.',9999,20),
  ('M-RU-T40','milestone','roman_urdu',array['any'],null,null,'T40',null,null,'40 din ho gaye. Ab effort identity ban sakti hai: woh banda jo diabetes ko seriously manage karta hai.',9999,30),
  ('M-RU-T66','milestone','roman_urdu',array['any'],null,null,'T66',null,null,'Aaj 66 din. Bohat logon ke liye is stage par routine natural feel hona start hota hai. Steady rakhte hain.',9999,40),
  ('M-RU-T90','milestone','roman_urdu',array['any'],null,null,'T90',null,null,'90 din complete. Pehla DrSaab coaching cycle done. Ab habits ko maintain aur plan ko sharpen karna hai.',9999,50),
  -- 15.6 Inactivity — English
  ('I-EN-D2' ,'inactivity','english',array['any']         ,null,null,null, 2,null,'Just checking in. One small update is enough.',5,10),
  ('I-EN-D4' ,'inactivity','english',array['any']         ,null,null,null, 4,null,'Haven''t heard from you in a few days. Send me a quick update when you can.',5,20),
  ('I-EN-D7' ,'inactivity','english',array['16-19','20-34'],null,null,null, 7,null,'A full week? DrSaab is starting to feel ignored. Come back with one update.',5,30),
  ('I-EN-D7B','inactivity','english',array['50-64','65+'] ,null,null,null, 7,null,'It has been a few days. Whenever convenient, send me one update so we can continue.',5,40),
  ('I-EN-D14','inactivity','english',array['any']         ,null,null,null,14,null,'Last gentle reminder for now. Your health journey is still here whenever you are ready.',30,50),
  -- 15.6 Inactivity — Roman Urdu
  ('I-RU-D2' ,'inactivity','roman_urdu',array['any']         ,null,null,null, 2,null,'Bas check-in kar raha hoon. Ek choti update bhi enough hai.',5,10),
  ('I-RU-D4' ,'inactivity','roman_urdu',array['any']         ,null,null,null, 4,null,'Kuch din se update nahi aayi. Jab ho sake quick update bhej dein.',5,20),
  ('I-RU-D7' ,'inactivity','roman_urdu',array['16-19','20-34'],null,null,null, 7,null,'Pura hafta? DrSaab ko ignore karna allowed hai kya? Ek update bhej dein.',5,30),
  ('I-RU-D7B','inactivity','roman_urdu',array['50-64','65+'] ,null,null,null, 7,null,'Kuch din ho gaye. Jab convenient ho, ek update bhej dein taake hum continue kar saken.',5,40),
  ('I-RU-D14','inactivity','roman_urdu',array['any']         ,null,null,null,14,null,'Filhal last gentle reminder. Aapki health journey yahin hai jab aap ready hon.',30,50),
  -- 15.7 CTA — English
  ('CTA-EN-001','cta','english',array['any'],null,null,null,null,null,'Reply with your update when ready.',3,10),
  ('CTA-EN-002','cta','english',array['any'],null,null,null,null,null,'Send me one reading, meal, medicine update, or question.',3,20),
  ('CTA-EN-003','cta','english',array['any'],null,null,null,null,null,'Small update. Big difference over time.',3,30),
  -- 15.7 CTA — Roman Urdu
  ('CTA-RU-001','cta','roman_urdu',array['any'],null,null,null,null,null,'Ready hon to update bhej dein.',3,10),
  ('CTA-RU-002','cta','roman_urdu',array['any'],null,null,null,null,null,'Ek reading, meal, medicine update, ya question bhej dein.',3,20),
  ('CTA-RU-003','cta','roman_urdu',array['any'],null,null,null,null,null,'Choti update. Time ke sath bara farq.',3,30)
) as v(id, kind, language, age_brackets, "window", engagement, milestone, trigger_days, reminder_type, text, cooldown_days, sort_order)
where not exists (select 1 from public.message_blocks);

-- ============================================================
-- My Health (spec "Main Menu Revision v2.1", 2026-07)
-- ------------------------------------------------------------
-- "My Health" is the user's canonical, conversational health profile. A
-- one-time 5-question guided setup builds it; afterwards the user simply
-- tells DrSaab what changed in free text and the AI updates the right record.
-- Each user experiences one conversation, but we persist STRUCTURED records
-- (plus the original message, for traceability) across these tables.
-- ============================================================

-- Profile progress tracking lives on the user row so resume is a single read.
--   health_profile_status: not_started | in_progress | completed
--   health_setup_step:     0 = not started, then 1..5 = next unanswered question
--     1 = Health Conditions, 2 = Medications, 3 = Latest Health Numbers,
--     4 = Lifestyle, 5 = Health Goal
alter table public.users add column if not exists health_profile_status text default 'not_started';
alter table public.users add column if not exists health_setup_step     int  default 0;
alter table public.users add column if not exists health_setup_started_at   timestamptz;
alter table public.users add column if not exists health_setup_completed_at timestamptz;

-- ---------- Medical conditions ----------
create table if not exists public.user_conditions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.users(id) on delete cascade,
  condition_name   text not null,             -- normalized, e.g. "Type 2 Diabetes"
  status           text default 'active',     -- active | resolved
  source           text,                      -- text | image | report
  original_message text,                      -- verbatim user message, for traceability
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index if not exists user_conditions_user_idx on public.user_conditions(user_id, status);
drop trigger if exists user_conditions_touch on public.user_conditions;
create trigger user_conditions_touch before update on public.user_conditions
  for each row execute function public.touch_updated_at();

-- ---------- Health medications (My Health master) ----------
-- Reuses the existing `medications` master table (one row per standing med).
-- These columns capture what the My Health conversation extracts.
alter table public.medications add column if not exists generic_name     text;
alter table public.medications add column if not exists source           text;   -- text | image
alter table public.medications add column if not exists original_message text;

-- ---------- Health metrics (longitudinal, never overwritten) ----------
-- Every new reading is a NEW dated row. The latest valid row per metric_type
-- is the "current value" shown in the My Health summary.
create table if not exists public.health_metrics (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.users(id) on delete cascade,
  metric_type      text not null,             -- hba1c | glucose | weight | height | blood_pressure | waist
  value            numeric,                   -- primary value (e.g. weight kg, glucose mg/dL, systolic)
  secondary_value  numeric,                   -- e.g. diastolic for blood_pressure
  unit             text,                      -- %, mg_dl, kg, cm, mmHg
  reading_context  text,                      -- fasting | random | post_meal | null
  measurement_date date,                      -- when the reading was taken (if known)
  source           text,                      -- text | image | report
  original_message text,
  created_at       timestamptz default now()
);
create index if not exists health_metrics_user_idx on public.health_metrics(user_id, metric_type, measurement_date desc, created_at desc);

-- ---------- Lifestyle (one row per user, upserted) ----------
create table if not exists public.user_lifestyle (
  user_id          uuid primary key references public.users(id) on delete cascade,
  smoking_status   text,                      -- smoker | non_smoker | ex_smoker | null
  smoking_quantity text,                      -- free-text, e.g. "8 cigarettes/day"
  activity_level   text,                      -- e.g. "3x/week"
  activity_type    text,                      -- e.g. "gym", "walking"
  original_message text,
  last_updated_at  timestamptz default now()
);

-- ---------- Health goal ----------
-- The single "primary health goal" from My Health lives on the user row
-- (mirrors into users.primary_goal / users.goals so existing AI context and
-- the Goals & Progress feature keep working). A dated history is also kept.
create table if not exists public.user_health_goal (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.users(id) on delete cascade,
  goal         text not null,
  target_value text,
  target_date  date,
  status       text default 'active',         -- active | achieved | replaced
  created_at   timestamptz default now()
);
create index if not exists user_health_goal_user_idx on public.user_health_goal(user_id, status, created_at desc);

-- ============================================================
-- Habit Builder (Better Me → Build a New Habit, spec 2026-07)
-- ------------------------------------------------------------
-- One active habit per user at a time (enforced by the partial unique index
-- below). Lifecycle: setup_pending → daily_cycle → sunday_maintenance_1/2
-- → established/weekly_maintenance, with paused / reminders_disabled /
-- removed side-states. Every scheduled reminder writes a habit_check_ins
-- row; user answers update it in place (unique on user_habit_id, log_date).
-- ============================================================

create table if not exists public.user_habits (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references public.users(id) on delete cascade,
  habit_type             text not null,                       -- move | water | sleep | smoke_free | no_food_after_dinner
  habit_name             text not null,                       -- display name snapshot (matches user's language at creation)
  target_value           numeric,                             -- water: glasses/day; else null
  target_unit            text,                                -- glasses | minutes | none
  target_time            text,                                -- sleep: 'HH:MM' local; else null
  lifecycle_state        text not null default 'setup_pending',
    -- setup_pending | daily_cycle | daily_cycle_extension |
    -- sunday_maintenance_1 | sunday_maintenance_2 | established |
    -- weekly_maintenance | paused | reminders_disabled | removed
  habit_status           text not null default 'active',      -- active | established | paused | inactive | removed
  active_slot            boolean not null default true,       -- gates the one-active-habit rule
  reminder_status        text not null default 'enabled',     -- enabled | paused | disabled
  reminder_frequency     text not null default 'daily',       -- daily | weekly_sunday | manual_only | none
  reminder_schedule_id   uuid,                                -- soft fk into reminder_schedules(id)
  current_cycle_number   int  not null default 1,
  cycle_start_date       date,
  cycle_end_date         date,
  next_check_in_date     date,
  sunday_check_in_number int  not null default 0,
  current_streak         int  not null default 0,
  best_streak            int  not null default 0,
  last_variation         int,                                 -- 1..3 to prevent consecutive-day repeats
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  paused_until           timestamptz,
  established_at         timestamptz,
  removed_at             timestamptz
);
create index if not exists user_habits_user_idx on public.user_habits(user_id, active_slot);
-- One active habit per user. Removed / paused / reminders_disabled rows keep
-- their history but set active_slot=false so another habit can be started.
create unique index if not exists user_habits_one_active_idx
  on public.user_habits(user_id) where active_slot = true;

drop trigger if exists user_habits_touch on public.user_habits;
create trigger user_habits_touch before update on public.user_habits
  for each row execute function public.touch_updated_at();

create table if not exists public.habit_check_ins (
  id                   uuid primary key default gen_random_uuid(),
  user_habit_id        uuid references public.user_habits(id) on delete cascade,
  user_id              uuid references public.users(id) on delete cascade,
  log_date             date not null,                        -- local calendar day the check-in is for
  response_status      text not null default 'no_response',  -- completed | not_completed | no_response | manual_entry
  completed            boolean,
  reminder_sent_at     timestamptz,
  response_received_at timestamptz,
  message_variation_id int,                                   -- 1..3 (which rotating template was used)
  created_at           timestamptz not null default now()
);
create unique index if not exists habit_check_ins_habit_date_key
  on public.habit_check_ins(user_habit_id, log_date);
create index if not exists habit_check_ins_user_idx
  on public.habit_check_ins(user_id, created_at desc);

-- ============================================================
-- 10-Minute Wins (Better Me → 10 Minute Wins, spec 2026-07)
-- ------------------------------------------------------------
-- Lightweight motivation: one small challenge per calendar day. Rotation
-- excludes the previous 5 days' picks; one swap per day is allowed
-- (recorded in-place via replacement_used, since the unique (user_id,
-- challenge_date) key means only one row exists per user per day).
-- Counters on the users row are the source of truth for completion %.
-- ============================================================

alter table public.users add column if not exists wins_completed          int  default 0;
alter table public.users add column if not exists wins_skipped            int  default 0;
alter table public.users add column if not exists last_win_completed_date date;

create table if not exists public.win_challenge_log (
  id                bigint generated always as identity primary key,
  user_id           uuid references public.users(id) on delete cascade,
  challenge_id      text not null,             -- walk | stretch | water | declutter | unplug
  challenge_name    text,                      -- localized title snapshot at pick time
  challenge_date    date not null,
  status            text not null default 'no_response', -- completed | skipped | no_response
  replacement_used  boolean not null default false,
  created_at        timestamptz not null default now()
);
create unique index if not exists win_challenge_log_user_date_key
  on public.win_challenge_log(user_id, challenge_date);
create index if not exists win_challenge_log_user_recent_idx
  on public.win_challenge_log(user_id, challenge_date desc);
