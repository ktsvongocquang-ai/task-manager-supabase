-- ============================================================
-- DQH Site Board — SQL Migration cho Supabase
-- Chạy đoạn này trong Supabase Dashboard > SQL Editor
-- Project: DQH MIROR Quangmui@2512
-- ============================================================

-- 1. Bảng Mặt bằng Bản vẽ
CREATE TABLE IF NOT EXISTS floor_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_data TEXT, -- Lưu dạng base64/URL vẽ thiết kế thô
  width REAL DEFAULT 1000,
  height REAL DEFAULT 700,
  project_id TEXT,
  plan_type TEXT,
  created_at BIGINT NOT NULL
);

-- 2. Bảng Điểm Ghim Lỗi Hiện Trường
CREATE TABLE IF NOT EXISTS marker_notes (
  id TEXT PRIMARY KEY,
  floor_plan_id TEXT NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
  x REAL NOT NULL,
  y REAL NOT NULL,
  title TEXT NOT NULL,
  photo_data TEXT, -- Lưu base64 hiện trạng rò rỉ/nứt vỡ
  audio_data TEXT, -- Lưu base64 thuyết minh ghi âm
  transcription TEXT,
  text_notes TEXT,
  comments JSONB DEFAULT '[]'::jsonb,
  tags TEXT[],
  created_at BIGINT NOT NULL
);

-- 3. Bảng Nhãn Nhớ/Hình Vẽ Whiteboard (Hỗ trợ cộng tác kiểu Miro)
CREATE TABLE IF NOT EXISTS whiteboard_annotations (
  id TEXT PRIMARY KEY,
  floor_plan_id TEXT NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL,
  height REAL,
  color TEXT,
  content TEXT,
  user_name TEXT,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at BIGINT NOT NULL
);

-- Tạm tắt RLS để dễ test (có thể bật lại sau và thêm policies)
ALTER TABLE floor_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE marker_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboard_annotations DISABLE ROW LEVEL SECURITY;

-- 4. B?ng D? �n
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client TEXT,
  leader TEXT,
  address TEXT,
  status TEXT,
  progress INTEGER,
  created_at BIGINT NOT NULL
);

ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- C?p nh?t c?t cho b?ng floor_plans
ALTER TABLE floor_plans ADD COLUMN IF NOT EXISTS canvas_x REAL;
ALTER TABLE floor_plans ADD COLUMN IF NOT EXISTS canvas_y REAL;
ALTER TABLE floor_plans ADD COLUMN IF NOT EXISTS canvas_scale REAL;
ALTER TABLE floor_plans ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE floor_plans ADD COLUMN IF NOT EXISTS document_group_id TEXT;
ALTER TABLE floor_plans ADD COLUMN IF NOT EXISTS page_index INTEGER;
ALTER TABLE floor_plans ADD COLUMN IF NOT EXISTS page_count INTEGER;
ALTER TABLE floor_plans ADD COLUMN IF NOT EXISTS pdf_data TEXT;

-- C?p nh?t c?t cho b?ng marker_notes
ALTER TABLE marker_notes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE marker_notes ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE marker_notes ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE marker_notes ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE marker_notes ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE marker_notes ADD COLUMN IF NOT EXISTS due_date BIGINT;
ALTER TABLE marker_notes ADD COLUMN IF NOT EXISTS images TEXT[];

-- C?p nh?t c?t cho b?ng whiteboard_annotations
ALTER TABLE whiteboard_annotations ADD COLUMN IF NOT EXISTS stroke_width REAL;
ALTER TABLE whiteboard_annotations ADD COLUMN IF NOT EXISTS points JSONB;
ALTER TABLE whiteboard_annotations ADD COLUMN IF NOT EXISTS text TEXT;
