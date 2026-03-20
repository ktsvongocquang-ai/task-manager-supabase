-- Xóa khóa ngoại do chuyển sang dạng mảng JSONB không hỗ trợ ForeignKey trực tiếp cho từng phần tử
ALTER TABLE public.marketing_tasks DROP CONSTRAINT IF EXISTS marketing_tasks_assignee_id_fkey;

-- Chuyển đổi cột assignee_id sang dạng mảng JSONB
ALTER TABLE public.marketing_tasks 
  ALTER COLUMN assignee_id DROP DEFAULT,
  ALTER COLUMN assignee_id TYPE JSONB USING 
    CASE 
      WHEN assignee_id IS NULL THEN NULL 
      ELSE jsonb_build_array(assignee_id) 
    END;
