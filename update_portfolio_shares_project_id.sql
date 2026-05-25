-- MIGRATION: THÊM CỘT PROJECT_ID VÀO BẢNG PORTFOLIO_SHARES ĐỂ ĐỒNG BỘ TIẾN ĐỘ THỰC TẾ
ALTER TABLE public.portfolio_shares 
ADD COLUMN project_id UUID REFERENCES public.construction_projects(id) ON DELETE SET NULL;
