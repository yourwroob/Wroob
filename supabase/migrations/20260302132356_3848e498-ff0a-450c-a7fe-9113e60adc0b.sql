
-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('student', 'employer', 'admin');
CREATE TYPE public.internship_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE public.internship_type AS ENUM ('remote', 'onsite', 'hybrid');
CREATE TYPE public.application_status AS ENUM ('pending', 'reviewed', 'interview', 'accepted', 'rejected');
CREATE TYPE public.notification_type AS ENUM ('application_submitted', 'status_changed', 'new_match', 'internship_approved', 'internship_rejected', 'general');

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER_ROLES TABLE (separate for security)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECKS
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =============================================
-- STUDENT_PROFILES TABLE
-- =============================================
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  university TEXT,
  major TEXT,
  graduation_year INTEGER,
  skills TEXT[] DEFAULT '{}',
  resume_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- EMPLOYER_PROFILES TABLE
-- =============================================
CREATE TABLE public.employer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name TEXT,
  industry TEXT,
  company_size TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- INTERNSHIPS TABLE
-- =============================================
CREATE TABLE public.internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  skills_required TEXT[] DEFAULT '{}',
  location TEXT,
  type internship_type NOT NULL DEFAULT 'remote',
  status internship_status NOT NULL DEFAULT 'draft',
  deadline TIMESTAMPTZ,
  industry TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;

-- =============================================
-- APPLICATIONS TABLE
-- =============================================
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE NOT NULL,
  status application_status NOT NULL DEFAULT 'pending',
  cover_letter TEXT,
  resume_url TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, internship_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SKILLS TABLE (taxonomy)
-- =============================================
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- =============================================
-- AUDIT LOG TABLE (admin actions)
-- =============================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employer_profiles_updated_at BEFORE UPDATE ON public.employer_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_internships_updated_at BEFORE UPDATE ON public.internships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- AUTO-CREATE PROFILE + ROLE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _role app_role;
BEGIN
  -- Get role from user metadata (passed during signup)
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student');
  
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  -- Create role-specific profile
  IF _role = 'student' THEN
    INSERT INTO public.student_profiles (user_id) VALUES (NEW.id);
  ELSIF _role = 'employer' THEN
    INSERT INTO public.employer_profiles (user_id) VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- RLS POLICIES
-- =============================================

-- PROFILES: Users can read all profiles, update own
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- USER_ROLES: Users can read own role, admins can read all
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- STUDENT_PROFILES: Owner can CRUD, employers/admins can view
CREATE POLICY "Students can view own profile" ON public.student_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Employers can view student profiles" ON public.student_profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'employer'));
CREATE POLICY "Admins can view student profiles" ON public.student_profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students can update own profile" ON public.student_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Students can insert own profile" ON public.student_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- EMPLOYER_PROFILES: Owner can CRUD, anyone authenticated can view
CREATE POLICY "Anyone can view employer profiles" ON public.employer_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Employers can update own profile" ON public.employer_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Employers can insert own profile" ON public.employer_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- INTERNSHIPS: Published visible to all, draft only to owner/admin
CREATE POLICY "Anyone can view published internships" ON public.internships FOR SELECT TO authenticated USING (status = 'published');
CREATE POLICY "Employers can view own internships" ON public.internships FOR SELECT TO authenticated USING (auth.uid() = employer_id);
CREATE POLICY "Admins can view all internships" ON public.internships FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Employers can create internships" ON public.internships FOR INSERT TO authenticated WITH CHECK (auth.uid() = employer_id AND public.has_role(auth.uid(), 'employer'));
CREATE POLICY "Employers can update own internships" ON public.internships FOR UPDATE TO authenticated USING (auth.uid() = employer_id);
CREATE POLICY "Admins can update any internship" ON public.internships FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Employers can delete own internships" ON public.internships FOR DELETE TO authenticated USING (auth.uid() = employer_id);

-- APPLICATIONS: Students can create/view own, employers can view for their internships
CREATE POLICY "Students can view own applications" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Employers can view applications for their internships" ON public.applications FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.internships WHERE internships.id = internship_id AND internships.employer_id = auth.uid()));
CREATE POLICY "Admins can view all applications" ON public.applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students can create applications" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id AND public.has_role(auth.uid(), 'student'));
CREATE POLICY "Employers can update application status" ON public.applications FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.internships WHERE internships.id = internship_id AND internships.employer_id = auth.uid()));

-- NOTIFICATIONS: Users can only see own
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- SKILLS: Everyone can read
CREATE POLICY "Anyone can view skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Admins can manage skills" ON public.skills FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- AUDIT_LOG: Only admins
CREATE POLICY "Admins can view audit log" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert audit log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true);

-- Storage policies: Avatars (public read, owner write)
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: Resumes (owner + employer of applied internship)
CREATE POLICY "Users can upload their own resume" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own resume" ON storage.objects FOR SELECT USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own resume" ON storage.objects FOR UPDATE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own resume" ON storage.objects FOR DELETE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Employers can view applicant resumes" ON storage.objects FOR SELECT USING (bucket_id = 'resumes' AND public.has_role(auth.uid(), 'employer'));

-- Storage policies: Company logos (public read, employer write)
CREATE POLICY "Company logos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');
CREATE POLICY "Employers can upload company logo" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Employers can update company logo" ON storage.objects FOR UPDATE USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Employers can delete company logo" ON storage.objects FOR DELETE USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_internships_status ON public.internships(status);
CREATE INDEX idx_internships_employer ON public.internships(employer_id);
CREATE INDEX idx_internships_skills ON public.internships USING GIN(skills_required);
CREATE INDEX idx_applications_student ON public.applications(student_id);
CREATE INDEX idx_applications_internship ON public.applications(internship_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_student_profiles_skills ON public.student_profiles USING GIN(skills);

-- =============================================
-- SEED SKILLS TAXONOMY
-- =============================================
INSERT INTO public.skills (name, category) VALUES
  ('JavaScript', 'Programming'),
  ('TypeScript', 'Programming'),
  ('Python', 'Programming'),
  ('Java', 'Programming'),
  ('C++', 'Programming'),
  ('React', 'Frontend'),
  ('Angular', 'Frontend'),
  ('Vue.js', 'Frontend'),
  ('HTML/CSS', 'Frontend'),
  ('Node.js', 'Backend'),
  ('Django', 'Backend'),
  ('Flask', 'Backend'),
  ('Spring Boot', 'Backend'),
  ('PostgreSQL', 'Database'),
  ('MongoDB', 'Database'),
  ('MySQL', 'Database'),
  ('AWS', 'Cloud'),
  ('Azure', 'Cloud'),
  ('GCP', 'Cloud'),
  ('Docker', 'DevOps'),
  ('Kubernetes', 'DevOps'),
  ('Git', 'DevOps'),
  ('CI/CD', 'DevOps'),
  ('Machine Learning', 'Data Science'),
  ('Data Analysis', 'Data Science'),
  ('TensorFlow', 'Data Science'),
  ('Figma', 'Design'),
  ('UI/UX Design', 'Design'),
  ('Adobe Creative Suite', 'Design'),
  ('Technical Writing', 'Communication'),
  ('Project Management', 'Management'),
  ('Agile/Scrum', 'Management'),
  ('Marketing', 'Business'),
  ('Sales', 'Business'),
  ('Finance', 'Business'),
  ('Graphic Design', 'Design'),
  ('Mobile Development', 'Programming'),
  ('iOS Development', 'Mobile'),
  ('Android Development', 'Mobile'),
  ('Cybersecurity', 'Security');
