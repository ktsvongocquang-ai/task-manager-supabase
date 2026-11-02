-- =====================================================================
-- DQH: Bảng vật tư theo trạng thái + Phát sinh phải khách đồng ý mới vào tiến độ
-- Chạy sau 20261102_ai_api_mcp.sql. Chạy lại an toàn.
-- =====================================================================

-- ---------- Vật tư công trình ----------
create table if not exists public.site_materials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.construction_projects(id) on delete cascade,
  name text not null,                       -- tên + quy cách: "Gạch 60x60 Viglacera men mờ"
  quantity numeric,
  unit text,
  for_item text,                            -- phục vụ hạng mục nào
  need_by date,                             -- hạn phải có mặt ở công trình
  status text not null default 'can_dat'
    check (status in ('can_dat','cho_chu_nha','da_dat','dang_ve','da_ve','huy')),
  owner_choice text,                        -- chủ nhà cần chốt gì (mẫu/màu/phương án)
  owner_decision text,                      -- chủ nhà đã chốt gì (ghi từ link khách)
  supplier text,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists site_materials_project_idx on public.site_materials(project_id, status, need_by);
alter table public.site_materials enable row level security;
drop policy if exists site_materials_auth_all on public.site_materials;
create policy site_materials_auth_all on public.site_materials for all to authenticated using (true) with check (true);

-- ---------- Phát sinh (change order) ----------
create table if not exists public.change_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.construction_projects(id) on delete cascade,
  code text,                                -- PS-01, PS-02… theo công trình
  title text not null,
  description text,
  cost numeric not null default 0,          -- chi phí tăng (+) / giảm (-)
  extra_days integer not null default 0,    -- số ngày thi công thêm
  status text not null default 'cho_khach'
    check (status in ('cho_khach','khach_dong_y','khach_tu_choi','da_vao_tien_do','huy')),
  requested_by uuid references public.profiles(id) on delete set null,
  client_decided_at timestamptz,
  client_note text,
  task_id uuid,                             -- việc đã tạo trong tiến độ khi duyệt
  created_at timestamptz not null default now()
);
create index if not exists change_orders_project_idx on public.change_orders(project_id, status);
alter table public.change_orders enable row level security;
drop policy if exists change_orders_auth_all on public.change_orders;
create policy change_orders_auth_all on public.change_orders for all to authenticated using (true) with check (true);

-- Phát sinh chỉ vào tiến độ khi khách đã đồng ý.
create or replace function public.dqh_guard_change_order() returns trigger language plpgsql as $$
begin
  if new.status = 'da_vao_tien_do' and coalesce(old.status, '') not in ('khach_dong_y', 'da_vao_tien_do') then
    raise exception 'Phát sinh % chưa được khách đồng ý, không đưa vào tiến độ được', coalesce(new.code, new.title);
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_change_order on public.change_orders;
create trigger trg_guard_change_order before update on public.change_orders
  for each row execute function public.dqh_guard_change_order();

-- ---------- Link khách (/c/:token): xem việc chờ mình quyết, và quyết ----------
-- Kiểm mã link + mật khẩu (nếu công trình có đặt) ngay trong database.
create or replace function public.dqh_client_project(p_token text, p_password text)
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.construction_projects
  where client_token = p_token
    and (coalesce(client_password, '') = '' or client_password = coalesce(p_password, ''))
  limit 1
$$;
revoke all on function public.dqh_client_project(text, text) from public, anon, authenticated;

create or replace function public.get_client_decisions(p_token text, p_password text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_id uuid := public.dqh_client_project(p_token, p_password);
begin
  if v_id is null then return null; end if;
  return jsonb_build_object(
    'change_orders', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'code', code, 'title', title, 'description', description,
        'cost', cost, 'extra_days', extra_days, 'status', status, 'client_note', client_note, 'created_at', created_at) order by created_at desc)
      from public.change_orders where project_id = v_id and status <> 'huy'), '[]'::jsonb),
    'materials', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'for_item', for_item, 'need_by', need_by,
        'owner_choice', owner_choice, 'owner_decision', owner_decision, 'status', status) order by need_by nulls last)
      from public.site_materials where project_id = v_id and status = 'cho_chu_nha'), '[]'::jsonb)
  );
end $$;
grant execute on function public.get_client_decisions(text, text) to anon, authenticated;

create or replace function public.client_decide_change_order(p_token text, p_password text, p_id uuid, p_approve boolean, p_note text default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_id uuid := public.dqh_client_project(p_token, p_password);
begin
  if v_id is null then return false; end if;
  update public.change_orders
     set status = case when p_approve then 'khach_dong_y' else 'khach_tu_choi' end,
         client_decided_at = now(), client_note = left(p_note, 1000)
   where id = p_id and project_id = v_id and status = 'cho_khach';
  return found;
end $$;
grant execute on function public.client_decide_change_order(text, text, uuid, boolean, text) to anon, authenticated;

create or replace function public.client_choose_material(p_token text, p_password text, p_id uuid, p_decision text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_id uuid := public.dqh_client_project(p_token, p_password);
begin
  if v_id is null or coalesce(trim(p_decision), '') = '' then return false; end if;
  update public.site_materials
     set owner_decision = left(p_decision, 1000), status = 'can_dat', updated_at = now()
   where id = p_id and project_id = v_id and status = 'cho_chu_nha';
  return found;
end $$;
grant execute on function public.client_choose_material(text, text, uuid, text) to anon, authenticated;
