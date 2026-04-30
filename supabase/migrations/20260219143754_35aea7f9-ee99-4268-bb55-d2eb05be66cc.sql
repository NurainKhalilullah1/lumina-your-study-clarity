
-- 1. Add league columns to user_xp
ALTER TABLE public.user_xp
  ADD COLUMN current_league INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN weekly_xp INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN week_start DATE NOT NULL DEFAULT (date_trunc('week', now())::date);

-- Set existing users to league 2
UPDATE public.user_xp SET current_league = 2, weekly_xp = 0, week_start = date_trunc('week', now())::date;

-- 2. Create league_history table
CREATE TABLE public.league_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  league INTEGER NOT NULL,
  weekly_xp INTEGER NOT NULL DEFAULT 0,
  rank_in_league INTEGER,
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.league_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own league history"
  ON public.league_history FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Create get_league_leaderboard function
CREATE OR REPLACE FUNCTION public.get_league_leaderboard(p_league INTEGER)
RETURNS TABLE(user_id UUID, name TEXT, weekly_xp INTEGER, level INTEGER, avatar_url TEXT, current_league INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_week_start DATE := date_trunc('week', now())::date;
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    COALESCE(ux.display_name, p.full_name, 'Anonymous')::TEXT AS name,
    CASE WHEN ux.week_start = v_current_week_start THEN ux.weekly_xp ELSE 0 END AS weekly_xp,
    COALESCE(ux.level, 1) AS level,
    p.avatar_url,
    ux.current_league
  FROM user_xp ux
  JOIN profiles p ON p.id = ux.user_id
  WHERE ux.current_league = p_league
  ORDER BY (CASE WHEN ux.week_start = v_current_week_start THEN ux.weekly_xp ELSE 0 END) DESC;
END;
$$;

-- 4. Create process_league_week function
CREATE OR REPLACE FUNCTION public.process_league_week()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_week_start DATE := date_trunc('week', now())::date - INTERVAL '7 days';
  v_league INTEGER;
  v_record RECORD;
  v_rank INTEGER;
BEGIN
  FOR v_league IN 1..25 LOOP
    v_rank := 0;
    FOR v_record IN
      SELECT ux.user_id, ux.weekly_xp
      FROM user_xp ux
      WHERE ux.current_league = v_league
        AND ux.week_start = v_week_start
      ORDER BY ux.weekly_xp DESC
    LOOP
      v_rank := v_rank + 1;
      
      DECLARE
        v_outcome TEXT;
        v_new_league INTEGER;
      BEGIN
        IF v_rank <= 5 AND v_record.weekly_xp > 100 AND v_league < 25 THEN
          v_outcome := 'promoted';
          v_new_league := v_league + 1;
        ELSIF v_rank <= 15 THEN
          v_outcome := 'stayed';
          v_new_league := v_league;
        ELSE
          v_outcome := 'relegated';
          v_new_league := GREATEST(v_league - 1, 1);
        END IF;

        -- Record history
        INSERT INTO league_history (user_id, week_start, league, weekly_xp, rank_in_league, outcome)
        VALUES (v_record.user_id, v_week_start, v_league, v_record.weekly_xp, v_rank, v_outcome)
        ON CONFLICT (user_id, week_start) DO NOTHING;

        -- Update league
        UPDATE user_xp SET current_league = v_new_league WHERE user_xp.user_id = v_record.user_id;
      END;
    END LOOP;
  END LOOP;

  -- Reset weekly XP for all users
  UPDATE user_xp SET weekly_xp = 0, week_start = date_trunc('week', now())::date;
END;
$$;
