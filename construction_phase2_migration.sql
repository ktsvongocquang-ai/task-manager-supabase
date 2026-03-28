-- ═══════════════════════════════════════════════════════════
-- CONSTRUCTION MODULE — PHASE 2 MIGRATION
-- Run this AFTER construction_full_schema.sql
-- Adds missing tables, columns, and seed data
-- ═══════════════════════════════════════════════════════════

-- ── 1. Add missing columns to existing tables ──

-- construction_projects: add tracking columns
ALTER TABLE construction_projects
  ADD COLUMN IF NOT EXISTS unexpected_costs bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_documents int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS days_off int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_diary_entries int DEFAULT 0;

-- construction_milestones: add sub_tasks JSONB
ALTER TABLE construction_milestones
  ADD COLUMN IF NOT EXISTS sub_tasks jsonb DEFAULT '[]'::jsonb;

-- construction_subcontractors: add payment tracking columns
ALTER TABLE construction_subcontractors
  ADD COLUMN IF NOT EXISTS contract_amount bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_amount bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS progress_percent int DEFAULT 0;

-- daily_logs: add extra construction fields
ALTER TABLE daily_logs
  ADD COLUMN IF NOT EXISTS notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS task_category text DEFAULT '',
  ADD COLUMN IF NOT EXISTS task_progress int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contractor_photo_urls jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS video_urls jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS voice_notes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS machines text DEFAULT '',
  ADD COLUMN IF NOT EXISTS materials text DEFAULT '',
  ADD COLUMN IF NOT EXISTS reporter_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS comments jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS issue_ids jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by text DEFAULT 'ENGINEER',
  ADD COLUMN IF NOT EXISTS editable boolean DEFAULT true;

