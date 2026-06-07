-- Add is_shared column to quiz_sessions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='quiz_sessions' 
        AND column_name='is_shared'
    ) THEN
        ALTER TABLE public.quiz_sessions ADD COLUMN is_shared BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Allow anonymous read access to quiz sessions" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Allow anonymous read access to quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Allow anonymous read access to shared quiz sessions" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Allow anonymous read access to shared quiz questions" ON public.quiz_questions;

-- Create secure policies checking is_shared
CREATE POLICY "Allow anonymous read access to shared quiz sessions"
ON public.quiz_sessions FOR SELECT
TO anon, authenticated
USING (is_shared = true OR auth.uid() = user_id);

CREATE POLICY "Allow anonymous read access to shared quiz questions"
ON public.quiz_questions FOR SELECT
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.quiz_sessions
  WHERE quiz_sessions.id = quiz_questions.quiz_session_id
  AND (quiz_sessions.is_shared = true OR quiz_sessions.user_id = auth.uid())
));
