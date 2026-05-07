import random
import string
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.exam import Exam
from app.schemas.exam import ExamCodeCheck, ExamCreate, ExamResponse, ExamStatusUpdate

router = APIRouter(prefix="/exams", tags=["Exams"])


def _require_professor(current_user: dict) -> None:
    if current_user.get("role") != "PROFESSOR":
        raise HTTPException(status_code=403, detail="Acceso restringido a profesores")


def _generate_exam_code() -> str:
    # Excluir caracteres ambiguos: 0, O, I, 1
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(random.choices(alphabet, k=6))

def _tz_aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _compute_ends_at(exam: Exam) -> datetime | None:
    """
    ends_at puede venir NULL si la BD no soportó columna generada.
    Para el MVP, si hay scheduled_at y duration_minutes, lo calculamos en runtime.
    """
    ends_at = getattr(exam, "ends_at", None)
    if ends_at is not None:
        return _tz_aware(ends_at)

    scheduled_at = _tz_aware(getattr(exam, "scheduled_at", None))
    duration_minutes = getattr(exam, "duration_minutes", None)
    if scheduled_at is None or duration_minutes is None:
        return None

    try:
        minutes_int = int(duration_minutes)
    except Exception:
        return None
    if minutes_int <= 0:
        return None

    return scheduled_at + timedelta(minutes=minutes_int)


def _to_exam_response(exam: Exam) -> ExamResponse:
    ends_at_calc = _compute_ends_at(exam)
    return ExamResponse(
        id=str(exam.id),
        code=exam.code,
        name=exam.name,
        status=getattr(exam, "status", "scheduled") or "scheduled",
        description=exam.description,
        duration_minutes=exam.duration_minutes,
        scheduled_at=exam.scheduled_at,
        ends_at=ends_at_calc,
        professor_id=str(exam.professor_id),
        created_at=exam.created_at,
    )


@router.post("/", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(
    payload: ExamCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_professor(current_user)

    code = None
    for _ in range(10):
        candidate = _generate_exam_code()
        exists = db.query(Exam).filter(Exam.code == candidate).first()
        if not exists:
            code = candidate
            break

    if not code:
        raise HTTPException(status_code=500, detail="No se pudo generar un código único")

    exam = Exam(
        code=code,
        name=payload.name,
        professor_id=current_user["sub"],
        description=payload.description,
        duration_minutes=payload.duration_minutes,
        scheduled_at=payload.scheduled_at,
        status="scheduled",
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return _to_exam_response(exam)


@router.get("/", response_model=list[ExamResponse])
def list_exams(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_professor(current_user)
    exams = (
        db.query(Exam)
        .filter(Exam.professor_id == current_user["sub"])
        .order_by(Exam.created_at.desc())
        .all()
    )
    return [_to_exam_response(exam) for exam in exams]


@router.get("/{exam_id}", response_model=ExamResponse)
def get_exam(
    exam_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_professor(current_user)
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.professor_id == current_user["sub"]).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Examen no encontrado")
    return _to_exam_response(exam)


@router.post("/verify-code", response_model=ExamResponse)
def verify_exam_code(
    payload: ExamCodeCheck,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _ = current_user
    exam = db.query(Exam).filter(Exam.code == payload.code.upper()).first()
    if not exam:
        raise HTTPException(status_code=404, detail="CODE_NOT_FOUND")

    status_value = (getattr(exam, "status", None) or "scheduled").lower()
    ends_at = _compute_ends_at(exam)
    now = datetime.now(timezone.utc)

    # Considerar examen finalizado si:
    # - status='finished', o
    # - ends_at (calculado si es NULL) existe y ya pasó
    if status_value == "finished":
        raise HTTPException(status_code=410, detail="EXAM_FINISHED")
    if ends_at is not None:
        if ends_at <= now:
            raise HTTPException(status_code=410, detail="EXAM_FINISHED")

    return _to_exam_response(exam)


@router.patch("/{exam_id}/status", response_model=ExamResponse)
def update_exam_status(
    exam_id: str,
    payload: ExamStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_professor(current_user)
    next_status = (payload.status or "").lower().strip()
    if next_status not in ("scheduled", "active", "finished"):
        raise HTTPException(status_code=422, detail="Estado inválido")

    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.professor_id == current_user["sub"]).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Examen no encontrado")

    exam.status = next_status
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return _to_exam_response(exam)
