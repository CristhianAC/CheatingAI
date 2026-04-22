import random
import string

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.exam import Exam
from app.schemas.exam import ExamCodeCheck, ExamCreate, ExamResponse

router = APIRouter(prefix="/exams", tags=["Exams"])


def _require_professor(current_user: dict) -> None:
    if current_user.get("role") != "PROFESSOR":
        raise HTTPException(status_code=403, detail="Acceso restringido a profesores")


def _generate_exam_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(random.choices(alphabet, k=6))


def _to_exam_response(exam: Exam) -> ExamResponse:
    return ExamResponse(
        id=str(exam.id),
        code=exam.code,
        name=exam.name,
        description=exam.description,
        duration_minutes=exam.duration_minutes,
        scheduled_at=exam.scheduled_at,
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
    for _ in range(5):
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
        raise HTTPException(status_code=404, detail="Código de examen no válido")
    return _to_exam_response(exam)
