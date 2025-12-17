-- =====================================================
-- WAKA RHYTHMZ - STORAGE SETUP
-- =====================================================
-- Clean setup for media library with Supabase Storage
-- Run this script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- CLEAN UP EXISTING SETUP
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view media metadata" ON public.media_library;
DROP POLICY IF EXISTS "Anyone can upload media metadata" ON public.media_library;
DROP POLICY IF EXISTS "Anyone can update media" ON public.media_library;
DROP POLICY IF EXISTS "Anyone can delete media" ON public.media_library;
DROP POLICY IF EXISTS "Authenticated users can upload media metadata" ON public.media_library;
DROP POLICY IF EXISTS "Users can update own media" ON public.media_library;
DROP POLICY IF EXISTS "Users can delete own media" ON public.media_library;

DROP POLICY IF EXISTS "Anyone can view media files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_media_library_updated_at ON public.media_library;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS cleanup_orphaned_storage();
DROP FUNCTION IF EXISTS get_storage_usage();

-- =====================================================
-- CREATE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  folder_path TEXT NOT NULL DEFAULT '',
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_media_library_folder_path 
  ON public.media_library(folder_path);

CREATE INDEX IF NOT EXISTS idx_media_library_created_at 
  ON public.media_library(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_library_file_type 
  ON public.media_library(file_type);

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - PUBLIC ACCESS
-- =====================================================

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

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-library', 
  'media-library', 
  true,
  419430400,
  ARRAY['image/*', 'video/*', 'audio/*']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 419430400,
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

-- =====================================================
-- FUNCTION: get_storage_usage
-- =====================================================

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

GRANT EXECUTE ON FUNCTION get_storage_usage() TO anon;
GRANT EXECUTE ON FUNCTION get_storage_usage() TO authenticated;

-- =====================================================
-- FUNCTION: update_updated_at_column
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: update_media_library_updated_at
-- =====================================================

CREATE TRIGGER update_media_library_updated_at
  BEFORE UPDATE ON public.media_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Your media library is ready!
-- You can now upload files through the app
-- All access is public (no authentication required)
-- =====================================================
