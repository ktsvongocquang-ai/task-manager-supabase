import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkType() {
  const { data } = await sb.from('training_subsections').select('content_type').eq('id', 'b10170ff-dee5-4e95-802f-bf8123e5d40b').single();
  console.log('Content type:', data.content_type);
  if (data.content_type !== 'table') {
    await sb.from('training_subsections').update({ content_type: 'table' }).eq('id', 'b10170ff-dee5-4e95-802f-bf8123e5d40b');
    console.log('Updated content_type to table');
  }
}

checkType();
