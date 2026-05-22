import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const CHECKLISTS = [
  {
    phase: "① Khảo sát hiện trạng",
    actions: [
      "Bản vẽ hiện trạng mặt bằng (đo kích thước thực tế, sai số ≤ 1cm)",
      "Ảnh chụp hiện trạng mỗi phòng (≥ 4 góc/phòng), đánh số thứ tự",
      "Ghi nhận vị trí cột, dầm, hộp kỹ thuật, ống thoát nước",
      "Đo cao độ trần (thô), sàn hoàn thiện → tính chiều cao sử dụng",
      "Kiểm tra hệ thống điện hiện hữu: vị trí CB, nguồn 1 pha / 3 pha",
      "Ghi nhận vị trí cấp thoát nước, gas (bếp), điều hòa outdoor",
      "Lập Intake Questionnaire: nhu cầu KH, số thành viên, phong cách, budget",
      "Xác nhận hướng ban công, ánh sáng tự nhiên, view",
    ]
  },
  {
    phase: "② Concept – công năng",
    actions: [
      "Mood board phong cách (≥ 10 hình tham khảo, tone màu chủ đạo)",
      "Concept statement (1 trang A4): ý tưởng, cảm hứng, keyword thiết kế",
      "Mặt bằng bố trí nội thất (2–3 phương án) kèm giải thích ưu nhược",
      "Phân vùng công năng rõ ràng: public / private / service",
      "Material direction sơ bộ: gỗ, đá, vải, kim loại → chỉ định hướng",
      "Kiểm tra kích thước chuẩn: lối đi ≥ 800, khoảng cách sofa-TV, bàn ăn",
      "Xác nhận thiết bị lớn cần bố trí: tủ lạnh side-by-side, máy giặt, điều hòa",
      "Ghi chú đặc biệt: phong thủy, thú cưng, trẻ nhỏ, người cao tuổi",
    ]
  },
  {
    phase: "③ Triển khai 2D layout",
    actions: [
      "Mặt bằng bố trí nội thất chốt (trên CAD hoặc Revit, đúng tỉ lệ)",
      "Mặt bằng trần: khe đèn, khe rèm (200–250mm), khe lạnh điều hòa",
      "Mặt bằng điện: vị trí ổ cắm, công tắc (cao 1200 từ FFL), đèn",
      "Mặt bằng sàn: hướng lát, line chia gạch, khe co giãn",
      "Mặt bằng cấp thoát nước: vị trí lavabo, WC, bếp, máy giặt",
      "Layer đặt tên đúng chuẩn công ty (DQH_xxx)",
      "Kiểm tra khoảng cách đi lại, mở cửa không va chạm đồ",
      "Ghi chú kích thước hộc tủ, vị trí phụ kiện (ray, bản lề, giảm chấn)",
    ]
  },
  {
    phase: "★ Chốt 2D layout",
    actions: [
      "Biên bản xác nhận layout có chữ ký KH (scan hoặc ký điện tử)",
      "File CAD/Revit layout chốt → lưu vào folder 1_2D, đặt tên V_FINAL",
      "Email/Zalo gửi KH kèm file PDF chốt",
      "Thông báo nội bộ cho team 3D + triển khai bắt đầu giai đoạn tiếp",
      "Ghi nhận mọi yêu cầu thay đổi so với layout trước → log Change",
    ]
  },
  {
    phase: "④ 3D Render – dựng & sửa",
    actions: [
      "Dựng 3D model chính xác theo layout 2D đã chốt (check kích thước)",
      "Render ≥ 3 góc/không gian chính (phòng khách, bếp, ngủ master)",
      "Áp vật liệu đúng Material Direction đã duyệt ở giai đoạn Concept",
      "Kiểm tra ánh sáng tự nhiên + nhân tạo phù hợp mood",
      "Kiểm tra tỉ lệ đồ nội thất trong 3D (so sánh với kích thước thực)",
      "Chuẩn bị file trình bày KH (PDF hoặc Presentation deck)",
      "Ghi nhận phản hồi KH sau mỗi vòng sửa (tối đa 2 vòng chỉnh sửa)",
      "Xác nhận vật liệu đặc biệt cần order sớm (đá tự nhiên, gỗ đặc biệt)",
    ]
  },
  {
    phase: "★ Chốt 3D",
    actions: [
      "Biên bản xác nhận 3D có chữ ký KH",
      "File Render final lưu vào folder 9_Render, resolution ≥ 3000px",
      "Material Schedule sơ bộ: tên vật liệu, mã, nhà cung cấp, đơn giá",
      "Ghi nhận tất cả thay đổi so với layout → cập nhật lại 2D nếu có",
      "Xác nhận điểm tiếp giáp vật liệu: sàn gỗ – gạch, trần – tường",
    ]
  },
  {
    phase: "⑤ Lập báo giá thi công",
    actions: [
      "BOQ (Bill of Quantities) chi tiết: đơn vị, khối lượng, đơn giá, thành tiền",
      "Phân tách rõ: phần thô, phần hoàn thiện, nội thất cố định, đồ rời",
      "Danh sách phụ kiện: bản lề, ray, tay nắm, giảm chấn → mã + giá",
      "Bảng cutting list gỗ công nghiệp (nếu có xưởng tự sản xuất)",
      "Dự toán MEP: điện, nước, điều hòa → hoặc báo giá thầu phụ",
      "Timeline thi công sơ bộ (Gantt chart đơn giản)",
      "Ghi rõ điều khoản: bảo hành, thanh toán, phát sinh",
      "So sánh ≥ 2 báo giá nhà thầu phụ cho hạng mục lớn",
    ]
  },
  {
    phase: "★ Chốt báo giá",
    actions: [
      "Biên bản xác nhận báo giá có chữ ký KH",
      "Hợp đồng thi công ký chính thức (hoặc phụ lục HĐ thiết kế)",
      "Lịch thanh toán theo đợt rõ ràng",
      "Xác nhận vật liệu cần đặt hàng trước (lead time > 2 tuần)",
      "Email thông báo nội bộ: chốt giá → bắt đầu triển khai hồ sơ 2D",
    ]
  },
  {
    phase: "⑥ Hồ sơ 2D + vật liệu + TB",
    actions: [
      "Full set bản vẽ: mặt bằng, mặt đứng mỗi tường, mặt cắt chi tiết",
      "Chi tiết tủ bếp: mặt bằng, mặt đứng, mặt cắt, vị trí thiết bị bếp",
      "Chi tiết tủ quần áo: chia ngăn, vị trí thanh treo, ngăn kéo, phụ kiện",
      "Chi tiết WC: vị trí sen, lavabo, WC, ống xả, hộp kỹ thuật",
      "Bảng thống kê vật liệu hoàn thiện (Material Schedule Final)",
      "Bảng thống kê thiết bị điện, nước, PCCC, điều hòa",
      "Shop drawing cho xưởng (nếu sản xuất nội thất tại xưởng riêng)",
      "Phối hợp MEP: bản vẽ điện, nước, HVAC → check chồng chéo",
    ]
  },
  {
    phase: "★ Chốt hồ sơ 2D",
    actions: [
      "KH ký xác nhận toàn bộ hồ sơ (từng trang hoặc trang bìa)",
      "Lưu trữ file final vào folder 1_2D + 5_PDF",
      "In bản vẽ ≥ 2 bộ (1 cho công trường, 1 cho văn phòng)",
      "Gửi file cho đội thi công + xưởng sản xuất",
      "Họp brief bàn giao TK → TC (Meeting Minutes bắt buộc)",
      "Mọi thay đổi sau chốt = Change Order có chữ ký",
    ]
  },
  {
    phase: "⑦ Thi công tại căn hộ",
    actions: [
      "Lịch thi công chi tiết (Gantt chart tuần)",
      "Kiểm tra vật liệu đầu vào trước khi thi công (đúng mẫu, mã, số lượng)",
      "Giám sát hàng ngày: ảnh tiến độ gửi group ≥ 2 lần/ngày",
      "Kiểm tra cao độ, kích thước thực tế so với bản vẽ (sai số ≤ 2mm)",
      "Punch list hàng tuần: ghi nhận lỗi, sai lệch, cần sửa",
      "Phối hợp nhà thầu phụ (MEP, sàn, trần) → tránh chồng chéo",
      "Quản lý phát sinh: lập biên bản + báo giá trong 24h",
      "Bảo vệ vật liệu đã hoàn thiện (che phủ sàn, tường, kính)",
    ]
  },
  {
    phase: "⑦ Lên hàng nội thất (xưởng)",
    actions: [
      "Kiểm tra shop drawing trước khi sản xuất (Leader ký duyệt)",
      "Xác nhận mẫu vật liệu: màu sơn, laminate, phụ kiện",
      "Sản xuất mẫu thử (mockup) cho hạng mục đặc biệt",
      "QC kiểm tra chất lượng trước khi đóng gói: cạnh, mặt, phụ kiện",
      "Đóng gói đúng quy cách, đánh số theo phòng/hạng mục",
      "Lịch giao hàng phối hợp với tiến độ thi công hiện trường",
      "Danh sách phụ kiện đi kèm mỗi tủ/kệ: ốc vít, ke, ray",
      "Ảnh chụp sản phẩm trước khi xuất xưởng (gửi KH xác nhận)",
    ]
  },
  {
    phase: "⑧ Lắp đặt & hoàn thiện",
    actions: [
      "Kiểm tra mặt bằng sẵn sàng trước khi lắp (sạch, khô, đúng cao độ)",
      "Lắp đặt theo đúng trình tự: tủ bếp → tủ áo → kệ → đồ rời",
      "Kiểm tra khe hở, mối nối giữa các module tủ (≤ 0.5mm)",
      "Kiểm tra hoạt động phụ kiện: cánh cửa mở đóng mượt, ray kéo êm",
      "Lắp thiết bị: đèn, ổ cắm, công tắc, thiết bị vệ sinh",
      "Vệ sinh tổng thể công trình",
      "Punch list cuối: check từng hạng mục với bản vẽ",
      "Styling đồ trang trí (nếu có trong hợp đồng)",
    ]
  },
  {
    phase: "★ Nghiệm thu & bàn giao",
    actions: [
      "Biên bản nghiệm thu chi tiết từng hạng mục (KH ký từng mục)",
      "Bàn giao chìa khóa, remote, tài liệu hướng dẫn sử dụng",
      "Bàn giao bộ bản vẽ hoàn công (As-built drawings)",
      "Phiếu bảo hành: ghi rõ thời hạn, phạm vi, điều kiện",
      "Ảnh chụp hoàn thiện chuyên nghiệp (cho portfolio + gửi KH)",
      "Lịch bảo trì định kỳ: tuần 1, tháng 1, tháng 6, năm 1",
      "Feedback form gửi KH đánh giá dịch vụ",
      "Đóng dự án: archive file vào folder theo chuẩn",
    ]
  },
];

