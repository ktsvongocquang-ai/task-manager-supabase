-- Create marketing projects table
CREATE TABLE IF NOT EXISTS public.marketing_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    project_code TEXT UNIQUE,
    description TEXT,
    status TEXT DEFAULT 'Chưa bắt đầu',
    start_date DATE,
    end_date DATE,
    manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    department TEXT DEFAULT 'Marketing',
    project_type TEXT,
    update_status TEXT,
    scale TEXT,
    effect_type TEXT,
    effect_description TEXT,
    address TEXT,
    image_folder_link TEXT,
    video_folder_link TEXT,
    can_shoot_video TEXT DEFAULT 'Có thể',
    customer_problem TEXT,
    dqh_solution TEXT,
    other_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for marketing_projects
ALTER TABLE public.marketing_projects ENABLE ROW LEVEL SECURITY;

-- Create policies for marketing_projects
CREATE POLICY "Cho phép xem tất cả marketing projects" 
    ON public.marketing_projects FOR SELECT 
    TO public 
    USING (true);

CREATE POLICY "Cho phép thêm marketing projects" 
    ON public.marketing_projects FOR INSERT 
    TO public 
    WITH CHECK (true);

CREATE POLICY "Cho phép cập nhật marketing projects" 
    ON public.marketing_projects FOR UPDATE 
    TO public 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Cho phép xóa marketing projects" 
    ON public.marketing_projects FOR DELETE 
    TO public 
    USING (true);

-- Create marketing tasks table
CREATE TABLE IF NOT EXISTS public.marketing_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    project_id UUID REFERENCES public.marketing_projects(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'IDEA',
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date DATE,
    category TEXT, -- maps to format
    output TEXT, -- maps to platform
    priority TEXT DEFAULT 'Trung bình',
    target TEXT, -- maps to goal
    report_date TIMESTAMP WITH TIME ZONE, -- maps to publishTime
    description TEXT, -- maps to contentDetails
    notes TEXT,
    isArchived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for marketing_tasks
ALTER TABLE public.marketing_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for marketing_tasks
CREATE POLICY "Cho phép xem tất cả marketing tasks" 
    ON public.marketing_tasks FOR SELECT 
    TO public 
    USING (true);

CREATE POLICY "Cho phép thêm marketing tasks" 
    ON public.marketing_tasks FOR INSERT 
    TO public 
    WITH CHECK (true);

CREATE POLICY "Cho phép cập nhật marketing tasks" 
    ON public.marketing_tasks FOR UPDATE 
    TO public 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Cho phép xóa marketing tasks" 
    ON public.marketing_tasks FOR DELETE 
    TO public 
    USING (true);
