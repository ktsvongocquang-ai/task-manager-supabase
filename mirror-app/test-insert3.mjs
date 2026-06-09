import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yiuokvszyaqqjksshybn.supabase.co';
const supabaseKey = 'sb_publishable_-MePkqVIFqX6lyS9Yw3uxQ_6FWzXem1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const newPlan = {
    id: `plan-${Date.now()}`,
    name: 'Test Plan',
    createdAt: Date.now(),
    width: 800,
    height: 600
  };
  console.log('Inserting floor_plan with createdAt...');
  const { data, error } = await supabase.from('floor_plans').upsert(newPlan);
  if (error) {
    console.error('Error inserting floor_plan:', error);
  } else {
    console.log('Success inserting floor_plan:', data);
  }
}

test();