-- ── 2. New table: construction_payment_records ──
CREATE TABLE IF NOT EXISTS construction_payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES construction_projects(id) ON DELETE CASCADE,
  date date NOT NULL,
  description text NOT NULL,
  amount bigint DEFAULT 0,
  bill_photos jsonb DEFAULT '[]'::jsonb,
  type text DEFAULT 'payment_out' CHECK (type IN ('payment_out', 'payment_in')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  category text DEFAULT 'Vật liệu',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE construction_payment_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated" ON construction_payment_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_payment_records_project ON construction_payment_records(project_id);

-- ── 3. New table: construction_phases ──
CREATE TABLE IF NOT EXISTS construction_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES construction_projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text DEFAULT 'upcoming' CHECK (status IN ('done', 'doing', 'upcoming')),
  sort_order int DEFAULT 0,
  start_date date,
  end_date date,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE construction_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated" ON construction_phases
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_phases_project ON construction_phases(project_id, sort_order);

-- ── 4. Indexes for performance ──
CREATE INDEX IF NOT EXISTS idx_daily_logs_project_date ON daily_logs(project_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON construction_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_project_date ON construction_payment_records(project_id, date DESC);

-- ═══════════════════════════════════════════════════════════
-- SEED DATA — Insert if not exists
-- ═══════════════════════════════════════════════════════════

-- Projects
INSERT INTO construction_projects (id, name, address, status, progress, budget, spent, contract_value, budget_spent, risk_level, owner_name, engineer_name, start_date, handover_date, unexpected_costs, total_documents, days_off, total_diary_entries)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Nhà cô Lan - Q.7', '123 Đường số 4, P. Tân Phong, Q7', 'ĐANG THI CÔNG', 45, 2500000000, 1200000000, 2800000000, 42, 'green', 'Cô Lan', 'Nguyễn Văn Hùng', '2026-01-15', '2026-08-20', 121777000, 8, 11, 177),
  ('22222222-2222-2222-2222-222222222222', 'Biệt thự Anh Hùng - Thủ Đức', '45 Khu đô thị Vạn Phúc, Thủ Đức', 'MỚI', 28, 5000000000, 500000000, 5500000000, 35, 'yellow', 'Anh Hùng', 'Trần Minh Tuấn', '2026-02-01', '2026-11-15', 45000000, 5, 3, 42),
  ('33333333-3333-3333-3333-333333333333', 'Nhà phố Tân Bình', '78 Cộng Hòa, Q. Tân Bình', 'MỚI', 12, 1900000000, 190000000, 1900000000, 10, 'green', 'Chị Hạnh', 'Lê Quốc Bảo', '2026-03-01', '2026-09-30', 0, 3, 1, 15),
  ('44444444-4444-4444-4444-444444444444', 'Nhà phố Gò Vấp', '56 Quang Trung, Q. Gò Vấp', 'ĐANG THI CÔNG', 72, 2400000000, 1920000000, 2400000000, 80, 'red', 'Anh Tâm', 'Phạm Đức', '2025-11-01', '2026-05-15', 210000000, 12, 8, 98)
ON CONFLICT (id) DO NOTHING;

-- Tasks for project 1
INSERT INTO construction_tasks (id, project_id, name, category, status, subcontractor, days, budget, spent, approved, progress, start_date, end_date, dependencies, checklist, issues, tags)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Ép cọc bê tông cốt thép', 'PHẦN THÔ', 'DONE', 'Công ty Nền Móng Việt', 5, 150000000, 145000000, true, 100, '2026-01-15', '2026-01-20',
    '[]',
    '[{"id":"c1","label":"Kiểm tra tim cọc","completed":true,"required":true},{"id":"c2","label":"Nghiệm thu vật liệu","completed":true,"required":true},{"id":"c3","label":"Ép cọc thử","completed":true,"required":true}]',
    '[]', '["#EpCoc"]'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Đào móng và thi công đà kiềng', 'PHẦN THÔ', 'DONE', 'Công ty XD Nam', 10, 250000000, 260000000, true, 100, '2026-01-21', '2026-02-01',
    '["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]',
    '[{"id":"c4","label":"Đào đất đúng cao độ","completed":true,"required":true},{"id":"c5","label":"Lắp đặt cốt thép móng","completed":true,"required":true}]',
    '[]', '["#Mong"]'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Xây tường bao tầng trệt', 'PHẦN THÔ', 'DOING', 'Công ty XD Nam', 7, 120000000, 50000000, true, 71, '2026-02-02', '2026-02-09',
    '["bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"]',
    '[{"id":"c7","label":"Kiểm tra mạch vữa đều","completed":true,"required":true},{"id":"c8","label":"Kiểm tra thẳng đứng bằng máy","completed":false,"required":true}]',
    '[{"id":"i1","title":"Sai lệch kích thước cửa sổ","description":"Cửa sổ phòng khách lệch 5cm","status":"OPEN","severity":"HIGH","createdAt":"2026-03-20"}]',
    '["#XayTuong"]'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'Lắp đặt hệ thống điện nước âm tường', 'MEP', 'TODO', 'Điện Nước Hoàng Gia', 8, 180000000, 0, false, 0, '2026-02-10', '2026-02-18',
    '["cccccccc-cccc-cccc-cccc-cccccccccccc"]',
    '[{"id":"c10","label":"Đục tường đúng sơ đồ","completed":false,"required":true},{"id":"c11","label":"Lắp đặt ống điện","completed":false,"required":true}]',
    '[]', '["#MEP"]'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'Đổ bê tông sàn tầng 2', 'PHẦN THÔ', 'TODO', 'Công ty XD Nam', 3, 200000000, 0, false, 0, '2026-02-19', '2026-02-22',
    '["cccccccc-cccc-cccc-cccc-cccccccccccc"]', '[]', '[]', '["#BeTong"]'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111', 'Mái + Chống thấm', 'PHẦN THÔ', 'TODO', 'Công ty XD Nam', 7, 210000000, 0, false, 0, '2026-02-23', '2026-03-02',
    '["eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"]', '[]', '[]', '[]'),
  ('gggggggg-gggg-gggg-gggg-gggggggggggg', '11111111-1111-1111-1111-111111111111', 'Tô trát + Hoàn thiện', 'HOÀN THIỆN', 'TODO', 'Công ty XD Nam', 14, 420000000, 0, false, 0, '2026-03-03', '2026-03-17',
    '["ffffffff-ffff-ffff-ffff-ffffffffffff"]', '[]', '[]', '[]'),
  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', '11111111-1111-1111-1111-111111111111', 'Sơn + Vệ sinh + Bàn giao', 'HOÀN THIỆN', 'TODO', 'Sơn Bảo Ngọc', 10, 140000000, 0, false, 0, '2026-03-18', '2026-03-28',
    '["gggggggg-gggg-gggg-gggg-gggggggggggg"]', '[]', '[]', '[]')
ON CONFLICT (id) DO NOTHING;

