import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yiuokvszyaqqjksshybn.supabase.co';
const supabaseKey = 'sb_publishable_-MePkqVIFqX6lyS9Yw3uxQ_6FWzXem1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  console.log('Testing storage upload...');
  
  // Create a dummy 1MB file
  const buffer = Buffer.alloc(1024 * 1024, 'a');
  
  const fileName = `test-upload-${Date.now()}.txt`;
  
  const { data, error } = await supabase.storage.from('blueprints').upload(fileName, buffer, {
    contentType: 'text/plain',
    upsert: false
  });
  
  if (error) {
    console.error('Upload failed:', error);
  } else {
    console.log('Upload succeeded:', data);
  }
}

testUpload();
