-- Thêm cột liên kết tới marketing_tasks và marketing_projects cho bảng comments
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS marketing_task_id UUID REFERENCES public.marketing_tasks(id) ON DELETE CASCADE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS marketing_project_id UUID REFERENCES public.marketing_projects(id) ON DELETE CASCADE;

-- Thêm cột liên kết tới marketing_tasks và marketing_projects cho bảng notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS marketing_task_id UUID REFERENCES public.marketing_tasks(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS marketing_project_id UUID REFERENCES public.marketing_projects(id) ON DELETE CASCADE;

-- Tạo index để tăng tốc độ truy vấn
CREATE INDEX IF NOT EXISTS idx_comments_marketing_task_id ON public.comments(marketing_task_id);
CREATE INDEX IF NOT EXISTS idx_comments_marketing_project_id ON public.comments(marketing_project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_marketing_task_id ON public.notifications(marketing_task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_marketing_project_id ON public.notifications(marketing_project_id);
