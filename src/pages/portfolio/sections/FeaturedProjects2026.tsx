import { useEffect, useState } from 'react';
import { Reveal, SectionHeader, NeedsInput } from './shared';
import { CaseStudyModal, type CaseStudyData } from './CaseStudyModal';
import { strapiFetch } from './strapiClient';

type Category = 'apartment' | 'house_villa';

interface FeaturedProject {
  title: string;
  style: string;
  info: string;
  type: string;
  constructionTime: string;
  image: string | null;
  caseStudy: CaseStudyData;
}

const CATEGORY_LABEL: Record<Category, string> = {
  apartment: 'Chung cư',
  house_villa: 'Nhà phố / Villa',
};

// Khung rỗng cho "Xem Album Kể Chuyện" khi hàng chưa có cột case_study (jsonb)
// trong Supabase — CaseStudyModal tự hiện khung chờ ảnh khi field là null.
function emptyCaseStudy(id: string, title: string): CaseStudyData {
  return {
    id, title, location: '[cần điền]', area: '[cần điền]', style: '[cần điền]',
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

export function FeaturedProjects2026() {
  const [category, setCategory] = useState<Category>('apartment');
  const [openStudy, setOpenStudy] = useState<CaseStudyData | null>(null);
  const [byCategory, setByCategory] = useState<Record<Category, FeaturedProject[]> | null>(null);

  useEffect(() => {
    strapiFetch('/api/featured-projects?sort=sort_order&filters[is_published][$eq]=true')
      .then(({ data }) => {
        const grouped: Record<Category, FeaturedProject[]> = { apartment: [], house_villa: [] };
        (data || []).forEach((row: any) => {
          const cat: Category = row.category === 'apartment' ? 'apartment' : 'house_villa';
          const cs = row.case_study as Partial<CaseStudyData> | null;
          const base = emptyCaseStudy(row.documentId, row.title);
          grouped[cat].push({
            title: row.title,
            style: row.style || '[cần điền: style thiết kế]',
            info: row.info || '[cần điền: diện tích / vị trí]',
            type: row.project_type || '[cần điền: loại công trình]',
            constructionTime: row.construction_time || '[cần điền: thời gian thi công]',
            image: row.image_url,
            caseStudy: cs ? { ...base, ...cs, id: row.documentId, title: row.title } : base,
          });
        });
        setByCategory(grouped);
      })
      .catch(() => setByCategory({ apartment: [], house_villa: [] }));
  }, []);

  const projects = byCategory?.[category] || [];

  return (
    <section id="section-0" className="px-6 md:px-16 py-32 bg-[#F8F5F0] border-b border-[#2C2920]/5">
      <div className="max-w-6xl mx-auto">
        <SectionHeader eyebrow="(NĂNG LỰC THI CÔNG 2026)" title="Công trình tiêu biểu" accent="năm 2026" />

        <div className="flex gap-2 mb-16 border-b border-[#2C2920]/10">
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

        {!byCategory ? (
          <p className="text-xs text-[#8A8070]">Đang tải...</p>
        ) : projects.length === 0 ? (
          <div className="py-10">
            <NeedsInput label={`công trình tiêu biểu — ${CATEGORY_LABEL[category]}`} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-20">
            {projects.map((proj, idx) => (
              <Reveal key={idx} delay={idx * 80}>
                <div className="group">
                  <div onClick={() => setOpenStudy(proj.caseStudy)} className="overflow-hidden aspect-[16/10] relative mb-6 rounded-sm bg-[#F5F2EC] cursor-pointer">
                    {proj.image ? (
                      <img src={proj.image} alt={proj.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center border border-dashed border-[#2C2920]/15">
                        <NeedsInput label="ảnh công trình" />
                      </div>
                    )}
                    <div className="absolute top-5 left-5 bg-[#1A1814]/90 text-[#F5F2EC] px-3 py-1 text-xs font-serif italic tracking-wide">{String(idx + 1).padStart(2, '0')}</div>
                  </div>
                  <div className="space-y-2">
                    <h3 onClick={() => setOpenStudy(proj.caseStudy)} className="font-serif text-2xl font-light text-[#2C2920] group-hover:text-[#B8913A] transition-colors cursor-pointer">
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
                    <button onClick={() => setOpenStudy(proj.caseStudy)} className="text-[10px] tracking-[0.12em] uppercase text-[#B8913A] hover:text-[#2C2920] transition-colors font-bold flex items-center gap-1.5 cursor-pointer pt-2">
                      ↗ Xem Album Kể chuyện (Case Study)
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {openStudy && <CaseStudyModal study={openStudy} onClose={() => setOpenStudy(null)} />}
    </section>
  );
}
