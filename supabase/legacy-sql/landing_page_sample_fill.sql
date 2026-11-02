-- ============================================================
-- DỮ LIỆU MẪU để xem đầy đủ layout /p/:token ngay (chưa phải số liệu
-- thật) — chạy trong project Supabase "DQH MIROR Quangmui@2512",
-- SAU khi đã chạy landing_page_content_schema.sql + landing_admin_auth_schema.sql.
-- Sửa lại thành dữ liệu thật qua /landing-admin bất cứ lúc nào, hoặc
-- chạy lại khối INSERT tương ứng với số liệu mới (có ON CONFLICT nên an
-- toàn chạy nhiều lần).
-- ============================================================

-- 1) Công trình tiêu biểu (ảnh placeholder, xoá "[MẪU]" + đổi ảnh thật sau)
INSERT INTO landing_featured_projects (category, title, style, info, project_type, construction_time, image_url, case_study, sort_order, is_published) VALUES
('apartment', '[MẪU] Căn hộ Masteri Thảo Điền', 'Minimalist', '90m² — Quận 2, TP.HCM', 'Căn hộ 2PN', '35 ngày', 'https://picsum.photos/seed/dqh-apt-1/1200/900',
  '{"introText":"[MẪU] Căn hộ bàn giao thô, tối ưu công năng cho gia đình trẻ.","floorPlan":{"text":"[MẪU] Mặt bằng gốc thiếu kho chứa đồ — bố trí lại vách ngăn để thêm tủ âm tường.","sitePhoto":null,"blueprint":null},"design3D":{"text":"[MẪU] Phối cảnh tông màu be - gỗ sáng, ánh sáng tự nhiên.","images":[]},"tailoring":{"text":"[MẪU] Tinh chỉnh vật liệu sàn và đá bếp theo mẫu thực tế.","steps":[]},"structural":{"text":"[MẪU] Thi công phần thô, đi lại đường điện nước.","imgMain":null},"material":{"text":"[MẪU] Chọn gạch, sơn, đá theo mood sáng.","samples":[]},"fixedInterior":{"text":"[MẪU] Tủ bếp, tủ quần áo đóng theo module.","imgMain":null},"looseFurniture":{"text":"[MẪU] Sofa, bàn ăn, đèn trang trí.","imgMain":null},"details":{"items":[]},"finalize":{"text":"[MẪU] Bàn giao, dọn dẹp, bàn giao hồ sơ bảo hành.","images":[]}}'::jsonb,
  1, true),
('apartment', '[MẪU] Căn hộ Vinhomes Grand Park', 'Japandi', '70m² — Quận 9, TP.HCM', 'Căn hộ 1PN+1', '28 ngày', 'https://picsum.photos/seed/dqh-apt-2/1200/900', NULL, 2, true),
('house_villa', '[MẪU] Nhà phố Phú Nhuận', 'Modern Tropical', '180m² — Phú Nhuận, TP.HCM', 'Nhà phố 1 trệt 3 lầu', '75 ngày', 'https://picsum.photos/seed/dqh-house-1/1200/900',
  '{"introText":"[MẪU] Nhà ống sâu, thiếu sáng — xử lý bằng giếng trời trung tâm.","floorPlan":{"text":"[MẪU] Bố trí lại cầu thang để lấy sáng xuyên suốt 4 tầng.","sitePhoto":null,"blueprint":null},"design3D":{"text":"[MẪU] Phối cảnh tông trắng - gỗ, cây xanh trong nhà.","images":[]},"tailoring":{"text":"[MẪU] Tinh chỉnh kích thước giếng trời và lam che nắng.","steps":[]},"structural":{"text":"[MẪU] Đổ móng, dựng khung kết cấu 4 tầng.","imgMain":null},"material":{"text":"[MẪU] Gạch terrazzo, gỗ óc chó công nghiệp.","samples":[]},"fixedInterior":{"text":"[MẪU] Tủ bếp, cầu thang gỗ.","imgMain":null},"looseFurniture":{"text":"[MẪU] Nội thất phòng khách, phòng ngủ.","imgMain":null},"details":{"items":[]},"finalize":{"text":"[MẪU] Nghiệm thu từng tầng, bàn giao chìa khóa.","images":[]}}'::jsonb,
  1, true),
('house_villa', '[MẪU] Villa Thảo Điền', 'Quiet Luxury', '350m² — Quận 2, TP.HCM', 'Biệt thự sân vườn', '120 ngày', 'https://picsum.photos/seed/dqh-house-2/1200/900', NULL, 2, true)
ON CONFLICT DO NOTHING;

-- 2) Chi phí thiết kế & thi công (so sánh DQH/JUX)
INSERT INTO landing_pricing_standards (category, standard, construction_time, design_style, material_partners) VALUES
('apartment', 'jux', '25 - 35 ngày', 'Minimalist, Japandi, Indochine', '[MẪU] Đồng Tâm, An Cường, Toto'),
('apartment', 'dqh', '30 - 45 ngày', 'Modern Luxury, Classic', '[MẪU] Đồng Tâm, An Cường, Kohler'),
('house_villa', 'dqh', '60 - 120 ngày', 'Modern Tropical, Quiet Luxury', '[MẪU] An Cường, Kohler, Hafele'),
('house_villa', 'jux', '45 - 90 ngày', 'Minimalist, Scandinavian', '[MẪU] An Cường, Toto, Hafele')
ON CONFLICT (category, standard) DO UPDATE SET
  construction_time = EXCLUDED.construction_time,
  design_style = EXCLUDED.design_style,
  material_partners = EXCLUDED.material_partners;

-- 3) Đội ngũ nhân sự
INSERT INTO landing_team_members (group_key, name, role, sort_order) VALUES
('design', '[MẪU] Nguyễn Văn A', 'Kiến trúc sư trưởng', 1),
('design', '[MẪU] Trần Thị B', 'Concept Designer', 2),
('construction', '[MẪU] Lê Văn C', 'Quản lý dự án (PM)', 1),
('construction', '[MẪU] Phạm Văn D', 'Giám sát hiện trường', 2),
('workshop', '[MẪU] Hoàng Văn E', 'Tổ trưởng xưởng gỗ', 1),
('workshop', '[MẪU] Vũ Thị F', 'QC vật liệu', 2)
ON CONFLICT DO NOTHING;

-- 4) Đơn giá/m² cho calculator (số mẫu — thay bằng giá thật trước khi gửi khách)
INSERT INTO landing_price_rates (category, standard, min_price_per_m2, max_price_per_m2) VALUES
('apartment', 'jux', 6000000, 9000000),
('apartment', 'dqh', 8000000, 12000000),
('house_villa', 'dqh', 7500000, 11000000),
('house_villa', 'jux', 6500000, 9500000)
ON CONFLICT (category, standard) DO UPDATE SET
  min_price_per_m2 = EXCLUDED.min_price_per_m2,
  max_price_per_m2 = EXCLUDED.max_price_per_m2;
