-- Thêm cột parent_id vào bảng comments để lưu trữ cấu trúc cây (chuỗi tin nhắn)
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NULL;

-- Tạo index để tăng tốc độ truy vấn các phản hồi
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
