-- ============================================================
-- Chạy trong project Supabase "DQH MIROR Quangmui@2512", SAU khi đã chạy
-- landing_page_sample_fill.sql + landing_page_sample_fill_2.sql.
-- Thêm ảnh đại diện + hồ sơ/CV cho nhân sự (bấm vào tên trên landing
-- page sẽ mở ra xem). An toàn chạy nhiều lần.
-- ============================================================

ALTER TABLE landing_team_members ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE landing_team_members ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE landing_team_members ADD COLUMN IF NOT EXISTS highlights jsonb;

UPDATE landing_team_members SET
  avatar_url = v.avatar_url,
  bio = v.bio,
  highlights = v.highlights::jsonb
FROM (VALUES
  ('[MẪU] Nguyễn Văn A', 'https://picsum.photos/seed/dqh-staff-1/400/400',
   '[MẪU] Kiến trúc sư trưởng tại DQH từ 2019. Tốt nghiệp Đại học Kiến trúc TP.HCM, từng công tác tại 2 công ty thiết kế trước khi đồng sáng lập DQH. Chuyên các phong cách Modern Tropical và Quiet Luxury, trực tiếp phụ trách concept cho các công trình biệt thự và nhà phố cao cấp.',
   '["8 năm kinh nghiệm thiết kế kiến trúc","Phụ trách 40+ công trình nhà phố & biệt thự","Chứng chỉ hành nghề kiến trúc sư"]'),
  ('[MẪU] Trần Thị B', 'https://picsum.photos/seed/dqh-staff-2/400/400',
   '[MẪU] Concept Designer với 5 năm kinh nghiệm, chuyên moodboard vật liệu và phối cảnh 3D. Tốt nghiệp Đại học Kiến trúc TP.HCM, từng thực tập tại 1 studio thiết kế nội thất tại Singapore.',
   '["5 năm concept design","Chuyên phong cách Modern Tropical & Japandi","Tốt nghiệp ĐH Kiến trúc TP.HCM"]'),
  ('[MẪU] Lê Văn C', 'https://picsum.photos/seed/dqh-staff-3/400/400',
   '[MẪU] Quản lý dự án với 10 năm kinh nghiệm trong lĩnh vực xây dựng dân dụng. Phụ trách điều phối tiến độ, ngân sách và chất lượng cho toàn bộ dự án DQH đang triển khai.',
   '["10 năm quản lý dự án xây dựng dân dụng","Chứng chỉ hành nghề quản lý dự án hạng II","Quản lý đồng thời 5-7 công trình"]'),
  ('[MẪU] Phạm Văn D', 'https://picsum.photos/seed/dqh-staff-4/400/400',
   '[MẪU] Giám sát hiện trường với 7 năm kinh nghiệm, trực tiếp kiểm soát chất lượng thi công phần thô và hoàn thiện tại công trình.',
   '["7 năm giám sát hiện trường","Kiểm soát chất lượng thi công phần thô & hoàn thiện","Có mặt tại công trình hàng ngày"]'),
  ('[MẪU] Hoàng Văn E', 'https://picsum.photos/seed/dqh-staff-5/400/400',
   '[MẪU] Tổ trưởng xưởng sản xuất nội thất với 12 năm kinh nghiệm nghề mộc. Trực tiếp giám sát gia công nội thất gỗ tự nhiên và công nghiệp theo bản vẽ CAD.',
   '["12 năm nghề mộc","Tổ trưởng xưởng sản xuất nội thất","Gia công gỗ tự nhiên & công nghiệp"]'),
  ('[MẪU] Vũ Thị F', 'https://picsum.photos/seed/dqh-staff-6/400/400',
   '[MẪU] Phụ trách kiểm soát chất lượng vật liệu đầu vào, đối chiếu mẫu thực tế với thiết kế trước khi đưa vào thi công.',
   '["4 năm kiểm soát chất lượng vật liệu","Đối chiếu mẫu thực tế trước khi thi công","Quản lý kho mẫu vật liệu"]')
) AS v(name, avatar_url, bio, highlights)
WHERE landing_team_members.name = v.name;
