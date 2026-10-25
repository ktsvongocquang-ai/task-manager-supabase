-- ============================================================
-- LP v2 — Landing page bán hàng /p/:slug (NV2)
-- Chạy trong project Supabase chính "quan ly cong ty" (project đang chứa
-- bảng profiles, projects, portfolio_shares...).
--
-- CHỈ THÊM BẢNG MỚI — không đụng tới bảng `projects` thật (bảng vận hành
-- nội bộ, đang được Dashboard/Tasks/Schedule/Kanban/Gantt/Finance... dùng
-- trực tiếp). Yêu cầu gốc nói "projects (thêm cột nếu đã có)" nhưng thêm
-- cột marketing (segment, area_m2, before_image, is_featured...) vào đúng
-- bảng đó sẽ làm bẩn dữ liệu vận hành thật — nên đổi thành bảng riêng
-- `landing_projects`. Nếu bạn thực sự muốn gắn vào bảng `projects` thật,
-- báo lại để mình viết migration khác.
--
-- Route /p/:slug KHÔNG còn dùng cơ chế portfolio_shares (token/PIN/
-- project_id riêng cho từng khách) nữa — theo đúng NV3/NV9 của prompt,
-- trang này trở thành 1 trang public duy nhất, nội dung đổi theo query
-- param ?seg=. Bảng portfolio_shares KHÔNG bị xoá (không vi phạm luật
-- "không xoá bảng đang có"), chỉ đơn giản là landing page mới không gọi
-- tới nó nữa. Nếu bạn vẫn cần tính năng "gửi link riêng xem tiến độ thật
-- cho từng khách" như trước, đó sẽ phải là 1 route khác (vd /c/:token),
-- ngoài phạm vi 10 nhiệm vụ này.
-- ============================================================

-- 1) landing_pages — cấu hình chung của 1 trang landing (có thể có nhiều
-- slug sau này nếu DQH mở thêm brand/landing khác)
CREATE TABLE IF NOT EXISTS landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  default_phone text,
  default_zalo text,
  architect_name text,
  architect_role text,
  architect_photo text,
  architect_signature text,
  architect_quote text,
  architect_zalo text,
  architect_stats jsonb,
  offer_slots_left int,
  offer_month text,
  response_promise text,
  legal_name text,
  tax_code text,
  address text,
  maps_url text,
  hotline text,
  founded_at date,
  social_links jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) landing_segments — nội dung Hero theo từng phân khúc (seg) của 1 landing_pages
CREATE TABLE IF NOT EXISTS landing_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  seg text NOT NULL CHECK (seg IN ('can-ho', 'nha-pho-du-an', 'nha-pho', 'villa')),
  title text,
  subtitle text,
  hero_image text,
  hero_video text,
  facts jsonb,
  og_image text,
  sort_order int DEFAULT 0,
  UNIQUE (page_id, seg)
);

-- 3) landing_projects — công trình trưng bày trên landing (tách khỏi bảng
-- `projects` vận hành thật, xem ghi chú đầu file)
CREATE TABLE IF NOT EXISTS landing_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment text NOT NULL CHECK (segment IN ('can-ho', 'nha-pho-du-an', 'nha-pho', 'villa')),
  title text NOT NULL,
  area_m2 numeric,
  location text,
  style text,
  duration_days int,
  problem_solved text,
  before_image text,
  after_image text,
  detail_images jsonb,
  is_featured boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4) estimator_styles — phong cách chọn ở bước 1 của wizard khái toán
CREATE TABLE IF NOT EXISTS estimator_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  card_image text,
  moodboard_image text,
  sort_order int DEFAULT 0
);

-- 5) pricing_rates — đơn giá dùng để tính khái toán (3 mức/segment)
CREATE TABLE IF NOT EXISTS pricing_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment text NOT NULL CHECK (segment IN ('can-ho', 'nha-pho-du-an', 'nha-pho', 'villa')),
  tier text NOT NULL CHECK (tier IN ('co_ban', 'kha', 'cao_cap')),
  standard text CHECK (standard IN ('JUX', 'DQH')),
  rate_per_m2 numeric,
  extra_per_room numeric,
  extra_per_floor numeric,
  margin numeric DEFAULT 0.10,
  base_days int,
  days_per_m2 numeric,
  breakdown jsonb,
  min_budget numeric,
  tier_description text,
  UNIQUE (segment, tier)
);

-- 6) sales_reps — sale phụ trách link chia sẻ. Thêm user_id (không có
-- trong yêu cầu gốc) vì nếu không có cột này thì không thể biết tài khoản
-- đăng nhập nào ứng với sale_code nào — cần để policy "sale chỉ xem lead
-- của mình" ở dưới chạy được.
CREATE TABLE IF NOT EXISTS sales_reps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  zalo text,
  telegram_chat_id text,
  active boolean DEFAULT true
);

