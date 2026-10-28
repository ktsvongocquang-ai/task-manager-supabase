import { useEffect, useRef, useState } from 'react';

// Route ảnh Supabase Storage qua Vercel Image Optimization: resize đúng kích thước
// hiển thị, tự convert webp/avif theo trình duyệt, cache ở edge (origin Supabase đang
// trả Cache-Control: no-cache nên không cache được — đây là nguyên nhân chính gây chậm).
export function vercelImg(src: string | undefined, width: number, quality = 75): string {
  if (!src || !/^https?:\/\//.test(src)) return src || '';
  return `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// "Case Study Journal" — dựng lại 2026-10-28 theo spec KTS Võ Ngọc Quang:
// data model theo phases[] (thay vì field cố định floorPlan/design3D/...),
// 60/40 không khung đen, 1 vùng cuộn duy nhất, ẩn giai đoạn rỗng, slider
// so sánh phối cảnh/thực tế, ảnh công trường đen trắng, khối mở đầu + kết.
//
// Dữ liệu CŨ trong Supabase (case_study jsonb, field cố định) vẫn đọc được
// nguyên trạng — normalizeCaseStudy() tự suy ra phases[] từ field cũ, không
// cần migrate DB. Muốn khai báo trực tiếp theo schema mới (phases[], palette,
// compare, fear, proof...) thì chỉ cần thêm field `phases` vào JSON, hàm này
// sẽ dùng thẳng field mới thay vì suy luận từ field cũ.
// ─────────────────────────────────────────────────────────────────────────────

export type CaseStudyImageType = 'site' | 'real' | 'render' | 'plan';
export interface CaseStudyImage { src: string; alt?: string; type: CaseStudyImageType; caption?: string }
export interface CaseStudyPhase {
  key: 'concept' | 'material' | 'rough' | 'assembly' | 'handover';
  fear: string;
  body?: string;
  proof?: string[];
  story?: string;
  images: CaseStudyImage[];
  planBefore?: { src: string; alt?: string };
  planAfter?: { src: string; alt?: string };
  materials?: { src: string; alt?: string; name: string }[];
  compare?: { render: { src: string; alt?: string }; real: { src: string; alt?: string } };
}
export interface CaseStudyData {
  id: string;
  title: string;
  location?: string;
  area?: string;
  style?: string;
  constructionTime?: string;
  cover: { src: string; alt?: string; type: 'real' | 'render' } | null;
  intro?: string;
  palette?: { hex: string; name: string }[];
  phases: CaseStudyPhase[];
  ending?: { src: string; alt?: string } | null;
  video?: { src: string; poster?: string } | null;
}

const PHASE_META: Record<CaseStudyPhase['key'], { title: string; subtitle: string; menuLabel: string }> = {
  concept: { title: 'Ý TƯỞNG & MẶT BẰNG', subtitle: 'CONCEPT & LAYOUT', menuLabel: 'Ý tưởng & mặt bằng' },
  material: { title: 'TINH CHỈNH & VẬT LIỆU', subtitle: 'MATERIAL & TAILORING', menuLabel: 'Tinh chỉnh & vật liệu' },
  rough: { title: 'THI CÔNG PHẦN THÔ', subtitle: 'ROUGH CONSTRUCTION', menuLabel: 'Thi công phần thô' },
  assembly: { title: 'LẮP RÁP NỘI THẤT', subtitle: 'INTERIOR ASSEMBLY', menuLabel: 'Lắp ráp nội thất' },
  handover: { title: 'BÀN GIAO THỰC TẾ', subtitle: 'FINAL HANDOVER', menuLabel: 'Bàn giao thực tế' },
};
const PHASE_ORDER: CaseStudyPhase['key'][] = ['concept', 'material', 'rough', 'assembly', 'handover'];
const DEFAULT_FEARS: Record<CaseStudyPhase['key'], string> = {
  concept: 'Gia chủ còn băn khoăn giữa việc giữ tối giản và tránh không gian bị lạnh lẽo, trống trải.',
  material: 'Lo ngại vật liệu thực tế lệch pha với phối cảnh 3D, phát sinh chi phí ngoài dự kiến.',
  rough: 'Rủi ro nứt tường, thấm sàn nếu không kiểm soát kỹ từng điểm tiếp giáp kết cấu.',
  assembly: 'Nội thất gia công cẩu thả, lắp đặt lệch khe shadow gap làm mất tính thẩm mỹ tổng thể.',
  handover: 'Bàn giao vội vã, bỏ sót lỗi nhỏ khiến gia chủ phải tự phát hiện và yêu cầu sửa lại.',
};

// Chuỗi bắt đầu bằng [MẪU]/TODO/lorem coi như trống — không hiển thị cho khách.
function isPlaceholder(s: unknown): boolean {
  if (typeof s !== 'string') return true;
  const t = s.trim();
  if (!t) return true;
  return /^(\[MẪU\]|TODO|lorem)/i.test(t);
}
function clean(s: unknown): string {
  return isPlaceholder(s) ? '' : (s as string).trim();
}
function cleanList(arr: unknown): string[] {
  return (Array.isArray(arr) ? arr : []).map(clean).filter(Boolean);
}
function toImgs(arr: unknown, type: CaseStudyImageType, altPrefix: string): CaseStudyImage[] {
  const list = Array.isArray(arr) ? arr : arr ? [arr] : [];
  return list.filter((s): s is string => typeof s === 'string' && !!s).map((src, i) => ({ src, type, alt: `${altPrefix} ${i + 1}` }));
}

// Dữ liệu cũ (floorPlan/design3D/tailoring/structural/material/fixedInterior/
// looseFurniture/details/finalize) — giữ nguyên interface để không phải sửa
// cách admin lưu case_study hiện có.
interface LegacyShape {
  coverImage?: string | null; introText?: string;
  // fear/story: override riêng từng giai đoạn — fear thay câu "nỗi lo gia chủ"
  // mặc định (DEFAULT_FEARS), story là bài kể dài mở qua nút "[+] Đọc câu
  // chuyện đầy đủ". Gắn vào field đại diện mỗi giai đoạn (floorPlan=concept,
  // tailoring=material, structural=rough, fixedInterior=assembly, finalize=handover).
  floorPlan?: { text?: string; sitePhotos?: string[]; sitePhoto?: string; blueprint?: string | null; planBeforeImage?: string | null; link?: string; fear?: string; story?: string };
  design3D?: { text?: string; images?: string[] };
  tailoring?: { text?: string; steps?: { title: string; desc: string }[]; link?: string; fear?: string; story?: string };
  structural?: { text?: string; images?: string[]; imgMain?: string | null; link?: string; fear?: string; story?: string };
  material?: { text?: string; samples?: { name: string; desc: string; img: string | null }[] };
  fixedInterior?: { text?: string; extraText?: string; images?: string[]; imgMain?: string | null; link?: string; fear?: string; story?: string };
  looseFurniture?: { text?: string; images?: string[]; imgMain?: string | null };
  details?: { items?: { num: number; name: string }[] };
  finalize?: { text?: string; images?: string[]; videoUrl?: string; link?: string; compareRenderImage?: string | null; compareRealImage?: string | null; fear?: string; story?: string };
}

export type RawCaseStudy = LegacyShape & {
  id?: string; title?: string; location?: string; area?: string; style?: string; constructionTime?: string;
  cover?: { src?: string; alt?: string; type?: 'real' | 'render' } | null;
  intro?: string;
  palette?: { hex: string; name: string }[];
  phases?: Array<Partial<CaseStudyPhase>>;
  ending?: { src: string; alt?: string } | null;
  video?: { src: string; poster?: string } | null;
  // Giai đoạn admin chủ động tắt (checkbox trong CaseStudyEditor) — ẩn trên
  // trang dù có nội dung, tránh dàn trải khi 1 giai đoạn không đáng kể.
  hiddenPhases?: CaseStudyPhase['key'][];
};

function phasesFromNewShape(raw: NonNullable<RawCaseStudy['phases']>): CaseStudyPhase[] {
  return raw
    .filter((p): p is Partial<CaseStudyPhase> & { key: CaseStudyPhase['key'] } => !!p.key)
    .map(p => ({
      key: p.key,
      fear: clean(p.fear) || DEFAULT_FEARS[p.key],
      body: clean(p.body) || undefined,
      proof: cleanList(p.proof),
      story: clean(p.story) || undefined,
      images: (p.images || []).filter(im => im?.src),
      planBefore: p.planBefore?.src ? p.planBefore : undefined,
      planAfter: p.planAfter?.src ? p.planAfter : undefined,
      materials: (p.materials || []).filter(m => m?.src && clean(m.name)),
      compare: p.compare?.render?.src && p.compare?.real?.src ? p.compare : undefined,
    }));
}

function phasesFromLegacy(raw: LegacyShape): CaseStudyPhase[] {
  const fp = raw.floorPlan || {};
  const d3 = raw.design3D || {};
  const tl = raw.tailoring || {};
  const mt = raw.material || {};
  const st = raw.structural || {};
  const fi = raw.fixedInterior || {};
  const lf = raw.looseFurniture || {};
  const dt = raw.details || {};
  const fz = raw.finalize || {};

  const concept: CaseStudyPhase = {
    key: 'concept', fear: clean(fp.fear) || DEFAULT_FEARS.concept, story: clean(fp.story) || undefined,
    body: [clean(fp.text), clean(d3.text)].filter(Boolean).join(' ') || undefined,
    images: [...toImgs(fp.sitePhotos?.length ? fp.sitePhotos : fp.sitePhoto, 'site', 'Hiện trạng'), ...toImgs(d3.images, 'render', 'Phối cảnh ý tưởng')],
    planAfter: fp.blueprint ? { src: fp.blueprint, alt: 'Mặt bằng bố trí' } : undefined,
    planBefore: fp.planBeforeImage ? { src: fp.planBeforeImage, alt: 'Hiện trạng' } : undefined,
  };
  const material: CaseStudyPhase = {
    key: 'material', fear: clean(tl.fear) || DEFAULT_FEARS.material, story: clean(tl.story) || undefined,
    body: [clean(tl.text), clean(mt.text)].filter(Boolean).join(' ') || undefined,
    images: [],
    materials: (mt.samples || []).filter(s => s?.img && clean(s.name)).map(s => ({ src: s.img as string, alt: s.name, name: s.name })),
    proof: (tl.steps || []).map(s => (clean(s.title) && clean(s.desc) ? `${clean(s.title)}: ${clean(s.desc)}` : '')).filter(Boolean),
  };
  const rough: CaseStudyPhase = {
    key: 'rough', fear: clean(st.fear) || DEFAULT_FEARS.rough, story: clean(st.story) || undefined,
    body: clean(st.text) || undefined,
    images: toImgs(st.images?.length ? st.images : st.imgMain, 'site', 'Thi công phần thô'),
  };
  const assembly: CaseStudyPhase = {
    key: 'assembly', fear: clean(fi.fear) || DEFAULT_FEARS.assembly, story: clean(fi.story) || undefined,
    body: [clean(fi.text), clean(fi.extraText), clean(lf.text)].filter(Boolean).join(' ') || undefined,
    images: [...toImgs(fi.images?.length ? fi.images : fi.imgMain, 'site', 'Nội thất cố định'), ...toImgs(lf.images?.length ? lf.images : lf.imgMain, 'site', 'Nội thất rời')],
    proof: (dt.items || []).map(it => clean(it.name)).filter(Boolean),
  };
  const handover: CaseStudyPhase = {
    key: 'handover', fear: clean(fz.fear) || DEFAULT_FEARS.handover, story: clean(fz.story) || undefined,
    body: clean(fz.text) || undefined,
    images: toImgs(fz.images, 'real', 'Bàn giao'),
    compare: fz.compareRenderImage && fz.compareRealImage
      ? { render: { src: fz.compareRenderImage, alt: 'Phối cảnh thiết kế' }, real: { src: fz.compareRealImage, alt: 'Thực tế bàn giao' } }
      : undefined,
  };
  return [concept, material, rough, assembly, handover];
}

export function normalizeCaseStudy(raw: RawCaseStudy): CaseStudyData {
  let phases = Array.isArray(raw.phases) && raw.phases.length ? phasesFromNewShape(raw.phases) : phasesFromLegacy(raw);

  // Ẩn giai đoạn không có GÌ để hiện (không ảnh, không mặt bằng, không vật
  // liệu, không cặp so sánh, không chữ kể chuyện nào) — không bao giờ hiện ô
  // trống/chữ giữ chỗ. Có chữ thật (body/proof/story) thì vẫn giữ giai đoạn
  // dù thiếu ảnh — nội dung viết tay không nên mất chỉ vì chưa kịp gắn ảnh.
  phases = phases.filter(p =>
    p.images.length > 0 || !!p.materials?.length || !!p.planBefore || !!p.planAfter || !!p.compare ||
    !!p.body || !!p.story || (p.proof && p.proof.length > 0)
  );
  // Bàn giao chỉ giữ khi có ảnh THỰC TẾ (type 'real') hoặc cặp so sánh —
  // tuyệt đối không gọi phối cảnh là ảnh bàn giao thực tế.
  phases = phases.filter(p => p.key !== 'handover' || p.images.some(i => i.type === 'real') || !!p.compare);
  // Admin chủ động ẩn giai đoạn (checkbox) dù có nội dung — tránh dàn trải.
  const hidden = new Set(raw.hiddenPhases || []);
  phases = phases.filter(p => !hidden.has(p.key));
  phases.sort((a, b) => PHASE_ORDER.indexOf(a.key) - PHASE_ORDER.indexOf(b.key));

  const legacyVideo = raw.finalize?.videoUrl;
  const firstRealImg = phases.flatMap(p => p.images).find(i => i.type === 'real');
  const coverSrc = clean(raw.cover?.src) || clean(raw.coverImage) || firstRealImg?.src || '';

  return {
    id: raw.id || '',
    // Bỏ nhãn "[DQH]"/"[JUX]" ở đầu tên khi hiển thị trong Case Study Journal
    // — ký hiệu chuẩn dịch vụ chỉ cần thiết ở danh sách công trình ngoài trang.
    title: clean(raw.title).replace(/^\[[^\]]+\]\s*/, ''),
    location: clean(raw.location) || undefined,
    area: clean(raw.area) || undefined,
    style: clean(raw.style) || undefined,
    constructionTime: clean(raw.constructionTime) || undefined,
    cover: coverSrc ? { src: coverSrc, alt: clean(raw.title), type: raw.cover?.type === 'render' ? 'render' : 'real' } : null,
    intro: clean(raw.intro ?? raw.introText) || undefined,
    palette: (raw.palette || []).filter(c => c?.hex && clean(c.name)),
    phases,
    ending: raw.ending?.src ? raw.ending : null,
    video: raw.video?.src ? raw.video : legacyVideo ? { src: legacyVideo } : null,
  };
}

// ── Lightbox dùng chung, giữ nguyên hành vi cũ (←→, Esc, tải ảnh) ──
function Lightbox({ images, index, onClose, onNav }: { images: CaseStudyImage[]; index: number; onClose: () => void; onNav: (i: number) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < images.length - 1) onNav(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) onNav(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, images.length, onClose, onNav]);

  const img = images[index];
  return (
    <div className="fixed inset-0 bg-black/95 z-[1200] flex items-center justify-center p-4 md:p-10" onClick={onClose}>
      <button onClick={onClose} aria-label="Đóng" className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl font-light cursor-pointer">&times;</button>
      <a href={img.src} download target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="absolute top-5 right-20 text-white/80 hover:text-white text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5">⬇ Tải ảnh</a>
      {images.length > 1 && (
        <>
          <button disabled={index === 0} onClick={e => { e.stopPropagation(); onNav(index - 1); }} className="absolute left-3 md:left-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 disabled:cursor-default flex items-center justify-center cursor-pointer">←</button>
          <button disabled={index === images.length - 1} onClick={e => { e.stopPropagation(); onNav(index + 1); }} className="absolute right-3 md:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 disabled:cursor-default flex items-center justify-center cursor-pointer">→</button>
          <span className="absolute bottom-5 text-white/60 text-[11px] tracking-widest">{index + 1} / {images.length}</span>
        </>
      )}
      <img src={vercelImg(img.src, 1600)} alt={img.alt || ''} decoding="async" onClick={e => e.stopPropagation()} className="max-w-full max-h-full object-contain cursor-default" />
    </div>
  );
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function VideoPlayerOverlay({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const ytId = getYouTubeId(url);
  return (
    <div className="fixed inset-0 bg-black/95 z-[1300] flex items-center justify-center p-4 md:p-10" onClick={onClose}>
      <button onClick={onClose} aria-label="Đóng" className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl font-light cursor-pointer">&times;</button>
      <div className="w-full max-w-4xl aspect-video" onClick={e => e.stopPropagation()}>
        {ytId ? (
          <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`} title="Video bàn giao" className="w-full h-full border-0 rounded-sm" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <video src={url} controls autoPlay className="w-full h-full rounded-sm bg-black" />
        )}
      </div>
    </div>
  );
}

