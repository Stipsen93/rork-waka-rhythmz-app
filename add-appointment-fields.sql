ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS for_user_id TEXT,
ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT FALSE;

ALTER TABLE appointments
ADD CONSTRAINT appointments_for_user_id_fkey
FOREIGN KEY (for_user_id) REFERENCES users(id) ON DELETE SET NULL;

UPDATE appointments
SET confirmed = FALSE
WHERE confirmed IS NULL;
