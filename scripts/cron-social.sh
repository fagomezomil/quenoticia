#!/usr/bin/env bash
# Cron de publicacion a FEED IG/FB (carrusel) - 2x/dia (10:00 y 21:00 ART)
# Dispara el systemd service quenoticia-carousel.service que corre el script
# standalone build-carousel.ts en su propio cgroup (MemoryMax=1G). Asi el render
# Satori+Resvg+sharp no estresa el proceso web Next.js (OOM kills recurrentes
# antes de esta migracion — ver lavozdiaria-vps-oom-fix.md).
#
# El service es Type=oneshot: si el cron dispara mientras el anterior sigue
# corriendo, systemd lo rechaza (evita doble render). Memoria aislada del web.
set -euo pipefail

LOG_FILE="/var/log/quenoticia/social.log"

ts() { date -Is; }

echo "$(ts) === cron-social start ===" >> "$LOG_FILE"

if sudo systemctl start quenoticia-carousel.service; then
  echo "$(ts) OK: quenoticia-carousel.service started" >> "$LOG_FILE"
else
  echo "$(ts) FAIL: sudo systemctl start failed" >> "$LOG_FILE"
fi

echo "$(ts) === cron-social end ===" >> "$LOG_FILE"