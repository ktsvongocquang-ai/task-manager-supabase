ALTER TABLE public.marketing_tasks
ADD COLUMN IF NOT EXISTS sections JSONB;
