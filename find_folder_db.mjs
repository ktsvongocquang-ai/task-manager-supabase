import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function findAndUpdate() {
  console.log('Fetching all training_subsections...');
  const { data: subsections } = await sb.from('training_subsections').select('*');
  
  if (subsections) {
    const target = subsections.find(s => 
      JSON.stringify(s.metadata).includes('01_BRIEF & CONTRACT') || 
      JSON.stringify(s.metadata).includes('Cấu trúc folder dự án chuẩn') ||
      s.heading === 'Cấu trúc folder dự án chuẩn'
    );
    
    if (target) {
      console.log('Found in subsections! ID:', target.id);
      console.log('Heading:', target.heading);
      console.log('Current metadata:', JSON.stringify(target.metadata, null, 2));
      
      // Update it
      const newTable = {
        table: {
          columns: ["Hạng mục", "Chi tiết"],
          rows: [
            ["📂 0_IN", "Tài liệu đầu vào từ KH/bên thứ 3"],
            ["📂 0_Out", "Hồ sơ xuất ra gửi KH"],
            ["📂 0_Ref", "Tài liệu tham khảo, moodboard"],
            ["📂 1_2D", "File CAD mặt bằng, triển khai"],
            ["📂 2_3DSmax", "File 3Ds Max"],
            ["📂 3_Revit", "File mô hình BIM"],
            ["📂 4_SketchUp", "File dựng hình SU"],
            ["📂 5_PDF", "Bản vẽ PDF lưu trữ/in ấn"],
            ["📂 6_Photoshop", "File PSD, hậu kỳ"],
            ["📂 7_Jpeg", "Hình ảnh xuất JPG duyệt nhanh"],
            ["📂 9_Render", "Bản render chất lượng cao cuối cùng"],
            ["📂 10_MOM", "Biên bản họp - Minutes of Meeting"],
            ["📂 11_Presentation", "File trình bày, PDF concept"],
            ["📂 12_Note", "Ghi chú, to-do list dự án"],
            ["📂 13_Supplier", "Báo giá, thông tin từ NCC"]
          ]
        }
      };

      await sb.from('training_subsections').update({ metadata: newTable }).eq('id', target.id);
      console.log('✅ Updated subsection successfully!');
    } else {
      console.log('Not found in subsections.');
    }
  }

  // Also check if it's in hardcoded constants somewhere
}

findAndUpdate();
