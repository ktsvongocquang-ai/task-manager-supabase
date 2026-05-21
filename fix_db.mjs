import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function fixDB() {
  const { data: sec } = await sb.from('training_sections').select('id').eq('number', '2.3').single();
  if (sec) {
    const { data: subs } = await sb.from('training_subsections').select('*').eq('section_id', sec.id);
    if (subs && subs.length > 0) {
      await sb.from('training_subsections').update({ content_type: 'table' }).eq('id', subs[0].id);
      console.log("Fixed content_type to 'table'");
    }
  }
}
fixDB();
