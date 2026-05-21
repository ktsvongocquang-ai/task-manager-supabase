import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkWorkflows() {
  const { data: mods } = await sb.from('training_modules').select('id').eq('slug', 'workflow').single();
  if (!mods) return;
  
  const { data: workflows } = await sb.from('training_workflows').select('id, number, title, sort_order').eq('module_id', mods.id).order('sort_order');
  console.log(workflows);
}
checkWorkflows();
