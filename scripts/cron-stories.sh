#!/usr/bin/env bash
# Cron de publicacion a STORIES IG/FB - 2x/dia (15:00 y 21:00 ART)
# Lee CRON_SECRET de .env.production para no hardcodearlo en crontab.
# --max-time 240 es critico: la generacion de 10 slides 9:16 con Satori + Resvg
# puede tardar 60-120s de CPU en el VPS, mas 10 createPost a Buffer (uno por slide
# por canal IG+FB) que pueden sumar otros 30-60s.
set -euo pipefail

ENV_FILE="/opt/quenoticia/.env.production"
LOG_FILE="/var/log/quenoticia/stories.log"
BASE_URL="http://127.0.0.1:3000"

# Cargar CRON_SECRET del env file
CRON_SECRET="$(grep -E '^CRON_SECRET=' "$ENV_FILE" | cut -d= -f2-)"
if [ -z "$CRON_SECRET" ]; then
  echo "$(date -Is) ERROR: CRON_SECRET vacio en $ENV_FILE" >> "$LOG_FILE"
  exit 1
fi

ts() { date -Is; }

echo "$(ts) === cron-stories start ===" >> "$LOG_FILE"

url="${BASE_URL}/api/social-publish-stories"
if response=$(curl -fsS --max-time 240 -H "X-Cron-Secret: ${CRON_SECRET}" -w "\n[HTTP %{http_code} %{time_total}s]" "$url" 2>&1); then
  echo "$(ts) OK: ${response##*$'\n'}" >> "$LOG_FILE"
  echo "$(ts) BODY: ${response%$'\n'*[HTTP *}" >> "$LOG_FILE"
else
  echo "$(ts) FAIL: $response" >> "$LOG_FILE"
fi

echo "$(ts) === cron-stories end ===" >> "$LOG_FILE"