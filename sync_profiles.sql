-- Script đồng bộ phân quyền từ auth.users sang public.profiles
-- Chạy script này SAU KHI bạn đã tạo xong 7 user trong Supabase Authentication

DO $$
DECLARE
  -- Khai báo biến
  admin_id uuid;
  aminh_id uuid;
  thang_id uuid;
  minh_id uuid;
  vy_id uuid;
  hau_id uuid;
  khoa_id uuid;
BEGIN
  -- Lấy ID thật sự của các User mà bạn VỪA TẠO TAY
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@dqh.vn';
  SELECT id INTO aminh_id FROM auth.users WHERE email = 'aminh@dqh.vn';
  SELECT id INTO thang_id FROM auth.users WHERE email = 'thang@dqh.vn';
  SELECT id INTO minh_id FROM auth.users WHERE email = 'minh@dqh.vn';
  SELECT id INTO vy_id FROM auth.users WHERE email = 'vy@dqh.vn';
  SELECT id INTO hau_id FROM auth.users WHERE email = 'hau@dqh.vn';
  SELECT id INTO khoa_id FROM auth.users WHERE email = 'khoa@dqh.vn';

  -- Cập nhật Role và Thông tin cho Admin (nếu tồn tại)
  IF admin_id IS NOT NULL THEN
     INSERT INTO public.profiles (id, staff_id, full_name, email, role, position, created_at)
     VALUES (admin_id, 'ADMIN_01', 'Admin', 'admin@dqh.vn', 'Admin', 'Admin', now())
     ON CONFLICT (id) DO UPDATE SET 
        role = EXCLUDED.role, full_name = EXCLUDED.full_name, staff_id = EXCLUDED.staff_id, position = EXCLUDED.position;
  END IF;

  -- Cập nhật Role và Thông tin cho Quản lý Aminh
  IF aminh_id IS NOT NULL THEN
     INSERT INTO public.profiles (id, staff_id, full_name, email, role, position, created_at)
     VALUES (aminh_id, 'NV001', 'Aminh', 'aminh@dqh.vn', 'Quản lý', 'Quản trị viên', now())
     ON CONFLICT (id) DO UPDATE SET 
        role = EXCLUDED.role, full_name = EXCLUDED.full_name, staff_id = EXCLUDED.staff_id, position = EXCLUDED.position;
  END IF;

  -- Cập nhật Role và Thông tin cho Nhân viên Thắng
  IF thang_id IS NOT NULL THEN
     INSERT INTO public.profiles (id, staff_id, full_name, email, role, position, created_at)
     VALUES (thang_id, 'NV002', 'Thắng', 'thang@dqh.vn', 'Nhân viên', 'Nhân viên', now())
     ON CONFLICT (id) DO UPDATE SET 
        role = EXCLUDED.role, full_name = EXCLUDED.full_name, staff_id = EXCLUDED.staff_id, position = EXCLUDED.position;
  END IF;

  -- Cập nhật Role và Thông tin cho Nhân viên Minh
  IF minh_id IS NOT NULL THEN
     INSERT INTO public.profiles (id, staff_id, full_name, email, role, position, created_at)
     VALUES (minh_id, 'NV003', 'Minh', 'minh@dqh.vn', 'Nhân viên', 'Nhân viên', now())
     ON CONFLICT (id) DO UPDATE SET 
        role = EXCLUDED.role, full_name = EXCLUDED.full_name, staff_id = EXCLUDED.staff_id, position = EXCLUDED.position;
  END IF;

  -- Cập nhật Role và Thông tin cho Nhân viên Vy
  IF vy_id IS NOT NULL THEN
     INSERT INTO public.profiles (id, staff_id, full_name, email, role, position, created_at)
     VALUES (vy_id, 'NV004', 'Vy', 'vy@dqh.vn', 'Nhân viên', 'Nhân viên', now())
     ON CONFLICT (id) DO UPDATE SET 
        role = EXCLUDED.role, full_name = EXCLUDED.full_name, staff_id = EXCLUDED.staff_id, position = EXCLUDED.position;
  END IF;

  -- Cập nhật Role và Thông tin cho Nhân viên Hậu
  IF hau_id IS NOT NULL THEN
     INSERT INTO public.profiles (id, staff_id, full_name, email, role, position, created_at)
     VALUES (hau_id, 'NV005', 'Hậu', 'hau@dqh.vn', 'Nhân viên', 'Nhân viên', now())
     ON CONFLICT (id) DO UPDATE SET 
        role = EXCLUDED.role, full_name = EXCLUDED.full_name, staff_id = EXCLUDED.staff_id, position = EXCLUDED.position;
  END IF;

  -- Cập nhật Role và Thông tin cho Nhân viên Khoa
  IF khoa_id IS NOT NULL THEN
     INSERT INTO public.profiles (id, staff_id, full_name, email, role, position, created_at)
     VALUES (khoa_id, 'NV006', 'Khoa', 'khoa@dqh.vn', 'Nhân viên', 'Nhân viên', now())
     ON CONFLICT (id) DO UPDATE SET 
        role = EXCLUDED.role, full_name = EXCLUDED.full_name, staff_id = EXCLUDED.staff_id, position = EXCLUDED.position;
  END IF;
  
END $$;