-- 7) leads
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  call_time text,
  message text,
  seg text,
  sale_code text,
  source text,
  utm jsonb,
  intent text CHECK (intent IN ('offer', 'xem_cong_trinh', 'bang_chi_tiet')),
  gift text,
  estimate jsonb,
  lead_score text CHECK (lead_score IN ('hot', 'warm', 'cold')),
  status text NOT NULL DEFAULT 'moi' CHECK (status IN ('moi', 'da_goi', 'hen_khao_sat', 'ky_hd', 'khong_phu_hop')),
  created_at timestamptz DEFAULT now()
);

-- 8) lp_events — tracking hành vi trên landing page
CREATE TABLE IF NOT EXISTS lp_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event text NOT NULL,
  seg text,
  sale_code text,
  source text,
  session_id text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimator_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_events ENABLE ROW LEVEL SECURITY;

-- Helper: đúng pattern "role = 'Admin'" đã dùng sẵn trong repo (bảng
-- public.profiles, xem sync_profiles.sql) — không tạo hệ role mới.
CREATE OR REPLACE FUNCTION is_dqh_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'
  );
$$;

-- Nội dung landing: đọc công khai, chỉ admin sửa
DROP POLICY IF EXISTS "landing_pages_public_read" ON landing_pages;
CREATE POLICY "landing_pages_public_read" ON landing_pages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "landing_pages_admin_write" ON landing_pages;
CREATE POLICY "landing_pages_admin_write" ON landing_pages FOR ALL TO authenticated USING (is_dqh_admin()) WITH CHECK (is_dqh_admin());

DROP POLICY IF EXISTS "landing_segments_public_read" ON landing_segments;
CREATE POLICY "landing_segments_public_read" ON landing_segments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "landing_segments_admin_write" ON landing_segments;
CREATE POLICY "landing_segments_admin_write" ON landing_segments FOR ALL TO authenticated USING (is_dqh_admin()) WITH CHECK (is_dqh_admin());

DROP POLICY IF EXISTS "landing_projects_public_read" ON landing_projects;
CREATE POLICY "landing_projects_public_read" ON landing_projects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "landing_projects_admin_write" ON landing_projects;
CREATE POLICY "landing_projects_admin_write" ON landing_projects FOR ALL TO authenticated USING (is_dqh_admin()) WITH CHECK (is_dqh_admin());

DROP POLICY IF EXISTS "estimator_styles_public_read" ON estimator_styles;
CREATE POLICY "estimator_styles_public_read" ON estimator_styles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "estimator_styles_admin_write" ON estimator_styles;
CREATE POLICY "estimator_styles_admin_write" ON estimator_styles FOR ALL TO authenticated USING (is_dqh_admin()) WITH CHECK (is_dqh_admin());

DROP POLICY IF EXISTS "pricing_rates_public_read" ON pricing_rates;
CREATE POLICY "pricing_rates_public_read" ON pricing_rates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "pricing_rates_admin_write" ON pricing_rates;
CREATE POLICY "pricing_rates_admin_write" ON pricing_rates FOR ALL TO authenticated USING (is_dqh_admin()) WITH CHECK (is_dqh_admin());

-- sales_reps: chỉ admin (đọc + ghi)
DROP POLICY IF EXISTS "sales_reps_admin_all" ON sales_reps;
CREATE POLICY "sales_reps_admin_all" ON sales_reps FOR ALL TO authenticated USING (is_dqh_admin()) WITH CHECK (is_dqh_admin());

-- leads: ai cũng insert được (khách gửi form), không ai SELECT được trừ
-- admin (toàn bộ) hoặc sale đã đăng nhập xem đúng lead có sale_code của mình
DROP POLICY IF EXISTS "leads_public_insert" ON leads;
CREATE POLICY "leads_public_insert" ON leads FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "leads_admin_all" ON leads;
CREATE POLICY "leads_admin_all" ON leads FOR ALL TO authenticated USING (is_dqh_admin()) WITH CHECK (is_dqh_admin());
DROP POLICY IF EXISTS "leads_sale_select_own" ON leads;
CREATE POLICY "leads_sale_select_own" ON leads FOR SELECT TO authenticated
  USING (sale_code = (SELECT code FROM sales_reps WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "leads_sale_update_own" ON leads;
CREATE POLICY "leads_sale_update_own" ON leads FOR UPDATE TO authenticated
  USING (sale_code = (SELECT code FROM sales_reps WHERE user_id = auth.uid()))
  WITH CHECK (sale_code = (SELECT code FROM sales_reps WHERE user_id = auth.uid()));

-- lp_events: ai cũng insert được (tracking ẩn danh), chỉ admin đọc được (Tab Báo cáo)
DROP POLICY IF EXISTS "lp_events_public_insert" ON lp_events;
CREATE POLICY "lp_events_public_insert" ON lp_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "lp_events_admin_select" ON lp_events;
CREATE POLICY "lp_events_admin_select" ON lp_events FOR SELECT TO authenticated USING (is_dqh_admin());
