-- Run this in Supabase SQL Editor
-- Tài chính module: Khách hàng, Chi phí (trả NCC/thầu phụ), Thu tiền (khách trả theo HĐ)
-- An toàn để chạy lại nhiều lần (idempotent): dùng ADD COLUMN IF NOT EXISTS thay vì phụ
-- thuộc vào CREATE TABLE IF NOT EXISTS tạo đủ cột trong 1 lần.

-- Khách hàng (tách biệt CRM mock ở /customers — đây là khách hàng ký hợp đồng thi công)
CREATE TABLE IF NOT EXISTS customers (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE customers ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id);
-- owner_name giữ nguyên (RLS role 'Khách hàng' đang lọc theo nó) — customer_id chỉ là liên kết bổ sung.

-- Chi phí (trả Nhà thầu phụ / NCC)
CREATE TABLE IF NOT EXISTS construction_expenses (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES construction_projects(id) ON DELETE CASCADE;
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS date date;
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS expense_type text DEFAULT 'Khác';
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS subcontractor_id uuid REFERENCES construction_subcontractors(id);
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS supplier_name text;
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS amount bigint NOT NULL DEFAULT 0;
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS amount_paid bigint NOT NULL DEFAULT 0;
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS receipt_photos jsonb DEFAULT '[]'::jsonb;
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE construction_expenses ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

DO $$ BEGIN
  ALTER TABLE construction_expenses ADD CONSTRAINT construction_expenses_payment_status_check
    CHECK (payment_status IN ('unpaid','partial','paid'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE construction_expenses ADD CONSTRAINT construction_expenses_paid_range_check
    CHECK (amount_paid >= 0 AND amount_paid <= amount);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Thu tiền (khách trả theo hợp đồng)
CREATE TABLE IF NOT EXISTS construction_incomes (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE construction_incomes ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES construction_projects(id) ON DELETE CASCADE;
ALTER TABLE construction_incomes ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id);
ALTER TABLE construction_incomes ADD COLUMN IF NOT EXISTS date date;
ALTER TABLE construction_incomes ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE construction_incomes ADD COLUMN IF NOT EXISTS amount bigint NOT NULL DEFAULT 0;
ALTER TABLE construction_incomes ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'Tiền mặt';
ALTER TABLE construction_incomes ADD COLUMN IF NOT EXISTS received_by text;
ALTER TABLE construction_incomes ADD COLUMN IF NOT EXISTS receipt_photos jsonb DEFAULT '[]'::jsonb;
ALTER TABLE construction_incomes ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE construction_incomes ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_incomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for authenticated" ON customers;
DROP POLICY IF EXISTS "Enable all for authenticated" ON construction_expenses;
DROP POLICY IF EXISTS "Enable all for authenticated" ON construction_incomes;
CREATE POLICY "Enable all for authenticated" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated" ON construction_expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated" ON construction_incomes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Migrate dữ liệu cũ từ construction_payment_records (chỉ chạy nếu 2 bảng mới đang rỗng,
-- để chạy lại script này nhiều lần không bị nhân đôi dữ liệu). KHÔNG xoá bảng cũ.
INSERT INTO construction_expenses (project_id, date, expense_type, description, amount, amount_paid, payment_status, receipt_photos, created_at)
SELECT project_id, date, category, description, amount,
       CASE WHEN status = 'confirmed' THEN amount ELSE 0 END,
       CASE WHEN status = 'confirmed' THEN 'paid' ELSE 'unpaid' END,
       bill_photos, created_at
FROM construction_payment_records
WHERE type = 'payment_out'
  AND NOT EXISTS (SELECT 1 FROM construction_expenses LIMIT 1);

INSERT INTO construction_incomes (project_id, customer_id, date, description, amount, receipt_photos, created_at)
SELECT p.project_id, cp.customer_id, p.date, p.description, p.amount, p.bill_photos, p.created_at
FROM construction_payment_records p
JOIN construction_projects cp ON cp.id = p.project_id
WHERE p.type = 'payment_in'
  AND NOT EXISTS (SELECT 1 FROM construction_incomes LIMIT 1);
