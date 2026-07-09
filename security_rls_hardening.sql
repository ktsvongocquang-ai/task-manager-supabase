-- ============================================================================
-- CRITICAL FIX: public (anon, zero-login) full-table read exposure.
--
-- Verified live against production before writing this file: an
-- unauthenticated request (just the public anon API key, which ships inside
-- the app's JS bundle) could read:
--   - ALL rows of construction_projects (9/9) — including client_password,
--     contract_value, budget, owner_name, address for every project, not
--     just the one project a /c/:token public link is scoped to.
--   - ALL rows of construction_payment_records (5/5) — amounts, descriptions,
--     bill photo URLs for every project.
--   - ALL rows of profiles (15/15) — every employee's full_name, email,
--     position, role, zalo_user_id.
-- construction_tasks and construction_milestones were already correctly
-- blocked for anon. construction_daily_logs does not exist as a table
-- (the app's query to it already silently no-ops today — unrelated
-- pre-existing issue, not touched here).
--
-- Root cause: these 3 tables never had Row Level Security enabled, so the
-- default Supabase table grant (anon + authenticated both get raw SELECT)
-- applied with zero restriction. The public client view (/c/:token) needs
-- SOME anon read path, but it must be scoped to exactly one project by
-- token — not the whole table. Fixed by:
--   1. Enabling RLS on all 3 tables with an authenticated-only policy
--      (matches the same permissive-for-staff pattern already used
--      everywhere else in this app — no change for logged-in internal
--      roles, who already had unrestricted access).
--   2. Adding a SECURITY DEFINER RPC that resolves the public client view
--      payload for exactly one project by token, run with elevated
--      privileges so it still works for anon after RLS locks the tables
--      down. client_password is NEVER included in its output.
--   3. Adding a second RPC to verify a client-entered password server-side,
--      so the real password value never has to be sent to the browser at
--      all (previously it was fetched as a plain column and compared with
--      client-side JS `===`).
--
-- Run this whole file once in the Supabase SQL Editor. After running it,
-- ClientView.tsx / useClientData.ts is updated (in the same commit as this
-- file) to call get_client_view_data / verify_client_password instead of
-- querying the tables directly.
-- ============================================================================

-- 1) Lock down direct table access to authenticated (internal) users only.
ALTER TABLE public.construction_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "construction_projects_authenticated_all" ON public.construction_projects;
CREATE POLICY "construction_projects_authenticated_all" ON public.construction_projects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.construction_payment_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "construction_payment_records_authenticated_all" ON public.construction_payment_records;
CREATE POLICY "construction_payment_records_authenticated_all" ON public.construction_payment_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_authenticated_all" ON public.profiles;
CREATE POLICY "profiles_authenticated_all" ON public.profiles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2) Public client-view RPC — the only anon-reachable path to this data now.
--    Returns NULL if the token doesn't match any project. Never returns
--    client_password, only a has_password boolean.
CREATE OR REPLACE FUNCTION public.get_client_view_data(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
  v_result json;
BEGIN
  SELECT id INTO v_project_id
  FROM public.construction_projects
  WHERE client_token = p_token
  LIMIT 1;

  IF v_project_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'project', (
      SELECT json_build_object(
        'id', id, 'name', name, 'owner_name', owner_name, 'address', address,
        'handover_date', handover_date, 'start_date', start_date, 'progress', progress,
        'status', status, 'risk_level', risk_level, 'contract_value', contract_value,
        'budget', budget, 'spent', spent,
        'has_password', (client_password IS NOT NULL AND client_password <> '')
      )
      FROM public.construction_projects WHERE id = v_project_id
    ),
    'tasks', COALESCE((
      SELECT json_agg(t) FROM (
        SELECT * FROM public.construction_tasks WHERE project_id = v_project_id ORDER BY created_at
      ) t
    ), '[]'::json),
    'logs', '[]'::json,
    'milestones', COALESCE((
      SELECT json_agg(m) FROM (
        SELECT * FROM public.construction_milestones WHERE project_id = v_project_id ORDER BY sort_order
      ) m
    ), '[]'::json),
    'payments', COALESCE((
      SELECT json_agg(p) FROM (
        SELECT * FROM public.construction_payment_records WHERE project_id = v_project_id ORDER BY date DESC
      ) p
    ), '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_view_data(text) TO anon, authenticated;

-- 3) Password verification RPC — real value never leaves the database.
CREATE OR REPLACE FUNCTION public.verify_client_password(p_token text, p_password text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.construction_projects
    WHERE client_token = p_token AND client_password = p_password
  );
$$;

GRANT EXECUTE ON FUNCTION public.verify_client_password(text, text) TO anon, authenticated;
