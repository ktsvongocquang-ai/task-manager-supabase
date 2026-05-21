import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function consolidate() {
  console.log('=== GỘP SECTIONS MODULE 1 (6 → 3) ===\n');

  // Lấy module 1
  const { data: mod } = await sb.from('training_modules').select('id').eq('slug', 'onboarding').single();
  if (!mod) { console.log('❌ Không tìm thấy module'); return; }

  // Lấy tất cả sections + subsections hiện tại
  const { data: sections } = await sb.from('training_sections').select('id, number, title, slug, content')
    .eq('module_id', mod.id).order('sort_order');
  
  if (!sections) { console.log('❌ Không có sections'); return; }
  console.log('Sections hiện tại:');
  sections.forEach(s => console.log(`  ${s.number} ${s.title}`));

  // Lấy subsections cho từng section
  const allSubs = {};
  for (const sec of sections) {
    const { data } = await sb.from('training_subsections').select('*').eq('section_id', sec.id).order('sort_order');
    allSubs[sec.number] = data || [];
  }

  // Xóa tất cả subsections và sections cũ
  for (const sec of sections) {
    await sb.from('training_subsections').delete().eq('section_id', sec.id);
  }
  await sb.from('training_sections').delete().eq('module_id', mod.id);
  console.log('\n✅ Đã xóa sections cũ');

  // === TẠO 3 SECTIONS MỚI ===
  
  // 1.1 Bản sắc DQH (gộp 1.1 + 1.2 + 1.3)
  const { data: sec1 } = await sb.from('training_sections').insert({
    module_id: mod.id,
    slug: 'ban-sac-dqh',
    number: '1.1',
    title: 'Bản sắc DQH',
    description: 'Tầm nhìn · Sứ mệnh · Giá trị cốt lõi · Brand DNA',
    icon: 'BookOpen',
    content: '"Quiet Luxury" — Sang trọng không cần phô trương.',
    sort_order: 1,
  }).select('id').single();

  // 1.2 Tư duy Thiết kế (gộp 1.4 + 1.5)
  const { data: sec2 } = await sb.from('training_sections').insert({
    module_id: mod.id,
    slug: 'tu-duy-thiet-ke',
    number: '1.2',
    title: 'Tư duy Thiết kế Thực chiến',
    description: '5 nhóm tư duy · Master Suite · Ergonomics',
    icon: 'Sparkles',
    content: 'Designer DQH không chỉ vẽ đẹp — phải giải quyết bài toán không gian.',
    sort_order: 2,
  }).select('id').single();

  // 1.3 Mô tả công việc (giữ nguyên 1.6)
  const { data: sec3 } = await sb.from('training_sections').insert({
    module_id: mod.id,
    slug: 'mo-ta-cong-viec',
    number: '1.3',
    title: 'Mô tả công việc (8 Vị trí)',
    description: 'Nhiệm vụ chi tiết A/B/C/D cho từng vị trí',
    icon: 'Users',
    content: 'Mỗi người rõ việc — không chồng chéo, không bỏ sót.',
    sort_order: 3,
  }).select('id').single();

  console.log('✅ Đã tạo 3 sections mới\n');

  // === CHUYỂN SUBSECTIONS ===

  // 1.1 Bản sắc: gộp subsections từ 1.1 + 1.2 + 1.3
  const banSacSubs = [
    ...allSubs['1.1']?.map((s, i) => ({ ...s, section_id: sec1.id, sort_order: i + 1 })) || [],
    ...allSubs['1.2']?.map((s, i) => ({ ...s, section_id: sec1.id, sort_order: 10 + i })) || [],
    ...allSubs['1.3']?.map((s, i) => ({ ...s, section_id: sec1.id, sort_order: 20 + i })) || [],
  ];
  
  // 1.2 Tư duy: gộp subsections từ 1.4 + 1.5
  const tuDuySubs = [
    ...allSubs['1.4']?.map((s, i) => ({ ...s, section_id: sec2.id, sort_order: i + 1 })) || [],
    ...allSubs['1.5']?.map((s, i) => ({ ...s, section_id: sec2.id, sort_order: 10 + i })) || [],
  ];

  // 1.3 Mô tả: giữ nguyên subsections từ 1.6
  const jobSubs = allSubs['1.6']?.map((s, i) => ({ ...s, section_id: sec3.id, sort_order: i + 1 })) || [];

  // Insert tất cả (xóa id cũ)
  const cleanInsert = (arr) => arr.map(({ id, created_at, updated_at, ...rest }) => rest);

  if (banSacSubs.length > 0) {
    const { error } = await sb.from('training_subsections').insert(cleanInsert(banSacSubs));
    if (error) console.log('❌ 1.1:', error.message);
    else console.log(`✅ 1.1 Bản sắc DQH: ${banSacSubs.length} subsections`);
  }

  if (tuDuySubs.length > 0) {
    const { error } = await sb.from('training_subsections').insert(cleanInsert(tuDuySubs));
    if (error) console.log('❌ 1.2:', error.message);
    else console.log(`✅ 1.2 Tư duy Thiết kế: ${tuDuySubs.length} subsections`);
  }

  if (jobSubs.length > 0) {
    const { error } = await sb.from('training_subsections').insert(cleanInsert(jobSubs));
    if (error) console.log('❌ 1.3:', error.message);
    else console.log(`✅ 1.3 Mô tả công việc: ${jobSubs.length} subsections`);
  }

  console.log('\n=== CẤU TRÚC MỚI MODULE 1 ===');
  console.log('  1.1 Bản sắc DQH (Vision + Values + Brand DNA)');
  console.log('  1.2 Tư duy Thiết kế (5 nhóm + Master Suite)');
  console.log('  1.3 Mô tả công việc (8 Vị trí)');
}

consolidate();
