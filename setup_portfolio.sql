-- TẠO BẢNG QUẢN LÝ LINK PORTFOLIO BẢO MẬT
CREATE TABLE public.portfolio_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    passcode TEXT, -- Cho phép NULL nếu không cài PIN
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Phân quyền RLS (Bảo mật cho Table)
ALTER TABLE public.portfolio_shares ENABLE ROW LEVEL SECURITY;

-- Bất kỳ ai cũng có thể đọc (để Khách hàng vào bằng token)
CREATE POLICY "Public can read portfolio shares" 
ON public.portfolio_shares 
FOR SELECT USING (true);

-- Chỉ user đã đăng nhập mới được tạo
CREATE POLICY "Authenticated users can create portfolio shares" 
ON public.portfolio_shares 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Chỉ người tạo (hoặc admin) mới được sửa/xóa
CREATE POLICY "Users can update own portfolio shares" 
ON public.portfolio_shares 
FOR UPDATE 
USING (auth.uid() = created_by OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'Admin');

CREATE POLICY "Users can delete own portfolio shares" 
ON public.portfolio_shares 
FOR DELETE 
USING (auth.uid() = created_by OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'Admin');
