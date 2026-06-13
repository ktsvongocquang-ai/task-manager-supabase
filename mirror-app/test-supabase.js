import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test10Projects() {
  const projectNames = [
    'Biệt thự Thảo Điền',
    'Căn hộ Vinhomes Central Park',
    'Shophouse Phú Mỹ Hưng',
    'Penthouse Landmark 81',
    'Villa Riviera An Phú',
    'Office Quận 1 Tower',
    'Nhà phố Bình Thạnh',
    'Resort Hồ Tràm',
    'Chung cư Masteri',
    'Studio Quận 7 ArtHouse'
  ];

  console.log('=== TESTING: Tạo 10 dự án ===\n');

  const createdIds = [];

  for (let i = 0; i < projectNames.length; i++) {
    const proj = {
      id: `test-proj-${Date.now()}-${i}`,
      name: projectNames[i],
      client: `Khách hàng ${i + 1}`,
      leader: `KTS. Tester ${i + 1}`,
      address: `Quận ${i + 1}, TP.HCM`,
      status: 'active',
      progress: Math.floor(Math.random() * 50) + 10,
      created_at: Date.now() - (i * 1000)
    };

    const { error } = await supabase.from('projects').upsert(proj);
    if (error) {
      console.error(`FAIL [${i + 1}] ${projectNames[i]}:`, error.message);
    } else {
      console.log(`OK   [${i + 1}] ${projectNames[i]}`);
      createdIds.push(proj.id);
    }
  }

  console.log(`\n=== KẾT QUẢ: ${createdIds.length}/10 dự án tạo thành công ===`);

  // Verify by reading back
  console.log('\n=== KIỂM TRA: Đọc lại danh sách dự án từ DB ===');
  const { data, error: readError } = await supabase
    .from('projects')
    .select('id, name, leader, status')
    .order('created_at', { ascending: false });

  if (readError) {
    console.error('Lỗi đọc dữ liệu:', readError.message);
  } else {
    console.log(`Tổng số dự án trong DB: ${data.length}`);
    data.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} | ${p.leader || '-'} | ${p.status}`);
    });
  }

  // Cleanup test projects
  console.log('\n=== DỌN DẸP: Xóa 10 dự án test ===');
  for (const id of createdIds) {
    await supabase.from('projects').delete().eq('id', id);
  }
  console.log('Đã xóa xong.');

  process.exit(0);
}

test10Projects();
