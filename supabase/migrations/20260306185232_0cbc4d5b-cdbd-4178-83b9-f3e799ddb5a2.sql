
-- Add geo columns to student_profiles
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS geohash text;

-- Create groups table
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('geo', 'cohort')),
  geohash text,
  label text NOT NULL,
  centroid_lat double precision,
  centroid_lng double precision,
  company_id text,
  internship_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create group_members table (normalized, better for RLS than arrays)
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create group_messages table
CREATE TABLE public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid NOT NULL,
  sender_name text NOT NULL DEFAULT '',
  text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Groups: members can read their groups
CREATE POLICY "Members can view their groups"
  ON public.groups FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
  ));

-- Group members: members can see other members in their groups
CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.group_members my WHERE my.group_id = group_members.group_id AND my.user_id = auth.uid()
  ));

-- Group messages: members can read messages
CREATE POLICY "Members can read group messages"
  ON public.group_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_messages.group_id AND gm.user_id = auth.uid()
  ));

-- Group messages: members can send messages
CREATE POLICY "Members can send group messages"
  ON public.group_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_messages.group_id AND gm.user_id = auth.uid()
    )
  );

-- Enable realtime for group_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- Create function for cohort group assignment (triggered when application status changes to accepted)
CREATE OR REPLACE FUNCTION public.assign_cohort_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _employer_id uuid;
  _company_name text;
  _intern_title text;
  _group_id uuid;
  _deterministic_id text;
BEGIN
  -- Only trigger on acceptance
  IF NEW.status != 'accepted' THEN RETURN NEW; END IF;
  IF OLD IS NOT NULL AND OLD.status = 'accepted' THEN RETURN NEW; END IF;

  -- Get internship info
  SELECT employer_id, title INTO _employer_id, _intern_title
  FROM public.internships WHERE id = NEW.internship_id;

  -- Get company name
  SELECT company_name INTO _company_name
  FROM public.employer_profiles WHERE user_id = _employer_id;

  -- Deterministic group lookup: one cohort per internship
  SELECT id INTO _group_id FROM public.groups
  WHERE type = 'cohort' AND internship_id = NEW.internship_id;

  IF _group_id IS NULL THEN
    INSERT INTO public.groups (type, label, company_id, internship_id)
    VALUES ('cohort', COALESCE(_company_name, 'Company') || ' — ' || COALESCE(_intern_title, 'Intern') || ' Cohort', _employer_id::text, NEW.internship_id)
    RETURNING id INTO _group_id;
  END IF;

  -- Add student to group (ignore if already member)
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (_group_id, NEW.student_id)
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger on applications
CREATE TRIGGER on_application_accepted
  AFTER INSERT OR UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_cohort_group();
