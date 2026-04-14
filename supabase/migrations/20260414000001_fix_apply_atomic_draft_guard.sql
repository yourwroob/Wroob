-- =============================================================================
-- FIX (CRITICAL-draft-apply): apply_to_internship_atomic accepted draft internships
--
-- The function is SECURITY DEFINER and bypasses RLS entirely. It previously
-- only checked `status = 'closed'`, so a student could POST directly to the
-- edge function with a draft internship UUID and have an application row
-- inserted for an unpublished listing.
--
-- Fix: replace the `status = 'closed'` guard with a `status != 'published'`
-- guard so draft, closed, and any future non-published statuses are all
-- rejected atomically inside the locked transaction.
--
-- Draft internships return NOT_FOUND (same as missing row) so callers cannot
-- enumerate draft UUIDs through error-code enumeration.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.apply_to_internship_atomic(
  p_student_id    UUID,
  p_internship_id UUID,
  p_cover_letter  TEXT DEFAULT NULL
)
RETURNS TABLE (
  success           BOOLEAN,
  error_code        TEXT,
  error_message     TEXT,
  application_count INT,
  app_cap           INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_internship internships%ROWTYPE;
  v_new_count  INT;
BEGIN
  -- Lock the internship row for the duration of this transaction.
  -- All concurrent callers for the same internship serialize here.
  SELECT * INTO v_internship
  FROM internships
  WHERE id = p_internship_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'NOT_FOUND'::TEXT, 'Internship not found'::TEXT, 0, 0;
    RETURN;
  END IF;

  -- FIX (CRITICAL-draft-apply): Require status = 'published'.
  -- Previously only 'closed' was blocked; draft internships were silently accepted.
  -- Draft returns NOT_FOUND to avoid leaking that the internship exists at all.
  IF v_internship.status != 'published' THEN
    RETURN QUERY SELECT
      FALSE,
      CASE v_internship.status
        WHEN 'draft'  THEN 'NOT_FOUND'::TEXT
        ELSE               'CLOSED'::TEXT
      END,
      CASE v_internship.status
        WHEN 'draft'  THEN 'Internship not found'::TEXT
        ELSE               'This internship is no longer accepting applications'::TEXT
      END,
      v_internship.application_count,
      v_internship.app_cap;
    RETURN;
  END IF;

  -- 2X Rule: enforce at DB level, not in application code
  IF v_internship.application_count >= v_internship.app_cap THEN
    RETURN QUERY SELECT FALSE, 'CAPACITY_REACHED'::TEXT,
      format('Applications are full (%s/%s).',
             v_internship.application_count, v_internship.app_cap)::TEXT,
      v_internship.application_count, v_internship.app_cap;
    RETURN;
  END IF;

  -- Duplicate application check
  IF EXISTS (
    SELECT 1 FROM applications
    WHERE student_id = p_student_id AND internship_id = p_internship_id
  ) THEN
    RETURN QUERY SELECT FALSE, 'DUPLICATE'::TEXT,
      'You have already applied to this internship.'::TEXT,
      v_internship.application_count, v_internship.app_cap;
    RETURN;
  END IF;

  -- Insert application (unique constraint handles any residual race)
  INSERT INTO applications (student_id, internship_id, cover_letter)
  VALUES (p_student_id, p_internship_id, p_cover_letter);

  -- Atomically increment counter (within the same locked transaction)
  v_new_count := v_internship.application_count + 1;

  UPDATE internships
  SET
    application_count = v_new_count,
    status = CASE WHEN v_new_count >= v_internship.app_cap THEN 'closed'::internship_status ELSE status END
  WHERE id = p_internship_id;

  RETURN QUERY SELECT TRUE, NULL::TEXT, NULL::TEXT, v_new_count, v_internship.app_cap;
END;
$$;
