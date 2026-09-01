#!/usr/bin/env bash
# Cron de publicacion a STORIES IG/FB - 2x/dia (15:00 y 21:30 ART)
# Dispara el systemd service quenoticia-stories.service que corre el script
# standalone build-stories.ts en su propio cgroup (MemoryMax=2G). Asi el render
# Satori+Resvg+sharp no estresa el proceso web Next.js (OOM kills recurrentes
# antes de esta migracion — ver lavozdiaria-vps-oom-fix.md).
#
# El service es Type=oneshot: si el cron dispara mientras el anterior sigue
# corriendo, systemd lo rechaza (evita doble render). Memoria aislada del web.
set -euo pipefail

LOG_FILE="/var/log/quenoticia/stories.log"

ts() { date -Is; }

echo "$(ts) === cron-stories start ===" >> "$LOG_FILE"

if sudo systemctl start quenoticia-stories.service; then
  echo "$(ts) OK: quenoticia-stories.service started" >> "$LOG_FILE"
else
  echo "$(ts) FAIL: sudo systemctl start failed" >> "$LOG_FILE"
fi

echo "$(ts) === cron-stories end ===" >> "$LOG_FILE"