-- ============================================================
-- CHẠY FILE NÀY TRONG PROJECT SUPABASE "DQH MIROR Quangmui@2512"
-- (cùng project chứa landing_featured_projects, landing_admin_profiles...)
-- Tạo bucket lưu ảnh cho /landing-admin (ảnh bìa, ảnh Case Study).
-- Lý do lỗi "Tải ảnh thất bại": bucket "landing-media" chưa từng được
-- tạo trong project này, nên mọi lần upload đều bị từ chối.
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-media', 'landing-media', true)
ON CONFLICT (id) DO NOTHING;

-- Ai cũng xem được ảnh (landing page public, không cần đăng nhập)
DROP POLICY IF EXISTS "landing_media_public_read" ON storage.objects;
CREATE POLICY "landing_media_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'landing-media');

-- Chỉ editor/admin đã đăng nhập /landing-admin mới upload/sửa/xoá được ảnh
DROP POLICY IF EXISTS "landing_media_editor_write" ON storage.objects;
CREATE POLICY "landing_media_editor_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'landing-media' AND public.is_landing_active_editor());

DROP POLICY IF EXISTS "landing_media_editor_update" ON storage.objects;
CREATE POLICY "landing_media_editor_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'landing-media' AND public.is_landing_active_editor())
  WITH CHECK (bucket_id = 'landing-media' AND public.is_landing_active_editor());

DROP POLICY IF EXISTS "landing_media_editor_delete" ON storage.objects;
CREATE POLICY "landing_media_editor_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'landing-media' AND public.is_landing_active_editor());
