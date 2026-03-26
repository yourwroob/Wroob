CREATE POLICY "Admins can update employer profiles"
ON public.employer_profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));