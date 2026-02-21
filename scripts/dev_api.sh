#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev_api.sh — Levanta el servidor FastAPI en modo desarrollo (con hot-reload)
# Uso: ./scripts/dev_api.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

# ── Verificar que existe el entorno virtual o que uvicorn está instalado ──────
if ! command -v uvicorn &>/dev/null; then
  echo "[ERROR] uvicorn no está instalado. Ejecuta primero: pip install -r requirements.txt"
  exit 1
fi

# ── Crear directorio de datos para SQLite si no existe ───────────────────────
mkdir -p "$ROOT_DIR/data"

# ── Copiar .env.example si no existe .env ─────────────────────────────────────
if [ ! -f "$ROOT_DIR/.env" ]; then
  echo "[INFO] No se encontró .env — copiando .env.example..."
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
  # Para desarrollo local, sobrescribir la URL de Redis
  sed -i '' 's|REDIS_URL=redis://redis:6379/0|REDIS_URL=redis://localhost:6379/0|' "$ROOT_DIR/.env" 2>/dev/null || \
  sed -i 's|REDIS_URL=redis://redis:6379/0|REDIS_URL=redis://localhost:6379/0|' "$ROOT_DIR/.env"
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║     CheatingAI — API de Detección de Plagio          ║"
echo "║     http://localhost:8000                             ║"
echo "║     http://localhost:8000/docs  (Swagger UI)          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --reload \
  --reload-dir app \
  --log-level info
