-- Add deleted_by_user field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted_by_user BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for deleted users
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted_by_user) WHERE deleted_by_user = TRUE;
