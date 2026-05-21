import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkSub() {
  const { data: sec } = await sb.from('training_sections').select('id').eq('number', '2.3').single();
  if (sec) {
    const { data: subs } = await sb.from('training_subsections').select('*').eq('section_id', sec.id);
    console.log(JSON.stringify(subs, null, 2));
  } else {
    console.log("Section 2.3 not found");
  }
}
checkSub();
