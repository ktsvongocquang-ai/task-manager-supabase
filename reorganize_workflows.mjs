import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function reorganizeWorkflows() {
  console.log('=== TỔ CHỨC LẠI QUY TRÌNH (WORKFLOWS) ===\n');

  const { data: mod } = await sb.from('training_modules').select('id').eq('slug', 'workflow').single();
  if (!mod) {
    console.log('❌ Không tìm thấy module Workflow');
    return;
  }
  const modId = mod.id;

  // 1. Lấy tất cả workflows hiện tại
  const { data: workflows } = await sb.from('training_workflows')
    .select('*')
    .eq('module_id', modId)
    .order('sort_order');
  
  if (!workflows) return;

  // 2. Xóa 3.7 và 3.9
  const toDelete = workflows.filter(w => w.number === '3.7' || w.number === '3.9');
  for (const w of toDelete) {
    // Delete steps first if any exist
    await sb.from('training_workflow_steps').delete().eq('workflow_id', w.id);
    await sb.from('training_workflows').delete().eq('id', w.id);
    console.log(`✅ Đã xóa: ${w.number} ${w.title}`);
  }

  // 3. Gộp 3.4 và 3.6
  const wf3_4 = workflows.find(w => w.number === '3.4');
  const wf3_6 = workflows.find(w => w.number === '3.6');

  if (wf3_4 && wf3_6) {
    // Cập nhật wf3_4 thành mục gộp
    const newTitle = 'Quy chuẩn đặt tên & Lưu trữ file';
    const newLeadQuote = 'Một cấu trúc chuẩn, một cách đặt tên duy nhất — giúp team tiết kiệm 30 phút tìm kiếm mỗi ngày.';
    
    await sb.from('training_workflows')
      .update({ title: newTitle, lead_quote: newLeadQuote })
      .eq('id', wf3_4.id);
    
    // Xóa wf3_6
    await sb.from('training_workflow_steps').delete().eq('workflow_id', wf3_6.id);
    await sb.from('training_workflows').delete().eq('id', wf3_6.id);
    console.log(`✅ Đã gộp 3.4 và 3.6 thành: ${newTitle}`);
  }

  // 4. Đánh số lại thứ tự (Renumber)
  // Các mục còn lại: 3.1, 3.2, 3.3, 3.4(merged), 3.5, 3.8
  const { data: remaining } = await sb.from('training_workflows')
    .select('*')
    .eq('module_id', modId)
    .order('sort_order');
    
  if (remaining) {
    console.log('\n=== ĐÁNH SỐ LẠI ===');
    let index = 1;
    for (const w of remaining) {
      const newNumber = `3.${index}`;
      await sb.from('training_workflows')
        .update({ number: newNumber, sort_order: index })
        .eq('id', w.id);
      console.log(`  ${newNumber} - ${w.title}`);
      index++;
    }
  }

  console.log('\n✅ Hoàn tất tổ chức lại Quy trình!');
}

reorganizeWorkflows();
