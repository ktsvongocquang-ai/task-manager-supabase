-- =============================================
-- CẬP NHẬT CHECK CONSTRAINT CHO ROLE VÀ ĐỔI TÊN NHÂN VIÊN -> THIẾT KẾ
-- =============================================

-- 1. Xóa constraint cũ để cho phép cập nhật dữ liệu
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Cập nhật tất cả các user đang có role 'Nhân viên' thành 'Thiết kế'
UPDATE public.profiles SET role = 'Thiết kế', position = 'Thiết kế' WHERE role = 'Nhân viên';

-- 3. Tạo constraint mới với danh sách role đã được cập nhật
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN (
    'Admin', 
    'Quản lý thiết kế', 
    'Quản lý thi công', 
    'Giám Sát',
    'Sale',
    'Marketing',
    'Khách hàng', 
    'Thiết kế'
  ));
