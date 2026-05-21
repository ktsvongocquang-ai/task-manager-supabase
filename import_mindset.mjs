import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function importMindset() {
  console.log('=== IMPORT TƯ DUY THIẾT KẾ THỰC CHIẾN ===\n');

  // Đọc file JSON
  const raw = fs.readFileSync('mindset.json', 'utf-8');
  const data = JSON.parse(raw);

  // 1. Tìm Module 2 (Kiến thức chuyên môn)
  const { data: mod } = await sb.from('training_modules').select('id').eq('slug', 'design-knowledge').single();
  if (!mod) {
    console.log('❌ Không tìm thấy Module "Kiến thức chuyên môn" (slug: design-knowledge)');
    return;
  }

  // 2. Kiểm tra xem Section 2.8 đã có chưa
  let sectionId;
  const { data: existingSec } = await sb.from('training_sections')
    .select('id')
    .eq('module_id', mod.id)
    .ilike('title', '%Tư duy Thiết kế%')
    .single();

  if (existingSec) {
    sectionId = existingSec.id;
    console.log('✅ Tìm thấy Section "Tư duy Thiết kế Thực chiến", id:', sectionId);
    
    // Cập nhật số và lead
    await sb.from('training_sections').update({
      number: data.section,
      title: data.title,
      content: data.subtitle,
      sort_order: 8
    }).eq('id', sectionId);
  } else {
    // Tạo mới Section
    const { data: newSec, error: insertErr } = await sb.from('training_sections')
      .insert({
        module_id: mod.id,
        number: data.section,
        title: data.title,
        content: data.subtitle, // Dùng subtitle làm lead quote
        sort_order: 8
      })
      .select('id').single();
      
    if (insertErr || !newSec) {
      console.log('❌ Lỗi tạo Section:', insertErr);
      return;
    }
    sectionId = newSec.id;
    console.log('✅ Đã tạo mới Section "Tư duy Thiết kế Thực chiến", id:', sectionId);
  }

  // 3. Xóa các subsections cũ (nếu có) để insert lại
  await sb.from('training_subsections').delete().eq('section_id', sectionId);

  // 4. Tạo các Subsections tương ứng với các Tiers
  // Hoặc gộp tất cả Tiers vào 1 Subsection duy nhất?
  // Nếu có 3 Tiers, có thể tạo 3 Subsections để UI tự động dùng TabbedSubsections (nếu >=4), nhưng ở đây chỉ có 3.
  // Thôi thì tạo 3 subsections cho 3 tầng.
  let sortOrder = 1;
  for (const tier of data.tiers) {
    const meta = {
      data: tier // Lưu toàn bộ data của tier vào metadata.data
    };

    const { error: subErr } = await sb.from('training_subsections')
      .insert({
        section_id: sectionId,
        heading: tier.label,
        content_type: 'mindset_tier',
        metadata: meta,
        sort_order: sortOrder++
      });

    if (subErr) {
      console.log(`❌ Lỗi tạo Subsection ${tier.label}:`, subErr);
    } else {
      console.log(`✅ Đã tạo Subsection: ${tier.label}`);
    }
  }

  console.log('\n🎉 Đã import hoàn tất!');
}

importMindset();
