import { useState } from 'react';
import { SectionHeader, NeedsInput } from './shared';

type Category = 'apartment' | 'house_villa';
type Standard = 'dqh' | 'jux';

interface StandardSpec {
  label: string; // tên chuẩn hiển thị
  suitableFor: string; // phù hợp cho loại công trình nào
  constructionTime: string;
  designStyle: string;
  materialPartners: string; // đối tác vật liệu
}

// [cần điền] — số liệu thời gian/đối tác vật liệu thật theo từng chuẩn.
const STANDARDS: Record<Category, Record<Standard, StandardSpec>> = {
  house_villa: {
    dqh: {
      label: 'Chuẩn DQH',
      suitableFor: 'Nhà phố & công trình kiến trúc nhà vườn',
      constructionTime: '[cần điền: thời gian thi công]',
      designStyle: '[cần điền: style thiết kế]',
      materialPartners: '[cần điền: đối tác vật liệu]',
    },
    jux: {
      label: 'Chuẩn JUX',
      suitableFor: 'Chung cư / căn hộ',
      constructionTime: '[cần điền: thời gian thi công]',
      designStyle: '[cần điền: style thiết kế]',
      materialPartners: '[cần điền: đối tác vật liệu]',
    },
  },
  apartment: {
    dqh: {
      label: 'Chuẩn DQH',
      suitableFor: 'Nhà phố & công trình kiến trúc nhà vườn',
      constructionTime: '[cần điền: thời gian thi công]',
      designStyle: '[cần điền: style thiết kế]',
      materialPartners: '[cần điền: đối tác vật liệu]',
    },
    jux: {
      label: 'Chuẩn JUX',
      suitableFor: 'Chung cư / căn hộ',
      constructionTime: '[cần điền: thời gian thi công]',
      designStyle: '[cần điền: style thiết kế]',
      materialPartners: '[cần điền: đối tác vật liệu]',
    },
  },
};

const CATEGORY_LABEL: Record<Category, string> = {
  apartment: 'Chung cư',
  house_villa: 'Nhà phố / Villa',
};

function StandardCard({ spec }: { spec: StandardSpec }) {
  const isPlaceholder = (v: string) => v.startsWith('[cần điền');
  return (
    <div className="bg-white border border-[#2C2920]/10 rounded-sm p-8 space-y-6">
      <div>
        <h3 className="font-serif text-2xl font-light text-[#2C2920]">{spec.label}</h3>
        <p className="text-xs text-[#8A8070] mt-1">{spec.suitableFor}</p>
      </div>
      <div className="h-px bg-[#2C2920]/10" />
      <dl className="space-y-4 text-xs">
        <div>
          <dt className="text-[#8A8070] font-semibold uppercase tracking-wide mb-1">Thời gian thi công</dt>
          <dd className="text-[#2C2920] text-sm">{isPlaceholder(spec.constructionTime) ? <NeedsInput label="thời gian thi công" /> : spec.constructionTime}</dd>
        </div>
        <div>
          <dt className="text-[#8A8070] font-semibold uppercase tracking-wide mb-1">Style thiết kế</dt>
          <dd className="text-[#2C2920] text-sm">{isPlaceholder(spec.designStyle) ? <NeedsInput label="style thiết kế" /> : spec.designStyle}</dd>
        </div>
        <div>
          <dt className="text-[#8A8070] font-semibold uppercase tracking-wide mb-1">Đối tác vật liệu</dt>
          <dd className="text-[#2C2920] text-sm">{isPlaceholder(spec.materialPartners) ? <NeedsInput label="đối tác vật liệu" /> : spec.materialPartners}</dd>
        </div>
      </dl>
    </div>
  );
}

export function PricingComparison() {
  const [category, setCategory] = useState<Category>('house_villa');
  const specs = STANDARDS[category];

  return (
    <section id="section-1" className="px-6 md:px-16 py-32 bg-[#F5F2EC] border-b border-[#2C2920]/5">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow="(CAM KẾT MINH BẠCH)"
          title="Chi phí thiết kế & thi công"
          accent="theo từng chuẩn dịch vụ"
        />

        <div className="flex gap-2 mb-12 border-b border-[#2C2920]/10">
          {(Object.keys(CATEGORY_LABEL) as Category[]).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-5 py-3 text-xs tracking-[0.12em] uppercase font-bold transition-colors border-b-2 -mb-px cursor-pointer ${
                category === cat
                  ? 'border-[#B8913A] text-[#2C2920]'
                  : 'border-transparent text-[#8A8070] hover:text-[#2C2920]'
              }`}
            >
              {CATEGORY_LABEL[cat]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <StandardCard spec={specs.dqh} />
          <StandardCard spec={specs.jux} />
        </div>
      </div>
    </section>
  );
}
