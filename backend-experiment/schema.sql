-- ============================================================
-- StudyFlow - Neon PostgreSQL Schema (Force Recreate)
-- ============================================================

-- Clean start for development migration
DROP VIEW IF EXISTS public.leaderboard_view CASCADE;
DROP TABLE IF EXISTS public.weekly_goals CASCADE;
DROP TABLE IF EXISTS public.user_xp CASCADE;
DROP TABLE IF EXISTS public.study_events CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.quiz_sessions CASCADE;
DROP TABLE IF EXISTS public.flashcards CASCADE;
DROP TABLE IF EXISTS public.flashcard_decks CASCADE;
DROP TABLE IF EXISTS public.user_files CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.leagues CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.app_versions CASCADE;
DROP TABLE IF EXISTS public.upgrade_requests CASCADE;

-- ─────────────────────── HELPERS ────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ─────────────────────── PROFILES ───────────────────────────

CREATE TABLE public.profiles (
  id            TEXT PRIMARY KEY,              -- Clerk user ID
  email         TEXT,
  full_name     TEXT,
  avatar_url    TEXT,
  role          TEXT DEFAULT 'user',
  university    TEXT,
  course_of_study TEXT,
  is_premium    BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'free',
  storage_limit_bytes BIGINT DEFAULT 104857600, -- 100MB default
  storage_used_bytes BIGINT DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────── CONVERSATIONS ──────────────────────

CREATE TABLE public.conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL DEFAULT 'New Chat',
  context_type  TEXT DEFAULT 'general',
  context_file_path TEXT,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────── MESSAGES ───────────────────────────

CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ─────────────────────── USER FILES ─────────────────────────

CREATE TABLE public.user_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_path   TEXT NOT NULL,            -- Cloudinary URL
  file_size   INTEGER,
  mime_type   TEXT,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ─────────────────────── FLASHCARDS ─────────────────────────

CREATE TABLE public.flashcard_decks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER update_flashcard_decks_updated_at
BEFORE UPDATE ON public.flashcard_decks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.flashcards (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id    UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  front      TEXT NOT NULL,
  back       TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ─────────────────────── QUIZZES ────────────────────────────

CREATE TABLE public.quiz_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_name TEXT,
  document_content TEXT,
  num_questions INTEGER NOT NULL DEFAULT 5,
  time_limit_minutes INTEGER NOT NULL DEFAULT 15,
  score         INTEGER,
  total_questions INTEGER,
  started_at    TIMESTAMP WITH TIME ZONE,
  completed_at  TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.quiz_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question       TEXT NOT NULL,
  options        JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  user_answer    TEXT,
  is_flagged     BOOLEAN DEFAULT false,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ─────────────────────── STUDY EVENTS ───────────────────────

CREATE TABLE public.study_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ─────────────────────── USER XP ────────────────────────────

CREATE TABLE public.user_xp (
  user_id       TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp      INTEGER NOT NULL DEFAULT 0,
  level         INTEGER NOT NULL DEFAULT 1,
  achievements  JSONB NOT NULL DEFAULT '[]',
  weekly_xp     INTEGER NOT NULL DEFAULT 0,
  week_start    DATE,
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_league INTEGER DEFAULT 1
);

-- ─────────────────────── WEEKLY GOALS ───────────────────────

CREATE TABLE public.weekly_goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start    DATE NOT NULL,
  quiz_target   INTEGER DEFAULT 5,
  flashcard_target INTEGER DEFAULT 50,
  study_minutes_target INTEGER DEFAULT 300,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

CREATE TRIGGER update_weekly_goals_updated_at
BEFORE UPDATE ON public.weekly_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────── LEAGUES ────────────────────────────

CREATE TABLE public.leagues (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  min_xp     INTEGER NOT NULL DEFAULT 0,
  max_xp     INTEGER,
  icon       TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ─────────────────────── COURSES ─────────────────────────────

CREATE TABLE public.courses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  code       TEXT,
  color      TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ─────────────────────── ASSIGNMENTS ────────────────────────

CREATE TABLE public.assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  course_name TEXT,
  due_date    TIMESTAMP WITH TIME ZONE,
  priority    TEXT DEFAULT 'medium',
  status      TEXT DEFAULT 'pending',
  type        TEXT DEFAULT 'assignment',
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ─────────────────────── APP VERSIONS ───────────────────────

CREATE TABLE public.app_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_name  TEXT NOT NULL,
  version_code  INTEGER NOT NULL,
  download_url  TEXT NOT NULL,
  release_notes TEXT,
  is_mandatory  BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ─────────────────────── UPGRADE REQUESTS ───────────────────

CREATE TABLE public.upgrade_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_tier    TEXT NOT NULL,
  amount            NUMERIC NOT NULL,
  payment_reference TEXT,
  receipt_url       TEXT,
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note        TEXT,
  reviewed_at       TIMESTAMP WITH TIME ZONE,
  reviewed_by       TEXT REFERENCES public.profiles(id),
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_upgrade_requests_user_id ON public.upgrade_requests(user_id);
CREATE INDEX idx_upgrade_requests_status ON public.upgrade_requests(status);

-- ─────────────────────── INDEXES ────────────────────────────

CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);
CREATE INDEX idx_quiz_questions_session_id ON public.quiz_questions(quiz_session_id);
CREATE INDEX idx_weekly_goals_user_id ON public.weekly_goals(user_id);
CREATE INDEX idx_study_events_user_id ON public.study_events(user_id);

-- ─────────────────────── LEADERBOARD VIEW ───────────────────

CREATE VIEW public.leaderboard_view AS
SELECT
  p.id,
  p.full_name,
  p.avatar_url,
  p.university,
  p.course_of_study,
  COALESCE(ux.total_xp, 0) AS total_xp,
  COALESCE(ux.level, 1) AS level
FROM public.profiles p
LEFT JOIN public.user_xp ux ON ux.user_id = p.id
ORDER BY total_xp DESC
LIMIT 50;

-- ─────────────────────── SEED DATA ──────────────────────────

INSERT INTO public.leagues (name, min_xp, max_xp, icon) VALUES
  ('Bronze',   0,    499,  '🥉'),
  ('Silver',   500,  1499, '🥈'),
  ('Gold',     1500, 2999, '🥇'),
  ('Platinum', 3000, 4999, '💎'),
  ('Diamond',  5000, NULL, '💠');
