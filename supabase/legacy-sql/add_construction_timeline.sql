-- SQL Migration for Construction Progress Timeline (Marketing & PM Integration)

-- 1. Add columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS actual_start_date date,
ADD COLUMN IF NOT EXISTS design_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS rough_construction_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS finishing_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS interior_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS handover_date date;

-- 2. Create shooting_milestones table
CREATE TABLE IF NOT EXISTS shooting_milestones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    milestone_date date NOT NULL,
    content text NOT NULL,
    status text DEFAULT 'Chờ quay',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Create daily_logs table for construction updates
CREATE TABLE IF NOT EXISTS daily_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    log_date date NOT NULL,
    content text NOT NULL,
    media_link text,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
