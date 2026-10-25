-- ============================================================
-- LP v2 — NV9 bổ sung: landing_workflow_steps trong project Supabase
-- CHÍNH ("quan ly cong ty").
--
-- Vì sao cần bảng mới ở đây thay vì "lấy dữ liệu quy trình hiện có":
-- bảng landing_workflow_steps THẬT đang nằm ở project Supabase khác
-- ("DQH MIROR Quangmui@2512", dùng cho 1 bản dựng landing page trước đó
-- đã bị thay thế hoàn toàn bởi LP v2). Toàn bộ LP v2 (NV1-NV10) chỉ dùng
-- 1 project Supabase chính duy nhất — không kéo thêm client/project thứ
-- 2 chỉ để lấy 1 bảng. Nên tạo lại đúng bảng này trong project chính,
-- chép lại đúng nội dung quy trình 8 bước thật đã có (không bịa thêm).
-- ============================================================

CREATE TABLE IF NOT EXISTS landing_workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_no text NOT NULL,
  title text NOT NULL,
  duration text,
  executor text,
  details text,
  sort_order int DEFAULT 0,
  UNIQUE (step_no)
);

ALTER TABLE landing_workflow_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "landing_workflow_steps_public_read" ON landing_workflow_steps;
CREATE POLICY "landing_workflow_steps_public_read" ON landing_workflow_steps FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "landing_workflow_steps_admin_write" ON landing_workflow_steps;
CREATE POLICY "landing_workflow_steps_admin_write" ON landing_workflow_steps FOR ALL TO authenticated USING (is_dqh_admin()) WITH CHECK (is_dqh_admin());

INSERT INTO landing_workflow_steps (step_no, title, duration, executor, details, sort_order) VALUES
('01', 'Khảo sát & Tư vấn', 'Trong 48 giờ', 'KTS phụ trách & PM', 'Đo đạc hiện trạng bằng máy quét laser, phỏng vấn chuyên sâu thói quen sinh hoạt của gia đình, phân tích hướng nắng hướng gió, đề xuất mặt bằng công năng 2D sơ bộ hoàn toàn miễn phí.', 1),
('02', 'Thiết kế Concept 3D', '7 - 14 Ngày', 'Team Concept & Creative Director', 'Lên phối cảnh 3D các không gian chính, dựng moodboard bảng mẫu vật liệu thực tế, cân đối ánh sáng ảo. Hỗ trợ chỉnh sửa đến khi gia chủ hài lòng.', 2),
('03', 'Bản vẽ Kỹ thuật & BOQ', '10 - 15 Ngày', 'Kỹ sư cơ điện & Bộ phận dự toán', 'Triển khai bộ bản vẽ chi tiết thi công, lập bảng bóc tách khối lượng BOQ chính xác đến từng con ốc, mã sơn và ray trượt. Cam kết chi phí BOQ cố định, không phát sinh chi phí ẩn.', 3),
('04', 'Ký hợp đồng & Kick-off', '1 - 2 Ngày', 'Ban giám đốc & Toàn bộ team dự án', 'Ký hợp đồng thi công với tổng giá cố định, lịch thanh toán theo milestone rõ ràng và điều khoản phạt trễ tiến độ. Họp khởi động dự án giới thiệu KTS, Kỹ sư kết cấu và Giám sát hiện trường với gia chủ.', 4),
('05', 'Thi công phần thô', '60 - 90 Ngày', 'Đội ngũ kỹ sư & Giám sát hiện trường', 'Đổ bê tông cốt thép móng kết cấu, đi hệ thống ME&P. Test ngâm nước toilet và ban công 72 giờ, mời gia chủ nghiệm thu trực tiếp trước khi lấp nền.', 5),
('06', 'Hoàn thiện & Nội thất', '30 - 45 Ngày', 'Xưởng gỗ DQH & Đội hoàn thiện', 'Sản xuất nội thất gỗ theo bản vẽ CAD tại xưởng, sơn phủ mờ mộc tự nhiên. Vận chuyển lắp ráp tại công trình, kiểm tra khớp shadow line 3mm chuyển tiếp tường thạch cao.', 6),
('07', 'Nghiệm thu & Bàn giao', '7 Ngày', 'Gia chủ & KTS trưởng', 'Cùng gia chủ rà soát checklist nghiệm thu từng chi tiết. Khắc phục toàn bộ lỗi nhỏ (defect list) trước khi chính thức bàn giao hồ sơ hoàn công và chìa khóa.', 7),
('08', 'Bảo hành & Chăm sóc sau', 'Bảo hành kết cấu 10 năm', 'Hotline 24/7 của DQH', 'Bảo hành kết cấu 10 năm, chống thấm 5 năm, hoàn thiện nội thất 5 năm. Phản hồi bảo trì trong 2 giờ làm việc, kỹ thuật viên có mặt xử lý tại hiện trường trong 24-48 giờ.', 8)
ON CONFLICT (step_no) DO NOTHING;
