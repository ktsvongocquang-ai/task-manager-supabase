-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    mentions JSONB DEFAULT '[]'::jsonb, -- Array of mentioned profile IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Note: A comment should belong to either a task OR a project, but not necessarily both.

-- Enable RLS for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policies for comments
CREATE POLICY "Cho phép tất cả (tạm thời) đọc comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả (tạm thời) thêm comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép tất cả (tạm thời) cập nhật comments" ON public.comments FOR UPDATE USING (true);
CREATE POLICY "Cho phép tất cả (tạm thời) xóa comments" ON public.comments FOR DELETE USING (true);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- Who receives the notification
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Who caused the notification
    type VARCHAR(255) NOT NULL, -- 'mention', 'assignment', 'overdue', 'due_today', 'system'
    related_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    related_project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Người dùng có thể xem thông báo của họ" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Người dùng có thể cập nhật thông báo của họ (đánh dấu đã đọc)" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
-- Insert should generally be allowed from triggers or edge functions, but we allow authenticated users to trigger some (mentions).
CREATE POLICY "Cho phép tất cả đánh đẩy thông báo" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Người dùng có thể xóa thông báo của họ" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Optional: Create an index for faster queries on user_id and is_read
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
