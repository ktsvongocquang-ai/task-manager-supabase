-- ============================================================
-- CHẠY FILE NÀY TRONG PROJECT SUPABASE "DQH MIROR Quangmui@2512"
-- (ref yiuokvszyaqqjksshybn) — KHÔNG PHẢI project "quan ly cong ty".
-- Lưu nội dung landing page /p/:token (6 phần: Công trình tiêu biểu,
-- Chi phí DQH/JUX, Quy trình, Đội ngũ, Công ty, Đơn giá calculator).
-- Đọc công khai (anon SELECT) vì landing page không cần đăng nhập để xem;
-- KHÔNG cấp quyền ghi cho anon — sửa nội dung qua Supabase Table Editor
-- (đăng nhập chủ project, tự bỏ qua RLS), không qua app.
-- ============================================================

-- 1) Công trình tiêu biểu (phần 1) — kèm case-study 5 giai đoạn dạng jsonb
CREATE TABLE IF NOT EXISTS landing_featured_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL, -- 'apartment' | 'house_villa'
  title text NOT NULL,
  style text,
  info text,
  project_type text,
  construction_time text,
  image_url text,
  case_study jsonb, -- { introText, floorPlan:{...}, design3D:{...}, tailoring:{...}, structural:{...}, material:{...}, fixedInterior:{...}, looseFurniture:{...}, details:{...}, finalize:{...} }
  sort_order int DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2) Chi phí thiết kế & thi công (phần 2) — so sánh DQH/JUX theo category
CREATE TABLE IF NOT EXISTS landing_pricing_standards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL, -- 'apartment' | 'house_villa'
  standard text NOT NULL, -- 'dqh' | 'jux'
  construction_time text,
  design_style text,
  material_partners text,
  UNIQUE (category, standard)
);

-- 3b) Quy trình làm việc (phần 3)
CREATE TABLE IF NOT EXISTS landing_workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_no text NOT NULL, -- '01'..'08'
  title text NOT NULL,
  duration text,
  executor text,
  details text,
  sort_order int DEFAULT 0,
  UNIQUE (step_no)
);
ALTER TABLE landing_workflow_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "landing_workflow_steps_public_read" ON landing_workflow_steps;
CREATE POLICY "landing_workflow_steps_public_read" ON landing_workflow_steps FOR SELECT TO anon, authenticated USING (true);

-- Nội dung quy trình 8 bước đã có sẵn, chèn trước luôn (không phải số liệu
-- kinh doanh cần [cần điền], chỉ là mô tả quy trình chung).
INSERT INTO landing_workflow_steps (step_no, title, duration, executor, details, sort_order) VALUES
('01', 'Khảo sát & Tư vấn', 'Trong 48 giờ', 'KTS phụ trách & PM', 'Đo đạc hiện trạng bằng máy quét laser, phỏng vấn chuyên sâu thói quen sinh hoạt của gia đình, phân tích hướng nắng hướng gió, đề xuất mặt bằng công năng 2D sơ bộ hoàn toàn miễn phí.', 1),
('02', 'Thiết kế Concept 3D', '7 - 14 Ngày', 'Team Concept & Creative Director', 'Lên phối cảnh 3D các không gian chính, dựng moodboard bảng mẫu vật liệu thực tế, cân đối ánh sáng ảo. Hỗ trợ chỉnh sửa đến khi gia chủ hài lòng.', 2),
('03', 'Bản vẽ Kỹ thuật & BOQ', '10 - 15 Ngày', 'Kỹ sư cơ điện & Bộ phận dự toán', 'Triển khai bộ bản vẽ chi tiết thi công, lập bảng bóc tách khối lượng BOQ chính xác đến từng con ốc, mã sơn và ray trượt. Cam kết chi phí BOQ cố định, không phát sinh chi phí ẩn.', 3),
('04', 'Ký hợp đồng & Kick-off', '1 - 2 Ngày', 'Ban giám đốc & Toàn bộ team dự án', 'Ký hợp đồng thi công với tổng giá cố định, lịch thanh toán theo milestone rõ ràng và điều khoản phạt trễ tiến độ. Họp khởi động dự án giới thiệu KTS, Kỹ sư kết cấu và Giám sát hiện trường với gia chủ.', 4),
('05', 'Thi công phần thô', '60 - 90 Ngày', 'Đội ngũ kỹ sư & Giám sát hiện trường', 'Đổ bê tông cốt thép móng kết cấu, đi hệ thống ME&P. Test ngâm nước toilet và ban công 72 giờ, mời gia chủ nghiệm thu trực tiếp trước khi lấp nền.', 5),
('06', 'Hoàn thiện & Nội thất', '30 - 45 Ngày', 'Xưởng gỗ DQH & Đội hoàn thiện', 'Sản xuất nội thất gỗ theo bản vẽ CAD tại xưởng, sơn phủ mờ mộc tự nhiên. Vận chuyển lắp ráp tại công trình, kiểm tra khớp shadow line 3mm chuyển tiếp tường thạch cao.', 6),
('07', 'Nghiệm thu & Bàn giao', '7 Ngày', 'Gia chủ & KTS trưởng', 'Cùng gia chủ rà soát checklist nghiệm thu từng chi tiết. Khắc phục toàn bộ lỗi nhỏ (defect list) trước khi chính thức bàn giao hồ sơ hoàn công và chìa khóa.', 7),
('08', 'Bảo hành & Chăm sóc sau', 'Bảo hành kết cấu 10 năm', 'Hotline 24/7 của DQH', 'Bảo hành kết cấu 10 năm, chống thấm 5 năm, hoàn thiện nội thất 5 năm. Phản hồi bảo trì trong 2 giờ làm việc, kỹ thuật viên có mặt xử lý tại hiện trường trong 24-48 giờ.', 8)
ON CONFLICT (step_no) DO NOTHING;

