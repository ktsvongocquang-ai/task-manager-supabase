-- Script tạo/cập nhật người dùng cho Supabase với domain @dqh.vn
-- Chạy script này trong SQL Editor của Supabase

DO $$
DECLARE
  pwd text := '123456';
  -- Khai báo biến ID
  admin_id uuid := gen_random_uuid();
  aminh_id uuid := gen_random_uuid();
  thang_id uuid := gen_random_uuid();
  minh_id uuid := gen_random_uuid();
  vy_id uuid := gen_random_uuid();
  hau_id uuid := gen_random_uuid();
  khoa_id uuid := gen_random_uuid();
BEGIN
  -- Lấy lại ID của người dùng nếu email đã tồn tại để tránh lỗi duplicate key (users_email_partial_key)
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@dqh.vn';
  IF admin_id IS NULL THEN admin_id := gen_random_uuid(); END IF;

  SELECT id INTO aminh_id FROM auth.users WHERE email = 'aminh@dqh.vn';
  IF aminh_id IS NULL THEN aminh_id := gen_random_uuid(); END IF;

  SELECT id INTO thang_id FROM auth.users WHERE email = 'thang@dqh.vn';
  IF thang_id IS NULL THEN thang_id := gen_random_uuid(); END IF;

  SELECT id INTO minh_id FROM auth.users WHERE email = 'minh@dqh.vn';
  IF minh_id IS NULL THEN minh_id := gen_random_uuid(); END IF;

  SELECT id INTO vy_id FROM auth.users WHERE email = 'vy@dqh.vn';
  IF vy_id IS NULL THEN vy_id := gen_random_uuid(); END IF;

  SELECT id INTO hau_id FROM auth.users WHERE email = 'hau@dqh.vn';
  IF hau_id IS NULL THEN hau_id := gen_random_uuid(); END IF;

  SELECT id INTO khoa_id FROM auth.users WHERE email = 'khoa@dqh.vn';
  IF khoa_id IS NULL THEN khoa_id := gen_random_uuid(); END IF;

  -----------------------------------------
  -- 1. Thêm/Cập nhật bảng auth.users
  -----------------------------------------
  INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES 
    (admin_id, 'authenticated', 'authenticated', 'admin@dqh.vn', crypt(pwd, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin"}', now(), now()),
    (aminh_id, 'authenticated', 'authenticated', 'aminh@dqh.vn', crypt(pwd, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Aminh"}', now(), now()),
    (thang_id, 'authenticated', 'authenticated', 'thang@dqh.vn', crypt(pwd, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Thắng"}', now(), now()),
    (minh_id,  'authenticated', 'authenticated', 'minh@dqh.vn',  crypt(pwd, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Minh"}', now(), now()),
    (vy_id,    'authenticated', 'authenticated', 'vy@dqh.vn',    crypt(pwd, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Vy"}', now(), now()),
    (hau_id,   'authenticated', 'authenticated', 'hau@dqh.vn',   crypt(pwd, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Hậu"}', now(), now()),
    (khoa_id,  'authenticated', 'authenticated', 'khoa@dqh.vn',  crypt(pwd, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Khoa"}', now(), now())
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now();

  -----------------------------------------
  -- 2. Thêm/Cập nhật bảng auth.identities
  -----------------------------------------
  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at)
  VALUES
    (gen_random_uuid(), admin_id::text, admin_id, format('{"sub":"%s","email":"%s"}', admin_id::text, 'admin@dqh.vn')::jsonb, 'email', now(), now()),
    (gen_random_uuid(), aminh_id::text, aminh_id, format('{"sub":"%s","email":"%s"}', aminh_id::text, 'aminh@dqh.vn')::jsonb, 'email', now(), now()),
    (gen_random_uuid(), thang_id::text, thang_id, format('{"sub":"%s","email":"%s"}', thang_id::text, 'thang@dqh.vn')::jsonb, 'email', now(), now()),
    (gen_random_uuid(), minh_id::text,  minh_id,  format('{"sub":"%s","email":"%s"}', minh_id::text, 'minh@dqh.vn')::jsonb, 'email', now(), now()),
    (gen_random_uuid(), vy_id::text,    vy_id,    format('{"sub":"%s","email":"%s"}', vy_id::text, 'vy@dqh.vn')::jsonb, 'email', now(), now()),
    (gen_random_uuid(), hau_id::text,   hau_id,   format('{"sub":"%s","email":"%s"}', hau_id::text, 'hau@dqh.vn')::jsonb, 'email', now(), now()),
    (gen_random_uuid(), khoa_id::text,  khoa_id,  format('{"sub":"%s","email":"%s"}', khoa_id::text, 'khoa@dqh.vn')::jsonb, 'email', now(), now())
  ON CONFLICT (provider_id, provider) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = now();

  -----------------------------------------
  -- 3. Thêm/Cập nhật bảng public.profiles
  -----------------------------------------
  INSERT INTO public.profiles (id, staff_id, full_name, email, role, position, created_at)
  VALUES
    (admin_id, 'ADMIN_01', 'Admin', 'admin@dqh.vn', 'Admin', 'Admin', now()),
    (aminh_id, 'NV001', 'Aminh', 'aminh@dqh.vn', 'Quản lý', 'Quản trị viên', now()),
    (thang_id, 'NV002', 'Thắng', 'thang@dqh.vn', 'Nhân viên', 'Nhân viên', now()),
    (minh_id,  'NV003', 'Minh',  'minh@dqh.vn',  'Nhân viên', 'Nhân viên', now()),
    (vy_id,    'NV004', 'Vy',    'vy@dqh.vn',    'Nhân viên', 'Nhân viên', now()),
    (hau_id,   'NV005', 'Hậu',   'hau@dqh.vn',   'Nhân viên', 'Nhân viên', now()),
    (khoa_id,  'NV006', 'Khoa',  'khoa@dqh.vn',  'Nhân viên', 'Nhân viên', now())
  ON CONFLICT (id) DO UPDATE SET
    staff_id = EXCLUDED.staff_id,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    position = EXCLUDED.position;
    
END $$;
