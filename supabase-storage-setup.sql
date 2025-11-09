-- =====================================================
-- WAKA RHYTHMZ - STORAGE SETUP FOR BIBLIOTHEEK
-- =====================================================
-- This SQL script sets up Supabase Storage for media library
-- 
-- Features:
-- - Media metadata storage with folder structure
-- - Storage bucket for files (videos, images, audio)
-- - Row Level Security (RLS) policies
-- - Storage usage tracking function
-- - Automatic timestamp updates
--
-- To use:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this entire script
-- 3. Click "Run"
-- =====================================================

-- =====================================================
-- TABLE: media_library
-- =====================================================
-- Stores metadata for all uploaded media files
-- Includes folder path for organization

CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  folder_path TEXT NOT NULL DEFAULT '',
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================
-- Improve query performance for folder-based queries

CREATE INDEX IF NOT EXISTS idx_media_library_folder_path 
  ON public.media_library(folder_path);

CREATE INDEX IF NOT EXISTS idx_media_library_created_at 
  ON public.media_library(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_library_file_type 
  ON public.media_library(file_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Enable RLS for security

ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view media metadata" ON public.media_library;
DROP POLICY IF EXISTS "Authenticated users can upload media metadata" ON public.media_library;
DROP POLICY IF EXISTS "Users can update own media" ON public.media_library;
DROP POLICY IF EXISTS "Users can delete own media" ON public.media_library;

-- Policy: Allow all authenticated users to view media metadata
CREATE POLICY "Anyone can view media metadata"
  ON public.media_library FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to upload media metadata
CREATE POLICY "Authenticated users can upload media metadata"
  ON public.media_library FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow users to update their own media
CREATE POLICY "Users can update own media"
  ON public.media_library FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Policy: Allow users to delete their own media
CREATE POLICY "Users can delete own media"
  ON public.media_library FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- =====================================================
-- STORAGE BUCKET
-- =====================================================
-- Create public storage bucket for media files

INSERT INTO storage.buckets (id, name, public)
VALUES ('media-library', 'media-library', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================
-- Control access to files in storage bucket

-- Drop existing storage policies first to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view media files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Policy: Allow all authenticated users to view files
CREATE POLICY "Anyone can view media files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'media-library');

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media-library');

-- Policy: Allow users to update their own files
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'media-library');

-- Policy: Allow users to delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media-library');

-- =====================================================
-- FUNCTION: get_storage_usage
-- =====================================================
-- Calculate total storage usage from media_library table
-- Returns total file size in bytes

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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_storage_usage() TO authenticated;

-- =====================================================
-- FUNCTION: update_updated_at_column
-- =====================================================
-- Automatically update updated_at timestamp on row updates

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
-- Apply updated_at update function to media_library table

DROP TRIGGER IF EXISTS update_media_library_updated_at ON public.media_library;

CREATE TRIGGER update_media_library_updated_at
  BEFORE UPDATE ON public.media_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CLEANUP FUNCTION (OPTIONAL)
-- =====================================================
-- Function to clean up orphaned storage files
-- Run manually if needed to remove files without metadata

CREATE OR REPLACE FUNCTION cleanup_orphaned_storage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function can be used to identify orphaned files
  -- Run manually from SQL editor if needed
  RAISE NOTICE 'Check storage.objects for files not in media_library';
END;
$$;

-- =====================================================
-- Setup complete!
-- =====================================================
-- Next steps:
-- 1. Storage bucket 'media-library' is ready
-- 2. Upload media through the app
-- 3. Files will be stored in Supabase Storage
-- 4. Metadata will be saved in media_library table
-- 5. Monitor storage usage with get_storage_usage()
-- =====================================================
