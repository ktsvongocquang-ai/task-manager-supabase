import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkSteps() {
  const { data: workflows } = await sb.from('training_workflows').select('id, number, title').in('number', ['3.4', '3.6']);
  if (!workflows) return;

  for (const wf of workflows) {
    console.log(`\n=== ${wf.number} ${wf.title} ===`);
    const { data: steps } = await sb.from('training_workflow_steps').select('id, name, phase, actions').eq('workflow_id', wf.id).order('sort_order');
    console.log(JSON.stringify(steps, null, 2));
  }
}
checkSteps();
