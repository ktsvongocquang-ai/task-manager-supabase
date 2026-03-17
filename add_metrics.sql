-- Migration to add metrics columns to marketing_tasks
ALTER TABLE marketing_tasks
ADD COLUMN IF NOT EXISTS views text,
ADD COLUMN IF NOT EXISTS interactions text,
ADD COLUMN IF NOT EXISTS shares text,
ADD COLUMN IF NOT EXISTS saves text;
