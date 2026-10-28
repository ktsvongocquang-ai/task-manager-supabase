import { useEffect, useState } from 'react';
import { Reveal, SectionHeader, NeedsInput, useLandingAdmin } from './shared';
import { CaseStudyModal, normalizeCaseStudy, vercelImg, type CaseStudyData, type RawCaseStudy } from './CaseStudyModal';
import { landingSupabase } from './landingSupabase';

type Category = 'apartment' | 'house_villa';

interface FeaturedProject {
  title: string;
  style: string | null;
  info: string | null;
  type: string | null;
  constructionTime: string | null;
  image: string | null;
  caseStudy: CaseStudyData;
}

// Khách công khai: hàng nào thiếu dữ liệu thì ẨN hẳn (không render dt/dd).
// Admin xem trước (LandingAdminContext): vẫn thấy hàng + nhãn đỏ [cần điền]
// để biết còn thiếu gì cần nhập trong Supabase.
function SpecRow({ label, value, needs }: { label: string; value: string | null; needs: string }) {
  const isAdmin = useLandingAdmin();
  if (!value && !isAdmin) return null;
  return (
    <>
      <dt className="text-[#8A8070] font-semibold">{label}</dt>
      <dd className="text-[#2C2920]">{value || <NeedsInput label={needs} />}</dd>
    </>
  );
}

const CATEGORY_LABEL: Record<Category, string> = {
  apartment: 'Chung cư',
  house_villa: 'Nhà phố / Villa',
};

// Chuẩn hoá "Thời gian thi công" về đúng 1 định dạng "NN ngày" — admin có thể
// nhập "35" hoặc "35 ngày" trong Supabase, trang luôn hiển thị nhất quán.
function formatConstructionTime(raw: string): string {
  return /^\d+$/.test(raw.trim()) ? `${raw.trim()} ngày` : raw;
}

export function FeaturedProjects2026() {
  const [category, setCategory] = useState<Category>('apartment');
  const [openStudy, setOpenStudy] = useState<CaseStudyData | null>(null);
  const [byCategory, setByCategory] = useState<Record<Category, FeaturedProject[]> | null>(null);

  useEffect(() => {
    landingSupabase
      .from('landing_featured_projects')
      .select('id,category,title,style,info,project_type,construction_time,image_url,case_study')
      .eq('is_published', true)
      .order('sort_order')
      .then(({ data }) => {
        const grouped: Record<Category, FeaturedProject[]> = { apartment: [], house_villa: [] };
        (data || []).forEach(row => {
          const cat: Category = row.category === 'apartment' ? 'apartment' : 'house_villa';
          const cs = (row.case_study || {}) as RawCaseStudy;
          grouped[cat].push({
            title: row.title,
            style: row.style || null,
            info: row.info || null,
            type: row.project_type || null,
            constructionTime: row.construction_time ? formatConstructionTime(row.construction_time) : null,
            image: row.image_url,
            caseStudy: normalizeCaseStudy({ ...cs, id: row.id, title: row.title }),
          });
        });
        setByCategory(grouped);
      })
      .catch(() => setByCategory({ apartment: [], house_villa: [] }));
  }, []);

  const projects = byCategory?.[category] || [];

  return (
    <section id="section-0" className="px-6 md:px-16 py-16 md:py-32 bg-[#F8F5F0] border-b border-[#2C2920]/5">
      <div className="max-w-6xl mx-auto">
        <SectionHeader eyebrow="(NĂNG LỰC THI CÔNG 2026)" title="Công trình tiêu biểu" accent="năm 2026" caption="DQH · JUX – hai dòng dịch vụ của DQH Architects" />

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
                      <img src={vercelImg(proj.image || undefined, 800)} alt={proj.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
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
                      <SpecRow label="Style thiết kế" value={proj.style} needs="style thiết kế" />
                      <SpecRow label="Thông tin" value={proj.info} needs="diện tích / vị trí" />
                      <SpecRow label="Loại công trình" value={proj.type} needs="loại công trình" />
                      <SpecRow label="Thời gian thi công" value={proj.constructionTime} needs="thời gian thi công" />
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
