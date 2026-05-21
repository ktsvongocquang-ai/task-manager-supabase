import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function restructure() {
  console.log('=== TÁI CẤU TRÚC TRAINING HUB ===\n');

  // Lấy module IDs
  const { data: mods } = await sb.from('training_modules').select('id, slug').order('sort_order');
  const modMap = {};
  mods.forEach(m => modMap[m.slug] = m.id);
  console.log('Modules:', Object.keys(modMap));

  const mod1 = modMap['onboarding'];
  const mod2 = modMap['design-knowledge'];
  const mod3 = modMap['workflow'];

  // === BƯỚC 1: Lấy subsections cần di chuyển TRƯỚC KHI xóa ===
  const { data: allSec1 } = await sb.from('training_sections').select('id, slug, number').eq('module_id', mod1);
  
  // Tìm section "Tư duy Thiết kế" và "Mô tả công việc"
  const tuDuySecId = allSec1?.find(s => s.slug === 'tu-duy-thiet-ke')?.id;
  const jobSecId = allSec1?.find(s => s.slug === 'mo-ta-cong-viec')?.id;
  const banSacSecId = allSec1?.find(s => s.slug === 'ban-sac-dqh')?.id;

  // Lấy subsections
  let tuDuySubs = [];
  let jobSubs = [];
  let giaTriSubs = [];
  
  if (tuDuySecId) {
    const { data } = await sb.from('training_subsections').select('*').eq('section_id', tuDuySecId).order('sort_order');
    tuDuySubs = data || [];
    console.log(`Tư duy Thiết kế: ${tuDuySubs.length} subsections`);
  }
  if (jobSecId) {
    const { data } = await sb.from('training_subsections').select('*').eq('section_id', jobSecId).order('sort_order');
    jobSubs = data || [];
    console.log(`Mô tả công việc: ${jobSubs.length} subsections`);
  }
  if (banSacSecId) {
    const { data } = await sb.from('training_subsections').select('*').eq('section_id', banSacSecId).order('sort_order');
    giaTriSubs = data || [];
    // Chỉ giữ lại subsection "3 Giá trị cốt lõi"
    giaTriSubs = giaTriSubs.filter(s => s.heading?.includes('Giá trị'));
    console.log(`Giá trị cốt lõi: ${giaTriSubs.length} subsections`);
  }

  // === BƯỚC 2: Xóa toàn bộ Module 1 cũ ===
  for (const sec of (allSec1 || [])) {
    await sb.from('training_subsections').delete().eq('section_id', sec.id);
  }
  await sb.from('training_sections').delete().eq('module_id', mod1);
  console.log('\n✅ Đã xóa Module 1 cũ');

  // === BƯỚC 3: Tạo Module 1 mới — NỀN TẢNG DQH ===
  // Chỉ 1 section duy nhất, tất cả nội dung là subsections
  const { data: newSec } = await sb.from('training_sections').insert({
    module_id: mod1,
    slug: 'nen-tang-dqh',
    number: '1.1',
    title: 'Nền tảng DQH',
    description: 'DQH là gì · Châm ngôn · D·Q·H · 3 Cam kết · 3 Giá trị',
    icon: 'BookOpen',
    content: '"Làm nghề tử tế." — Tử tế với khách hàng, với đồng nghiệp, và với nghề.',
    sort_order: 1,
  }).select('id').single();

  const secId = newSec.id;

  const subsections = [
    {
      section_id: secId, slug: 'dqh-la-gi', heading: 'DQH là gì?',
      content_type: 'text', sort_order: 1,
      content: 'Công ty thiết kế & thi công nội thất tại TP.HCM, thành lập 30/12/2020.\n\nLàm theo mô hình Design & Build — đồng hành cùng khách hàng từ thiết kế đến hoàn thiện thi công, không phải chỉ làm một phần rồi bàn giao.\n\nPhân khúc khách hàng: cao cấp. Họ có tiêu chuẩn cao, trả tiền xứng đáng, và kỳ vọng sự chuyên nghiệp ở từng điểm chạm.',
      metadata: null,
    },
    {
      section_id: secId, slug: 'cham-ngon', heading: 'Châm ngôn làm nghề',
      content_type: 'items', sort_order: 2, content: null,
      metadata: {
        items: [
          { title: 'LÀM NGHỀ TỬ TẾ', body: 'Đây không phải slogan — đây là cách DQH vận hành mỗi ngày.' },
          { title: 'Tử tế với khách hàng', body: 'Nói thật, làm đúng, không qua loa.' },
          { title: 'Tử tế với đồng nghiệp', body: 'Hỗ trợ nhau, không đổ lỗi.' },
          { title: 'Tử tế với nghề', body: 'Làm kỹ dù không ai nhìn thấy.' },
        ]
      },
    },
    {
      section_id: secId, slug: 'ba-cam-ket', heading: '3 Cam kết với bạn',
      content_type: 'items', sort_order: 3, content: null,
      metadata: {
        items: [
          { title: '🎯 SÂN CHƠI', body: 'Bạn được thử, được học, được làm thứ mình tự hào.' },
          { title: '🤝 ĐỒNG HÀNH', body: 'Khi bạn gặp khó, có người cùng giải quyết. Không ai bị bỏ lại một mình.' },
          { title: '👏 CÔNG NHẬN', body: 'Làm tốt thì được nhìn thấy. Không cần tự PR.' },
        ]
      },
    },
    {
      section_id: secId, slug: 'dqh-nghia', heading: 'D · Q · H nghĩa là gì?',
      content_type: 'table', sort_order: 4, content: null,
      metadata: {
        table: {
          headers: ['', 'Với khách hàng', 'Với công việc hàng ngày'],
          rows: [
            ['D — Đồng Hành', 'Luôn có mặt, kể cả lúc khó', 'Hỏi khi chưa rõ, không tự đoán'],
            ['Q — Quy Chuẩn', 'Làm đúng bản vẽ, đúng cam kết', 'Làm có quy trình, không tự phá chuẩn'],
            ['H — Hài Lòng', 'Khách hàng thấy xứng đáng', 'Bản thân tự hào khi nhìn lại việc mình làm'],
          ]
        }
      },
    },
    {
      section_id: secId, slug: 'tam-nhin-su-menh', heading: 'Tầm nhìn & Sứ mệnh',
      content_type: 'items', sort_order: 5, content: null,
      metadata: {
        items: [
          { title: 'TẦM NHÌN', body: 'Studio nội thất cao cấp được tin chọn hàng đầu tại TP.HCM.' },
          { title: 'SỨ MỆNH', body: 'Mỗi không gian DQH tạo ra phải phản ánh đúng bản sắc của gia chủ — không phải copy template, không phải làm cho xong.' },
        ]
      },
    },
  ];

  // Thêm 3 Giá trị cốt lõi (từ dữ liệu đã lưu)
  if (giaTriSubs.length > 0) {
    const gt = giaTriSubs[0];
    subsections.push({
      section_id: secId, slug: 'gia-tri-cot-loi', heading: '3 Giá trị cốt lõi',
      content_type: gt.content_type, sort_order: 6, content: null,
      metadata: gt.metadata,
    });
  } else {
    // Fallback nếu không tìm thấy
    subsections.push({
      section_id: secId, slug: 'gia-tri-cot-loi', heading: '3 Giá trị cốt lõi',
      content_type: 'items', sort_order: 6, content: null,
      metadata: {
        items: [
          { title: 'THÁI ĐỘ — Tận tâm trong từng chi tiết', body: 'Từ cách chọn vật liệu đến góc bo tủ bếp — tất cả phản ánh thái độ làm nghề.\n• Duyệt sample vật liệu thật trước khi trình khách\n• Mọi quyết định thiết kế đều có lý do\n• Phát hiện lỗi → dừng, sửa, báo — không che' },
          { title: 'TRÁCH NHIỆM — Chủ động, không chờ nhắc', body: 'Công ty nhỏ = mỗi người là chủ phần việc mình. Sai nhận, thiếu bổ sung.\n• Tự track tiến độ, không cần Leader nhắc\n• Thấy vấn đề → báo ngay trong ngày\n• Feedback phải cụ thể, không nói chung chung' },
          { title: 'ĐỒNG HÀNH — Cùng khách & đội ngũ phát triển', body: 'DQH đi cùng khách từ ý tưởng đến bàn giao, và đi cùng nhau phát triển nghề.\n• Lắng nghe khách trước khi phản biện\n• Mỗi dự án hoàn thành → review 1 bài học\n• Chia sẻ kiến thức nội bộ' },
        ]
      },
    });
  }

  const { error: subErr } = await sb.from('training_subsections').insert(subsections);
  if (subErr) console.log('❌ Subsections:', subErr.message);
  else console.log(`✅ Module 1 mới: ${subsections.length} nội dung`);

  // === BƯỚC 4: Di chuyển "Tư duy Thiết kế" → Module 2 ===
  if (tuDuySubs.length > 0) {
    // Tìm max sort_order hiện tại trong Module 2
    const { data: mod2Secs } = await sb.from('training_sections').select('sort_order')
      .eq('module_id', mod2).order('sort_order', { ascending: false }).limit(1);
    const maxSort = mod2Secs?.[0]?.sort_order || 7;

    const { data: newTuDuySec } = await sb.from('training_sections').insert({
      module_id: mod2,
      slug: 'tu-duy-thiet-ke',
      number: '2.8',
      title: 'Tư duy Thiết kế Thực chiến',
      description: '5 nhóm tư duy · Master Suite · Ergonomics',
      icon: 'Sparkles',
      content: 'Designer DQH không chỉ vẽ đẹp — phải giải quyết bài toán không gian.',
      sort_order: maxSort + 1,
    }).select('id').single();

    if (newTuDuySec) {
      const cleaned = tuDuySubs.map(({ id, created_at, updated_at, section_id, ...rest }) => ({
        ...rest, section_id: newTuDuySec.id
      }));
      const { error } = await sb.from('training_subsections').insert(cleaned);
      if (error) console.log('❌ Chuyển Tư duy:', error.message);
      else console.log(`✅ Đã chuyển "Tư duy Thiết kế" → Module 2 (${cleaned.length} subs)`);
    }
  }

  // === BƯỚC 5: Di chuyển "Mô tả công việc" → Module 3 (Quy trình) ===
  if (jobSubs.length > 0) {
    // Tạo section mới trong Module 3
    const { data: newJobSec } = await sb.from('training_sections').insert({
      module_id: mod3,
      slug: 'mo-ta-cong-viec',
      number: '3.10',
      title: 'Mô tả công việc (8 Vị trí)',
      description: 'Nhiệm vụ chi tiết A/B/C/D cho từng vị trí',
      icon: 'Users',
      content: 'Mỗi người rõ việc — không chồng chéo, không bỏ sót.',
      sort_order: 10,
    }).select('id').single();

    // Note: Module 3 là WorkflowModule, Mô tả công việc sẽ cần special handling
    // Tạm thời tạo như section bình thường — sẽ hiện trong sidebar
    // Nhưng Module 3 render WorkflowModule, không SectionModule
    // Giải pháp: Đặt vào Module 4 (Kỹ thuật & Kỹ năng mềm) thay vì Module 3
    
    // Xóa section vừa tạo ở Module 3
    if (newJobSec) {
      await sb.from('training_sections').delete().eq('id', newJobSec.id);
    }

    // Tạo ở Module 4 (Kỹ thuật & Kỹ năng mềm) — vì module này render SectionModule
    const mod4 = modMap['tools-templates'];
    const { data: mod4Secs } = await sb.from('training_sections').select('sort_order')
      .eq('module_id', mod4).order('sort_order', { ascending: false }).limit(1);
    const maxSort4 = mod4Secs?.[0]?.sort_order || 10;

    const { data: newJobSec2 } = await sb.from('training_sections').insert({
      module_id: mod4,
      slug: 'mo-ta-cong-viec',
      number: '4.11',
      title: 'Mô tả công việc (8 Vị trí)',
      description: 'Nhiệm vụ chi tiết A/B/C/D cho từng vị trí',
      icon: 'Users',
      content: 'Mỗi người rõ việc — không chồng chéo, không bỏ sót.',
      sort_order: maxSort4 + 1,
    }).select('id').single();

    if (newJobSec2) {
      const cleaned = jobSubs.map(({ id, created_at, updated_at, section_id, ...rest }) => ({
        ...rest, section_id: newJobSec2.id
      }));
      const { error } = await sb.from('training_subsections').insert(cleaned);
      if (error) console.log('❌ Chuyển JD:', error.message);
      else console.log(`✅ Đã chuyển "Mô tả công việc" → Module 4 (${cleaned.length} subs)`);
    }
  }

  console.log('\n=== CẤU TRÚC MỚI ===');
  console.log('Tab 1 — Nền tảng DQH:');
  console.log('  DQH là gì? · Châm ngôn · 3 Cam kết · D·Q·H · Tầm nhìn · 3 Giá trị');
  console.log('Tab 2 — Kiến thức Thiết kế:');
  console.log('  + Tư duy Thiết kế Thực chiến (mới chuyển từ Tab 1)');
  console.log('Tab 4 — Kỹ thuật & Kỹ năng mềm:');
  console.log('  + Mô tả công việc 8 vị trí (mới chuyển từ Tab 1)');
}

restructure();
