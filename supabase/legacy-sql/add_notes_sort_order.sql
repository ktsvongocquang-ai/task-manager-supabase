-- Add sort_order column to personal_notes for drag & drop reordering
ALTER TABLE personal_notes ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Backfill existing notes with sequential sort_order based on created_at
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
  FROM personal_notes
)
UPDATE personal_notes
SET sort_order = numbered.rn
FROM numbered
WHERE personal_notes.id = numbered.id;
