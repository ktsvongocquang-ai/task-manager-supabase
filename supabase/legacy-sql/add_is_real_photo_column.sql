-- Cột mới cho landing_featured_projects (project Supabase riêng landing page,
-- yiuokvszyaqqjksshybn) — hiện nhãn "Ảnh thực tế" trên công trình dùng ảnh
-- chụp hiện trường thay vì phối cảnh 3D. Additive, không đụng dữ liệu cũ.
ALTER TABLE landing_featured_projects ADD COLUMN IF NOT EXISTS is_real_photo boolean DEFAULT false;
