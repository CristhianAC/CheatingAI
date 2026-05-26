"""Integración: verificación de código de examen."""

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt

from app.config import get_settings
from app.models.exam import Exam
from app.models.user import User

settings = get_settings()


def _auth_headers(user_id: uuid.UUID, role: str = "STUDENT", email: str = "student@test.local"):
    token = jwt.encode(
        {"sub": str(user_id), "role": role, "email": email},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def student_user(db_session):
    user = User(
        id=uuid.uuid4(),
        email="student-verify@test.local",
        password_hash="hashed",
        full_name="Estudiante Test",
        role="STUDENT",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def professor_and_exam(db_session):
    professor = User(
        id=uuid.uuid4(),
        email="prof-verify@test.local",
        password_hash="hashed",
        full_name="Profesor Test",
        role="PROFESSOR",
    )
    db_session.add(professor)
    db_session.flush()

    scheduled = datetime.now(timezone.utc) - timedelta(minutes=5)
    exam = Exam(
        code="TST001",
        name="Examen integración",
        professor_id=professor.id,
        description="Prueba verify-code",
        duration_minutes=60,
        scheduled_at=scheduled,
        status="active",
    )
    db_session.add(exam)
    db_session.commit()
    db_session.refresh(exam)
    return exam


class TestVerifyExamCode:
    def test_verify_valid_code_returns_exam(self, client, student_user, professor_and_exam):
        exam = professor_and_exam
        resp = client.post(
            "/api/v1/exams/verify-code",
            json={"code": exam.code},
            headers=_auth_headers(student_user.id),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == exam.code
        assert data["name"] == exam.name
        assert data["id"] == str(exam.id)

    def test_verify_code_normalizes_input(self, client, student_user, professor_and_exam):
        exam = professor_and_exam
        resp = client.post(
            "/api/v1/exams/verify-code",
            json={"code": " tst001 "},
            headers=_auth_headers(student_user.id),
        )
        assert resp.status_code == 200
        assert resp.json()["code"] == exam.code

    def test_verify_unknown_code_returns_404(self, client, student_user):
        resp = client.post(
            "/api/v1/exams/verify-code",
            json={"code": "ZZZZZZ"},
            headers=_auth_headers(student_user.id),
        )
        assert resp.status_code == 404
        assert resp.json()["detail"] == "CODE_NOT_FOUND"

    def test_verify_invalid_code_length_returns_422(self, client, student_user):
        resp = client.post(
            "/api/v1/exams/verify-code",
            json={"code": "ABC"},
            headers=_auth_headers(student_user.id),
        )
        assert resp.status_code == 422

    def test_verify_requires_auth(self, client, professor_and_exam):
        resp = client.post(
            "/api/v1/exams/verify-code",
            json={"code": professor_and_exam.code},
        )
        assert resp.status_code == 401

    def test_verify_pending_exam_returns_403(self, client, student_user, db_session):
        professor = User(
            id=uuid.uuid4(),
            email="prof-pending@test.local",
            password_hash="hashed",
            full_name="Prof Pendiente",
            role="PROFESSOR",
        )
        db_session.add(professor)
        db_session.flush()
        future = datetime.now(timezone.utc) + timedelta(hours=2)
        pending = Exam(
            code="PND001",
            name="Examen pendiente",
            professor_id=professor.id,
            duration_minutes=60,
            scheduled_at=future,
            status="scheduled",
        )
        db_session.add(pending)
        db_session.commit()

        resp = client.post(
            "/api/v1/exams/verify-code",
            json={"code": "PND001"},
            headers=_auth_headers(student_user.id),
        )
        assert resp.status_code == 403
        detail = resp.json()["detail"]
        assert detail["code"] == "EXAM_NOT_STARTED"
