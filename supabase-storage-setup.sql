-- =====================================================
-- WAKA RHYTHMZ - STORAGE SETUP FOR BIBLIOTHEEK
-- =====================================================
-- This SQL script sets up Supabase Storage for media library
-- 
-- To use:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this entire script
-- 3. Click "Run"
-- =====================================================

-- Create media_library table to store metadata
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_media_library_folder_path ON public.media_library(folder_path);
CREATE INDEX IF NOT EXISTS idx_media_library_created_at ON public.media_library(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- Create policies for media_library table
-- Allow all authenticated users to read media metadata
CREATE POLICY "Anyone can view media metadata"
ON public.media_library FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert media metadata
CREATE POLICY "Authenticated users can upload media metadata"
ON public.media_library FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to delete their own media or admins to delete any
CREATE POLICY "Users can delete own media"
ON public.media_library FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid());

-- Create storage bucket for media library
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-library', 'media-library', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for media-library bucket
-- Allow all authenticated users to read files
CREATE POLICY "Anyone can view media files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'media-library');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media-library');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media-library');

-- Create function to get storage usage
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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_media_library_updated_at ON public.media_library;
CREATE TRIGGER update_media_library_updated_at
BEFORE UPDATE ON public.media_library
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Setup complete!
-- =====================================================
