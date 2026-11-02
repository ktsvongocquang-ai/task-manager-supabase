-- daily_logs hiện có RLS bật nhưng KHÔNG có policy nào cho phép authenticated INSERT/UPDATE
-- (xác nhận qua test thật: tài khoản role Admin bị chặn với lỗi 42501 "new row violates
-- row-level security policy for table daily_logs" khi ghi nhật ký thi công).
--
-- Đây là policy CHỈ THÊM (ADD), không sửa/xoá bất kỳ policy nào đang có — vì Postgres RLS
-- gộp nhiều permissive policy bằng OR, việc thêm 1 policy authenticated-only chỉ có thể MỞ
-- RỘNG quyền truy cập, không thể khoá nhầm ai đang truy cập được. Dùng đúng mẫu
-- "FOR ALL TO authenticated USING(true) WITH CHECK(true)" đã dùng cho phần lớn bảng
-- construction_* khác trong schema hiện tại (construction_full_schema.sql), để nhất quán.
DROP POLICY IF EXISTS "daily_logs_authenticated_all" ON daily_logs;
CREATE POLICY "daily_logs_authenticated_all" ON daily_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
