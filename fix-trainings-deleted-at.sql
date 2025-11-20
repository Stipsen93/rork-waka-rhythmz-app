-- Check if deleted_at column exists, if not add it to trainings table
DO $$
BEGIN
  -- Check if deleted_at column exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'trainings'
    AND column_name = 'deleted_at'
  ) THEN
    -- Add deleted_at column to trainings table
    ALTER TABLE trainings
    ADD COLUMN deleted_at TIMESTAMPTZ;
    
    -- Update the policies to include deleted_at check
    DROP POLICY IF EXISTS "All users can view active trainings" ON trainings;
    CREATE POLICY "All users can view active trainings" ON trainings
      FOR SELECT
      USING (deleted_at IS NULL);
    
    DROP POLICY IF EXISTS "Admins can soft delete trainings" ON trainings;
    CREATE POLICY "Admins can soft delete trainings" ON trainings
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid()::uuid 
          AND role = 'admin'
          AND deleted_at IS NULL
        )
        AND deleted_at IS NULL -- Can only soft delete active records
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid()::uuid 
          AND role = 'admin'
          AND deleted_at IS NULL
        )
        AND deleted_at IS NOT NULL -- Can only set deleted_at
      );
    
    -- Create index for deleted_at
    CREATE INDEX IF NOT EXISTS idx_trainings_deleted_at ON trainings(deleted_at);
    
    RAISE NOTICE 'Added deleted_at column to trainings table';
  ELSE
    RAISE NOTICE 'deleted_at column already exists in trainings table';
  END IF;
END $$;