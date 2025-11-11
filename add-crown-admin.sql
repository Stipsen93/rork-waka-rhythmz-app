-- Add is_crown_admin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_crown_admin BOOLEAN DEFAULT FALSE;

-- Set the first created user as crown admin
UPDATE users 
SET is_crown_admin = TRUE 
WHERE id = (
  SELECT id FROM users 
  ORDER BY created_at ASC 
  LIMIT 1
);
