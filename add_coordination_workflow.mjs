import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function addCoordinationWorkflow() {
  console.log('=== THÊM QUY TRÌNH PHỐI HỢP ===');

  // Find module 3 (workflow)
  const { data: mod3, error: modErr } = await sb
    .from('training_modules')
    .select('id')
    .eq('slug', 'workflow')
    .single();

  if (modErr || !mod3) {
    console.error('Module workflow not found', modErr);
    return;
  }

  // Fetch all workflows in module 3 ordered by sort_order
  const { data: workflows, error: wfErr } = await sb
    .from('training_workflows')
    .select('*')
    .eq('module_id', mod3.id)
    .order('sort_order', { ascending: true });

  if (wfErr) {
    console.error('Error fetching workflows', wfErr);
    return;
  }

  // The new workflow will be at index 2 (sort_order = 3, number = 3.3)
  // Shift everything from index 2 onwards, going BACKWARDS to avoid unique constraint
  for (let i = workflows.length - 1; i >= 2; i--) {
    const wf = workflows[i];
    const newSortOrder = wf.sort_order + 1;
    const newNumber = `3.${i + 2}`; // e.g., index 5 (was 3.6) becomes 3.7
    console.log(`Shifting ${wf.title} from ${wf.number} (sort_order ${wf.sort_order}) to ${newNumber} (sort_order ${newSortOrder})`);
    
    await sb.from('training_workflows')
      .update({ sort_order: newSortOrder, number: newNumber })
      .eq('id', wf.id);
  }

  // Insert the new workflow
  const { data: newWf, error: insertErr } = await sb
    .from('training_workflows')
    .insert({
      module_id: mod3.id,
      slug: 'coordination-process',
      number: '3.3',
      title: 'Phối hợp phòng ban',
      description: 'Quy trình phối hợp Thiết kế, 2D, Thi công, Xưởng',
      icon: 'Network', // Or something else
      lead_quote: 'Làm việc chéo phòng ban hiệu quả = giảm 80% rớt thông tin và làm lại.',
      checklist: null,
      sort_order: 3
    })
    .select()
    .single();

  if (insertErr) {
    console.error('Error inserting new workflow', insertErr);
    return;
  }

  console.log('✅ Added new workflow:', newWf);
}

addCoordinationWorkflow();
