-- Lưu thứ tự + màu các Hạng mục lớn (Workflow Tuỳ biến) theo từng dự án.
-- Mảng JSON dạng [{ "name": "KHẢO SÁT & TƯ VẤN", "color": "#6366f1" }, ...] theo đúng thứ tự hiển thị.
-- NULL / rỗng = dùng thứ tự mặc định (DEFAULT_WORKFLOW_PHASES trong ProjectManagement.tsx).
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS workflow_phases jsonb;
