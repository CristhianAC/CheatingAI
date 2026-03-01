from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.session import SessionCreate, SessionResponse, SessionSummaryResponse
from app.services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post(
    "/",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new proctoring session",
)
def create_session(payload: SessionCreate, db: Session = Depends(get_db)):
    return SessionService(db).create(payload)


@router.get(
    "/{session_id}",
    response_model=SessionSummaryResponse,
    summary="Get session stats and violation summary",
)
def get_session(session_id: str, db: Session = Depends(get_db)):
    return SessionService(db).get_summary(session_id)


@router.put(
    "/{session_id}/end",
    response_model=SessionResponse,
    summary="End an active proctoring session",
)
def end_session(session_id: str, db: Session = Depends(get_db)):
    return SessionService(db).end_session(session_id)
