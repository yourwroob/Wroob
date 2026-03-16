
-- Internship feedback from companies
CREATE TABLE IF NOT EXISTS public.internship_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  company_id uuid NOT NULL,
  internship_id uuid NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, internship_id, company_id)
);

ALTER TABLE public.internship_feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Employers can insert feedback"
  ON public.internship_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = company_id
    AND EXISTS (
      SELECT 1 FROM public.internships
      WHERE id = internship_id AND employer_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Employers can view feedback they gave"
  ON public.internship_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = company_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Students can view own feedback"
  ON public.internship_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Skill test results
CREATE TABLE IF NOT EXISTS public.skill_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  skill_name text NOT NULL,
  score numeric NOT NULL CHECK (score >= 0 AND score <= 100),
  passed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, skill_name)
);

ALTER TABLE public.skill_test_results ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Students can view own test results"
  ON public.skill_test_results FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Students can insert own test results"
  ON public.skill_test_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Students can update own test results"
  ON public.skill_test_results FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Employers can view applicant test results"
  ON public.skill_test_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.internships i ON i.id = a.internship_id
      WHERE a.student_id = skill_test_results.student_id
        AND i.employer_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_internship_feedback_student ON public.internship_feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_test_results_student ON public.skill_test_results(student_id);
