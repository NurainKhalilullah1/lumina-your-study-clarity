
-- Drop the existing leaderboard view
DROP VIEW IF EXISTS public.leaderboard_view;

-- Create security definer function for leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE(user_id uuid, name text, total_xp integer, level integer, avatar_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    COALESCE(ux.display_name, p.full_name, 'Anonymous')::text AS name,
    COALESCE(ux.total_xp, 0) AS total_xp,
    COALESCE(ux.level, 1) AS level,
    p.avatar_url
  FROM profiles p
  LEFT JOIN user_xp ux ON ux.user_id = p.id
  ORDER BY COALESCE(ux.total_xp, 0) DESC
  LIMIT 50;
END;
$$;
