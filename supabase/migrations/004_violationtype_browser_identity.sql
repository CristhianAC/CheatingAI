-- Ampliar enum violationtype (Procto): eventos de navegador e identidad.
-- Valores en MAYÚSCULAS, alineados con proctoring_service/app/models/violation.py

ALTER TYPE violationtype ADD VALUE IF NOT EXISTS 'TAB_SWITCH';
ALTER TYPE violationtype ADD VALUE IF NOT EXISTS 'WINDOW_BLUR';
ALTER TYPE violationtype ADD VALUE IF NOT EXISTS 'IDENTITY_MISMATCH';
