#!/usr/bin/env bash
# Deploy script para QUE NOTICIA! en VPS DonWeb.
# Corre como user deploy desde /opt/quenoticia.
# Requiere sudo passwordless (configurado en /etc/sudoers.d/deploy).
#
# Uso:
#   ./scripts/deploy.sh              # deploy desde main
#   ./scripts/deploy.sh <branch>     # deploy desde otra branch
set -euo pipefail

BRANCH="${1:-main}"
REPO_DIR="/opt/quenoticia"

cd "$REPO_DIR"

echo "=== git fetch + checkout $BRANCH ==="
git fetch --quiet origin
git checkout --quiet "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "=== npm ci ==="
npm ci --no-audit --no-fund

echo "=== build (output standalone) ==="
npm run build

echo "=== copy static + public to standalone ==="
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

echo "=== restart systemd service ==="
sudo systemctl restart quenoticia

sleep 3

echo "=== verify ==="
if curl -fsS -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/; then
  echo "=== service status ==="
  sudo systemctl is-active quenoticia
  echo "=== deploy OK ==="
else
  echo "=== FAIL: app no responde tras restart ==="
  sudo journalctl -u quenoticia --no-pager -n 30
  exit 1
fi