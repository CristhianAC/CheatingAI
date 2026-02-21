#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# docker_logs.sh — Muestra logs de los servicios Docker en tiempo real
# Uso:
#   ./scripts/docker_logs.sh           → logs de todos los servicios
#   ./scripts/docker_logs.sh api       → logs solo de la API
#   ./scripts/docker_logs.sh worker    → logs solo del worker Celery
#   ./scripts/docker_logs.sh redis     → logs solo de Redis
#   ./scripts/docker_logs.sh flower    → logs solo de Flower
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

DC_CMD="docker compose"
if ! docker compose version &>/dev/null 2>&1; then
  DC_CMD="docker-compose"
fi

SERVICE="${1:-}"

if [ -n "$SERVICE" ]; then
  echo "[INFO] Mostrando logs de: $SERVICE"
  $DC_CMD logs -f --tail=100 "$SERVICE"
else
  echo "[INFO] Mostrando logs de todos los servicios..."
  $DC_CMD logs -f --tail=50
fi
