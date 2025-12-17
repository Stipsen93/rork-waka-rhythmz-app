-- =====================================================
-- ASSIGNMENT SUBMISSIONS STORAGE SETUP
-- =====================================================
-- Setup for assignment submissions bucket
-- Run this script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STORAGE BUCKET
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-submissions', 
  'assignment-submissions', 
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

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view assignment submissions" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload assignment submissions" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update assignment submissions" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete assignment submissions" ON storage.objects;

CREATE POLICY "Anyone can view assignment submissions"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assignment-submissions');

CREATE POLICY "Anyone can upload assignment submissions"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'assignment-submissions');

CREATE POLICY "Anyone can update assignment submissions"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'assignment-submissions');

CREATE POLICY "Anyone can delete assignment submissions"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'assignment-submissions');

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Assignment submissions bucket is ready!
-- Max file size: 400MB (419430400 bytes)
-- Allowed types: images, videos, audio
-- =====================================================
