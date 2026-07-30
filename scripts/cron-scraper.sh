#!/usr/bin/env bash
# Cron del scraper Python - 2x/dia (08:00 y 20:00 ART)
# Corre main.py --once contra las 5 fuentes y inserta en Supabase.
# timeout 600s: las 5 fuentes pueden tardar 2-5min (comunicacionsmt usa Playwright).
set -euo pipefail

SCRAPER_DIR="/opt/scraper"
PYTHON="${SCRAPER_DIR}/.venv/bin/python"
LOG_FILE="/var/log/scraper/scraper.log"

ts() { date -Is; }

echo "$(ts) === cron-scraper start ===" >> "$LOG_FILE"

if timeout 600 "${PYTHON}" "${SCRAPER_DIR}/main.py" --once >> "$LOG_FILE" 2>&1; then
  echo "$(ts) OK: scraper completed" >> "$LOG_FILE"
else
  rc=$?
  echo "$(ts) FAIL: scraper exit ${rc}" >> "$LOG_FILE"
fi

echo "$(ts) === cron-scraper end ===" >> "$LOG_FILE"