import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function updateFolderStructure() {
  console.log('=== CẬP NHẬT CẤU TRÚC THƯ MỤC ===');

  // Find the workflow for file-naming
  const { data: workflow, error: wfError } = await sb
    .from('training_workflows')
    .select('id')
    .eq('slug', 'file-naming')
    .single();

  if (wfError || !workflow) {
    console.error('Workflow file-naming not found', wfError);
    return;
  }

  console.log(`Found workflow: ${workflow.id}`);

  // Find the folder structure step
  const { data: steps, error: stepError } = await sb
    .from('training_workflow_steps')
    .select('*')
    .eq('workflow_id', workflow.id);

  if (stepError) {
    console.error('Error fetching steps', stepError);
    return;
  }

  const folderStep = steps.find(s => s.phase.includes('Folder') || s.actions.some(a => a.includes('01_BRIEF')));
  
  if (!folderStep) {
    console.log('Folder step not found. Available steps:', steps.map(s => s.phase));
    
    // Create it if it doesn't exist
    await sb.from('training_workflow_steps').insert({
      workflow_id: workflow.id,
      phase: "Folder structure (Template Công Ty)",
      owner: "Toàn team",
      actions: [
        "0_IN", "0_Out", "0_Ref", "1_2D", "2_3DSmax", "3_Revit", 
        "4_SketchUp", "5_PDF", "6_Photoshop", "7_Jpeg", "9_Render", 
        "10_MOM", "11_Presentation", "12_Note", "13_Supplier"
      ],
      sort_order: 2,
      metadata: null
    });
    console.log('Created new folder step.');
    return;
  }

  console.log(`Found folder step: ${folderStep.id} - ${folderStep.phase}`);

  // Update it
  const { error: updateError } = await sb
    .from('training_workflow_steps')
    .update({
      phase: "Folder structure (Template Công Ty)",
      actions: [
        "Cấu trúc thư mục chuẩn bắt buộc cho mọi dự án (@DQH_HO SO DU AN_2026):",
        "📂 0_IN (Tài liệu đầu vào từ KH/bên thứ 3)",
        "📂 0_Out (Hồ sơ xuất ra gửi KH)",
        "📂 0_Ref (Tài liệu tham khảo, moodboard)",
        "📂 1_2D (File CAD mặt bằng, triển khai)",
        "📂 2_3DSmax (File 3Ds Max)",
        "📂 3_Revit (File mô hình BIM)",
        "📂 4_SketchUp (File dựng hình SU)",
        "📂 5_PDF (Bản vẽ PDF lưu trữ/in ấn)",
        "📂 6_Photoshop (File PSD, hậu kỳ)",
        "📂 7_Jpeg (Hình ảnh xuất JPG duyệt nhanh)",
        "📂 9_Render (Bản render chất lượng cao cuối cùng)",
        "📂 10_MOM (Biên bản họp - Minutes of Meeting)",
        "📂 11_Presentation (File trình bày, PDF concept)",
        "📂 12_Note (Ghi chú, to-do list dự án)",
        "📂 13_Supplier (Báo giá, thông tin từ NCC)"
      ]
    })
    .eq('id', folderStep.id);

  if (updateError) {
    console.error('Update failed:', updateError);
  } else {
    console.log('✅ Updated folder structure successfully!');
  }
}

updateFolderStructure();
