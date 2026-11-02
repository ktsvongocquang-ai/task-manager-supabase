-- ═══════════════════════════════════════════════════════════
-- HỒ SƠ THIẾT KẾ — Link Google Drive theo từng hạng mục tài liệu
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS project_doc_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES construction_projects(id) ON DELETE CASCADE,
    category text NOT NULL,
    drive_url text,
    version text,
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (project_id, category)
);
ALTER TABLE project_doc_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated" ON project_doc_links FOR ALL TO authenticated USING (true) WITH CHECK (true);
