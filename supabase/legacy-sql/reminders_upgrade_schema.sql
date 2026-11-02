-- Nang cap Nhac viec: them Hang muc, Checklist, Anh dinh kem.
ALTER TABLE construction_reminders ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE construction_reminders ADD COLUMN IF NOT EXISTS checklist jsonb DEFAULT '[]'::jsonb;
ALTER TABLE construction_reminders ADD COLUMN IF NOT EXISTS photo_urls jsonb DEFAULT '[]'::jsonb;
