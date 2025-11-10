-- =====================================================
-- WAKA RHYTHMZ - COMPLETE DATABASE SETUP
-- =====================================================
-- Complete setup voor alle tabellen en storage
-- Run dit script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- CLEANUP BESTAANDE SETUP
-- =====================================================

-- Drop bestaande policies voor media_library
DROP POLICY IF EXISTS "Anyone can view media metadata" ON public.media_library;
DROP POLICY IF EXISTS "Anyone can upload media metadata" ON public.media_library;
DROP POLICY IF EXISTS "Anyone can update media" ON public.media_library;
DROP POLICY IF EXISTS "Anyone can delete media" ON public.media_library;

-- Drop bestaande policies voor storage
DROP POLICY IF EXISTS "Anyone can view media files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view assignment submissions" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload assignment submissions" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete assignment submissions" ON storage.objects;

-- Drop triggers
DROP TRIGGER IF EXISTS update_media_library_updated_at ON public.media_library;

-- Drop functies
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_storage_usage() CASCADE;

-- =====================================================
-- CREËER/UPDATE TABELLEN
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  password_changed_by_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Library table (oude structuur)
CREATE TABLE IF NOT EXISTS public.library (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT,
  children_ids TEXT[],
  media JSONB,
  description TEXT,
  tagged_user_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (parent_id) REFERENCES library(id) ON DELETE CASCADE
);

-- Assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_user_ids TEXT[],
  due_date TIMESTAMPTZ,
  media_uri TEXT,
  media_type TEXT CHECK (media_type IN ('video', 'image', 'audio')),
  require_media BOOLEAN DEFAULT FALSE,
  completed_by JSONB DEFAULT '[]'::JSONB,
  submissions JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trainings table
