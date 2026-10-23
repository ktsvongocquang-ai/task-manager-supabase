import { useState } from 'react';
import { Reveal, SectionHeader, NeedsInput } from './shared';
import { CaseStudyModal, type CaseStudyData } from './CaseStudyModal';

type Category = 'apartment' | 'house_villa';

interface FeaturedProject {
  title: string;
  style: string; // style thiết kế
  info: string; // thông tin công trình (diện tích, vị trí...)
  type: string; // loại công trình (vd: Căn hộ 2PN, Nhà phố 1 trệt 3 lầu...)
  constructionTime: string; // thời gian thi công
  image: string | null;
  caseStudy: CaseStudyData;
}

// Khung rỗng cho "Xem Album Kể Chuyện (Case Study)" — giữ nguyên tính năng
// deep-dive 5 giai đoạn của bản cũ (xem CaseStudyModal.tsx), chỉ chưa có nội
// dung/ảnh thật nên để trống, CaseStudyModal tự hiện khung chờ ảnh khi field
// là null.
function emptyCaseStudy(id: string, title: string, location: string, area: string, style: string): CaseStudyData {
  return {
    id, title, location, area, style,
    coverImage: null,
    introText: '[cần điền: câu giới thiệu ngắn về công trình]',
    floorPlan: { text: '[cần điền: câu chuyện mặt bằng — vấn đề & cách giải quyết]', sitePhoto: null, blueprint: null },
    design3D: { text: '[cần điền: câu chuyện phối cảnh 3D]', images: [] },
    tailoring: { text: '[cần điền: câu chuyện tinh chỉnh & chọn vật liệu]', steps: [] },
    structural: { text: '[cần điền: câu chuyện thi công phần thô]', imgMain: null },
    material: { text: '[cần điền: câu chuyện lựa chọn vật liệu]', samples: [] },
    fixedInterior: { text: '[cần điền: câu chuyện nội thất cố định]', imgMain: null },
    looseFurniture: { text: '[cần điền: câu chuyện nội thất rời]', imgMain: null },
    details: { items: [] },
    finalize: { text: '[cần điền: câu chuyện bàn giao]', images: [] },
  };
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
      caseStudy: emptyCaseStudy('apt-1', '[cần điền: tên dự án chung cư 1]', '[cần điền]', '[cần điền]', '[cần điền]'),
    },
    {
      title: '[cần điền: tên dự án chung cư 2]',
      style: '[cần điền: style thiết kế]',
      info: '[cần điền: diện tích / vị trí / chủ đầu tư]',
      type: '[cần điền: loại căn hộ]',
      constructionTime: '[cần điền: thời gian thi công]',
      image: null,
      caseStudy: emptyCaseStudy('apt-2', '[cần điền: tên dự án chung cư 2]', '[cần điền]', '[cần điền]', '[cần điền]'),
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
      caseStudy: emptyCaseStudy('house-1', '[cần điền: tên dự án nhà phố/villa 1]', '[cần điền]', '[cần điền]', '[cần điền]'),
    },
    {
      title: '[cần điền: tên dự án nhà phố/villa 2]',
      style: '[cần điền: style thiết kế]',
      info: '[cần điền: diện tích / vị trí]',
      type: '[cần điền: loại công trình]',
      constructionTime: '[cần điền: thời gian thi công]',
      image: null,
      caseStudy: emptyCaseStudy('house-2', '[cần điền: tên dự án nhà phố/villa 2]', '[cần điền]', '[cần điền]', '[cần điền]'),
    },
  ],
};

const CATEGORY_LABEL: Record<Category, string> = {
  apartment: 'Chung cư',
  house_villa: 'Nhà phố / Villa',
};

export function FeaturedProjects2026() {
  const [category, setCategory] = useState<Category>('apartment');
  const [openStudy, setOpenStudy] = useState<CaseStudyData | null>(null);
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
                <div
                  onClick={() => setOpenStudy(proj.caseStudy)}
                  className="overflow-hidden aspect-[16/10] relative mb-6 rounded-sm bg-[#F5F2EC] cursor-pointer"
                >
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
                  <h3
                    onClick={() => setOpenStudy(proj.caseStudy)}
                    className="font-serif text-2xl font-light text-[#2C2920] group-hover:text-[#B8913A] transition-colors cursor-pointer"
                  >
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
                  <button
                    onClick={() => setOpenStudy(proj.caseStudy)}
                    className="text-[10px] tracking-[0.12em] uppercase text-[#B8913A] hover:text-[#2C2920] transition-colors font-bold flex items-center gap-1.5 cursor-pointer pt-2"
                  >
                    ↗ Xem Album Kể chuyện (Case Study)
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {openStudy && <CaseStudyModal study={openStudy} onClose={() => setOpenStudy(null)} />}
    </section>
  );
}
