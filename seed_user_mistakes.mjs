import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function seedUserMistakes() {
  console.log('=== SEEDING 120 USER MISTAKES (2.5) ===');

  const rawData = fs.readFileSync('user_mistakes.json', 'utf8');
  const items = JSON.parse(rawData);

  // Group by group_id
  const groupsMap = new Map();
  for (const item of items) {
    if (!groupsMap.has(item.group_id)) {
      groupsMap.set(item.group_id, {
        group_id: item.group_id,
        heading: `${item.group_id}. ${item.group}`,
        mistakes: []
      });
    }
    groupsMap.get(item.group_id).mistakes.push({
      wrong: item.wrong,
      right: item.right
    });
  }

  const { data: mod } = await sb.from('training_modules').select('id').eq('slug', 'design-knowledge').single();
  if (!mod) {
    console.log('Module 2 not found');
    return;
  }

  const { data: section } = await sb.from('training_sections')
    .select('id')
    .eq('module_id', mod.id)
    .eq('number', '2.5')
    .single();

  if (!section) {
    console.log('Section 2.5 not found');
    return;
  }

  // Xóa các subsection cũ (để tránh bị trùng lặp)
  await sb.from('training_subsections').delete().eq('section_id', section.id);

  // Chèn 12 block (12 group_id)
  let order = 1;
  const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => a.group_id - b.group_id);
  
  for (const group of sortedGroups) {
    await sb.from('training_subsections').insert({
      section_id: section.id,
      heading: group.heading,
      content_type: 'mistakes',
      metadata: { mistakes: group.mistakes },
      sort_order: order
    });
    console.log(`Inserted block ${order}: ${group.heading} (${group.mistakes.length} mistakes)`);
    order++;
  }

  console.log('✅ Đã cập nhật xong KHO TÀNG 120 LỖI THƯỜNG GẶP TỪ USER!');
}

seedUserMistakes();
