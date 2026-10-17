/*
# Create profiles and settings tables for IA VIRAL

## Overview
Creates the core data model for the IA VIRAL app: user profiles with credits/plan tracking,
and an app-level settings table for Pix key and WhatsApp number.

## New Tables

### profiles
- `id` (uuid, PK, references auth.users) — one row per user
- `email` (text, unique) — user's email
- `credits` (int, default 0) — current credit balance
- `is_owner` (bool, default false) — true only for the app owner (infinite access)
- `expires_at` (timestamptz, nullable) — when monthly plan expires
- `google_bonus_claimed` (bool, default false) — whether Google signup bonus was given
- `plan` (text, default 'free') — 'free', 'single', or 'monthly'
- `created_at` (timestamptz, default now())

### settings
- `id` (int, PK, default 1) — singleton row
- `pix_key` (text, nullable) — Pix key for payments
- `whatsapp` (text, nullable) — WhatsApp number for comprovante
- `updated_at` (timestamptz, default now())

## Security
- profiles: RLS enabled. Users can read/update their own profile. Owner email is set as is_owner=true via trigger.
- settings: RLS enabled. Anyone can read (public info: pix key, whatsapp). Only owner can update.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  credits integer NOT NULL DEFAULT 0,
  is_owner boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  google_bonus_claimed boolean NOT NULL DEFAULT false,
  plan text NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
ON profiles FOR SELECT
TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Also allow owner to read all profiles (for admin panel)
DROP POLICY IF EXISTS "owner_select_all_profiles" ON profiles;
CREATE POLICY "owner_select_all_profiles"
ON profiles FOR SELECT
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_owner = true)
);

-- Allow owner to update any profile (for granting credits)
DROP POLICY IF EXISTS "owner_update_all_profiles" ON profiles;
CREATE POLICY "owner_update_all_profiles"
ON profiles FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_owner = true)
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_owner = true)
);

-- Settings table (singleton)
CREATE TABLE IF NOT EXISTS settings (
  id integer PRIMARY KEY DEFAULT 1,
  pix_key text,
  whatsapp text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read settings (pix key, whatsapp are public)
DROP POLICY IF EXISTS "read_settings" ON settings;
CREATE POLICY "read_settings"
ON settings FOR SELECT
TO anon, authenticated USING (true);

-- Only owner can update settings
DROP POLICY IF EXISTS "owner_update_settings" ON settings;
CREATE POLICY "owner_update_settings"
ON settings FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_owner = true)
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_owner = true)
);

-- Only owner can insert settings
DROP POLICY IF EXISTS "owner_insert_settings" ON settings;
CREATE POLICY "owner_insert_settings"
ON settings FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_owner = true)
);

-- Insert default settings row
INSERT INTO settings (id, pix_key, whatsapp)
VALUES (1, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_owner)
  VALUES (
    NEW.id,
    NEW.email,
    LOWER(NEW.email) = 'beijo.2007.2007@gmail.com'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant execute on the trigger function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
