import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

// Section 2.2 Ngôn ngữ Thiết kế
const SECTION_ID = 'b83f5dbb-a95c-4d12-9397-0661ccce9bae';

const SUBSECTIONS = [
  {
    heading: 'Tỉ lệ — Proportion',
    content_type: 'items',
    content: '"Tỷ lệ sai thì vật liệu đắt tiền cũng vô nghĩa. Tỷ lệ đúng thì tường trắng vẫn sang."',
    metadata: {
      items: [
        { title: 'Solid : Void = 3 : 1 trên mỗi mặt tường', body: '25% diện tích tường là void — khe, recessed panel, khoảng âm. Không gian thở tạo luxury, không phải vật liệu lấp đầy. Tường 5m dài → có ít nhất 1.2m void zones.' },
        { title: 'Furniture scale theo trần — không theo sở thích', body: 'Trần 2.8m: sofa lưng ≤80cm, tủ ≤240cm. Trần 3.2m+: sofa lưng ≤90cm, tủ đến trần. Scale sai với trần = lỗi cơ bản nhất.' },
        { title: 'Khe shadow gap: 3–5mm tường · 2–3mm tủ', body: 'Rộng hơn 6mm = thô. Hẹp hơn 2mm = không đọc được. Dimension chuẩn, không thay đổi theo budget dự án. Khe là chữ ký — không phải tiết kiệm vật liệu.' },
        { title: 'Ceiling coffer : Tổng trần = 1 : 4', body: 'Coffer chiếm 20–25% diện tích trần. Lớn hơn → nặng nề. Nhỏ hơn → mất hiệu ứng. Depth coffer tối thiểu 80mm để tạo shadow line đọc được từ dưới nhìn lên.' },
        { title: 'Coffee table : Sofa = 1 : 2 (chiều dài)', body: 'Bàn không vượt 50% chiều dài ghế. Chiều cao bàn = chiều cao đệm sofa ±20mm. Tỷ lệ nhóm furniture phải đọc được từ góc nhìn đứng.' }
      ]
    }
  },
  {
    heading: 'Vật liệu — 3 tầng Hierarchy',
    content_type: 'items',
    content: '"Mỗi không gian: 1 Hero + 1 Supporting + 1 Neutral. Thêm vật liệu thứ 4 không có lý do = loạn."',
    metadata: {
      items: [
        { title: 'HERO — Đá tự nhiên nguyên bản (Travertine · Marble · Limestone)', body: 'Dùng ở focal lớn nhất: tường TV, island bếp, fireplace surround. Vật liệu có lịch sử — già đẹp hơn theo thời gian. Không dùng quá 1 loại đá / không gian. Matte finish, vân chìm ≤ vân nổi, không polished.' },
        { title: 'SUPPORTING — Gỗ tự nhiên matte (Oak · Walnut · Charcoal panel)', body: 'Tạo contrast ấm với hero đá. Grain dọc làm nhịp thẳng đứng nhẹ nhàng. Áp dụng: TV panel, cửa, joinery tủ, trần ốp gỗ khu vực nhỏ. Matte oil finish, grain direction dọc, không lacquer bóng.' },
        { title: 'NEUTRAL — Vật liệu nền im lặng (Plaster · Microcement cao cấp · Linen)', body: 'Tường nền, trần, soft furnishing. Màu greige đồng nhất. Không pattern, không texture rõ. Nhiệm vụ: làm nền để hero và supporting nổi bật. Greige/warm white, flat/matte, không cool gray.' },
        { title: 'ACCENT — Kim loại matte (Brushed brass · Oxidized steel)', body: 'Chỉ xuất hiện ở hardware (tay nắm, hinge), profile joint, pendant frame. Không bao giờ làm surface lớn. ≤5% diện tích. Matte luôn luôn — không polished chrome, không mạ vàng sáng bóng.' }
      ]
    }
  },
  {
    heading: 'Vật liệu — Texture & Ứng dụng',
    content_type: 'table',
    content: '"Không bao giờ để 2 vật liệu cùng texture cạnh nhau. Matte–Grain–Rough–Smooth phải xen kẽ."',
    metadata: {
      table: {
        headers: ['Khu vực', 'Vật liệu đúng', 'Không bao giờ dùng'],
        rows: [
          { 'Khu vực': 'Tường focal (TV / fireplace)', 'Vật liệu đúng': 'Travertine hoặc charcoal oak — chọn một, không kết hợp cùng 1 mặt tường', 'Không bao giờ dùng': 'Microcement rẻ, wallpaper pattern, gạch subway' },
          { 'Khu vực': 'Tường nền (3 mặt còn lại)', 'Vật liệu đúng': 'Plaster greige matte, smooth hoàn toàn. Không texture, không pattern', 'Không bao giờ dùng': 'Sơn bóng, cool white thuần, màu tương phản' },
          { 'Khu vực': 'Sàn toàn bộ', 'Vật liệu đúng': 'Oak herringbone 90×450mm, hoặc marble ≥800×800mm joints mỏng ≤2mm', 'Không bao giờ dùng': 'Gỗ kém chất lượng, vinyl giả gỗ, gạch ceramic pattern' },
          { 'Khu vực': 'Island / Bếp', 'Vật liệu đúng': '1 loại đá duy nhất bọc 3 mặt — không thay đổi vật liệu giữa chừng', 'Không bao giờ dùng': 'Đảo gỗ + đá mix, inox bề mặt lớn, lacquer bóng' },
          { 'Khu vực': 'Trần', 'Vật liệu đúng': 'Plaster flat matte, hoặc gỗ dark slat 20–30mm gap. Shadow gap trần-tường 10–15mm', 'Không bao giờ dùng': 'Trần thạch cao rườm rà, đèn ốp nổi hộp vuông' },
          { 'Khu vực': 'Soft furnishing', 'Vật liệu đúng': 'Linen, bouclé, cashmere — cream, greige, charcoal. Texture nhưng không pattern', 'Không bao giờ dùng': 'Vải có hoa văn, màu tươi, velvet quá bóng' }
        ]
      }
    }
  },
  {
    heading: 'Màu sắc — Palette',
    content_type: 'items',
    content: '"Warm neutral không phải chọn vì nhàm. Ánh sáng VN thiên vàng — cool gray sẽ chết dưới ánh nắng." Palette chuẩn: Warm White #F5F0E8 · Sand #D4C9B4 · Cream #C8B89A · Taupe #A89880 · Charcoal #3A3530 · Matte Black #1A1714. Tỷ lệ: 50% Neutral + 30% Dark + 20% Light.',
    metadata: {
      items: [
        { title: 'Không bao giờ dùng cool white (>5000K hoặc #F0F0F0 thuần)', body: 'Warm white #F5F0E8 – #EDE8DF. Tường greige: #D8D0C4 – #C8BEB2. Cool white làm gỗ và đá trông như nhựa dưới ánh sáng nhân tạo.' },
        { title: 'Accent màu duy nhất: brushed gold / oxidized bronze', body: 'Không navy, không sage green, không terracotta đang trending. Hỏi: "Màu này có trên Pinterest 3 năm nay không?" Nếu có → Quiet Luxury không dùng.' },
        { title: '3 tông trong 1 không gian — không hơn', body: '1 tông chính (warm beige), 1 tông tối (charcoal/dark oak), 1 tông ánh sáng (cream/warm white). Tông thứ 4 phải có lý do thiết kế rõ ràng.' }
      ]
    }
  },
  {
    heading: 'Ngôn ngữ đường nét — 4 loại',
    content_type: 'items',
    content: '"Đường nét đúng là đường biết im lặng. Và biết lúc nào cần xuất hiện."',
    metadata: {
      items: [
        { title: '① Horizontal dominant', body: 'TV wall / ledge / marble sill — một trục ngang liên tục. Ngôn ngữ chính DQH: grounding, ổn định, kéo rộng không gian. Tất cả yếu tố quan trọng nằm trên cùng 1 trục.' },
        { title: '② Vertical nhịp điệu', body: 'Panel dọc không đều nhau — nhịp 1:2:1:1.5 như syncopation. Đều hoàn toàn = cứng nhắc, mechanical. Áp dụng: corten slat, gỗ panel, curtain fold.' },
        { title: '③ Shadow gap — khe âm', body: '3–5mm giữa panel. Đường tối tạo bởi bóng — không phải đường vẽ. Hai vật liệu không bao giờ chạm nhau trực tiếp. Khe là dấu phẩy giữa hai câu.' },
        { title: '④ Accent corten line', body: 'Một đường 1–2mm trên trần hoặc tường. Đặt đúng vị trí → thay đổi toàn bộ cảm nhận. Nhiều hơn 1 đường accent / mặt tường = loạn. Vị trí: tại ranh giới zone hoặc tỷ lệ vàng.' }
      ]
    }
  },
  {
    heading: 'Đường nét — Dimension thực tế',
    content_type: 'table',
    content: '"Đường nét đẹp không phải vẽ tay đẹp — mà là dimension chính xác đến từng mm."',
    metadata: {
      table: {
        headers: ['Chi tiết', 'Dimension chuẩn DQH', 'Lý do'],
        rows: [
          { 'Chi tiết': 'Shadow gap tường', 'Dimension chuẩn DQH': '3–5mm rộng · 10–15mm sâu', 'Lý do': 'Đủ tạo shadow line đọc được. Sâu hơn = shadow tối hơn' },
          { 'Chi tiết': 'Shadow gap tủ joinery', 'Dimension chuẩn DQH': '2–3mm rộng · 8mm sâu', 'Lý do': 'Tủ ẩn: khe nhỏ nhất có thể mà vẫn thao tác được' },
          { 'Chi tiết': 'Shadow gap trần–tường', 'Dimension chuẩn DQH': '10–20mm rộng · LED strip ẩn', 'Lý do': 'Đủ rộng giấu LED strip + tạo floating ceiling effect' },
          { 'Chi tiết': 'Corten accent line', 'Dimension chuẩn DQH': '1–2mm rộng, nhô 2–3mm', 'Lý do': 'Mỏng hơn = không đọc được. Dày hơn → trang trí, mất tinh tế' },
          { 'Chi tiết': 'Slat corten / gỗ trần', 'Dimension chuẩn DQH': 'Thanh 20–30mm · khe 10–15mm', 'Lý do': 'Tỷ lệ thanh:khe = 2:1. Khe nhỏ hơn = đặc, mất nhịp' },
          { 'Chi tiết': 'Panel chiều cao', 'Dimension chuẩn DQH': 'Điểm dừng 2200–2400mm từ sàn', 'Lý do': 'Tạo visual break. Full height liên tục = nhàm' },
          { 'Chi tiết': 'Marble ledge / TV ledge', 'Dimension chuẩn DQH': 'Nhô ra 30–50mm · dày 20–30mm', 'Lý do': 'Vừa đủ tạo shadow phía dưới = tăng chiều sâu' },
          { 'Chi tiết': 'Grout joint sàn đá/gỗ', 'Dimension chuẩn DQH': '1.5–2mm (đá) · không thấy grout (gỗ)', 'Lý do': 'Joint mỏng = seamless, cao cấp. Joint 5mm+ = tile thông thường' }
        ]
      }
    }
  },
  {
    heading: 'Ánh sáng — 4 Layers',
    content_type: 'table',
    content: '"Đừng hỏi đủ sáng chưa. Hỏi: bóng tối đang nằm đúng chỗ chưa?"',
    metadata: {
      table: {
        headers: ['Layer', 'Tỷ lệ', 'Kỹ thuật', 'Spec'],
        rows: [
          { 'Layer': 'Ambient', 'Tỷ lệ': '30%', 'Kỹ thuật': 'Indirect LED strip giấu hoàn toàn — shadow gap trần/tường, corten coving. Không nhìn thấy nguồn sáng.', 'Spec': '2700K · Dimmer riêng · CRI≥90' },
          { 'Layer': 'Task', 'Tỷ lệ': '30%', 'Kỹ thuật': 'Recessed downlight âm trần, beam 25°–36°. Chỉ chiếu điểm cần: mặt bàn ăn, bàn bếp, bàn làm việc.', 'Spec': '3000K · Thẳng hàng · CRI≥95 · Anti-glare bắt buộc' },
          { 'Layer': 'Accent', 'Tỷ lệ': '30%', 'Kỹ thuật': 'LED strip trong kệ display — chiếu vào vật phẩm, không chiếu xuống sàn. Highlight vân đá, texture gỗ.', 'Spec': '2700K · ≤500 lux tại điểm chiếu · Dimmer riêng' },
          { 'Layer': 'Drama', 'Tỷ lệ': '10%', 'Kỹ thuật': 'Pendant cluster ở nhiều độ cao trong cụm. Chỉ 1 điểm drama/phòng — living hoặc dining, không cả hai.', 'Spec': '2200K · Scale pendant theo trần cao' }
        ]
      }
    }
  },
  {
    heading: 'Chuyển tiếp vật liệu — Material Joint',
    content_type: 'table',
    content: '"Cách 2 vật liệu gặp nhau tại đường joint — đây là nơi phân biệt level designer."',
    metadata: {
      table: {
        headers: ['Tình huống', 'Kỹ thuật chuyển tiếp', 'Dimension / Chi tiết'],
        rows: [
          { 'Tình huống': 'Tường: Đá → Gỗ', 'Kỹ thuật chuyển tiếp': 'Khe âm 5mm + shadow line. Không dùng nẹp kim loại nổi. Hai vật liệu không chạm nhau.', 'Dimension / Chi tiết': 'Khe 5mm rộng · 15mm sâu · bắt vít vào khung phía sau' },
          { 'Tình huống': 'Tường → Sàn (chân tường)', 'Kỹ thuật chuyển tiếp': 'Marble wall kéo dài thành ledge ngang xuống sàn 15mm, sau đó sàn gỗ bắt đầu. Không cần skirting.', 'Dimension / Chi tiết': 'Ledge nhô 30mm · dày 20mm · marble cùng lô với tường' },
          { 'Tình huống': 'Tường → Tủ ẩn (invisible)', 'Kỹ thuật chuyển tiếp': 'Cùng màu sơn + cùng finish. Khe 3mm = ranh giới duy nhất. Không tay nắm — push-open hoặc magnet catch.', 'Dimension / Chi tiết': 'Khe 3mm đều · sơn cùng mã màu · gap dưới tủ 5mm' },
          { 'Tình huống': 'Trần → Tường (ceiling gap)', 'Kỹ thuật chuyển tiếp': 'Shadow gap 12–18mm + LED strip ẩn. Không crown molding, không coving nổi truyền thống.', 'Dimension / Chi tiết': 'Khe 15mm rộng · LED 2700K strip · gutter depth 40mm' },
          { 'Tình huống': 'Zone: Kitchen → Living (sàn)', 'Kỹ thuật chuyển tiếp': 'Oak herringbone làm vùng đệm 600mm giữa 2 zone vật liệu khác nhau. Gỗ = ngôn ngữ trung gian.', 'Dimension / Chi tiết': 'Buffer strip 600mm · herringbone 45° · grout ≤2mm' },
          { 'Tình huống': 'Floating panel (tường)', 'Kỹ thuật chuyển tiếp': 'Panel cách tường 50mm hai bên. LED strip hidden trong khe. Ánh sáng thay thế vật liệu làm ranh giới.', 'Dimension / Chi tiết': 'Gap 50mm hai bên · LED 3000K · panel dày ≥18mm' },
          { 'Tình huống': 'Sàn: Đá → Gỗ (khác zone)', 'Kỹ thuật chuyển tiếp': 'Bậc cao 10–15mm làm ranh giới tự nhiên. Không dùng nẹp kim loại trên sàn.', 'Dimension / Chi tiết': 'Step nosing bằng marble · cạnh 45° vát · không nẹp' }
        ]
      }
    }
  },
  {
    heading: 'DQH Do / Don\'t',
    content_type: 'mistakes',
    content: '"Quiet Luxury là ngôn ngữ của người đủ tự tin để không giải thích."',
    metadata: {
      mistakes: [
        { wrong: 'Microcement rẻ, mạ vàng sáng bóng: trendy trap — đẹp ảnh render, fail thực tế.', right: '1 vật liệu hero focal per không gian. Ít nhưng đúng chất.' },
        { wrong: 'Nhiều vật liệu cùng lúc: hơn 3 vật liệu / không gian mà không có hierarchy = loạn.', right: 'Shadow gap 3–5mm tại mọi điểm chuyển tiếp vật liệu.' },
        { wrong: 'Cool white bất kỳ điểm nào: làm chết vật liệu organic — gỗ, đá, vải trông như nhựa.', right: 'Indirect lighting 2700K, không nhìn thấy nguồn, dimmer tất cả layers.' },
        { wrong: 'Visible logos, bold colors: insecure luxury. Khách hàng DQH không cần chứng minh.', right: 'Warm neutrals: greige, taupe, sand, charcoal. 3 tông / không gian.' },
        { wrong: 'Excessive ornamentation: trang trí rườm rà che giấu sự thiếu tự tin về tỷ lệ.', right: 'Texture xen kẽ: matte → grain → tactile → smooth — không 2 cùng loại cạnh nhau.' },
        { wrong: '2 vật liệu cùng texture cạnh nhau: 2 matte, 2 gloss = flat, mất chiều sâu.', right: 'Hidden storage: không nhìn thấy dấu vết sinh hoạt. Mọi thứ có chỗ cất.' },
        { wrong: 'Bản vẽ thiếu dimension khe: nhà thầu tự quyết = sai. Khe là chữ ký.', right: 'Dimension trên bản vẽ: mọi khe, joint, gap phải ghi số cụ thể.' },
        { wrong: 'Trendy materials theo Pinterest: nếu đang viral → chờ 2 năm trước khi dùng.', right: 'Proportion trước decoration: tỷ lệ đúng → không cần trang trí.' }
      ]
    }
  }
];

async function run() {
  console.log('=== Seed 2.2 Ngôn ngữ Thiết kế — Full content from HTML ===\n');

  // Delete old subsections
  const { data: old } = await sb.from('training_subsections').select('id').eq('section_id', SECTION_ID);
  if (old && old.length > 0) {
    await sb.from('training_subsections').delete().eq('section_id', SECTION_ID);
    console.log(`Deleted ${old.length} old subsections`);
  }

  // Insert new
  for (let i = 0; i < SUBSECTIONS.length; i++) {
    const sub = SUBSECTIONS[i];
    const { error } = await sb.from('training_subsections').insert({
      section_id: SECTION_ID,
      heading: sub.heading,
      content_type: sub.content_type,
      content: sub.content,
      metadata: sub.metadata,
      sort_order: i + 1
    });
    if (error) console.error(`❌ ${sub.heading}:`, error.message);
    else console.log(`✅ ${i + 1}. ${sub.heading}`);
  }

  console.log(`\n✅ Đã seed ${SUBSECTIONS.length} subsections cho 2.2 Ngôn ngữ Thiết kế`);
}

run();
