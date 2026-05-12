-- Run this in Supabase SQL Editor
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_time TIME;
ALTER TABLE personal_tasks ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE personal_tasks ADD COLUMN IF NOT EXISTS due_time TIME;
