import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function fixWorkflows() {
  const updates = [
    { id: "24e0b5af-a3d8-46f6-ac39-f38f7ae073e4", number: "3.7", title: "Xử lý phát sinh", sort_order: 7 }, // Was 3.6, now 3.7
    { id: "f77dd851-f724-43fb-883a-6e163d4c3ab0", number: "3.6", title: "Quản lý thư viện", sort_order: 6 }, // Was 3.5, now 3.6
    { id: "5e40b602-1361-4725-ad1a-5991f753d07d", number: "3.5", title: "Quy chuẩn đặt tên & Lưu trữ file", sort_order: 5 }, // Was 3.4, now 3.5
    { id: "dfeac7ff-3567-45f7-a175-a061b33e9ea0", number: "3.4", title: "Bàn giao TK → Thi công", sort_order: 4 }, // Was 3.3, now 3.4
  ];

  for (const up of updates) {
    // To avoid constraints, let's first set their numbers to a temporary value (like 3.x-temp)
    await sb.from('training_workflows').update({ number: up.number + '-temp' }).eq('id', up.id);
  }

  for (const up of updates) {
    // Now set them to their real new values
    await sb.from('training_workflows').update({ number: up.number, sort_order: up.sort_order }).eq('id', up.id);
    console.log(`Fixed ${up.title} -> ${up.number}`);
  }

  // Insert the new workflow at 3.3
  const { data: newWf, error: insertErr } = await sb
    .from('training_workflows')
    .insert({
      module_id: 'd22e3224-38ea-438d-a7d4-8371870173b6',
      slug: 'coordination-process',
      number: '3.3',
      title: 'Phối hợp phòng ban',
      description: 'Quy trình phối hợp Thiết kế, 2D, Thi công, Xưởng',
      icon: 'Network', // Or something else
      lead_quote: 'Quy trình chặt chẽ giữa các phòng ban giúp giảm 80% rớt thông tin và làm lại.',
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

fixWorkflows();
