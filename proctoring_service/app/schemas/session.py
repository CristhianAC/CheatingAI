from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.session import SessionStatus
from app.schemas.violation import ViolationWithSnapshot


class SessionCreate(BaseModel):
    exam_id: str = Field(..., min_length=1, max_length=100, examples=["exam-2024-01"])
    student_id: str = Field(..., min_length=1, max_length=100, examples=["student-001"])


class SessionResponse(BaseModel):
    id: str
    exam_id: str
    student_id: str
    status: SessionStatus
    started_at: datetime
    ended_at: Optional[datetime]

    model_config = {"from_attributes": True}


class SessionSummaryResponse(BaseModel):
    id: str
    exam_id: str
    student_id: str
    status: SessionStatus
    started_at: datetime
    ended_at: Optional[datetime]
    total_violations: int
    violations_by_type: dict[str, int]

    model_config = {"from_attributes": True}


class ExamSummary(BaseModel):
    exam_id: str
    students_count: int
    last_activity: Optional[datetime]


class ExamSessionListItem(BaseModel):
    id: str
    exam_id: str
    student_id: str
    status: SessionStatus
    started_at: datetime
    ended_at: Optional[datetime]

    model_config = {"from_attributes": True}


class SessionReport(BaseModel):
    id: str
    exam_id: str
    student_id: str
    status: SessionStatus
    started_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: float
    total_violations: int
    violations_by_type: dict[str, int]
    violations: list[ViolationWithSnapshot]
