import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, JSON, String
from sqlalchemy.orm import relationship

from app.database import Base


class ComparisonResult(Base):
    __tablename__ = "comparison_results"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    job_id = Column(
        String(36),
        ForeignKey("analysis_jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    submission_a_id = Column(
        String(36),
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    submission_b_id = Column(
        String(36),
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    similarity_score = Column(Float, nullable=False)
    is_exact_copy = Column(Boolean, default=False, nullable=False)
    threshold_used = Column(Float, nullable=False, default=0.7)
    is_flagged = Column(Boolean, default=False, nullable=False, index=True)

    algorithm_details = Column(JSON, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    job = relationship("AnalysisJob", back_populates="results")
    submission_a = relationship(
        "Submission",
        foreign_keys=[submission_a_id],
        back_populates="comparisons_as_a",
    )
    submission_b = relationship(
        "Submission",
        foreign_keys=[submission_b_id],
        back_populates="comparisons_as_b",
    )
