-- ============================================================
-- Chạy trong project Supabase "DQH MIROR Quangmui@2512", SAU khi đã chạy
-- landing_page_sample_fill.sql. An toàn chạy nhiều lần.
-- ============================================================

-- 1) Thêm cột "lịch sử kinh nghiệm" cho nhân sự
ALTER TABLE landing_team_members ADD COLUMN IF NOT EXISTS experience text;

UPDATE landing_team_members SET experience = v.experience FROM (VALUES
  ('[MẪU] Nguyễn Văn A', '8 năm kinh nghiệm thiết kế kiến trúc, từng phụ trách 40+ công trình nhà phố & biệt thự tại TP.HCM.'),
  ('[MẪU] Trần Thị B', '5 năm concept design, chuyên phong cách Modern Tropical & Japandi, tốt nghiệp ĐH Kiến trúc TP.HCM.'),
  ('[MẪU] Lê Văn C', '10 năm quản lý dự án xây dựng dân dụng, chứng chỉ hành nghề quản lý dự án hạng II.'),
  ('[MẪU] Phạm Văn D', '7 năm giám sát hiện trường, kiểm soát chất lượng thi công phần thô & hoàn thiện.'),
  ('[MẪU] Hoàng Văn E', '12 năm nghề mộc, tổ trưởng xưởng sản xuất nội thất gỗ tự nhiên & công nghiệp.'),
  ('[MẪU] Vũ Thị F', '4 năm kiểm soát chất lượng vật liệu đầu vào, đối chiếu mẫu thực tế trước khi thi công.')
) AS v(name, experience)
WHERE landing_team_members.name = v.name;

-- 2) Thêm công trình cho đủ tối thiểu 4 Chung cư + 4 Nhà phố/Villa
INSERT INTO landing_featured_projects (category, title, style, info, project_type, construction_time, image_url, case_study, sort_order, is_published) VALUES
('apartment', '[MẪU] Căn hộ The Marq', 'Modern Luxury', '120m² — Quận 1, TP.HCM', 'Căn hộ 3PN', '45 ngày', 'https://picsum.photos/seed/dqh-apt-3/1200/900',
  '{"location":"Quận 1, TP.HCM","area":"120m²","style":"Modern Luxury","introText":"[MẪU] Căn hộ cao cấp, gia chủ ưu tiên không gian tiếp khách sang trọng.","floorPlan":{"text":"[MẪU] Gộp phòng ăn và bếp thành không gian mở liên thông phòng khách.","sitePhoto":null,"blueprint":null},"design3D":{"text":"[MẪU] Tông màu trung tính, nhấn nhá đá marble và đồng.","images":[]},"tailoring":{"text":"[MẪU] Chọn đá marble thật thay vì đá nhân tạo theo yêu cầu gia chủ.","steps":[]},"structural":{"text":"[MẪU] Thi công phần thô, xử lý chống ồn giữa các phòng.","imgMain":null},"material":{"text":"[MẪU] Đá marble, gỗ óc chó, kim loại đồng mờ.","samples":[]},"fixedInterior":{"text":"[MẪU] Tủ bếp đảo, quầy bar mini.","imgMain":null},"looseFurniture":{"text":"[MẪU] Sofa da, bàn ăn đá marble.","imgMain":null},"details":{"items":[]},"finalize":{"text":"[MẪU] Bàn giao, hướng dẫn bảo quản vật liệu đá.","images":[]}}'::jsonb,
  3, true),
('apartment', '[MẪU] Căn hộ Sunrise City', 'Scandinavian', '65m² — Quận 7, TP.HCM', 'Căn hộ 2PN', '30 ngày', 'https://picsum.photos/seed/dqh-apt-4/1200/900', NULL, 4, true),
('house_villa', '[MẪU] Nhà phố Gò Vấp', 'Indochine', '150m² — Gò Vấp, TP.HCM', 'Nhà phố 1 trệt 2 lầu', '65 ngày', 'https://picsum.photos/seed/dqh-house-3/1200/900',
  '{"location":"Gò Vấp, TP.HCM","area":"150m²","style":"Indochine","introText":"[MẪU] Gia chủ muốn giữ nét hoài cổ nhưng vẫn tiện nghi hiện đại.","floorPlan":{"text":"[MẪU] Tận dụng khoảng thông tầng để lấy sáng tự nhiên cho cầu thang.","sitePhoto":null,"blueprint":null},"design3D":{"text":"[MẪU] Phối cảnh tông vàng đất, hoạ tiết gạch bông.","images":[]},"tailoring":{"text":"[MẪU] Chọn gạch bông thật thay vì gạch in hoạ tiết.","steps":[]},"structural":{"text":"[MẪU] Thi công phần thô, gia cố móng do nền đất yếu.","imgMain":null},"material":{"text":"[MẪU] Gạch bông, gỗ xoan đào, mây tre.","samples":[]},"fixedInterior":{"text":"[MẪU] Tủ bếp gỗ xoan đào, vách ngăn hoa gió.","imgMain":null},"looseFurniture":{"text":"[MẪU] Bàn ghế mây, đèn lồng trang trí.","imgMain":null},"details":{"items":[]},"finalize":{"text":"[MẪU] Bàn giao, chụp ảnh lưu hồ sơ hoàn công.","images":[]}}'::jsonb,
  3, true),
('house_villa', '[MẪU] Villa Nhơn Trạch', 'Minimalist Tropical', '420m² — Nhơn Trạch, Đồng Nai', 'Biệt thự nghỉ dưỡng', '150 ngày', 'https://picsum.photos/seed/dqh-house-4/1200/900', NULL, 4, true)
ON CONFLICT DO NOTHING;

-- 3) Bổ sung location/area/style còn thiếu trong case_study của 2 công trình cũ
-- (nguyên nhân hiện "[CẦN ĐIỀN]" trong modal Case Study)
UPDATE landing_featured_projects
SET case_study = case_study || '{"location":"Quận 2, TP.HCM","area":"90m²","style":"Minimalist"}'::jsonb
WHERE title = '[MẪU] Căn hộ Masteri Thảo Điền' AND case_study IS NOT NULL;

UPDATE landing_featured_projects
SET case_study = case_study || '{"location":"Phú Nhuận, TP.HCM","area":"180m²","style":"Modern Tropical"}'::jsonb
WHERE title = '[MẪU] Nhà phố Phú Nhuận' AND case_study IS NOT NULL;
