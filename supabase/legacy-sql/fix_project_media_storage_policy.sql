-- Bucket "project-media" đã được tạo (public) nhưng storage.objects chưa có policy
-- cho phép người dùng đã đăng nhập upload — thêm policy cho phép authenticated toàn quyền
-- trên riêng bucket này (không ảnh hưởng bucket khác như chat-images).
DROP POLICY IF EXISTS "project-media authenticated access" ON storage.objects;
CREATE POLICY "project-media authenticated access" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'project-media')
WITH CHECK (bucket_id = 'project-media');
