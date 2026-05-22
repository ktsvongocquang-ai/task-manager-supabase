import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const MOD3 = 'd22e3224-38ea-438d-a7d4-8371870173b6';

// IDs to delete
const DELETE_IDS = [
  'dfeac7ff-3567-45f7-a175-a061b33e9ea0', // 3.4 Bàn giao TK → Thi công
  '935f1eed-cd0a-4449-9b6a-6d95f1b67db3', // 3.8 Hồ sơ hoàn công
  '24e0b5af-a3d8-46f6-ac39-f38f7ae073e4', // 3.9 Xử lý phát sinh
];

async function run() {
  console.log('=== XÓA 3 WORKFLOW ===\n');

  for (const id of DELETE_IDS) {
    // Delete steps first
    await sb.from('training_workflow_steps').delete().eq('workflow_id', id);
    const { error } = await sb.from('training_workflows').delete().eq('id', id);
    if (error) console.error('❌', error.message);
    else console.log('✅ Deleted', id);
  }

  // Renumber remaining
  console.log('\nRenumbering...');
  const { data: remaining } = await sb
    .from('training_workflows')
    .select('id, number, title')
    .eq('module_id', MOD3)
    .order('sort_order');

  // First pass: temp numbers
  for (let i = 0; i < remaining.length; i++) {
    await sb.from('training_workflows').update({ number: `3.${i+1}-tmp` }).eq('id', remaining[i].id);
  }
  // Second pass: final numbers
  for (let i = 0; i < remaining.length; i++) {
    const num = `3.${i + 1}`;
    await sb.from('training_workflows').update({ number: num, sort_order: i + 1 }).eq('id', remaining[i].id);
    console.log(`  ${num} ${remaining[i].title}`);
  }

  console.log('\n✅ Done!');
}

run();
