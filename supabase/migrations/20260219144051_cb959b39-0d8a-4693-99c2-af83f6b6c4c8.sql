
-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule weekly league processing every Monday at 00:00 UTC
SELECT cron.schedule(
  'process-league-week',
  '0 0 * * 1',
  $$
  SELECT
    net.http_post(
        url:='https://qecpaduxewgnumrjrroo.supabase.co/functions/v1/process-leagues',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlY3BhZHV4ZXdnbnVtcmpycm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODkwNzIsImV4cCI6MjA4MzI2NTA3Mn0.7pVxkUZDlhXHfvI1yqRi6X_GtLIPo78occhww6khmSM"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
