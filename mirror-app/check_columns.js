import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yiuokvszyaqqjksshybn.supabase.co',
  'sb_publishable_-MePkqVIFqX6lyS9Yw3uxQ_6FWzXem1'
);

async function run() {
  try {
    const { data: markers, error } = await supabase.from('marker_notes').select('*');
    if (error) throw error;
    
    console.log(`Found ${markers.length} marker notes in database.`);
    const populated = markers.filter(m => m.images || m.description || m.author || m.assigned_to);
    console.log(`Found ${populated.length} markers with extra fields populated.`);
    if (populated.length > 0) {
      console.log('Sample populated marker:', JSON.stringify(populated[0], null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
