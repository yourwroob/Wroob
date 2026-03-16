
-- Database function to recalculate reputation score
CREATE OR REPLACE FUNCTION public.update_student_reputation(_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _completed integer;
  _internship_score numeric;
  _avg_skill numeric;
  _skill_score numeric;
  _avg_feedback numeric;
  _feedback_score numeric;
  _profile_completeness numeric;
  _profile_score numeric;
  _total numeric;
BEGIN
  -- 1. Internship completion score (40% weight, max 40 points)
  SELECT COUNT(*) INTO _completed
  FROM public.applications
  WHERE student_id = _student_id AND status = 'accepted';
  
  _internship_score := LEAST(_completed * 10, 40);

  -- 2. Skill test score (25% weight, max 25 points)
  SELECT COALESCE(AVG(score), 0) INTO _avg_skill
  FROM public.skill_test_results
  WHERE student_id = _student_id AND passed = true;
  
  _skill_score := _avg_skill * 0.25;

  -- 3. Company feedback score (25% weight, max 25 points)
  SELECT COALESCE(AVG(rating), 0) INTO _avg_feedback
  FROM public.internship_feedback
  WHERE student_id = _student_id;
  
  _feedback_score := _avg_feedback * 5;

  -- 4. Profile strength (10% weight, max 10 points)
  SELECT (
    CASE WHEN sp.university IS NOT NULL AND sp.university != '' THEN 1 ELSE 0 END +
    CASE WHEN sp.major IS NOT NULL AND sp.major != '' THEN 1 ELSE 0 END +
    CASE WHEN sp.skills IS NOT NULL AND array_length(sp.skills, 1) > 0 THEN 1 ELSE 0 END +
    CASE WHEN sp.resume_url IS NOT NULL AND sp.resume_url != '' THEN 1 ELSE 0 END +
    CASE WHEN sp.location IS NOT NULL AND sp.location != '' THEN 1 ELSE 0 END +
    CASE WHEN sp.linkedin_url IS NOT NULL AND sp.linkedin_url != '' THEN 1 ELSE 0 END +
    CASE WHEN p.bio IS NOT NULL AND p.bio != '' THEN 1 ELSE 0 END +
    CASE WHEN p.avatar_url IS NOT NULL AND p.avatar_url != '' THEN 1 ELSE 0 END +
    CASE WHEN sp.graduation_year IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN sp.experience_years IS NOT NULL AND sp.experience_years != '' THEN 1 ELSE 0 END
  )::numeric / 10
  INTO _profile_completeness
  FROM public.student_profiles sp
  LEFT JOIN public.profiles p ON p.user_id = sp.user_id
  WHERE sp.user_id = _student_id;

  _profile_score := COALESCE(_profile_completeness, 0) * 10;

  -- Final score clamped 0-100
  _total := LEAST(GREATEST(
    _internship_score + _skill_score + _feedback_score + _profile_score
  , 0), 100);

  -- Update student_profiles
  UPDATE public.student_profiles SET
    reputation_score = _total,
    completed_internships = _completed,
    skill_test_score = _skill_score,
    company_feedback_score = _feedback_score,
    profile_strength_score = _profile_score
  WHERE user_id = _student_id;
END;
$$;
