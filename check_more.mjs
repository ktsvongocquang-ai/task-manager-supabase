import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkMore() {
  const { data: workflows } = await sb.from('training_workflows').select('*').in('number', ['3.4', '3.6']);
  if (!workflows) return;
  console.log(JSON.stringify(workflows, null, 2));
}
checkMore();
