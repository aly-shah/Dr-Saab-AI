# Deploying DrSaab AI

One repo, two services on one VPS:

- **drsaab-web** — the Next.js website + `/bot` chat GUI (port **3210**)
- **drsaab-bot** — the Telegram bot + web chat API (port **8321**), talks to PostgreSQL + Groq

Dedicated ports (3210 / 8321) keep it clear of other apps on the server; the
deploy script auto-bumps to the next free port if either is taken, and updates
nginx to match. nginx exposes everything on **https://drsaabcoach.com**.
The website's `/api/bot` route proxies to the bot's web API on localhost.

```
Internet ──▶ nginx (443) ──▶ next (3210) ──/api/bot──▶ bot web API (8321)
                                                          │
                                          Telegram ◀──────┤ (long polling)
                                                          ▼
                                                    PostgreSQL + Groq
```

## One-command deploy

On the server:

```bash
# 1. Point DNS:  drsaabcoach.com  A  ->  <your server IP>   (wait until it resolves)
# 2. Clone into /var/www
sudo mkdir -p /var/www && cd /var/www
git clone https://github.com/aly-shah/Dr-Saab-AI.git
cd Dr-Saab-AI

# 3. Run the installer — DB, env, build, pm2, nginx, and HTTPS all in one go.
#    (use `sudo env` so the variables reliably reach the script)
sudo env TELEGRAM_BOT_TOKEN=8905...  GROQ_API_KEY=gsk_...  \
         ADMIN_PASSWORD='a-strong-password'  SSL_EMAIL=you@example.com  ./deploy.sh

# (optional) also cover www.drsaabcoach.com:
#   sudo env INCLUDE_WWW=1 SSL_EMAIL=you@example.com ./deploy.sh
```

Defaults: domain `drsaabcoach.com`, HTTPS **on** (`SETUP_SSL=1`). If DNS isn't
pointing at the server yet, certbot is skipped with a warning and the site runs
on HTTP — just re-run `./deploy.sh` once DNS resolves to get the cert.

`deploy.sh` is idempotent — re-run anytime to rebuild and restart. If `bot/.env`
already exists it is preserved (and the DB password kept in sync).

What it does:
1. Installs Node 20, PostgreSQL, nginx, pm2 (and certbot for SSL).
2. Creates the `drsaab` role + database and loads `bot/db/schema.sql`.
3. Writes `bot/.env` (prompts for the Telegram + Groq keys if not passed as env vars)
   and `.env.production` (DATABASE_URL + ADMIN_PASSWORD for the website/admin).
4. `npm install` + `npm run build` for the website, `npm install` for the bot.
5. Starts both via `ecosystem.config.cjs` under pm2 and enables boot startup.
6. Configures the nginx vhost for `drsaabcoach.com`, opens the firewall, and
   issues a Let's Encrypt certificate (auto-renewing).

## Day-2 operations

```bash
pm2 status                 # both services
pm2 logs drsaab-bot        # bot logs
pm2 logs drsaab-web        # website logs
pm2 restart all            # after a code change (or re-run ./deploy.sh)
git pull && ./deploy.sh    # update + rebuild + restart
```

## Notes

- **Secrets** live only in `bot/.env` (gitignored) — never committed.
- The bot uses **long polling** (no inbound webhook needed). To switch to
  webhooks later, set `USE_WEBHOOK=true` + `WEBHOOK_URL` in `bot/.env` and add an
  nginx location for it.
- Default new-user tier is `consistency_builder` (premium) so you can test
  everything. Set `DEFAULT_TIER=free` in `bot/.env` for production.
