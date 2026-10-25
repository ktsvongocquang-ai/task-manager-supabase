import { useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Modal "Xem Album Kể Chuyện (Case Study)" — port nguyên trạng từ
// PortfolioLanding.tsx bản cũ (PhaseVisuals + 5 fallback SVG + lightbox 5
// giai đoạn), theo yêu cầu KHÔNG LÀM MẤT tính năng này khi dựng lại trang.
// Khác bản cũ: painPoint không còn gắn cứng theo 4 dự án demo cũ (Lumé/
// Horizon/Verena/Arden) — dùng painPoint chung theo từng giai đoạn, lấy từ
// CaseStudyData.stagesPainPoints nếu có, fallback về câu mô tả chung.
// ─────────────────────────────────────────────────────────────────────────────

export interface CaseStudyData {
  id: string;
  title: string;
  location: string;
  area: string;
  style: string;
  coverImage: string | null;
  introText: string;
  floorPlan: { text: string; sitePhotos: string[]; blueprint: string | null; link?: string };
  design3D: { text: string; images: string[] };
  tailoring: { text: string; steps: { title: string; desc: string }[]; link?: string };
  structural: { text: string; images: string[]; link?: string };
  material: { text: string; samples: { name: string; desc: string; img: string | null }[] };
  fixedInterior: { text: string; extraText?: string; images: string[]; link?: string };
  looseFurniture: { text: string; images: string[] };
  details: { items: { num: number; name: string }[] };
  finalize: { text: string; images: string[]; videoUrl?: string; link?: string };
}

// Dữ liệu cũ (trước khi thêm multi-ảnh/link) dùng field đơn: sitePhoto,
// structural.imgMain, fixedInterior.imgMain, looseFurniture.imgMain. Chuẩn
// hoá về mảng mỗi lần đọc — không mất ảnh cũ đã lưu, không cần migrate DB
// (case_study là cột jsonb tự do).
type LegacyCaseStudyData = Partial<CaseStudyData> & {
  floorPlan?: Partial<CaseStudyData['floorPlan']> & { sitePhoto?: string | null };
  structural?: Partial<CaseStudyData['structural']> & { imgMain?: string | null };
  fixedInterior?: Partial<CaseStudyData['fixedInterior']> & { imgMain?: string | null };
  looseFurniture?: Partial<CaseStudyData['looseFurniture']> & { imgMain?: string | null };
};

export function normalizeCaseStudy(raw: LegacyCaseStudyData): CaseStudyData {
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x) : typeof v === 'string' && v ? [v] : []);
  return {
    id: raw.id || '', title: raw.title || '', location: raw.location || '', area: raw.area || '', style: raw.style || '',
    coverImage: raw.coverImage ?? null, introText: raw.introText || '',
    floorPlan: { text: raw.floorPlan?.text || '', blueprint: raw.floorPlan?.blueprint ?? null, link: raw.floorPlan?.link, sitePhotos: arr(raw.floorPlan?.sitePhotos ?? raw.floorPlan?.sitePhoto) },
    design3D: { text: raw.design3D?.text || '', images: arr(raw.design3D?.images) },
    tailoring: { text: raw.tailoring?.text || '', steps: raw.tailoring?.steps || [], link: raw.tailoring?.link },
    structural: { text: raw.structural?.text || '', link: raw.structural?.link, images: arr(raw.structural?.images ?? raw.structural?.imgMain) },
    material: { text: raw.material?.text || '', samples: raw.material?.samples || [] },
    fixedInterior: { text: raw.fixedInterior?.text || '', extraText: raw.fixedInterior?.extraText, link: raw.fixedInterior?.link, images: arr(raw.fixedInterior?.images ?? raw.fixedInterior?.imgMain) },
    looseFurniture: { text: raw.looseFurniture?.text || '', images: arr(raw.looseFurniture?.images ?? raw.looseFurniture?.imgMain) },
    details: { items: raw.details?.items || [] },
    finalize: { text: raw.finalize?.text || '', videoUrl: raw.finalize?.videoUrl, link: raw.finalize?.link, images: arr(raw.finalize?.images) },
  };
}

