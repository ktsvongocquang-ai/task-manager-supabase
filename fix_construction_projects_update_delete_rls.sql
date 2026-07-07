-- construction_projects chỉ có policy SELECT + (mới thêm) INSERT — thiếu UPDATE/DELETE
-- khiến "Sửa dự án", "Xóa dự án", và bước gắn photo_url/contract_doc_url sau khi upload
-- đều âm thầm không làm gì (Supabase không báo lỗi, chỉ trả về 0 dòng bị ảnh hưởng).
DROP POLICY IF EXISTS "Enable update for authenticated" ON construction_projects;
CREATE POLICY "Enable update for authenticated" ON construction_projects
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated" ON construction_projects;
CREATE POLICY "Enable delete for authenticated" ON construction_projects
  FOR DELETE TO authenticated USING (true);
