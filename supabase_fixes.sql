-- Fix 400 Bad Request error by adding missing foreign keys
-- Make sure the foreign keys exist and reference profiles(id)
ALTER TABLE public.community_posts
  DROP CONSTRAINT IF EXISTS community_posts_user_id_fkey;
ALTER TABLE public.community_posts
  ADD CONSTRAINT community_posts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.community_comments
  DROP CONSTRAINT IF EXISTS community_comments_user_id_fkey;
ALTER TABLE public.community_comments
  ADD CONSTRAINT community_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Also verify user_xp has a unique constraint on user_id (required for upsert)
ALTER TABLE public.user_xp 
  DROP CONSTRAINT IF EXISTS user_xp_user_id_key;
ALTER TABLE public.user_xp 
  ADD CONSTRAINT user_xp_user_id_key UNIQUE (user_id);

-- Auto-assign existing users to study groups based on university and department
DO $$
DECLARE
    profile_record RECORD;
    v_group_id UUID;
    v_university TEXT;
    v_course TEXT;
BEGIN
    FOR profile_record IN SELECT id, university, course_of_study FROM public.profiles
    LOOP
        v_university := profile_record.university;
        v_course := profile_record.course_of_study;

        -- Only assign if university and course are set
        IF v_university IS NOT NULL AND v_university != '' AND v_course IS NOT NULL AND v_course != '' THEN
            -- Check if group exists, if not create it
            SELECT id INTO v_group_id
            FROM public.study_groups
            WHERE university = v_university AND course_of_study = v_course
            LIMIT 1;

            IF v_group_id IS NULL THEN
                v_group_id := gen_random_uuid();
                INSERT INTO public.study_groups (id, university, course_of_study, member_count)
                VALUES (v_group_id, v_university, v_course, 0);
            END IF;

            -- Check if user is already in the group
            IF NOT EXISTS (
                SELECT 1 FROM public.study_group_members 
                WHERE user_id = profile_record.id AND group_id = v_group_id
            ) THEN
                -- Insert into group
                INSERT INTO public.study_group_members (user_id, group_id)
                VALUES (profile_record.id, v_group_id);

                -- Update member count
                UPDATE public.study_groups
                SET member_count = member_count + 1
                WHERE id = v_group_id;
            END IF;
        END IF;
    END LOOP;
END;
$$;
