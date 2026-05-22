import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const MOD3 = 'd22e3224-38ea-438d-a7d4-8371870173b6'; // Quy trình vận hành
const MOD4 = 'edc49c2c-051f-4edb-a316-3fda41505299'; // Kỹ thuật & Kỹ năng mềm

async function restructure() {
  console.log('=== BẮT ĐẦU TÁI CẤU TRÚC ===\n');

  // ──────────────────────────────────────────────────────────
  // 1. Thêm "Kỹ năng giao tiếp & Trình bày" vào Quy trình vận hành
  //    → Tạo workflow 3.8 "Kỹ năng giao tiếp & Thuyết trình"
  // ──────────────────────────────────────────────────────────
  console.log('1. Di chuyển "Kỹ năng giao tiếp & Trình bày" → Quy trình vận hành...');
  
  // First get subsections of 4.4 to copy content
  const { data: s44Subs } = await sb
    .from('training_subsections')
    .select('*')
    .eq('section_id', 'e9706541-8309-4def-b619-39a3b6da09cc')
    .order('sort_order');
  
  console.log(`   Tìm thấy ${s44Subs?.length || 0} subsections trong 4.4`);

  // Shift existing 3.7 Xử lý phát sinh → 3.9
  // First use temp numbers to avoid unique constraint
  await sb.from('training_workflows').update({ number: '3.9-temp' }).eq('id', '24e0b5af-a3d8-46f6-ac39-f38f7ae073e4');
  await sb.from('training_workflows').update({ number: '3.9', sort_order: 9 }).eq('id', '24e0b5af-a3d8-46f6-ac39-f38f7ae073e4');
  console.log('   Shifted 3.7 Xử lý phát sinh → 3.9');

  // Insert new workflow 3.8 for presentation skills (near 3.1 Gặp khách)
  const { data: newWf, error: wfErr } = await sb.from('training_workflows').insert({
    module_id: MOD3,
    slug: 'presentation-skills',
    number: '3.8',
    title: 'Kỹ năng giao tiếp & Thuyết trình',
    description: 'Kỹ năng trình bày, giao tiếp KH, phối hợp nội bộ',
    icon: 'Megaphone',
    lead_quote: 'Thiết kế giỏi mà trình bày kém = mất khách. Giao tiếp tốt = chốt deal nhanh.',
    checklist: null,
    sort_order: 8
  }).select().single();

  if (wfErr) {
    console.error('   ❌ Lỗi tạo workflow 3.8:', wfErr.message);
  } else {
    console.log('   ✅ Tạo workflow 3.8:', newWf.title);

    // Copy subsections as workflow steps
    if (s44Subs && s44Subs.length > 0) {
      for (let i = 0; i < s44Subs.length; i++) {
        const sub = s44Subs[i];
        // Convert subsection to workflow step
        const actions = [];
        if (sub.content) actions.push(sub.content);
        if (sub.metadata?.items) {
          for (const item of sub.metadata.items) {
            if (item.title) actions.push(item.title + (item.body ? ': ' + item.body : ''));
          }
        }
        
        await sb.from('training_workflow_steps').insert({
          workflow_id: newWf.id,
          phase: sub.heading,
          owner: null,
          actions: actions.length > 0 ? actions : [sub.heading],
          sort_order: i + 1
        });
      }
      console.log(`   ✅ Copied ${s44Subs.length} subsections → workflow steps`);
    }
  }

  // Delete section 4.4 from module 4
  await sb.from('training_subsections').delete().eq('section_id', 'e9706541-8309-4def-b619-39a3b6da09cc');
  await sb.from('training_sections').delete().eq('id', 'e9706541-8309-4def-b619-39a3b6da09cc');
  console.log('   ✅ Deleted section 4.4 from module 4\n');

  // ──────────────────────────────────────────────────────────
  // 2. Thêm "Hồ sơ hoàn công" vào Quy trình vận hành
  //    → Tạo workflow 3.10 "Hồ sơ hoàn công"
  // ──────────────────────────────────────────────────────────
  console.log('2. Di chuyển "Hồ sơ hoàn công" → Quy trình vận hành...');
  
  const { data: s43Subs } = await sb
    .from('training_subsections')
    .select('*')
    .eq('section_id', '52c70486-6001-49b4-a793-68113efa2655')
    .order('sort_order');

  console.log(`   Tìm thấy ${s43Subs?.length || 0} subsections trong 4.3`);

  // Shift 3.9 → 3.10
  await sb.from('training_workflows').update({ number: '3.10-temp' }).eq('id', '24e0b5af-a3d8-46f6-ac39-f38f7ae073e4');
  await sb.from('training_workflows').update({ number: '3.10', sort_order: 10 }).eq('id', '24e0b5af-a3d8-46f6-ac39-f38f7ae073e4');
  console.log('   Shifted 3.9 Xử lý phát sinh → 3.10');

  const { data: hcWf, error: hcErr } = await sb.from('training_workflows').insert({
    module_id: MOD3,
    slug: 'as-built-docs',
    number: '3.9',
    title: 'Hồ sơ hoàn công',
    description: 'Quy trình lập & bàn giao hồ sơ hoàn công',
    icon: 'ClipboardList',
    lead_quote: 'Hoàn công đầy đủ = bảo vệ công ty + tạo niềm tin với khách hàng.',
    checklist: null,
    sort_order: 9
  }).select().single();

  if (hcErr) {
    console.error('   ❌ Lỗi tạo workflow 3.9:', hcErr.message);
  } else {
    console.log('   ✅ Tạo workflow 3.9:', hcWf.title);
    
    if (s43Subs && s43Subs.length > 0) {
      for (let i = 0; i < s43Subs.length; i++) {
        const sub = s43Subs[i];
        const actions = [];
        if (sub.content) actions.push(sub.content);
        if (sub.metadata?.items) {
          for (const item of sub.metadata.items) {
            if (item.title) actions.push(item.title + (item.body ? ': ' + item.body : ''));
          }
        }
        if (sub.metadata?.rows) {
          for (const row of sub.metadata.rows) {
            actions.push(Object.values(row).join(' — '));
          }
        }
        
        await sb.from('training_workflow_steps').insert({
          workflow_id: hcWf.id,
          phase: sub.heading,
          owner: null,
          actions: actions.length > 0 ? actions : [sub.heading],
          sort_order: i + 1
        });
      }
      console.log(`   ✅ Copied ${s43Subs.length} subsections → workflow steps`);
    }
  }

  // Delete section 4.3
  await sb.from('training_subsections').delete().eq('section_id', '52c70486-6001-49b4-a793-68113efa2655');
  await sb.from('training_sections').delete().eq('id', '52c70486-6001-49b4-a793-68113efa2655');
  console.log('   ✅ Deleted section 4.3 from module 4\n');

  // ──────────────────────────────────────────────────────────
  // 3. Gộp 4.1 "Hệ thống kỹ thuật ngầm" + 4.2 "Quy trình thi công 11 bước"
  //    → thành 1 section "Hệ thống kỹ thuật ngầm & Thi công"
  // ──────────────────────────────────────────────────────────
  console.log('3. Gộp 4.1 + 4.2 → "Kỹ thuật ngầm & Quy trình thi công"...');
  
  // Rename 4.1 to cover both
  await sb.from('training_sections').update({
    title: 'Kỹ thuật ngầm & Quy trình thi công',
    number: '4.1',
    description: 'Hệ thống kỹ thuật ngầm + Quy trình thi công 11 bước'
  }).eq('id', '52016cf4-7681-4f47-9e67-1b8a0f8a9f56');
  console.log('   ✅ Renamed 4.1 → "Kỹ thuật ngầm & Quy trình thi công"');

  // Move subsections from 4.2 → 4.1
  const { data: s42Subs } = await sb
    .from('training_subsections')
    .select('*')
    .eq('section_id', '8771c850-904a-4ebc-9766-761c0243c799')
    .order('sort_order');
  
  // Get max sort_order from 4.1
  const { data: s41Subs } = await sb
    .from('training_subsections')
    .select('sort_order')
    .eq('section_id', '52016cf4-7681-4f47-9e67-1b8a0f8a9f56')
    .order('sort_order', { ascending: false })
    .limit(1);
  
  const maxSort = s41Subs?.[0]?.sort_order || 0;

  if (s42Subs && s42Subs.length > 0) {
    for (let i = 0; i < s42Subs.length; i++) {
      await sb.from('training_subsections')
        .update({ section_id: '52016cf4-7681-4f47-9e67-1b8a0f8a9f56', sort_order: maxSort + i + 1 })
        .eq('id', s42Subs[i].id);
    }
    console.log(`   ✅ Moved ${s42Subs.length} subsections from 4.2 → 4.1`);
  }

  // Delete empty section 4.2
  await sb.from('training_sections').delete().eq('id', '8771c850-904a-4ebc-9766-761c0243c799');
  console.log('   ✅ Deleted empty section 4.2\n');

  // ──────────────────────────────────────────────────────────
  // 4. Renumber remaining sections in module 4
  // ──────────────────────────────────────────────────────────
  console.log('4. Đánh số lại module 4...');
  const { data: remainingSections } = await sb
    .from('training_sections')
    .select('id, number, title')
    .eq('module_id', MOD4)
    .order('sort_order');

  if (remainingSections) {
    for (let i = 0; i < remainingSections.length; i++) {
      const newNum = `4.${i + 1}`;
      if (remainingSections[i].number !== newNum) {
        // Use temp to avoid unique constraint
        await sb.from('training_sections').update({ number: newNum + '-temp' }).eq('id', remainingSections[i].id);
      }
    }
    for (let i = 0; i < remainingSections.length; i++) {
      const newNum = `4.${i + 1}`;
      await sb.from('training_sections').update({ number: newNum, sort_order: i + 1 }).eq('id', remainingSections[i].id);
      console.log(`   ${remainingSections[i].number} "${remainingSections[i].title}" → ${newNum}`);
    }
  }

  console.log('\n=== HOÀN THÀNH TÁI CẤU TRÚC ===');
  
  // Print final state
  const { data: finalWf } = await sb.from('training_workflows').select('number, title').eq('module_id', MOD3).order('sort_order');
  const { data: finalSec } = await sb.from('training_sections').select('number, title').eq('module_id', MOD4).order('sort_order');
  
  console.log('\n📋 Module 3 — Quy trình vận hành:');
  finalWf?.forEach(w => console.log(`   ${w.number} ${w.title}`));
  
  console.log('\n📋 Module 4 — Kỹ thuật & Kỹ năng mềm:');
  finalSec?.forEach(s => console.log(`   ${s.number} ${s.title}`));
}

restructure();
