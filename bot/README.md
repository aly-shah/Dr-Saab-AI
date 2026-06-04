# DrSaab AI — Telegram Bot (MVP)

A multilingual (English / Urdu / Roman Urdu) diabetes self-management & coaching
bot built on **Telegram + Supabase + OpenAI**. Designed to run on a VPS under
**pm2**, using long-polling for the MVP (no domain required) and switchable to
webhooks later.

> WhatsApp Cloud API wasn't available, so this MVP targets **Telegram**. The
> conversation logic (onboarding, tracking, coaches, summaries) is
> platform-agnostic — only `src/index.js` + `src/bot.js` are the Telegram
> adapter, so a WhatsApp adapter can be added later without touching the flows.

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
- **Educational library** — free-tier static tips.
- **Subscription tiers** — Free vs Consistency Builder (premium gating on the
  AI coaches & lab analysis).

> Deferred for later (the "big things"): Admin/Reporting dashboards, full
> Challenge/Team systems & leaderboards, custom rules & notification engines.
> Onboarding already captures the team/challenge/doctor codes for them.

## 1. Prerequisites

- Node.js 18+ (works on 18/20/22 — `ws` is bundled for Node < 22).
- A Telegram bot token from **@BotFather**.
- A **Supabase** project.
- An **OpenAI** API key.

## 2. Database setup

In the Supabase dashboard → **SQL Editor**, paste and run
[`db/schema.sql`](./db/schema.sql). That creates all tables.

## 3. Configure

```bash
cd bot
cp .env.example .env
# edit .env with your TELEGRAM_BOT_TOKEN, OPENAI_API_KEY,
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm install
```

> Use the **service_role** key (Project Settings → API). It's a backend-only
> service, so it bypasses RLS. Keep it secret — never ship it to a client.

`DEFAULT_TIER=consistency_builder` lets you test the premium coaches right away.
Set it to `free` for production.

## 4. Run locally

```bash
npm start
```

Open Telegram, find your bot, send **/start**, and complete onboarding.

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
   ├─ index.js              # entry: Telegram adapter (polling/webhook)
   ├─ bot.js                # message + callback router
   ├─ config.js             # env loading & validation
   ├─ supabase.js           # data access layer
   ├─ openai.js             # coach / lab / summary prompts
   ├─ i18n.js               # en / ur / roman_ur strings
   ├─ keyboards.js          # inline keyboards
   ├─ session.js            # in-memory conversation state
   ├─ utils.js              # safe send, photo→dataURL, helpers
   └─ flows/
      ├─ onboarding.js
      ├─ tracking.js        # glucose / medication / daily check-in
      ├─ coach.js           # AI / food / fitness coaches
      ├─ labreport.js
      ├─ progress.js        # my progress + weekly summary
      └─ education.js
```

## Safety

DrSaab gives general education and lifestyle coaching only. The system prompt
forbids diagnosis/prescription, tells users never to change medication without
their doctor, and escalates red-flag symptoms to professional/emergency care.
It is **not** a medical device.
