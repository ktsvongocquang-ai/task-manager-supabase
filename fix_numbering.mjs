import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

// Fix: renumber workflows 3.7→3.10 to be contiguous
const fixes = [
  // current → target
  { id: '08bb2d7a-9372-4c9d-9ac3-8089f5ad7bfd', number: '3.7', sort_order: 7 },  // Kỹ năng giao tiếp
  { id: '935f1eed-cd0a-4449-9b6a-6d95f1b67db3', number: '3.8', sort_order: 8 },  // Hồ sơ hoàn công
  { id: '24e0b5af-a3d8-46f6-ac39-f38f7ae073e4', number: '3.9', sort_order: 9 },  // Xử lý phát sinh
];

async function fix() {
  // First set all to temp to avoid unique constraint
  for (const f of fixes) {
    await sb.from('training_workflows').update({ number: f.number + '-temp' }).eq('id', f.id);
  }
  // Then set final values
  for (const f of fixes) {
    await sb.from('training_workflows').update({ number: f.number, sort_order: f.sort_order }).eq('id', f.id);
    console.log(`✅ ${f.number}`);
  }
  
  // Verify
  const { data } = await sb.from('training_workflows').select('number, title').eq('module_id', 'd22e3224-38ea-438d-a7d4-8371870173b6').order('sort_order');
  console.log('\nFinal:');
  data.forEach(w => console.log(`  ${w.number} ${w.title}`));
}

fix();
