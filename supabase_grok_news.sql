-- Script tạo bảng lưu trữ tin tức Grok AI
CREATE TABLE IF NOT EXISTS public.grok_news_feed (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    title text NOT NULL,
    content_markdown text NOT NULL,
    category text DEFAULT 'Tổng hợp',
    ai_model text DEFAULT 'grok-beta'
);

-- Bật Row Level Security (RLS)
ALTER TABLE public.grok_news_feed ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả người dùng ĐỌC tin tức
CREATE POLICY "Cho phép ai cũng đọc được tin tức" 
ON public.grok_news_feed FOR SELECT USING (true);

-- Cho phép Server (Service Role Key) THÊM tin tức
CREATE POLICY "Cho phép Service Role thêm tin tức" 
ON public.grok_news_feed FOR INSERT WITH CHECK (true);
