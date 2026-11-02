-- =============================================
-- Bảng lưu trữ Bản tin Grok AI (Optimized v3)
-- =============================================

-- 1. Tạo bảng chính
CREATE TABLE IF NOT EXISTS public.grok_news_feed (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    title text NOT NULL,
    content_markdown text NOT NULL,
    category text DEFAULT 'Tổng hợp',
    ai_model text DEFAULT 'grok-3-mini',
    edition text DEFAULT 'AM' CHECK (edition IN ('AM', 'PM')),
    -- Cột chống trùng lặp: lưu ngày cụ thể (YYYY-MM-DD)
    edition_date date DEFAULT CURRENT_DATE
);

-- 2. Index tăng tốc truy vấn (Frontend luôn query ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_grok_news_created_at ON public.grok_news_feed (created_at DESC);

-- 3. Chống trùng lặp: Mỗi ngày chỉ có 1 bản tin AM và 1 bản tin PM
CREATE UNIQUE INDEX IF NOT EXISTS idx_grok_news_unique_edition 
ON public.grok_news_feed (edition_date, edition);

-- 4. Bật Row Level Security (RLS)
ALTER TABLE public.grok_news_feed ENABLE ROW LEVEL SECURITY;

-- 5. Cho phép tất cả người dùng đã đăng nhập ĐỌC tin tức
CREATE POLICY "Cho phép user đã đăng nhập đọc tin tức" 
ON public.grok_news_feed FOR SELECT 
USING (auth.role() = 'authenticated');

-- 6. Chỉ cho phép Service Role (Server backend) THÊM tin (không cho client INSERT)
CREATE POLICY "Chỉ Service Role mới được thêm tin" 
ON public.grok_news_feed FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- 7. Tự động dọn dẹp tin cũ hơn 90 ngày (chạy thủ công hoặc qua pg_cron)
-- DELETE FROM public.grok_news_feed WHERE created_at < NOW() - INTERVAL '90 days';
