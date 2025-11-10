-- Complete fix for assignments table and schema cache issues
-- Run this in your Supabase SQL Editor

-- Step 1: Ensure the assignments table has all required columns
DO $$ 
BEGIN
  -- Add require_media if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assignments' 
    AND column_name = 'require_media'
  ) THEN
    ALTER TABLE assignments ADD COLUMN require_media BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Column require_media added';
  ELSE
    RAISE NOTICE 'Column require_media already exists';
  END IF;

  -- Ensure submissions column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assignments' 
    AND column_name = 'submissions'
  ) THEN
    ALTER TABLE assignments ADD COLUMN submissions JSONB DEFAULT '[]'::JSONB;
    RAISE NOTICE 'Column submissions added';
  ELSE
    RAISE NOTICE 'Column submissions already exists';
  END IF;
END $$;

-- Step 2: Set proper defaults for all columns
ALTER TABLE assignments 
  ALTER COLUMN require_media SET DEFAULT FALSE,
  ALTER COLUMN completed_by SET DEFAULT '[]'::JSONB,
  ALTER COLUMN submissions SET DEFAULT '[]'::JSONB;

-- Step 3: Update any NULL values to proper defaults
UPDATE assignments 
SET 
  require_media = COALESCE(require_media, FALSE),
  completed_by = COALESCE(completed_by, '[]'::JSONB),
  submissions = COALESCE(submissions, '[]'::JSONB)
WHERE 
  require_media IS NULL 
  OR completed_by IS NULL 
  OR submissions IS NULL;

-- Step 4: Force a schema cache reload
-- This notifies PostgREST (Supabase's API layer) to reload the schema
NOTIFY pgrst, 'reload schema';

-- Step 5: Verify all columns exist
SELECT 
  table_name,
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'assignments'
ORDER BY ordinal_position;

-- Step 6: Show a sample row to verify structure
SELECT * FROM assignments LIMIT 1;

-- SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE '✅ Assignments table schema has been fixed and cache reloaded!';
  RAISE NOTICE '⚠️  If you still see errors, restart your Supabase project or wait 30 seconds for cache to refresh.';
END $$;
