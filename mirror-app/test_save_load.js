import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yiuokvszyaqqjksshybn.supabase.co',
  'sb_publishable_-MePkqVIFqX6lyS9Yw3uxQ_6FWzXem1'
);

import { saveMarkerNote, getMarkerNotes } from './src/lib/db.ts';

async function test() {
  try {
    const testId = `test-marker-${Date.now()}`;
    const testMarker = {
      id: testId,
      floorPlanId: 'plan-1780813124414-416', // Existing floor plan id
      x: 50,
      y: 50,
      title: 'Test Persist',
      photoData: 'https://test-photo-url.com/img.jpg',
      audioData: 'https://test-audio-url.com/audio.mp3',
      transcription: 'Test transcription text',
      textNotes: 'Test text notes text',
      createdAt: Date.now(),
      tags: ['test']
    };

    console.log('Saving test marker...');
    await saveMarkerNote(testMarker);

    console.log('Retrieving markers...');
    const markers = await getMarkerNotes();
    const retrieved = markers.find(m => m.id === testId);

    console.log('Retrieved marker:', JSON.stringify(retrieved, null, 2));

    // Clean up
    console.log('Cleaning up...');
    await supabase.from('marker_notes').delete().eq('id', testId);
    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
