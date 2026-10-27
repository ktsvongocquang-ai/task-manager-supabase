import { useState } from 'react';
import { SectionHeader } from './shared';

interface FAQItem {
  question: string;
  answer: string;
}

// 10 câu hỏi thường gặp về công ty & quy trình — nội dung bám theo đúng những
// gì các section khác trên trang đã nói (Chi phí, Quy trình, Đội ngũ, Công ty),
// không bịa số liệu/cam kết mới. Khi cần sửa nội dung, sửa trực tiếp mảng này.
const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'DQH Architects là đơn vị làm việc theo mô hình nào?',
    answer:
      'DQH làm Design & Build trọn gói — một đội ngũ phụ trách xuyên suốt từ thiết kế kiến trúc, nội thất đến thi công và bàn giao, thay vì phải làm việc qua nhiều đơn vị rời rạc. Công trình được triển khai theo 1 trong 2 chuẩn dịch vụ DQH hoặc JUX tuỳ loại hình (xem mục "Chi phí thiết kế & thi công" phía trên).',
  },
  {
    question: 'Chuẩn DQH và JUX khác nhau ở điểm nào?',
    answer:
      'Mỗi loại công trình chỉ áp dụng đúng 1 chuẩn dịch vụ để tránh nhầm lẫn: JUX dành cho căn hộ / nhà phố dự án, DQH dành cho nhà phố, villa xây mới. Đơn giá thiết kế, thi công và vật liệu đối tác theo từng chuẩn được liệt kê chi tiết ở mục Chi phí.',
  },
  {
    question: 'Từ lúc liên hệ đến khi bàn giao mất bao lâu?',
    answer:
      'Thời gian thay đổi theo quy mô công trình và loại hình (nội thất & hoàn thiện, hoặc xây dựng trọn gói), chia làm 3 giai đoạn Thiết kế – Thi công – Bàn giao. Mốc thời gian ước tính theo từng bước được thể hiện đầy đủ ở mục "Quy trình làm việc".',
  },
  {
    question: 'Chi phí thiết kế & thi công được tính như thế nào?',
    answer:
      'Đơn giá tham khảo theo m² được niêm yết công khai ở mục Chi phí. Vì mỗi công trình có diện tích và hiện trạng khác nhau, anh/chị có thể dùng công cụ "Khái toán" ngay trên trang để tự ước tính nhanh, báo giá chính xác sẽ dựa trên bản vẽ thực tế.',
  },
  {
    question: 'Công trình có được bảo hành sau khi bàn giao không?',
    answer:
      'Có. Mỗi hạng mục có thời hạn bảo hành riêng, được ghi rõ điều kiện áp dụng trong phiếu bảo hành kèm theo hợp đồng — chi tiết theo từng hạng mục xem ở cuối mục "Quy trình làm việc".',
  },
  {
    question: 'Tôi có thể xem công trình thực tế DQH đã làm không?',
    answer:
      'Có, mục "Công trình tiêu biểu" ở đầu trang tổng hợp các công trình đã hoàn thiện theo từng phân khúc (Chung cư / Nhà phố · Villa). Bấm vào từng công trình để xem Album Kể chuyện — hành trình từ mặt bằng, phối cảnh 3D đến ngày bàn giao.',
  },
  {
    question: 'Ai là người trực tiếp phụ trách dự án của tôi?',
    answer:
      'Một đội ngũ kiến trúc sư, kỹ sư công trường và nghệ nhân đồng hành xuyên suốt dự án — từ bản vẽ đầu tiên đến ngày bàn giao. Thông tin và vai trò từng thành viên được giới thiệu ở mục "Đội ngũ nhân sự".',
  },
  {
    question: 'Hợp đồng và pháp lý có minh bạch không?',
    answer:
      'Mọi giao dịch hợp đồng thiết kế, báo giá và thi công đều thực hiện qua pháp nhân doanh nghiệp của DQH, thông tin pháp lý công khai ở cuối mục "Thông tin công ty".',
  },
  {
    question: 'Tôi cần chuẩn bị gì trước buổi tư vấn đầu tiên?',
    answer:
      'Chỉ cần hình dung sơ bộ về không gian mong muốn, diện tích và ngân sách dự kiến — nếu có sẵn mặt bằng hiện trạng hoặc bản vẽ thì càng tốt. Đội ngũ KTS sẽ trao đổi sâu hơn và tư vấn hướng thiết kế phù hợp ngay trong buổi đầu tiên.',
  },
  {
    question: 'Làm sao để liên hệ trực tiếp với DQH?',
    answer:
      'Anh/chị có thể gọi hotline, chat Zalo ngay trong phần Album Kể chuyện của mỗi công trình, hoặc điền form "Đăng ký tư vấn thiết kế & thi công" ở cuối trang — đội ngũ DQH sẽ liên hệ lại trong vòng 2 giờ.',
  },
];

function FAQRow({ item, index, isOpen, onToggle }: { item: FAQItem; index: number; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-t border-[#2C2920]/10 first:border-t-0">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full min-h-[56px] flex items-start gap-4 py-4 bg-transparent border-0 text-left cursor-pointer"
      >
        <span className="shrink-0 w-7 pt-px font-serif italic text-lg text-[#B8913A]">{String(index + 1).padStart(2, '0')}</span>
        <span className="flex-1 min-w-0 text-[15px] font-medium text-[#2C2920] leading-snug pt-0.5">{item.question}</span>
        <span aria-hidden className="shrink-0 w-4 pt-0.5 text-center text-[#B8913A]">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="pl-11 pr-6 pb-5">
          <p className="m-0 text-sm leading-relaxed text-[#2C2920]/80">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="section-5" className="px-6 md:px-16 py-16 md:py-32 bg-[#F8F5F0] border-b border-[#2C2920]/5">
      <div className="max-w-3xl mx-auto">
        <SectionHeader eyebrow="(HỎI ĐÁP)" title="Câu hỏi thường gặp" accent="về DQH & quy trình" center />
        <div className="mt-4">
          {FAQ_ITEMS.map((item, idx) => (
            <FAQRow
              key={idx}
              item={item}
              index={idx}
              isOpen={openIndex === idx}
              onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