async function seedChecklists() {
  console.log('=== SEED CHECKLIST ĐẦU RA CHO BẢNG PHỐI HỢP ===\n');

  // Find the coordination workflow (3.3)
  const { data: wf } = await sb
    .from('training_workflows')
    .select('id')
    .eq('slug', 'coordination-process')
    .single();

  if (!wf) {
    console.error('Không tìm thấy workflow coordination-process');
    return;
  }

  console.log('Workflow ID:', wf.id);

  // Delete existing steps for this workflow
  await sb.from('training_workflow_steps').delete().eq('workflow_id', wf.id);
  console.log('Đã xóa steps cũ.\n');

  // Insert each checklist as a workflow step
  for (let i = 0; i < CHECKLISTS.length; i++) {
    const cl = CHECKLISTS[i];
    const { error } = await sb.from('training_workflow_steps').insert({
      workflow_id: wf.id,
      phase: cl.phase,
      owner: null,
      actions: cl.actions,
      sort_order: i + 1,
    });

    if (error) {
      console.error(`❌ Lỗi insert "${cl.phase}":`, error.message);
    } else {
      console.log(`✅ ${cl.phase} — ${cl.actions.length} mục checklist`);
    }
  }

  console.log(`\n🎉 Hoàn thành! Đã seed ${CHECKLISTS.length} checklist (${CHECKLISTS.reduce((s, c) => s + c.actions.length, 0)} mục tổng cộng).`);
}

seedChecklists();
