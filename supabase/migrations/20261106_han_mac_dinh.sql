-- =====================================================================
-- DQH: Việc dự án (thiết kế) luôn có hạn.
-- Giao việc mà để trống hạn -> tự đặt hạn = ngày bắt đầu (hoặc hôm nay) + 3 ngày.
-- Chạy lại an toàn. Không đụng tới việc cũ (nhân viên tự đặt hạn ở "Việc của tôi").
-- =====================================================================
create or replace function public.dqh_default_due() returns trigger language plpgsql as $$
begin
  if new.due_date is null then
    new.due_date := coalesce(new.start_date::date, (now() at time zone 'Asia/Ho_Chi_Minh')::date) + 3;
  end if;
  return new;
end $$;

drop trigger if exists trg_tasks_default_due on public.tasks;
create trigger trg_tasks_default_due before insert on public.tasks
  for each row execute function public.dqh_default_due();

-- Kiểm tra: số việc đang mở chưa có hạn (nhân viên đặt dần ở trang "Việc của tôi")
select count(*) as viec_mo_chua_co_han
from public.tasks
where due_date is null and status not in ('Hoàn thành', 'Hủy bỏ');