const DEFAULT_PAIN_POINTS = [
  'Gia chủ còn băn khoăn giữa việc giữ tối giản và tránh không gian bị lạnh lẽo, trống trải.',
  'Lo ngại vật liệu thực tế lệch pha với phối cảnh 3D, phát sinh chi phí ngoài dự kiến.',
  'Rủi ro nứt tường, thấm sàn nếu không kiểm soát kỹ từng điểm tiếp giáp kết cấu.',
  'Nội thất gia công cẩu thả, lắp đặt lệch khe shadow gap làm mất tính thẩm mỹ tổng thể.',
  'Bàn giao vội vã, bỏ sót lỗi nhỏ khiến gia chủ phải tự phát hiện và yêu cầu sửa lại.',
];

// ── ARCHITECTURAL VECTOR FALLBACK CARDS FOR BLOCKED/MISSING IMAGE URLS ──
const GridBg = () => (
  <>
    <path d="M 0,20 L 100,20 M 0,40 L 100,40 M 0,60 L 100,60 M 0,80 L 100,80" strokeWidth="0.2" opacity="0.3" />
    <path d="M 20,0 L 20,100 M 40,0 L 40,100 M 60,0 L 60,100 M 80,0 L 80,100" strokeWidth="0.2" opacity="0.3" />
  </>
);

const FallbackCard = ({ label, sub, children }: { label: string; sub: string; children?: React.ReactNode }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#161412] text-white/90">
    <svg className="w-12 h-12 stroke-[#B8913A] stroke-[0.75] fill-none opacity-80 mb-2" viewBox="0 0 100 100">
      <GridBg />
      {children}
    </svg>
    <span className="font-sans text-[8px] tracking-[0.2em] text-[#B8913A] font-bold uppercase text-center">{label}</span>
    <span className="text-[6px] text-stone-400 mt-0.5 uppercase tracking-widest text-center">{sub}</span>
  </div>
);

const BlueprintFallback = () => (
  <FallbackCard label="BẢN VẼ Ý TƯỞNG 2D" sub="Architectural Layout Schematic">
    <rect x="25" y="25" width="50" height="50" strokeWidth="1" />
    <line x1="25" y1="50" x2="75" y2="50" strokeWidth="0.75" />
    <line x1="50" y1="25" x2="50" y2="75" strokeWidth="0.75" />
    <circle cx="50" cy="50" r="1.5" fill="#B8913A" />
  </FallbackCard>
);
const Design3DFallback = () => (
  <FallbackCard label="PHỐI CẢNH 3D" sub="3D Space Rendering & Scale Models">
    <path d="M 50,25 L 75,37.5 L 75,62.5 L 50,75 L 25,62.5 L 25,37.5 Z" strokeWidth="1" />
    <line x1="50" y1="25" x2="50" y2="75" strokeWidth="1" />
  </FallbackCard>
);
const ConstructionFallback = () => (
  <FallbackCard label="THI CÔNG PHẦN THÔ" sub="MEP Grid & Concrete Structural Works">
    <rect x="20" y="30" width="60" height="40" strokeWidth="0.75" strokeDasharray="2,2" />
    <line x1="20" y1="50" x2="80" y2="50" strokeWidth="0.75" />
  </FallbackCard>
);
const AssemblyFallback = () => (
  <FallbackCard label="LẮP RÁP JOINERY" sub="Custom Fitting & Millwork Assembly">
    <rect x="25" y="35" width="50" height="30" strokeWidth="1" />
    <line x1="25" y1="45" x2="75" y2="45" strokeWidth="0.75" />
  </FallbackCard>
);
const HandoverFallback = () => (
  <FallbackCard label="BÀN GIAO THỰC TẾ" sub="Completed Project">
    <polygon points="50,20 80,45 20,45" strokeWidth="1" />
    <rect x="25" y="45" width="50" height="30" strokeWidth="1" />
  </FallbackCard>
);

