import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const MISTAKES_DATA = [
  {
    heading: "1. TRẦN - TƯỜNG - SÀN (Phần thô nội thất)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        {
          wrong: "Đóng trần thạch cao che khuất lỗ thăm trần điều hòa giấu trần / ống gió.",
          right: "Luôn chừa lỗ thăm trần (access panel) đủ rộng ở đúng vị trí dàn lạnh, box chia gió để bảo trì."
        },
        {
          wrong: "Lát sàn gỗ công nghiệp/tự nhiên sát rạt chân tường, không để khe co giãn.",
          right: "Phải chừa khe hở 10-15mm sát tường để gỗ thở và co giãn. Che khe bằng len chân tường."
        },
        {
          wrong: "Sơn tường trực tiếp không bả matit ở các vị trí đánh đèn hắt, đèn spotlight.",
          right: "Các diện tường có đèn chiếu rọi (đặc biệt là đèn hắt vệt) phải được bả matit và xả nhám cực phẳng, nếu không sẽ lộ gợn sóng."
        },
        {
          wrong: "Lát gạch vệ sinh không tạo độ dốc về phễu thu sàn, hoặc dùng gạch bóng kính cho sàn WC.",
          right: "Sàn WC phải có độ dốc 1-2% về phễu thu nước. Tuyệt đối dùng gạch nhám/chống trơn trượt cho sàn ướt."
        }
      ]
    }
  },
  {
    heading: "2. GỖ CÔNG NGHIỆP & PHỤ KIỆN (Tủ, Kệ)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        {
          wrong: "Làm cánh tủ áo / tủ giày bằng MDF quá dài (>1m2) nhưng không dùng thanh chống cong.",
          right: "Cánh tủ dài quá 1m2 (đặc biệt cánh cao kịch trần) bắt buộc phải khoét rãnh lắp thanh chống cong (tensioner) để tránh mo cánh sau 6 tháng."
        },
        {
          wrong: "Sử dụng bản lề thường cho cánh tủ gỗ tự nhiên hoặc cánh MDF lõi xanh quá nặng.",
          right: "Tính toán tải trọng cánh. Cánh nặng phải dùng bản lề chịu tải lớn, tăng số lượng bản lề (ví dụ cánh tủ cao 2.4m cần ít nhất 5 bản lề)."
        },
        {
          wrong: "Ngăn kéo (hộc kéo) bếp rộng hơn 900mm nhưng dùng ray bi thông thường.",
          right: "Ngăn kéo rộng >800mm phải dùng ray hộp (tandembox) chịu tải 30kg-50kg để chống xệ đáy và kéo trơn tru."
        },
        {
          wrong: "Tủ Lavabo trong phòng tắm dùng gỗ MDF chống ẩm.",
          right: "Gỗ MDF chống ẩm chỉ kháng ẩm không kháng nước. Tủ Lavabo (nhất là WC nhỏ không chia buồng tắm) bắt buộc dùng nhựa Picomat hoặc WPC chống nước 100%."
        }
      ]
    }
  },
  {
    heading: "3. KHÔNG GIAN BẾP (Tủ bếp, Thiết bị)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        {
          wrong: "Bố trí Bếp nấu và Chậu rửa sát cạnh nhau (không có bàn soạn).",
          right: "Nguyên tắc tam giác bếp: Bếp - Chậu - Tủ lạnh. Phải có khoảng bàn trống tối thiểu 600mm giữa Bếp và Chậu để thao tác thái cắt."
        },
        {
          wrong: "Lắp máy hút mùi quá cao hoặc quá thấp so với mặt bếp.",
          right: "Khoảng cách tiêu chuẩn từ mặt bếp đến máy hút mùi: 650mm - 750mm (tùy loại bếp từ hay bếp gas). Quá cao hút không tới, quá thấp cấn đầu."
        },
        {
          wrong: "Không chừa khe tản nhiệt cho tủ lạnh âm sâu hoặc máy hút mùi âm tủ.",
          right: "Thiết bị âm tủ luôn cần lưới tản nhiệt ở len chân tủ hoặc khe thoát nhiệt phía trên để tránh hỏng lốc máy."
        },
        {
          wrong: "Đá bếp dùng đá Marble tự nhiên màu sáng.",
          right: "Đá Marble rất dễ ố, ngấm màu (nghệ, rượu vang) và trầy xước. Bếp nên dùng đá Nhân tạo gốc Thạch anh (Vicostone) hoặc đá Granite tự nhiên."
        }
      ]
    }
  },
  {
    heading: "4. GIƯỜNG NGỦ & ÁNH SÁNG (Đèn đóm)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        {
          wrong: "Giường ngủ có ngăn kéo nhưng đặt sát tủ quần áo cửa mở.",
          right: "Phải đo đạc kỹ: mở cánh tủ quần áo ra có bị cấn cản việc kéo hộc giường hay không. Tốt nhất dùng tủ cửa lùa nếu không gian hẹp."
        },
        {
          wrong: "Bố trí đèn downlight rọi thẳng xuống mặt gối nằm trên giường ngủ.",
          right: "Đèn trần phòng ngủ không được rọi thẳng vào mắt người nằm. Nên dùng đèn hắt khe trần, hoặc bố trí downlight lệch về phía cuối chân giường."
        },
        {
          wrong: "Thiếu công tắc đảo chiều (2way) cho đèn phòng ngủ.",
          right: "Phòng ngủ bắt buộc phải có 1 công tắc tổng ở cửa ra vào, và 1 công tắc đảo chiều ở táp đầu giường (để tắt đèn không cần chui ra khỏi chăn)."
        },
        {
          wrong: "Dùng chung 1 màu ánh sáng trắng (6500K) cho toàn bộ nhà.",
          right: "Ánh sáng trắng làm nhà bị 'lạnh' và giống văn phòng. Chuẩn nội thất cao cấp: Dùng ánh sáng trung tính (4000K) cho Bếp/WC, ánh sáng ấm (3000K) cho Phòng ngủ/Phòng khách."
        }
      ]
    }
  }
];

async function seedMistakes() {
  console.log('=== SEEDING FULL MISTAKES (2.5) ===');

  const { data: mod } = await sb.from('training_modules').select('id').eq('slug', 'design-knowledge').single();
  if (!mod) {
    console.log('Module 2 not found');
    return;
  }

  const { data: section } = await sb.from('training_sections')
    .select('id')
    .eq('module_id', mod.id)
    .eq('number', '2.5')
    .single();

  if (!section) {
    console.log('Section 2.5 not found');
    return;
  }

  // Delete old subsections
  await sb.from('training_subsections').delete().eq('section_id', section.id);

  // Insert new comprehensive subsections
  let order = 1;
  for (const block of MISTAKES_DATA) {
    await sb.from('training_subsections').insert({
      section_id: section.id,
      heading: block.heading,
      content_type: block.content_type,
      metadata: block.metadata,
      sort_order: order
    });
    order++;
  }

  console.log('✅ Đã cập nhật xong kho tàng 16 Lỗi Thường Gặp Nội Thất!');
}

seedMistakes();
