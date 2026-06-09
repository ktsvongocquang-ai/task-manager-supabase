import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yiuokvszyaqqjksshybn.supabase.co';
const supabaseKey = 'sb_publishable_-MePkqVIFqX6lyS9Yw3uxQ_6FWzXem1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const seed1 = {
    id: `plan-${Date.now()}-tiling`,
    name: `Sàn ốp lát`,
    imageData: "data:image/svg+xml;utf8,<svg></svg>",
    width: 1000,
    height: 700,
    projectId: 'proj-123',
    planType: 'tiling',
    isPinned: false,
    createdAt: Date.now()
  };
  console.log('Inserting seed1...');
  const { data, error } = await supabase.from('floor_plans').upsert(seed1);
  if (error) {
    console.error('Error inserting seed1:', error);
  } else {
    console.log('Success inserting seed1:', data);
  }
}

test();
