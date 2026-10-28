import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { PortfolioManager } from './PortfolioManager';
import { FadeIn, LandingAdminContext } from './sections/shared';
import { FeaturedProjects2026 } from './sections/FeaturedProjects2026';
import { PricingComparison } from './sections/PricingComparison';
import { WorkflowSteps } from './sections/WorkflowSteps';
import { TeamSection } from './sections/TeamSection';
import { CompanyInfo } from './sections/CompanyInfo';
import { FAQSection } from './sections/FAQSection';
import { KhaiToanWorkspace } from './KhaiToanWorkspace';
import { landingSupabase } from './sections/landingSupabase';

// Ảnh thật công trình "[JUX] Retreat Villa" (landing_featured_projects) —
// thay cho ảnh stock Unsplash chung chung trước đây. Dùng khi chưa có
// hero_image riêng trong landing_company_info.
const FALLBACK_HERO_IMAGE = 'https://yiuokvszyaqqjksshybn.supabase.co/storage/v1/object/public/landing-media/1792997882267-3xybecv.webp';

// ─────────────────────────────────────────────────────────────────────────────
// Trang /p/:token — dựng lại 2026-10 theo cấu trúc 6 phần catalog/so sánh
// (Công trình tiêu biểu → Chi phí DQH/JUX → Quy trình → Đội ngũ → Công ty),
// thay cho bản kể chuyện "Quiet Luxury" cũ. Giữ nguyên cơ chế xác thực/
// token/PIN. Khối "Tiến độ công trình thật" (gắn với project_id thật) đã bỏ
// theo yêu cầu — không cần thiết cho bản landing page dùng chung.
// ─────────────────────────────────────────────────────────────────────────────

