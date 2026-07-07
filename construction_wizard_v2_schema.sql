-- ═══════════════════════════════════════════════════════════
-- Round 2: hoàn thiện wizard + trang danh sách Công trình
-- Idempotent: an toàn chạy lại nhiều lần.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE customers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_person text;

ALTER TABLE construction_tasks ADD COLUMN IF NOT EXISTS assignee text DEFAULT '';
ALTER TABLE construction_tasks ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Trung bình';
