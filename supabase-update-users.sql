-- =====================================================
-- WAKA RHYTHMZ - UPDATE USERS TABLE
-- =====================================================
-- Voeg extra profielvelden toe aan users tabel
-- Run dit script in Supabase SQL Editor
-- =====================================================

-- Voeg email, phone, age en address kolommen toe aan users tabel
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS age TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;

-- =====================================================
-- SETUP COMPLEET
-- =====================================================
-- Users tabel heeft nu extra velden voor profiel informatie:
-- - email
-- - phone 
-- - age
-- - address
-- =====================================================
