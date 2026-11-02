-- Danh dau "loi can sua" cho luong Chup anh nhanh, hien badge canh bao trong danh sach Nhat ky.
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS is_issue boolean DEFAULT false;
