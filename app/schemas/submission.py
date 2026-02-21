from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.models.submission import Language


class SubmissionBase(BaseModel):
    student_id: str = Field(..., min_length=1, max_length=100, examples=["est-001"])
    problem_id: str = Field(..., min_length=1, max_length=100, examples=["prob-fibonacci"])
    exam_id: Optional[str] = Field(None, max_length=100, examples=["parcial-1"])
    language: Language


class SubmissionCreate(SubmissionBase):
    source_code: str = Field(..., min_length=1, description="Código fuente completo")

    @field_validator("source_code")
    @classmethod
    def source_code_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("source_code no puede ser solo espacios en blanco")
        return v


class SubmissionUpdate(BaseModel):
    source_code: Optional[str] = Field(None, min_length=1)
    exam_id: Optional[str] = Field(None, max_length=100)


class SubmissionResponse(SubmissionBase):
    id: str
    code_hash: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SubmissionListResponse(BaseModel):
    total: int
    items: list[SubmissionResponse]
