-- ============================================================
-- Chạy trong project Supabase "DQH MIROR Quangmui@2512", SAU khi đã chạy
-- các file landing_page_sample_fill*.sql trước đó.
-- Thêm phần "Thông tin công ty" kể chuyện (Lịch sử hình thành / Tầm nhìn /
-- Triết lý làm nghề) — tham khảo bố cục kooperchitect.com/ve-chung-toi.
-- An toàn chạy nhiều lần.
-- ============================================================

ALTER TABLE landing_company_info ADD COLUMN IF NOT EXISTS history_text text;
ALTER TABLE landing_company_info ADD COLUMN IF NOT EXISTS history_image text;
ALTER TABLE landing_company_info ADD COLUMN IF NOT EXISTS vision_text text;
ALTER TABLE landing_company_info ADD COLUMN IF NOT EXISTS vision_image text;
ALTER TABLE landing_company_info ADD COLUMN IF NOT EXISTS philosophy_text text;
ALTER TABLE landing_company_info ADD COLUMN IF NOT EXISTS philosophy_image text;

UPDATE landing_company_info SET
  history_text = '[MẪU] Thành lập ngày 30/12/2020 từ một xưởng mộc nhỏ tại Bình Chánh, DQH bắt đầu bằng những đơn hàng nội thất đặt riêng cho vài khách hàng quen. Đến nay, DQH đã trở thành đơn vị thiết kế & thi công trọn gói với xưởng sản xuất 1.500m² và đội ngũ hơn 20 nhân sự.',
  history_image = 'https://picsum.photos/seed/dqh-history/1600/1000',
  vision_text = '[MẪU] Trở thành đơn vị Design & Build được tin tưởng hàng đầu tại TP.HCM — nơi mỗi công trình là một lời hứa được giữ đúng, từ bản vẽ đầu tiên đến ngày bàn giao.',
  vision_image = 'https://picsum.photos/seed/dqh-vision/1600/1000',
  philosophy_text = '[MẪU] "Làm nghề tử tế" — chúng tôi tin rằng sự tinh tế nằm ở từng chi tiết nhỏ: đường ron gạch thẳng tắp, bản lề đóng êm không tiếng động, và một cam kết không bao giờ thất hứa với khách hàng.',
  philosophy_image = 'https://picsum.photos/seed/dqh-philosophy/1600/1000'
WHERE id = 1;
