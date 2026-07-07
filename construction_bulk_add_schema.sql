ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS contract_doc_url text;
-- manager_name được code (loadProjects RBAC filter + bulk-add) tham chiếu từ trước nhưng
-- cột thật chưa từng được tạo trong DB — thêm vào đây (an toàn, không có cột này thì insert lỗi 400).
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS manager_name text;
