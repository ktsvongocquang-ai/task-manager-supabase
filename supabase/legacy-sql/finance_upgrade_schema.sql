-- Run this in Supabase SQL Editor
-- Nâng cấp module Tài chính: Danh mục cấu hình runtime, Nhà cung cấp riêng, Loại/Trạng thái cho Khách hàng.
-- An toàn để chạy lại nhiều lần. Mỗi bước rủi ro được bọc riêng (DO ... EXCEPTION) để 1 bước lỗi
-- không làm rollback các bước tạo bảng/cột đã chạy trước đó trong cùng lần Run.

-- ── Danh mục cấu hình runtime (thay hardcode) ──
CREATE TABLE IF NOT EXISTS finance_lookups (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE finance_lookups ADD COLUMN IF NOT EXISTS list_key text NOT NULL DEFAULT '';
ALTER TABLE finance_lookups ADD COLUMN IF NOT EXISTS label text NOT NULL DEFAULT '';
ALTER TABLE finance_lookups ADD COLUMN IF NOT EXISTS sort_order int DEFAULT 0;
ALTER TABLE finance_lookups ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE finance_lookups ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable all for authenticated" ON finance_lookups;
  CREATE POLICY "Enable all for authenticated" ON finance_lookups FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'finance_lookups policy step skipped: %', SQLERRM; END $$;

-- Seed mặc định (idempotent — chỉ insert nếu list_key đó chưa có dòng nào)
DO $$ BEGIN
  INSERT INTO finance_lookups (list_key, label, sort_order)
  SELECT * FROM (VALUES
    ('expense_type','Vật liệu',1),('expense_type','Nhân công',2),('expense_type','Thầu phụ',3),
    ('expense_type','Vận chuyển',4),('expense_type','Máy móc',5),('expense_type','Điện nước',6),('expense_type','Khác',7),
    ('payment_method','Tiền mặt',1),('payment_method','Chuyển khoản',2),('payment_method','Quẹt thẻ',3),('payment_method','Cấn trừ công nợ',4),
    ('customer_type','Cá nhân',1),('customer_type','Doanh nghiệp',2),
    ('customer_status','Đang hợp tác',1),('customer_status','Tiềm năng',2),('customer_status','Ngừng hợp tác',3),
    ('supplier_type','Vật tư',1),('supplier_type','Thầu phụ',2),('supplier_type','Nhân công',3),('supplier_type','Khác',4),
    ('supplier_status','Đang hợp tác',1),('supplier_status','Ngừng hợp tác',2)
  ) AS v(list_key,label,sort_order)
  WHERE NOT EXISTS (SELECT 1 FROM finance_lookups WHERE finance_lookups.list_key = v.list_key);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'finance_lookups seed step skipped: %', SQLERRM; END $$;

-- ── Nhà cung cấp — bảng riêng cho module Tài chính ──
CREATE TABLE IF NOT EXISTS suppliers (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS supplier_type text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS status text DEFAULT 'Đang hợp tác';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable all for authenticated" ON suppliers;
  CREATE POLICY "Enable all for authenticated" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'suppliers policy step skipped: %', SQLERRM; END $$;

-- Seed suppliers từ construction_subcontractors đang có (một lần, nếu suppliers rỗng)
DO $$ BEGIN
  INSERT INTO suppliers (name, phone, supplier_type)
  SELECT name, phone, 'Thầu phụ' FROM construction_subcontractors
  WHERE NOT EXISTS (SELECT 1 FROM suppliers LIMIT 1);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'suppliers seed-from-subcontractors step skipped: %', SQLERRM; END $$;

-- ── Chi phí: thêm supplier_id (bảng mới), giữ nguyên subcontractor_id/supplier_name cũ ──
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id);

DO $$ BEGIN
  UPDATE construction_expenses e SET supplier_id = s.id
  FROM suppliers s, construction_subcontractors sc
  WHERE e.subcontractor_id = sc.id AND s.name = sc.name
    AND e.subcontractor_id IS NOT NULL AND e.supplier_id IS NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'expenses supplier_id backfill step skipped: %', SQLERRM; END $$;

-- ── Khách hàng: thêm Loại + Trạng thái ──
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status text DEFAULT 'Đang hợp tác';
