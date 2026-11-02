ALTER TABLE public.marketing_shooting_milestones 
ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES public.marketing_tasks(id) ON DELETE CASCADE;
