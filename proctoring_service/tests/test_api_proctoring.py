"""
Pruebas de integración HTTP contra la app FastAPI.

Carga MediaPipe al iniciar el TestClient (puede tardar ~10–30 s la primera vez).
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

# Importar la app después de que conftest fijó DATABASE_URL
from app.main import app

# JPEG 1×1 px mínimo (válido) en base64 — suficiente para que OpenCV decodifique el buffer.
_MIN_JPEG_B64 = (
    "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBQYGBQYGGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBj/"
    "2wBDAQICAgICAgUDAwUHBhUGBhgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBj/wAARCAABAAEDASIAAhEBAxEB/"
    "8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/"
    "9oADAMBAAIRAxEAPwD8gA//2Q=="
)


@pytest.fixture(scope="module")
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


def test_health_ok(client: TestClient) -> None:
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body.get("status") == "ok"


def test_analyze_frame_base64_invalido(client: TestClient) -> None:
    res = client.post(
        "/api/v1/proctoring/analyze-frame",
        json={"frame_base64": "!!!no-es-base64-valido!!!"},
    )
    assert res.status_code == 400


def test_analyze_frame_jpeg_sin_sesion(client: TestClient) -> None:
    """Sin session_id solo se analiza el fotograma; debe responder 200 con estructura esperada."""
    res = client.post(
        "/api/v1/proctoring/analyze-frame",
        json={"frame_base64": _MIN_JPEG_B64, "session_id": None},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert "person_count" in data
    assert "violations" in data
    assert isinstance(data["violations"], list)
