-- Hợp nhất Site Board (thiết kế) với construction_projects (dqh) — tạo 3 bảng mới để chứa
-- dữ liệu floor_plans/marker_notes/whiteboard_annotations của Site Board, project_id trỏ
-- thẳng vào construction_projects.id (uuid) thay vì bảng "projects" riêng cũ của Site Board.
-- Không đụng bảng "projects" đã có sẵn trên project này (thuộc hệ thống task-manager khác).

CREATE TABLE IF NOT EXISTS floor_plans (
  id text PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES construction_projects(id) ON DELETE CASCADE,
  name text, image_data text, width numeric, height numeric,
  plan_type text, created_at bigint,
  canvas_x numeric, canvas_y numeric, canvas_scale numeric,
  is_pinned boolean, document_group_id text, page_index int, page_count int, pdf_data text
);
ALTER TABLE floor_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "floor_plans_authenticated_all" ON floor_plans;
CREATE POLICY "floor_plans_authenticated_all" ON floor_plans
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Dùng đúng tên cột khớp type MarkerNote thật trong code (photo_data/audio_data/transcription/
-- text_notes/severity/assignee) — sửa luôn bug cột sai tên đã phát hiện ở bảng marker_notes cũ.
CREATE TABLE IF NOT EXISTS marker_notes (
  id text PRIMARY KEY,
  floor_plan_id text NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
  x numeric, y numeric, title text,
  photo_data text, audio_data text, transcription text, text_notes text,
  severity text, assignee text, status text, tags jsonb, created_at bigint
);
ALTER TABLE marker_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marker_notes_authenticated_all" ON marker_notes;
CREATE POLICY "marker_notes_authenticated_all" ON marker_notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS whiteboard_annotations (
  id text PRIMARY KEY,
  floor_plan_id text NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
  type text, x numeric, y numeric, width numeric, height numeric,
  color text, stroke_width numeric, points jsonb, text text, created_at bigint
);
ALTER TABLE whiteboard_annotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "whiteboard_annotations_authenticated_all" ON whiteboard_annotations;
CREATE POLICY "whiteboard_annotations_authenticated_all" ON whiteboard_annotations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
