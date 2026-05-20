import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.user_profile import PhotoUploadResponse, UserProfileResponse
from app.services.profile_storage import upload_profile_reference_photo

router = APIRouter(prefix="/users", tags=["Users"])


def _to_profile(user: User) -> UserProfileResponse:
    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        photo_url=user.photo_url,
    )


@router.get("/me", response_model=UserProfileResponse, summary="Perfil del usuario autenticado")
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    try:
        uid = uuid.UUID(str(current_user["sub"]))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID de usuario inválido") from exc

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return _to_profile(user)


@router.post("/me/photo", response_model=PhotoUploadResponse, summary="Subir foto de perfil/referencia")
async def upload_my_profile_photo(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    file: UploadFile = File(...),
):
    try:
        uid = uuid.UUID(str(current_user["sub"]))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID de usuario inválido") from exc

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Archivo vacío")

    content_type = file.content_type or "image/jpeg"
    if content_type not in ("image/jpeg", "image/jpg", "image/png"):
        content_type = "image/jpeg"

    public_url = upload_profile_reference_photo(str(uid), contents, content_type=content_type)
    if not public_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo subir la imagen. Verifica SUPABASE_URL, SUPABASE_SERVICE_KEY y el bucket en el servidor.",
        )

    user.photo_url = public_url
    db.add(user)
    db.commit()
    db.refresh(user)

    return PhotoUploadResponse(photo_url=public_url, message="Foto de referencia guardada correctamente")
