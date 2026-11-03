-- =====================================================================
-- DQH: Số liệu thống nhất (QA-01..05)
-- PHẦN A chạy ngay (an toàn, chạy lại được): tiến độ công trình tự tính từ việc, không gõ tay nữa.
-- PHẦN B chỉ XEM dữ liệu rác — không sửa gì. Đọc kết quả rồi mới bỏ dấu "--" ở PHẦN C nếu đồng ý.
-- =====================================================================

-- ───────────── PHẦN A: tiến độ công trình = số việc xong / tổng việc ─────────────
-- Không tính việc đã huỷ. Mỗi lần thêm / sửa / xoá việc, % của công trình tự cập nhật.
create or replace function public.dqh_recalc_project_progress(p_project uuid) returns void
language sql security definer set search_path = public as $$
  update public.construction_projects cp
     set progress = coalesce((
           select round(100.0 * count(*) filter (where upper(t.status) in ('DONE','HOÀN THÀNH','COMPLETED'))
                        / nullif(count(*), 0))::int
             from public.construction_tasks t
            where t.project_id = p_project
              and upper(coalesce(t.status, '')) not in ('CANCELLED','HỦY','HUỶ','HỦY BỎ')
         ), 0)
   where cp.id = p_project;
$$;

create or replace function public.dqh_tasks_progress_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform public.dqh_recalc_project_progress(old.project_id);
    return null;
  end if;
  perform public.dqh_recalc_project_progress(new.project_id);
  if tg_op = 'UPDATE' and old.project_id is distinct from new.project_id then
    perform public.dqh_recalc_project_progress(old.project_id);
  end if;
  return null;
end $$;

drop trigger if exists trg_ct_tasks_progress on public.construction_tasks;
create trigger trg_ct_tasks_progress after insert or update of status, project_id or delete on public.construction_tasks
  for each row execute function public.dqh_tasks_progress_trigger();

-- Tính lại ngay cho mọi công trình
select public.dqh_recalc_project_progress(id) from public.construction_projects;

-- Kiểm tra: công trình, % mới, số việc xong / tổng
select cp.name as cong_trinh, cp.status as trang_thai, cp.progress as tien_do_moi,
       count(t.*) filter (where upper(t.status) = 'DONE') as viec_xong, count(t.*) as tong_viec
from public.construction_projects cp left join public.construction_tasks t on t.project_id = cp.id
group by cp.id order by cp.name;

-- ───────────── PHẦN B: XEM dữ liệu rác (không sửa gì) ─────────────
-- B1. Việc có tên vô nghĩa: < 3 ký tự, không có chữ, toàn số/ký hiệu, hoặc tên thử
select 'tasks' as bang, id, task_code, name, status, created_at from public.tasks
 where length(trim(coalesce(name,''))) < 3 or name !~ '[[:alpha:]]' or name ~* '^(test|thử|asd|qwe|123)' or name ~ '^[0-9a-z]{3,10}$'
 union all
select 'construction_tasks', id, null, name, status, created_at from public.construction_tasks
 where length(trim(coalesce(name,''))) < 3 or name !~ '[[:alpha:]]' or name ~* '^(test|thử|asd|qwe|123)'
 order by 1, 6;

-- B2. Mã việc hỏng (trống, trùng)
select task_code, count(*) as so_lan from public.tasks group by task_code
having task_code is null or trim(task_code) = '' or count(*) > 1 order by so_lan desc;

-- B3. Công trình / khách tên lỗi chính tả hoặc mặc định
select 'construction_projects' as bang, id, name, owner_name, status from public.construction_projects
 where name ~* 'goden|test|thử' or owner_name ~* '^khách hàng mới$'
 union all
select 'projects', id, name, null, status from public.projects where name ~* 'goden|test|thử';

-- B4. Tài khoản trùng người / tài khoản thử
select id, full_name, email, role from public.profiles
 where full_name ~* 'quang|test|admin|khách hàng' order by full_name;

-- ───────────── PHẦN C: DỌN (đang tắt — bỏ dấu -- ở dòng nào muốn chạy) ─────────────
-- Không xoá hẳn: chuyển sang "Hủy bỏ" để vẫn khôi phục được, và không còn bị đếm.
-- update public.tasks set status = 'Hủy bỏ'
--  where length(trim(coalesce(name,''))) < 3 or name !~ '[[:alpha:]]' or name ~* '^(test|thử|asd|qwe|123)';
-- update public.construction_projects set name = replace(name, 'GODEN', 'GOLDEN') where name like '%GODEN%';
