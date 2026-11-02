-- =====================================================================
-- DQH: Khoá dữ liệu nội bộ khỏi người ngoài (SEC-01) + chặn tự nâng quyền (SEC-02)
-- Chạy 1 lần trong Supabase SQL Editor. Chạy lại an toàn.
--
-- Cách làm (không phá app đang chạy):
--  1. Người CHƯA đăng nhập (anon) mất hết quyền đọc/ghi mọi bảng, trừ vài bảng trang công khai cần đọc
--     (landing, portfolio). Link khách /c/:token vẫn chạy vì đi qua hàm RPC SECURITY DEFINER.
--  2. Bảng nào chưa bật RLS thì bật, kèm chính sách "người đã đăng nhập dùng được" để app nội bộ không vỡ.
--     Bảng đã có RLS thì giữ nguyên chính sách cũ.
--  3. Bảng của trợ lý AI (khoá API, nhật ký, lệnh chờ) chỉ server đọc được.
--  4. Chỉ Admin được đổi vai trò (role) trong profiles — nhân viên không tự nâng mình lên Admin được.
-- =====================================================================

do $$
declare
  t record;
  public_read text[] := array[
    'landing_company_info','landing_featured_projects','landing_price_rates','landing_pricing_standards',
    'landing_process_steps','landing_team_members','landing_warranty_items','portfolio_projects','portfolio_shares'
  ];
  server_only text[] := array['ai_api_keys','ai_audit_log','ai_chat_pending','ai_cron_runs'];
begin
  for t in select c.relname as name, c.relrowsecurity as rls
           from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r'
  loop
    -- 1. Khách vãng lai: mất quyền
    execute format('revoke all on public.%I from anon', t.name);
    if t.name = any(public_read) then
      execute format('grant select on public.%I to anon', t.name);
    end if;

    -- 3. Bảng của trợ lý AI: chỉ server (service_role) dùng
    if t.name = any(server_only) then
      execute format('revoke all on public.%I from authenticated', t.name);
    end if;

    -- 2. Bật RLS cho bảng chưa bật
    if not t.rls then
      execute format('alter table public.%I enable row level security', t.name);
      execute format('drop policy if exists dqh_auth_all on public.%I', t.name);
      if not (t.name = any(server_only)) then
        execute format('create policy dqh_auth_all on public.%I for all to authenticated using (true) with check (true)', t.name);
      end if;
      if t.name = any(public_read) then
        execute format('drop policy if exists dqh_public_read on public.%I', t.name);
        execute format('create policy dqh_public_read on public.%I for select to anon using (true)', t.name);
      end if;
    end if;
  end loop;
end $$;

-- Bảng mới tạo sau này cũng không tự cấp cho anon
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;

-- 4. Chỉ Admin được đổi vai trò. Server (service_role, không có auth.uid()) vẫn đổi được.
create or replace function public.dqh_guard_role_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    if not exists (select 1 from public.profiles where id = auth.uid() and role = 'Admin') then
      raise exception 'Chỉ Admin được đổi vai trò nhân sự';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_role_change on public.profiles;
create trigger trg_guard_role_change before update on public.profiles
  for each row execute function public.dqh_guard_role_change();

-- Kiểm tra: bảng nào người ngoài (anon) còn đọc được — chỉ nên còn landing_* và portfolio_*
select c.relname as bang,
       has_table_privilege('anon', c.oid, 'select') as nguoi_ngoai_doc_duoc,
       c.relrowsecurity as da_bat_rls
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by nguoi_ngoai_doc_duoc desc, c.relname;
