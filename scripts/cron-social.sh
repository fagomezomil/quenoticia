#!/usr/bin/env bash
# Cron de publicacion a redes - 2x/dia (15:00 y 21:00 ART)
# Lee CRON_SECRET de .env.production para no hardcodearlo en crontab.
# --max-time 120 es critico: la generacion de 5 slides con Satori + Resvg
# puede tardar 30-60s de CPU en el VPS.
set -euo pipefail

ENV_FILE="/opt/quenoticia/.env.production"
LOG_FILE="/var/log/quenoticia/social.log"
BASE_URL="http://127.0.0.1:3000"

# Cargar CRON_SECRET del env file
CRON_SECRET="$(grep -E '^CRON_SECRET=' "$ENV_FILE" | cut -d= -f2-)"
if [ -z "$CRON_SECRET" ]; then
  echo "$(date -Is) ERROR: CRON_SECRET vacio en $ENV_FILE" >> "$LOG_FILE"
  exit 1
fi

ts() { date -Is; }

echo "$(ts) === cron-social start ===" >> "$LOG_FILE"

url="${BASE_URL}/api/social-publish"
if response=$(curl -fsS --max-time 120 -H "X-Cron-Secret: ${CRON_SECRET}" -w "\n[HTTP %{http_code} %{time_total}s]" "$url" 2>&1); then
  echo "$(ts) OK: ${response##*$'\n'}" >> "$LOG_FILE"
  echo "$(ts) BODY: ${response%$'\n'*[HTTP *}" >> "$LOG_FILE"
else
  echo "$(ts) FAIL: $response" >> "$LOG_FILE"
fi

echo "$(ts) === cron-social end ===" >> "$LOG_FILE"