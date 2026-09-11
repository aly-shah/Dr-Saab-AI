#!/usr/bin/env bash
#
# DrSaab AI — one-shot VPS deploy (multi-app server friendly).
# Sets up Node, PostgreSQL, the website + bot, pm2, and nginx for the domain.
# Uses dedicated ports (3210 / 8321) so it won't clash with other apps,
# and auto-bumps to the next free port if those are taken.
#
# Usage (from the cloned repo root):
#   TELEGRAM_BOT_TOKEN=xxx GROQ_API_KEY=xxx ./deploy.sh
#   # add SETUP_SSL=1 SSL_EMAIL=you@example.com to also issue an HTTPS cert
#
# Re-running is safe (idempotent): keeps bot/.env, preserves Certbot SSL.

set -euo pipefail

# ---------- config (override via env) ----------
DOMAIN="${DOMAIN:-drsaabcoach.com}"
DEFAULT_WEB_PORT="${WEB_PORT:-3210}"
DEFAULT_API_PORT="${WEB_API_PORT:-8321}"
DB_NAME="${DB_NAME:-drsaab}"
DB_USER="${DB_USER:-drsaab}"
DEFAULT_TIER="${DEFAULT_TIER:-consistency_builder}"
LLM_MODEL="${LLM_MODEL:-openai/gpt-oss-120b}"
LLM_VISION_MODEL="${LLM_VISION_MODEL:-qwen/qwen3.6-27b}"

# HTTPS via Let's Encrypt — on by default. Needs DNS for $DOMAIN pointing here
# and ports 80/443 open. INCLUDE_WWW=1 also covers www.$DOMAIN.
SETUP_SSL="${SETUP_SSL:-1}"
SSL_EMAIL="${SSL_EMAIL:-admin@${DOMAIN}}"
INCLUDE_WWW="${INCLUDE_WWW:-0}"

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

# Never let apt/dpkg stop on an interactive prompt: this script runs unattended
# and a hidden debconf or "keep your modified config file?" question just looks
# like a hang. Keep existing conffiles, skip the needrestart service picker.
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a
export NEEDRESTART_SUSPEND=1
APT_OPTS=(-y -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold)

log()  { echo -e "\n\033[1;36m==> $*\033[0m"; }
warn() { echo -e "\033[1;33m!  $*\033[0m"; }

SUDO=""
[ "$(id -u)" -ne 0 ] && SUDO="sudo"

# ---------- service control (works with or without systemd) ----------
# Some VPS images (LXC/OpenVZ containers, WSL, minimal Docker bases) ship
# without systemd, so `systemctl` does not exist. Package post-install scripts
# call it anyway and take dpkg down with them:
#   /var/lib/dpkg/info/postgresql-16.postinst: 118: systemctl: not found
#   E: Sub-process /usr/bin/dpkg returned an error code (1)
# Detect that up front, drop in a small systemctl stand-in that maps service
# actions onto sysvinit's `service`, and use the svc_* helpers below.
HAS_SYSTEMD=0
if [ -d /run/systemd/system ] && command -v systemctl >/dev/null 2>&1; then
  HAS_SYSTEMD=1
fi

install_systemctl_shim() {
  # Real systemd ships /usr/bin/systemctl (or /bin/systemctl on older layouts).
  # Check those paths directly rather than `command -v`: the deploying user's
  # PATH is not what dpkg gives maintainer scripts, so "systemctl is found from
  # my shell" says nothing about whether libc6's postinst will find it.
  local real
  for real in /usr/bin/systemctl /bin/systemctl; do
    if [ -x "$real" ] && ! grep -q "Dr-Saab-AI deploy.sh" "$real" 2>/dev/null; then return 0; fi
  done
  warn "systemd not available on this host - installing a systemctl shim so package scripts do not abort dpkg"
  $SUDO tee /usr/local/bin/systemctl >/dev/null <<'SHIM'
#!/bin/sh
# Minimal `systemctl` stand-in for hosts without systemd, installed by
# Dr-Saab-AI deploy.sh. Maps start/stop/restart/reload onto sysvinit
# `service`; unit-management verbs are no-ops. Delete this file if real
# systemd is ever installed.
action="${1:-}"
[ $# -gt 0 ] && shift
now=0
units=""
for arg in "$@"; do
  case "$arg" in
    --now) now=1 ;;
    -*) ;;
    *) units="$units ${arg%.service}" ;;
  esac
