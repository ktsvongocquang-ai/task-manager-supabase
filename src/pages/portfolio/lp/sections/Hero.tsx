import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../../services/supabase';
import { ButtonPrimary, ButtonLink } from '../ui/Button';
import type { LandingPageRow, Seg } from '../hooks/useLeadParams';

interface HeroSegmentRow {
  title: string | null;
  subtitle: string | null;
  hero_image: string | null;
  hero_video: string | null;
  facts: Record<string, string> | null;
}

interface Props {
  page: LandingPageRow | null | undefined;
  seg: Seg | undefined;
  setSeg: (seg: Seg) => void;
  onEstimate: () => void;
  onViewProjects: () => void;
}

const SEG_OPTIONS: { seg: Seg; label: string }[] = [
  { seg: 'can-ho', label: 'Căn hộ' },
  { seg: 'nha-pho-du-an', label: 'Nhà phố dự án' },
  { seg: 'nha-pho', label: 'Nhà phố' },
  { seg: 'villa', label: 'Villa / nhà vườn' },
];

// Render tiêu đề, từ bọc trong *...* hiện Cormorant nghiêng màu gold (NV4.2)
function renderAccentTitle(title: string) {
  return title.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.startsWith('*') && part.endsWith('*') ? (
      <em key={i} className="italic text-lp-gold">
        {part.slice(1, -1)}
      </em>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function Hero({ page, seg, setSeg, onEstimate, onViewProjects }: Props) {
  const [segRow, setSegRow] = useState<HeroSegmentRow | null | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const query =
      page?.id && seg
        ? supabase
            .from('landing_segments')
            .select('title,subtitle,hero_image,hero_video,facts')
            .eq('page_id', page.id)
            .eq('seg', seg)
            .maybeSingle()
        : Promise.resolve({ data: null as HeroSegmentRow | null });
    query
      .then(({ data }) => {
        if (!cancelled) setSegRow(data as HeroSegmentRow | null);
      })
      .catch(() => {
        if (!cancelled) setSegRow(null);
      });
    return () => {
      cancelled = true;
    };
  }, [page?.id, seg]);

  // NV4.1 — video chỉ tải sau khi ảnh poster đã hiện: gán src sau khi mount
  useEffect(() => {
    if (!videoRef.current || !segRow?.hero_video) return;
    videoRef.current.src = segRow.hero_video;
    videoRef.current.load();
  }, [segRow?.hero_video]);

  const handlePick = (next: Seg) => {
    setSeg(next);
    onViewProjects();
  };

  const revealClass = `transition-all duration-[600ms] ease-out motion-reduce:transition-none motion-reduce:transform-none ${
    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
  }`;

  return (
    <section id="hero" className="relative min-h-[85vh] flex items-end overflow-hidden bg-lp-espresso text-white">
      <div className="absolute inset-0">
        {segRow?.hero_video ? (
          <video
            ref={videoRef}
            muted
            autoPlay
            loop
            playsInline
            preload="none"
            poster={segRow?.hero_image || undefined}
            className="w-full h-full object-cover"
          />
        ) : segRow?.hero_image ? (
          <img src={segRow.hero_image} alt="" className="w-full h-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-lp-espresso" style={{ opacity: 0.45 }} />
      </div>

      <div className="relative z-10 w-full px-6 pb-16 pt-40 md:pb-24">
        <div className="max-w-2xl space-y-6">
          <div className={revealClass}>
            <h1 className="font-lp-serif text-4xl md:text-6xl font-light leading-[1.1]">
              {segRow?.title ? renderAccentTitle(segRow.title) : 'DQH Architects'}
            </h1>
          </div>

          {segRow?.subtitle && (
            <p className={`font-lp-sans text-sm md:text-base text-white/80 ${revealClass}`}>{segRow.subtitle}</p>
          )}

          {segRow?.facts && (
            <div className={`flex flex-wrap gap-x-10 gap-y-3 pt-2 ${revealClass}`}>
              {Object.entries(segRow.facts).map(([label, value]) => (
                <div key={label}>
                  <p className="font-lp-sans text-[10px] uppercase tracking-[0.15em] text-white/50">{label}</p>
                  <p className="font-lp-sans text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
          )}

          <div className={`flex flex-wrap gap-4 pt-4 ${revealClass}`}>
            <ButtonPrimary onClick={onEstimate}>Tính chi phí cho căn của tôi</ButtonPrimary>
            <ButtonLink onClick={onViewProjects} className="!text-white hover:!text-lp-gold">
              Xem công trình
            </ButtonLink>
          </div>

          {!seg && (
            <div className={`pt-8 ${revealClass}`}>
              <p className="font-lp-sans text-xs text-white/70 mb-3">Anh/chị đang chuẩn bị cho…</p>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                {SEG_OPTIONS.map(opt => (
                  <button
                    key={opt.seg}
                    onClick={() => handlePick(opt.seg)}
                    className="rounded-lp border border-white/30 bg-white/5 px-4 py-3 text-left font-lp-sans text-xs font-semibold text-white hover:border-lp-gold hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
