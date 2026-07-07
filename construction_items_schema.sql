-- ═══════════════════════════════════════════════════════════
-- Bảng Hạng mục (construction_items) cho wizard "Tạo 1 công trình đầy đủ"
-- Idempotent: an toàn chạy lại nhiều lần.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS construction_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE construction_items ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES construction_projects(id) ON DELETE CASCADE;
ALTER TABLE construction_items ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
ALTER TABLE construction_items ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE construction_items ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE construction_items ADD COLUMN IF NOT EXISTS progress numeric DEFAULT 0;
ALTER TABLE construction_items ADD COLUMN IF NOT EXISTS budget bigint DEFAULT 0;
ALTER TABLE construction_items ADD COLUMN IF NOT EXISTS actual_cost bigint DEFAULT 0;
ALTER TABLE construction_items ADD COLUMN IF NOT EXISTS assignee text;
ALTER TABLE construction_items ADD COLUMN IF NOT EXISTS status text DEFAULT 'Đang làm';
ALTER TABLE construction_items ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE construction_items ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE construction_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON construction_items;
CREATE POLICY "Enable all for authenticated" ON construction_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE construction_tasks ADD COLUMN IF NOT EXISTS item_id uuid REFERENCES construction_items(id);
ALTER TABLE construction_tasks ADD COLUMN IF NOT EXISTS note text DEFAULT '';

DO $$
BEGIN
  ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'customer_id skip: %', SQLERRM;
END $$;

DO $$
BEGIN
  ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS project_type text;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'project_type skip: %', SQLERRM;
END $$;

DO $$
BEGIN
  ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS note text DEFAULT '';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'note skip: %', SQLERRM;
END $$;

-- Loại công trình — thêm vào bảng finance_lookups đã có sẵn (dùng chung cơ chế Danh mục)
DO $$
BEGIN
  INSERT INTO finance_lookups (list_key, label, sort_order)
  SELECT * FROM (VALUES
    ('project_type','Nhà phố',1),('project_type','Biệt thự',2),('project_type','Nhà xưởng',3),
    ('project_type','Văn phòng',4),('project_type','Căn hộ',5),('project_type','Cửa hàng',6),
    ('project_type','Sửa chữa',7),('project_type','Nội thất',8),('project_type','Kho bãi',9),('project_type','Khác',10)
  ) AS v(list_key,label,sort_order)
  WHERE NOT EXISTS (SELECT 1 FROM finance_lookups WHERE finance_lookups.list_key = v.list_key);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'project_type lookup seed skip: %', SQLERRM;
END $$;
