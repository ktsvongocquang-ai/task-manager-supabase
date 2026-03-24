-- Add marketing task/project ID columns to notifications table
-- These are needed so that clicking a notification knows whether to navigate to /marketing or /dashboard

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS marketing_task_id UUID REFERENCES marketing_tasks(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS marketing_project_id UUID REFERENCES marketing_projects(id) ON DELETE SET NULL;
