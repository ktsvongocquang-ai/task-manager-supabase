import { useEffect, useState } from 'react';
import { SectionHeader, NeedsInput } from './shared';
import { strapiFetch } from './strapiClient';

type Category = 'apartment' | 'house_villa';
type Standard = 'dqh' | 'jux';

interface StandardSpec {
  constructionTime: string | null;
  designStyle: string | null;
  materialPartners: string | null;
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

function StandardCard({ standard, spec }: { standard: Standard; spec?: StandardSpec }) {
  const field = (v: string | null | undefined, label: string) => (v ? <span className="text-[#2C2920] text-sm">{v}</span> : <NeedsInput label={label} />);
  return (
    <div className="bg-white border border-[#2C2920]/10 rounded-sm p-8 space-y-6">
      <div>
        <h3 className="font-serif text-2xl font-light text-[#2C2920]">{STANDARD_LABEL[standard]}</h3>
        <p className="text-xs text-[#8A8070] mt-1">{STANDARD_SUITABLE[standard]}</p>
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
    </div>
  );
}

export function PricingComparison() {
  const [category, setCategory] = useState<Category>('house_villa');
  const [rows, setRows] = useState<Record<string, StandardSpec> | null>(null);

  useEffect(() => {
    strapiFetch('/api/pricing-standards')
      .then(({ data }) => {
        const map: Record<string, StandardSpec> = {};
        (data || []).forEach((row: any) => {
          map[`${row.category}:${row.standard}`] = {
            constructionTime: row.construction_time,
            designStyle: row.design_style,
            materialPartners: row.material_partners,
          };
        });
        setRows(map);
      })
      .catch(() => setRows({}));
  }, []);

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

        {!rows ? (
          <p className="text-xs text-[#8A8070]">Đang tải...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <StandardCard standard="dqh" spec={rows[`${category}:dqh`]} />
            <StandardCard standard="jux" spec={rows[`${category}:jux`]} />
          </div>
        )}
      </div>
    </section>
  );
}
