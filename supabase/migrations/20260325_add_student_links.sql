-- Add portfolio and LinkedIn URL fields to profiles for AI matching
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT DEFAULT '';
