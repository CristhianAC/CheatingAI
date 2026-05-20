from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func, text
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Exam(Base):
    __tablename__ = "exams"
    __table_args__ = {"schema": "public", "extend_existing": True}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    code = Column(String(6), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    professor_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id"), nullable=False, index=True)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, nullable=True)
    ends_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

