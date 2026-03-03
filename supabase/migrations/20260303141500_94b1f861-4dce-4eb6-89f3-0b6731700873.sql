
-- Add onboarding fields to employer_profiles
ALTER TABLE public.employer_profiles
ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS onboarding_step integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS company_domain text,
ADD COLUMN IF NOT EXISTS hiring_roles text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS funding_stage text,
ADD COLUMN IF NOT EXISTS work_email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_domain text,
ADD COLUMN IF NOT EXISTS verification_method text,
ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Create employer_invitations table
CREATE TABLE IF NOT EXISTS public.employer_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid NOT NULL,
  email text NOT NULL,
  invitation_role text NOT NULL DEFAULT 'recruiter',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(inviter_id, email)
);

ALTER TABLE public.employer_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can view own invitations" ON public.employer_invitations FOR SELECT USING (auth.uid() = inviter_id);
CREATE POLICY "Employers can insert invitations" ON public.employer_invitations FOR INSERT WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "Employers can delete own invitations" ON public.employer_invitations FOR DELETE USING (auth.uid() = inviter_id);
