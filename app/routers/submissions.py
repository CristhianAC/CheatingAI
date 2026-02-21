from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.submission import Language
from app.schemas.submission import (
    SubmissionCreate,
    SubmissionListResponse,
    SubmissionResponse,
    SubmissionUpdate,
)
from app.services.submission_service import SubmissionService

router = APIRouter(prefix="/submissions", tags=["Submissions"])


@router.post(
    "/",
    response_model=SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una nueva submission",
)
def create_submission(payload: SubmissionCreate, db: Session = Depends(get_db)):
    return SubmissionService(db).create(payload)


@router.get(
    "/",
    response_model=SubmissionListResponse,
    summary="Listar submissions con filtros opcionales",
)
def list_submissions(
    problem_id: Optional[str] = Query(None),
    exam_id: Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
    language: Optional[Language] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return SubmissionService(db).list_all(problem_id, exam_id, student_id, language, skip, limit)


@router.get(
    "/{submission_id}",
    response_model=SubmissionResponse,
    summary="Obtener una submission por ID",
)
def get_submission(submission_id: str, db: Session = Depends(get_db)):
    result = SubmissionService(db).get_by_id(submission_id)
    if not result:
        raise HTTPException(status_code=404, detail="Submission no encontrada")
    return result


@router.put(
    "/{submission_id}",
    response_model=SubmissionResponse,
    summary="Actualizar source_code o exam_id de una submission",
)
def update_submission(
    submission_id: str,
    payload: SubmissionUpdate,
    db: Session = Depends(get_db),
):
    result = SubmissionService(db).update(submission_id, payload)
    if not result:
        raise HTTPException(status_code=404, detail="Submission no encontrada")
    return result


@router.delete(
    "/{submission_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar una submission",
)
def delete_submission(submission_id: str, db: Session = Depends(get_db)):
    deleted = SubmissionService(db).delete(submission_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Submission no encontrada")
