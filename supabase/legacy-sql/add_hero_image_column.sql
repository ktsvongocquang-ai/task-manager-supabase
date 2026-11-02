-- Thêm cột ảnh bìa trang chủ (Hero) vào bảng landing_company_info đã có sẵn
-- (bảng chỉ có 1 dòng id=1, dùng chung cho "Thông tin công ty"). Trước đây
-- ảnh hero bị viết cứng URL Unsplash trong code, không có nút đổi trong
-- admin — thêm cột này để admin tự đổi ảnh bìa qua trang /landing-admin.

ALTER TABLE landing_company_info ADD COLUMN IF NOT EXISTS hero_image text;
