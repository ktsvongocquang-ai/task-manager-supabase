-- Run this in Supabase SQL Editor
-- Tài chính module: Khách hàng, Chi phí (trả NCC/thầu phụ), Thu tiền (khách trả theo HĐ)

-- Khách hàng (tách biệt CRM mock ở /customers — đây là khách hàng ký hợp đồng thi công)
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id);
-- owner_name giữ nguyên (RLS role 'Khách hàng' đang lọc theo nó) — customer_id chỉ là liên kết bổ sung.

-- Chi phí (trả Nhà thầu phụ / NCC)
CREATE TABLE IF NOT EXISTS construction_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES construction_projects(id) ON DELETE CASCADE,
  date date NOT NULL,
  category text,
  expense_type text DEFAULT 'Khác',
  description text NOT NULL,
  subcontractor_id uuid REFERENCES construction_subcontractors(id),
  supplier_name text,
  amount bigint NOT NULL DEFAULT 0,
  amount_paid bigint NOT NULL DEFAULT 0,
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','partial','paid')),
  receipt_photos jsonb DEFAULT '[]'::jsonb,
  note text,
  created_at timestamptz DEFAULT now(),
  CHECK (amount_paid >= 0 AND amount_paid <= amount)
);

-- Thu tiền (khách trả theo hợp đồng)
CREATE TABLE IF NOT EXISTS construction_incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES construction_projects(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id),
  date date NOT NULL,
  description text,
  amount bigint NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'Tiền mặt',
  received_by text,
  receipt_photos jsonb DEFAULT '[]'::jsonb,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated" ON construction_expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated" ON construction_incomes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Migrate dữ liệu cũ từ construction_payment_records (KHÔNG xoá bảng cũ, chỉ ngừng ghi thêm từ nay)
INSERT INTO construction_expenses (project_id, date, expense_type, description, amount, amount_paid, payment_status, receipt_photos, created_at)
SELECT project_id, date, category, description, amount,
       CASE WHEN status = 'confirmed' THEN amount ELSE 0 END,
       CASE WHEN status = 'confirmed' THEN 'paid' ELSE 'unpaid' END,
       bill_photos, created_at
FROM construction_payment_records WHERE type = 'payment_out';

INSERT INTO construction_incomes (project_id, customer_id, date, description, amount, receipt_photos, created_at)
SELECT p.project_id, cp.customer_id, p.date, p.description, p.amount, p.bill_photos, p.created_at
FROM construction_payment_records p
JOIN construction_projects cp ON cp.id = p.project_id
WHERE p.type = 'payment_in';
