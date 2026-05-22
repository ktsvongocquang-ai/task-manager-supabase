import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const MOD2 = 'a68cca15-4770-43de-b1e0-b7ac8ed07575';

// Current sections to shift: 2.2→2.3, 2.3→2.4, 2.4→2.5, 2.5→2.6, 2.6→2.7
const SHIFTS = [
  { id: '2666c9fe-1cff-4041-9116-c53228df7def', from: '2.2', to: '2.3', sort: 3 },
  { id: 'a1c7e415-13fe-44f2-9e3f-1e226222cb0d', from: '2.3', to: '2.4', sort: 4 },
  { id: 'fc4712ef-c967-49d3-9ce3-4d7bd8e9def0', from: '2.4', to: '2.5', sort: 5 },
  { id: '9a1e89f4-8070-4076-a6b3-1a88272df42b', from: '2.5', to: '2.6', sort: 6 },
  { id: 'b97654b1-a050-4f9f-885b-6b6c4e053b53', from: '2.6', to: '2.7', sort: 7 },
];

async function run() {
  console.log('=== Thêm "Ngôn ngữ Thiết kế" vào Module 2 ===\n');

  // 1. Shift existing sections to temp numbers
  for (const s of SHIFTS) {
    await sb.from('training_sections').update({ number: s.to + '-tmp' }).eq('id', s.id);
  }
  // 2. Set final numbers
  for (const s of SHIFTS) {
    await sb.from('training_sections').update({ number: s.to, sort_order: s.sort }).eq('id', s.id);
    console.log(`  ${s.from} → ${s.to}`);
  }

  // 3. Insert new section 2.2 Ngôn ngữ Thiết kế
  const { data: newSec, error } = await sb.from('training_sections').insert({
    module_id: MOD2,
    slug: 'design-language',
    number: '2.2',
    title: 'Ngôn ngữ Thiết kế',
    description: 'Ngôn ngữ kiến trúc & nội thất DQH',
    icon: 'Palette',
    content: 'Ngôn ngữ thiết kế là cách DQH "nói" qua không gian — thống nhất từ hình khối, vật liệu đến chi tiết.',
    sort_order: 2
  }).select().single();

  if (error) {
    console.error('❌ Lỗi:', error.message);
  } else {
    console.log(`\n✅ Đã tạo section 2.2: ${newSec.title} (${newSec.id})`);

    // 4. Add subsections with content
    const subsections = [
      {
        heading: 'Giảm thiểu tường xây',
        content_type: 'text',
        content: 'Dùng kính, vách kéo, rèm thay cho tường gạch khi có thể. Mục tiêu: không gian liên thông, thoáng đãng, linh hoạt thay đổi công năng.',
        metadata: {}
      },
      {
        heading: 'Đóng khung góc nhìn (Framing)',
        content_type: 'items',
        content: null,
        metadata: {
          items: [
            { title: 'Cửa sổ → tranh sống', body: 'Thiết kế cửa sổ như khung tranh tự nhiên, kết nối indoor–outdoor.' },
            { title: 'Kệ hốc tường', body: 'Tạo điểm focal point bằng hốc sâu, đèn hắt, vật trang trí có chủ đích.' },
            { title: 'Hành lang + cửa', body: 'Tận dụng đường chạy hành lang để tạo chiều sâu thị giác, ánh sáng cuối hành lang.' }
          ]
        }
      },
      {
        heading: 'Ánh sáng gián tiếp',
        content_type: 'items',
        content: null,
        metadata: {
          items: [
            { title: 'Cove light', body: 'Đèn hắt trần tạo ánh sáng mềm, nâng trần thị giác.' },
            { title: 'Đèn dây LED âm', body: 'Chạy dọc kệ, gầm bàn, chân tường — tạo chiều sâu không gian.' },
            { title: 'Tránh đèn downlight lộ', body: 'Ưu tiên đèn âm trần, đèn rãnh, đèn tường thay vì downlight lộ bề mặt.' }
          ]
        }
      },
      {
        heading: 'Tôn vinh vật liệu tự nhiên',
        content_type: 'items',
        content: null,
        metadata: {
          items: [
            { title: 'Gỗ thật (veneer/laminate cao cấp)', body: 'Luôn ưu tiên gỗ sồi, walnut, ash — tránh gỗ công nghiệp giả vân rẻ tiền.' },
            { title: 'Đá tự nhiên vs nhân tạo', body: 'Marble cho accent wall, Quartz cho mặt bếp. Không dùng đá tự nhiên ở nơi dễ ố (bếp, WC ướt).' },
            { title: 'Kim loại điểm nhấn', body: 'Inox xước, đồng thau, sắt sơn tĩnh điện — dùng tiết chế tại tay nắm, chân bàn, khung gương.' }
          ]
        }
      },
      {
        heading: 'Tỷ lệ & Nhịp điệu',
        content_type: 'items',
        content: null,
        metadata: {
          items: [
            { title: 'Golden ratio', body: 'Áp dụng tỷ lệ vàng trong phân chia mặt tủ, vách, kệ trang trí.' },
            { title: 'Rhythm (lặp lại)', body: 'Tạo nhịp bằng các module cùng kích thước: hốc tường, thanh lam, cửa kính.' },
            { title: 'Contrast có kiểm soát', body: 'Sáng/tối, nặng/nhẹ, thô/mịn — luôn có tối đa 2 cặp tương phản trong 1 không gian.' }
          ]
        }
      }
    ];

    for (let i = 0; i < subsections.length; i++) {
      const sub = subsections[i];
      await sb.from('training_subsections').insert({
        section_id: newSec.id,
        heading: sub.heading,
        content_type: sub.content_type,
        content: sub.content,
        metadata: sub.metadata,
        sort_order: i + 1
      });
      console.log(`   + ${sub.heading}`);
    }
  }

  // Final state
  const { data: final } = await sb.from('training_sections').select('number, title').eq('module_id', MOD2).order('sort_order');
  console.log('\n📋 Module 2 — Kiến thức Thiết kế:');
  final?.forEach(s => console.log(`  ${s.number} ${s.title}`));
}

run();
