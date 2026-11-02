-- 1. Create Construction Files Table
CREATE TABLE IF NOT EXISTS construction_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('EXCEL', 'WORD', 'PDF')),
  file_url TEXT NOT NULL,
  parsed_data JSONB,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on construction_files
ALTER TABLE construction_files ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for construction_files
CREATE POLICY "Enable all for authenticated users" ON construction_files
  FOR ALL TO authenticated USING (true);

-- 4. Set up Storage Bucket for Construction Documents
-- Note: This part usually needs to be done via the Supabase UI or API, 
-- but we can insert the bucket record into storage.buckets if needed.
-- INSERT INTO storage.buckets (id, name, public) VALUES ('construction_documents', 'construction_documents', false);

-- 5. Storage Policies (Run these in SQL Editor)
-- CREATE POLICY "Construct Files Access" ON storage.objects FOR ALL TO authenticated 
-- USING (bucket_id = 'construction_documents');