done
case "$action" in
  start|stop|restart|reload|force-reload|try-restart|status)
    for u in $units; do service "$u" "$action" >/dev/null 2>&1 || true; done ;;
  enable)
    if [ "$now" -eq 1 ]; then
      for u in $units; do service "$u" start >/dev/null 2>&1 || true; done
    fi ;;
  disable)
    if [ "$now" -eq 1 ]; then
      for u in $units; do service "$u" stop >/dev/null 2>&1 || true; done
    fi ;;
  *) : ;;   # daemon-reload, is-enabled, mask, preset, ... nothing to do
esac
exit 0
SHIM
  $SUDO chmod +x /usr/local/bin/systemctl
  # Maintainer scripts run with whatever PATH dpkg inherited, which does not
  # always include /usr/local/bin (seen as "libc6 postinst: systemctl: not
  # found"). Link the shim where every PATH looks.
  [ -e /usr/bin/systemctl ] || $SUDO ln -s /usr/local/bin/systemctl /usr/bin/systemctl
}

# start (and enable at boot) a service under whichever init this host has
svc_start() {
  if [ "$HAS_SYSTEMD" -eq 1 ]; then
    $SUDO systemctl enable --now "$1"
  else
    $SUDO service "$1" start >/dev/null 2>&1 || warn "could not start $1 via 'service' - continuing"
  fi
}

svc_reload() {
  if [ "$HAS_SYSTEMD" -eq 1 ]; then
    $SUDO systemctl reload "$1"
  else
    $SUDO service "$1" reload >/dev/null 2>&1 || $SUDO service "$1" restart >/dev/null 2>&1 ||       warn "could not reload $1 - reload it manually once it is running"
  fi
}

# set/replace a KEY=VALUE line in an env file
set_env_kv() {
  local f="$1" k="$2" v="$3"
  if [ -f "$f" ] && grep -q "^${k}=" "$f"; then
    sed -i -E "s#^${k}=.*#${k}=${v}#" "$f"
  else
    echo "${k}=${v}" >> "$f"
  fi
}

# apt/dpkg through `sudo env ...` so the noninteractive settings survive the
# sudo environment reset (plain `sudo -E` is refused by some sudoers policies).
NONINT=(DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a NEEDRESTART_SUSPEND=1)
APT()  { $SUDO env "${NONINT[@]}" apt-get "$@"; }
DPKG() { $SUDO env "${NONINT[@]}" dpkg "$@"; }

port_in_use() { ss -ltnH 2>/dev/null | awk '{print $4}' | sed 's/.*://' | grep -qx "$1"; }
find_free()   { local p="$1"; while port_in_use "$p"; do p=$((p+1)); done; echo "$p"; }

# Without systemd, package postinst scripts call a missing `systemctl` and
# abort dpkg - and a package left half-configured by an earlier failed run
# (libc6, typically) breaks EVERY later apt install, including certbot's.
# Install the shim and finish those packages first, on every run, whether or
# not the apt section below is skipped.
if [ "$HAS_SYSTEMD" -eq 0 ]; then
  install_systemctl_shim
  # Output stays visible on purpose - this is where a stuck deploy shows why.
  DPKG --configure -a --force-confdef --force-confold </dev/null     || warn "dpkg --configure -a reported errors - continuing, apt may fix them below"
fi

# ---------- 1. system packages ----------
# SKIP_APT=1 skips this whole section - use it when the packages are already
# installed by hand, or when apt on this host is wedged and you don't want the
# deploy blocked behind it.
if [ "${SKIP_APT:-0}" = "1" ]; then
  warn "SKIP_APT=1 - assuming node, postgresql, nginx and pm2 are already installed"
else
log "Installing system dependencies"
# apt can sit silently for minutes when a mirror stalls - most often a broken
# IPv6 route on a fresh VPS/container image. Cap the wait so it fails fast,
# then retry the same thing over IPv4 only.
APT_NET=(-o Acquire::http::Timeout=20 -o Acquire::https::Timeout=20 -o Acquire::Retries=1)
if ! APT update -y "${APT_NET[@]}"; then
  warn "apt-get update stalled or failed - retrying over IPv4 only"
  APT_NET+=(-o Acquire::ForceIPv4=true)
  APT update -y "${APT_NET[@]}"
fi
APT_OPTS+=("${APT_NET[@]}")

APT install "${APT_OPTS[@]}" curl ca-certificates gnupg openssl git

if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -lt 18 ]; then
  log "Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO ${SUDO:+-E} bash -
  APT install "${APT_OPTS[@]}" nodejs
