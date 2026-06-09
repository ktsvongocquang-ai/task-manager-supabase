const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yiuokvszyaqqjksshybn.supabase.co';
const supabaseKey = 'sb_publishable_-MePkqVIFqX6lyS9Yw3uxQ_6FWzXem1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const annot = {
    id: `annot-test-${Date.now()}`,
    floorPlanId: 'global',
    type: 'pen',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    color: '#ff0000',
    createdAt: Date.now(),
    userName: 'Test User',
    content: ''
  };

  const { data, error } = await supabase.from('whiteboard_annotations').upsert(annot);
  console.log("Error:", error);
  console.log("Data:", data);
}

test();
