import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLeadParams, type Seg } from './hooks/useLeadParams';
import { useSeo } from './hooks/useSeo';
import { track } from './lib/track';
import { StickyBar } from './StickyBar';
import { Hero } from './sections/Hero';
import { ProjectsBlock } from './sections/ProjectsBlock';
import { Estimator } from './sections/Estimator';
import { Architect } from './sections/Architect';
import { Offer } from './sections/Offer';
import { Footer } from './Footer';

const SEG_TITLE: Record<Seg, string> = {
  'can-ho': 'Thiết kế & thi công căn hộ',
  'nha-pho-du-an': 'Thiết kế & thi công nhà phố dự án',
  'nha-pho': 'Thiết kế & thi công nhà phố',
  villa: 'Thiết kế & thi công villa',
};

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

// Route /p/:token — NV3: khung trang mới, thay toàn bộ PortfolioLanding cũ.
// Tham số route vẫn tên "token" trong App.tsx (giữ nguyên URL hiện có),
// nhưng từ đây dùng như "slug" của landing_pages theo đúng tinh thần NV2/NV3.
export function LandingPageV2() {
  const { token: slug } = useParams<{ token?: string }>();
  const { seg, setSeg, sale, nguon, utm, page, phone, zalo } = useLeadParams(slug);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // NV3.3 — ẩn thanh ghim khi form (Offer) đang hiển thị trên màn hình
  useEffect(() => {
    const el = formRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setIsFormVisible(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    track('view');
  }, []);

  useEffect(() => {
    let fired = false;
    const onScroll = () => {
      if (fired) return;
      const scrolled = window.scrollY + window.innerHeight;
      if (document.documentElement.scrollHeight > 0 && scrolled >= document.documentElement.scrollHeight * 0.5) {
        fired = true;
        track('scroll_50');
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSetSeg = (next: Seg) => {
    setSeg(next);
    track('pick_segment', { seg: next });
  };

  // NV5/NV6/NV8 — các lối vào khác nhau tới form Offer đều set sẵn intent tương ứng
  const [offerIntent, setOfferIntent] = useState<'offer' | 'xem_cong_trinh' | 'bang_chi_tiet'>('offer');
  const [estimateResult, setEstimateResult] = useState<Record<string, unknown> | null>(null);
  const goToOffer = (intent: typeof offerIntent, payload?: Record<string, unknown>) => {
    setOfferIntent(intent);
    if (payload) setEstimateResult(payload);
    scrollTo('offer');
  };

  useSeo({
    title: `DQH Architects — ${seg ? SEG_TITLE[seg] : 'Thiết kế & thi công trọn gói'}`,
    description:
      page?.architect_quote ||
      'DQH Architects — thiết kế và thi công trọn gói, phong cách Quiet Luxury.',
    image: null,
  });

  return (
    <div className="font-lp-sans text-lp-ink pb-16 md:pb-0">
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${isScrolled ? 'bg-lp-espresso' : 'bg-transparent'}`}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <span className="font-lp-serif text-lg text-white">
            DQH <span className="italic text-lp-gold">Signature</span>
          </span>
          <button
            onClick={() => goToOffer('offer')}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lp border border-white/70 text-white font-lp-sans text-xs font-semibold uppercase tracking-[0.12em] hover:bg-white/10 transition-colors cursor-pointer"
          >
            Đặt lịch tư vấn
          </button>
        </div>
      </header>

      <Hero
        page={page}
        seg={seg}
        setSeg={handleSetSeg}
        onEstimate={() => scrollTo('estimator')}
        onViewProjects={() => scrollTo('projects')}
      />
      <ProjectsBlock seg={seg} onBookVisit={() => goToOffer('xem_cong_trinh')} />
      <Estimator seg={seg} setSeg={handleSetSeg} onNeedDetail={payload => goToOffer('bang_chi_tiet', payload)} />
      <Architect page={page} />
      <Offer
        page={page}
        seg={seg}
        sale={sale}
        nguon={nguon}
        utm={utm}
        intent={offerIntent}
        estimate={estimateResult}
        formRef={formRef}
      />
      <Footer page={page} seg={seg} />

      <StickyBar phone={phone} zalo={zalo} visible={!isFormVisible} onEstimate={() => scrollTo('estimator')} />
    </div>
  );
}
