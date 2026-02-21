#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# test.sh — Ejecuta la suite de tests
# Uso:
#   ./scripts/test.sh               → todos los tests
#   ./scripts/test.sh --unit        → solo tests unitarios
#   ./scripts/test.sh --integration → solo tests de integración
#   ./scripts/test.sh --cov         → todos los tests con reporte de cobertura
#   ./scripts/test.sh --fast        → tests sin reporte (más rápido)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

if ! command -v pytest &>/dev/null; then
  echo "[ERROR] pytest no está instalado. Ejecuta: ./scripts/install.sh --dev"
  exit 1
fi

MODE="${1:-}"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║     CheatingAI — Suite de Tests                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

case "$MODE" in
  --unit)
    echo "[INFO] Ejecutando tests unitarios..."
    pytest tests/unit/ -v
    ;;
  --integration)
    echo "[INFO] Ejecutando tests de integración..."
    pytest tests/integration/ -v
    ;;
  --cov)
    echo "[INFO] Ejecutando todos los tests con cobertura..."
    pytest tests/ -v \
      --cov=app \
      --cov-report=term-missing \
      --cov-report=html:htmlcov
    echo ""
    echo "[OK] Reporte HTML generado en: htmlcov/index.html"
    ;;
  --fast)
    echo "[INFO] Ejecutando todos los tests (modo rápido)..."
    pytest tests/ -q
    ;;
  *)
    echo "[INFO] Ejecutando todos los tests..."
    pytest tests/ -v
    ;;
esac
