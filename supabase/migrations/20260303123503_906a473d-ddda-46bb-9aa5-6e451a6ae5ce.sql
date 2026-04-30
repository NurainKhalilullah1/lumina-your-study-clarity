
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Add subscription_tier to profiles
ALTER TABLE public.profiles
  ADD COLUMN subscription_tier text NOT NULL DEFAULT 'free';

-- 6. Create upgrade_requests table
CREATE TABLE public.upgrade_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requested_tier text NOT NULL CHECK (requested_tier IN ('pro', 'premium')),
  amount integer NOT NULL,
  payment_reference text,
  receipt_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own upgrade requests
CREATE POLICY "Users can insert own upgrade requests"
  ON public.upgrade_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own upgrade requests
CREATE POLICY "Users can view own upgrade requests"
  ON public.upgrade_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all upgrade requests
CREATE POLICY "Admins can view all upgrade requests"
  ON public.upgrade_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all upgrade requests
CREATE POLICY "Admins can update upgrade requests"
  ON public.upgrade_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update any profile (for tier upgrades)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Create receipts storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false);

-- Storage policies for receipts bucket
CREATE POLICY "Users can upload receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can view all receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'receipts' AND public.has_role(auth.uid(), 'admin'));
