import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yiuokvszyaqqjksshybn.supabase.co';
const supabaseKey = 'sb_publishable_-MePkqVIFqX6lyS9Yw3uxQ_6FWzXem1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('projects').select('*').limit(1);
  if (error) {
    console.error('Error fetching projects:', error);
  } else {
    console.log('Success fetching projects:', data);
  }
}

test();
