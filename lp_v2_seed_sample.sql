-- ============================================================
-- LP v2 — DỮ LIỆU MẪU (giả) để màn hình có nội dung khi chạy local/test.
-- Chạy SAU lp_v2_schema.sql. Mọi tên người, số liệu, ảnh ở đây là MẪU —
-- thay bằng dữ liệu thật qua /admin/landing trước khi gửi link cho khách.
-- Chạy an toàn nhiều lần (ON CONFLICT DO NOTHING / upsert theo slug).
-- ============================================================

INSERT INTO landing_pages (
  slug, default_phone, default_zalo, architect_name, architect_role,
  architect_photo, architect_signature, architect_quote, architect_zalo,
  architect_stats, offer_slots_left, offer_month, response_promise,
  legal_name, tax_code, address, maps_url, hotline, founded_at, social_links
) VALUES (
  'dqh',
  '0900000000',
  '0900000000',
  '[MẪU] Nguyễn Văn A',
  'Kiến trúc sư trưởng',
  null,
  null,
  '[MẪU] "Làm nghề tử tế — mỗi công trình là một lời hứa được giữ đúng."',
  '0900000000',
  '[{"value":"120+","label":"công trình đã bàn giao"},{"value":"98%","label":"khách hàng giới thiệu lại"},{"value":"10 năm","label":"bảo hành kết cấu"}]'::jsonb,
  3,
  '[MẪU] 11/2026',
  '[MẪU] Phản hồi trong 30 phút làm việc',
  'Công ty TNHH Kiến Trúc & Nội Thất DQH',
  '03168894xx',
  'Quận 7, TP.HCM',
  null,
  '0900000000',
  '2020-12-30',
  '[{"platform":"facebook","url":"#"},{"platform":"tiktok","url":"#"}]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO landing_segments (page_id, seg, title, subtitle, hero_image, hero_video, facts, og_image, sort_order)
SELECT id, v.seg, v.title, v.subtitle, null, null, v.facts::jsonb, null, v.sort_order
FROM landing_pages, (VALUES
  ('can-ho', '[MẪU] Căn hộ *đẳng cấp*, hoàn thiện đúng hẹn', 'Thiết kế & thi công trọn gói cho căn hộ chung cư', '{"Mô hình":"Design & Build","Phân khúc":"Căn hộ","Chuẩn dịch vụ":"JUX"}', 1),
  ('nha-pho-du-an', '[MẪU] Nhà phố dự án *tinh gọn*, ở ngay không chỉnh sửa', 'Thiết kế & thi công nhà phố trong khu dự án', '{"Mô hình":"Design & Build","Phân khúc":"Nhà phố dự án","Chuẩn dịch vụ":"DQH"}', 2),
  ('nha-pho', '[MẪU] Nhà phố *riêng*, mang đúng gu của gia chủ', 'Thiết kế & thi công nhà phố xây mới hoặc cải tạo', '{"Mô hình":"Design & Build","Phân khúc":"Nhà phố","Chuẩn dịch vụ":"DQH"}', 3),
  ('villa', '[MẪU] Villa *Quiet Luxury*, sang mà không phô', 'Thiết kế & thi công biệt thự, nhà vườn cao cấp', '{"Mô hình":"Design & Build","Phân khúc":"Villa","Chuẩn dịch vụ":"DQH"}', 4)
) AS v(seg, title, subtitle, facts, sort_order)
WHERE landing_pages.slug = 'dqh'
ON CONFLICT (page_id, seg) DO NOTHING;

INSERT INTO landing_projects (segment, title, area_m2, location, style, duration_days, problem_solved, before_image, after_image, detail_images, is_featured, sort_order) VALUES
('villa', '[MẪU] Villa Thảo Điền', 350, 'Quận 2, TP.HCM', 'Modern Tropical', 90, '[MẪU] Gia chủ cần không gian mở nhưng vẫn riêng tư với hàng xóm.', null, null, '[]'::jsonb, true, 1),
('nha-pho', '[MẪU] Nhà phố Phú Nhuận', 180, 'Phú Nhuận, TP.HCM', 'Japandi', 75, '[MẪU] Nhà ống sâu, thiếu sáng — xử lý bằng giếng trời trung tâm.', null, null, '[]'::jsonb, true, 2),
('can-ho', '[MẪU] Căn hộ Masteri', 90, 'Quận 2, TP.HCM', 'Minimalist', 35, '[MẪU] Căn hộ bàn giao thô, cần tối ưu công năng 2PN.', null, null, '[]'::jsonb, true, 3)
ON CONFLICT DO NOTHING;

INSERT INTO estimator_styles (name, card_image, moodboard_image, sort_order) VALUES
('[MẪU] Modern Tropical', null, null, 1),
('[MẪU] Japandi', null, null, 2),
('[MẪU] Minimalist', null, null, 3),
('[MẪU] Indochine', null, null, 4)
ON CONFLICT DO NOTHING;

INSERT INTO pricing_rates (segment, tier, standard, rate_per_m2, extra_per_room, extra_per_floor, margin, base_days, days_per_m2, breakdown, min_budget, tier_description) VALUES
('can-ho', 'co_ban', 'JUX', 6000000, 3000000, null, 0.10, 20, 0.25, '{"Thiết kế":10,"Phần thô":0,"Hoàn thiện":55,"Nội thất":35}'::jsonb, 300000000, '[MẪU] Hoàn thiện cơ bản, vật liệu phổ thông'),
('can-ho', 'kha', 'JUX', 8500000, 4000000, null, 0.10, 25, 0.30, '{"Thiết kế":10,"Phần thô":0,"Hoàn thiện":50,"Nội thất":40}'::jsonb, 450000000, '[MẪU] Vật liệu khá, tối ưu công năng'),
('can-ho', 'cao_cap', 'JUX', 12000000, 5000000, null, 0.10, 30, 0.35, '{"Thiết kế":12,"Phần thô":0,"Hoàn thiện":45,"Nội thất":43}'::jsonb, 700000000, '[MẪU] Vật liệu cao cấp, nội thất đặt riêng'),
('nha-pho', 'co_ban', 'DQH', 7000000, null, 150000000, 0.10, 45, 0.5, '{"Thiết kế":8,"Phần thô":35,"Hoàn thiện":32,"Nội thất":25}'::jsonb, 900000000, '[MẪU] Hoàn thiện cơ bản'),
('nha-pho', 'kha', 'DQH', 9500000, null, 180000000, 0.10, 60, 0.6, '{"Thiết kế":8,"Phần thô":33,"Hoàn thiện":32,"Nội thất":27}'::jsonb, 1300000000, '[MẪU] Vật liệu khá'),
('nha-pho', 'cao_cap', 'DQH', 13000000, null, 220000000, 0.10, 75, 0.7, '{"Thiết kế":10,"Phần thô":30,"Hoàn thiện":30,"Nội thất":30}'::jsonb, 1900000000, '[MẪU] Cao cấp, nội thất đặt riêng'),
('villa', 'co_ban', 'DQH', 9000000, null, 250000000, 0.10, 90, 0.8, '{"Thiết kế":8,"Phần thô":35,"Hoàn thiện":32,"Nội thất":25}'::jsonb, 2500000000, '[MẪU] Hoàn thiện cơ bản'),
('villa', 'kha', 'DQH', 12000000, null, 300000000, 0.10, 105, 0.9, '{"Thiết kế":8,"Phần thô":33,"Hoàn thiện":32,"Nội thất":27}'::jsonb, 3500000000, '[MẪU] Vật liệu khá'),
('villa', 'cao_cap', 'DQH', 17000000, null, 380000000, 0.10, 120, 1.0, '{"Thiết kế":10,"Phần thô":30,"Hoàn thiện":28,"Nội thất":32}'::jsonb, 5000000000, '[MẪU] Cao cấp, nội thất đặt riêng'),
('nha-pho-du-an', 'co_ban', 'DQH', 6500000, null, 120000000, 0.10, 40, 0.45, '{"Thiết kế":8,"Phần thô":20,"Hoàn thiện":40,"Nội thất":32}'::jsonb, 700000000, '[MẪU] Hoàn thiện cơ bản'),
('nha-pho-du-an', 'kha', 'DQH', 8500000, null, 150000000, 0.10, 50, 0.5, '{"Thiết kế":8,"Phần thô":18,"Hoàn thiện":38,"Nội thất":36}'::jsonb, 1000000000, '[MẪU] Vật liệu khá'),
('nha-pho-du-an', 'cao_cap', 'DQH', 11500000, null, 190000000, 0.10, 60, 0.6, '{"Thiết kế":10,"Phần thô":15,"Hoàn thiện":35,"Nội thất":40}'::jsonb, 1500000000, '[MẪU] Cao cấp')
ON CONFLICT (segment, tier) DO NOTHING;

INSERT INTO sales_reps (code, name, phone, zalo, telegram_chat_id, active) VALUES
('SALE01', '[MẪU] Sale demo', '0900000000', '0900000000', null, true)
ON CONFLICT (code) DO NOTHING;
