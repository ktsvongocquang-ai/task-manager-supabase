-- Run this in Supabase SQL Editor
-- Enables manual drag-and-drop reordering of tasks within a project phase
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER;
