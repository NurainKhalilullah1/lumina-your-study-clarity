-- ============================================================
-- push_tokens table
-- Stores FCM device/browser tokens per user for push notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       text        NOT NULL,
  platform    text        NOT NULL CHECK (platform IN ('web', 'android', 'ios')),
  created_at  timestamptz DEFAULT now(),
  last_seen   timestamptz DEFAULT now(),
  CONSTRAINT push_tokens_token_unique UNIQUE (token)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS push_tokens_user_id_idx ON public.push_tokens (user_id);

-- RLS: users can only manage their own tokens
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own push tokens"
  ON public.push_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS (needed for Edge Function to read all tokens and delete dead ones)
CREATE POLICY "service role full access"
  ON public.push_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- pg_cron schedule — 3 daily tip notifications
-- ============================================================

-- Enable required extensions (safe to run if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Helper function: HTTP POST to trigger the send-study-tip Edge Function
CREATE OR REPLACE FUNCTION public.trigger_study_tip_notification()
RETURNS void
LANGUAGE sql
AS $$
  SELECT net.http_post(
    url     := 'https://qecpaduxewgnumrjrroo.functions.supabase.co/send-study-tip',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body    := '{}'::jsonb
  );
$$;

-- Schedule: 3 times daily (UTC times — adjust for your target timezone)
--   07:00 UTC = 08:00 WAT (Nigeria/Lagos) — morning tip
--   11:00 UTC = 12:00 WAT — midday tip
--   17:00 UTC = 18:00 WAT — evening tip

SELECT cron.schedule(
  'studyflow-morning-tip',
  '0 7 * * *',
  'SELECT public.trigger_study_tip_notification();'
);

SELECT cron.schedule(
  'studyflow-midday-tip',
  '0 11 * * *',
  'SELECT public.trigger_study_tip_notification();'
);

SELECT cron.schedule(
  'studyflow-evening-tip',
  '0 17 * * *',
  'SELECT public.trigger_study_tip_notification();'
);
