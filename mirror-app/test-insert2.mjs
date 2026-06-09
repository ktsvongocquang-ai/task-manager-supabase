import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yiuokvszyaqqjksshybn.supabase.co';
const supabaseKey = 'sb_publishable_-MePkqVIFqX6lyS9Yw3uxQ_6FWzXem1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const seed1 = {
    id: `plan-${Date.now()}-tiling`,
    name: `Sàn ốp lát`,
    created_at: Date.now()
  };
  console.log('Inserting seed1...');
  const { data, error } = await supabase.from('floor_plans').upsert(seed1);
  console.log(error || 'Success');
}

test();
