-- Fix huiswerk media integration met bibliotheek
-- Dit script zorgt ervoor dat media geüpload voor huiswerk correct wordt opgeslagen

-- 1. Controleer of media_library tabel bestaat en correct is geconfigureerd
CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  folder_path TEXT NOT NULL DEFAULT '',
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Controleer of media_folders tabel bestaat
CREATE TABLE IF NOT EXISTS public.media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  folder_path TEXT NOT NULL UNIQUE,
  parent_path TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Maak indexen voor betere performance
CREATE INDEX IF NOT EXISTS idx_media_library_folder_path ON public.media_library(folder_path);
CREATE INDEX IF NOT EXISTS idx_media_library_file_type ON public.media_library(file_type);
CREATE INDEX IF NOT EXISTS idx_media_library_created_at ON public.media_library(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_folders_folder_path ON public.media_folders(folder_path);

-- 4. Zorg ervoor dat de assignments tabel correct is
ALTER TABLE public.assignments 
  ADD COLUMN IF NOT EXISTS media_uri TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('video', 'image', 'audio')),
  ADD COLUMN IF NOT EXISTS require_media BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS submissions JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS completed_by JSONB DEFAULT '[]'::JSONB;

-- 5. Enable RLS op media_library
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- 6. Drop oude policies als ze bestaan
DROP POLICY IF EXISTS "Anyone can view media" ON public.media_library;
DROP POLICY IF EXISTS "Anyone can upload media" ON public.media_library;
DROP POLICY IF EXISTS "Anyone can update media" ON public.media_library;
DROP POLICY IF EXISTS "Anyone can delete media" ON public.media_library;

-- 7. Maak nieuwe policies - iedereen kan alles (zoals in originele schema)
CREATE POLICY "Anyone can view media"
  ON public.media_library FOR SELECT
  USING (true);

CREATE POLICY "Anyone can upload media"
  ON public.media_library FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update media"
  ON public.media_library FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete media"
  ON public.media_library FOR DELETE
  USING (true);

-- 8. Zelfde voor media_folders
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view folders" ON public.media_folders;
DROP POLICY IF EXISTS "Anyone can create folders" ON public.media_folders;
DROP POLICY IF EXISTS "Anyone can update folders" ON public.media_folders;
DROP POLICY IF EXISTS "Anyone can delete folders" ON public.media_folders;

CREATE POLICY "Anyone can view folders"
  ON public.media_folders FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create folders"
  ON public.media_folders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update folders"
  ON public.media_folders FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete folders"
  ON public.media_folders FOR DELETE
  USING (true);

-- 9. Maak standaard mappen aan als ze nog niet bestaan
INSERT INTO public.media_folders (name, folder_path, parent_path)
VALUES 
  ('assignments', 'assignments', NULL),
  ('huiswerk-uploads', 'huiswerk-uploads', NULL)
ON CONFLICT (folder_path) DO NOTHING;

-- 10. Update trigger voor updated_at
CREATE OR REPLACE FUNCTION update_media_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_media_library_updated_at ON public.media_library;
CREATE TRIGGER update_media_library_updated_at
  BEFORE UPDATE ON public.media_library
  FOR EACH ROW
  EXECUTE FUNCTION update_media_library_updated_at();

DROP TRIGGER IF EXISTS update_media_folders_updated_at ON public.media_folders;
CREATE TRIGGER update_media_folders_updated_at
  BEFORE UPDATE ON public.media_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_media_library_updated_at();

-- 11. Geef permissies
GRANT ALL ON public.media_library TO anon;
GRANT ALL ON public.media_library TO authenticated;
GRANT ALL ON public.media_library TO service_role;

GRANT ALL ON public.media_folders TO anon;
GRANT ALL ON public.media_folders TO authenticated;
GRANT ALL ON public.media_folders TO service_role;

-- ✅ KLAAR! 
-- Nu zou het volgende moeten werken:
-- 1. Media uploaden voor nieuwe opdracht -> wordt opgeslagen in media_library tabel
-- 2. "Kies uit bibliotheek" -> laadt media uit media_library tabel
-- 3. Media wordt correct getoond op de bibliotheek pagina
