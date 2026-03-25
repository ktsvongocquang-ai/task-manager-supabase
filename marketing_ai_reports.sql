-- Tạo bảng lưu trữ báo cáo AI Marketing
CREATE TABLE IF NOT EXISTS public.marketing_ai_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    report_type TEXT NOT NULL, -- 'Hôm nay', 'Tuần này', 'Tháng này', hoặc 'Tùy chỉnh'
    ad_account_id TEXT NOT NULL,
    date_range JSONB NOT NULL, -- Ví dụ: {"since": "2024-01-01", "until": "2024-01-07"}
    metrics_json JSONB NOT NULL, -- Mảng dữ liệu chứa các chỉ số để vẽ biểu đồ
    ai_advice TEXT NOT NULL -- Lời khuyên chiến lược của AI (định dạng Markdown)
);

-- Kích hoạt RLS (Row Level Security)
ALTER TABLE public.marketing_ai_reports ENABLE ROW LEVEL SECURITY;

-- Xóa policy cũ nếu tồn tại trước khi tạo mới để tránh lỗi "already exists"
DROP POLICY IF EXISTS "Cho phép mọi người xem báo cáo" ON public.marketing_ai_reports;
DROP POLICY IF EXISTS "Cho phép mọi người tạo báo cáo" ON public.marketing_ai_reports;
DROP POLICY IF EXISTS "Cho phép mọi người cập nhật báo cáo" ON public.marketing_ai_reports;
DROP POLICY IF EXISTS "Cho phép mọi người xóa báo cáo" ON public.marketing_ai_reports;

-- Tạo policy mới
CREATE POLICY "Cho phép mọi người xem báo cáo" ON public.marketing_ai_reports FOR SELECT USING (true);
CREATE POLICY "Cho phép mọi người tạo báo cáo" ON public.marketing_ai_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép mọi người cập nhật báo cáo" ON public.marketing_ai_reports FOR UPDATE USING (true);
CREATE POLICY "Cho phép mọi người xóa báo cáo" ON public.marketing_ai_reports FOR DELETE USING (true);
