import hashlib
import uuid
from typing import Optional

from sqlalchemy.orm import Session

from app.models.submission import Language, Submission
from app.schemas.submission import SubmissionCreate, SubmissionListResponse, SubmissionUpdate


def _hash_code(source_code: str) -> str:
    return hashlib.sha256(source_code.encode("utf-8")).hexdigest()


class SubmissionService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, payload: SubmissionCreate) -> Submission:
        submission = Submission(
            id=str(uuid.uuid4()),
            student_id=payload.student_id,
            problem_id=payload.problem_id,
            exam_id=payload.exam_id,
            language=payload.language,
            source_code=payload.source_code,
            code_hash=_hash_code(payload.source_code),
        )
        self.db.add(submission)
        self.db.commit()
        self.db.refresh(submission)
        return submission

    def get_by_id(self, submission_id: str) -> Optional[Submission]:
        return self.db.query(Submission).filter(Submission.id == submission_id).first()

    def list_all(
        self,
        problem_id: Optional[str],
        exam_id: Optional[str],
        student_id: Optional[str],
        language: Optional[Language],
        skip: int,
        limit: int,
    ) -> SubmissionListResponse:
        query = self.db.query(Submission)

        if problem_id:
            query = query.filter(Submission.problem_id == problem_id)
        if exam_id:
            query = query.filter(Submission.exam_id == exam_id)
        if student_id:
            query = query.filter(Submission.student_id == student_id)
        if language:
            query = query.filter(Submission.language == language)

        total = query.count()
        items = query.offset(skip).limit(limit).all()

        return SubmissionListResponse(total=total, items=items)

    def update(self, submission_id: str, payload: SubmissionUpdate) -> Optional[Submission]:
        submission = self.get_by_id(submission_id)
        if not submission:
            return None

        if payload.source_code is not None:
            submission.source_code = payload.source_code
            submission.code_hash = _hash_code(payload.source_code)
        if payload.exam_id is not None:
            submission.exam_id = payload.exam_id

        self.db.commit()
        self.db.refresh(submission)
        return submission

    def delete(self, submission_id: str) -> bool:
        submission = self.get_by_id(submission_id)
        if not submission:
            return False
        self.db.delete(submission)
        self.db.commit()
        return True
