import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function updateValues() {
  console.log('=== GỘP 5 GIÁ TRỊ → 3 GIÁ TRỊ CỐT LÕI ===\n');

  // Tìm subsection "5 Giá trị cốt lõi" trong section 1.1
  const { data: subs } = await sb.from('training_subsections')
    .select('id, heading, slug')
    .ilike('heading', '%Giá trị cốt lõi%');

  if (!subs || subs.length === 0) {
    console.log('❌ Không tìm thấy. Tìm theo slug...');
    const { data: subs2 } = await sb.from('training_subsections')
      .select('id, heading, slug')
      .ilike('slug', '%gia-tri%');
    console.log('Tìm thấy:', subs2);
    if (!subs2 || subs2.length === 0) return;
    // Cập nhật cái đầu tiên
    await updateSubsection(subs2[0].id);
  } else {
    console.log('Tìm thấy:', subs.map(s => `${s.id}: ${s.heading}`));
    await updateSubsection(subs[0].id);
  }
}

async function updateSubsection(subId) {
  const newValues = {
    heading: '3 Giá trị cốt lõi',
    content_type: 'items',
    metadata: {
      items: [
        {
          title: 'THÁI ĐỘ — Tận tâm trong từng chi tiết',
          body: 'Ở DQH, không có việc nhỏ. Từ cách chọn vật liệu đến góc bo của tủ bếp — tất cả đều phản ánh thái độ làm nghề.\n\n• Duyệt sample vật liệu thật trước khi trình khách — không gửi ảnh thay thế\n• Mọi quyết định thiết kế đều có lý do — không "thấy đẹp thì làm"\n• Phát hiện lỗi thi công → dừng, sửa, báo — không che, không bỏ qua\n• Tight deadline vẫn phải kiểm tra kỹ bản vẽ — không được phép tắc trách\n• Trình concept phải giải thích được "tại sao" chứ không chỉ "là gì"'
        },
        {
          title: 'TRÁCH NHIỆM — Chủ động, không chờ nhắc',
          body: 'Công ty nhỏ = mỗi người là chủ của phần việc mình. Sai thì nhận, thiếu thì bổ sung, không đổ lỗi.\n\n• Phần việc của mình → tự track tiến độ, không cần Leader nhắc\n• Thấy vấn đề → báo ngay trong ngày, không để tồn đọng\n• Thấy lỗi của người khác → nói thẳng, xây dựng — không im lặng\n• Deadline đang nguy → raise flag sớm, đừng để đến ngày mới báo\n• Feedback phải cụ thể: "sửa góc này vì..." — không nói chung chung "không đẹp"'
        },
        {
          title: 'ĐỒNG HÀNH — Cùng khách hàng & đội ngũ phát triển',
          body: 'DQH không bán thiết kế rồi biến mất — chúng tôi đi cùng khách từ ý tưởng đầu tiên đến ngày dọn vào ở, và đi cùng nhau phát triển nghề.\n\n• Lắng nghe khách trước khi phản biện — hiểu rồi mới tư vấn\n• Khách yêu cầu sai → tư vấn thẳng thắn, giải thích tại sao — không chiều theo\n• Mỗi dự án hoàn thành → review 1 bài học rút ra cho cả team\n• Chia sẻ kiến thức nội bộ — người biết dạy người chưa biết\n• Follow ít nhất 5 studio quốc tế để cập nhật xu hướng liên tục'
        },
      ]
    },
  };

  const { error } = await sb.from('training_subsections').update(newValues).eq('id', subId);
  if (error) console.log('❌ Lỗi:', error.message);
  else console.log('✅ Đã cập nhật "5 Giá trị" → "3 Giá trị cốt lõi"');

  console.log('\n=== 3 GIÁ TRỊ MỚI ===');
  console.log('  1. THÁI ĐỘ — Tận tâm trong từng chi tiết (gộp EXCELLENCE + CRAFT)');
  console.log('  2. TRÁCH NHIỆM — Chủ động, không chờ nhắc (gộp OWNERSHIP + thẳng thắn)');
  console.log('  3. ĐỒNG HÀNH — Cùng khách & đội ngũ phát triển (gộp GROWTH + RESPECT)');
}

updateValues();
