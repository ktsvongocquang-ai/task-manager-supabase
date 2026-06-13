import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testAll() {
  console.log("1. Testing projects...");
  const newProj = {
    id: `test-proj-${Date.now()}`,
    name: 'Test Project',
    client: 'Test Client',
    leader: 'Tester',
    address: 'Local',
    status: 'active',
    progress: 50,
    created_at: Date.now()
  };
  const { error: e1 } = await supabase.from('projects').upsert(newProj);
  if (e1) {
    console.error("FAIL in projects:", e1);
    process.exit(1);
  } else {
    console.log("OK projects");
  }

  console.log("2. Testing floor_plans...");
  const seed1 = {
      id: `${newProj.id}-tiling`,
      name: `Sàn ốp lát`,
      width: 1000,
      height: 700,
      project_id: newProj.id,
      plan_type: 'tiling',
      created_at: Date.now(),
      canvas_x: 0,
      canvas_y: 0,
      canvas_scale: null,
      is_pinned: true,
      document_group_id: null,
      page_index: null,
      page_count: null,
      pdf_data: null
  };
  const { error: e2 } = await supabase.from('floor_plans').upsert(seed1);
  if (e2) {
    console.error("FAIL in floor_plans:", e2);
    process.exit(1);
  } else {
    console.log("OK floor_plans");
  }

  console.log("Cleaning up...");
  await supabase.from('floor_plans').delete().eq('project_id', newProj.id);
  await supabase.from('projects').delete().eq('id', newProj.id);
  console.log("ALL SUCCESS!");
  process.exit(0);
}

testAll();
