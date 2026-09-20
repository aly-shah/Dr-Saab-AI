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
   `ADMIN_PASSWORD` is the only source of the admin password — there is no
   built-in default. Pass one on the command line, or the script generates a
   random one and prints it at the end. With it unset the panel stays locked
   (`/admin` login returns "not configured") and the bot's admin-promotion
   shortcut is disabled. To change it: edit `ADMIN_PASSWORD` in
   `.env.production` and `bot/.env`, then `pm2 restart drsaab-web drsaab-bot
   --update-env` (or just re-run `ADMIN_PASSWORD='new' ./deploy.sh`).
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

## Troubleshooting

**`nginx -t` passes but `nginx.service` fails to start** ("Job for nginx.service
failed…", then "nginx.service is not active, cannot reload"). The config is
fine — `nginx -t` never binds a port, so this is a runtime conflict. Check who
already owns :80/:443 and what nginx logged:

```bash
sudo ss -ltnp | grep -E ':(80|443)[[:space:]]'
sudo journalctl -xeu nginx --no-pager -n 30
sudo tail -n 20 /var/log/nginx/error.log
```

- `bind() to 0.0.0.0:80 failed (98: Address already in use)` with **apache2**
  listening: `sudo systemctl disable --now apache2`, then re-run `./deploy.sh`.
- Same error with **nginx** listening: an orphaned master is running outside
  systemd, still serving the *old* config. The pid is in the listener dump
  above; `sudo kill -HUP <pid>` applies the new vhost with zero downtime
  (`nginx -s reload` only works if `/run/nginx.pid` still exists — it often
  doesn't for a hand-started master). Then hand ownership back when quiet:
  `sudo kill -QUIT <pid>; sleep 3; sudo systemctl start nginx && sudo systemctl enable nginx`.
  `deploy.sh` does the reload itself and prints the handoff command.
- First check `sudo readlink /proc/<pid>/root`. If it is not `/`, that nginx is
  in a container publishing :80 on the host — the host nginx can never bind
  those ports, so route this vhost from that container or move DrSaab to another
  port. `deploy.sh` detects this and stops rather than reloading someone else's
  web server.
- `cannot load certificate`: an *unrelated* vhost points at a deleted cert.
  `sudo nginx -T` dumps every loaded config; fix or remove that vhost.

`deploy.sh` prints all of the above and stops when nginx won't start, instead of
continuing into certbot (which would fail for the same reason).

## Notes

- **Secrets** live only in `bot/.env` (gitignored) — never committed.
- The bot uses **long polling** (no inbound webhook needed). To switch to
  webhooks later, set `USE_WEBHOOK=true` + `WEBHOOK_URL` in `bot/.env` and add an
  nginx location for it.
- New users start on the free plan (`DEFAULT_TIER=free`) and upgrade to
  Consistency Coach from the bot. Set `DEFAULT_TIER=consistency` in `bot/.env`
  only on a test box where you want every new user to be premium.
