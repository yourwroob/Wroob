-- Drop trigger and function for post caption validation
DROP FUNCTION IF EXISTS public.validate_post_caption() CASCADE;

-- Drop all RLS policies on posts table
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

-- Drop the posts table
DROP TABLE IF EXISTS public.posts;