// Lưới ảnh dùng chung cho các khối nhiều ảnh (3D, thi công, nội thất...) —
// tự chọn số cột hợp lý theo số ảnh thực có (1-6+). Khai báo ở module scope
// (không lồng trong PhaseVisuals) để tránh tạo lại component mỗi lần render.
function ImgGrid({
  imgs, altPrefix, placeholder, imageErrors, onImageError,
}: {
  imgs: (string | null | undefined)[];
  altPrefix: string;
  placeholder: string;
  imageErrors: Record<string, boolean>;
  onImageError: (url: string) => void;
}) {
  const ok = (url: string | null | undefined) => !!url && !imageErrors[url];
  const cols = imgs.length <= 1 ? 1 : imgs.length === 2 ? 2 : imgs.length <= 4 ? 2 : 3;
  return (
    <div className="w-full h-full grid gap-1 p-2 bg-[#161412]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {imgs.map((img, idx) => (
        <div key={idx} className="relative w-full h-full bg-[#1A1814] overflow-hidden rounded-sm min-h-[60px]">
          {ok(img) ? <img src={img!} className="w-full h-full object-cover" alt={`${altPrefix} ${idx + 1}`} onError={() => onImageError(img!)} /> : (
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-stone-500 text-center px-1">{placeholder} 0{idx + 1}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function PhaseVisuals({
  stage, index, study, imageErrors, onImageError,
}: {
  stage: { image: string | null; subImage?: string | null; subImages?: string[] };
  index: number;
  study: CaseStudyData;
  imageErrors: Record<string, boolean>;
  onImageError: (url: string) => void;
}) {
  const ok = (url: string | null | undefined) => !!url && !imageErrors[url];

  if (index === 0) {
    const bp = study.floorPlan.blueprint;
    const sps = study.floorPlan.sitePhotos || [];
    if (!ok(bp) && !sps.some(ok)) return <BlueprintFallback />;
    return (
      <div className="w-full h-full grid grid-cols-2 gap-1 p-2 bg-[#161412]">
        <div className="relative w-full h-full bg-[#1A1814] overflow-hidden rounded-sm">
          {ok(bp) ? <img src={bp!} className="w-full h-full object-cover opacity-85" alt="Blueprint" onError={() => onImageError(bp!)} /> : <BlueprintFallback />}
        </div>
        <div className="relative w-full h-full">
          {sps.some(ok) ? <ImgGrid imgs={sps} altPrefix="Hiện trạng" placeholder="HIỆN TRẠNG" imageErrors={imageErrors} onImageError={onImageError} /> : (
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-stone-500 uppercase tracking-widest text-center p-2 bg-[#1A1814] rounded-sm">Hiện trạng công trình</div>
          )}
        </div>
      </div>
    );
  }

  if (index === 1) {
    const imgs = study.design3D.images || [];
    if (!imgs.some(ok)) return <Design3DFallback />;
    return <ImgGrid imgs={imgs} altPrefix="3D Render" placeholder="RENDER 3D" imageErrors={imageErrors} onImageError={onImageError} />;
  }

  if (index === 2) {
    const imgs = study.structural.images || [];
    if (!imgs.some(ok)) return <ConstructionFallback />;
    return <ImgGrid imgs={imgs} altPrefix="Rough Construction" placeholder="THI CÔNG" imageErrors={imageErrors} onImageError={onImageError} />;
  }

  if (index === 3) {
    const fi = study.fixedInterior.images || [];
    const lf = study.looseFurniture.images || [];
    if (!fi.some(ok) && !lf.some(ok)) return <AssemblyFallback />;
    return (
      <div className="w-full h-full grid grid-cols-2 gap-1 p-2 bg-[#161412]">
        <div className="relative w-full h-full">
          {fi.some(ok) ? <ImgGrid imgs={fi} altPrefix="Fixed Interior" placeholder="NỘI THẤT CỐ ĐỊNH" imageErrors={imageErrors} onImageError={onImageError} /> : (
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-stone-500 uppercase tracking-widest text-center p-2 bg-[#1A1814] rounded-sm">Nội thất cố định</div>
          )}
        </div>
        <div className="relative w-full h-full">
          {lf.some(ok) ? <ImgGrid imgs={lf} altPrefix="Loose Furniture" placeholder="NỘI THẤT RỜI" imageErrors={imageErrors} onImageError={onImageError} /> : (
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-stone-500 uppercase tracking-widest text-center p-2 bg-[#1A1814] rounded-sm">Nội thất rời</div>
          )}
        </div>
      </div>
    );
  }

  const imgs = study.finalize.images || [];
  if (!imgs.some(ok)) return <HandoverFallback />;
  return (
    <div className="w-full h-full grid grid-rows-2 gap-1 p-1 bg-[#161412]">
      <div className="relative w-full h-full bg-[#1A1814] overflow-hidden rounded-sm">
        {ok(imgs[0]) ? <img src={imgs[0]} className="w-full h-full object-cover" alt="Handover" onError={() => onImageError(imgs[0])} /> : (
          <div className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-stone-500">BÀN GIAO TOÀN CẢNH</div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {[imgs[1], imgs[2]].map((img, i) => (
          <div key={i} className="relative w-full h-full bg-[#1A1814] overflow-hidden rounded-sm">
            {ok(img) ? <img src={img} className="w-full h-full object-cover" alt={`Chi tiết ${i + 1}`} onError={() => onImageError(img)} /> : (
              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-stone-500">CHI TIẾT 0{i + 1}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CaseStudyModal({ study, onClose }: { study: CaseStudyData; onClose: () => void }) {
  const [activeStage, setActiveStage] = useState(0);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const stages = [
    {
      title: 'Ý TƯỞNG & MẶT BẰNG', subtitle: 'CONCEPT & LAYOUT',
      painPoint: DEFAULT_PAIN_POINTS[0],
      storyText: [study.introText, study.floorPlan.text, study.design3D.text].filter(Boolean).join('\n\n'),
      link: study.floorPlan.link,
      techChecklist: [
        { label: 'Sai số đo đạc phần thô', value: 'Dưới 5mm (dùng máy quét laser 3D hiện trường)' },
        { label: 'Mật độ không gian thở (Void ratio)', value: 'Đạt chuẩn Solid:Void = 3:1 tối ưu luồng khí' },
        { label: 'Thiết kế giấu cột chịu lực', value: '100% cột bê tông được giấu chìm âm tường thạch cao' },
      ],
    },
    {
      title: 'TINH CHỈNH & VẬT LIỆU', subtitle: 'MATERIAL & TAILORING',
      painPoint: DEFAULT_PAIN_POINTS[1],
      storyText: [study.tailoring.text, study.material.text].filter(Boolean).join('\n\n'),
      link: study.tailoring.link,
      techChecklist: (study.tailoring.steps || []).map(st => ({ label: st.title, value: st.desc })),
    },
    {
      title: 'THI CÔNG PHẦN THÔ', subtitle: 'ROUGH CONSTRUCTION',
      painPoint: DEFAULT_PAIN_POINTS[2],
      storyText: study.structural.text,
      link: study.structural.link,
      techChecklist: [
        { label: 'Chống nứt góc tường', value: 'Đóng lưới thép mắt cáo 100% điểm tiếp giáp trước khi tô vữa' },
        { label: 'Chống thấm toilet', value: 'Màng chống thấm polymer 3 lớp đặc chủng, ngâm thử nước 72h' },
        { label: 'Mockup ánh sáng hiện trường', value: 'Lắp thử hệ LED 2700K/3000K trước khi đóng trần thạch cao' },
      ],
    },
    {
      title: 'LẮP RÁP NỘI THẤT', subtitle: 'INTERIOR ASSEMBLY',
      painPoint: DEFAULT_PAIN_POINTS[3],
      storyText: [study.fixedInterior.text, study.fixedInterior.extraText, study.looseFurniture.text].filter(Boolean).join('\n\n'),
      link: study.fixedInterior.link,
      techChecklist: [
        { label: 'Khe cạnh dán ABS gỗ', value: 'Mịn phẳng tuyệt đối ≤ 0.5mm, dùng máy dán cạnh tự động' },
        { label: 'Bản lề hơi giảm chấn', value: '100% Häfele đóng mở êm dịu, không tiếng động' },
        { label: 'Độ chuẩn xác Shadow Gap', value: 'Khe âm thạch cao 3mm và chân tủ 2mm thẳng tắp' },
      ],
      detailsItems: study.details.items || [],
    },
    {
      title: 'BÀN GIAO THỰC TẾ', subtitle: 'FINAL HANDOVER',
      painPoint: DEFAULT_PAIN_POINTS[4],
      storyText: study.finalize.text,
      link: study.finalize.link,
      videoUrl: study.finalize.videoUrl,
      techChecklist: [
        { label: 'Bảo hành kết cấu công trình', value: '10 năm cam kết bằng văn bản ký kết chính thức' },
        { label: 'Checklist bàn giao chìa khoá', value: 'Rà soát 120 điểm nghiệm thu cùng chủ nhà' },
        { label: 'Thời gian xử lý sự cố bảo trì', value: 'Có mặt hiện trường xử lý trong vòng 24-48h' },
      ],
    },
  ];

  const scrollToStage = (idx: number) => {
    const container = scrollContainerRef.current;
    const el = document.getElementById(`stage-section-${idx}`);
    if (container && el) {
      const containerTop = container.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      container.scrollTo({ top: container.scrollTop + (elTop - containerTop), behavior: 'smooth' });
      setActiveStage(idx);
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    let currentActive = 0;
    let minDiff = Infinity;
    for (let i = 0; i < stages.length; i++) {
      const el = document.getElementById(`stage-section-${i}`);
      if (el) {
        const diff = Math.abs(el.getBoundingClientRect().top - container.getBoundingClientRect().top);
        if (diff < minDiff) { minDiff = diff; currentActive = i; }
      }
    }
    setActiveStage(currentActive);
  };

  return (
    <div className="fixed inset-0 bg-[#161412]/95 z-[1000] flex items-center justify-center p-0 md:p-6 lg:p-10 font-sans text-[#2C2920] backdrop-blur-md overflow-hidden">
      <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 z-[1050] bg-[#FAF8F4] hover:bg-[#B8913A] hover:text-[#FAF8F4] text-[#1A1814] w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl font-light text-xl cursor-pointer">
        &times;
      </button>

      <div className="w-full h-full md:max-w-6xl md:h-[90vh] bg-[#FAF8F4] rounded-sm shadow-2xl overflow-hidden relative flex flex-col border border-[#2C2920]/15">
        <div className="bg-[#FAF8F4] px-6 py-4 border-b border-[#2C2920]/10 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-semibold text-[#1A1814]">DQH ARCHITECTS</span>
            <span className="text-[10px] text-[#8A8070] uppercase tracking-wider">Case Study Journal</span>
          </div>
          <span className="text-[9px] text-[#8A8070] uppercase tracking-widest font-semibold text-right">{study.title}</span>
        </div>

        <div className="h-[2px] w-full bg-stone-200 relative shrink-0">
          <div className="absolute top-0 left-0 h-full bg-[#B8913A] transition-all duration-500" style={{ width: `${(activeStage + 1) * 20}%` }} />
        </div>

        <div className="flex-1 flex overflow-hidden w-full relative">
          <div className="hidden md:flex w-60 border-r border-[#2C2920]/10 p-6 bg-[#FAF8F4] flex-col justify-between shrink-0 h-full">
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[8px] tracking-[0.25em] text-[#8A8070] font-bold uppercase block">NHẬT KÝ THI CÔNG</span>
                <h4 className="font-extrabold text-xs text-[#1A1814] uppercase tracking-wider leading-none">DQH QUALITY PROOF</h4>
              </div>
              <div className="h-[1px] w-full bg-[#2C2920]/10" />
              <div className="space-y-4">
                {stages.map((stg, sIdx) => (
                  <button key={sIdx} onClick={() => scrollToStage(sIdx)} className={`flex items-start gap-3 w-full text-left py-1.5 transition-all duration-300 cursor-pointer ${activeStage === sIdx ? 'text-[#B8913A] translate-x-1 font-bold' : 'text-[#8A8070] hover:text-[#1A1814]'}`}>
                    <span className={`font-mono text-[9px] tracking-wider ${activeStage === sIdx ? 'text-[#B8913A]' : 'text-stone-400'}`}>0{sIdx + 1}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] uppercase tracking-wider truncate leading-tight">{stg.title}</span>
                      <span className="text-[7px] tracking-widest text-[#8A8070] uppercase truncate mt-0.5">{stg.subtitle}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8 space-y-12 scroll-smooth bg-[#FAF8F4]">
            <div className="relative w-full h-[25vh] md:h-[40vh] rounded-sm overflow-hidden mb-6 border border-[#2C2920]/10 shadow-lg">
              {study.coverImage && (
                <img src={study.coverImage} alt={study.title} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#161412]/95 via-[#161412]/45 to-transparent flex flex-col justify-end p-5 md:p-8">
                <span className="text-[9px] tracking-[0.3em] uppercase text-[#D4BC95] font-extrabold block mb-1">JOURNAL OF ARCHITECTURAL FINISHING</span>
                <h2 className="font-extrabold text-xl md:text-3xl tracking-tight text-white uppercase leading-none mb-1.5">{study.title}</h2>
                <p className="text-[9px] text-stone-300 uppercase tracking-widest font-semibold">{study.location} · {study.area} · {study.style}</p>
              </div>
            </div>

            <div className="max-w-2xl mx-auto text-center space-y-3 pb-8 border-b border-[#2C2920]/10">
              <p className="font-serif italic text-xs md:text-sm text-[#B8913A] leading-relaxed">"{study.introText}"</p>
            </div>

            <div className="space-y-16 md:space-y-24 pb-12">
              {stages.map((stg, sIdx) => {
                const isExpanded = !!expandedDetails[`stage-${sIdx}`];
                return (
                  <div key={sIdx} id={`stage-section-${sIdx}`} className="relative grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 scroll-mt-6 border-b border-[#2C2920]/10 pb-12 last:border-b-0">
                    <div className="w-full md:sticky md:top-4 md:h-[45vh] self-start overflow-hidden rounded-sm bg-[#161412] border border-[#2C2920]/10 shadow-md flex items-center justify-center p-0 relative min-h-[250px] md:min-h-[300px]">
                      <PhaseVisuals stage={{ image: null }} index={sIdx} study={study} imageErrors={imageErrors} onImageError={url => setImageErrors(prev => ({ ...prev, [url]: true }))} />
                      <div className="absolute bottom-3 right-3 bg-[#161412]/80 border border-white/10 px-2 py-0.5 rounded-sm text-[8px] tracking-widest text-[#D4BC95] uppercase font-bold">PHASE 0{sIdx + 1} VISUALS</div>
                    </div>

                    <div className="space-y-5 flex flex-col justify-start">
                      <div className="space-y-1">
                        <span className="text-[9px] text-[#B8913A] font-bold tracking-widest block">PHASE 0{sIdx + 1} / 05</span>
                        <h3 className="font-extrabold text-base md:text-lg text-[#1A1814] tracking-wide uppercase">{stg.title}</h3>
                        <span className="block text-[9px] text-[#8A8070] tracking-widest font-medium">{stg.subtitle}</span>
                      </div>

                      <blockquote className="font-serif italic text-xs text-[#B8913A] pl-4 border-l-2 border-[#B8913A] py-1.5 pr-2 bg-[#B8913A]/5 rounded-r-sm leading-relaxed">
                        "{stg.painPoint}"
                      </blockquote>

                      <div className="space-y-4 text-xs text-[#2C2920] leading-relaxed">
                        {stg.storyText.split('\n\n').filter(Boolean).map((pText, pIdx) => {
                          if (!isExpanded && pIdx > 0) return null;
                          return <p key={pIdx}>{pText}</p>;
                        })}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <button onClick={() => setExpandedDetails(prev => ({ ...prev, [`stage-${sIdx}`]: !prev[`stage-${sIdx}`] }))} className="text-[9px] tracking-widest text-[#B8913A] hover:text-[#1A1814] uppercase font-bold flex items-center gap-1 transition-colors cursor-pointer border-b border-transparent hover:border-[#1A1814] pb-0.5 w-fit">
                          {isExpanded ? '[-] Thu gọn nhật ký' : '[+] Đọc câu chuyện đầy đủ'}
                        </button>
                        {'videoUrl' in stg && stg.videoUrl && (
                          <a href={stg.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] tracking-widest text-[#1A1814] hover:text-[#B8913A] uppercase font-bold flex items-center gap-1 transition-colors w-fit">
                            ▶ Xem video bàn giao
                          </a>
                        )}
                        {stg.link && (
                          <a href={stg.link} target="_blank" rel="noopener noreferrer" className="text-[9px] tracking-widest text-[#8A8070] hover:text-[#1A1814] uppercase font-bold flex items-center gap-1 transition-colors w-fit">
                            ↗ Xem thêm
                          </a>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="space-y-6 pt-5 border-t border-dashed border-[#2C2920]/15">
                          {sIdx === 1 && study.material.samples.length > 0 && (
                            <div className="space-y-3">
                              <span className="block text-[8px] tracking-[0.2em] uppercase text-[#1A1814] font-bold">KHAY MẪU VẬT LIỆU THỰC TẾ</span>
                              <div className="grid grid-cols-2 gap-2">
                                {study.material.samples.map((samp, sampIdx) => (
                                  <div key={sampIdx} className="bg-white p-1.5 rounded-sm border border-[#2C2920]/5 shadow-sm flex gap-2.5 items-center">
                                    <div className="w-9 h-9 rounded-sm overflow-hidden shrink-0 bg-stone-100 flex items-center justify-center">
                                      {samp.img && !imageErrors[samp.img] ? (
                                        <img src={samp.img} className="w-full h-full object-cover" alt={samp.name} onError={() => setImageErrors(prev => ({ ...prev, [samp.img!]: true }))} />
                                      ) : <span className="text-[7px] text-stone-400 font-mono">MAT</span>}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="block text-[8px] text-[#8A8070] uppercase truncate font-medium">{samp.desc}</span>
                                      <span className="block text-[9px] font-bold text-[#2C2920] truncate">{samp.name}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {sIdx === 3 && stg.detailsItems && stg.detailsItems.length > 0 && (
                            <div className="space-y-3">
                              <span className="block text-[8px] tracking-[0.2em] uppercase text-[#1A1814] font-bold">DANH SÁCH MỘC NỘI THẤT RỜI ĐÃ PHỐI HỢP</span>
                              <div className="grid grid-cols-1 gap-1">
                                {stg.detailsItems.map((det, dIdx) => (
                                  <div key={dIdx} className="flex items-center gap-3 bg-white p-1.5 border border-[#2C2920]/5 rounded-sm">
                                    <div className="w-[18px] h-[18px] rounded-full bg-[#1A1814] text-white flex items-center justify-center text-[8px] font-bold shrink-0">{det.num}</div>
                                    <span className="text-[9px] text-[#2C2920] font-medium">{det.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="space-y-3">
                            <span className="block text-[8px] tracking-[0.2em] uppercase text-[#1A1814] font-bold">BẰNG CHỨNG KỸ THUẬT (DQH QUALITY PROOF)</span>
                            <div className="space-y-2">
                              {stg.techChecklist.map((item, cIdx) => (
                                <div key={cIdx} className="bg-white p-2.5 rounded-sm border border-[#2C2920]/5 shadow-sm flex flex-col gap-0.5">
                                  <span className="font-bold text-[9px] text-[#1A1814] uppercase tracking-wide">{item.label}</span>
                                  <span className="text-[9px] text-[#8A8070] leading-relaxed">{item.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#161412] text-white p-8 rounded-sm text-center space-y-4 shadow-xl relative overflow-hidden max-w-2xl mx-auto mt-16">
              <div className="relative z-10 space-y-1">
                <span className="tracking-[0.35em] text-[10px] uppercase text-[#D4BC95] font-extrabold block">DQH ARCHITECTS</span>
                <span className="block text-[6px] tracking-[0.3em] uppercase text-stone-400">living space build &amp; success orientation</span>
              </div>
              <div className="relative z-10 space-y-1 py-2">
                <h4 className="font-extrabold text-3xl tracking-widest text-white leading-none">THANK YOU</h4>
                <p className="font-serif italic text-[#D4BC95] text-xs">for watching</p>
              </div>
              <div className="pt-4 border-t border-white/10 relative z-10 text-[8px] text-stone-300 uppercase tracking-widest flex flex-col gap-2 text-left">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-stone-500 font-semibold">Hotline:</span>
                  <a href="tel:0987897494" className="hover:text-[#D4BC95] transition-colors">098 789 7494</a>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-stone-500 font-semibold">Website:</span>
                  <a href="https://dqh.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-[#D4BC95] transition-colors lowercase">dqh.vercel.app</a>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-stone-500 font-semibold">Facebook:</span>
                  <a href="https://facebook.com/DQH.Architects" target="_blank" rel="noopener noreferrer" className="hover:text-[#D4BC95] transition-colors">DQH.Architects</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#FAF8F4] px-6 py-4 border-t border-[#2C2920]/10 flex items-center justify-between shrink-0 z-20">
          <div className="flex gap-2">
            <button disabled={activeStage === 0} onClick={() => scrollToStage(activeStage - 1)} className="w-8 h-8 rounded-full border border-[#2C2920]/10 flex items-center justify-center hover:bg-[#B8913A] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#2C2920] transition-colors cursor-pointer">←</button>
            <button disabled={activeStage === stages.length - 1} onClick={() => scrollToStage(activeStage + 1)} className="w-8 h-8 rounded-full border border-[#2C2920]/10 flex items-center justify-center hover:bg-[#B8913A] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#2C2920] transition-colors cursor-pointer">→</button>
          </div>
          <span className="text-[9px] font-semibold tracking-wider text-[#8A8070]">PHASE 0{activeStage + 1} / 05</span>
        </div>
      </div>
    </div>
  );
}
