-- 1. Create a secure function for OAuth users to set their initial role
-- This prevents client-side role manipulation while allowing OAuth users to pick a role
CREATE OR REPLACE FUNCTION public.set_initial_role(_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if user has NO existing role
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Role already assigned. Cannot change role after registration.';
  END IF;

  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), _role);

  -- Create role-specific profile if not exists
  IF _role = 'student' THEN
    INSERT INTO public.student_profiles (user_id)
    VALUES (auth.uid())
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF _role = 'employer' THEN
    INSERT INTO public.employer_profiles (user_id)
    VALUES (auth.uid())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Create general profile if not exists
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (auth.uid(), COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = auth.uid()),
    ''
  ))
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- 2. Update handle_new_user trigger to NOT default OAuth users to 'student'
-- Only assign role if explicitly provided in metadata (email/password signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role_text text;
  _role app_role;
BEGIN
  _role_text := NEW.raw_user_meta_data->>'role';
  
  -- Create general profile always
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''));

  -- Only assign role if explicitly provided (email/password signup)
  IF _role_text IS NOT NULL AND _role_text IN ('student', 'employer') THEN
    _role := _role_text::app_role;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role);
    
    IF _role = 'student' THEN
      INSERT INTO public.student_profiles (user_id) VALUES (NEW.id);
    ELSIF _role = 'employer' THEN
      INSERT INTO public.employer_profiles (user_id) VALUES (NEW.id);
    END IF;
  END IF;
  -- OAuth users without role metadata will go through SelectRole page
  
  RETURN NEW;
END;
$$;

-- 3. Create rate_limits table for edge function rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  timestamps bigint[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, function_name)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No client access to rate_limits - only service role (edge functions)
-- No RLS policies needed since we want to block all client access