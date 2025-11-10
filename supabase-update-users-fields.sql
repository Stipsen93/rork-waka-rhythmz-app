-- =====================================================
-- Update users table met extra velden
-- =====================================================
-- Run dit script in Supabase SQL Editor
-- =====================================================

-- Voeg kolommen toe als ze nog niet bestaan
DO $$ 
BEGIN
  -- Voeg email toe als het niet bestaat
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'email') THEN
    ALTER TABLE public.users ADD COLUMN email TEXT;
  END IF;
  
  -- Voeg phone toe als het niet bestaat
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'phone') THEN
    ALTER TABLE public.users ADD COLUMN phone TEXT;
  END IF;
  
  -- Voeg age toe als het niet bestaat
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'age') THEN
    ALTER TABLE public.users ADD COLUMN age TEXT;
  END IF;
  
  -- Voeg address toe als het niet bestaat
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'address') THEN
    ALTER TABLE public.users ADD COLUMN address TEXT;
  END IF;
END $$;

-- =====================================================
-- DONE
-- =====================================================
-- Users table heeft nu email, phone, age en address velden
-- Deze kunnen NULL zijn en worden gesynchroniseerd met de app
-- =====================================================
