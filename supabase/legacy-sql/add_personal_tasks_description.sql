-- Add description column to personal_tasks
ALTER TABLE personal_tasks ADD COLUMN IF NOT EXISTS description TEXT;
