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
