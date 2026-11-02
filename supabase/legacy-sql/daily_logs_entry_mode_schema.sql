-- Ghi nhan loai dong nhat ky luc tao (full = bao cao day du, photo = anh nhanh, note = ghi chu)
-- de danh sach Nhat ky hien duoc nhan phan loai ro rang, tranh nham lan.
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS entry_mode text DEFAULT 'full';
