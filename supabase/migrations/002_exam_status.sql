-- 002_exam_status.sql
-- Adds exam status + ends_at and ensures unique code.

-- 1) status column with CHECK and default
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS status varchar NOT NULL DEFAULT 'scheduled';

DO $$
BEGIN
  -- Add CHECK constraint only if missing
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'exams_status_check'
      AND conrelid = 'public.exams'::regclass
  ) THEN
    ALTER TABLE public.exams
      ADD CONSTRAINT exams_status_check
      CHECK (status IN ('scheduled', 'active', 'finished'));
  END IF;
END $$;

-- 2) ends_at generated column when supported, else normal column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'exams'
      AND column_name = 'ends_at'
  ) THEN
    BEGIN
      EXECUTE $sql$
        ALTER TABLE public.exams
          ADD COLUMN ends_at timestamptz
          GENERATED ALWAYS AS (
            scheduled_at + (duration_minutes * INTERVAL '1 minute')
          ) STORED
      $sql$;
    EXCEPTION
      WHEN others THEN
        -- Fallback: older Postgres or generated columns not supported
        EXECUTE 'ALTER TABLE public.exams ADD COLUMN ends_at timestamptz';
    END;
  END IF;
END $$;

-- 3) Ensure UNIQUE index on code
CREATE UNIQUE INDEX IF NOT EXISTS exams_code_unique_idx ON public.exams (code);

