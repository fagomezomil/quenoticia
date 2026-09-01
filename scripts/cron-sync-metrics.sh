#!/usr/bin/env bash
# Cron de sync de métricas Buffer Analytics API - 1x/día a las 04:00 ART
# Dispara el systemd service quenoticia-sync-metrics.service que corre el script
# standalone sync-metrics.ts. Trae reach/impressions/engagement/etc de cada post
# de Buffer y los guarda en social_metrics. Buffer refresca metrics ~24h lag, así
# que 04:00 AR captura el día anterior completo.
set -euo pipefail

LOG_FILE="/var/log/quenoticia/metrics.log"

ts() { date -Is; }

echo "$(ts) === cron-sync-metrics start ===" >> "$LOG_FILE"

if sudo systemctl start quenoticia-sync-metrics.service; then
  echo "$(ts) OK: quenoticia-sync-metrics.service started" >> "$LOG_FILE"
else
  echo "$(ts) FAIL: sudo systemctl start failed" >> "$LOG_FILE"
fi

echo "$(ts) === cron-sync-metrics end ===" >> "$LOG_FILE"