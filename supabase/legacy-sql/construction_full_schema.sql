-- ═══════════════════════════════════════════════════════════
-- CONSTRUCTION MODULE — FULL SCHEMA MIGRATION
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Ensure construction_projects has all needed columns
ALTER TABLE construction_projects
  ADD COLUMN IF NOT EXISTS contract_value bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget_spent numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'green',
  ADD COLUMN IF NOT EXISTS owner_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS engineer_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS handover_date date;

-- 2. Ensure construction_tasks has checklist + issues as JSONB
ALTER TABLE construction_tasks
  ADD COLUMN IF NOT EXISTS checklist jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS issues jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS subcontractor text DEFAULT '',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;

-- 3. Approvals table (QC, Material, Variation, Budget Alert)
CREATE TABLE IF NOT EXISTS construction_approvals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES construction_projects(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('qc', 'material', 'variation', 'budget_alert')),
    title text NOT NULL,
    detail text DEFAULT '',
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE construction_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated" ON construction_approvals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Milestones table (acceptance + payment tracking)
CREATE TABLE IF NOT EXISTS construction_milestones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES construction_projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'pending_internal', 'passed')),
    approved_date date,
    payment_amount bigint DEFAULT 0,
    payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
    sort_order int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE construction_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated" ON construction_milestones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Subcontractors table
CREATE TABLE IF NOT EXISTS construction_subcontractors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    trade text NOT NULL,
    phone text DEFAULT '',
    rating numeric(2,1) DEFAULT 0,
    project_ids text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);
ALTER TABLE construction_subcontractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated" ON construction_subcontractors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Attendance table (daily worker counts per project)
CREATE TABLE IF NOT EXISTS construction_attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES construction_projects(id) ON DELETE CASCADE,
    date date NOT NULL,
    main_workers int DEFAULT 0,
    helper_workers int DEFAULT 0,
    daily_rate_main int DEFAULT 450000,
    daily_rate_helper int DEFAULT 280000,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE construction_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated" ON construction_attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Enhance daily_logs with construction-specific fields
ALTER TABLE daily_logs
  ADD COLUMN IF NOT EXISTS weather text DEFAULT '',
  ADD COLUMN IF NOT EXISTS temperature numeric(4,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS main_workers int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS helper_workers int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS photo_urls jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gps_lat numeric(10,6),
  ADD COLUMN IF NOT EXISTS gps_lng numeric(10,6),
  ADD COLUMN IF NOT EXISTS work_item text DEFAULT '',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- 8. Notifications table
CREATE TABLE IF NOT EXISTS construction_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES construction_projects(id) ON DELETE CASCADE,
    level text DEFAULT 'info' CHECK (level IN ('critical', 'action', 'good', 'info')),
    msg text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE construction_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated" ON construction_notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_approvals_project ON construction_approvals(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON construction_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_attendance_project_date ON construction_attendance(project_id, date);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON construction_notifications(read);
