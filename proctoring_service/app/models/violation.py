import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum as SAEnum, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ViolationType(str, enum.Enum):
    MULTIPLE_PERSONS = "multiple_persons"
    NO_PERSON = "no_person"
    LOOKING_AWAY = "looking_away"
    PHONE_DETECTED = "phone_detected"
    TAB_SWITCH = "tab_switch"
    WINDOW_BLUR = "window_blur"
    IDENTITY_MISMATCH = "identity_mismatch"


class ViolationEvent(Base):
    __tablename__ = "violation_events"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    session_id = Column(
        String(36),
        ForeignKey("proctoring_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    violation_type = Column(SAEnum(ViolationType), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    frame_snapshot = Column(Text, nullable=True)
    detected_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    session = relationship("ProctoringSession", back_populates="violations")
