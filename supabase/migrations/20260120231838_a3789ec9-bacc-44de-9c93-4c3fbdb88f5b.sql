-- Create quiz_sessions table to track quiz attempts
CREATE TABLE public.quiz_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_name TEXT,
  document_content TEXT,
  num_questions INTEGER NOT NULL DEFAULT 70,
  time_limit_minutes INTEGER NOT NULL DEFAULT 45,
  score INTEGER,
  total_questions INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_questions table to store generated questions
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  user_answer TEXT,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on quiz_sessions
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quiz_sessions
CREATE POLICY "Users can view their own quiz sessions"
ON public.quiz_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz sessions"
ON public.quiz_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz sessions"
ON public.quiz_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quiz sessions"
ON public.quiz_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on quiz_questions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quiz_questions (via quiz_sessions ownership)
CREATE POLICY "Users can view questions in their quiz sessions"
ON public.quiz_questions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.quiz_sessions
  WHERE quiz_sessions.id = quiz_questions.quiz_session_id
  AND quiz_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can insert questions in their quiz sessions"
ON public.quiz_questions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.quiz_sessions
  WHERE quiz_sessions.id = quiz_questions.quiz_session_id
  AND quiz_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can update questions in their quiz sessions"
ON public.quiz_questions FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.quiz_sessions
  WHERE quiz_sessions.id = quiz_questions.quiz_session_id
  AND quiz_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can delete questions in their quiz sessions"
ON public.quiz_questions FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.quiz_sessions
  WHERE quiz_sessions.id = quiz_questions.quiz_session_id
  AND quiz_sessions.user_id = auth.uid()
));

-- Create index for faster quiz question lookups
CREATE INDEX idx_quiz_questions_session_id ON public.quiz_questions(quiz_session_id);
CREATE INDEX idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);