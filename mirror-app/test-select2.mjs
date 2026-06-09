import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yiuokvszyaqqjksshybn.supabase.co';
const supabaseKey = 'sb_publishable_-MePkqVIFqX6lyS9Yw3uxQ_6FWzXem1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Selecting floor_plans...');
  const { data, error } = await supabase.from('floor_plans').select('*').limit(1);
  if (error) {
    console.error('Error selecting floor_plans:', error);
  } else {
    console.log('Floor plans:', data);
  }
}

test();
