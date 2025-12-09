-- Add visibility fields to media_library and media_folders tables

-- Add visibility fields to media_library
ALTER TABLE media_library
ADD COLUMN IF NOT EXISTS visible_to_all BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS visible_to_user_ids TEXT[] DEFAULT '{}';

-- Add visibility fields to media_folders
ALTER TABLE media_folders
ADD COLUMN IF NOT EXISTS visible_to_all BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS visible_to_user_ids TEXT[] DEFAULT '{}';

-- Update existing rows to be visible to all
UPDATE media_library SET visible_to_all = true WHERE visible_to_all IS NULL;
UPDATE media_folders SET visible_to_all = true WHERE visible_to_all IS NULL;
