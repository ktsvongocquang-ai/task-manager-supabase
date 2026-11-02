-- 2 ô viết tay tự do trong Nhật ký: nội dung công việc hôm nay + kế hoạch ngày mai (khác với
-- "Việc dự kiến ngày mai" lấy từ Bảng tiến độ — đây là mô tả tự nhiên, không gắn với task cụ thể).
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS today_summary text;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS tomorrow_plan text;
