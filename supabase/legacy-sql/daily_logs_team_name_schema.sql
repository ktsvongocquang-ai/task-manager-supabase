-- Tổ đội thi công cho từng nhật ký — khớp mẫu báo cáo "Tổ đội: Mr Tiến" người dùng gửi tham khảo.
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS team_name text;