-- Subcontractors
INSERT INTO construction_subcontractors (id, name, trade, phone, rating, project_ids, contract_amount, paid_amount, progress_percent)
VALUES
  ('s1111111-1111-1111-1111-111111111111', 'Cty Điện Minh Phát', 'Điện', '0909 123 456', 4.5, '{"11111111-1111-1111-1111-111111111111","22222222-2222-2222-2222-222222222222"}', 280000000, 180000000, 65),
  ('s2222222-2222-2222-2222-222222222222', 'Nước Toàn Thắng', 'Cấp thoát nước', '0912 345 678', 4.2, '{"11111111-1111-1111-1111-111111111111","33333333-3333-3333-3333-333333333333"}', 150000000, 95000000, 60),
  ('s3333333-3333-3333-3333-333333333333', 'Nhôm kính Đại Phát', 'Nhôm kính', '0938 567 890', 4.0, '{"22222222-2222-2222-2222-222222222222","44444444-4444-4444-4444-444444444444"}', 320000000, 160000000, 50),
  ('s4444444-4444-4444-4444-444444444444', 'Sơn Bảo Ngọc', 'Sơn nước', '0977 890 123', 4.7, '{"11111111-1111-1111-1111-111111111111","44444444-4444-4444-4444-444444444444"}', 120000000, 48000000, 35),
  ('s5555555-5555-5555-5555-555555555555', 'Công ty XD Nam', 'Xây dựng chính', '0901 234 567', 4.8, '{"11111111-1111-1111-1111-111111111111","22222222-2222-2222-2222-222222222222","33333333-3333-3333-3333-333333333333","44444444-4444-4444-4444-444444444444"}', 1800000000, 1100000000, 72)
ON CONFLICT (id) DO NOTHING;

-- Milestones for project 1
INSERT INTO construction_milestones (id, project_id, name, status, approved_date, payment_amount, payment_status, sort_order, sub_tasks)
VALUES
  ('m1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Nghiệm thu móng', 'passed', '2026-02-10', 560000000, 'paid', 1,
    '[{"id":"st1","name":"Làm lán trại thi công","status":"done","progress":100,"photos":[]},{"id":"st2","name":"Ép cọc bê tông","status":"done","progress":100,"photos":[]},{"id":"st3","name":"Đào đất hố móng","status":"done","progress":100,"photos":[]}]'),
  ('m2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Nghiệm thu kết cấu trệt', 'passed', '2026-03-10', 560000000, 'paid', 2,
    '[{"id":"st8","name":"Xây tường bao trệt","status":"done","progress":100,"photos":[]},{"id":"st9","name":"Đi cốt thép cột","status":"done","progress":100,"photos":[]}]'),
  ('m3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Nghiệm thu kết cấu lầu 1', 'pending_internal', NULL, 560000000, 'unpaid', 3,
    '[{"id":"st13","name":"Xây tường bao lầu 1","status":"done","progress":100,"photos":[]},{"id":"st14","name":"Đi cốt thép cột lầu 1","status":"doing","progress":75,"photos":[],"note":"Đang chờ thép nhập thêm"}]'),
  ('m4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Nghiệm thu kết cấu lầu 2', 'upcoming', NULL, 560000000, 'unpaid', 4, '[]'),
  ('m5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Nghiệm thu hoàn thiện + Bàn giao', 'upcoming', NULL, 560000000, 'unpaid', 5, '[]')
ON CONFLICT (id) DO NOTHING;