export function PortfolioLanding({ isPreview = false }: { isPreview?: boolean }) {
  const { token } = useParams<{ token?: string }>();
  const [loading, setLoading] = useState(!isPreview);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [error, setError] = useState('');
  const [pin, setPin] = useState('');
  const [authenticated, setAuthenticated] = useState(isPreview);
  const [showShareManager, setShowShareManager] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [khaiToanOpen, setKhaiToanOpen] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const { profile, checkSession } = useAuthStore();
  // Thanh công cụ biên tập + nhãn [cần điền] chỉ hiện cho người có quyền sửa
  // landing page (cùng 2 role được phép vào /portfolio nội bộ — xem
  // utils/permissions.ts). Khách bấm link chia sẻ /p không có session nên
  // profile luôn null → mặc định ẩn, an toàn theo hướng "fail closed".
  const canEditLanding = profile?.role === 'Admin' || profile?.role === 'Marketing';

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    landingSupabase
      .from('landing_company_info')
      .select('hero_image')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => setHeroImage(data?.hero_image || null))
      .catch(() => setHeroImage(null));
  }, []);

  useEffect(() => {
    if (isPreview) {
      setLoading(false);
      setAuthenticated(true);
    } else if (token) {
      fetchPortfolio();
    } else {
      setError('Đường dẫn chia sẻ không hợp lệ.');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isPreview]);

  const fetchPortfolio = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_shares')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !data) {
        setError('Link không tồn tại hoặc đã bị xóa.');
        setLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('Link này đã hết hạn.');
        setLoading(false);
        return;
      }

      setPortfolio(data);
      if (!data.passcode) setAuthenticated(true);
    } catch {
      setError('Đã xảy ra lỗi.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (portfolio?.passcode === pin) setAuthenticated(true);
    else alert('Mã PIN không chính xác.');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F5F0] text-[#2C2920] font-sans">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F5F0] text-[#2C2920] font-sans px-4 text-center">
        <h1 className="font-serif text-3xl mb-4">Oops!</h1>
        <p className="text-[#8A8070]">{error}</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F5F0] text-[#2C2920] font-sans px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-[#2C2920]/10 text-center">
          <div className="w-16 h-16 bg-[#F8F5F0] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#C4C0B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="font-serif text-2xl mb-2 text-[#2C2920]">{portfolio?.title}</h2>
          <p className="text-sm text-[#8A8070] mb-8">Vui lòng nhập Mã PIN để xem Hồ sơ năng lực này.</p>
          <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Nhập mã PIN"
              className="w-full text-center tracking-widest bg-[#F8F5F0] border border-[#2C2920]/10 px-4 py-3 rounded-lg focus:outline-none focus:border-[#2C2920] transition-colors font-mono"
              autoFocus
            />
            <button type="submit" className="w-full text-xs tracking-[0.12em] uppercase text-[#F8F5F0] bg-[#1A1814] px-8 py-3.5 hover:bg-[#B8913A] transition-colors duration-300 rounded-lg">
              Xác nhận
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navLinks = ['Công trình', 'Chi phí', 'Quy trình', 'Đội ngũ', 'Công ty', 'Hỏi đáp'];
  const navLinkClass = `text-xs tracking-[0.12em] uppercase transition-colors duration-300 font-medium ${
    isScrolled ? 'text-[#8A8070] hover:text-[#2C2920]' : 'text-[#C4C0B8] hover:text-[#F8F5F0]'
  }`;

  return (
    <LandingAdminContext.Provider value={canEditLanding}>
    <div className="font-sans antialiased bg-[#F8F5F0] text-[#2C2920] selection:bg-[#B8913A] selection:text-white relative">

      {/* ── NAVBAR ── */}
      <nav className={`${isPreview ? 'absolute' : 'fixed'} top-0 left-0 right-0 z-20 px-6 md:px-16 py-5 flex items-center justify-between transition-all duration-500 ${
        isScrolled ? 'bg-[#F8F5F0]/95 backdrop-blur-md border-b border-[#2C2920]/10 shadow-sm' : 'bg-transparent border-b border-transparent'
      }`}>
        <a href="#" className={`font-serif text-xl font-semibold tracking-wide transition-colors duration-300 ${isScrolled ? 'text-[#2C2920]' : 'text-[#F5F2EC]'}`}>
          DQH <span className="font-light italic text-[#B8913A]">Signature</span>
        </a>
        <div className="hidden lg:flex gap-9 items-center">
          {navLinks.slice(0, 2).map((label, idx) => (
            <a key={idx} href={`#section-${idx}`} className={navLinkClass}>
              {label}
            </a>
          ))}
          <button onClick={() => setKhaiToanOpen(true)} className={`${navLinkClass} cursor-pointer`}>
            Khái toán
          </button>
          {navLinks.slice(2).map((label, i) => {
            const idx = i + 2;
            return (
              <a key={idx} href={`#section-${idx}`} className={navLinkClass}>
                {label}
              </a>
            );
          })}
        </div>
        <a
          href="#contact"
          className={`text-xs tracking-[0.1em] uppercase px-5 py-2.5 transition-all duration-300 font-semibold rounded-sm ${
            isScrolled ? 'text-[#F8F5F0] bg-[#1A1814] hover:bg-[#B8913A]' : 'text-[#1A1814] bg-[#F5F2EC] hover:bg-[#B8913A] hover:text-[#F8F5F0]'
          }`}
        >
          Đặt Lịch Tư Vấn
        </a>
      </nav>

      {/* ── HERO ── */}
      <section
        className="min-h-screen pt-28 pb-16 flex flex-col justify-center px-6 md:px-16 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(26, 24, 20, 0.95) 0%, rgba(26, 24, 20, 0.75) 45%, rgba(14, 14, 12, 0.4) 100%), url("${heroImage || FALLBACK_HERO_IMAGE}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10 max-w-[720px] w-full mx-auto md:mx-0">
          <FadeIn>
            <p className="text-[9px] tracking-[0.3em] uppercase text-[#8A8070] mb-8 font-sans font-medium">
              INTERIOR DESIGN &amp; BUILD STUDIO · TP.HCM
            </p>
          </FadeIn>
          <FadeIn delay={60}>
            <h1 className="font-sans font-bold text-[clamp(2.8rem,7vw,5.2rem)] leading-[1.05] tracking-tight mb-6 text-[#F5F2EC]">
              Define<br />
              <span className="font-serif italic font-light text-[#B8913A]">Quality</span><br />
              Housing
            </h1>
          </FadeIn>
          <FadeIn delay={120}>
            <p className="font-serif italic font-light text-[clamp(1.2rem,2.5vw,1.75rem)] text-[#B8913A] mb-4">
              "Làm nghề tử tế."
            </p>
          </FadeIn>
          <FadeIn delay={150}>
            <p className="text-sm md:text-base text-[#C4C0B8] mb-14 max-w-[540px]">
              Mỗi công trình là một bản thiết kế độc bản — cá nhân hóa từ ý tưởng đến từng chi tiết hoàn thiện, cho căn hộ, nhà phố, biệt thự tại TP.HCM.
            </p>
          </FadeIn>
          <FadeIn delay={180}>
            <div className="flex gap-x-10 gap-y-6 md:gap-x-16 flex-wrap mb-14 max-w-[640px]">
              {[
                { label: 'MÔ HÌNH', value: 'Design & Build' },
                { label: 'PHÂN KHÚC', value: 'Căn hộ · Nhà phố · Biệt thự 4–8 tỷ' },
                { label: 'THIẾT KẾ', value: 'Độc bản, không sao chép' },
                { label: 'HOÀN THIỆN', value: 'Sắc nét chuẩn showroom' },
              ].map((m, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-[9px] tracking-[0.25em] uppercase text-[#8A8070] font-sans font-medium">{m.label}</p>
                  <p className="text-sm text-[#F5F2EC] font-sans font-medium">{m.value}</p>
                </div>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={220}>
            <div className="flex items-center gap-6 flex-wrap">
              <button onClick={() => setKhaiToanOpen(true)} className="bg-[#B8913A] hover:bg-[#B8913A]/85 text-[#1A1814] text-xs tracking-[0.15em] uppercase px-8 py-3.5 font-sans font-semibold transition-all duration-300 cursor-pointer rounded-sm">
                Khái toán chi phí ngay
              </button>
              <a href="#section-0" className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-[#C4C0B8] hover:text-[#F5F2EC] hover:gap-3 font-sans font-semibold transition-all duration-300 cursor-pointer">
                Xem công trình tiêu biểu →
              </a>
            </div>
            <p className="mt-4 text-[10px] tracking-[0.15em] uppercase text-[#8A8070]">Miễn phí · 2 phút · Không cần để lại thông tin</p>
          </FadeIn>
        </div>
      </section>

      {/* ── 6 PHẦN CHÍNH ── */}
      <FeaturedProjects2026 />
      <PricingComparison onOpenKhaiToan={() => setKhaiToanOpen(true)} />
      <WorkflowSteps />
      <TeamSection />
      <CompanyInfo />
      <FAQSection />

      {/* ── FORM LIÊN HỆ ── */}
      <section id="contact-section" className="px-6 md:px-16 py-16 md:py-24 bg-[#1A1814] text-[#F8F5F0]">
        <div className="max-w-xl mx-auto space-y-8">
          <div id="contact" className="border-b border-[#FAF8F4]/10 pb-4">
            <h3 className="font-serif text-2xl font-light text-[#B8913A]">Đăng ký tư vấn thiết kế &amp; thi công</h3>
            <p className="text-xs text-[#C4C0B8] mt-2">Đội ngũ KTS của DQH sẽ liên hệ trực tiếp trong vòng 2 giờ để trao đổi sâu về định hướng không gian của gia đình.</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); alert('✅ Gửi yêu cầu thành công. DQH sẽ liên hệ anh/chị ngay!'); }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[9px] tracking-[0.2em] uppercase text-[#8A8070] mb-2 font-semibold">Họ và tên</label>
                <input type="text" required placeholder="Nguyễn Văn A" className="w-full bg-transparent border-b border-[#FAF8F4]/15 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#B8913A] transition-colors" />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.2em] uppercase text-[#8A8070] mb-2 font-semibold">Số điện thoại</label>
                <input
                  type="tel"
                  inputMode="tel"
                  required
                  placeholder="0900 000 000"
                  pattern="0[0-9]{9}"
                  onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Vui lòng nhập số điện thoại 10 số, bắt đầu bằng 0')}
                  onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                  className="w-full bg-transparent border-b border-[#FAF8F4]/15 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#B8913A] transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] tracking-[0.2em] uppercase text-[#8A8070] mb-2 font-semibold">Lời nhắn / Yêu cầu không gian</label>
              <textarea rows={2} placeholder="Mô tả sơ bộ về dự án của anh/chị..." className="w-full bg-transparent border-b border-[#FAF8F4]/15 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#B8913A] transition-colors resize-none" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="submit" className="flex-1 text-xs tracking-[0.15em] uppercase text-[#1A1814] bg-[#B8913A] hover:bg-[#B8913A]/85 py-3.5 px-10 transition-all duration-300 font-semibold rounded-sm cursor-pointer">
                Gửi yêu cầu tư vấn
              </button>
              <a
                href="https://zalo.me/0982914368"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center text-xs tracking-[0.15em] uppercase text-white bg-white/10 hover:bg-white/20 border border-white/15 py-3.5 px-10 transition-all duration-300 font-semibold rounded-sm cursor-pointer"
              >
                Nhắn Zalo
              </a>
            </div>
          </form>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#1A1814] px-6 md:px-16 py-10 border-t border-[#FAF8F4]/10 text-[#C4C0B8] text-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="font-serif text-lg font-light tracking-wide text-white">DQH <span className="italic text-[#B8913A]">Signature</span></p>
          <p>© 2020 – 2026 DQH Architects. Bảo lưu mọi quyền.</p>
          <div className="flex gap-6">
            <a href="https://www.facebook.com/DQHArchitects" target="_blank" rel="noopener noreferrer" className="hover:text-[#B8913A]">Facebook</a>
            <a href="https://www.youtube.com/@dqharchitects" target="_blank" rel="noopener noreferrer" className="hover:text-[#B8913A]">Youtube</a>
          </div>
        </div>
        <p className="text-center md:text-left mt-6 pt-6 border-t border-[#FAF8F4]/10">
          Zalo/Hotline: <a href="tel:0982914368" className="hover:text-[#B8913A]">0982 914 368</a> · 105-107 Trần Văn Dư, P.13, Tân Bình, TP.HCM · <a href="https://dqharchitects.vn" target="_blank" rel="noopener noreferrer" className="hover:text-[#B8913A]">dqharchitects.vn</a>
        </p>
      </footer>

      {/* ── FLOATING PREVIEW ANCHOR CONTROL (chỉ hiện với người có quyền sửa landing, không hiện với khách bấm link chia sẻ) ── */}
      {isPreview && canEditLanding && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#1A1814]/90 backdrop-blur-md border border-[#FAF8F4]/10 px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-5 text-stone-100 text-sm font-sans animate-fade-in transition-all">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-stone-300 tracking-wide text-xs uppercase">Xem trước Portfolio</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <button
            onClick={() => setShowShareManager(true)}
            className="bg-[#B8913A] hover:bg-[#B8913A]/85 active:scale-95 text-white px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
          >
            Tạo &amp; Chia sẻ link
          </button>
        </div>
      )}

      {/* ── SHARING MANAGER PANEL MODAL ── */}
      {isPreview && canEditLanding && showShareManager && (
        <div className="fixed inset-0 bg-[#1A1814]/90 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-y-auto relative">
            <button
              onClick={() => setShowShareManager(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 text-2xl font-bold bg-stone-100 hover:bg-stone-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 cursor-pointer"
            >
              &times;
            </button>
            <div className="p-2">
              <PortfolioManager />
            </div>
          </div>
        </div>
      )}

      <KhaiToanWorkspace open={khaiToanOpen} onClose={() => setKhaiToanOpen(false)} />
    </div>
    </LandingAdminContext.Provider>
  );
}
