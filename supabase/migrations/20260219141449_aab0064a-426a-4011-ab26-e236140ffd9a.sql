
-- Create user_xp table for gamification
CREATE TABLE public.user_xp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE DEFAULT auth.uid(),
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  achievements JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_name TEXT,
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

-- All authenticated users can SELECT (needed for leaderboard)
CREATE POLICY "Authenticated users can view all user_xp"
  ON public.user_xp FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can insert their own row
CREATE POLICY "Users can insert their own user_xp"
  ON public.user_xp FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own row
CREATE POLICY "Users can update their own user_xp"
  ON public.user_xp FOR UPDATE
  USING (auth.uid() = user_id);

-- Create leaderboard view for safe public ranking
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT
  ux.user_id,
  COALESCE(ux.display_name, p.full_name, 'Anonymous') AS name,
  ux.total_xp,
  ux.level,
  p.avatar_url
FROM public.user_xp ux
LEFT JOIN public.profiles p ON p.id = ux.user_id
ORDER BY ux.total_xp DESC;

-- Add updated_at trigger
CREATE TRIGGER update_user_xp_updated_at
  BEFORE UPDATE ON public.user_xp
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
