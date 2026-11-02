
-- Bảng lưu trữ nội dung các dự án Portfolio
CREATE TABLE IF NOT EXISTS public.portfolio_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    location TEXT,
    area TEXT,
    style TEXT,
    studio TEXT,
    completion_date TEXT,
    intro_text TEXT,
    cover_image TEXT,
    content JSONB DEFAULT '{}'::jsonb,
    is_published BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Phân quyền RLS
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read portfolio projects" 
ON public.portfolio_projects 
FOR SELECT USING (is_published = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage portfolio projects" 
ON public.portfolio_projects 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