fi

APT install "${APT_OPTS[@]}" postgresql nginx
fi

command -v pm2 >/dev/null 2>&1 || { log "Installing pm2"; $SUDO npm install -g pm2; }

# Stop any existing drsaab apps first so their ports free up (and we recreate
# them cleanly). Other apps on this server are left untouched.
pm2 delete drsaab-web drsaab-bot >/dev/null 2>&1 || true

# ---------- 2. choose ports (dedicated + conflict-free) ----------
WEB_API_PORT=""
if [ -f bot/.env ] && grep -q '^WEB_API_PORT=' bot/.env; then
  WEB_API_PORT="$(grep '^WEB_API_PORT=' bot/.env | head -1 | cut -d= -f2 | tr -d '[:space:]')"
fi
[ -z "$WEB_API_PORT" ] && WEB_API_PORT="$(find_free "$DEFAULT_API_PORT")"
WEB_PORT="$(find_free "$DEFAULT_WEB_PORT")"

# WhatsApp inbound webhook port (the adapter's HTTP server). nginx proxies
# /whatsapp/webhook to it so 360dialog / Meta can deliver messages over HTTPS.
WHATSAPP_PORT=""
if [ -f bot/.env ] && grep -q '^WHATSAPP_PORT=' bot/.env; then
  WHATSAPP_PORT="$(grep '^WHATSAPP_PORT=' bot/.env | head -1 | cut -d= -f2 | tr -d '[:space:]')"
fi
[ -z "$WHATSAPP_PORT" ] && WHATSAPP_PORT="8082"
log "Using ports — website: ${WEB_PORT}  ·  bot web API: ${WEB_API_PORT}  ·  WhatsApp webhook: ${WHATSAPP_PORT}"

# ---------- 3. PostgreSQL ----------
log "Setting up PostgreSQL ($DB_NAME)"
svc_start postgresql

# The init script is a no-op in some containers - start the cluster directly if
# nothing is listening, then wait for it before issuing any psql commands.
if ! pg_isready -q 2>/dev/null; then
  PG_CLUSTER="$(pg_lsclusters -h 2>/dev/null | awk '$4 != "online" {print $1" "$2; exit}')"
  [ -n "$PG_CLUSTER" ] && $SUDO pg_ctlcluster $PG_CLUSTER start >/dev/null 2>&1 || true
fi
for _ in $(seq 1 30); do
  pg_isready -q 2>/dev/null && break
  sleep 1
done
pg_isready -q 2>/dev/null || { warn "PostgreSQL is not accepting connections - check 'pg_lsclusters' and 'pg_ctlcluster <ver> main start'"; exit 1; }

DB_PASS=""
if [ -f bot/.env ] && grep -q '^DATABASE_URL=' bot/.env; then
  DB_PASS="$(grep '^DATABASE_URL=' bot/.env | head -1 | sed -E 's#.*://[^:]+:([^@]+)@.*#\1#')"
fi
[ -z "$DB_PASS" ] && DB_PASS="$(openssl rand -hex 16)"

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASS}';
  END IF;
END \$\$;
SQL

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
fi

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

log "Loading database schema"
PGPASSWORD="${DB_PASS}" psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" -f bot/db/schema.sql

# ---------- 4. environment ----------
log "Configuring environment"
if [ ! -f bot/.env ]; then
  # WhatsApp is the primary channel. 360dialog needs a single API key; Meta
  # Cloud API needs WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID instead. Telegram
  # is now an optional fallback (leave TELEGRAM_BOT_TOKEN blank to skip it).
  D360="${D360_API_KEY:-}"
  TG="${TELEGRAM_BOT_TOKEN:-}"
  GQ="${GROQ_API_KEY:-}"
  [ -z "$D360" ] && read -rp "360dialog WhatsApp API key (blank if using Meta Cloud API): " D360
  [ -z "$GQ" ] && read -rp "Groq API key: " GQ
  cat > bot/.env <<ENV
