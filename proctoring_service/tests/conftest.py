"""
Configuración de pytest para el servicio de proctoring.

Se fuerza SQLite en archivo temporal para no depender de PostgreSQL ni del .env local.
Debe cargarse antes de importar `app.main` (pytest carga conftest antes que los tests).
"""
from __future__ import annotations

import os
import pathlib

import pytest

_DB_FILE = pathlib.Path("/tmp/cheatingai_proctor_pytest.sqlite3")
os.environ["DATABASE_URL"] = f"sqlite:///{_DB_FILE.as_posix()}"

from app.config import get_settings  # noqa: E402

get_settings.cache_clear()


@pytest.fixture(scope="session", autouse=True)
def _clean_sqlite_file() -> None:
    """Elimina la BD de prueba antes de la sesión para tablas frescas al arrancar la app."""
    try:
        _DB_FILE.unlink()
    except FileNotFoundError:
        pass
    yield
