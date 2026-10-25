-- ============================================================================
-- Migration cho nhánh lp-section-chiphi-quytrinh: dựng lại section "Chi phí"
-- và "Quy trình làm việc" trên /p/:token theo prompt override mới nhất.
--
-- GHI CHÚ: các file SQL gửi trước đó cho task "Quy trình làm việc" (phase
-- design/construction icon-tròn) ĐÃ BỊ THAY THẾ bởi migration này — có thể bỏ
-- qua, không cần chạy:
--   - add_workflow_category.sql
--   - fill_workflow_apartment.sql
--   - update_pricing_and_workflow_phases.sql
-- Bảng landing_workflow_steps cũ (8 bước gộp, cột category) được GIỮ NGUYÊN,
-- không xoá — chỉ không còn được landing page dùng tới, 2 bảng mới bên dưới
-- thay thế hoàn toàn chức năng của nó.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- (1) CHI PHÍ — giá thật cho Chuẩn DQH (Nhà phố / Villa)
-- Thiết kế: 350.000 - 850.000 đ/m² | Thi công: 12.000.000 - 20.000.000 đ/m²
-- ─────────────────────────────────────────────────────────────────────────
update landing_price_rates
set design_min_price_per_m2 = 350000,
    design_max_price_per_m2 = 850000,
    min_price_per_m2 = 12000000,
    max_price_per_m2 = 20000000
where category = 'house_villa' and standard = 'dqh';

-- Tên chuẩn / mô tả ngắn giờ cũng lấy từ data (admin sửa được), không viết
-- cứng trong component nữa — thêm 2 cột còn thiếu.
alter table landing_pricing_standards add column if not exists standard_label text;
alter table landing_pricing_standards add column if not exists standard_sub text;

update landing_pricing_standards
set standard_label = 'Chuẩn DQH', standard_sub = 'Nhà phố & công trình kiến trúc nhà vườn'
where category = 'house_villa' and standard = 'dqh';

update landing_pricing_standards
set standard_label = 'Chuẩn JUX', standard_sub = 'Căn hộ chung cư · hoàn thiện & nội thất'
where category = 'apartment' and standard = 'jux';

-- Xoá placeholder "[MẪU]" cũ ở vật liệu — để trống thì trang tự ẩn dòng này
-- thay vì hiện chữ [MẪU] ra ngoài.
update landing_pricing_standards
set material_partners = null
where category = 'house_villa' and standard = 'dqh' and material_partners ilike '[MẪU]%';

-- ─────────────────────────────────────────────────────────────────────────
-- (2) QUY TRÌNH LÀM VIỆC — 2 bảng mới thay cho landing_workflow_steps
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists landing_process_steps (
  id uuid primary key default gen_random_uuid(),
  process_type text not null,        -- 'noi_that' | 'xay_dung'
  step_no integer not null,
  phase text not null,               -- 'thiet_ke' | 'thi_cong' | 'ban_giao'
  title text not null,
  duration_label text,
  days_min integer not null default 0,
  days_max integer not null default 0,
  owner text,
  description text,
  sort_order integer not null default 0
);
alter table landing_process_steps enable row level security;
drop policy if exists "landing_process_steps_public_read" on landing_process_steps;
create policy "landing_process_steps_public_read" on landing_process_steps for select to anon, authenticated using (true);
drop policy if exists "landing_process_steps_editor_write" on landing_process_steps;
create policy "landing_process_steps_editor_write" on landing_process_steps for all to authenticated using (true) with check (true);

create table if not exists landing_warranty_items (
  id uuid primary key default gen_random_uuid(),
  item text not null,
  noi_that_term text,
  xay_dung_term text,
  sort_order integer not null default 0
);
alter table landing_warranty_items enable row level security;
drop policy if exists "landing_warranty_items_public_read" on landing_warranty_items;
create policy "landing_warranty_items_public_read" on landing_warranty_items for select to anon, authenticated using (true);
drop policy if exists "landing_warranty_items_editor_write" on landing_warranty_items;
create policy "landing_warranty_items_editor_write" on landing_warranty_items for all to authenticated using (true) with check (true);

-- --- Seed: process_type = noi_that (Nội thất & hoàn thiện) ---
insert into landing_process_steps (process_type, step_no, phase, title, duration_label, days_min, days_max, owner, description, sort_order) values
('noi_that', 1, 'thiet_ke', 'Khảo sát & tư vấn', 'Trong 48 giờ', 2, 2, 'KTS phụ trách',
 'Đo hiện trạng, nhận bản vẽ bàn giao và nội quy thi công của toà nhà. Nhà phố dự án: kiểm tra thấm, nứt của phần thô.', 1),
