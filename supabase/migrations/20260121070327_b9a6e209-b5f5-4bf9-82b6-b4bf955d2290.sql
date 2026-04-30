-- Add storage quota columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN storage_limit_bytes BIGINT NOT NULL DEFAULT 52428800,
ADD COLUMN storage_used_bytes BIGINT NOT NULL DEFAULT 0;

-- Update existing users with calculated storage usage from their files
UPDATE public.profiles p
SET storage_used_bytes = COALESCE(
  (SELECT SUM(COALESCE(file_size, 0)) FROM public.user_files WHERE user_id = p.id),
  0
);