from pydantic import BaseModel


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    photo_url: str | None = None


class PhotoUploadResponse(BaseModel):
    photo_url: str
    message: str
