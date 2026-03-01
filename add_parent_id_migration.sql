-- Migration: Thêm tính năng Hệ thống Task Cha - Con (Parent-Child Task Hierarchy)
-- Bạn hãy copy toàn bộ lệnh SQL này và chạy trong Supabase SQL Editor nhé!

-- 1. Thêm cột 'parent_id' vào bảng 'tasks' để liên kết Task Con với Task Cha tương ứng.
ALTER TABLE tasks 
ADD COLUMN parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- 2. Tùy chọn (Optional): Index cột parent_id để truy vấn cây Task (Tree) nhanh hơn
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);

-- Cột này cho phép 1 task (vd: 1.1 Khảo sát) nhận id của task cha (vd: Giai đoạn 1: Concept)
-- Nhờ tính năng ON DELETE CASCADE, khi bạn xóa Task Cha, toàn bộ Task Con bên trong sẽ tự động bốc hơi theo.
