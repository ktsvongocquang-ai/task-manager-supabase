-- ============================================================================
-- Phase 1 (module Tài chính kế toán công trình): BOQ + mã công trình cố định
--
-- Chạy toàn bộ file này 1 lần trong Supabase SQL Editor.
-- ============================================================================

-- 1) Mã công trình cố định (project_code) — backfill dữ liệu cũ + trigger tự
--    sinh mã cho các công trình tạo sau này, để 4 luồng tạo công trình hiện
--    có (createProject/createProjectStructure/bulkCreateProjects/
--    createProjectsWithFiles) không cần sửa để đảm bảo NOT NULL.
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY created_at) AS rn
  FROM construction_projects
  WHERE project_code IS NULL OR project_code = ''
)
UPDATE construction_projects p
SET project_code = 'CT' || lpad(numbered.rn::text, 4, '0')
FROM numbered
WHERE p.id = numbered.id;

CREATE SEQUENCE IF NOT EXISTS construction_project_code_seq;
SELECT setval('construction_project_code_seq', (
  SELECT COALESCE(MAX(substring(project_code from 3)::int), 0) FROM construction_projects
));

CREATE OR REPLACE FUNCTION public.set_project_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.project_code IS NULL OR NEW.project_code = '' THEN
    NEW.project_code := 'CT' || lpad(nextval('construction_project_code_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_project_code ON construction_projects;
CREATE TRIGGER trg_set_project_code
  BEFORE INSERT ON construction_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_project_code();

ALTER TABLE construction_projects ALTER COLUMN project_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS construction_projects_project_code_key ON construction_projects(project_code);

-- RPC to preview the next auto-generated code in CreateProjectWizard before saving.
CREATE OR REPLACE FUNCTION public.peek_next_project_code()
RETURNS text
LANGUAGE sql
AS $$
  SELECT 'CT' || lpad((last_value + 1)::text, 4, '0') FROM construction_project_code_seq;
$$;

GRANT EXECUTE ON FUNCTION public.peek_next_project_code() TO authenticated;

-- 2) BOQ line items — cây group/subgroup/item, bảng MỚI, độc lập với
--    construction_items (bảng "hạng mục" cũ đang dùng cho Gantt/Workflow —
--    không đụng vào để không phá tiến độ thi công đang chạy).
CREATE TABLE IF NOT EXISTS project_boq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES construction_projects(id) ON DELETE CASCADE,
  item_code text NOT NULL,
  parent_item_id uuid REFERENCES project_boq_items(id) ON DELETE CASCADE,
  level int NOT NULL DEFAULT 0,
  row_type text NOT NULL DEFAULT 'item', -- 'group' | 'subgroup' | 'item'
  item_name text NOT NULL DEFAULT '',
  unit text,
  estimated_quantity numeric,
  quoted_unit_price numeric,
  supplier_id uuid REFERENCES suppliers(id),
  document_status text DEFAULT 'missing',   -- missing | uploaded | verified | invalid
  invoice_status text DEFAULT 'no_invoice', -- no_vat | waiting_invoice | has_invoice | invalid_invoice | no_invoice
  note text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, item_code)
);

ALTER TABLE project_boq_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_boq_items_authenticated_all" ON project_boq_items;
CREATE POLICY "project_boq_items_authenticated_all" ON project_boq_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3) construction_expenses — cột nền cho Phase 2 (nullable, chưa có UI nhập ở
--    Phase 1, chỉ để Phase 2 không cần thêm 1 migration riêng).
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS boq_item_id uuid REFERENCES project_boq_items(id);
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS amount_ex_vat numeric;
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS vat_amount numeric;
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS amount_inc_vat numeric;
