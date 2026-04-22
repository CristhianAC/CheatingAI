from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import get_settings
from app.dependencies import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
settings = get_settings()


def _create_access_token(payload: dict) -> str:
    to_encode = payload.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar usuario y devolver JWT",
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    user = User(
        email=payload.email,
        password_hash=pwd_context.hash(payload.password),
        full_name=payload.full_name,
        role=payload.role if payload.role in {"STUDENT", "PROFESSOR"} else "STUDENT",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = _create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return TokenResponse(
        access_token=token,
        role=user.role,
        full_name=user.full_name,
        user_id=str(user.id),
    )


@router.post("/login", response_model=TokenResponse, summary="Iniciar sesión y devolver JWT")
async def login(request: Request, db: Session = Depends(get_db)):
    content_type = (request.headers.get("content-type") or "").lower()

    # Compatibilidad dual:
    # - application/json {email, password} para frontend actual
    # - application/x-www-form-urlencoded {username, password} para Swagger OAuth2
    if "application/json" in content_type:
        try:
            body = await request.json()
        except Exception:
            raise HTTPException(status_code=422, detail="JSON inválido")
        payload = LoginRequest(**body)
        email = payload.email
        password = payload.password
    else:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")
        if not username or not password:
            raise HTTPException(status_code=422, detail="Se requieren username y password")
        email = username

    user = db.query(User).filter(User.email == email).first()
    if not user or not pwd_context.verify(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = _create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    try:
        jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=500, detail="No se pudo generar el token")

    return TokenResponse(
        access_token=token,
        role=user.role,
        full_name=user.full_name,
        user_id=str(user.id),
    )
