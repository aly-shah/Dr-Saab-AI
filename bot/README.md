# DrSaab AI — WhatsApp Bot

A multilingual (English / Urdu / Roman Urdu) diabetes self-management & coaching
bot built on the **WhatsApp Cloud API + Supabase + OpenAI**. Designed to run on
a VPS under **pm2**.

> **WhatsApp is the primary channel.** It works with two providers that speak
> the same Cloud API: **360dialog** (BSP — one `D360_API_KEY`, no Facebook app
> needed) or **Meta Cloud API direct** (`WHATSAPP_TOKEN` +
> `WHATSAPP_PHONE_NUMBER_ID`). Inbound goes through the `/whatsapp/webhook`
> server in `src/whatsapp.js`.
>
> **Telegram is an optional fallback** — set `TELEGRAM_BOT_TOKEN` to also run it.
> The conversation logic (onboarding, tracking, coaches, summaries) is fully
> platform-agnostic: `src/bot.js` is shared, and `src/whatsapp.js` / `src/index.js`
> (Telegram) / `src/web.js` (web demo) are just transport adapters over it.

## Features in this MVP

- **Onboarding** — language, name, age, gender, city, height, weight, diabetes
  status, goals, medications + optional doctor / challenge / team codes.
- **Multi-language** — English, Urdu (script), Roman Urdu. AI replies in the
  user's language.
- **Glucose tracking** — `130 fasting`, instant in-range feedback, history.
- **Medication tracking** — `Metformin 500mg`.
- **Daily check-in** — weight, steps, mood, sleep, water.
- **Consistency engine** — daily streaks update on every log.
- **AI Coach / Food Coach / Fitness Coach** — OpenAI-powered; Food & Lab
  coaches accept **photos** (vision).
- **My Progress** — streak, latest weight, recent readings.
- **Weekly Summary** — AI-written summary from the week's data.
- **Explain Lab Report** — paste values or send a photo.
- **Generate Report** (Consistency Coach+) — a premium one-page *Executive
  Health Snapshot* PDF: profile, latest fasting/random/HbA1c, 14-day and
  90-day glucose trend charts with AI summaries, other labs, medicines,
  lifestyle, the DrSaab Health Score and three AI key insights. Missing
  profile data, recent readings or medicines are asked for first. AI copy is
  written by OpenAI when `OPENAI_API_KEY` is set (falls back to the default
  LLM, then to built-in text).
- **Doctor: Patient Reports → PDF snapshots** — *Weekly Patient Snapshots*
  (summary page of all connected patients: latest HbA1c/glucose, 14-day
  trend, check-ins, status, weekly totals, status breakdown, quick notes)
  followed by a *Patient Health Snapshot* page per patient; or a single
  patient's snapshot picked from a list. Rule-based, no AI cost.
- **Educational library** — free-tier static tips.
- **Subscription tiers** — Free vs Consistency Builder (premium gating on the
  AI coaches & lab analysis).

> Deferred for later (the "big things"): Admin/Reporting dashboards, full
> Challenge/Team systems & leaderboards, custom rules & notification engines.
> Onboarding already captures the team/challenge/doctor codes for them.

## 1. Prerequisites

- Node.js 18+ (works on 18/20/22 — `ws` is bundled for Node < 22).
- A **WhatsApp** sender: either a **360dialog** API key, or a **Meta Cloud API**
  token + phone-number id. (Optionally a Telegram bot token from **@BotFather**
  to run the fallback channel too.)
- A **Supabase** project (or any Postgres via `DATABASE_URL`).
- An **OpenAI** or **Groq** API key.

## 2. Database setup

In the Supabase dashboard → **SQL Editor**, paste and run
[`db/schema.sql`](./db/schema.sql). That creates all tables.

## 3. Configure

```bash
cd bot
cp .env.example .env
# edit .env with your WhatsApp creds (D360_API_KEY, or WHATSAPP_TOKEN +
# WHATSAPP_PHONE_NUMBER_ID), your LLM key (GROQ_API_KEY or OPENAI_API_KEY),
# and SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or DATABASE_URL for Postgres).
# Optional: TELEGRAM_BOT_TOKEN to also run the Telegram fallback.
npm install
```

Point your WhatsApp provider's webhook at `https://<your-host>/whatsapp/webhook`
(the bot listens on `WHATSAPP_PORT`, default 8082) and use `WHATSAPP_VERIFY_TOKEN`
for Meta's verification handshake.

> Use the **service_role** key (Project Settings → API). It's a backend-only
> service, so it bypasses RLS. Keep it secret — never ship it to a client.

`DEFAULT_TIER=consistency_builder` lets you test the premium coaches right away.
Set it to `free` for production.

## 4. Run locally

```bash
npm start
```

Message your WhatsApp number (or, if you set `TELEGRAM_BOT_TOKEN`, open Telegram
and find your bot), send **hi** / **/start**, and complete onboarding.

## 5. Deploy on your VPS with pm2

```bash
git clone <your-repo> && cd <repo>/bot
npm install
cp .env.example .env   # fill in production values
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup            # follow the printed command to enable on boot
pm2 logs drsaab-bot    # watch logs
```

Long polling needs **no domain or open port** — perfect for the MVP.

### Optional: switch to webhooks (once you have a domain + HTTPS)

1. Point your domain at the VPS and set up nginx → `http://localhost:8080`.
2. In `.env`: `USE_WEBHOOK=true`, `WEBHOOK_URL=https://your-domain.com`, `PORT=8080`.
3. `pm2 restart drsaab-bot`.

## Commands

- `/start` — begin / restart and show the menu
- `/menu` — open the main menu
- `/cancel` — exit the current action

## Project structure

```
bot/
├─ db/schema.sql            # Supabase tables
├─ ecosystem.config.cjs     # pm2 config
├─ .env.example
└─ src/
   ├─ index.js              # entry: boots channels (WhatsApp + optional Telegram)
   ├─ whatsapp.js           # WhatsApp Cloud API adapter (primary channel)
   ├─ bot.js                # message + callback router (shared by all channels)
   ├─ config.js             # env loading & validation
   ├─ supabase.js           # data access layer
   ├─ openai.js             # coach / lab / summary prompts
   ├─ snapshotData.js       # Generate Report: data assembly + health score
   ├─ snapshotPdf.js        # Generate Report: pdfkit renderer (assets/fonts)
   ├─ doctorReportData.js   # Doctor PDFs: weekly period, statuses, totals
   ├─ doctorReportPdf.js    # Doctor PDFs: summary + per-patient pages
   ├─ i18n.js               # en / ur / roman_ur strings
   ├─ keyboards.js          # inline keyboards
   ├─ session.js            # in-memory conversation state
   ├─ utils.js              # safe send, photo→dataURL, helpers
   └─ flows/
      ├─ onboarding.js
      ├─ tracking.js        # glucose / medication / daily check-in
      ├─ coach.js           # AI / food / fitness coaches
      ├─ labreport.js
      ├─ snapshot.js         # Generate Report flow (asks for missing data)
      ├─ doctorReports.js    # Doctor → Patient Reports → PDF snapshots
      ├─ progress.js        # my progress + weekly summary
      └─ education.js
```

## Safety

DrSaab gives general education and lifestyle coaching only. The system prompt
forbids diagnosis/prescription, tells users never to change medication without
their doctor, and escalates red-flag symptoms to professional/emergency care.
It is **not** a medical device.
