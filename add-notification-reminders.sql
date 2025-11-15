-- =====================================================
-- NOTIFICATION REMINDERS SETUP
-- =====================================================
-- Voeg reminder notification settings toe
-- Run dit script in Supabase SQL Editor
-- =====================================================

-- Update notification_settings tabel om reminder toggles toe te voegen
ALTER TABLE public.notification_settings 
ADD COLUMN IF NOT EXISTS news_reminder_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS assignments_reminder_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trainings_reminder_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS performances_reminder_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS assignments_hours_advance INTEGER DEFAULT 24;

-- Maak een tabel voor scheduled reminders
CREATE TABLE IF NOT EXISTS public.scheduled_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'news', 'assignment', 'training', 'performance'
  item_id TEXT NOT NULL, -- Het ID van het nieuws/huiswerk/training/optreden
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL, -- Wanneer de reminder verstuurd moet worden
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index voor snellere queries
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_scheduled_for ON public.scheduled_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_sent ON public.scheduled_reminders(sent);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_type ON public.scheduled_reminders(type);

-- Enable RLS
ALTER TABLE public.scheduled_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies voor scheduled_reminders
CREATE POLICY "Service can manage scheduled reminders" ON public.scheduled_reminders
  FOR ALL USING (true);

-- =====================================================
-- SETUP COMPLEET
-- =====================================================
-- Reminder settings zijn nu beschikbaar
-- Scheduled reminders kunnen worden opgeslagen
-- =====================================================
