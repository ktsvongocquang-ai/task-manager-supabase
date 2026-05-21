import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function translateQuietLuxury() {
  console.log('=== VIỆT HÓA 5 NGUYÊN TẮC QUIET LUXURY ===\n');

  // Tìm subsection "5 Nguyên tắc Cốt lõi"
  const { data: subs, error: searchErr } = await sb.from('training_subsections')
    .select('id, heading, metadata')
    .ilike('heading', '%5 Nguyên tắc Cốt lõi%');

  if (searchErr || !subs || subs.length === 0) {
    console.log('❌ Không tìm thấy subsection "5 Nguyên tắc Cốt lõi"');
    return;
  }

  const subId = subs[0].id;
  
  const newMetadata = {
    table: {
      headers: ["HẠNG MỤC", "CHI TIẾT"],
      rows: [
        [
          "1. Sự Tinh Tế Thay Vì Phô Trương",
          "Không logo, không phô trương. Vẻ đẹp được cảm nhận, không được giải thích. Một chiếc sofa linen xịn hơn sofa khung mạ vàng."
        ],
        [
          "2. Tính Chân Thực Của Vật Liệu",
          "Vật liệu thật tự nhiên (gỗ, đá, linen, cashmere). Đẹp dần theo thời gian — càng dùng lâu, càng có hồn. Tránh vật liệu giả."
        ],
        [
          "3. Thiết Kế Vượt Thời Gian",
          "Không chạy theo xu hướng ngắn hạn. Mỗi quyết định: 'Cái này còn đẹp trong 10 năm nữa không?' Bảng màu: trung tính. Tránh dùng màu quá sặc sỡ."
        ],
        [
          "4. Sự Có Chủ Ý",
          "Không có vật dụng 'chỉ để trang trí'. Mỗi thứ phải có lý do — thực dụng hoặc cảm xúc. Tuyển chọn kỹ lưỡng thay vì lấp đầy không gian."
        ],
        [
          "5. Sự Thoải Mái Về Cảm Xúc",
          "Sang trọng = cảm giác 'thật thoải mái, thật bình yên'. Sự an bình trong tâm trí quan trọng hơn vẻ đẹp chỉ để khoe trên mạng xã hội."
        ]
      ]
    }
  };

  const { error: updateErr } = await sb.from('training_subsections')
    .update({ metadata: newMetadata })
    .eq('id', subId);

  if (updateErr) {
    console.log('❌ Lỗi cập nhật:', updateErr.message);
  } else {
    console.log('✅ Đã Việt hóa thành công 5 Nguyên tắc Cốt lõi của Quiet Luxury!');
    console.log(newMetadata.table.rows.map(r => r[0]).join('\n'));
  }
}

translateQuietLuxury();
