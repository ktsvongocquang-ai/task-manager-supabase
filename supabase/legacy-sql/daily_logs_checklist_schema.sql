-- Them checklist cho Nhat ky/Ghi chu (giong Nhac viec) - danh cho ca 2 che do full va note.
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS checklist jsonb DEFAULT '[]'::jsonb;
