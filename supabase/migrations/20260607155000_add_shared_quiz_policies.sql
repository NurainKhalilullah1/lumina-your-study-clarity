-- Enable anonymous select access to quiz sessions and questions for sharing.
-- We use UUIDs which act as secure capability URLs.

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read access to quiz sessions" ON public.quiz_sessions;
CREATE POLICY "Allow anonymous read access to quiz sessions"
ON public.quiz_sessions FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow anonymous read access to quiz questions" ON public.quiz_questions;
CREATE POLICY "Allow anonymous read access to quiz questions"
ON public.quiz_questions FOR SELECT
TO anon, authenticated
USING (true);
