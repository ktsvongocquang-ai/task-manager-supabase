import { useEffect, useState } from 'react';
import { SectionHeader, NeedsInput } from './shared';
import { landingSupabase } from './landingSupabase';

type Category = 'apartment' | 'house_villa';
type Standard = 'dqh' | 'jux';

interface StandardSpec {
  constructionTime: string | null;
  designStyle: string | null;
  materialPartners: string | null;
  designMinPrice: number | null;
  designMaxPrice: number | null;
  constructionMinPrice: number | null;
  constructionMaxPrice: number | null;
}

const CATEGORY_LABEL: Record<Category, string> = {
  apartment: 'Chung cư',
  house_villa: 'Nhà phố / Villa',
};
const STANDARD_LABEL: Record<Standard, string> = { dqh: 'Chuẩn DQH', jux: 'Chuẩn JUX' };
const STANDARD_SUITABLE: Record<Standard, string> = {
  dqh: 'Nhà phố & công trình kiến trúc nhà vườn',
  jux: 'Chung cư / căn hộ',
};
// Mỗi category chỉ có đúng 1 chuẩn dịch vụ áp dụng — tránh hiện 2 thẻ gây
// hiểu lầm "được chọn 1 trong 2" khi thực tế DQH/JUX tách theo loại công trình.
const CATEGORY_STANDARD: Record<Category, Standard> = { apartment: 'jux', house_villa: 'dqh' };

function formatVnd(n: number) {
  return (n / 1_000_000).toLocaleString('vi-VN') + ' triệu';
}

function StandardCard({ standard, spec }: { standard: Standard; spec?: StandardSpec }) {
  const field = (v: string | null | undefined, label: string) => (v ? <span className="text-[#2C2920] text-sm">{v}</span> : <NeedsInput label={label} />);
  return (
    <div className="bg-white border border-[#2C2920]/10 rounded-sm p-8 md:p-10 space-y-6 max-w-xl mx-auto">
      <div>
        <h3 className="font-serif text-2xl font-light text-[#2C2920]">{STANDARD_LABEL[standard]}</h3>
        <p className="text-xs text-[#8A8070] mt-1">{STANDARD_SUITABLE[standard]}</p>
      </div>

      <div className="bg-[#F8F5F0] rounded-sm p-5 grid grid-cols-2 gap-4 text-center divide-x divide-[#2C2920]/10">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#8A8070] font-semibold mb-1">Chi phí thiết kế</p>
          {spec?.designMinPrice != null && spec?.designMaxPrice != null ? (
            <p className="font-serif text-xl text-[#B8913A]">
              {formatVnd(spec.designMinPrice)} – {formatVnd(spec.designMaxPrice)}
              <span className="block text-[11px] text-[#8A8070] font-sans">/ m²</span>
            </p>
          ) : (
            <NeedsInput label="giá thiết kế/m²" />
          )}
        </div>
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#8A8070] font-semibold mb-1">Chi phí thi công</p>
          {spec?.constructionMinPrice != null && spec?.constructionMaxPrice != null ? (
            <p className="font-serif text-xl text-[#B8913A]">
              {formatVnd(spec.constructionMinPrice)} – {formatVnd(spec.constructionMaxPrice)}
              <span className="block text-[11px] text-[#8A8070] font-sans">/ m²</span>
            </p>
          ) : (
            <NeedsInput label="giá thi công/m²" />
          )}
        </div>
      </div>

      <div className="h-px bg-[#2C2920]/10" />
      <dl className="space-y-4 text-xs">
        <div>
          <dt className="text-[#8A8070] font-semibold uppercase tracking-wide mb-1">Thời gian thi công</dt>
          <dd>{field(spec?.constructionTime, 'thời gian thi công')}</dd>
        </div>
        <div>
          <dt className="text-[#8A8070] font-semibold uppercase tracking-wide mb-1">Style thiết kế</dt>
          <dd>{field(spec?.designStyle, 'style thiết kế')}</dd>
        </div>
        <div>
          <dt className="text-[#8A8070] font-semibold uppercase tracking-wide mb-1">Đối tác vật liệu</dt>
          <dd>{field(spec?.materialPartners, 'đối tác vật liệu')}</dd>
        </div>
      </dl>
      <p className="text-[11px] text-[#8A8070] italic">Đơn giá tham khảo — liên hệ DQH để được báo giá chính xác theo bản vẽ thực tế.</p>
    </div>
  );
}

export function PricingComparison() {
  const [category, setCategory] = useState<Category>('house_villa');
  const [rows, setRows] = useState<Record<string, StandardSpec> | null>(null);

  useEffect(() => {
    Promise.all([
      landingSupabase.from('landing_pricing_standards').select('category,standard,construction_time,design_style,material_partners'),
      landingSupabase
        .from('landing_price_rates')
        .select('category,standard,design_min_price_per_m2,design_max_price_per_m2,min_price_per_m2,max_price_per_m2'),
    ])
      .then(([standardsRes, ratesRes]) => {
        const empty = (): StandardSpec => ({
          constructionTime: null,
          designStyle: null,
          materialPartners: null,
          designMinPrice: null,
          designMaxPrice: null,
          constructionMinPrice: null,
          constructionMaxPrice: null,
        });
        const map: Record<string, StandardSpec> = {};
        (standardsRes.data || []).forEach(row => {
          map[`${row.category}:${row.standard}`] = {
            ...empty(),
            constructionTime: row.construction_time,
            designStyle: row.design_style,
            materialPartners: row.material_partners,
          };
        });
        (ratesRes.data || []).forEach(row => {
          const key = `${row.category}:${row.standard}`;
          if (!map[key]) map[key] = empty();
          map[key].designMinPrice = row.design_min_price_per_m2;
          map[key].designMaxPrice = row.design_max_price_per_m2;
          map[key].constructionMinPrice = row.min_price_per_m2;
          map[key].constructionMaxPrice = row.max_price_per_m2;
        });
        setRows(map);
      })
      .catch(() => setRows({}));
  }, []);

  const standard = CATEGORY_STANDARD[category];

  return (
    <section id="section-1" className="px-6 md:px-16 py-32 bg-[#F5F2EC] border-b border-[#2C2920]/5">
      <div className="max-w-6xl mx-auto">
        <SectionHeader eyebrow="(CAM KẾT MINH BẠCH)" title="Chi phí thiết kế & thi công" accent="theo từng chuẩn dịch vụ" />

        <div className="flex gap-2 mb-12 border-b border-[#2C2920]/10">
          {(Object.keys(CATEGORY_LABEL) as Category[]).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-5 py-3 text-xs tracking-[0.12em] uppercase font-bold transition-colors border-b-2 -mb-px cursor-pointer ${
                category === cat ? 'border-[#B8913A] text-[#2C2920]' : 'border-transparent text-[#8A8070] hover:text-[#2C2920]'
              }`}
            >
              {CATEGORY_LABEL[cat]}
            </button>
          ))}
        </div>

        {!rows ? <p className="text-xs text-[#8A8070]">Đang tải...</p> : <StandardCard standard={standard} spec={rows[`${category}:${standard}`]} />}
      </div>
    </section>
  );
}
