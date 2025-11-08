-- Cleanup script voor dubbele nieuws items
-- Run dit in je Supabase SQL Editor

-- Stap 1: Voeg status kolom toe als deze ontbreekt
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE appointments 
    ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled'));
    
    RAISE NOTICE 'Status column added to appointments table';
  ELSE
    RAISE NOTICE 'Status column already exists';
  END IF;
END $$;

-- Stap 2: Verwijder dubbele "Afspraak geannuleerd" items
-- Houdt alleen de nieuwste
WITH ranked_announcements AS (
  SELECT 
    id,
    name,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY name, description 
      ORDER BY created_at DESC
    ) as rn
  FROM announcements
  WHERE name LIKE 'Afspraak geannuleerd:%'
)
DELETE FROM announcements
WHERE id IN (
  SELECT id 
  FROM ranked_announcements 
  WHERE rn > 1
);

-- Stap 3: Verwijder dubbele "Afspraak gewijzigd" items voor dezelfde dag
-- Houdt alleen de nieuwste
WITH ranked_changes AS (
  SELECT 
    id,
    name,
    date,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY name, date
      ORDER BY created_at DESC
    ) as rn
  FROM announcements
  WHERE name LIKE 'Afspraak gewijzigd:%'
)
DELETE FROM announcements
WHERE id IN (
  SELECT id 
  FROM ranked_changes 
  WHERE rn > 1
);

-- Stap 4: Verwijder nieuws items voor afspraken die niet meer bestaan
DELETE FROM announcements
WHERE name LIKE 'Afspraak geannuleerd:%'
  AND NOT EXISTS (
    SELECT 1 
    FROM appointments 
    WHERE announcements.name = 'Afspraak geannuleerd: ' || appointments.name
      AND appointments.status = 'cancelled'
  );

-- Stap 5: Verwijder nieuws items voor afspraken die weer actief zijn gemaakt
DELETE FROM announcements
WHERE name LIKE 'Afspraak geannuleerd:%'
  AND EXISTS (
    SELECT 1 
    FROM appointments 
    WHERE announcements.name = 'Afspraak geannuleerd: ' || appointments.name
      AND appointments.status = 'active'
  );

-- Toon overgebleven nieuws items
SELECT 
  id,
  name,
  description,
  date,
  created_at
FROM announcements 
ORDER BY created_at DESC;
