-- ============================================================
-- Chạy trong project Supabase "DQH MIROR Quangmui@2512", SAU các file
-- landing_page_sample_fill*.sql trước đó.
-- Tách giá thiết kế riêng khỏi giá thi công tại phần "Chi phí thiết kế &
-- thi công" (min/max_price_per_m2 cũ giờ là giá THI CÔNG).
-- An toàn chạy nhiều lần.
-- ============================================================

ALTER TABLE landing_price_rates ADD COLUMN IF NOT EXISTS design_min_price_per_m2 numeric;
ALTER TABLE landing_price_rates ADD COLUMN IF NOT EXISTS design_max_price_per_m2 numeric;

UPDATE landing_price_rates SET design_min_price_per_m2 = 800000, design_max_price_per_m2 = 1200000 WHERE category = 'apartment' AND standard = 'jux';
UPDATE landing_price_rates SET design_min_price_per_m2 = 1000000, design_max_price_per_m2 = 1500000 WHERE category = 'house_villa' AND standard = 'dqh';
