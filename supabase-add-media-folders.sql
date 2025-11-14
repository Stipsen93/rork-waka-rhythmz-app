-- =====================================================
-- MEDIA FOLDERS TABLE
-- =====================================================
-- Voeg een dedicated tabel toe voor folder management
-- Run dit script in Supabase SQL Editor
-- =====================================================

-- Drop bestaande table als deze bestaat
DROP TABLE IF EXISTS public.media_folders CASCADE;

-- Create media_folders table
CREATE TABLE public.media_folders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  folder_path TEXT NOT NULL UNIQUE,
  parent_path TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX idx_media_folders_parent_path ON media_folders(parent_path);
CREATE INDEX idx_media_folders_folder_path ON media_folders(folder_path);
CREATE INDEX idx_media_folders_created_at ON media_folders(created_at DESC);

-- Enable RLS
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Anyone can view folders" ON media_folders;
CREATE POLICY "Anyone can view folders"
  ON public.media_folders FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can create folders" ON media_folders;
CREATE POLICY "Anyone can create folders"
  ON public.media_folders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update folders" ON media_folders;
CREATE POLICY "Anyone can update folders"
  ON public.media_folders FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Anyone can delete folders" ON media_folders;
CREATE POLICY "Anyone can delete folders"
  ON public.media_folders FOR DELETE
  USING (true);

-- Grant permissions
GRANT ALL ON public.media_folders TO anon;
GRANT ALL ON public.media_folders TO authenticated;
GRANT ALL ON public.media_folders TO service_role;

-- Enable realtime for media_folders
ALTER PUBLICATION supabase_realtime ADD TABLE media_folders;

-- =====================================================
-- SETUP COMPLEET
-- =====================================================
-- media_folders tabel is klaar voor gebruik!
-- =====================================================
