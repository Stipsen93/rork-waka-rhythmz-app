-- Fix assignments table to ensure completed_by column is properly configured
-- This ensures the completed_by field stores user completion data with timestamps

-- First, make sure the column exists and is JSONB
DO $$ 
BEGIN
  -- Check if completed_by column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'assignments' 
    AND column_name = 'completed_by'
  ) THEN
    ALTER TABLE assignments ADD COLUMN completed_by JSONB DEFAULT '[]'::JSONB;
  END IF;
END $$;

-- Update any null values to empty array
UPDATE assignments 
SET completed_by = '[]'::JSONB 
WHERE completed_by IS NULL;

-- Create an index on completed_by for better query performance
CREATE INDEX IF NOT EXISTS idx_assignments_completed_by ON assignments USING GIN (completed_by);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'assignments'
AND column_name = 'completed_by';
