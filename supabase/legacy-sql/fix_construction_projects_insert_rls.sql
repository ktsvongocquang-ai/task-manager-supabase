-- construction_projects hiện chỉ có policy SELECT/UPDATE, thiếu policy INSERT
-- khiến MỌI luồng tạo dự án (AI lẫn wizard thủ công) đều bị chặn bởi RLS.
DROP POLICY IF EXISTS "Enable insert for authenticated" ON construction_projects;
CREATE POLICY "Enable insert for authenticated" ON construction_projects
  FOR INSERT TO authenticated WITH CHECK (true);
