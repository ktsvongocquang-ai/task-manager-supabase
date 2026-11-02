-- =====================================================================
-- DQH AI API + MCP — lớp đọc hợp nhất cho trợ lý AI
-- Chạy 1 lần trong Supabase SQL Editor. KHÔNG xoá / đổi bảng cũ nào.
-- Có thể chạy lại an toàn (create or replace / if not exists).
-- =====================================================================

-- ---------- Hàm tiện ích ----------
create or replace function public.dqh_try_uuid(v text)
returns uuid language plpgsql immutable as $$
begin
  return v::uuid;
exception when others then
  return null;
end $$;

-- Chuẩn hoá trạng thái mọi bảng về 4 giá trị: todo / doing / done / cancelled
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

-- jsonb (mảng hoặc chuỗi) -> uuid[]
create or replace function public.dqh_jsonb_uuids(j jsonb)
returns uuid[] language sql immutable as $$
  select case jsonb_typeof(j)
    when 'array'  then (select coalesce(array_agg(public.dqh_try_uuid(x)) filter (where public.dqh_try_uuid(x) is not null), '{}')
                        from jsonb_array_elements_text(j) as x)
    when 'string' then array_remove(array[public.dqh_try_uuid(j #>> '{}')], null)
    else '{}'::uuid[]
  end
$$;

-- ---------- v_projects ----------
create or replace view public.v_projects with (security_invoker = true) as
  select id, 'core'::text as source, name, project_code, status,
         start_date, end_date, manager_id as owner_id, null::text as owner_name,
         null::text as client_name, address, null::integer as progress_pct, created_at
  from public.projects
union all
  select id, 'construction', name, project_code, status,
         start_date, end_date, engineer_id, engineer_name,
         owner_name, address, progress, created_at
  from public.construction_projects
union all
  select id, 'marketing', name, project_code, status,
         start_date, end_date, manager_id, null,
         null, address, null, created_at
  from public.marketing_projects;

-- ---------- v_tasks ----------
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
  select m.id, 'marketing', m.project_id, 'marketing',
         m.name, m.description, m.status,
         public.dqh_norm_status(m.status), m.priority,
         public.dqh_jsonb_uuids(m.assignee_id) || array_remove(array[m.supporter_id], null), null,
         m.start_date, m.due_date, m.completion_pct, m.created_at
  from public.marketing_tasks m
  where coalesce(m.isarchived, false) = false
union all
  select p.id, 'personal', null, null,
         p.title, p.description, p.status,
         public.dqh_norm_status(p.status), p.priority,
         array[p.user_id], null,
         null, p.due_date, null, p.created_at
  from public.personal_tasks p;

-- ---------- Ghi chép chung (cho ghi chú / biên bản không thuộc nhật ký công trình) ----------
create table if not exists public.ai_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid,
  project_source text check (project_source in ('core','construction','marketing')),
  author_id uuid references public.profiles(id) on delete set null,
  kind text not null default 'ghi_chu' check (kind in ('ghi_chu','bien_ban','nhat_ky','van_de')),
  title text,
  content text not null,
  log_date date not null default (now() at time zone 'Asia/Ho_Chi_Minh')::date,
  is_issue boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ai_notes_project_idx on public.ai_notes(project_id, log_date desc);
alter table public.ai_notes enable row level security;
drop policy if exists ai_notes_authenticated_all on public.ai_notes;
create policy ai_notes_authenticated_all on public.ai_notes
  for all to authenticated using (true) with check (true);

-- ---------- Cột nhật ký mà view dùng (đã có trong các file schema cũ; thêm nếu thiếu) ----------
alter table public.daily_logs add column if not exists content text;
alter table public.daily_logs add column if not exists is_issue boolean default false;
alter table public.daily_logs add column if not exists today_summary text;
alter table public.daily_logs add column if not exists tomorrow_plan text;
alter table public.daily_logs add column if not exists team_name text;
alter table public.daily_logs add column if not exists work_item text;
alter table public.daily_logs add column if not exists main_workers integer;
alter table public.daily_logs add column if not exists progress integer;

-- ---------- v_logs ----------
create or replace view public.v_logs with (security_invoker = true) as
  select d.id, 'construction_diary'::text as source, d.project_id, 'construction'::text as project_source,
         d.engineer_id as author_id, 'nhat_ky'::text as kind, d.date as log_date,
         coalesce(nullif(d.notes, ''), nullif(d.content, ''), d.today_summary) as content,
         coalesce(d.is_issue, false) as is_issue, d.created_at
  from public.daily_logs d
union all
  select m.id, 'marketing_log', m.project_id, 'marketing',
         m.user_id, 'ghi_chu', m.log_date, m.content, false, m.created_at
  from public.marketing_daily_logs m
union all
  select n.id, 'note', n.project_id, n.project_source,
         n.author_id, n.kind, n.log_date,
         concat_ws(E'\n', n.title, n.content), n.is_issue, n.created_at
  from public.ai_notes n;

-- ---------- Khoá API cho trợ lý AI + nhật ký thao tác ----------
create table if not exists public.ai_api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_prefix text not null,            -- 8 ký tự đầu, để nhận diện
  key_hash text not null unique,       -- sha256 của khoá, KHÔNG lưu khoá gốc
  scopes text[] not null default array['read'],   -- 'read' | 'write'
  acts_as_user_id uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.ai_audit_log (
  id bigint generated always as identity primary key,
  key_id uuid references public.ai_api_keys(id) on delete set null,
  tool text not null,
  input jsonb,
  ok boolean not null default true,
  result_summary text,
  created_at timestamptz not null default now()
);
create index if not exists ai_audit_log_created_idx on public.ai_audit_log(created_at desc);
alter table public.ai_audit_log add column if not exists request_id text;
create unique index if not exists ai_audit_log_request_uidx on public.ai_audit_log(key_id, tool, request_id) where request_id is not null and ok;

-- Cron của Vercel có thể chạy trùng hoặc lỡ: mỗi job chỉ gửi 1 lần/ngày.
create table if not exists public.ai_cron_runs (
  job text not null,
  run_date date not null,
  result jsonb,
  created_at timestamptz not null default now(),
  primary key (job, run_date)
);
alter table public.ai_cron_runs enable row level security;

-- Kênh chat (Zalo/Telegram): lệnh giao/sửa việc chờ người nhắn trả lời "ok".
create table if not exists public.ai_chat_pending (
  channel text not null,
  sender_id text not null,
  tool text not null,
  args jsonb not null,
  summary jsonb,
  created_at timestamptz not null default now(),
  primary key (channel, sender_id)
);
alter table public.ai_chat_pending enable row level security;

-- Sổ thu/chi đọc từ Google Sheets kế toán của từng công trình (kế toán vẫn nhập ở Sheets).
create table if not exists public.accounting_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  sheet_id text,
  sheet_tab text,
  entry_date date not null,
  kind text not null check (kind in ('thu','chi')),
  amount numeric not null,
  description text,
  category text,
  party text,
  row_hash text not null,
  synced_at timestamptz not null default now(),
  unique (project_id, row_hash)
);
create index if not exists accounting_entries_project_idx on public.accounting_entries(project_id, entry_date desc);
alter table public.accounting_entries enable row level security;
drop policy if exists accounting_entries_read on public.accounting_entries;
create policy accounting_entries_read on public.accounting_entries for select to authenticated using (true);

-- Chỉ server (service role) được đụng vào 2 bảng này: bật RLS, không tạo policy nào.
alter table public.ai_api_keys enable row level security;
alter table public.ai_audit_log enable row level security;

-- View không cho khách vãng lai (anon) đọc.
revoke all on public.v_projects, public.v_tasks, public.v_logs from anon;
grant select on public.v_projects, public.v_tasks, public.v_logs to authenticated, service_role;