('noi_that', 2, 'thiet_ke', 'Ký hợp đồng thiết kế', '1 ngày', 1, 1, 'KTS · gia chủ',
 'Đặt cọc thiết kế, chốt phạm vi: phối cảnh 3D và bộ bản vẽ khung triển khai.', 2),
('noi_that', 3, 'thiet_ke', 'Concept 3D', '7 – 14 ngày', 7, 14, 'KTS phụ trách',
 'Phương án phối cảnh, chỉnh sửa theo số vòng đã thống nhất trong hợp đồng.', 3),
('noi_that', 4, 'thiet_ke', 'Triển khai & BOQ', '7 – 10 ngày', 7, 10, 'KTS · dự toán',
 'Bản vẽ khung, chọn vật liệu, BOQ chi tiết từng hạng mục để gia chủ duyệt.', 4),
('noi_that', 5, 'thi_cong', 'Ký hợp đồng thi công', '1 – 2 ngày', 1, 2, 'Giám đốc · gia chủ',
 'Giá cố định theo BOQ đã duyệt, thanh toán theo mốc, tiến độ có điều khoản hai chiều. DQH đăng ký thi công với ban quản lý.', 5),
('noi_that', 6, 'thi_cong', 'Thi công & sản xuất song song', '30 – 45 ngày', 30, 45, 'PM · xưởng DQH',
 'Điện nước, trần, sàn, sơn, chống thấm tại hiện trường; đồ gỗ sản xuất cùng lúc tại xưởng.', 6),
('noi_that', 7, 'ban_giao', 'Lắp đặt & bàn giao', '5 – 7 ngày', 5, 7, 'PM · gia chủ',
 'Lắp đồ gỗ, vệ sinh công nghiệp, nghiệm thu có biên bản và danh sách tồn đọng kèm hạn sửa.', 7);

-- --- Seed: process_type = xay_dung (Xây dựng trọn gói) ---
insert into landing_process_steps (process_type, step_no, phase, title, duration_label, days_min, days_max, owner, description, sort_order) values
('xay_dung', 1, 'thiet_ke', 'Khảo sát đất & pháp lý', 'Trong 48 giờ', 2, 2, 'KTS phụ trách',
 'Kiểm tra sổ, lộ giới, quy hoạch và hiện trạng nhà liền kề.', 1),
('xay_dung', 2, 'thiet_ke', 'Ký hợp đồng thiết kế', '1 ngày', 1, 1, 'KTS · gia chủ',
 'Đặt cọc, chốt phạm vi: kiến trúc, kết cấu, điện nước, phối cảnh 3D.', 2),
('xay_dung', 3, 'thiet_ke', 'Kiến trúc & concept 3D', '14 – 21 ngày', 14, 21, 'KTS phụ trách',
 'Mặt bằng công năng, mặt tiền, phối cảnh.', 3),
('xay_dung', 4, 'thiet_ke', 'Hồ sơ xin phép & BOQ', 'Tuỳ cơ quan cấp phép', 0, 0, 'KTS · kỹ sư',
 'Hồ sơ xin phép xây dựng, kết cấu, điện nước; BOQ tách gói thô và gói hoàn thiện.', 4),
('xay_dung', 5, 'thi_cong', 'Ký hợp đồng thi công', '1 – 2 ngày', 1, 2, 'Giám đốc · gia chủ',
 'Giá cố định theo BOQ đã duyệt, thanh toán theo mốc móng – từng sàn – cất nóc – hoàn thiện, tiến độ hai chiều.', 5),
('xay_dung', 6, 'thi_cong', 'Thi công phần thô', '60 – 90 ngày', 60, 90, 'PM · giám sát',
 'Nghiệm thu từng mốc cùng gia chủ, kiểm tra cốt thép trước khi đổ bê tông.', 6),
('xay_dung', 7, 'thi_cong', 'Hoàn thiện & nội thất', '30 – 45 ngày', 30, 45, 'PM · xưởng DQH',
 'Ốp lát, sơn, cửa, thiết bị và đồ gỗ.', 7),
('xay_dung', 8, 'ban_giao', 'Nghiệm thu & bàn giao', '7 ngày', 7, 7, 'PM · gia chủ',
 'Biên bản bàn giao, danh sách tồn đọng, hồ sơ bản vẽ, hướng dẫn sử dụng, hỗ trợ hoàn công.', 8);

-- --- Seed: warranty_items ---
insert into landing_warranty_items (item, noi_that_term, xay_dung_term, sort_order) values
('Kết cấu', 'Thuộc chủ đầu tư dự án', '10 năm', 1),
('Chống thấm', '3 năm', '3 năm', 2),
('Nội thất', '2 năm', '2 năm', 3),
('Điện nước hoàn thiện', '1 năm', '1 năm', 4),
('Thiết bị', 'Theo hãng', 'Theo hãng', 5);
