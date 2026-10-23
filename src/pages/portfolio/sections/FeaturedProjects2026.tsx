import { useState } from 'react';
import { Reveal, SectionHeader, NeedsInput } from './shared';

type Category = 'apartment' | 'house_villa';

interface FeaturedProject {
  title: string;
  style: string; // style thiết kế
  info: string; // thông tin công trình (diện tích, vị trí...)
  type: string; // loại công trình (vd: Căn hộ 2PN, Nhà phố 1 trệt 3 lầu...)
  constructionTime: string; // thời gian thi công
  image: string | null;
}

// [cần điền] — thay toàn bộ bằng công trình thật đã hoàn thiện năm 2026,
// kèm ảnh thật (chưa có ảnh thì để image: null, UI sẽ hiện khung chờ ảnh).
const FEATURED_PROJECTS_2026: Record<Category, FeaturedProject[]> = {
  apartment: [
    {
      title: '[cần điền: tên dự án chung cư 1]',
      style: '[cần điền: style thiết kế]',
      info: '[cần điền: diện tích / vị trí / chủ đầu tư]',
      type: '[cần điền: loại căn hộ]',
      constructionTime: '[cần điền: thời gian thi công]',
      image: null,
    },
    {
      title: '[cần điền: tên dự án chung cư 2]',
      style: '[cần điền: style thiết kế]',
      info: '[cần điền: diện tích / vị trí / chủ đầu tư]',
      type: '[cần điền: loại căn hộ]',
      constructionTime: '[cần điền: thời gian thi công]',
      image: null,
    },
  ],
  house_villa: [
    {
      title: '[cần điền: tên dự án nhà phố/villa 1]',
      style: '[cần điền: style thiết kế]',
      info: '[cần điền: diện tích / vị trí]',
      type: '[cần điền: loại công trình]',
      constructionTime: '[cần điền: thời gian thi công]',
      image: null,
    },
    {
      title: '[cần điền: tên dự án nhà phố/villa 2]',
      style: '[cần điền: style thiết kế]',
      info: '[cần điền: diện tích / vị trí]',
      type: '[cần điền: loại công trình]',
      constructionTime: '[cần điền: thời gian thi công]',
      image: null,
    },
  ],
};

const CATEGORY_LABEL: Record<Category, string> = {
  apartment: 'Chung cư',
  house_villa: 'Nhà phố / Villa',
};

export function FeaturedProjects2026() {
  const [category, setCategory] = useState<Category>('apartment');
  const projects = FEATURED_PROJECTS_2026[category];

  return (
    <section id="section-0" className="px-6 md:px-16 py-32 bg-[#F8F5F0] border-b border-[#2C2920]/5">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow="(NĂNG LỰC THI CÔNG 2026)"
          title="Công trình tiêu biểu"
          accent="năm 2026"
        />

        {/* Chọn Chung cư / Nhà phố-Villa */}
        <div className="flex gap-2 mb-16 border-b border-[#2C2920]/10">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-20">
          {projects.map((proj, idx) => (
            <Reveal key={idx} delay={idx * 80}>
              <div className="group">
                <div className="overflow-hidden aspect-[16/10] relative mb-6 rounded-sm bg-[#F5F2EC]">
                  {proj.image ? (
                    <img src={proj.image} alt={proj.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center border border-dashed border-[#2C2920]/15">
                      <NeedsInput label="ảnh công trình" />
                    </div>
                  )}
                  <div className="absolute top-5 left-5 bg-[#1A1814]/90 text-[#F5F2EC] px-3 py-1 text-xs font-serif italic tracking-wide">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl font-light text-[#2C2920] group-hover:text-[#B8913A] transition-colors">
                    {proj.title}
                  </h3>
                  <div className="h-px w-10 bg-[#B8913A]/30 group-hover:w-20 transition-all duration-500" />
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs pt-2">
                    <dt className="text-[#8A8070] font-semibold">Style thiết kế</dt>
                    <dd className="text-[#2C2920]">{proj.style}</dd>
                    <dt className="text-[#8A8070] font-semibold">Thông tin</dt>
                    <dd className="text-[#2C2920]">{proj.info}</dd>
                    <dt className="text-[#8A8070] font-semibold">Loại công trình</dt>
                    <dd className="text-[#2C2920]">{proj.type}</dd>
                    <dt className="text-[#8A8070] font-semibold">Thời gian thi công</dt>
                    <dd className="text-[#2C2920]">{proj.constructionTime}</dd>
                  </dl>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
