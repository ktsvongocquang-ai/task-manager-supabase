import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function addJobDescriptions() {
  console.log('=== THÊM MÔ TẢ VỊ TRÍ NHÂN SỰ (9 vị trí) ===\n');

  // Tìm section 1.6
  const { data: sec } = await sb.from('training_sections').select('id').eq('number', '1.6').single();
  if (!sec) { console.log('❌ Không tìm thấy section 1.6'); return; }

  // Cập nhật title
  await sb.from('training_sections').update({ title: 'Mô tả công việc (9 Vị trí)' }).eq('id', sec.id);

  // Xóa subsections cũ
  await sb.from('training_subsections').delete().eq('section_id', sec.id);
  console.log('✅ Đã xóa subsections cũ của 1.6');

  const positions = [
    {
      slug: 'ceo-founder',
      heading: 'CEO / Founder',
      items: [
        { title: 'A. Định hướng & Chiến lược', body: '• A1. Xây dựng định hướng phát triển công ty theo từng giai đoạn 6 tháng / 1 năm\n• A2. Xây dựng và duy trì văn hóa công ty, chuẩn thương hiệu Quiet Luxury\n• A3. Phê duyệt chiến lược marketing, định vị thương hiệu và kênh truyền thông' },
        { title: 'B. Vận hành & Kiểm soát', body: '• B1. Phê duyệt hợp đồng lớn, quyết định tuyển dụng và đầu tư trước khi thực hiện\n• B2. Review KPI toàn công ty hàng tuần — không xử lý vận hành thay team\n• B3. Phân bổ nguồn lực nhân sự và tài chính giữa các dự án\n• B4. Ra quyết định xử lý khủng hoảng: phát sinh lớn, khiếu nại, rủi ro pháp lý' },
        { title: 'C. Quan hệ & Phát triển', body: '• C1. Gặp gỡ khách hàng VIP và đối tác chiến lược khi cần thiết\n• C2. Tuyển dụng và đánh giá nhân sự cấp trưởng nhóm trở lên\n• C3. Xây dựng hệ thống vận hành nội bộ: quy trình, công cụ, tiêu chuẩn' },
        { title: 'D. Tài chính', body: '• D1. Kiểm soát báo cáo doanh thu, chi phí, lợi nhuận định kỳ hàng tháng\n• D2. Giám sát dòng tiền và phê duyệt ngân sách vận hành hàng tháng' },
      ],
    },
    {
      slug: 'senior-designer',
      heading: 'Senior Designer / Design Leader',
      items: [
        { title: 'A. Tiền Thiết Kế', body: '• A1. Gặp trực tiếp khách hàng thu thập brief: nhu cầu, gu thẩm mỹ, ngân sách, timeline\n• A2. Phân tích hiện trạng mặt bằng: kích thước, ánh sáng, hệ thống kỹ thuật có sẵn\n• A3. Lên layout mặt bằng sơ bộ, tối ưu công năng và bố trí nội thất\n• A4. Dự trù ngân sách thiết kế – thi công sơ bộ phù hợp concept định hướng' },
        { title: 'B. Concept', body: '• B1. Xây dựng concept tổng thể: phong cách, vật liệu, bảng màu chủ đạo\n• B2. Thiết kế và trình bày brochure concept cho khách hàng duyệt\n• B3. Thuyết trình, chốt concept với khách trước khi chuyển bước triển khai' },
        { title: 'C. Triển Khai', body: '• C1. Giao brief đầy đủ bằng văn bản cho Designer và 3D Visualizer — không truyền miệng\n• C2. Theo sát và duyệt phối cảnh 3D trước khi trình khách\n• C3. Xác nhận tính khả thi thi công dựa trên concept và bản vẽ\n• C4. Họp điều phối định kỳ với Sale, Giám sát, 3D, Kỹ thuật' },
        { title: 'D. Phát Triển Đội Ngũ', body: '• D1. Đào tạo và định hướng phong cách thiết kế chung cho toàn team\n• D2. Cập nhật xu hướng thiết kế, vật liệu mới và đưa vào ứng dụng thực tế' },
      ],
    },
    {
      slug: 'designer',
      heading: 'Designer',
      items: [
        { title: 'A. Tiếp Nhận', body: '• A1. Tiếp nhận và phân tích brief từ Leader — đặt câu hỏi ngay nếu thiếu thông tin\n• A2. Nghiên cứu tham khảo phong cách, vật liệu phù hợp concept được giao' },
        { title: 'B. Thiết Kế', body: '• B1. Dựng phối cảnh 3D bám sát concept đã được Leader phê duyệt\n• B2. Lên bản vẽ kỹ thuật 2D thi công: mặt bằng, mặt đứng, mặt cắt\n• B3. Vẽ chi tiết cấu tạo nội thất: tủ, kệ, đồ gắn tường, trần thạch cao\n• B4. Lập bảng vật liệu và phụ kiện kèm ghi chú khả năng thi công\n• B5. Đảm bảo đồng bộ giữa hình ảnh 3D và bản vẽ kỹ thuật 2D' },
        { title: 'C. Phối Hợp Thi Công', body: '• C1. Phối hợp với Giám sát và xưởng giải thích bản vẽ khi cần\n• C2. Hỗ trợ chỉnh sửa bản vẽ khi có phát sinh trong quá trình thi công\n• C3. Tham gia nghiệm thu, kiểm tra kết quả thi công so với thiết kế' },
        { title: 'D. Lưu Trữ & Bàn Giao', body: '• D1. Cập nhật hồ sơ khi có thay đổi, version hóa file rõ ràng trên Drive\n• D2. Bàn giao hồ sơ thiết kế hoàn chỉnh (CAD, render, bảng vật liệu) khi kết thúc dự án' },
      ],
    },
    {
      slug: '3d-visualizer',
      heading: '3D Visualizer / Diễn Họa',
      items: [
        { title: 'A. Tiếp Nhận & Chuẩn Bị', body: '• A1. Tiếp nhận file SketchUp và brief đầy đủ từ Designer — không nhận thông tin miệng\n• A2. Dựng mô hình 3D đúng tỉ lệ, đúng layout theo bản vẽ được cung cấp' },
        { title: 'B. Sản Xuất Hình Ảnh', body: '• B1. Áp vật liệu, texture, màu sắc đúng theo bảng vật liệu và concept đã duyệt\n• B2. Thiết lập ánh sáng thực tế (tự nhiên + nhân tạo) phù hợp từng không gian\n• B3. Render phối cảnh các góc nhìn chính theo yêu cầu dự án\n• B4. Chỉnh sửa hậu kỳ bằng Photoshop để đạt chuẩn thẩm mỹ DQH' },
        { title: 'C. Duyệt & Xuất Bản', body: '• C1. Trình Leader duyệt trước khi xuất file cho khách hoặc marketing\n• C2. Chỉnh sửa theo góp ý — không tự thay đổi phong cách ngoài yêu cầu\n• C3. Sản xuất hình ảnh phiên bản marketing đúng tỉ lệ và độ phân giải từng kênh' },
        { title: 'D. Lưu Trữ & Phối Hợp', body: '• D1. Lưu file nguồn (SKP, MAX) và file xuất theo cấu trúc thư mục dự án trên Drive\n• D2. Cập nhật thư viện 3D nội bộ (model, vật liệu) để tái sử dụng cho dự án sau\n• D3. Phối hợp với Designer đảm bảo hình ảnh render đồng bộ với bản vẽ kỹ thuật' },
      ],
    },
    {
      slug: 'drafter',
      heading: 'Drafter / Triển Khai Bản Vẽ',
      items: [
        { title: 'A. Tiếp Nhận', body: '• A1. Tiếp nhận nhiệm vụ từ Designer bằng checklist cụ thể — xác nhận rõ trước khi làm' },
        { title: 'B. Triển Khai Bản Vẽ', body: '• B1. Vẽ mặt bằng tổng thể: bố trí nội thất, phân vùng không gian, ghi kích thước đầy đủ\n• B2. Vẽ mặt đứng các phòng: cao độ, vật liệu ốp tường, nội thất gắn tường\n• B3. Vẽ mặt cắt chi tiết các khu vực phức tạp: bếp, phòng tắm, tủ âm tường\n• B4. Vẽ chi tiết cấu tạo: tủ bếp, tủ quần áo, kệ trang trí, trần thạch cao\n• B5. Ghi chú vật liệu, mã màu, phụ kiện đầy đủ trên từng bản vẽ\n• B6. Đảm bảo bản vẽ đúng tỉ lệ in ấn, có khung tên, đánh số trang thống nhất' },
        { title: 'C. Kiểm Tra & Phối Hợp', body: '• C1. Phát hiện mâu thuẫn giữa 3D và bản vẽ kỹ thuật → báo ngay Designer, không tự xử lý\n• C2. Hỗ trợ Designer cập nhật bản vẽ khi có phát sinh thay đổi trong thi công' },
        { title: 'D. Đóng Gói & Bàn Giao', body: '• D1. Tổng hợp và đóng gói hồ sơ bản vẽ theo từng giai đoạn dự án\n• D2. Xuất file PDF (in ấn) và DWG (kỹ thuật) riêng biệt trước khi bàn giao\n• D3. Lưu file theo cấu trúc thư mục dự án, version hóa rõ ràng sau mỗi lần chỉnh sửa' },
      ],
    },
    {
      slug: 'project-manager',
      heading: 'Project Manager / Giám Sát Thi Công',
      items: [
        { title: 'A. Chuẩn Bị Thi Công', body: '• A1. Đọc và nắm toàn bộ hồ sơ thiết kế trước khi bắt đầu — không thi công khi chưa đủ bản vẽ\n• A2. Lập kế hoạch tiến độ thi công chi tiết theo từng hạng mục' },
        { title: 'B. Quản Lý Thi Công', body: '• B1. Giám sát nhà thầu và thợ: đúng kỹ thuật, đúng vật liệu, đúng bản vẽ\n• B2. Kiểm tra vật liệu nhập công trình: chủng loại, số lượng, chất lượng so với BOQ\n• B3. Điều phối các nhà thầu tránh xung đột tiến độ giữa các hạng mục\n• B4. Mọi thay đổi so với bản vẽ phải được Designer xác nhận bằng văn bản trước khi thi công' },
        { title: 'C. Báo Cáo & Xử Lý Phát Sinh', body: '• C1. Cập nhật nhật ký công trình hằng ngày: ảnh tiến độ + ghi chú phát sinh lên Zalo nhóm dự án\n• C2. Báo cáo phát sinh cho Leader/CEO ngay trong ngày — không để tồn đọng\n• C3. Theo dõi và kiểm soát chi phí thi công thực tế so với BOQ đã ký' },
        { title: 'D. Nghiệm Thu & Bàn Giao', body: '• D1. Kiểm tra nghiệm thu từng hạng mục trước khi chuyển bước thi công tiếp theo\n• D2. Lập biên bản nghiệm thu và xử lý bảo hành sau bàn giao\n• D3. Bàn giao công trình cho khách: hướng dẫn sử dụng, cung cấp hồ sơ hoàn công' },
      ],
    },
    {
      slug: 'sales-marketing',
      heading: 'Sales & Marketing',
      items: [
        { title: 'A. Tìm Kiếm & Tiếp Cận', body: '• A1. Tiếp nhận và phân loại khách tiềm năng — phản hồi trong vòng 30 phút giờ hành chính\n• A2. Tư vấn sơ bộ qua Zalo/điện thoại: khai thác nhu cầu, ngân sách, timeline\n• A3. Lên kế hoạch nội dung marketing hàng tháng, theo dõi KPI kênh và báo cáo CEO' },
        { title: 'B. Tư Vấn & Chốt Hợp Đồng', body: '• B1. Hẹn lịch khảo sát và dẫn đội thiết kế đến hiện trường\n• B2. Gửi brief đầy đủ cho Leader thiết kế bằng văn bản sau buổi khảo sát\n• B3. Gửi báo giá sơ bộ và trình bày gói dịch vụ phù hợp với từng khách\n• B4. Trình bày concept cùng Leader, đàm phán và chốt hợp đồng' },
        { title: 'C. Theo Dõi Trong Dự Án', body: '• C1. Theo dõi tiến độ thanh toán, nhắc khách trước hạn và xử lý chậm thanh toán\n• C2. Xử lý phát sinh và thay đổi yêu cầu trong thi công, cập nhật hợp đồng nếu cần\n• C3. Bàn giao đầy đủ hồ sơ khách hàng cho CSKH sau khi ký hợp đồng' },
        { title: 'D. Hậu Mãi & Phát Triển', body: '• D1. Xin feedback sau bàn giao và khai thác referral trong vòng 2 tuần\n• D2. Quản lý CRM: cập nhật trạng thái từng khách, phân loại theo giai đoạn' },
      ],
    },
    {
      slug: 'ke-toan',
      heading: 'Kế Toán',
      items: [
        { title: 'A. Thu – Chi', body: '• A1. Lập và theo dõi lịch thu tiền theo từng đợt thanh toán của từng hợp đồng\n• A2. Nhắc Sale và CSKH đốc thúc thu tiền trước hạn 3–5 ngày\n• A3. Kiểm tra và thanh toán chi phí nhà thầu, vật tư theo đề nghị của Giám sát\n• A4. Lập phiếu chi, phiếu thu đầy đủ chứng từ cho mọi giao dịch' },
        { title: 'B. Kiểm Soát Tài Chính', body: '• B1. Ghi nhận công nợ phải thu, phải trả theo từng dự án — cập nhật hằng ngày\n• B2. Đối chiếu thực chi từng dự án so với ngân sách đã duyệt, báo cáo ngay khi vượt 10%\n• B3. Kiểm soát dòng tiền: đảm bảo luôn đủ tiền vận hành, cảnh báo sớm khi thiếu hụt' },
        { title: 'C. Nhân Sự & Thuế', body: '• C1. Tính lương, thưởng và các khoản phụ cấp cho toàn bộ nhân sự hàng tháng\n• C2. Kê khai và nộp thuế đúng hạn: VAT, thuế TNCN, thuế môn bài' },
        { title: 'D. Báo Cáo & Lưu Trữ', body: '• D1. Lập báo cáo doanh thu, chi phí, lợi nhuận theo tháng/quý trình CEO\n• D2. Lưu trữ chứng từ kế toán đầy đủ, đúng quy định — bản cứng và bản số trên Drive\n• D3. Phối hợp kiểm toán nội bộ hoặc bên ngoài khi có yêu cầu' },
      ],
    },
    {
      slug: 'cskh',
      heading: 'Chăm Sóc Khách Hàng (CSKH)',
      items: [
        { title: 'A. Tiếp Nhận Dự Án', body: '• A1. Tiếp nhận bàn giao hồ sơ khách từ Sale sau khi ký hợp đồng — nắm rõ toàn bộ thông tin trước khi liên hệ khách\n• A2. Làm đầu mối liên lạc chính giữa khách hàng và các bộ phận trong suốt dự án' },
        { title: 'B. Theo Dõi & Cập Nhật', body: '• B1. Chủ động cập nhật tiến độ dự án cho khách ít nhất 1 lần/tuần — không để khách hỏi trước\n• B2. Ghi nhận và chuyển đúng bộ phận xử lý mọi yêu cầu/phàn nàn của khách trong ngày\n• B3. Theo dõi tiến độ xử lý phản hồi — đảm bảo khách nhận phản hồi trong 24h\n• B4. Phối hợp với Giám sát tổ chức các buổi kiểm tra công trình cùng khách' },
        { title: 'C. Bàn Giao & Bảo Hành', body: '• C1. Hỗ trợ khách chuẩn bị và bàn giao mặt bằng trước khi thi công\n• C2. Xử lý bảo hành sau bàn giao: tiếp nhận, điều phối và theo dõi đến khi hoàn tất\n• C3. Xin feedback sau bàn giao bằng form chuẩn, tổng hợp gửi CEO hàng tháng' },
        { title: 'D. Phát Triển Quan Hệ', body: '• D1. Khai thác referral và giới thiệu dịch vụ tái thiết kế với khách cũ\n• D2. Lưu trữ toàn bộ hồ sơ khách hàng trên Drive và CRM sau khi dự án kết thúc\n• D3. Báo cáo chỉ số hài lòng khách hàng định kỳ hàng tháng cho CEO' },
      ],
    },
  ];

  const subsections = positions.map((pos, i) => ({
    section_id: sec.id,
    slug: pos.slug,
    heading: pos.heading,
    content: null,
    content_type: 'items',
    metadata: { items: pos.items },
    sort_order: i + 1,
  }));

  const { error } = await sb.from('training_subsections').insert(subsections);
  if (error) console.log('❌ Lỗi:', error.message);
  else console.log(`✅ Đã thêm ${positions.length} vị trí vào section 1.6`);

  positions.forEach((p, i) => console.log(`  ${i+1}. ${p.heading} (${p.items.length} nhóm nhiệm vụ)`));
  console.log('\n=== HOÀN TẤT ===');
}

addJobDescriptions();
