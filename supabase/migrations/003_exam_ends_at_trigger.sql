-- 003_exam_ends_at_trigger.sql
-- If ends_at is not a generated column, keep it updated via trigger + backfill.

-- Backfill existing rows where derivable
UPDATE public.exams
SET ends_at = scheduled_at + (duration_minutes * INTERVAL '1 minute')
WHERE ends_at IS NULL
  AND scheduled_at IS NOT NULL
  AND duration_minutes IS NOT NULL
  AND duration_minutes > 0;

-- Function to compute ends_at
CREATE OR REPLACE FUNCTION public.set_exam_ends_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.scheduled_at IS NOT NULL AND NEW.duration_minutes IS NOT NULL AND NEW.duration_minutes > 0 THEN
    NEW.ends_at := NEW.scheduled_at + (NEW.duration_minutes * INTERVAL '1 minute');
  ELSE
    NEW.ends_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_set_exam_ends_at'
      AND tgrelid = 'public.exams'::regclass
  ) THEN
    CREATE TRIGGER trg_set_exam_ends_at
    BEFORE INSERT OR UPDATE OF scheduled_at, duration_minutes
    ON public.exams
    FOR EACH ROW
    EXECUTE FUNCTION public.set_exam_ends_at();
  END IF;
END $$;

