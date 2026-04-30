
-- Part A: Add university and course_of_study to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS university text,
  ADD COLUMN IF NOT EXISTS course_of_study text;

-- Part B: Create 5 new tables

-- 1. study_groups
CREATE TABLE public.study_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university text NOT NULL,
  course_of_study text NOT NULL,
  member_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(university, course_of_study)
);

ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all study groups"
  ON public.study_groups FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 2. study_group_members
CREATE TABLE public.study_group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all group members"
  ON public.study_group_members FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own membership"
  ON public.study_group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own membership"
  ON public.study_group_members FOR DELETE
  USING (auth.uid() = user_id);

-- 3. community_posts
CREATE TABLE public.community_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'discussion',
  group_id uuid REFERENCES public.study_groups(id) ON DELETE SET NULL,
  upvote_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all posts"
  ON public.community_posts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.community_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.community_posts FOR DELETE
  USING (auth.uid() = user_id);

-- 4. community_comments
CREATE TABLE public.community_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all comments"
  ON public.community_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own comments"
  ON public.community_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.community_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.community_comments FOR DELETE
  USING (auth.uid() = user_id);

-- 5. community_upvotes
CREATE TABLE public.community_upvotes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.community_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all upvotes"
  ON public.community_upvotes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own upvotes"
  ON public.community_upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own upvotes"
  ON public.community_upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- Part C: Update profiles RLS - add policy so authenticated users can view all profiles (for community)
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Part D: upsert_user_group function
CREATE OR REPLACE FUNCTION public.upsert_user_group(p_university text, p_course_of_study text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old_group_id uuid;
  v_new_group_id uuid;
BEGIN
  -- Get the user's current group (if any)
  SELECT group_id INTO v_old_group_id
  FROM study_group_members
  WHERE user_id = auth.uid();

  -- Create the new group if it doesn't exist
  INSERT INTO study_groups (university, course_of_study)
  VALUES (p_university, p_course_of_study)
  ON CONFLICT (university, course_of_study) DO NOTHING;

  -- Get the new group id
  SELECT id INTO v_new_group_id
  FROM study_groups
  WHERE university = p_university AND course_of_study = p_course_of_study;

  -- Skip if already in the correct group
  IF v_old_group_id IS NOT NULL AND v_old_group_id = v_new_group_id THEN
    RETURN;
  END IF;

  -- Remove from old group
  IF v_old_group_id IS NOT NULL THEN
    DELETE FROM study_group_members WHERE user_id = auth.uid();
    UPDATE study_groups SET member_count = GREATEST(member_count - 1, 0) WHERE id = v_old_group_id;
  END IF;

  -- Add to new group
  INSERT INTO study_group_members (group_id, user_id)
  VALUES (v_new_group_id, auth.uid())
  ON CONFLICT (group_id, user_id) DO NOTHING;

  UPDATE study_groups SET member_count = member_count + 1 WHERE id = v_new_group_id;
END;
$$;
