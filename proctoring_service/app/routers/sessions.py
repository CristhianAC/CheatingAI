from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.session import (
    ExamSessionListItem,
    ExamSummary,
    SessionCreate,
    SessionReport,
    SessionResponse,
    SessionSummaryResponse,
)
from app.services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["Sessions"])


def require_auth(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticación requerida",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return authorization


@router.post(
    "/",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new proctoring session",
)
def create_session(payload: SessionCreate, db: Session = Depends(get_db)):
    return SessionService(db).create(payload)


@router.get(
    "/exams-summary",
    response_model=list[ExamSummary],
    summary="List exams with student counts",
)
def list_exams_summary(db: Session = Depends(get_db), _: str = Depends(require_auth)):
    return SessionService(db).get_exams_summary()


@router.get(
    "/by-exam/{exam_id}",
    response_model=list[ExamSessionListItem],
    summary="List sessions for a given exam",
)
def list_sessions_by_exam(exam_id: str, db: Session = Depends(get_db), _: str = Depends(require_auth)):
    return SessionService(db).list_by_exam(exam_id)


@router.get(
    "/{session_id}",
    response_model=SessionSummaryResponse,
    summary="Get session stats and violation summary",
)
def get_session(session_id: str, db: Session = Depends(get_db)):
    return SessionService(db).get_summary(session_id)


@router.get(
    "/{session_id}/report",
    response_model=SessionReport,
    summary="Get detailed report of a proctoring session",
)
def get_session_report(session_id: str, db: Session = Depends(get_db)):
    return SessionService(db).get_report(session_id)


@router.put(
    "/{session_id}/end",
    response_model=SessionResponse,
    summary="End an active proctoring session",
)
def end_session(session_id: str, db: Session = Depends(get_db)):
    return SessionService(db).end_session(session_id)
