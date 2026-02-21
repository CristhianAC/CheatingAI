#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev_flower.sh — Levanta Flower (monitor de Celery) en modo desarrollo
# Uso: ./scripts/dev_flower.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

if ! python3 -c "import flower" &>/dev/null; then
  echo "[INFO] Flower no está instalado. Instalando..."
  pip install flower
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║     CheatingAI — Flower (Monitor de Celery)          ║"
echo "║     http://localhost:5555                             ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

celery -A app.tasks.celery_app flower \
  --port=5555 \
  --broker=redis://localhost:6379/0
