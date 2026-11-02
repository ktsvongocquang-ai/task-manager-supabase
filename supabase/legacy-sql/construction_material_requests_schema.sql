-- Goi hang / Nhan hang (theo doi vat tu nhanh tai cong truong) - ghi nhan
-- rieng, khong len chung so Chi phi/Thu tien vi chua chac co gia luc goi hang.
CREATE TABLE IF NOT EXISTS construction_material_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES construction_projects(id) ON DELETE CASCADE,
  request_type text NOT NULL, -- goi_hang | nhan_hang
  description text NOT NULL,
  supplier_name text,
  amount numeric, -- khong bat buoc
  photo_urls jsonb DEFAULT '[]'::jsonb,
  note text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE construction_material_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "construction_material_requests_authenticated_all" ON construction_material_requests;
CREATE POLICY "construction_material_requests_authenticated_all" ON construction_material_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
