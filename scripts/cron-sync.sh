#!/usr/bin/env bash
# Cron de sincronizacion de noticias - 2x/dia (08:00 y 20:00 ART)
# Lee CRON_SECRET de .env.production para no hardcodearlo en crontab.
set -euo pipefail

ENV_FILE="/opt/quenoticia/.env.production"
LOG_FILE="/var/log/quenoticia/cron.log"
BASE_URL="http://127.0.0.1:3000"

# Cargar CRON_SECRET del env file
CRON_SECRET="$(grep -E '^CRON_SECRET=' "$ENV_FILE" | cut -d= -f2-)"
if [ -z "$CRON_SECRET" ]; then
  echo "$(date -Is) ERROR: CRON_SECRET vacio en $ENV_FILE" >> "$LOG_FILE"
  exit 1
fi

ts() { date -Is; }

echo "$(ts) === cron-sync start ===" >> "$LOG_FILE"

for endpoint in sync-news backfill-details; do
  url="${BASE_URL}/api/${endpoint}"
  echo "$(ts) GET $endpoint" >> "$LOG_FILE"
  if response=$(curl -fsS --max-time 300 -H "X-Cron-Secret: ${CRON_SECRET}" -w "\n[HTTP %{http_code} %{size_download}B %{time_total}s]" "$url" 2>&1); then
    echo "$(ts) OK $endpoint: ${response##*$'\n'}" >> "$LOG_FILE"
  else
    echo "$(ts) FAIL $endpoint: $response" >> "$LOG_FILE"
  fi
done

echo "$(ts) === cron-sync end ===" >> "$LOG_FILE"