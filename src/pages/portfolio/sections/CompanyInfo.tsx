import { useEffect, useState } from 'react';
import { SectionHeader, NeedsInput, Reveal } from './shared';
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
  history_text: string | null;
  history_image: string | null;
  vision_text: string | null;
  vision_image: string | null;
  philosophy_text: string | null;
  philosophy_image: string | null;
}

const STORY_BLOCKS: { textKey: keyof CompanyInfoRow; imageKey: keyof CompanyInfoRow; label: string; needs: string }[] = [
  { textKey: 'history_text', imageKey: 'history_image', label: 'Lịch sử hình thành', needs: 'câu chuyện hình thành công ty' },
  { textKey: 'vision_text', imageKey: 'vision_image', label: 'Tầm nhìn', needs: 'tầm nhìn công ty' },
  { textKey: 'philosophy_text', imageKey: 'philosophy_image', label: 'Triết lý làm nghề', needs: 'triết lý làm nghề' },
];

function StoryBlock({ label, text, image, needs }: { label: string; text: string | null; image: string | null; needs: string }) {
  if (!text && !image) return null;
  return (
    <Reveal>
      <div className="relative min-h-[48vh] md:min-h-[70vh] flex items-center overflow-hidden">
        {image && <img src={image} alt={label} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#161412] via-[#161412]/60 to-[#161412]/20" />
        <div className="relative z-10 px-6 md:px-16 py-12 md:py-20 max-w-3xl">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#D4BC95] font-bold mb-4">{label}</p>
          {text ? (
            <p className="font-serif text-2xl md:text-4xl font-light text-white leading-snug">{text}</p>
          ) : (
            <NeedsInput label={needs} />
          )}
        </div>
      </div>
    </Reveal>
  );
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
    <section id="section-4" className="bg-[#1A1814] text-white border-b border-white/5">
      <div className="px-6 md:px-16 pt-16 md:pt-32 pb-10 md:pb-16">
        <div className="max-w-6xl mx-auto">
          <SectionHeader eyebrow="(HỒ SƠ NĂNG LỰC)" title="Thông tin công ty" accent="DQH Architects" dark />
        </div>
      </div>

      {info === undefined ? (
        <p className="text-xs text-[#8A8070] px-6 md:px-16 pb-32">Đang tải...</p>
      ) : (
        <>
          <div className="divide-y divide-white/5">
            {STORY_BLOCKS.map(b => (
              <StoryBlock key={b.textKey} label={b.label} text={info?.[b.textKey] as string | null} image={info?.[b.imageKey] as string | null} needs={b.needs} />
            ))}
          </div>

          <div className="px-6 md:px-16 pt-12 md:pt-20 pb-16 md:pb-32">
            <div className="max-w-6xl mx-auto">
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
            </div>
          </div>
        </>
      )}
    </section>
  );
}
