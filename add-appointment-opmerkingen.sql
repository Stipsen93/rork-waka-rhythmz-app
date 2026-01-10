-- Add 'opmerkingen' (notes) field to appointments
-- Run this in Supabase SQL editor (migration)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appointments'
      AND column_name = 'opmerkingen'
  ) THEN
    ALTER TABLE public.appointments
      ADD COLUMN opmerkingen TEXT;
  END IF;
END $$;
