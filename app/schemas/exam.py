from datetime import datetime

from pydantic import BaseModel


class ExamCreate(BaseModel):
    name: str
    description: str | None = None
    duration_minutes: int | None = None
    scheduled_at: datetime | None = None


class ExamResponse(BaseModel):
    id: str
    code: str
    name: str
    description: str | None = None
    duration_minutes: int | None = None
    scheduled_at: datetime | None = None
    professor_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class ExamCodeCheck(BaseModel):
    code: str
