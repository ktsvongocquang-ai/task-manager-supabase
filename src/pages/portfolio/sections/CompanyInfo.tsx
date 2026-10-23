import { useEffect, useState } from 'react';
import { SectionHeader, NeedsInput } from './shared';
import { landingSupabase } from './landingSupabase';

interface CompanyInfoRow {
  founded_date: string | null;
  scale_value: string | null;
  scale_note: string | null;
  address_value: string | null;
  address_note: string | null;
  project_types: string | null;
  legal_name: string | null;
  tax_code: string | null;
}

export function CompanyInfo() {
  const [info, setInfo] = useState<CompanyInfoRow | null | undefined>(undefined);

  useEffect(() => {
    landingSupabase
      .from('landing_company_info')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => setInfo(data))
      .catch(() => setInfo(null));
  }, []);

  const stats = [
    { label: 'Thời gian thành lập', value: info?.founded_date, note: info?.founded_date ? '4+ năm hoạt động' : null, needs: 'ngày thành lập' },
    { label: 'Quy mô', value: info?.scale_value, note: info?.scale_note, needs: 'quy mô (số nhân sự / xưởng)' },
    { label: 'Địa chỉ', value: info?.address_value, note: info?.address_note, needs: 'địa chỉ showroom / văn phòng' },
    { label: 'Thể loại công trình', value: info?.project_types, note: null, needs: 'VD: nhà phố, villa, chung cư, resort...' },
  ];

  return (
    <section id="section-4" className="px-6 md:px-16 py-32 bg-[#1A1814] text-white border-b border-white/5">
      <div className="max-w-6xl mx-auto">
        <SectionHeader eyebrow="(HỒ SƠ NĂNG LỰC)" title="Thông tin công ty" accent="DQH Architects" dark />

        {info === undefined ? (
          <p className="text-xs text-[#8A8070]">Đang tải...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, idx) => (
                <div key={idx} className="space-y-2 border-t border-white/10 pt-6">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#8A8070] font-semibold">{stat.label}</p>
                  {stat.value ? (
                    <>
                      <p className="font-serif text-2xl font-light text-[#F5F2EC]">{stat.value}</p>
                      {stat.note && <p className="text-xs text-[#8A8070]">{stat.note}</p>}
                    </>
                  ) : (
                    <NeedsInput label={stat.needs} />
                  )}
                </div>
              ))}
            </div>

            {(info?.legal_name || info?.tax_code) && (
              <p className="text-xs text-[#8A8070] mt-12 pt-8 border-t border-white/10">
                <strong className="text-[#C4C0B8]">{info?.legal_name}</strong>
                {info?.tax_code && <> — Mã số thuế: {info.tax_code} do Sở Kế hoạch và Đầu tư TP.HCM cấp.</>} Mọi giao dịch hợp đồng thiết kế, báo giá và thi công đều được thực hiện minh bạch qua pháp nhân doanh nghiệp.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
