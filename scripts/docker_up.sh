#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# docker_up.sh — Construye y levanta todos los servicios con Docker Compose
# Servicios: redis, api (puerto 8000), worker, flower (puerto 5555)
# Uso: ./scripts/docker_up.sh [--build]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

if ! command -v docker &>/dev/null; then
  echo "[ERROR] Docker no está instalado."
  exit 1
fi

if ! command -v docker compose &>/dev/null 2>&1 && ! command -v docker-compose &>/dev/null; then
  echo "[ERROR] Docker Compose no está instalado."
  exit 1
fi

# ── Determinar si se usa 'docker compose' o 'docker-compose' ─────────────────
DC_CMD="docker compose"
if ! docker compose version &>/dev/null 2>&1; then
  DC_CMD="docker-compose"
fi

# ── Copiar .env.example si no existe .env ─────────────────────────────────────
if [ ! -f "$ROOT_DIR/.env" ]; then
  echo "[INFO] Copiando .env.example → .env"
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
fi

BUILD_FLAG=""
if [[ "${1:-}" == "--build" ]]; then
  BUILD_FLAG="--build"
  echo "[INFO] Reconstruyendo imágenes Docker..."
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║     CheatingAI — Docker Compose                      ║"
echo "║     API:    http://localhost:8000                     ║"
echo "║     Docs:   http://localhost:8000/docs               ║"
echo "║     Flower: http://localhost:5555                     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

$DC_CMD up $BUILD_FLAG