// ── Thanh kéo so sánh Phối cảnh ↔ Thực tế (chuột/chạm/bàn phím) ──
function BeforeAfterSlider({ render, real }: { render: { src: string; alt?: string }; real: { src: string; alt?: string } }) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClientX = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) setFromClientX(e.clientX); };
    const onUp = () => { dragging.current = false; };
    const onTouchMove = (e: TouchEvent) => { if (dragging.current && e.touches[0]) setFromClientX(e.touches[0].clientX); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  return (
    <div ref={ref} className="relative w-full aspect-[4/3] overflow-hidden rounded-[2px] select-none bg-[#161412]">
      <img src={vercelImg(render.src, 900)} alt={render.alt || 'Phối cảnh thiết kế'} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <span className="absolute top-3 left-3 bg-[#161412]/80 text-white text-[9px] uppercase tracking-widest px-2 py-1 rounded-sm font-bold">Phối cảnh thiết kế</span>
      <img
        src={vercelImg(real.src, 900)}
        alt={real.alt || 'Thực tế bàn giao'}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        draggable={false}
      />
      <span className="absolute top-3 right-3 bg-[#B8913A] text-[#1A1814] text-[9px] uppercase tracking-widest px-2 py-1 rounded-sm font-bold" style={{ opacity: pos > 18 ? 1 : 0 }}>Thực tế bàn giao</span>
      <div className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none" style={{ left: `${pos}%` }} />
      <button
        type="button"
        role="slider"
        aria-label="Kéo để so sánh phối cảnh thiết kế và thực tế bàn giao"
        aria-valuenow={Math.round(pos)}
        aria-valuemin={0}
        aria-valuemax={100}
        onMouseDown={() => { dragging.current = true; }}
        onTouchStart={() => { dragging.current = true; }}
        onKeyDown={e => {
          if (e.key === 'ArrowLeft') setPos(p => Math.max(0, p - 5));
          if (e.key === 'ArrowRight') setPos(p => Math.min(100, p + 5));
        }}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-[#2C2920]/10 flex items-center justify-center cursor-ew-resize focus:outline-none focus:ring-2 focus:ring-[#B8913A]"
        style={{ left: `${pos}%` }}
      >
        <span className="text-[#2C2920] text-sm">⇔</span>
      </button>
    </div>
  );
}

// Nhịp dàn trang kiểu tạp chí — xen kẽ 1 ảnh lớn (hero, tỉ lệ điện ảnh) / 3 ảnh
// nhỏ (vuông) / 2 ảnh vừa (dọc) thay vì lưới đều. Lặp lại nhịp này cho tới khi
// hết ảnh, nên hiện được TẤT CẢ ảnh thay vì cắt còn 4 như lưới cũ.
const MAGAZINE_RHYTHM = [1, 3, 2, 2, 3, 1] as const;
const CHUNK_STYLE: Record<number, { aspect: string; cols: string }> = {
  1: { aspect: 'aspect-[21/9]', cols: 'grid-cols-1' },
  2: { aspect: 'aspect-[3/4]', cols: 'grid-cols-2' },
  3: { aspect: 'aspect-square', cols: 'grid-cols-3' },
};

function PhaseImageGrid({ images, onOpen, colorReveal }: { images: CaseStudyImage[]; onOpen: (i: number) => void; colorReveal?: boolean }) {
  if (images.length === 0) return null;

  const chunks: CaseStudyImage[][] = [];
  let cursor = 0;
  let rhythmIdx = 0;
  while (cursor < images.length) {
    const size = MAGAZINE_RHYTHM[rhythmIdx % MAGAZINE_RHYTHM.length];
    chunks.push(images.slice(cursor, cursor + size));
    cursor += size;
    rhythmIdx++;
  }

  let globalIdx = 0;
  return (
    <div className="space-y-2 md:space-y-3">
      {chunks.map((chunk, ci) => {
        const style = CHUNK_STYLE[chunk.length] || CHUNK_STYLE[3];
        return (
          <div key={ci} className={`grid ${style.cols} gap-2 md:gap-3`}>
            {chunk.map(im => {
              const i = globalIdx++;
              const isSite = im.type === 'site';
              const filterClass = isSite ? 'grayscale contrast-[1.05]' : im.type === 'real' && colorReveal !== undefined
                ? `transition-[filter] duration-[900ms] ease-out ${colorReveal ? 'grayscale-0' : 'grayscale'}`
                : '';
              return (
                <button key={i} type="button" onClick={() => onOpen(i)} className={`relative overflow-hidden rounded-[2px] group cursor-zoom-in w-full ${style.aspect}`}>
                  <img src={vercelImg(im.src, chunk.length === 1 ? 1600 : 700)} alt={im.alt || ''} loading="lazy" decoding="async" className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] ${filterClass}`} />
                  {im.type === 'render' && (
                    <span className="absolute top-2 left-2 bg-[#161412]/80 text-white text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm font-bold">Phối cảnh thiết kế</span>
                  )}
                  {im.caption && (
                    <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-[9px] px-2 py-1.5">{im.caption}</span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
  }, []);
  return reduced;
}

// Mờ dần + trượt lên khi vào viewport, chạy 1 lần, tắt khi reduced-motion.
function RevealOnView({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) { setVisible(true); return; }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced]);
  return (
    <div
      ref={ref}
      className={className}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 450ms ease-out, transform 450ms ease-out' }}
    >
      {children}
    </div>
  );
}

function StatRow({ study }: { study: CaseStudyData }) {
  const items = [study.area, study.location, study.style, study.constructionTime].filter(Boolean);
  if (items.length === 0) return null;
  return <p className="text-[10px] md:text-xs text-white/75 uppercase tracking-widest font-semibold">{items.join(' · ')}</p>;
}

export function CaseStudyModal({ study, onClose }: { study: CaseStudyData; onClose: () => void }) {
  const [activeKey, setActiveKey] = useState<string>(study.phases[0]?.key || 'intro');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [lightbox, setLightbox] = useState<{ images: CaseStudyImage[]; index: number } | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [handoverRevealed, setHandoverRevealed] = useState(false);
  // Thanh tiến trình đổi liên tục khi cuộn (60 lần/giây) — nếu để React state thì
  // MỖI frame sẽ re-render lại toàn bộ cây component (mọi section + ảnh bên dưới),
  // đó là nguyên nhân chính gây giật khi cuộn. Ghi thẳng vào DOM qua ref, bỏ qua React.
  const progressRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const handoverRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  const sections = [{ key: 'intro', label: null as string | null }, ...study.phases.map(p => ({ key: p.key, label: PHASE_META[p.key].menuLabel })), { key: 'ending', label: null }];

  // Khoá cuộn body khi mở, mở hash #case-<id> để gửi link thẳng, Esc đóng.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const prevHash = window.location.hash;
    if (study.id) window.history.replaceState(null, '', `#case-${study.id}`);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      if (window.location.hash.startsWith('#case-')) window.history.replaceState(null, '', window.location.pathname + window.location.search + (prevHash.startsWith('#case-') ? '' : prevHash));
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [study.id]);

  // Giai đoạn bàn giao: đen trắng → màu khi cuộn tới (1 lần), bỏ qua nếu reduced-motion.
  useEffect(() => {
    if (reduced) { setHandoverRevealed(true); return; }
    const el = handoverRef.current;
    if (!el) { setHandoverRevealed(true); return; }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setHandoverRevealed(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced]);

  const scrollToSection = (key: string) => {
    const el = document.getElementById(`cs-section-${key}`);
    const container = scrollRef.current;
    if (el && container) {
      const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
      container.scrollTo({ top: top - 8, behavior: reduced ? 'auto' : 'smooth' });
    }
    setActiveKey(key);
  };

  // getBoundingClientRect() trên từng section là layout read — chạy thẳng
  // trên mỗi sự kiện scroll (bắn hàng chục lần/giây khi vuốt) sẽ giật máy yếu/
  // mobile. Gộp lại chỉ tính 1 lần mỗi khung hình bằng requestAnimationFrame.
  const scrollRaf = useRef<number | null>(null);
  const handleScroll = () => {
    if (scrollRaf.current !== null) return;
    scrollRaf.current = requestAnimationFrame(() => {
      scrollRaf.current = null;
      const container = scrollRef.current;
      if (!container) return;
      const top = container.getBoundingClientRect().top;
      let current = sections[0].key;
      let minDiff = Infinity;
      for (const s of sections) {
        const el = document.getElementById(`cs-section-${s.key}`);
        if (!el) continue;
        const diff = Math.abs(el.getBoundingClientRect().top - top);
        if (diff < minDiff) { minDiff = diff; current = s.key; }
      }
      setActiveKey(current);
      const scrolled = container.scrollTop / Math.max(1, container.scrollHeight - container.clientHeight);
      const pct = Math.min(100, Math.max(0, scrolled * 100));
      if (progressRef.current) progressRef.current.style.width = pct + '%';
    });
  };
  useEffect(() => () => { if (scrollRaf.current !== null) cancelAnimationFrame(scrollRaf.current); }, []);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#F7F4EF] text-[#2B211C] font-sans">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-stone-200 z-[1050]">
        <div ref={progressRef} className="h-full bg-[#B08A4A]" style={{ width: '0%' }} />
      </div>
      <button onClick={onClose} aria-label="Đóng" className="fixed top-4 right-4 md:top-6 md:right-6 z-[1060] bg-[#2B211C] hover:bg-[#B08A4A] text-white w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-colors shadow-lg text-xl font-light cursor-pointer">
        &times;
      </button>

      <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto overscroll-contain">
        {/* ── Header + nav ngang mobile (sticky) ── */}
        <div className="sticky top-0 z-[1040] bg-[#F7F4EF]/95 backdrop-blur-sm border-b border-[#2B211C]/10">
          <div className="px-5 md:px-8 py-3 flex items-center justify-between">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="font-serif text-sm font-semibold shrink-0">DQH ARCHITECTS</span>
              <span className="text-[9px] text-[#6E625A] uppercase tracking-wider hidden sm:inline">Case Study Journal</span>
            </div>
            <span className="text-[9px] text-[#6E625A] uppercase tracking-widest font-semibold truncate ml-3">{study.title}</span>
          </div>
          <div className="lg:hidden flex gap-1 px-5 md:px-8 pb-3 overflow-x-auto no-scrollbar">
            {study.phases.map((p, i) => (
              <button
                key={p.key}
                onClick={() => scrollToSection(p.key)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-colors ${activeKey === p.key ? 'bg-[#2B211C] text-white' : 'bg-[#2B211C]/5 text-[#6E625A]'}`}
              >
                {String(i + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex max-w-[1400px] mx-auto">
          {/* ── Menu trái, desktop ── */}
          <nav className="hidden lg:block w-60 shrink-0 sticky top-[57px] self-start h-[calc(100vh-57px)] overflow-y-auto px-8 py-10">
            <div className="space-y-1">
              <span className="text-[8px] tracking-[0.25em] text-[#6E625A] font-bold uppercase block">NHẬT KÝ THI CÔNG</span>
              <h4 className="font-extrabold text-xs uppercase tracking-wider leading-none">DQH QUALITY PROOF</h4>
            </div>
            <div className="h-px w-full bg-[#2B211C]/10 my-6" />
            <div className="space-y-4">
              {study.phases.map((p, i) => (
                <button key={p.key} onClick={() => scrollToSection(p.key)} className={`flex items-start gap-3 w-full text-left py-1 transition-all cursor-pointer ${activeKey === p.key ? 'text-[#B08A4A] translate-x-1 font-bold' : 'text-[#6E625A] hover:text-[#2B211C]'}`}>
                  <span className={`font-mono text-[9px] tracking-wider pt-0.5 ${activeKey === p.key ? 'text-[#B08A4A]' : 'text-stone-400'}`}>{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase tracking-wider leading-tight">{PHASE_META[p.key].title}</span>
                    <span className="text-[8px] tracking-widest text-[#6E625A] uppercase mt-0.5">{PHASE_META[p.key].subtitle}</span>
                  </div>
                </button>
              ))}
            </div>
          </nav>

          {/* ── Nội dung ── */}
          <div className="flex-1 min-w-0 pb-24 lg:pb-16">
            {/* 00 — Mở đầu */}
            <section id="cs-section-intro" className="relative scroll-mt-24">
              <div className="relative w-full h-[55vh] md:h-[70vh] overflow-hidden">
                {study.cover && <img src={vercelImg(study.cover.src, 1600)} alt={study.cover.alt || study.title} decoding="async" fetchPriority="high" className="w-full h-full object-cover" />}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, #161412 0%, rgba(22,20,18,0.78) 28%, rgba(22,20,18,0.28) 58%, rgba(22,20,18,0) 85%)' }}
                />
                {study.cover?.type === 'render' && (
                  <span className="absolute top-5 left-5 bg-[#161412]/80 text-white text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-sm font-bold">Phối cảnh thiết kế</span>
                )}
                <div className="absolute inset-x-0 bottom-0 px-5 md:px-10 pb-8 md:pb-12">
                  <span className="text-[9px] tracking-[0.3em] uppercase text-[#D4BC95] font-extrabold block mb-2">JOURNAL OF ARCHITECTURAL FINISHING</span>
                  <h1 className="font-extrabold text-3xl md:text-6xl tracking-tight text-white uppercase leading-[1.02] mb-2">{study.title}</h1>
                  <StatRow study={study} />
                </div>
              </div>
              {study.intro && (
                <RevealOnView className="max-w-2xl mx-auto text-center px-5 py-10 md:py-14">
                  <p className="font-serif italic text-sm md:text-base text-[#B08A4A] leading-relaxed">"{study.intro}"</p>
                </RevealOnView>
              )}
            </section>

            {/* 01–05 giai đoạn */}
            {study.phases.map((phase, pIdx) => {
              const meta = PHASE_META[phase.key];
              const isExpanded = !!expanded[phase.key];
              const isHandover = phase.key === 'handover';
              return (
                <section
                  key={phase.key}
                  id={`cs-section-${phase.key}`}
                  ref={isHandover ? handoverRef : undefined}
                  className="scroll-mt-24 px-5 md:px-10 py-14 md:py-20 border-t border-[#2B211C]/10"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-[60%_1fr] gap-8 lg:gap-12">
                    <RevealOnView className="lg:sticky lg:top-[72px] self-start space-y-4">
                      {phase.key === 'concept' && (phase.planBefore || phase.planAfter) ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {phase.planBefore && (
                            <div className="space-y-1.5">
                              <img src={vercelImg(phase.planBefore.src, 700)} alt={phase.planBefore.alt || 'Hiện trạng'} loading="lazy" decoding="async" className="w-full aspect-[4/3] object-cover rounded-[2px] bg-white" />
                              <span className="block text-[9px] uppercase tracking-widest text-[#6E625A] font-semibold">Hiện trạng</span>
                            </div>
                          )}
                          {phase.planAfter && (
                            <div className="space-y-1.5">
                              <img src={vercelImg(phase.planAfter.src, 700)} alt={phase.planAfter.alt || 'Phương án bố trí'} loading="lazy" decoding="async" className="w-full aspect-[4/3] object-cover rounded-[2px] bg-white" />
                              <span className="block text-[9px] uppercase tracking-widest text-[#6E625A] font-semibold">Phương án bố trí</span>
                            </div>
                          )}
                        </div>
                      ) : null}
                      {phase.images.length > 0 && (
                        <PhaseImageGrid
                          images={phase.images}
                          onOpen={i => setLightbox({ images: phase.images, index: i })}
                          colorReveal={isHandover ? handoverRevealed : undefined}
                        />
                      )}
                      {phase.key === 'material' && phase.materials && phase.materials.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {phase.materials.map((m, i) => (
                            <button key={i} type="button" onClick={() => setLightbox({ images: phase.materials!.map(mm => ({ src: mm.src, alt: mm.name, type: 'site' as const })), index: i })} className="space-y-1.5 text-left cursor-zoom-in">
                              <img src={vercelImg(m.src, 300)} alt={m.alt || m.name} loading="lazy" decoding="async" className="w-full aspect-square object-cover rounded-[2px]" />
                              <span className="block text-[10px] font-semibold text-[#2B211C]">{m.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {phase.key === 'material' && study.palette && study.palette.length > 0 && (
                        <div className="flex gap-3 pt-1">
                          {study.palette.map((c, i) => (
                            <div key={i} className="space-y-1.5">
                              <div className="w-12 h-12 rounded-full border border-[#2B211C]/10 shadow-sm" style={{ backgroundColor: c.hex }} />
                              <span className="block text-[8px] uppercase tracking-wide text-[#6E625A] text-center">{c.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {phase.compare && <BeforeAfterSlider render={phase.compare.render} real={phase.compare.real} />}
                    </RevealOnView>

                    <RevealOnView className="space-y-5">
                      <div className="space-y-1">
                        <span className="text-[9px] text-[#B08A4A] font-bold tracking-widest block">PHASE {String(pIdx + 1).padStart(2, '0')} / {String(study.phases.length).padStart(2, '0')}</span>
                        <h2 className="font-extrabold text-xl md:text-2xl tracking-wide uppercase">{meta.title}</h2>
                        <span className="block text-[9px] text-[#6E625A] tracking-widest font-medium">{meta.subtitle}</span>
                      </div>

                      <blockquote className="font-serif italic text-xs md:text-sm text-[#B08A4A] pl-4 border-l-2 border-[#B08A4A] py-2 pr-2 bg-[#B08A4A]/5 rounded-r-sm leading-relaxed">
                        "{phase.fear}"
                      </blockquote>

                      {phase.body && <p className="text-sm text-[#2B211C] leading-relaxed">{phase.body}</p>}

                      {phase.proof && phase.proof.length > 0 && (
                        <ul className="space-y-1.5">
                          {phase.proof.map((pr, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-[#2B211C]">
                              <span className="text-[#B08A4A] mt-0.5 shrink-0">—</span>
                              <span>{pr}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {phase.story && (
                        <div>
                          <button onClick={() => setExpanded(prev => ({ ...prev, [phase.key]: !prev[phase.key] }))} className="text-[9px] tracking-widest text-[#B08A4A] hover:text-[#2B211C] uppercase font-bold flex items-center gap-1 transition-colors cursor-pointer border-b border-transparent hover:border-[#2B211C] pb-0.5 w-fit">
                            {isExpanded ? '[-] Thu gọn' : '[+] Đọc câu chuyện đầy đủ'}
                          </button>
                          {isExpanded && (
                            <div className="pt-4 space-y-3 text-xs text-[#2B211C] leading-relaxed">
                              {phase.story.split('\n\n').filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}
                            </div>
                          )}
                        </div>
                      )}
                    </RevealOnView>
                  </div>
                </section>
              );
            })}

            {/* KẾT */}
            <section id="cs-section-ending" className="scroll-mt-24 relative">
              <div className="relative w-full h-[50vh] md:h-[65vh] overflow-hidden">
                {(study.ending?.src || study.cover?.src) && (
                  <img src={vercelImg(study.ending?.src || study.cover!.src, 1200)} alt={study.ending?.alt || study.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-[#161412]/60" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <RevealOnView>
                    <StatRow study={study} />
                    <p className="mt-5 max-w-md text-sm md:text-base text-white font-serif italic leading-relaxed">
                      Anh/chị đang chuẩn bị làm nhà? DQH khảo sát hiện trạng và gửi khái toán sơ bộ miễn phí tại TP.HCM.
                    </p>
                    <div className="mt-7 flex flex-col sm:flex-row gap-3 items-center justify-center">
                      <a href="https://zalo.me/0982914368" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#B08A4A] hover:bg-[#D4BC95] text-[#1A1814] text-xs font-bold uppercase tracking-widest px-7 py-3.5 rounded-sm transition-colors cursor-pointer">
                        Nhắn Zalo
                      </a>
                      <button
                        type="button"
                        onClick={() => { onClose(); setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }), 50); }}
                        className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/10 text-white border border-white/40 text-xs font-bold uppercase tracking-widest px-7 py-3.5 rounded-sm transition-colors cursor-pointer"
                      >
                        Nhận khảo sát miễn phí
                      </button>
                    </div>
                    <p className="mt-4 text-[11px] text-white/70 tracking-wide">Hotline 0982 914 368</p>
                  </RevealOnView>
                </div>
              </div>

              {study.video && (
                <RevealOnView className="max-w-2xl mx-auto px-5 py-10">
                  <button type="button" onClick={() => setVideoOpen(true)} className="group relative block w-full aspect-video rounded-sm overflow-hidden border border-[#2B211C]/10 shadow-lg bg-[#161412] cursor-pointer">
                    {study.video.poster ? (
                      <img src={vercelImg(study.video.poster, 1200)} alt="Video bàn giao" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" />
                    ) : getYouTubeId(study.video.src) ? (
                      <img src={`https://img.youtube.com/vi/${getYouTubeId(study.video.src)}/hqdefault.jpg`} alt="Video bàn giao" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#2C2920] to-[#1A1814]" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/15 transition-colors">
                      <div className="w-14 h-14 rounded-full bg-[#B08A4A] group-hover:scale-110 transition-transform flex items-center justify-center shadow-xl">
                        <span className="text-[#1A1814] text-xl ml-1">&#9654;</span>
                      </div>
                    </div>
                  </button>
                </RevealOnView>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* ← → chỉ hiện mobile/tablet */}
      <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[1050] flex items-center gap-3 bg-[#2B211C]/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-xl">
        <button
          disabled={sections.findIndex(s => s.key === activeKey) <= 0}
          onClick={() => { const i = sections.findIndex(s => s.key === activeKey); if (i > 0) scrollToSection(sections[i - 1].key); }}
          className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center disabled:opacity-30 cursor-pointer"
        >←</button>
        <span className="text-[9px] text-white/80 tracking-widest font-semibold px-1">{sections.findIndex(s => s.key === activeKey) + 1}/{sections.length}</span>
        <button
          disabled={sections.findIndex(s => s.key === activeKey) >= sections.length - 1}
          onClick={() => { const i = sections.findIndex(s => s.key === activeKey); if (i < sections.length - 1) scrollToSection(sections[i + 1].key); }}
          className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center disabled:opacity-30 cursor-pointer"
        >→</button>
      </div>

      {lightbox && (
        <Lightbox images={lightbox.images} index={lightbox.index} onClose={() => setLightbox(null)} onNav={i => setLightbox(prev => (prev ? { ...prev, index: i } : prev))} />
      )}
      {videoOpen && study.video && <VideoPlayerOverlay url={study.video.src} onClose={() => setVideoOpen(false)} />}
    </div>
  );
}