-- 4) Đội ngũ nhân sự (phần 4)
CREATE TABLE IF NOT EXISTS landing_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_key text NOT NULL, -- 'design' | 'construction' | 'workshop'
  name text NOT NULL,
  role text,
  sort_order int DEFAULT 0
);

-- 4) Thông tin công ty (phần 5) — 1 dòng duy nhất
CREATE TABLE IF NOT EXISTS landing_company_info (
  id int PRIMARY KEY DEFAULT 1,
  founded_date text,
  scale_value text,
  scale_note text,
  address_value text,
  address_note text,
  project_types text,
  legal_name text,
  tax_code text,
  CONSTRAINT single_row CHECK (id = 1)
);

-- 5) Đơn giá/m2 cho calculator (phần 6) — để trống min/max = chưa có giá
CREATE TABLE IF NOT EXISTS landing_price_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL, -- 'apartment' | 'house_villa'
  standard text NOT NULL, -- 'dqh' | 'jux'
  min_price_per_m2 numeric,
  max_price_per_m2 numeric,
  UNIQUE (category, standard)
);

ALTER TABLE landing_featured_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pricing_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_price_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "landing_featured_projects_public_read" ON landing_featured_projects;
CREATE POLICY "landing_featured_projects_public_read" ON landing_featured_projects FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "landing_pricing_standards_public_read" ON landing_pricing_standards;
CREATE POLICY "landing_pricing_standards_public_read" ON landing_pricing_standards FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "landing_team_members_public_read" ON landing_team_members;
CREATE POLICY "landing_team_members_public_read" ON landing_team_members FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "landing_company_info_public_read" ON landing_company_info;
CREATE POLICY "landing_company_info_public_read" ON landing_company_info FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "landing_price_rates_public_read" ON landing_price_rates;
CREATE POLICY "landing_price_rates_public_read" ON landing_price_rates FOR SELECT TO anon, authenticated USING (true);

-- Dòng thông tin công ty mặc định (số liệu thật đã công bố sẵn trên trang
-- cũ) — sửa lại trực tiếp trong Table Editor khi có số liệu mới.
INSERT INTO landing_company_info (id, founded_date, scale_value, scale_note, address_value, address_note, project_types, legal_name, tax_code)
VALUES (1, '30/12/2020', 'Xưởng 1.500m²', 'Xưởng sản xuất nội thất DQH tại Bình Chánh', 'Quận 7, TP.HCM', 'Showroom & văn phòng — nơi trưng bày mẫu vật liệu thật', NULL, 'Công ty TNHH Kiến Trúc & Nội Thất DQH', '03168894xx')
ON CONFLICT (id) DO NOTHING;
