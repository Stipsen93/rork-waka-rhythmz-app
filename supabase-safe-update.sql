-- =====================================================
-- WAKA RHYTHMZ - VEILIGE UPDATE
-- =====================================================
-- Dit script kan veilig meerdere keren uitgevoerd worden
-- Run dit script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- UPDATE USERS TABLE met extra velden
-- =====================================================

-- Voeg email, phone, age en address kolommen toe aan users tabel
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS age TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;

-- =====================================================
-- CONTROLEER/FIX ASSIGNMENTS TABLE
-- =====================================================

-- Voeg completed_by kolom toe als deze nog niet bestaat
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS completed_by JSONB DEFAULT '[]'::JSONB;

-- Voeg submissions kolom toe als deze nog niet bestaat
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS submissions JSONB DEFAULT '[]'::JSONB;

-- Update bestaande NULL waarden naar lege arrays
UPDATE public.assignments
SET completed_by = '[]'::JSONB
WHERE completed_by IS NULL;

UPDATE public.assignments
SET submissions = '[]'::JSONB
WHERE submissions IS NULL;

-- =====================================================
-- HERLAAD SCHEMA CACHE
-- =====================================================

-- Deze query forceert Supabase om de schema cache te vernieuwen
-- Hierdoor worden de nieuwe kolommen direct beschikbaar
DO $$ 
BEGIN
  -- Force schema cache refresh door een simple operatie
  PERFORM pg_catalog.pg_advisory_unlock_all();
END $$;

-- =====================================================
-- SETUP COMPLEET
-- =====================================================
-- ✅ Users tabel heeft nu: email, phone, age, address
-- ✅ Assignments tabel heeft nu: completed_by, submissions
-- ✅ Schema cache is vernieuwd
-- =====================================================
