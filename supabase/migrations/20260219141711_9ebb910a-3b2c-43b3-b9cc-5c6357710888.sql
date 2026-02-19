
-- Fix security definer view by recreating with security_invoker = true
DROP VIEW IF EXISTS public.leaderboard_view;
CREATE VIEW public.leaderboard_view WITH (security_invoker = true) AS
SELECT
  ux.user_id,
  COALESCE(ux.display_name, p.full_name, 'Anonymous') AS name,
  ux.total_xp,
  ux.level,
  p.avatar_url
FROM public.user_xp ux
LEFT JOIN public.profiles p ON p.id = ux.user_id
ORDER BY ux.total_xp DESC;
