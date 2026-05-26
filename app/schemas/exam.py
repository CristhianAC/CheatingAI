import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

EXAM_DESCRIPTION_MAX_LENGTH = 500


class ExamCreate(BaseModel):
    name: str
    description: str | None = Field(default=None, max_length=EXAM_DESCRIPTION_MAX_LENGTH)
    duration_minutes: int | None = None
    scheduled_at: datetime | None = None


class ExamResponse(BaseModel):
    id: str
    code: str
    name: str
    status: str
    description: str | None = Field(default=None, max_length=EXAM_DESCRIPTION_MAX_LENGTH)
    duration_minutes: int | None = None
    scheduled_at: datetime | None = None
    ends_at: datetime | None = None
    professor_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class ExamCodeCheck(BaseModel):
    code: str

    @field_validator("code")
    @classmethod
    def normalize_exam_code(cls, value: str) -> str:
        normalized = re.sub(r"[^A-Z0-9]", "", (value or "").strip().upper())
        if len(normalized) != 6:
            raise ValueError("El código debe tener exactamente 6 caracteres alfanuméricos")
        return normalized


class ExamStatusUpdate(BaseModel):
    status: str
