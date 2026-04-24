"""Subida de fotos de perfil a Supabase Storage."""

from __future__ import annotations

import logging
from typing import Optional

from app.config import get_settings

logger = logging.getLogger(__name__)


def upload_profile_reference_photo(user_id: str, contents: bytes, content_type: str = "image/jpeg") -> Optional[str]:
    """
    Sube reference.jpg al bucket configurado y devuelve la URL pública.
    Retorna None si Supabase no está configurado o falla el upload.
    """
    settings = get_settings()
    bucket = settings.SUPABASE_PROFILE_BUCKET
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY or not bucket:
        logger.warning(
            "Supabase profile storage no configurado: url=%s, bucket=%s, has_key=%s",
            settings.SUPABASE_URL or "<empty>",
            bucket or "<empty>",
            bool(settings.SUPABASE_SERVICE_KEY),
        )
        return None

    try:
        from supabase import create_client  # type: ignore[import]
    except ImportError:
        logger.error("La librería supabase no está instalada en el contenedor API.")
        return None

    path = f"{user_id}/reference.jpg"
    try:
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        client.storage.from_(bucket).upload(
            path,
            contents,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"
        return public_url
    except Exception:
        logger.exception("Error subiendo foto de perfil a Supabase")
        return None
