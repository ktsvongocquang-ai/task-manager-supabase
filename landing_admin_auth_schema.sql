-- ============================================================
-- CHẠY FILE NÀY SAU landing_page_content_schema.sql, CÙNG PROJECT
-- Supabase "DQH MIROR Quangmui@2512" (ref yiuokvszyaqqjksshybn).
-- Thêm tài khoản đăng nhập + phân quyền cho trang /landing-admin.
--
-- Không dùng service_role key trong app (sẽ lộ toàn quyền DB nếu nhúng vào
-- code chạy trình duyệt) — nên "tạo user" = tự đăng ký rồi admin duyệt,
-- "xoá user" = admin vô hiệu hoá (is_active=false), không xoá tài khoản
-- Supabase Auth thật.
-- ============================================================

CREATE TABLE IF NOT EXISTS landing_admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'pending', -- 'pending' | 'editor' | 'admin'
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Tự tạo 1 dòng profile (role='pending', is_active=false) mỗi khi có người
-- đăng ký mới — admin vào trang Người dùng duyệt + gán quyền sau.
CREATE OR REPLACE FUNCTION public.handle_new_landing_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.landing_admin_profiles (id, email, role, is_active)
  VALUES (NEW.id, NEW.email, 'pending', false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_landing_auth_user_created ON auth.users;
CREATE TRIGGER on_landing_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_landing_user();

-- Helper functions dùng trong RLS (SECURITY DEFINER để tránh đệ quy RLS)
CREATE OR REPLACE FUNCTION public.is_landing_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.landing_admin_profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_landing_active_editor()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.landing_admin_profiles
    WHERE id = auth.uid() AND role IN ('admin','editor') AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

ALTER TABLE landing_admin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "landing_admin_profiles_own_or_admin_select" ON landing_admin_profiles;
CREATE POLICY "landing_admin_profiles_own_or_admin_select" ON landing_admin_profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_landing_admin());

DROP POLICY IF EXISTS "landing_admin_profiles_admin_update" ON landing_admin_profiles;
CREATE POLICY "landing_admin_profiles_admin_update" ON landing_admin_profiles FOR UPDATE TO authenticated
  USING (public.is_landing_admin()) WITH CHECK (public.is_landing_admin());

-- Cho phép editor/admin ghi (thêm/sửa/xoá) lên 6 bảng nội dung — không đụng
-- policy đọc công khai (anon) đã tạo ở file trước, chỉ cộng thêm quyền ghi.
DROP POLICY IF EXISTS "landing_featured_projects_editor_write" ON landing_featured_projects;
CREATE POLICY "landing_featured_projects_editor_write" ON landing_featured_projects FOR ALL TO authenticated
  USING (public.is_landing_active_editor()) WITH CHECK (public.is_landing_active_editor());

DROP POLICY IF EXISTS "landing_pricing_standards_editor_write" ON landing_pricing_standards;
CREATE POLICY "landing_pricing_standards_editor_write" ON landing_pricing_standards FOR ALL TO authenticated
  USING (public.is_landing_active_editor()) WITH CHECK (public.is_landing_active_editor());

DROP POLICY IF EXISTS "landing_workflow_steps_editor_write" ON landing_workflow_steps;
CREATE POLICY "landing_workflow_steps_editor_write" ON landing_workflow_steps FOR ALL TO authenticated
  USING (public.is_landing_active_editor()) WITH CHECK (public.is_landing_active_editor());

DROP POLICY IF EXISTS "landing_team_members_editor_write" ON landing_team_members;
CREATE POLICY "landing_team_members_editor_write" ON landing_team_members FOR ALL TO authenticated
  USING (public.is_landing_active_editor()) WITH CHECK (public.is_landing_active_editor());

DROP POLICY IF EXISTS "landing_company_info_editor_write" ON landing_company_info;
CREATE POLICY "landing_company_info_editor_write" ON landing_company_info FOR ALL TO authenticated
  USING (public.is_landing_active_editor()) WITH CHECK (public.is_landing_active_editor());

DROP POLICY IF EXISTS "landing_price_rates_editor_write" ON landing_price_rates;
CREATE POLICY "landing_price_rates_editor_write" ON landing_price_rates FOR ALL TO authenticated
  USING (public.is_landing_active_editor()) WITH CHECK (public.is_landing_active_editor());

-- ============================================================
-- SAU KHI CHẠY FILE NÀY:
-- 1. Vào https://<domain>/landing-admin, bấm "Đăng ký", tạo tài khoản đầu
--    tiên bằng email thật của bạn.
-- 2. Quay lại đây, chạy lệnh dưới (đổi email đúng) để tự phong admin cho
--    chính mình — chỉ cần làm 1 lần duy nhất cho tài khoản đầu tiên, các
--    admin sau duyệt nhau ngay trong trang Người dùng.
--
-- UPDATE landing_admin_profiles SET role = 'admin', is_active = true
-- WHERE email = 'ban@dqh.vn';
-- ============================================================
