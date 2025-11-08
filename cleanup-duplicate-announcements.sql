-- Cleanup script voor dubbele nieuws items
-- Run dit in je Supabase SQL Editor

-- Verwijder dubbele "Afspraak geannuleerd" items
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

-- Verwijder dubbele "Afspraak gewijzigd" items voor dezelfde dag
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

-- Verwijder nieuws items voor afspraken die niet meer bestaan
DELETE FROM announcements
WHERE name LIKE 'Afspraak geannuleerd:%'
  AND NOT EXISTS (
    SELECT 1 
    FROM appointments 
    WHERE announcements.name = 'Afspraak geannuleerd: ' || appointments.name
      AND appointments.status = 'cancelled'
  );

-- Toon overgebleven nieuws items
SELECT * FROM announcements ORDER BY created_at DESC;
