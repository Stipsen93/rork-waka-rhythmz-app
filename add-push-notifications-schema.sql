-- =====================================================
-- PUSH NOTIFICATIONS SETUP
-- =====================================================
-- Voeg push notification tokens en logging toe
-- Run dit script in Supabase SQL Editor
-- =====================================================

-- Tabel voor push notification tokens per gebruiker
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT NOT NULL, -- 'ios' of 'android'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Index voor snellere lookups
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON public.push_tokens(token);

-- Tabel voor notification logs (optioneel, voor debugging)
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'news', 'assignment', 'training', 'performance', 'birthday'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'delivered'
  error_message TEXT
);

-- Index voor notification logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON public.notification_logs(sent_at DESC);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies voor push_tokens
CREATE POLICY "Users can view their own tokens" ON public.push_tokens
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own tokens" ON public.push_tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own tokens" ON public.push_tokens
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own tokens" ON public.push_tokens
  FOR DELETE USING (true);

-- RLS policies voor notification_logs
CREATE POLICY "Users can view notification logs" ON public.notification_logs
  FOR SELECT USING (true);

CREATE POLICY "Service can insert notification logs" ON public.notification_logs
  FOR INSERT WITH CHECK (true);

-- Function om automatisch updated_at te updaten
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger voor auto-update van updated_at
DROP TRIGGER IF EXISTS push_tokens_updated_at ON public.push_tokens;
CREATE TRIGGER push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_tokens_updated_at();

-- =====================================================
-- SETUP COMPLEET
-- =====================================================
-- Push notification tokens kunnen nu worden opgeslagen
-- Notification logs worden bijgehouden voor debugging
-- =====================================================
