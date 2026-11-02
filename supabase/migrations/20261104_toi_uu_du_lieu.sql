-- =====================================================================
-- DQH: tối ưu dữ liệu — chạy được nhiều lần, không xoá dữ liệu nào.
-- 1) Bỏ việc/dự án Marketing khỏi báo cáo, Điều hành và trợ lý AI (module đã gỡ; dữ liệu gốc giữ nguyên).
-- 2) Thêm chỉ mục cho các truy vấn hay dùng (Trạm GS, Điều hành, báo cáo, trợ lý). Cột nào không có thì bỏ qua.
-- =====================================================================
begin;

create or replace view public.v_tasks with (security_invoker = true) as
  select t.id, 'core'::text as source, t.project_id, 'core'::text as project_source,
         t.name as title, t.description, t.status as status_raw,
         public.dqh_norm_status(t.status) as status, t.priority,
         array_remove(array[t.assignee_id, t.supporter_id], null) as assignee_ids,
         null::text as assignee_name,
         t.start_date, t.due_date, t.completion_pct as progress_pct, t.created_at
  from public.tasks t
union all
  select c.id, 'construction', c.project_id, 'construction',
         c.name, c.note, c.status,
         public.dqh_norm_status(c.status), c.priority,
         '{}'::uuid[], c.assignee,
         c.start_date, c.end_date, c.progress, c.created_at
  from public.construction_tasks c
union all
  select p.id, 'personal', null, null,
         p.title, p.description, p.status,
         public.dqh_norm_status(p.status), p.priority,
         array[p.user_id], null,
         null, p.due_date, null, p.created_at
  from public.personal_tasks p;

create or replace view public.v_projects with (security_invoker = true) as
  select id, 'core'::text as source, name, project_code, status,
         start_date, end_date, manager_id as owner_id, null::text as owner_name,
         null::text as client_name, address, null::integer as progress_pct, created_at
  from public.projects
union all
  select id, 'construction', name, project_code, status,
         start_date, end_date, engineer_id, engineer_name,
         owner_name, address, progress, created_at
  from public.construction_projects;

do $$
declare s text;
begin
  foreach s in array array[
    'create index if not exists ct_tasks_project_idx on public.construction_tasks(project_id, end_date)',
    'create index if not exists ct_tasks_status_idx on public.construction_tasks(status)',
    'create index if not exists tasks_project_idx on public.tasks(project_id)',
    'create index if not exists tasks_assignee_due_idx on public.tasks(assignee_id, due_date)',
    'create index if not exists tasks_status_due_idx on public.tasks(status, due_date)',
    'create index if not exists personal_tasks_user_idx on public.personal_tasks(user_id, due_date)',
    'create index if not exists daily_logs_date_idx on public.daily_logs(date)',
    'create index if not exists daily_logs_project_date_idx2 on public.daily_logs(project_id, date desc)',
    'create index if not exists cprojects_engineer_idx on public.construction_projects(engineer_name)',
    'create index if not exists cprojects_client_token_idx on public.construction_projects(client_token)',
    'create index if not exists profiles_email_idx on public.profiles(lower(email))',
    'create index if not exists profiles_zalo_idx on public.profiles(zalo_user_id)',
    'create index if not exists profiles_telegram_idx on public.profiles(telegram_chat_id)',
    'create index if not exists ai_notes_kind_idx on public.ai_notes(kind, log_date desc)'
  ] loop
    begin execute s; exception when others then raise notice 'Bỏ qua: % (%)', s, sqlerrm; end;
  end loop;
end $$;

analyze public.tasks; analyze public.construction_tasks; analyze public.daily_logs; analyze public.profiles;

commit;
