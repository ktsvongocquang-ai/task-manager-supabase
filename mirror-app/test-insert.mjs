import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yiuokvszyaqqjksshybn.supabase.co';
const supabaseKey = 'sb_publishable_-MePkqVIFqX6lyS9Yw3uxQ_6FWzXem1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.rpc('check_rls'); // We can't do this easily without a custom RPC or using the secret key.
  
  // Let's just try to insert. If it throws RLS error, RLS is enabled.
  console.log('Inserting...');
  const newProj = {
    id: `proj-${Date.now()}`,
    name: 'Test Project',
    created_at: Date.now()
  };
  const res = await supabase.from('projects').upsert(newProj);
  console.log(res);
}

test();
