-- =============================================================================
-- FIX (HIGH-closed-internship-rls): Students cannot view internships after close
--
-- The existing RLS policy "Anyone can view published internships" only permits
-- SELECT when status = 'published'. When an employer closes a listing, the row
-- becomes invisible to students — including those who already applied — causing
-- the InternshipDetail page to return "Internship not found."
--
-- Fix: add a permissive SELECT policy that allows a student to view any
-- internship they have a row in `applications` for, provided the internship is
-- not a draft. This is defence-in-depth: the fixed apply_to_internship_atomic
-- already prevents applications to drafts, so the `status != 'draft'` guard
-- here is an additional safety net, not the primary control.
--
-- The new policy is OR-combined with existing policies (standard Postgres RLS
-- behaviour for permissive policies on the same table).
-- =============================================================================

CREATE POLICY "Applicants can view their applied internships"
  ON public.internships
  FOR SELECT
  TO authenticated
  USING (
    internships.status != 'draft'
    AND EXISTS (
      SELECT 1
      FROM public.applications
      WHERE applications.internship_id = internships.id
        AND applications.student_id    = auth.uid()
    )
  );
