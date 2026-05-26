import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum as SAEnum, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ViolationType(str, enum.Enum):
    """Valores alineados con el enum Postgres `violationtype` (MAYÚSCULAS)."""

    MULTIPLE_PERSONS = "MULTIPLE_PERSONS"
    NO_PERSON = "NO_PERSON"
    LOOKING_AWAY = "LOOKING_AWAY"
    PHONE_DETECTED = "PHONE_DETECTED"
    TAB_SWITCH = "TAB_SWITCH"
    WINDOW_BLUR = "WINDOW_BLUR"
    IDENTITY_MISMATCH = "IDENTITY_MISMATCH"

    @property
    def client_key(self) -> str:
        """Clave snake_case para API/UI (p. ej. rutas Storage bajo violations/.../)."""
        return self.value.lower()


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
    violation_type = Column(
        SAEnum(
            ViolationType,
            name="violationtype",
            native_enum=True,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        index=True,
    )
    confidence = Column(Float, nullable=False)
    frame_snapshot = Column(Text, nullable=True)
    detected_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    session = relationship("ProctoringSession", back_populates="violations")