# ---- WhatsApp (primary channel) ----
# 360dialog BSP: set D360_API_KEY. Meta Cloud API: set WHATSAPP_TOKEN +
# WHATSAPP_PHONE_NUMBER_ID instead. WHATSAPP_VERIFY_TOKEN guards the webhook.
D360_API_KEY=${D360}
WHATSAPP_TOKEN=${WHATSAPP_TOKEN:-}
WHATSAPP_PHONE_NUMBER_ID=${WHATSAPP_PHONE_NUMBER_ID:-}
WHATSAPP_VERIFY_TOKEN=${WHATSAPP_VERIFY_TOKEN:-drsaab-verify}
WHATSAPP_PORT=${WHATSAPP_PORT:-8082}
# ---- Telegram (optional fallback) ----
TELEGRAM_BOT_TOKEN=${TG}
# ---- LLM + data ----
GROQ_API_KEY=${GQ}
LLM_MODEL=${LLM_MODEL}
LLM_VISION_MODEL=${LLM_VISION_MODEL}
DATABASE_URL=${DATABASE_URL}
DEFAULT_TIER=${DEFAULT_TIER}
USE_WEBHOOK=false
PORT=8080
WEB_API_PORT=${WEB_API_PORT}
ENV
  echo "Created bot/.env"
else
  echo "bot/.env exists — keeping tokens; syncing DB + web API port."
  set_env_kv bot/.env DATABASE_URL "${DATABASE_URL}"
  set_env_kv bot/.env WEB_API_PORT "${WEB_API_PORT}"
  # Groq removed meta-llama/llama-4-scout-17b-16e-instruct from its catalog.
  # Migrate any old .env still pinned to it so image + PDF analyses keep working.
  if grep -q '^LLM_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct$' bot/.env; then
    warn "LLM_VISION_MODEL was set to a deprecated Groq model — migrating to ${LLM_VISION_MODEL}."
    set_env_kv bot/.env LLM_VISION_MODEL "${LLM_VISION_MODEL}"
  fi
  # Groq also retired the Llama chat models. An .env still pinned to one gets a
  # 404 model_not_found on EVERY text call — which surfaced to users as
  # "something is off on our side" on typed questions and PDF/typed reports.
  if grep -qE '^LLM_MODEL=(llama-3\.3-70b-versatile|llama-3\.1-8b-instant|llama3-[0-9]+b-8192|mixtral-8x7b-32768|qwen/qwen3-32b)$' bot/.env; then
    warn "LLM_MODEL was set to a retired Groq model — migrating to ${LLM_MODEL}."
    set_env_kv bot/.env LLM_MODEL "${LLM_MODEL}"
  fi
fi

# Admin password: keep existing, else use provided env, else generate one.
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
if [ -z "$ADMIN_PASSWORD" ] && [ -f .env.production ] && grep -q '^ADMIN_PASSWORD=' .env.production; then
  ADMIN_PASSWORD="$(grep '^ADMIN_PASSWORD=' .env.production | head -1 | cut -d= -f2-)"
fi
[ -z "$ADMIN_PASSWORD" ] && ADMIN_PASSWORD="$(openssl rand -hex 8)"

# The bot promotes admins with this same password, so keep its .env in sync.
set_env_kv bot/.env ADMIN_PASSWORD "${ADMIN_PASSWORD}"

