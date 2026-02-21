import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum as SAEnum, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class JobType(str, enum.Enum):
    PAIRWISE = "pairwise"
    BATCH = "batch"


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    job_type = Column(SAEnum(JobType), nullable=False)
    status = Column(
        SAEnum(JobStatus),
        nullable=False,
        default=JobStatus.PENDING,
        index=True,
    )
    problem_id = Column(String(100), nullable=True, index=True)
    exam_id = Column(String(100), nullable=True, index=True)
    submission_a_id = Column(String(36), nullable=True)
    submission_b_id = Column(String(36), nullable=True)

    total_comparisons = Column(Integer, default=0)
    completed_comparisons = Column(Integer, default=0)

    celery_task_id = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)

    results = relationship(
        "ComparisonResult",
        back_populates="job",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
