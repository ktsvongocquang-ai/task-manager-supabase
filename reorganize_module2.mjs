import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function reorganizeModule2() {
  console.log('=== TỔ CHỨC LẠI MODULE 2 ===\n');

  // 1. Tìm Module 2
  const { data: mod } = await sb.from('training_modules').select('id').eq('slug', 'design-knowledge').single();
  if (!mod) {
    console.log('❌ Không tìm thấy Module 2');
    return;
  }
  const modId = mod.id;

  // 2. Lấy tất cả sections trong Module 2
  const { data: sections } = await sb.from('training_sections')
    .select('*')
    .eq('module_id', modId)
    .order('sort_order');
    
  if (!sections) return;

  // 3. Xóa các sections không cần thiết (2.1, 2.2, 2.6)
  const toDelete = sections.filter(s => 
    s.title.includes('Triết lý Quiet Luxury') || 
    s.title.includes('Nguyên tắc bố cục') || 
    s.title.includes('Case Study nội bộ')
  );

  for (const s of toDelete) {
    await sb.from('training_subsections').delete().eq('section_id', s.id);
    await sb.from('training_sections').delete().eq('id', s.id);
    console.log(`✅ Đã xóa: ${s.title}`);
  }

  // Lấy lại danh sách sau khi xóa
  const { data: currentSections } = await sb.from('training_sections')
    .select('*')
    .eq('module_id', modId)
    .order('sort_order');

  if (!currentSections) return;

  // 4. Sắp xếp lại thứ tự:
  // - Tư duy Thiết kế Thực chiến (lên đầu)
  // - Kích thước chuẩn
  // - Vật liệu chuẩn DQH
  // - 3 Phong cách chính
  // - Lỗi thường gặp
  
  const tuDuy = currentSections.find(s => s.title.includes('Tư duy Thiết kế Thực chiến'));
  const kichThuoc = currentSections.find(s => s.title.includes('Kích thước chuẩn'));
  const vatLieu = currentSections.find(s => s.title.includes('Vật liệu chuẩn'));
  const phongCach = currentSections.find(s => s.title.includes('Phong cách chính'));
  const loiThuongGap = currentSections.find(s => s.title.includes('Lỗi thường gặp'));

  const newOrder = [tuDuy, kichThuoc, vatLieu, phongCach, loiThuongGap].filter(Boolean);

  console.log('\n=== CẬP NHẬT THỨ TỰ ===');
  let i = 1;
  for (const s of newOrder) {
    const newNumber = `2.${i}`;
    await sb.from('training_sections')
      .update({ number: newNumber, sort_order: i })
      .eq('id', s.id);
    console.log(`  ${newNumber} - ${s.title}`);
    i++;
  }

  // 5. Cập nhật nội dung bảng Vật liệu chuẩn DQH
  if (vatLieu) {
    const { data: subs } = await sb.from('training_subsections').select('*').eq('section_id', vatLieu.id);
    if (subs && subs.length > 0) {
      const sub = subs[0];
      const newMetadata = {
        table: {
          headers: ["HẠNG MỤC", "VẬT LIỆU THƯỜNG DÙNG", "NHÀ CUNG CẤP (SUPPLIER) / WEBSITE"],
          rows: [
            ["Gỗ", "Oak, Walnut, Cedar, Xoan, Lát (Tự nhiên > MDF/HDF)", "An Cường (ancuong.com), Mộc Phát (mocphat.com)"],
            ["Đá", "Marble tự nhiên, Limestone, Slate, Granite", "Vicostone (vicostone.com), đá tự nhiên kho Q.9"],
            ["Vải", "Linen, cotton, wool (tránh polyester giá rẻ)", "Acacia Fabrics (acaciafabrics.com), Cỏ May"],
            ["Sơn", "Sơn nước không độc (bảo vệ sức khỏe)", "Jotun (jotun.com), Dulux (dulux.vn)"],
            ["Phụ kiện", "Bản lề, ray trượt, tay nâng", "Blum (blum.com), Hafele (hafele.com.vn)"],
            ["Tránh", "Microcement (khí hậu khắc nghiệt), mạ vàng (tróc vảy), plastic decor", "Không áp dụng"]
          ]
        }
      };
      
      await sb.from('training_subsections').update({ metadata: newMetadata }).eq('id', sub.id);
      console.log(`✅ Đã cập nhật bảng Vật liệu chuẩn DQH với thông tin nhà cung cấp`);
    }
  }

  console.log('\n🎉 Hoàn tất tổ chức lại Module 2!');
}

reorganizeModule2();
