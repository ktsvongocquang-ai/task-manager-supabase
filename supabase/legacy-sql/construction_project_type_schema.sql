-- Loai hinh cong trinh (Xay moi / Cai tao / Sua chua / Can ho) - dung de wizard "Flow de xuat"
-- tu an bot giai doan/viec khong phu hop voi loai cong trinh.
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS project_type text;
