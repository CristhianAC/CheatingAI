#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# install.sh — Instala las dependencias del proyecto (crea venv si no existe)
# Uso:
#   ./scripts/install.sh          → instala solo requirements.txt
#   ./scripts/install.sh --dev    → instala requirements-dev.txt (incluye tests)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

DEV_MODE=false
if [[ "${1:-}" == "--dev" ]]; then
  DEV_MODE=true
fi

# ── Verificar Python 3.10+ ────────────────────────────────────────────────────
PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
REQUIRED_MAJOR=3
REQUIRED_MINOR=10

MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)

if [ "$MAJOR" -lt "$REQUIRED_MAJOR" ] || { [ "$MAJOR" -eq "$REQUIRED_MAJOR" ] && [ "$MINOR" -lt "$REQUIRED_MINOR" ]; }; then
  echo "[ERROR] Se requiere Python 3.10+. Versión actual: $PYTHON_VERSION"
  exit 1
fi

echo "[OK] Python $PYTHON_VERSION detectado"

# ── Crear entorno virtual si no existe ────────────────────────────────────────
if [ ! -d "$ROOT_DIR/.venv" ]; then
  echo "[INFO] Creando entorno virtual en .venv..."
  python3 -m venv "$ROOT_DIR/.venv"
fi

# ── Activar entorno virtual ───────────────────────────────────────────────────
source "$ROOT_DIR/.venv/bin/activate"
echo "[OK] Entorno virtual activado"

# ── Actualizar pip ─────────────────────────────────────────────────────────────
pip install --upgrade pip -q

# ── Instalar dependencias ─────────────────────────────────────────────────────
if [ "$DEV_MODE" = true ]; then
  echo "[INFO] Instalando dependencias de desarrollo (requirements-dev.txt)..."
  pip install -r "$ROOT_DIR/requirements-dev.txt"
else
  echo "[INFO] Instalando dependencias de producción (requirements.txt)..."
  pip install -r "$ROOT_DIR/requirements.txt"
fi

# ── Copiar .env si no existe ──────────────────────────────────────────────────
if [ ! -f "$ROOT_DIR/.env" ]; then
  echo "[INFO] Copiando .env.example → .env"
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
fi

# ── Crear directorio de datos ─────────────────────────────────────────────────
mkdir -p "$ROOT_DIR/data"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✓ Instalación completada                            ║"
echo "║                                                      ║"
echo "║  Para activar el entorno virtual:                    ║"
echo "║    source .venv/bin/activate                         ║"
echo "╚══════════════════════════════════════════════════════╝"
