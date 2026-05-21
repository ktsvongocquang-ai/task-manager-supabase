import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function mergeModules() {
  console.log('=== GỘP KỸ THUẬT + KỸ NĂNG MỀM ===\n');

  // 1. Lấy ID của 2 module
  const { data: techMod } = await sb.from('training_modules').select('id').eq('slug', 'tools-templates').single();
  const { data: softMod } = await sb.from('training_modules').select('id').eq('slug', 'sales-marketing').single();

  if (!techMod || !softMod) { console.log('❌ Không tìm thấy modules'); return; }

  // 2. Đổi tên Module 4 thành tab chung
  await sb.from('training_modules').update({
    title: 'Kỹ thuật & Kỹ năng mềm',
    description: 'Hạ tầng kỹ thuật · Thi công · Giao tiếp · Thuyết trình',
    icon: 'Settings',
    color: '#6B7280',
  }).eq('slug', 'tools-templates');
  console.log('✅ Đổi tên → "Kỹ thuật & Kỹ năng mềm"');

  // 3. Chuyển sections của Kỹ năng mềm sang Module Kỹ thuật
  const { data: softSections } = await sb.from('training_sections').select('*').eq('module_id', softMod.id).order('sort_order');
  
  if (softSections && softSections.length > 0) {
    // Đếm sections hiện tại của Kỹ thuật để tiếp số thứ tự
    const { data: techSections } = await sb.from('training_sections').select('sort_order').eq('module_id', techMod.id).order('sort_order', { ascending: false }).limit(1);
    const maxSort = techSections?.[0]?.sort_order || 3;

    for (let i = 0; i < softSections.length; i++) {
      const s = softSections[i];
      const newNumber = `4.${maxSort + i + 1}`;
      await sb.from('training_sections').update({
        module_id: techMod.id,
        number: newNumber,
        sort_order: maxSort + i + 1,
      }).eq('id', s.id);
      console.log(`  ✅ ${s.number} → ${newNumber}: ${s.title}`);
    }
  }

  // 4. Xóa Module Kỹ năng mềm (đã chuyển hết sections)
  await sb.from('training_modules').delete().eq('slug', 'sales-marketing');
  console.log('✅ Đã xóa module "Kỹ năng mềm" (gộp vào Kỹ thuật)');

  console.log('\n=== CẤU TRÚC MỚI ===');
  console.log('  1. Nền tảng DQH');
  console.log('  2. Kiến thức Thiết kế');
  console.log('  3. Quy trình vận hành');
  console.log('  4. Kỹ thuật & Kỹ năng mềm (gộp)');
}

mergeModules();
