-- ============================================================
-- TRAINING HUB — DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- TABLE 1: training_modules (6 modules)
CREATE TABLE IF NOT EXISTS training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_number INT UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7),
  order_index INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 2: sections (subsections within modules)
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  section_number VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  order_index INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(module_id, section_number)
);

-- TABLE 3: subsections (detailed content blocks)
CREATE TABLE IF NOT EXISTS subsections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  content_type VARCHAR(50) DEFAULT 'text', -- 'text', 'list', 'table', 'code', 'mistakes'
  metadata JSONB, -- flexible storage for tables, mistake pairs, etc.
  order_index INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 4: workflows (for Module 3)
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  workflow_number INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  owner VARCHAR(255),
  duration VARCHAR(50),
  lead_quote TEXT, -- The italic quote at the top of each workflow detail
  checklist JSONB, -- Array of checklist strings
  order_index INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(module_id, workflow_number)
);

-- TABLE 5: workflow_steps
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  phase VARCHAR(255) NOT NULL,
  owner VARCHAR(255),
  actions JSONB, -- Array of action strings
  order_index INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workflow_id, step_number)
);

-- TABLE 6: learning_resources (optional — for references, links, files)
CREATE TABLE IF NOT EXISTS learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50), -- 'pdf', 'video', 'link', 'image'
  url TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sections_module_id ON sections(module_id);
CREATE INDEX IF NOT EXISTS idx_sections_order ON sections(order_index);
CREATE INDEX IF NOT EXISTS idx_subsections_section_id ON subsections(section_id);
CREATE INDEX IF NOT EXISTS idx_subsections_order ON subsections(order_index);
CREATE INDEX IF NOT EXISTS idx_workflows_module_id ON workflows(module_id);
CREATE INDEX IF NOT EXISTS idx_workflows_order ON workflows(order_index);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_order ON workflow_steps(order_index);
CREATE INDEX IF NOT EXISTS idx_learning_resources_module ON learning_resources(module_id);
CREATE INDEX IF NOT EXISTS idx_learning_resources_section ON learning_resources(section_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsections ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;

-- Public read for all tables
CREATE POLICY "public_read_modules" ON training_modules
  FOR SELECT USING (true);

CREATE POLICY "public_read_sections" ON sections
  FOR SELECT USING (true);

CREATE POLICY "public_read_subsections" ON subsections
  FOR SELECT USING (true);

CREATE POLICY "public_read_workflows" ON workflows
  FOR SELECT USING (true);

CREATE POLICY "public_read_workflow_steps" ON workflow_steps
  FOR SELECT USING (true);

CREATE POLICY "public_read_resources" ON learning_resources
  FOR SELECT USING (true);

-- Authenticated write (insert/update/delete) for all tables
CREATE POLICY "auth_write_modules" ON training_modules
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_write_sections" ON sections
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_write_subsections" ON subsections
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_write_workflows" ON workflows
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_write_workflow_steps" ON workflow_steps
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_write_resources" ON learning_resources
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- DONE! Now run seed_training_hub.mjs to populate data.
-- ============================================================
