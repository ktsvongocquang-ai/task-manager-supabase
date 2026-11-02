-- Nhà cung cấp: thêm Email/Người liên hệ/Mã số thuế (khớp form "Thêm mới Nhà cung cấp" của app tham khảo)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_person text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tax_code text;

-- Danh mục bổ sung: Trạng thái hạng mục + Mức độ ưu tiên công việc (dùng ngay trong Wizard
-- "Tạo 1 công trình đầy đủ" — construction_items.status/construction_tasks.priority đều là text
-- tự do, không gắn với logic Kanban nên an toàn khi chuyển sang danh mục có thể chỉnh sửa).
-- Bỏ qua "Trạng thái công việc"/"Trạng thái thanh toán" vì 2 field đó gắn cứng với enum
-- TaskStatus (TODO/DOING/REVIEW/DONE, chi phối Kanban) và PaymentStatus (unpaid/partial/paid,
-- chi phối màu badge Chi phí/Thu tiền) trong code — biến 2 field này thành danh mục tự do sẽ
-- làm hỏng Kanban/badge nếu ai đó đổi/xoá giá trị.
INSERT INTO finance_lookups (list_key, label, sort_order)
SELECT * FROM (VALUES
  ('item_status','Đang làm',1),('item_status','Hoàn thành',2),('item_status','Tạm dừng',3),
  ('task_priority','Thấp',1),('task_priority','Trung bình',2),('task_priority','Cao',3)
) AS v(list_key,label,sort_order)
WHERE NOT EXISTS (SELECT 1 FROM finance_lookups WHERE finance_lookups.list_key = v.list_key);
