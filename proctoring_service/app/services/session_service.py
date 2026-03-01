from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.session import ProctoringSession, SessionStatus
from app.models.violation import ViolationEvent
from app.schemas.session import SessionCreate, SessionSummaryResponse


class SessionService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, payload: SessionCreate) -> ProctoringSession:
        session = ProctoringSession(
            id=str(uuid.uuid4()),
            exam_id=payload.exam_id,
            student_id=payload.student_id,
            status=SessionStatus.ACTIVE,
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_by_id(self, session_id: str) -> Optional[ProctoringSession]:
        return (
            self.db.query(ProctoringSession)
            .filter(ProctoringSession.id == session_id)
            .first()
        )

    def get_by_id_or_404(self, session_id: str) -> ProctoringSession:
        session = self.get_by_id(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session '{session_id}' not found",
            )
        return session

    def end_session(self, session_id: str) -> ProctoringSession:
        session = self.get_by_id_or_404(session_id)
        if session.status != SessionStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Session is already {session.status.value}",
            )
        session.status = SessionStatus.ENDED
        session.ended_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_summary(self, session_id: str) -> SessionSummaryResponse:
        session = self.get_by_id_or_404(session_id)

        violations = (
            self.db.query(ViolationEvent)
            .filter(ViolationEvent.session_id == session_id)
            .all()
        )

        total = len(violations)
        by_type: dict[str, int] = {}
        for v in violations:
            key = v.violation_type.value
            by_type[key] = by_type.get(key, 0) + 1

        return SessionSummaryResponse(
            id=session.id,
            exam_id=session.exam_id,
            student_id=session.student_id,
            status=session.status,
            started_at=session.started_at,
            ended_at=session.ended_at,
            total_violations=total,
            violations_by_type=by_type,
        )