# Website runtime env (read by next start + admin dashboard)
cat > .env.production <<ENV
BOT_API_URL=http://localhost:${WEB_API_PORT}/web/message
DATABASE_URL=${DATABASE_URL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ENV

# ---------- 5. install + build ----------
log "Installing dependencies (website)"
npm install --include=dev
log "Installing dependencies (bot)"
( cd bot && npm install )

log "Building website"
rm -rf .next
npm run build

# ---------- 6. pm2 ----------
log "Starting services with pm2 (web:${WEB_PORT}, api:${WEB_API_PORT})"
WEB_PORT="$WEB_PORT" WEB_API_PORT="$WEB_API_PORT" DATABASE_URL="$DATABASE_URL" ADMIN_PASSWORD="$ADMIN_PASSWORD" pm2 start ecosystem.config.cjs --update-env
pm2 save
if [ "$HAS_SYSTEMD" -eq 1 ]; then
  $SUDO env PATH="$PATH" "$(command -v pm2)" startup systemd -u "$USER" --hp "$HOME" >/dev/null 2>&1 || \
    warn "Could not auto-enable pm2 startup; run what 'pm2 startup' prints, then 'pm2 save'."
else
  warn "No systemd on this host — pm2 will not resurrect on reboot by itself. Run 'pm2 startup', follow its output, then 'pm2 save'."
fi
pm2 save

# ---------- 7. nginx (idempotent, preserves existing SSL) ----------
NGINX_AVAIL=/etc/nginx/sites-available/drsaab.conf
NGINX_ENABLED=/etc/nginx/sites-enabled/drsaab.conf

SERVER_NAMES="${DOMAIN}"
[ "$INCLUDE_WWW" = "1" ] && SERVER_NAMES="${DOMAIN} www.${DOMAIN}"

# Open the firewall for nginx if ufw is active (best-effort).
if command -v ufw >/dev/null 2>&1 && $SUDO ufw status 2>/dev/null | grep -q "Status: active"; then
  $SUDO ufw allow "Nginx Full" >/dev/null 2>&1 || true
fi

if [ -f "$NGINX_AVAIL" ] || [ -f "$NGINX_ENABLED" ]; then
  log "Updating existing nginx vhost -> web ${WEB_PORT} / whatsapp ${WHATSAPP_PORT} (SSL preserved)"
  for f in "$NGINX_AVAIL" "$NGINX_ENABLED"; do
    [ -f "$f" ] || continue
    # Keep the main site proxy pointed at the current web port. Scope the
    # replacement to the bare "location / {" block so it never rewrites the
    # /whatsapp/webhook proxy_pass below.
    $SUDO sed -i -E "/location \/ \{/,/\}/ s#proxy_pass http://127\.0\.0\.1:[0-9]+#proxy_pass http://127.0.0.1:${WEB_PORT}#g" "$f"
    # Make sure the WhatsApp webhook route exists; inject it before the first
    # "location / {" if missing (idempotent).
    if ! grep -q "location /whatsapp/webhook" "$f"; then
      $SUDO sed -i "0,/location \/ {/ s##location /whatsapp/webhook {\n        proxy_pass http://127.0.0.1:${WHATSAPP_PORT};\n        proxy_set_header Host \$host;\n        proxy_set_header X-Real-IP \$remote_addr;\n        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto \$scheme;\n    }\n\n    location / {#" "$f"
    else
      # Already present — keep its port in sync.
      $SUDO sed -i -E "/location \/whatsapp\/webhook \{/,/\}/ s#proxy_pass http://127\.0\.0\.1:[0-9]+#proxy_pass http://127.0.0.1:${WHATSAPP_PORT}#g" "$f"
    fi
  done
else
  log "Creating nginx vhost for ${SERVER_NAMES} -> web ${WEB_PORT} / whatsapp ${WHATSAPP_PORT}"
  $SUDO tee "$NGINX_AVAIL" >/dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_NAMES};

    client_max_body_size 12M;

    # WhatsApp Cloud API inbound webhook -> the bot's adapter (separate process).
    location /whatsapp/webhook {
        proxy_pass http://127.0.0.1:${WHATSAPP_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:${WEB_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX
  $SUDO ln -sf "$NGINX_AVAIL" "$NGINX_ENABLED"
fi
$SUDO nginx -t
svc_start nginx
svc_reload nginx

# ---------- 8. SSL (Let's Encrypt) ----------
SSL_OK=0
if [ "$SETUP_SSL" = "1" ]; then
  log "Issuing HTTPS certificate via certbot for ${SERVER_NAMES}"
  APT install "${APT_OPTS[@]}" certbot python3-certbot-nginx
  CB_ARGS=(--nginx --non-interactive --agree-tos -m "$SSL_EMAIL" --redirect -d "$DOMAIN")
  [ "$INCLUDE_WWW" = "1" ] && CB_ARGS+=(-d "www.${DOMAIN}")
  if $SUDO certbot "${CB_ARGS[@]}"; then
    SSL_OK=1
  else
    warn "certbot failed — likely DNS for ${DOMAIN} isn't pointing here yet, or 80/443 are closed."
    warn "Fix DNS/ports, then re-run:  SETUP_SSL=1 SSL_EMAIL=${SSL_EMAIL} ./deploy.sh"
  fi
fi

SCHEME="http"; [ "$SSL_OK" = "1" ] && SCHEME="https"

log "Deploy complete"
echo "   Website : ${SCHEME}://${DOMAIN}   (-> 127.0.0.1:${WEB_PORT})"
echo "   Chat GUI: ${SCHEME}://${DOMAIN}/bot"
echo "   Admin   : ${SCHEME}://${DOMAIN}/admin   (password: ${ADMIN_PASSWORD})"
echo "   Bot API : 127.0.0.1:${WEB_API_PORT} (internal)"
echo "   Manage  : pm2 status · pm2 logs drsaab-web · pm2 logs drsaab-bot"
echo
[ "$SSL_OK" = "1" ] || warn "Ensure DNS for ${DOMAIN} points here and ports 80/443 are open, then re-run for HTTPS."
