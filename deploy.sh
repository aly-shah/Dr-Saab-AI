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
DOMAIN="${DOMAIN:-drsaab.scalamedic.com}"
DEFAULT_WEB_PORT="${WEB_PORT:-3210}"
DEFAULT_API_PORT="${WEB_API_PORT:-8321}"
DB_NAME="${DB_NAME:-drsaab}"
DB_USER="${DB_USER:-drsaab}"
DEFAULT_TIER="${DEFAULT_TIER:-consistency_builder}"
LLM_MODEL="${LLM_MODEL:-llama-3.3-70b-versatile}"
LLM_VISION_MODEL="${LLM_VISION_MODEL:-meta-llama/llama-4-scout-17b-16e-instruct}"

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

log()  { echo -e "\n\033[1;36m==> $*\033[0m"; }
warn() { echo -e "\033[1;33m!  $*\033[0m"; }

SUDO=""
[ "$(id -u)" -ne 0 ] && SUDO="sudo"

# set/replace a KEY=VALUE line in an env file
set_env_kv() {
  local f="$1" k="$2" v="$3"
  if [ -f "$f" ] && grep -q "^${k}=" "$f"; then
    sed -i -E "s#^${k}=.*#${k}=${v}#" "$f"
  else
    echo "${k}=${v}" >> "$f"
  fi
}

port_in_use() { ss -ltnH 2>/dev/null | awk '{print $4}' | sed 's/.*://' | grep -qx "$1"; }
find_free()   { local p="$1"; while port_in_use "$p"; do p=$((p+1)); done; echo "$p"; }

# ---------- 1. system packages ----------
log "Installing system dependencies"
$SUDO apt-get update -y
$SUDO apt-get install -y curl ca-certificates gnupg openssl git

if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -lt 18 ]; then
  log "Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
  $SUDO apt-get install -y nodejs
fi

$SUDO apt-get install -y postgresql nginx
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
log "Using ports — website: ${WEB_PORT}  ·  bot web API: ${WEB_API_PORT}"

# ---------- 3. PostgreSQL ----------
log "Setting up PostgreSQL ($DB_NAME)"
$SUDO systemctl enable --now postgresql

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
  TG="${TELEGRAM_BOT_TOKEN:-}"
  GQ="${GROQ_API_KEY:-}"
  [ -z "$TG" ] && read -rp "Telegram bot token: " TG
  [ -z "$GQ" ] && read -rp "Groq API key: " GQ
  cat > bot/.env <<ENV
TELEGRAM_BOT_TOKEN=${TG}
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
fi

# Website runtime env (read by next start)
cat > .env.production <<ENV
BOT_API_URL=http://localhost:${WEB_API_PORT}/web/message
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
WEB_PORT="$WEB_PORT" WEB_API_PORT="$WEB_API_PORT" pm2 start ecosystem.config.cjs --update-env
pm2 save
$SUDO env PATH="$PATH" "$(command -v pm2)" startup systemd -u "$USER" --hp "$HOME" >/dev/null 2>&1 || \
  warn "Could not auto-enable pm2 startup; run what 'pm2 startup' prints, then 'pm2 save'."
pm2 save

# ---------- 7. nginx (idempotent, preserves existing SSL) ----------
NGINX_AVAIL=/etc/nginx/sites-available/drsaab.conf
NGINX_ENABLED=/etc/nginx/sites-enabled/drsaab.conf

if [ -f "$NGINX_AVAIL" ] || [ -f "$NGINX_ENABLED" ]; then
  log "Updating existing nginx vhost -> 127.0.0.1:${WEB_PORT} (SSL preserved)"
  for f in "$NGINX_AVAIL" "$NGINX_ENABLED"; do
    [ -f "$f" ] && $SUDO sed -i -E "s#proxy_pass http://127\.0\.0\.1:[0-9]+#proxy_pass http://127.0.0.1:${WEB_PORT}#g" "$f"
  done
else
  log "Creating nginx vhost for ${DOMAIN} -> 127.0.0.1:${WEB_PORT}"
  $SUDO tee "$NGINX_AVAIL" >/dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    client_max_body_size 12M;

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
$SUDO systemctl reload nginx

# ---------- 8. SSL (optional) ----------
if [ "${SETUP_SSL:-0}" = "1" ]; then
  log "Issuing HTTPS certificate via certbot"
  $SUDO apt-get install -y certbot python3-certbot-nginx
  $SUDO certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos \
    -m "${SSL_EMAIL:-admin@${DOMAIN}}" --redirect
fi

log "Deploy complete 🎉"
echo "   Website : https://${DOMAIN}   (-> 127.0.0.1:${WEB_PORT})"
echo "   Chat GUI: https://${DOMAIN}/bot"
echo "   Bot API : 127.0.0.1:${WEB_API_PORT} (internal)"
echo "   Manage  : pm2 status · pm2 logs drsaab-web · pm2 logs drsaab-bot"
echo
warn "Ensure DNS for ${DOMAIN} points here and ports 80/443 are open."
[ "${SETUP_SSL:-0}" != "1" ] && warn "Run with SETUP_SSL=1 SSL_EMAIL=you@example.com to enable HTTPS."
