#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev_worker.sh — Levanta el worker Celery en modo desarrollo
# Requiere Redis corriendo localmente en localhost:6379
# Uso: ./scripts/dev_worker.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

# ── Verificar que celery está instalado ───────────────────────────────────────
if ! command -v celery &>/dev/null; then
  echo "[ERROR] celery no está instalado. Ejecuta primero: pip install -r requirements.txt"
  exit 1
fi

# ── Verificar que Redis está disponible ──────────────────────────────────────
if ! redis-cli -h localhost -p 6379 ping &>/dev/null; then
  echo "[ERROR] Redis no está disponible en localhost:6379"
  echo "        Inicia Redis con: redis-server"
  echo "        O usa Docker:     docker run -d -p 6379:6379 redis:7.2-alpine"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║     CheatingAI — Celery Worker                       ║"
echo "║     Queue: plagiarism                                 ║"
echo "║     Concurrencia: 2                                   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

celery -A app.tasks.celery_app worker \
  --loglevel=info \
  --queues=plagiarism \
  --concurrency=2
