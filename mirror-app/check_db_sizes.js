import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yiuokvszyaqqjksshybn.supabase.co',
  'sb_publishable_-MePkqVIFqX6lyS9Yw3uxQ_6FWzXem1'
);

async function run() {
  try {
    console.log('--- DB ANALYSIS ---');

    // 1. Projects
    const { data: projects, error: pErr } = await supabase.from('projects').select('id, name');
    if (pErr) throw pErr;
    console.log(`Projects: ${projects.length}`);

    // 2. Floor Plans
    const { data: plans, error: fErr } = await supabase.from('floor_plans').select('id, name, image_data');
    if (fErr) throw fErr;
    console.log(`Floor plans: ${plans.length}`);

    let base64PlanCount = 0;
    let urlPlanCount = 0;
    plans.forEach(fp => {
      const img = fp.image_data || '';
      if (img.startsWith('data:image')) {
        base64PlanCount++;
      } else if (img.startsWith('http')) {
        urlPlanCount++;
      }
    });
    console.log(`  - Floor plans using Base64: ${base64PlanCount}`);
    console.log(`  - Floor plans using URLs: ${urlPlanCount}`);

    // 3. Marker Notes
    const { data: markers, error: mErr } = await supabase.from('marker_notes').select('id, title, photo_data, audio_data');
    if (mErr) throw mErr;
    console.log(`Marker notes: ${markers.length}`);

    let base64PhotoCount = 0;
    let urlPhotoCount = 0;
    let audioCount = 0;
    let largePhotoSizeTotal = 0;

    markers.forEach(m => {
      const photo = m.photo_data || '';
      const audio = m.audio_data || '';
      if (photo.startsWith('data:image')) {
        base64PhotoCount++;
        largePhotoSizeTotal += photo.length;
      } else if (photo.startsWith('http')) {
        urlPhotoCount++;
      }
      if (audio) {
        audioCount++;
      }
    });
    console.log(`  - Markers with Base64 photos: ${base64PhotoCount} (Total size: ${(largePhotoSizeTotal / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`  - Markers with URL photos: ${urlPhotoCount}`);
    console.log(`  - Markers with audio data: ${audioCount}`);

  } catch (err) {
    console.error('Error analyzing DB:', err);
  }
}

run();
