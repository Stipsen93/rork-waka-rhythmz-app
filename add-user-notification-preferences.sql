-- =====================================================
-- USER NOTIFICATION PREFERENCES
-- =====================================================
-- Voeg per gebruiker notificatie voorkeuren toe
-- Run dit script in Supabase SQL Editor
-- =====================================================

-- Voeg notificatie voorkeuren toe aan users tabel
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "newsEnabled": true,
  "assignmentsEnabled": true,
  "trainingsEnabled": true,
  "performancesEnabled": true
}'::JSONB;

-- Update bestaande gebruikers met default voorkeuren
UPDATE public.users
SET notification_preferences = '{
  "newsEnabled": true,
  "assignmentsEnabled": true,
  "trainingsEnabled": true,
  "performancesEnabled": true
}'::JSONB
WHERE notification_preferences IS NULL;

-- =====================================================
-- SETUP COMPLEET
-- =====================================================
-- Elke gebruiker heeft nu notificatie voorkeuren
-- =====================================================
