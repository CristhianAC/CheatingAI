import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum as SAEnum, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Language(str, enum.Enum):
    PYTHON = "python"
    JAVA = "java"


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    student_id = Column(String(100), nullable=False, index=True)
    problem_id = Column(String(100), nullable=False, index=True)
    exam_id = Column(String(100), nullable=True, index=True)
    language = Column(SAEnum(Language), nullable=False)
    source_code = Column(Text, nullable=False)
    code_hash = Column(String(64), nullable=False, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    comparisons_as_a = relationship(
        "ComparisonResult",
        foreign_keys="ComparisonResult.submission_a_id",
        back_populates="submission_a",
        lazy="dynamic",
    )
    comparisons_as_b = relationship(
        "ComparisonResult",
        foreign_keys="ComparisonResult.submission_b_id",
        back_populates="submission_b",
        lazy="dynamic",
    )
