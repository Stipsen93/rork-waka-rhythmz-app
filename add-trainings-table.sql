-- Create trainings table to store practice sessions
CREATE TABLE IF NOT EXISTS trainings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  training_id TEXT NOT NULL UNIQUE, -- Unique identifier from the app
  name TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  is_one_time BOOLEAN DEFAULT false,
  repeat_mode TEXT DEFAULT 'none' CHECK (repeat_mode IN ('none', '1x', '2x', 'custom')),
  custom_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Enable RLS
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;

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
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND deleted_at IS NULL
    )
  );

-- Policy: Only admins can update trainings
CREATE POLICY "Admins can update trainings" ON trainings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND deleted_at IS NULL
    )
  );

-- Policy: Only admins can soft delete trainings
CREATE POLICY "Admins can soft delete trainings" ON trainings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND deleted_at IS NULL
    )
    AND deleted_at IS NULL -- Can only soft delete active records
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND deleted_at IS NULL
    )
    AND deleted_at IS NOT NULL -- Can only set deleted_at
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_trainings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trainings_updated_at_trigger
  BEFORE UPDATE ON trainings
  FOR EACH ROW
  EXECUTE FUNCTION update_trainings_updated_at();

-- Create indexes for performance
CREATE INDEX idx_trainings_deleted_at ON trainings(deleted_at);
CREATE INDEX idx_trainings_training_id ON trainings(training_id);
CREATE INDEX idx_trainings_day_of_week ON trainings(day_of_week) WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON TABLE trainings IS 'Stores practice/training sessions for the organization';