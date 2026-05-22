import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function merge() {
  console.log('=== GỘP SECTIONS 4.4–4.8 → 1 SECTION DUY NHẤT ===\n');

  // 1. Get module "tools-templates"
  const { data: mod } = await sb.from('training_modules').select('id').eq('slug', 'tools-templates').single();
  if (!mod) { console.log('❌ Module tools-templates not found'); return; }
  console.log(`✓ Module: ${mod.id}`);

  // 2. Get all sections 4.4–4.8
  const sectionsToMerge = ['4.4', '4.5', '4.6', '4.7', '4.8'];
  const { data: sections } = await sb.from('training_sections')
    .select('id, number, title')
    .eq('module_id', mod.id)
    .in('number', sectionsToMerge)
    .order('number');

  if (!sections || sections.length === 0) {
    console.log('❌ Không tìm thấy sections 4.4–4.8');
    return;
  }

  console.log('\n--- Sections sẽ gộp ---');
  for (const s of sections) {
    console.log(`  ${s.number} — ${s.title} (${s.id})`);
  }

  // 3. Section 4.4 sẽ là section chính (giữ lại)
  const mainSection = sections.find(s => s.number === '4.4');
  const otherSections = sections.filter(s => s.number !== '4.4');

  if (!mainSection) {
    console.log('❌ Section 4.4 not found');
    return;
  }

  // 4. Rename section 4.4 to merged title
  const mergedTitle = 'Kỹ năng giao tiếp & Trình bày';
  const mergedDesc = 'Giao tiếp khách hàng · Thuyết trình concept · Ngôn ngữ Quiet Luxury · Xử lý phản hồi & Đàm phán · Viết email & Báo cáo';
  await sb.from('training_sections').update({
    title: mergedTitle,
    description: mergedDesc,
    content: 'Tổng hợp kỹ năng mềm cốt lõi cho team DQH — từ giao tiếp, thuyết trình, ngôn ngữ Quiet Luxury đến xử lý phản hồi và viết email chuyên nghiệp.'
  }).eq('id', mainSection.id);
  console.log(`\n✓ Đổi tên 4.4 → "${mergedTitle}"`);

  // 5. Get max sort_order in main section's subsections
  const { data: mainSubs } = await sb.from('training_subsections')
    .select('id, sort_order')
    .eq('section_id', mainSection.id)
    .order('sort_order', { ascending: false })
    .limit(1);
  let nextOrder = (mainSubs?.[0]?.sort_order || 0) + 1;

  // 6. Move subsections from 4.5–4.8 into 4.4
  console.log('\n--- Di chuyển subsections ---');
  for (const sec of otherSections) {
    // Get all subsections of this section
    const { data: subs } = await sb.from('training_subsections')
      .select('id, heading, sort_order')
      .eq('section_id', sec.id)
      .order('sort_order');

    if (subs && subs.length > 0) {
      // Add a divider heading subsection to separate content from different sections
      await sb.from('training_subsections').insert({
        section_id: mainSection.id,
        heading: `── ${sec.title} ──`,
        content_type: 'divider',
        metadata: { original_section: sec.number, original_title: sec.title },
        sort_order: nextOrder++
      });

      // Move each subsection
      for (const sub of subs) {
        await sb.from('training_subsections').update({
          section_id: mainSection.id,
          sort_order: nextOrder++
        }).eq('id', sub.id);
        console.log(`  ✓ [${sec.number}] ${sub.heading} → 4.4 (order: ${nextOrder - 1})`);
      }
    } else {
      console.log(`  ⚠ ${sec.number} — không có subsections`);
    }
  }

  // 7. Delete empty sections 4.5–4.8
  console.log('\n--- Xóa sections rỗng ---');
  for (const sec of otherSections) {
    const { error } = await sb.from('training_sections').delete().eq('id', sec.id);
    if (error) console.log(`  ❌ Xóa ${sec.number}: ${error.message}`);
    else console.log(`  ✓ Xóa ${sec.number} (${sec.title})`);
  }

  // 8. Renumber remaining sections: 4.9→4.5, 4.10→4.6, 4.11→4.7, etc.
  console.log('\n--- Đánh số lại ---');
  const { data: remaining } = await sb.from('training_sections')
    .select('id, number, title, sort_order')
    .eq('module_id', mod.id)
    .order('sort_order');

  let newNum = 1;
  for (const sec of remaining) {
    const newNumber = `4.${newNum}`;
    if (sec.number !== newNumber) {
      await sb.from('training_sections').update({
        number: newNumber,
        sort_order: newNum
      }).eq('id', sec.id);
      console.log(`  ✓ ${sec.number} → ${newNumber} (${sec.title})`);
    } else {
      console.log(`  · ${sec.number} (${sec.title}) — giữ nguyên`);
    }
    newNum++;
  }

  // 9. Summary
  const { data: finalSections } = await sb.from('training_sections')
    .select('number, title')
    .eq('module_id', mod.id)
    .order('sort_order');

  console.log('\n=== KẾT QUẢ SAU GỘP ===');
  for (const s of finalSections) {
    console.log(`  ${s.number} — ${s.title}`);
  }

  const { count } = await sb.from('training_subsections')
    .select('id', { count: 'exact', head: true })
    .eq('section_id', mainSection.id);
  console.log(`\n✅ Hoàn tất! Section 4.4 giờ có ${count} subsections.`);
}

merge();
