-- Allow students to view other student profiles for the discovery page
CREATE POLICY "Students can view other student profiles"
ON public.student_profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'student'::app_role));