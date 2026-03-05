-- Add company field to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company text;
