-- Script xử lý lỗi "Email chưa được xác thực" dẫn đến "Invalid login credentials"
-- 1. Xác thực ngay các user hiện tại đang bị chờ
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email_confirmed_at IS NULL;

-- 2. Tùy chọn: Xóa bỏ dòng lỗi Trigger ngăn login (Nếu đã từng tạo Trigger do Code nào đó)
-- Lưu ý: Supabase mặc định không tự khoá user nếu đã tắt "Confirm Email" ở trang Settings.
-- Chạy xong lệnh trên là 100% tài khoản sẽ kích hoạt.
