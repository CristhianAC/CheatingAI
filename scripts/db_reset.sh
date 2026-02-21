#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# db_reset.sh — Elimina la base de datos SQLite y la recrea desde cero
# ADVERTENCIA: Esto borra todos los datos (submissions, jobs, resultados)
# Uso: ./scripts/db_reset.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

DB_FILE="$ROOT_DIR/data/cheating_ai.db"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║     CheatingAI — Reset de Base de Datos              ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "[WARN] Esta operación eliminará TODOS los datos:"
echo "       $DB_FILE"
echo ""

read -p "¿Confirmas el reset? (s/N): " confirm
if [[ "$confirm" != "s" && "$confirm" != "S" ]]; then
  echo "[INFO] Operación cancelada."
  exit 0
fi

# ── Eliminar DB existente ─────────────────────────────────────────────────────
if [ -f "$DB_FILE" ]; then
  rm "$DB_FILE"
  echo "[OK] Base de datos eliminada: $DB_FILE"
else
  echo "[INFO] La base de datos no existía."
fi

# ── Recrear el directorio y las tablas via Python ─────────────────────────────
mkdir -p "$ROOT_DIR/data"

echo "[INFO] Recreando tablas..."
python3 -c "
from app.database import Base, engine
Base.metadata.create_all(bind=engine)
print('[OK] Tablas recreadas exitosamente.')
"

echo ""
echo "[OK] Base de datos reseteada y lista para usar."
