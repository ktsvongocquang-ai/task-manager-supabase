-- 1) Mở rộng daily_logs — chỉ thêm cột, không đổi cột cũ
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS weather_periods jsonb; -- {"sang":"Nắng","trua":"Mưa","chieu":"Râm","toi":"Nắng","dem":"Râm"}
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS quality_ratings jsonb; -- {"an_toan":"Tốt","chat_luong":"Trung bình","tien_do":"Tốt","ve_sinh":"Tốt"}
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS incident_photo_urls jsonb DEFAULT '[]'::jsonb;

-- 2) Khối lượng công việc theo từng nhật ký (khác hẳn project_boq_items — không đụng bảng đó)
CREATE TABLE IF NOT EXISTS daily_log_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id uuid NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  item_name text NOT NULL, unit text, quantity numeric, note text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE daily_log_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daily_log_items_authenticated_all" ON daily_log_items;
CREATE POLICY "daily_log_items_authenticated_all" ON daily_log_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3) Nghiệm thu — checklist theo hạng mục, không dùng chung construction_approvals
CREATE TABLE IF NOT EXISTS construction_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES construction_projects(id) ON DELETE CASCADE,
  title text NOT NULL, status text DEFAULT 'pending', -- pending | passed | failed
  created_by uuid, note text, created_at timestamptz DEFAULT now()
);
ALTER TABLE construction_acceptances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "construction_acceptances_authenticated_all" ON construction_acceptances;
CREATE POLICY "construction_acceptances_authenticated_all" ON construction_acceptances FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS construction_acceptance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acceptance_id uuid NOT NULL REFERENCES construction_acceptances(id) ON DELETE CASCADE,
  criterion_name text NOT NULL, result text, -- đạt | không đạt | (null = chưa chấm)
  photo_url text, note text, sort_order int DEFAULT 0
);
ALTER TABLE construction_acceptance_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "construction_acceptance_items_authenticated_all" ON construction_acceptance_items;
CREATE POLICY "construction_acceptance_items_authenticated_all" ON construction_acceptance_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4) Nhắc việc — gắn project_id thật, khác personal_tasks (chỉ gắn user_id)
CREATE TABLE IF NOT EXISTS construction_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES construction_projects(id) ON DELETE CASCADE,
  title text NOT NULL, due_date date, assignee_id uuid,
  status text DEFAULT 'pending', -- pending | done
  created_by uuid, created_at timestamptz DEFAULT now()
);
ALTER TABLE construction_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "construction_reminders_authenticated_all" ON construction_reminders;
CREATE POLICY "construction_reminders_authenticated_all" ON construction_reminders FOR ALL TO authenticated USING (true) WITH CHECK (true);