CREATE TABLE IF NOT EXISTS public.trainings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Practice schedule table
CREATE TABLE IF NOT EXISTS public.practice_schedule (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  regular_days JSONB DEFAULT '[]'::JSONB,
  location TEXT NOT NULL,
  cancelled_dates JSONB DEFAULT '[]'::JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Feestje', 'Verrassingsfeest', 'Huwelijk', 'Verjaardag', 'Overig')),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  member_ids TEXT[],
  created_by TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  news_enabled BOOLEAN DEFAULT TRUE,
  news_hours_advance INTEGER DEFAULT 24,
  assignments_enabled BOOLEAN DEFAULT TRUE,
  training_cancellation_enabled BOOLEAN DEFAULT TRUE,
  training_hours_advance INTEGER DEFAULT 2,
  performances_enabled BOOLEAN DEFAULT TRUE,
  performances_hours_advance INTEGER DEFAULT 48,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media library table (nieuwe structuur met TEXT id voor compatibility)
DROP TABLE IF EXISTS public.media_library CASCADE;

CREATE TABLE public.media_library (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  folder_path TEXT NOT NULL DEFAULT '',
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_library_parent_id ON library(parent_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_users ON assignments USING GIN (assigned_user_ids);
CREATE INDEX IF NOT EXISTS idx_trainings_day ON trainings(day_of_week);
CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements(date);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON appointments(created_by);
CREATE INDEX IF NOT EXISTS idx_media_library_folder_path ON media_library(folder_path);
CREATE INDEX IF NOT EXISTS idx_media_library_created_at ON media_library(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_library_file_type ON media_library(file_type);

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - PUBLIC ACCESS (geen auth)
-- =====================================================

-- Users policies
DROP POLICY IF EXISTS "Allow all operations" ON users;
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true) WITH CHECK (true);

-- Library policies
DROP POLICY IF EXISTS "Allow all operations" ON library;
CREATE POLICY "Allow all operations" ON library FOR ALL USING (true) WITH CHECK (true);

-- Assignments policies
DROP POLICY IF EXISTS "Allow all operations" ON assignments;
CREATE POLICY "Allow all operations" ON assignments FOR ALL USING (true) WITH CHECK (true);

-- Trainings policies
DROP POLICY IF EXISTS "Allow all operations" ON trainings;
CREATE POLICY "Allow all operations" ON trainings FOR ALL USING (true) WITH CHECK (true);

-- Practice schedule policies
DROP POLICY IF EXISTS "Allow all operations" ON practice_schedule;
CREATE POLICY "Allow all operations" ON practice_schedule FOR ALL USING (true) WITH CHECK (true);

-- Announcements policies
DROP POLICY IF EXISTS "Allow all operations" ON announcements;
CREATE POLICY "Allow all operations" ON announcements FOR ALL USING (true) WITH CHECK (true);

-- Appointments policies
DROP POLICY IF EXISTS "Allow all operations" ON appointments;
CREATE POLICY "Allow all operations" ON appointments FOR ALL USING (true) WITH CHECK (true);

-- Notification settings policies
DROP POLICY IF EXISTS "Allow all operations" ON notification_settings;
CREATE POLICY "Allow all operations" ON notification_settings FOR ALL USING (true) WITH CHECK (true);

-- Media library policies
CREATE POLICY "Anyone can view media metadata"
  ON public.media_library FOR SELECT
  USING (true);

CREATE POLICY "Anyone can upload media metadata"
  ON public.media_library FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update media"
  ON public.media_library FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete media"
  ON public.media_library FOR DELETE
  USING (true);

-- =====================================================
-- STORAGE BUCKET
-- =====================================================

-- Maak buckets aan of update bestaande
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media-library', 'media-library', true, 104857600, NULL)
ON CONFLICT (id) DO UPDATE 
SET public = true, 
    file_size_limit = 104857600;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('assignment-submissions', 'assignment-submissions', true, 104857600, ARRAY['image/*', 'video/*', 'audio/*'])
ON CONFLICT (id) DO UPDATE 
SET public = true, 
    file_size_limit = 104857600,
    allowed_mime_types = ARRAY['image/*', 'video/*', 'audio/*'];

-- =====================================================
-- STORAGE POLICIES - PUBLIC ACCESS
-- =====================================================

CREATE POLICY "Anyone can view media files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media-library');

CREATE POLICY "Anyone can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media-library');

CREATE POLICY "Anyone can update files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media-library');

CREATE POLICY "Anyone can delete files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media-library');

-- Assignment submissions storage policies
CREATE POLICY "Anyone can view assignment submissions"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assignment-submissions');

CREATE POLICY "Anyone can upload assignment submissions"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'assignment-submissions');

CREATE POLICY "Anyone can delete assignment submissions"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'assignment-submissions');

-- =====================================================
-- FUNCTIES
-- =====================================================

-- Functie voor storage usage
CREATE OR REPLACE FUNCTION get_storage_usage()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_size BIGINT;
BEGIN
  SELECT COALESCE(SUM(file_size), 0)
  INTO total_size
  FROM public.media_library;
  
  RETURN total_size;
END;
$$;

-- Geef permissions
GRANT EXECUTE ON FUNCTION get_storage_usage() TO anon;
GRANT EXECUTE ON FUNCTION get_storage_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION get_storage_usage() TO service_role;

-- Functie voor updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_media_library_updated_at
  BEFORE UPDATE ON public.media_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

GRANT ALL ON public.library TO anon;
GRANT ALL ON public.library TO authenticated;
GRANT ALL ON public.library TO service_role;

GRANT ALL ON public.assignments TO anon;
GRANT ALL ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;

GRANT ALL ON public.trainings TO anon;
GRANT ALL ON public.trainings TO authenticated;
GRANT ALL ON public.trainings TO service_role;

GRANT ALL ON public.practice_schedule TO anon;
GRANT ALL ON public.practice_schedule TO authenticated;
GRANT ALL ON public.practice_schedule TO service_role;

GRANT ALL ON public.announcements TO anon;
GRANT ALL ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

GRANT ALL ON public.appointments TO anon;
GRANT ALL ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

GRANT ALL ON public.notification_settings TO anon;
GRANT ALL ON public.notification_settings TO authenticated;
GRANT ALL ON public.notification_settings TO service_role;

GRANT ALL ON public.media_library TO anon;
GRANT ALL ON public.media_library TO authenticated;
GRANT ALL ON public.media_library TO service_role;

-- =====================================================
-- SETUP COMPLEET
-- =====================================================
-- Database is klaar voor gebruik!
-- Media library gebruikt nu TEXT ids voor compatibility
-- Alle tabellen hebben publieke toegang
-- Storage buckets 'media-library' en 'assignment-submissions' zijn aangemaakt
-- Assignments tabel heeft require_media en completed_by velden
-- =====================================================
