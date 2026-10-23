import { useState } from 'react';
import { SectionHeader } from './shared';

interface WorkflowStep {
  step: string;
  title: string;
  duration: string;
  executor: string;
  details: string;
}

// Giữ cấu trúc quy trình 8 bước đã dùng (khảo sát → bảo hành), nội dung mô
// tả giữ nguyên vì không phải số liệu kinh doanh cần thay — chỉ bỏ phần gắn
// case-study cụ thể, dùng chung cho mọi loại công trình.
const WORKFLOW_STEPS: WorkflowStep[] = [
  { step: '01', title: 'Khảo sát & Tư vấn', duration: 'Trong 48 giờ', executor: 'KTS phụ trách & PM', details: 'Đo đạc hiện trạng bằng máy quét laser, phỏng vấn chuyên sâu thói quen sinh hoạt của gia đình, phân tích hướng nắng hướng gió, đề xuất mặt bằng công năng 2D sơ bộ hoàn toàn miễn phí.' },
  { step: '02', title: 'Thiết kế Concept 3D', duration: '7 - 14 Ngày', executor: 'Team Concept & Creative Director', details: 'Lên phối cảnh 3D các không gian chính, dựng moodboard bảng mẫu vật liệu thực tế, cân đối ánh sáng ảo. Hỗ trợ chỉnh sửa đến khi gia chủ hài lòng.' },
  { step: '03', title: 'Bản vẽ Kỹ thuật & BOQ', duration: '10 - 15 Ngày', executor: 'Kỹ sư cơ điện & Bộ phận dự toán', details: 'Triển khai bộ bản vẽ chi tiết thi công, lập bảng bóc tách khối lượng BOQ chính xác đến từng con ốc, mã sơn và ray trượt. Cam kết chi phí BOQ cố định, không phát sinh chi phí ẩn.' },
  { step: '04', title: 'Ký hợp đồng & Kick-off', duration: '1 - 2 Ngày', executor: 'Ban giám đốc & Toàn bộ team dự án', details: 'Ký hợp đồng thi công với tổng giá cố định, lịch thanh toán theo milestone rõ ràng và điều khoản phạt trễ tiến độ. Họp khởi động dự án giới thiệu KTS, Kỹ sư kết cấu và Giám sát hiện trường với gia chủ.' },
  { step: '05', title: 'Thi công phần thô', duration: '60 - 90 Ngày', executor: 'Đội ngũ kỹ sư & Giám sát hiện trường', details: 'Đổ bê tông cốt thép móng kết cấu, đi hệ thống ME&P. Test ngâm nước toilet và ban công 72 giờ, mời gia chủ nghiệm thu trực tiếp trước khi lấp nền.' },
  { step: '06', title: 'Hoàn thiện & Nội thất', duration: '30 - 45 Ngày', executor: 'Xưởng gỗ DQH & Đội hoàn thiện', details: 'Sản xuất nội thất gỗ theo bản vẽ CAD tại xưởng, sơn phủ mờ mộc tự nhiên. Vận chuyển lắp ráp tại công trình, kiểm tra khớp shadow line 3mm chuyển tiếp tường thạch cao.' },
  { step: '07', title: 'Nghiệm thu & Bàn giao', duration: '7 Ngày', executor: 'Gia chủ & KTS trưởng', details: 'Cùng gia chủ rà soát checklist nghiệm thu từng chi tiết. Khắc phục toàn bộ lỗi nhỏ (defect list) trước khi chính thức bàn giao hồ sơ hoàn công và chìa khóa.' },
  { step: '08', title: 'Bảo hành & Chăm sóc sau', duration: 'Bảo hành kết cấu 10 năm', executor: 'Hotline 24/7 của DQH', details: 'Bảo hành kết cấu 10 năm, chống thấm 5 năm, hoàn thiện nội thất 5 năm. Phản hồi bảo trì trong 2 giờ làm việc, kỹ thuật viên có mặt xử lý tại hiện trường trong 24-48 giờ.' },
];

export function WorkflowSteps() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section id="section-2" className="px-6 md:px-16 py-32 bg-[#F8F5F0] border-b border-[#2C2920]/5">
      <div className="max-w-4xl mx-auto">
        <SectionHeader eyebrow="(VẬN HÀNH CHI TIẾT)" title="Quy trình làm việc" accent="từ khảo sát đến bàn giao" />

        <div className="divide-y divide-[#2C2920]/10">
          {WORKFLOW_STEPS.map(step => {
            const isOpen = expanded === step.step;
            return (
              <div key={step.step} className="py-6">
                <button
                  onClick={() => setExpanded(isOpen ? null : step.step)}
                  className="w-full flex items-start justify-between gap-6 text-left cursor-pointer"
                >
                  <div className="flex items-start gap-5">
                    <span className="font-serif italic text-xl text-[#B8913A] shrink-0 w-8">{step.step}</span>
                    <div>
                      <h3 className="font-sans font-bold text-base text-[#2C2920]">{step.title}</h3>
                      <p className="text-xs text-[#8A8070] mt-1">{step.duration} · {step.executor}</p>
                    </div>
                  </div>
                  <span className="text-[#B8913A] text-lg shrink-0">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <p className="text-xs text-[#8A8070] leading-relaxed mt-4 ml-13 pl-[2.6rem] max-w-2xl">
                    {step.details}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
