import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum as SAEnum, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class SessionStatus(str, enum.Enum):
    ACTIVE = "active"
    ENDED = "ended"
    ABORTED = "aborted"


class ProctoringSession(Base):
    __tablename__ = "proctoring_sessions"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    exam_id = Column(String(100), nullable=False, index=True)
    student_id = Column(String(100), nullable=False, index=True)
    status = Column(
        SAEnum(SessionStatus),
        nullable=False,
        default=SessionStatus.ACTIVE,
        index=True,
    )
    started_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    ended_at = Column(DateTime(timezone=True), nullable=True)
    # JSON-encoded list[float] — face embedding captured at session start
    reference_embedding = Column(Text, nullable=True)

    violations = relationship(
        "ViolationEvent",
        back_populates="session",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
