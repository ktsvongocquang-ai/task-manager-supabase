import { SectionHeader, NeedsInput } from './shared';

// Dữ liệu dưới đây lấy từ chính nội dung "Pháp lý & định hình uy tín" đã có
// sẵn trên bản cũ của trang (Công ty TNHH Kiến Trúc & Nội Thất DQH, MST,
// showroom Quận 7, xưởng Bình Chánh, ngày thành lập 30/12/2020) — đây là
// thông tin doanh nghiệp đã công bố sẵn, không phải số liệu demo bịa, nên
// giữ lại thay vì đánh [cần điền]. Chỉ "Thể loại công trình" là nội dung
// thật sự chưa có trong bản cũ.
const COMPANY_STATS = [
  { label: 'Thời gian thành lập', value: '30/12/2020', note: '4+ năm hoạt động', needs: null },
  { label: 'Quy mô', value: 'Xưởng 1.500m²', note: 'Xưởng sản xuất nội thất DQH tại Bình Chánh', needs: null },
  { label: 'Địa chỉ', value: 'Quận 7, TP.HCM', note: 'Showroom & văn phòng — nơi trưng bày mẫu vật liệu thật', needs: null },
  { label: 'Thể loại công trình', value: null, note: null, needs: 'VD: nhà phố, villa, chung cư, resort...' },
];

// Công ty TNHH Kiến Trúc & Nội Thất DQH — MST 03168894xx (giữ nguyên định
// dạng đã hiển thị công khai trên bản cũ).
const LEGAL_NAME = 'Công ty TNHH Kiến Trúc & Nội Thất DQH';
const TAX_CODE = '03168894xx';

export function CompanyInfo() {
  return (
    <section id="section-4" className="px-6 md:px-16 py-32 bg-[#1A1814] text-white border-b border-white/5">
      <div className="max-w-6xl mx-auto">
        <SectionHeader eyebrow="(HỒ SƠ NĂNG LỰC)" title="Thông tin công ty" accent="DQH Architects" dark />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {COMPANY_STATS.map((stat, idx) => (
            <div key={idx} className="space-y-2 border-t border-white/10 pt-6">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#8A8070] font-semibold">{stat.label}</p>
              {stat.value ? (
                <>
                  <p className="font-serif text-2xl font-light text-[#F5F2EC]">{stat.value}</p>
                  <p className="text-xs text-[#8A8070]">{stat.note}</p>
                </>
              ) : (
                <NeedsInput label={stat.needs ?? stat.label.toLowerCase()} />
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-[#8A8070] mt-12 pt-8 border-t border-white/10">
          <strong className="text-[#C4C0B8]">{LEGAL_NAME}</strong> — Mã số thuế: {TAX_CODE} do Sở Kế hoạch và Đầu tư TP.HCM cấp. Mọi giao dịch hợp đồng thiết kế, báo giá và thi công đều được thực hiện minh bạch qua pháp nhân doanh nghiệp.
        </p>
      </div>
    </section>
  );
}
