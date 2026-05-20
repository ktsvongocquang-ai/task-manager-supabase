-- ============================================================
-- TRAINING HUB — DATABASE SCHEMA (v2)
-- Run this in Supabase SQL Editor
-- ============================================================

-- TABLE 1: training_modules
CREATE TABLE IF NOT EXISTS training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7),
  sort_order INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 2: training_sections (subsections within modules)
CREATE TABLE IF NOT EXISTS training_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  slug VARCHAR(100),
  number VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  content TEXT,
  sort_order INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(module_id, number)
);

-- TABLE 3: training_subsections (detailed content blocks)
CREATE TABLE IF NOT EXISTS training_subsections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES training_sections(id) ON DELETE CASCADE,
  slug VARCHAR(100),
  heading VARCHAR(255) NOT NULL,
  content TEXT,
  content_type VARCHAR(50) DEFAULT 'text', -- 'text', 'items', 'table', 'mistakes'
  metadata JSONB,
  sort_order INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 4: training_workflows (for Module 3)
CREATE TABLE IF NOT EXISTS training_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  slug VARCHAR(100),
  number VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  lead_quote TEXT,
  checklist JSONB,
  sort_order INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(module_id, number)
);

-- TABLE 5: training_workflow_steps
CREATE TABLE IF NOT EXISTS training_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES training_workflows(id) ON DELETE CASCADE,
  phase VARCHAR(255) NOT NULL,
  owner VARCHAR(255),
  actions JSONB,
  metadata JSONB,
  sort_order INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 6: training_resources (optional — for references, links, files)
CREATE TABLE IF NOT EXISTS training_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  section_id UUID REFERENCES training_sections(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50),
  url TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tsections_module ON training_sections(module_id);
CREATE INDEX IF NOT EXISTS idx_tsections_sort ON training_sections(sort_order);
CREATE INDEX IF NOT EXISTS idx_tsubsections_section ON training_subsections(section_id);
CREATE INDEX IF NOT EXISTS idx_tsubsections_sort ON training_subsections(sort_order);
CREATE INDEX IF NOT EXISTS idx_tworkflows_module ON training_workflows(module_id);
CREATE INDEX IF NOT EXISTS idx_tworkflows_sort ON training_workflows(sort_order);
CREATE INDEX IF NOT EXISTS idx_twf_steps_workflow ON training_workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_twf_steps_sort ON training_workflow_steps(sort_order);
CREATE INDEX IF NOT EXISTS idx_tresources_module ON training_resources(module_id);
CREATE INDEX IF NOT EXISTS idx_tresources_section ON training_resources(section_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_subsections ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_resources ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "public_read" ON training_modules FOR SELECT USING (true);
CREATE POLICY "public_read" ON training_sections FOR SELECT USING (true);
CREATE POLICY "public_read" ON training_subsections FOR SELECT USING (true);
CREATE POLICY "public_read" ON training_workflows FOR SELECT USING (true);
CREATE POLICY "public_read" ON training_workflow_steps FOR SELECT USING (true);
CREATE POLICY "public_read" ON training_resources FOR SELECT USING (true);

-- Authenticated write
CREATE POLICY "auth_write" ON training_modules FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_write" ON training_sections FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_write" ON training_subsections FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_write" ON training_workflows FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_write" ON training_workflow_steps FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_write" ON training_resources FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- DONE! Now run: node seed_training_hub.mjs
-- ============================================================
