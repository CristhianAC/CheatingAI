#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# docker_down.sh — Detiene y elimina los contenedores de Docker Compose
# Uso:
#   ./scripts/docker_down.sh           → solo detiene contenedores
#   ./scripts/docker_down.sh --volumes → detiene y elimina volúmenes (borra DB y Redis)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

DC_CMD="docker compose"
if ! docker compose version &>/dev/null 2>&1; then
  DC_CMD="docker-compose"
fi

VOLUMES_FLAG=""
if [[ "${1:-}" == "--volumes" ]]; then
  VOLUMES_FLAG="-v"
  echo "[WARN] Se eliminarán también los volúmenes (datos de DB y Redis)."
  read -p "¿Estás seguro? (s/N): " confirm
  if [[ "$confirm" != "s" && "$confirm" != "S" ]]; then
    echo "[INFO] Operación cancelada."
    exit 0
  fi
fi

echo "[INFO] Deteniendo servicios..."
$DC_CMD down $VOLUMES_FLAG

echo "[OK] Servicios detenidos."
