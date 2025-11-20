-- Create trainings table to store practice sessions
DO $
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
    -- Table exists, check and add missing columns
    
    -- Check and add training_id column
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'trainings' 
      AND column_name = 'training_id'
    ) THEN
      ALTER TABLE trainings ADD COLUMN training_id TEXT NOT NULL DEFAULT uuid_generate_v4()::text UNIQUE;
      RAISE NOTICE 'Column training_id added to trainings table';
    END IF;
    
    -- Check and add name column
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'trainings' 
      AND column_name = 'name'
    ) THEN
      ALTER TABLE trainings ADD COLUMN name TEXT NOT NULL DEFAULT '';
      RAISE NOTICE 'Column name added to trainings table';
    END IF;
    
    -- Check and add day_of_week column
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'trainings' 
      AND column_name = 'day_of_week'
    ) THEN
      ALTER TABLE trainings ADD COLUMN day_of_week INTEGER NOT NULL DEFAULT 0 CHECK (day_of_week >= 0 AND day_of_week <= 6);
      RAISE NOTICE 'Column day_of_week added to trainings table';
    END IF;
    
    -- Check and add time column
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'trainings' 
      AND column_name = 'time'
    ) THEN
      ALTER TABLE trainings ADD COLUMN time TEXT NOT NULL DEFAULT '';
      RAISE NOTICE 'Column time added to trainings table';
    END IF;
    
    -- Check and add location column
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'trainings' 
      AND column_name = 'location'
    ) THEN
      ALTER TABLE trainings ADD COLUMN location TEXT NOT NULL DEFAULT '';
      RAISE NOTICE 'Column location added to trainings table';
    END IF;
    
    -- Check and add is_one_time column
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'trainings' 
      AND column_name = 'is_one_time'
    ) THEN
      ALTER TABLE trainings ADD COLUMN is_one_time BOOLEAN DEFAULT false;
      RAISE NOTICE 'Column is_one_time added to trainings table';
    END IF;
    
    -- Check and add repeat_mode column
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'trainings' 
      AND column_name = 'repeat_mode'
    ) THEN
      ALTER TABLE trainings ADD COLUMN repeat_mode TEXT DEFAULT 'none' CHECK (repeat_mode IN ('none', '1x', '2x', 'custom'));
      RAISE NOTICE 'Column repeat_mode added to trainings table';
    END IF;
    
    -- Check and add custom_date column
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'trainings' 
      AND column_name = 'custom_date'
    ) THEN
      ALTER TABLE trainings ADD COLUMN custom_date DATE;
      RAISE NOTICE 'Column custom_date added to trainings table';
    END IF;
    
    -- Check and add created_at column
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'trainings' 
      AND column_name = 'created_at'
    ) THEN
      ALTER TABLE trainings ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
      RAISE NOTICE 'Column created_at added to trainings table';
    END IF;
    
    -- Check and add updated_at column
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'trainings' 
      AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE trainings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
      RAISE NOTICE 'Column updated_at added to trainings table';
    END IF;
    
    -- Check and add deleted_at column
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
END $;

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

-- Create indexes if they don't exist and columns exist
DO $
BEGIN
  -- Check and create index for deleted_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trainings' 
    AND column_name = 'deleted_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_trainings_deleted_at'
  ) THEN
    CREATE INDEX idx_trainings_deleted_at ON trainings(deleted_at);
    RAISE NOTICE 'Index idx_trainings_deleted_at created';
  END IF;
  
  -- Check and create index for training_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trainings' 
    AND column_name = 'training_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_trainings_training_id'
  ) THEN
    CREATE INDEX idx_trainings_training_id ON trainings(training_id);
    RAISE NOTICE 'Index idx_trainings_training_id created';
  END IF;
  
  -- Check and create index for day_of_week
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trainings' 
    AND column_name = 'day_of_week'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trainings' 
    AND column_name = 'deleted_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_trainings_day_of_week'
  ) THEN
    CREATE INDEX idx_trainings_day_of_week ON trainings(day_of_week) WHERE deleted_at IS NULL;
    RAISE NOTICE 'Index idx_trainings_day_of_week created';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trainings' 
    AND column_name = 'day_of_week'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trainings' 
    AND column_name = 'deleted_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_trainings_day_of_week'
  ) THEN
    -- Create index without WHERE clause if deleted_at doesn't exist
    CREATE INDEX idx_trainings_day_of_week ON trainings(day_of_week);
    RAISE NOTICE 'Index idx_trainings_day_of_week created (without deleted_at filter)';
  END IF;
END $;

-- Add comment
COMMENT ON TABLE trainings IS 'Stores practice/training sessions for the organization';