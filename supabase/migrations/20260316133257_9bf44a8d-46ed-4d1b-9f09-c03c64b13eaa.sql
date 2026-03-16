
-- Complete remaining objects that may not have been created
CREATE TABLE IF NOT EXISTS public.recommendation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  internship_id uuid NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('applied', 'saved', 'ignored', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, internship_id, action)
);

ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Students can view own feedback"
    ON public.recommendation_feedback FOR SELECT
    TO authenticated
    USING (auth.uid() = student_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Students can insert own feedback"
    ON public.recommendation_feedback FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = student_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_recommendation_cache_student ON public.recommendation_cache(student_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_student ON public.recommendation_feedback(student_id);
