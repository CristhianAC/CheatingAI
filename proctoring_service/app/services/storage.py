"""Upload violation screenshots to Supabase Storage and return public URL."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from app.config import get_settings

logger = logging.getLogger(__name__)


def upload_violation_frame(
    session_id: str,
    frame_bytes: bytes,
    content_type: str = "image/jpeg",
) -> Optional[str]:
    """
    Upload a frame to Supabase Storage and return its public URL.
    Path: {bucket}/{session_id}/{timestamp}.jpg
    Returns None if Supabase is not configured or upload fails.
    """
    settings = get_settings()

    # Comprobar configuración básica (sin loguear secretos)
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY or not settings.SUPABASE_BUCKET:
        logger.warning(
            "Supabase storage not configured correctly: url=%s, bucket=%s, has_key=%s",
            settings.SUPABASE_URL or "<empty>",
            settings.SUPABASE_BUCKET or "<empty>",
            bool(settings.SUPABASE_SERVICE_KEY),
        )
        return None

    try:
        from supabase import create_client  # type: ignore[import]
    except ImportError:
        logger.error("Supabase client library is not installed inside proctoring container.")
        return None

    try:
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
        ext = "jpg" if "jpeg" in content_type or "jpg" in content_type else "png"
        path = f"{session_id}/{timestamp}.{ext}"

        logger.info(
            "Uploading proctoring frame to Supabase: bucket=%s, path=%s, content_type=%s",
            settings.SUPABASE_BUCKET,
            path,
            content_type,
        )

        client.storage.from_(settings.SUPABASE_BUCKET).upload(
            path,
            frame_bytes,
            file_options={"content-type": content_type},
        )

        public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{settings.SUPABASE_BUCKET}/{path}"
        logger.info("Supabase upload successful, public_url=%s", public_url)
        return public_url
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.exception("Error uploading frame to Supabase Storage: %s", exc)
        return None


def upload_identity_violation_capture(
    session_id: str,
    frame_bytes: bytes,
    content_type: str = "image/jpeg",
) -> Optional[str]:
    """
    Sube captura de identity_mismatch al bucket violation-captures.
    Ruta: violations/{session_id}/{timestamp}.jpg
    """
    settings = get_settings()
    bucket = settings.SUPABASE_VIOLATION_CAPTURES_BUCKET or "violation-captures"

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        logger.warning(
            "Supabase storage not configured for violation-captures: url=%s, has_key=%s",
            settings.SUPABASE_URL or "<empty>",
            bool(settings.SUPABASE_SERVICE_KEY),
        )
        return None

    try:
        from supabase import create_client  # type: ignore[import]
    except ImportError:
        logger.error("Supabase client library is not installed inside proctoring container.")
        return None

    try:
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
        path = f"violations/{session_id}/{timestamp}.jpg"

        logger.info(
            "Uploading identity violation capture: bucket=%s, path=%s",
            bucket,
            path,
        )

        client.storage.from_(bucket).upload(
            path,
            frame_bytes,
            file_options={"content-type": content_type},
        )

        public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"
        logger.info("Identity violation capture uploaded: %s", public_url)
        return public_url
    except Exception as exc:  # pragma: no cover
        logger.exception("Error uploading identity violation capture: %s", exc)
        return None
