-- Add cancelled_by field to appointments table
DO $$ 
BEGIN
    -- Add cancelled_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'appointments' 
        AND column_name = 'cancelled_by'
    ) THEN
        ALTER TABLE appointments 
        ADD COLUMN cancelled_by TEXT;
        
        RAISE NOTICE 'cancelled_by column added to appointments table';
    ELSE
        RAISE NOTICE 'cancelled_by column already exists in appointments table';
    END IF;
END $$;
