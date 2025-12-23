-- Verwijder het "Optreden" appointment en gerelateerde announcements uit de database
DELETE FROM appointments WHERE name = 'Optreden' OR name LIKE '%Optreden%';
DELETE FROM appointments WHERE name = 'Optreden FC Eindhoven';
DELETE FROM announcements WHERE name = 'Optreden' OR name LIKE '%Optreden%';
