-- Khối lượng công việc trong Nhật ký: thêm Giờ công + Thiết bị sử dụng (khớp mẫu tham khảo người dùng gửi).
ALTER TABLE daily_log_items ADD COLUMN IF NOT EXISTS man_hours numeric;
ALTER TABLE daily_log_items ADD COLUMN IF NOT EXISTS equipment text;

-- Nhắc việc: cho phép giao việc cho tổ đội/người ngoài hệ thống (không có tài khoản profiles) bằng tên tự do,
-- song song với assignee_id (chọn từ danh sách nhân sự có tài khoản) đã có sẵn.
ALTER TABLE construction_reminders ADD COLUMN IF NOT EXISTS assignee_name text;
