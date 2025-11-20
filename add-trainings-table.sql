-- Create trainings table to store practice sessions
DO $$
BEGIN
  -- Create table if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainings') THEN
    CREATE TABLE trainings (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      training_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
      time TEXT NOT NULL,
      location TEXT NOT NULL,
      is_one_time BOOLEAN DEFAULT false,
      repeat_mode TEXT DEFAULT 'none' CHECK (repeat_mode IN ('none', '1x', '2x', 'custom')),
      custom_date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );
    
    RAISE NOTICE 'Table trainings created';
  ELSE
    -- Table exists, check if deleted_at column exists
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'trainings' 
      AND column_name = 'deleted_at'
    ) THEN
      ALTER TABLE trainings ADD COLUMN deleted_at TIMESTAMPTZ;
      RAISE NOTICE 'Column deleted_at added to trainings table';
    END IF;
  END IF;
END $$;

-- Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE tablename = 'trainings' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled for trainings table';
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "All users can view active trainings" ON trainings;
  DROP POLICY IF EXISTS "Admins can insert trainings" ON trainings;
  DROP POLICY IF EXISTS "Admins can update trainings" ON trainings;
  DROP POLICY IF EXISTS "Admins can soft delete trainings" ON trainings;
END $$;

-- Policy: All users can read trainings (active ones)
CREATE POLICY "All users can view active trainings" ON trainings
  FOR SELECT
  USING (deleted_at IS NULL);

-- Policy: Only admins can insert trainings
CREATE POLICY "Admins can insert trainings" ON trainings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text
      AND role = 'admin'
      AND deleted_at IS NULL
    )
  );

-- Policy: Only admins can update trainings (general)
CREATE POLICY "Admins can update trainings" ON trainings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text
      AND role = 'admin'
      AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
      AND deleted_at IS NULL
    )
  );

-- Policy: Only admins can delete trainings
CREATE POLICY "Admins can delete trainings" ON trainings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text
      AND role = 'admin'
      AND deleted_at IS NULL
    )
  );

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_trainings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trainings_updated_at_trigger ON trainings;
CREATE TRIGGER trainings_updated_at_trigger
  BEFORE UPDATE ON trainings
  FOR EACH ROW
  EXECUTE FUNCTION update_trainings_updated_at();

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_trainings_deleted_at'
  ) THEN
    CREATE INDEX idx_trainings_deleted_at ON trainings(deleted_at);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_trainings_training_id'
  ) THEN
    CREATE INDEX idx_trainings_training_id ON trainings(training_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_trainings_day_of_week'
  ) THEN
    CREATE INDEX idx_trainings_day_of_week ON trainings(day_of_week) WHERE deleted_at IS NULL;
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE trainings IS 'Stores practice/training sessions for the organization';