-- Mo rong phieu nghiem thu (construction_acceptances) de khop day du voi
-- mau "Phieu Nghiem Thu Hang Muc Cong Tac" (thong tin cong trinh, ket luan,
-- khac phuc, chu ky dien tu 2 ben).
ALTER TABLE construction_acceptances ADD COLUMN IF NOT EXISTS work_name text;
ALTER TABLE construction_acceptances ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE construction_acceptances ADD COLUMN IF NOT EXISTS so_phieu text;
ALTER TABLE construction_acceptances ADD COLUMN IF NOT EXISTS ngay_nghiem_thu date;
ALTER TABLE construction_acceptances ADD COLUMN IF NOT EXISTS don_vi_thi_cong text;
ALTER TABLE construction_acceptances ADD COLUMN IF NOT EXISTS giam_sat text;
ALTER TABLE construction_acceptances ADD COLUMN IF NOT EXISTS dai_dien_khach_hang text;
ALTER TABLE construction_acceptances ADD COLUMN IF NOT EXISTS khac_phuc text;
ALTER TABLE construction_acceptances ADD COLUMN IF NOT EXISTS thoi_han date;
ALTER TABLE construction_acceptances ADD COLUMN IF NOT EXISTS sig_thi_cong_url text;
ALTER TABLE construction_acceptances ADD COLUMN IF NOT EXISTS sig_khach_hang_url text;
ALTER TABLE construction_acceptances ADD COLUMN IF NOT EXISTS name_thi_cong text;
ALTER TABLE construction_acceptances ADD COLUMN IF NOT EXISTS name_khach_hang text;

-- Nhieu anh cho moi tieu chi (thay vi 1 anh photo_url nhu truoc).
ALTER TABLE construction_acceptance_items ADD COLUMN IF NOT EXISTS photo_urls jsonb DEFAULT '[]'::jsonb;
