-- Create appointments table if it doesn't exist
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  member_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'for_user_id') THEN
        ALTER TABLE appointments ADD COLUMN for_user_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'confirmed') THEN
        ALTER TABLE appointments ADD COLUMN confirmed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add FK constraint for for_user_id if it doesn't exist.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_for_user_id_fkey') THEN
        ALTER TABLE appointments
        ADD CONSTRAINT appointments_for_user_id_fkey
        FOREIGN KEY (for_user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Ensure other columns exist just in case (migration safety)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'member_ids') THEN
        ALTER TABLE appointments ADD COLUMN member_ids TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'status') THEN
        ALTER TABLE appointments ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'created_by') THEN
        ALTER TABLE appointments ADD COLUMN created_by TEXT DEFAULT '';
    END IF;
END $$;

-- Update confirmed to false where it is null
UPDATE appointments
SET confirmed = FALSE
WHERE confirmed IS NULL;
