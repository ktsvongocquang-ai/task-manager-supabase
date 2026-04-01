-- =============================================
-- CẬP NHẬT CHECK CONSTRAINT CHO ROLE
-- Đổi 'Kỹ sư' → 'Giám Sát', thêm 'Sale', 'Marketing'
-- =============================================

-- 1. Xóa constraint cũ
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Tạo constraint mới với danh sách role đầy đủ
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN (
    'Admin', 
    'Quản lý thiết kế', 
    'Quản lý thi công', 
    'Giám Sát',
    'Sale',
    'Marketing',
    'Khách hàng', 
    'Nhân viên'
  ));

-- 3. Cập nhật tất cả user đang có role 'Kỹ sư' → 'Giám Sát'
UPDATE public.profiles SET role = 'Giám Sát' WHERE role = 'Kỹ sư';