-- Approvals
INSERT INTO construction_approvals (id, project_id, type, title, detail, status)
VALUES
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'qc', 'QC: Cốt thép sàn lầu 1', '12 mục kiểm tra, 11 pass, 1 chờ xác nhận khoảng cách thép đai.', 'pending'),
  ('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'material', 'Đề xuất vật tư: Thép Pomina D16', 'Số lượng: 2.5 tấn. Ngân sách hạng mục còn lại: 85%.', 'pending'),
  ('a3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'variation', 'Phát sinh: KH đổi gạch ốp WC', 'Chênh lệch: +18,500,000 VND. Thời gian: +3 ngày.', 'pending'),
  ('a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'budget_alert', 'Cảnh báo: Vượt ngân sách phần thô', 'Hạng mục kết cấu đã chi 80% nhưng mới hoàn thành 65%.', 'pending')
ON CONFLICT (id) DO NOTHING;

-- Notifications
INSERT INTO construction_notifications (id, project_id, level, msg, read)
VALUES
  ('notif111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'critical', 'Gò Vấp: Vượt ngân sách phần thô 12%', false),
  ('notif222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'action', 'Q.7: QC cốt thép sàn L1 chờ duyệt', false),
  ('notif333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'action', 'Thủ Đức: Đề xuất thép Pomina 2.5T chờ duyệt', false),
  ('notif444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'good', 'Tân Bình: Hoàn thành đúng tiến độ tuần 4', true),
  ('notif555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'info', 'Q.7: Nhật ký hôm nay đã cập nhật', true)
ON CONFLICT (id) DO NOTHING;

-- Daily logs for project 1
INSERT INTO daily_logs (id, project_id, date, content, notes, weather, temperature, main_workers, helper_workers, task_category, task_progress, status, reporter_name, machines, materials, comments, created_by, editable)
VALUES
  ('dl111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2026-03-28', 'Hôm nay xây xong tường phía Đông, cần kiểm tra lại mạch vữa góc phòng khách', 'Tiến độ đúng kế hoạch. Cần nhập thêm gạch block cho tuần sau.', 'sunny/sunny', 34, 5, 3, 'Xây tường bao trệt', 71, 'pending', 'Nguyễn Văn Hùng', 'Máy trộn hồ mini, xe rùa', 'Gạch tuynel 8x8x18 (2000 viên), Xi măng INSEE (15 bao)', '[]', 'ENGINEER', true),
  ('dl222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '2026-03-27', 'Chiều mưa, ngưng thi công từ 3h. Đã che bạt tường mới xây.', 'Mưa chiều, tạm ngưng. Vật tư đủ cho 2 ngày tiếp.', 'sunny/rainy', 30, 5, 3, 'Xây tường bao trệt', 65, 'approved', 'Nguyễn Văn Hùng', 'Máy trộn hồ mini', 'Cát xây, Đá mi bụi', '[{"id":"cmt1","author":"Quản lý","text":"Nhớ trùm nilon kỹ để mai xây tiếp không bị ướt gạch","time":"16:45"}]', 'ENGINEER', true),
  ('dl333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '2026-03-26', 'Thợ chính nghỉ 1 người. Tiến độ giảm nhẹ.', 'Thợ chính nghỉ 1 người. Tiến độ giảm nhẹ.', 'cloudy/sunny', 32, 4, 3, 'Xây tường bao trệt', 55, 'approved', 'Nguyễn Văn Hùng', 'Máy cắt gạch', 'Gạch tuynel', '[]', 'ENGINEER', true),
  ('dl444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '2026-03-25', 'Mưa cả ngày, công trường ngập nước. Đã bơm thoát nước.', 'Mưa lớn cả ngày, nghỉ thi công. Kiểm tra chống thấm tạm.', 'rainy/rainy', 26, 0, 0, 'Nghỉ do mưa', 50, 'approved', 'Nguyễn Văn Hùng', 'Máy bơm chìm', '', '[{"id":"cmt2","author":"Cô Lan (Chủ nhà)","text":"Cố gắng bơm nước nhanh để mai làm lại nhé cháu","time":"10:15"}]', 'ENGINEER', false)
ON CONFLICT (id) DO NOTHING;

-- Payment records for project 1
INSERT INTO construction_payment_records (id, project_id, date, description, amount, type, status, category)
VALUES
  ('pay11111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2026-01-20', 'Thanh toán đợt 1 - Ép cọc', 560000000, 'payment_in', 'confirmed', 'Nghiệm thu'),
  ('pay22222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '2026-02-15', 'Chi thép cây Pomina D16', 340000000, 'payment_out', 'confirmed', 'Vật liệu'),
  ('pay33333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '2026-03-10', 'Thanh toán đợt 2 - Kết cấu trệt', 560000000, 'payment_in', 'confirmed', 'Nghiệm thu'),
  ('pay44444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '2026-03-20', 'Chi nhân công tháng 3', 180000000, 'payment_out', 'confirmed', 'Nhân công'),
  ('pay55555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '2026-04-05', 'Thu đợt 3 - Kết cấu lầu 1 (dự kiến)', 560000000, 'payment_in', 'pending', 'Nghiệm thu')
ON CONFLICT (id) DO NOTHING;

-- Construction phases for project 1
INSERT INTO construction_phases (id, project_id, name, status, sort_order, start_date, end_date)
VALUES
  ('ph111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Chuẩn bị mặt bằng', 'done', 1, '2026-01-10', '2026-01-14'),
  ('ph222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Thi công phần móng', 'done', 2, '2026-01-15', '2026-02-01'),
  ('ph333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Thi công kết cấu', 'doing', 3, '2026-02-02', '2026-03-28'),
  ('ph444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Thi công MEP', 'upcoming', 4, '2026-03-29', '2026-05-15'),
  ('ph555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Hoàn thiện', 'upcoming', 5, '2026-05-16', '2026-08-10'),
  ('ph666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Bàn giao', 'upcoming', 6, '2026-08-11', '2026-08-20')
ON CONFLICT (id) DO NOTHING;

-- Attendance for project 1
INSERT INTO construction_attendance (id, project_id, date, main_workers, helper_workers, daily_rate_main, daily_rate_helper)
VALUES
  ('att11111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2026-03-28', 5, 3, 450000, 280000),
  ('att22222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '2026-03-27', 5, 3, 450000, 280000),
  ('att33333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '2026-03-26', 4, 3, 450000, 280000),
  ('att44444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '2026-03-25', 0, 0, 450000, 280000),
  ('att55555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '2026-03-24', 5, 4, 450000, 280000),
  ('att66666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', '2026-03-23', 5, 3, 450000, 280000),
  ('att77777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '2026-03-22', 5, 3, 450000, 280000)
ON CONFLICT (id) DO NOTHING;
