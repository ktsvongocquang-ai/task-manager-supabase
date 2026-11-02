-- =====================================================================
-- DQH: dọn dữ liệu theo kết quả soát ngày 02/11/2026. Không xoá dữ liệu nào.
-- PHẦN A chạy luôn được. PHẦN B cần anh điền tên rồi mới bỏ dấu "--" để chạy.
-- =====================================================================
begin;

-- A1. "Chờ kích hoạt" (36 việc thiết kế) là chưa bắt đầu, trước đây bị tính là "đang làm".
create or replace function public.dqh_norm_status(s text)
returns text language sql immutable as $$
  select case
    when s is null then 'todo'
    when lower(trim(s)) in ('hoàn thành','done','completed','published','đã xong') then 'done'
    when lower(trim(s)) in ('hủy bỏ','huỷ bỏ','rejected','archived','lưu trữ','cancelled','canceled') then 'cancelled'
    when lower(trim(s)) in ('chưa bắt đầu','chờ kích hoạt','cần làm','todo','mới','mới tạo','upcoming','pending','idea','open','scheduled','draft','preparing') then 'todo'
    else 'doing'
  end
$$;

-- A2. Trạng thái công trình viết 3 kiểu ("in_progress", "ĐANG THI CÔNG", "Đang thi công") -> thống nhất 1 kiểu.
update public.construction_projects set status = 'Đang thi công'
 where lower(status) in ('in_progress', 'đang thi công') and status <> 'Đang thi công';

-- A3. Tên giám sát "Nguyễn Văn Hùng" là tên mẫu từ dữ liệu demo, không có nhân sự này -> bỏ trống để gán lại cho đúng.
update public.construction_projects set engineer_name = null where engineer_name = 'Nguyễn Văn Hùng';

commit;

-- =====================================================================
-- PHẦN B — cần anh quyết, chạy từng dòng sau khi điền
-- =====================================================================

-- B1. Xem 4 công trình thi công và người phụ trách hiện tại:
-- select id, name, status, engineer_name, manager_name from public.construction_projects order by created_at desc;

-- B2. Gán giám sát cho từng công trình (tên phải GIỐNG HỆT họ tên trong Người dùng):
-- update public.construction_projects set engineer_name = '<Họ tên giám sát>' where name = '<Tên công trình>';

-- B3. Xem nhân sự để đổi vai trò cho đúng (đang có 8 người "Quản lý thi công", không ai là "Giám Sát"):
-- select full_name, email, role from public.profiles order by role, full_name;
-- update public.profiles set role = 'Giám Sát' where email = '<email giám sát>';

-- B4. 54 việc thi công đều "TODO", không người nhận, 41 việc đã quá hạn (27 việc quá 60 ngày):
--     nhiều khả năng là tiến độ mẫu tạo lúc đầu rồi không cập nhật. Xem theo công trình:
-- select p.name, count(*) tong, count(*) filter (where t.end_date < current_date) qua_han, min(t.start_date), max(t.end_date)
--   from public.construction_tasks t join public.construction_projects p on p.id = t.project_id group by p.name;
--     Nếu công trình nào đã làm xong các hạng mục cũ, đánh dấu xong các việc đã qua hạn hơn 60 ngày của công trình đó:
-- update public.construction_tasks set status = 'DONE', progress = 100, updated_at = now()
--  where project_id = (select id from public.construction_projects where name = '<Tên công trình>')
--    and status = 'TODO' and end_date < current_date - 60;

-- B5. Bảng tin tức AI cũ (grok_news_feed, 1,3 MB) không còn dùng vì đã bỏ "Bảng tin đầu tư".
--     Muốn dọn thì chạy (XOÁ HẲN, không lấy lại được):
-- delete from public.grok_news_feed;
