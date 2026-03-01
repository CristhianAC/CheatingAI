from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.violation import ViolationEvent, ViolationType


class ViolationService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def record(
        self,
        session_id: str,
        violation_type: ViolationType,
        confidence: float,
        frame_snapshot: Optional[str] = None,
    ) -> ViolationEvent:
        event = ViolationEvent(
            id=str(uuid.uuid4()),
            session_id=session_id,
            violation_type=violation_type,
            confidence=confidence,
            frame_snapshot=frame_snapshot,
            detected_at=datetime.now(timezone.utc),
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def list_for_session(self, session_id: str) -> list[ViolationEvent]:
        return (
            self.db.query(ViolationEvent)
            .filter(ViolationEvent.session_id == session_id)
            .order_by(ViolationEvent.detected_at.desc())
            .all()
        )
