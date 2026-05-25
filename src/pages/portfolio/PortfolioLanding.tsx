"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { PortfolioManager } from './PortfolioManager';
import { 
  Shield, 
  Users, 
  FileText, 
  CheckCircle, 
  MapPin, 
  Clock, 
  Calendar, 
  Compass, 
  Layers, 
  Search, 
  Award, 
  Heart, 
  Wrench, 
  CheckSquare, 
  DollarSign, 
  ChevronRight, 
  Building,
  Star
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN SYSTEM CONSTANTS (DQH Quiet Luxury DNA)
// ─────────────────────────────────────────────────────────────────────────────
const COLORS = {
  cream: '#F5F2EC',
  warmWhite: '#FAF8F4',
  charcoal: '#1C1C1A',
  stone: '#8A8780',
  stoneLight: '#C4C0B8',
  gold: '#B89B6A',
  goldLight: '#D4BC95',
  border: 'rgba(28,28,26,0.10)',
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA & RESOURCES
// ─────────────────────────────────────────────────────────────────────────────

const PROJECTS = [
  { id: 1, num: "01", cat: "Biệt thự · Thủ Đức", title: "The Lumé Residence", img: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80", desc: "Diện tích 450m2. Thiết kế theo tinh thần Quiet Luxury với vật liệu chủ đạo là đá tự nhiên Travertine và gỗ sồi nhập khẩu." },
  { id: 2, num: "02", cat: "Nhà phố · Quận 2", title: "The Horizon House", img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80", desc: "Diện tích 280m2. Ứng dụng triết lý Modern Tropical Biophilic đưa ánh sáng tự nhiên và cây xanh xen kẽ vào không gian." },
  { id: 3, num: "03", cat: "Penthouse · Quận 7", title: "The Verena Penthouse", img: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=80", desc: "Diện tích 320m2. Thiết kế tối giản tinh tế, tập trung vào tỷ lệ hình khối và sự kiềm chế màu sắc." },
  { id: 4, num: "04", cat: "Boutique Resort · Đà Lạt", title: "Arden Boutique Resort", img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80", desc: "Công trình nghỉ dưỡng cao cấp hòa quyện với thiên nhiên sương mù, sử dụng limewash sơn vôi tự nhiên." },
];

const STAFF_PORTFOLIO = [
  {
    name: "Đỗ Quang Hải",
    role: "KTS Trưởng & Founder",
    experience: "15+ Năm Kinh Nghiệm",
    bio: "Tốt nghiệp ĐH Kiến Trúc TP.HCM. 15 năm thiết kế các biệt thự cao cấp. Định hướng triết lý 'Quiet Luxury' tại DQH — không gian tinh tế từ tỷ lệ, không phô trương từ chi tiết.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"
  },
  {
    name: "Nguyễn Minh Tuấn",
    role: "Giám Đốc Sáng Tạo",
    experience: "10+ Năm Kinh Nghiệm",
    bio: "Chuyên gia về vật liệu tự nhiên và ánh sáng gián tiếp. Đảm bảo mọi moodboard thiết kế đạt chuẩn thẩm mỹ cao cấp nhất, kết hợp hài hòa giữa đá, gỗ và vải sợi thô zellige.",
    img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80"
  },
  {
    name: "Trần Hoàng Nam",
    role: "Kỹ Sư Kết Cấu Cao Cấp",
    experience: "12+ Năm Kinh Nghiệm",
    bio: "Chuyên môn kết cấu đảm bảo các phương án kiến trúc vượt nhịp lớn, giấu cột âm tường tinh tế. Biến các ý tưởng bay bổng trên bản vẽ 3D thành hiện thực vững chãi.",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80"
  },
  {
    name: "Lê Văn Khoa",
    role: "Quản Lý Dự Án & Thi Công",
    experience: "8+ Năm Kinh Nghiệm",
    bio: "Giám sát kỹ thuật hiện trường. Quản lý chặt chẽ BOQ, kiểm soát chất lượng từ xưởng gỗ nội thất đến công trình thô, đảm bảo tiến độ bàn giao đúng cam kết.",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80"
  }
];

const CASE_STUDIES = [
  {
    title: "Đêm bão xử lý dột cho công trình cũ đã hết hạn bảo hành",
    tag: "Tử tế làm đầu",
    desc: "Căn penthouse Quận 7 bàn giao năm 2022 của chị Nhung gặp sự cố thấm dột do bão lớn tràn qua khe kính giếng trời của tòa nhà (không thuộc phạm vi bảo hành của DQH). Tuy nhiên, nhận cuộc gọi lúc 21h, KTS Hải và kỹ thuật viên Khoa đã trực tiếp mang bạt và vật liệu chuyên dụng đến hiện trường trong đêm mưa để che chắn và xử lý keo tạm thời, bảo vệ an toàn cho hệ sàn gỗ tự nhiên của chủ nhà. Sáng hôm sau, DQH phối hợp cùng BQL tòa nhà khắc phục triệt để. Chị Nhung chia sẻ: 'Gọi điện lúc đêm bão chỉ mong được tư vấn cách xử lý tạm, không ngờ các em lại trực tiếp phi xe qua.'"
  },
  {
    title: "Từ chối mạ vàng bóng để bảo vệ 'gu' Quiet Luxury",
    tag: "Chuyên môn & Đạo đức",
    desc: "Trong quá trình trao đổi thiết kế căn biệt thự Thủ Đức, chủ nhà (anh Hùng) muốn ốp toàn bộ viền vách tivi bằng inox mạ vàng gương bóng loáng theo gợi ý của một đơn vị bên ngoài. Thay vì làm theo để chiều lòng khách hàng nhanh chóng, team thiết kế DQH đã kiên trì giải thích và làm mẫu mockup thực tế 1:1 kết hợp giữa tấm travertine mờ và inox brushed brass (vàng xước mờ). Sau khi nhìn trực tiếp mẫu mockup dưới đèn chiếu 2700K, anh Hùng đã bị thuyết phục hoàn toàn bởi vẻ sang trọng tiết chế và thừa nhận: 'Nếu hôm đó làm vàng bóng thì bây giờ mỗi lần bật đèn tivi là một lần chói mắt. Cảm ơn các em đã giữ vững lập trường chuyên môn.'"
  }
];

const TIMELINE_TEMPLATE = [
  { phase: "Giai đoạn 1", title: "Khảo sát & Concept", duration: "15 - 20 Ngày", details: "Khảo sát hiện trạng chi tiết, đo đạc cốt kỹ thuật, lên mặt bằng công năng 2D và moodboard vật liệu mẫu." },
  { phase: "Giai đoạn 2", title: "Thiết kế 3D & BOQ", duration: "25 - 30 Ngày", details: "Dựng phối cảnh 3D không gian, test ánh sáng ảo, bóc tách khối lượng chi tiết (BOQ) cam kết không phát sinh." },
  { phase: "Giai đoạn 3", title: "Thi công thô & Cơ điện", duration: "60 - 90 Ngày", details: "Xây trát, chống thấm 3 lớp, đi đường ống MEP (Downlight âm trần, điều hòa trung tâm) theo tiêu chuẩn kỹ thuật." },
  { phase: "Giai đoạn 4", title: "Hoàn thiện & Nội thất", duration: "30 - 45 Ngày", details: "Sơn limewash, lắp ráp đồ gỗ tại xưởng gỗ DQH, kiểm tra khớp shadow gap 3mm, bàn giao nghiệm thu." }
];

const TECHNICAL_STANDARDS = {
  design: [
    { title: "Tỷ lệ Solid : Void = 3 : 1", desc: "25% diện tích tường là void (khoảng trống, khe, âm trần) giúp không gian thở, không nhồi nhét đồ đạc." },
    { title: "Furniture Scale theo trần", desc: "Chiều cao sofa và tủ kệ được thiết kế riêng tương ứng với chiều cao trần nhà để tránh tạo cảm giác thô kệch." },
    { title: "Độ chuẩn xác Shadow Gap", desc: "Cấu hình khe âm 3-5mm cho chuyển tiếp tường và 2-3mm cho tủ joinery, tạo bóng tối tự nhiên sắc nét." }
  ],
  construction: [
    { title: "Chống thấm 3 lớp đặc chủng", desc: "Thiết kế màng chống thấm liên tục tại khu vệ sinh và ban công, ngâm thử nước 72h trước khi lát nền." },
    { title: "Chống nứt cổ trần & đà liên kết", desc: "Sử dụng lưới mắt cáo chống nứt tại các điểm tiếp giáp giữa gạch và bê tông trước khi tô trát." },
    { title: "Lắp đặt Mockup Ánh sáng tại hiện trường", desc: "Trước khi thi công trần thạch cao, DQH lắp thử hệ đèn 2700K/3000K để kiểm tra độ hắt sáng thực tế trên bề mặt tường." }
  ]
};

const COOP_STEPS = [
  { step: "01", name: "Bộ phận Khảo sát & KTS", desc: "Đo đạc hiện trạng bằng máy laser, ghi nhận hướng nắng, hướng gió và độ ẩm công trình." },
  { step: "02", name: "Team Concept & 3D", desc: "Phát triển bản vẽ 2D công năng và dựng hình khối 3D, lựa chọn bảng màu giới hạn tối đa 3 tông màu." },
  { step: "03", name: "Phòng Dự toán & Vật liệu", desc: "Lập BOQ bóc tách từng chi tiết đinh ốc, mã sơn, xuất xứ gỗ. Trình mẫu vật liệu thực tế tại văn phòng." },
  { step: "04", name: "Đội ngũ Kỹ sư & Thi công", desc: "Triển khai thi công thô dưới sự giám sát trực tiếp của kỹ sư kết cấu, đảm bảo đúng định vị cơ điện." },
  { step: "05", name: "Xưởng gỗ DQH & Bàn giao", desc: "Sản xuất nội thất theo bản vẽ CAD chi tiết, sơn phủ mờ bảo vệ bề mặt, lắp đặt và nghiệm thu 2 lớp cùng chủ nhà." }
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT HOOKS
// ─────────────────────────────────────────────────────────────────────────────

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

function Reveal({ children, className = "", delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT MAIN
// ─────────────────────────────────────────────────────────────────────────────

export function PortfolioLanding({ isPreview = false }: { isPreview?: boolean }) {
  const { token } = useParams<{ token: string }>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(!isPreview);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [error, setError] = useState('');
  const [pin, setPin] = useState('');
  const [authenticated, setAuthenticated] = useState(isPreview);
  const [showShareManager, setShowShareManager] = useState(false);

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
      if (!data.passcode) {
        setAuthenticated(true);
      }
    } catch (err) {
      setError('Đã xảy ra lỗi.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (portfolio?.passcode === pin) {
      setAuthenticated(true);
    } else {
      alert('Mã PIN không chính xác.');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAF8F4] text-[#1C1C1A] font-sans">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F4] text-[#1C1C1A] font-sans px-4 text-center">
        <h1 className="font-serif text-3xl mb-4">Oops!</h1>
        <p className="text-[#8A8780]">{error}</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F4] text-[#1C1C1A] font-sans px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-[#1C1C1A]/10 text-center">
          <div className="w-16 h-16 bg-[#FAF8F4] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#C4C0B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="font-serif text-2xl mb-2 text-[#1C1C1A]">{portfolio?.title}</h2>
          <p className="text-sm text-[#8A8780] mb-8">Vui lòng nhập Mã PIN để xem Hồ sơ năng lực này.</p>
          
          <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
            <input 
              type="password" 
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Nhập mã PIN"
              className="w-full text-center tracking-widest bg-[#FAF8F4] border border-[#1C1C1A]/10 px-4 py-3 rounded-lg focus:outline-none focus:border-[#1C1C1A] transition-colors font-mono"
              autoFocus
            />
            <button type="submit" className="w-full text-xs tracking-[0.12em] uppercase text-[#FAF8F4] bg-[#1C1C1A] px-8 py-3.5 hover:bg-[#B89B6A] transition-colors duration-300 rounded-lg">
              Xác nhận
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased bg-[#FAF8F4] text-[#1C1C1A] selection:bg-[#B89B6A] selection:text-white">
      
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-16 py-5 flex items-center justify-between bg-[#FAF8F4]/92 backdrop-blur-xl border-b border-[#1C1C1A]/10">
        <a href="#" className="font-serif text-xl font-semibold tracking-wide text-[#1C1C1A]">
          DQH <span className="font-light italic text-[#B89B6A]">Signature</span>
        </a>
        <div className="hidden md:flex gap-9">
          {["Công trình", "Đội ngũ", "Quy trình phối hợp", "Tiêu chuẩn kỹ thuật", "Bảo hành & Báo giá", "Ý kiến khách hàng"].map((label, idx) => (
            <a 
              key={idx} 
              href={`#section-${idx}`} 
              className="text-xs tracking-[0.12em] uppercase text-[#8A8780] hover:text-[#1C1C1A] transition-colors duration-300 font-medium"
            >
              {label}
            </a>
          ))}
        </div>
        <a 
          href="#contact" 
          className="text-xs tracking-[0.1em] uppercase text-[#FAF8F4] bg-[#1C1C1A] px-5 py-2.5 hover:bg-[#B89B6A] transition-colors duration-300 font-semibold"
        >
          Đặt Lịch Tư Vấn
        </a>
      </nav>

      {/* ── HERO ── */}
      <section className="min-h-screen pt-24 grid grid-cols-1 md:grid-cols-2 overflow-hidden bg-[#F5F2EC]">
        <div className="flex flex-col justify-center px-6 md:px-16 py-16 relative z-10">
          <Reveal>
            <p className="text-xs tracking-[0.25em] uppercase text-[#8A8780] mb-5 flex items-center gap-3">
              <span className="w-6 h-px bg-[#8A8780] inline-block" />
              DQH ARCHITECTS · DESIGN & BUILD
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="font-serif text-[clamp(2.5rem,5.5vw,4.5rem)] font-light leading-[1.1] mb-6 text-[#1C1C1A]">
              Giải pháp kiến trúc<br />
              <em className="not-italic text-[#B89B6A]">Quiet Luxury</em><br />
              Trọn gói D&amp;B.
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-[0.95rem] text-[#8A8780] leading-[1.8] max-w-[460px] mb-8">
              Chúng tôi không chỉ bán bản vẽ. DQH chịu trách nhiệm từ khâu khảo sát, thiết kế ý tưởng đến sản xuất lắp ráp đồ gỗ và thi công xây dựng hoàn thiện. Một đầu mối duy nhất, cam kết không phát sinh, bàn giao sản phẩm cuối cùng hoàn hảo.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="flex items-center gap-5 flex-wrap">
              <a href="#section-0" className="inline-block text-xs tracking-[0.12em] uppercase text-[#FAF8F4] bg-[#1C1C1A] px-8 py-3.5 hover:bg-[#B89B6A] transition-all duration-300 font-semibold">Xem các công trình</a>
              <a href="#section-3" className="inline-flex items-center gap-2 text-xs tracking-[0.12em] uppercase text-[#1C1C1A] hover:gap-4 transition-all duration-300 font-semibold">Bộ tiêu chuẩn mẫu →</a>
            </div>
          </Reveal>
        </div>
        <div className="relative h-[60vw] md:h-auto overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80"
            alt="DQH Quiet Luxury Home"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* ── SECTION 0: CÔNG TRÌNH NỔI BẬT ── */}
      <section id="section-0" className="px-6 md:px-16 py-24 bg-[#FAF8F4]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-xs tracking-[0.22em] uppercase text-[#8A8780] mb-2">(năng lực thiết kế)</p>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1C1C1A]">
              Thiết kế có gu &amp; <em className="not-italic text-[#B89B6A]">Công trình thành công</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PROJECTS.map((proj) => (
              <div key={proj.id} className="group border border-[#1C1C1A]/10 bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="overflow-hidden aspect-[16/10] relative">
                  <img 
                    src={proj.img} 
                    alt={proj.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute top-4 left-4 bg-[#FAF8F4]/90 backdrop-blur-md px-3 py-1 rounded text-xs font-serif italic text-[#B89B6A]">{proj.num}</div>
                </div>
                <div className="p-6">
                  <span className="text-[10px] tracking-[0.15em] uppercase text-[#8A8780] block mb-2">{proj.cat}</span>
                  <h3 className="font-serif text-xl font-light text-[#1C1C1A] mb-3 group-hover:text-[#B89B6A] transition-colors">{proj.title}</h3>
                  <p className="text-xs text-[#8A8780] leading-relaxed">{proj.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 1: ĐỘI NGŨ MẠNH & SƠ ĐỒ BỘ MÁY D&B ── */}
      <section id="section-1" className="px-6 md:px-16 py-24 bg-[#F5F2EC]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start mb-16">
            <div className="lg:col-span-1">
              <p className="text-xs tracking-[0.22em] uppercase text-[#8A8780] mb-2">(bộ máy tổ chức)</p>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1C1C1A] mb-6">
                Đội ngũ mạnh,<br />
                <em className="not-italic text-[#B89B6A]">Design &amp; Build</em> trọn vẹn
              </h2>
              <p className="text-sm text-[#8A8780] leading-relaxed">
                Tại DQH, kiến trúc sư và kỹ sư giám sát công trình cùng làm việc dưới một mái nhà. Chúng tôi loại bỏ hoàn toàn việc kiến trúc sư đổ lỗi cho thợ thi công làm sai, hoặc thợ thi công chê bản vẽ không thực tế. Mọi thành viên đều chung mục tiêu: sản phẩm cuối cùng hoàn hảo nhất.
              </p>
            </div>
            
            {/* Sơ đồ bộ máy D&B */}
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-[#1C1C1A]/10 shadow-sm space-y-6">
              <h3 className="text-xs tracking-[0.15em] uppercase text-[#1C1C1A] font-bold pb-4 border-b border-[#1C1C1A]/10 flex items-center gap-2">
                <Building size={16} className="text-[#B89B6A]" /> SƠ ĐỒ PHỐI HỢP DESIGN &amp; BUILD
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { title: "Khảo Sát & Concept", team: "Phòng Thiết Kế", desc: "KTS khảo sát hiện trạng, đo cốt, lập moodboard ý tưởng phù hợp lối sống chủ nhà." },
                  { title: "Bản Vẽ Kỹ Thuật & BOQ", team: "Phòng Kỹ Thuật & Dự Toán", desc: "Kỹ sư tính kết cấu chịu lực, bóc tách cấu tạo gỗ, lập bảng dự toán BOQ chi tiết." },
                  { title: "Sản Xuất & Thi Công", team: "Xưởng Gỗ & Đội Giám Sát", desc: "Nội thất sản xuất tại xưởng gỗ DQH, kỹ sư cơ điện lắp đặt thiết bị và thi công hoàn thiện." }
                ].map((step, idx) => (
                  <div key={idx} className="bg-[#FAF8F4] p-4 rounded-xl border border-[#1C1C1A]/5 space-y-2 relative">
                    <div className="absolute top-3 right-3 text-[10px] font-bold text-[#C4C0B8]">0{idx + 1}</div>
                    <h4 className="text-xs font-bold text-[#1C1C1A]">{step.title}</h4>
                    <span className="inline-block text-[9px] tracking-[0.1em] uppercase text-[#B89B6A] font-semibold">{step.team}</span>
                    <p className="text-[11px] text-[#8A8780] leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio nhân sự nòng cốt */}
          <div className="border-t border-[#1C1C1A]/10 pt-16">
            <h3 className="font-serif text-xl font-light text-[#1C1C1A] mb-8">Hồ sơ chuyên môn nhân sự chủ chốt</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STAFF_PORTFOLIO.map((staff, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-[#1C1C1A]/10 overflow-hidden p-5 space-y-4">
                  <div className="aspect-square rounded-lg overflow-hidden bg-[#FAF8F4]">
                    <img src={staff.img} alt={staff.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-[#1C1C1A]">{staff.name}</h4>
                    <p className="text-[10px] tracking-[0.12em] uppercase text-[#B89B6A] font-semibold mb-1">{staff.role}</p>
                    <span className="text-[10px] text-[#8A8780] font-medium block">{staff.experience}</span>
                  </div>
                  <p className="text-xs text-[#8A8780] leading-relaxed border-t border-[#1C1C1A]/5 pt-3">
                    {staff.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: QUY TRÌNH PHỐI HỢP & CHI TIẾT HIỆN TRƯỜNG ── */}
      <section id="section-2" className="px-6 md:px-16 py-24 bg-[#FAF8F4]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-xs tracking-[0.22em] uppercase text-[#8A8780] mb-2">(vận hành chi tiết)</p>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1C1C1A]">
              Quy trình phối hợp <em className="not-italic text-[#B89B6A]">liên phòng ban</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-4">
              {COOP_STEPS.map((step, idx) => (
                <div key={idx} className="flex gap-6 p-5 bg-white border border-[#1C1C1A]/10 rounded-xl items-start">
                  <div className="font-serif text-2xl text-[#B89B6A] italic font-light leading-none">{step.step}</div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#1C1C1A] uppercase tracking-wide">{step.name}</h4>
                    <p className="text-xs text-[#8A8780] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chi tiết hiện trường & Test vật liệu ánh sáng */}
            <div className="lg:col-span-1 bg-[#F5F2EC] p-6 rounded-xl border border-[#1C1C1A]/10 space-y-6">
              <h3 className="font-serif text-lg font-light text-[#1C1C1A] border-b border-[#1C1C1A]/10 pb-3">Chi tiết điểm chạm hiện trường</h3>
              <div className="space-y-4 text-xs text-[#8A8780] leading-relaxed">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-[#1C1C1A]">1. Quy trình test ánh sáng &amp; vật liệu:</h4>
                  <p>Mẫu vật liệu thật được đặt tại công trình để test màu sắc dưới ánh sáng mặt trời góc 12h và 17h, đảm bảo không bị đổi màu sai lệch.</p>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-[#1C1C1A]">2. Mockup ánh sáng:</h4>
                  <p>Lắp đặt tạm hệ trần thạch cao nhỏ tại công trình, test vị trí giấu LED và khoảng hắt sáng để xác định khoảng cách tối ưu (chỉ số shadow line 10-15mm).</p>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-[#1C1C1A]">3. Nghiệm thu tại xưởng gỗ:</h4>
                  <p>Khách hàng được mời tới xưởng gỗ DQH xem thô sản phẩm nội thất trước khi sơn phủ bề mặt mờ, kiểm tra độ sắc sảo của các đường ghép mộng gỗ.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: BỘ TIÊU CHUẨN KỸ THUẬT & TIMELINE MẪU ── */}
      <section id="section-3" className="px-6 md:px-16 py-24 bg-[#F5F2EC]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
            <div className="lg:col-span-1">
              <p className="text-xs tracking-[0.22em] uppercase text-[#8A8780] mb-2">(kỹ thuật thi công)</p>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1C1C1A] mb-6">
                Tiêu chuẩn thiết kế &amp; <em className="not-italic text-[#B89B6A]">Thi công thô mẫu</em>
              </h2>
              <p className="text-sm text-[#8A8780] leading-relaxed">
                Mọi chi tiết thiết kế và quy trình thi công tại DQH đều tuân thủ bộ tiêu chuẩn mẫu khắt khe. Chúng tôi cung cấp hồ sơ kỹ thuật chi tiết để làm cơ sở nghiệm thu minh bạch cùng chủ nhà.
              </p>
            </div>
            
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-[#1C1C1A]/10 space-y-4">
                <h3 className="text-xs font-bold text-[#1C1C1A] tracking-wider uppercase border-b border-[#1C1C1A]/10 pb-3 flex items-center gap-1.5">
                  <Compass size={14} className="text-[#B89B6A]" /> Tiêu chuẩn thiết kế ý tưởng
                </h3>
                <ul className="space-y-3">
                  {TECHNICAL_STANDARDS.design.map((item, i) => (
                    <li key={i} className="text-xs space-y-1">
                      <h4 className="font-bold text-[#1C1C1A]">{item.title}</h4>
                      <p className="text-[#8A8780] leading-relaxed">{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl border border-[#1C1C1A]/10 space-y-4">
                <h3 className="text-xs font-bold text-[#1C1C1A] tracking-wider uppercase border-b border-[#1C1C1A]/10 pb-3 flex items-center gap-1.5">
                  <Wrench size={14} className="text-[#B89B6A]" /> Tiêu chuẩn thi công hiện trường
                </h3>
                <ul className="space-y-3">
                  {TECHNICAL_STANDARDS.construction.map((item, i) => (
                    <li key={i} className="text-xs space-y-1">
                      <h4 className="font-bold text-[#1C1C1A]">{item.title}</h4>
                      <p className="text-[#8A8780] leading-relaxed">{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Timeline tiến độ mẫu */}
          <div className="border-t border-[#1C1C1A]/10 pt-16">
            <h3 className="font-serif text-xl font-light text-[#1C1C1A] mb-8">Lộ trình triển khai dự án chuẩn (Timeline mẫu)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {TIMELINE_TEMPLATE.map((time, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl border border-[#1C1C1A]/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] tracking-[0.1em] uppercase text-[#B89B6A] font-semibold bg-[#F5F2EC] px-2 py-0.5 rounded">{time.phase}</span>
                    <span className="text-[10px] text-[#8A8780] font-medium flex items-center gap-1"><Clock size={10} /> {time.duration}</span>
                  </div>
                  <h4 className="font-serif text-md font-bold text-[#1C1C1A]">{time.title}</h4>
                  <p className="text-xs text-[#8A8780] leading-relaxed">{time.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: BẢO HÀNH & BÁO GIÁ ĐÚNG GIÁ ── */}
      <section id="section-4" className="px-6 md:px-16 py-24 bg-[#FAF8F4]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-xs tracking-[0.22em] uppercase text-[#8A8780] mb-2">(cam kết minh bạch)</p>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1C1C1A]">
                Tiêu chuẩn báo giá đúng giá &amp; <em className="not-italic text-[#B89B6A]">Tại sao đúng giá?</em>
              </h2>
              <div className="space-y-4 text-sm text-[#8A8780] leading-relaxed">
                <p>
                  <strong>Dự toán chi tiết (BOQ):</strong> DQH lập bảng bóc tách khối lượng chi tiết đến từng thanh ray ngăn kéo, mã số sơn lót, vị trí ổ cắm trước khi ký hợp đồng. Khách hàng biết chính xác mình trả tiền cho sản phẩm gì.
                </p>
                <p>
                  <strong>Cam kết không phát sinh:</strong> Một khi hợp đồng đã ký và bản vẽ đã duyệt, đơn giá được cố định. Nếu có phát sinh chi phí trong quá trình thi công thực tế (như chênh lệch nhân công, hao hụt vật liệu), DQH sẽ tự chịu trách nhiệm chi trả 100%.
                </p>
                <p>
                  <strong>Chính sách bảo hành:</strong> Bảo hành kết cấu phần thô công trình lên tới 10 năm. Bảo hành hoàn thiện nội thất và đồ gỗ 2 năm. Cam kết tiếp nhận thông tin và kỹ thuật viên đến công trình xử lý trong vòng 24 giờ kể từ khi nhận phản hồi.
                </p>
              </div>
            </div>
            
            {/* Visual card */}
            <div className="bg-[#1C1C1A] text-[#FAF8F4] p-8 rounded-2xl border border-[#FAF8F4]/10 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#B89B6A]/10 rounded-full blur-2xl" />
              <h3 className="font-serif text-xl font-light text-[#B89B6A]">Cam kết vàng từ DQH</h3>
              <div className="space-y-4">
                {[
                  { icon: <CheckSquare size={16} />, title: "Sai lệch kích thước thi công ≤ 2mm", desc: "Nếu sai vượt tiêu chuẩn, DQH dỡ ra làm lại bằng chi phí của mình." },
                  { icon: <DollarSign size={16} />, title: "BOQ chi tiết & Đúng giá trị thực", desc: "Nói không với báo giá gộp chung chung tính theo mét vuông." },
                  { icon: <Shield size={16} />, title: "Bảo hành kết cấu 10 năm", desc: "Đồng hành dài lâu với căn nhà của khách hàng ngay cả sau bàn giao." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-[#FAF8F4]/10 flex items-center justify-center text-[#B89B6A] shrink-0">{item.icon}</div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wide">{item.title}</h4>
                      <p className="text-[11px] text-[#C4C0B8] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: CÂU CHUYỆN SỰ TỬ TẾ & FEEDBACK ── */}
      <section id="section-5" className="px-6 md:px-16 py-24 bg-[#F5F2EC]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <p className="text-xs tracking-[0.22em] uppercase text-[#8A8780] mb-2">(giá trị cốt lõi thực tế)</p>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1C1C1A]">
              Những case study <em className="not-italic text-[#B89B6A]">chia sẻ về sự tử tế</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {CASE_STUDIES.map((study, idx) => (
              <div key={idx} className="bg-white p-8 rounded-xl border border-[#1C1C1A]/10 space-y-4">
                <span className="text-[9px] tracking-[0.15em] uppercase text-[#B89B6A] font-semibold bg-[#F5F2EC] px-2.5 py-1 rounded">{study.tag}</span>
                <h3 className="font-serif text-lg font-bold text-[#1C1C1A]">{study.title}</h3>
                <p className="text-xs text-[#8A8780] leading-relaxed italic border-l-2 border-[#B89B6A] pl-4">
                  "{study.desc}"
                </p>
              </div>
            ))}
          </div>

          {/* Ý kiến khách hàng cũ */}
          <div className="border-t border-[#1C1C1A]/10 pt-16">
            <h3 className="font-serif text-xl font-light text-[#1C1C1A] mb-8 text-center">Ý kiến từ những chủ nhà đã đồng hành cùng DQH</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "Chị Minh Châu", role: "Chủ nhà · Biệt thự Thủ Đức 2024", text: "Từ buổi gặp đầu tiên, họ đã hiểu hoàn toàn tầm nhìn của chúng tôi. Thiết kế cuối cùng cảm giác rất tự nhiên — từng phòng đều chảy liền mạch." },
                { name: "Anh Tuấn Anh", role: "Chủ nhà · Nhà phố Quận 3 2023", text: "Checklist nghiệm thu của DQH còn dài hơn danh sách của vợ tôi. Bàn giao xong thực sự không có gì để phàn nàn — từng chi tiết đều hoàn hảo." },
                { name: "Chị Hồng Nhung", role: "Chủ nhà · Căn hộ Quận 7 2022", text: "Ban công thấm sau 1 năm, gọi buổi sáng — chiều cùng ngày đã có kỹ thuật viên đến. Bảo hành không phải lời hứa, đó là cam kết thực sự." }
              ].map((feedback, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border border-[#1C1C1A]/10 space-y-3 relative">
                  <div className="flex gap-1 text-[#B89B6A]"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div>
                  <p className="text-xs text-[#8A8780] leading-relaxed">"{feedback.text}"</p>
                  <div className="pt-2 border-t border-[#1C1C1A]/5">
                    <h4 className="text-xs font-bold text-[#1C1C1A]">{feedback.name}</h4>
                    <span className="text-[10px] text-[#8A8780]">{feedback.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: PHÁP LÝ & ĐỊNH HÌNH UY TÍN ── */}
      <section className="px-6 md:px-16 py-24 bg-[#1C1C1A] text-[#FAF8F4]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <p className="text-xs tracking-[0.22em] uppercase text-[#B89B6A]">(pháp lý doanh nghiệp)</p>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-white">
                Bộ máy vận hành &amp; <em className="not-italic text-[#B89B6A]">Cơ sở pháp lý uy tín</em>
              </h2>
              <div className="space-y-4 text-sm text-[#C4C0B8] leading-relaxed">
                <p>
                  <strong>Công ty TNHH Kiến Trúc &amp; Nội Thất DQH</strong><br />
                  Mã số thuế: 03168894xx do Sở Kế hoạch và Đầu tư TP.HCM cấp. Mọi giao dịch hợp đồng thiết kế, báo giá và thi công đều được thực hiện minh bạch qua pháp nhân doanh nghiệp, bảo vệ quyền lợi pháp lý cao nhất cho khách hàng.
                </p>
                <p>
                  <strong>Showroom &amp; Văn phòng:</strong> Quận 7, TP. Hồ Chí Minh. Nơi tiếp khách, trưng bày các mẫu vật liệu travertine, zellige, gỗ sồi mẫu thật để test trực tiếp.
                </p>
                <p>
                  <strong>Xưởng sản xuất nội thất DQH:</strong> Quy mô 1,500m2 tại Bình Chánh với máy móc gia công tự động hiện đại, đảm bảo độ chuẩn xác đường cắt shadow gap gỗ dưới 2mm.
                </p>
              </div>
            </div>

            {/* Form liên hệ chốt sales */}
            <div id="contact" className="bg-[#FAF8F4] text-[#1C1C1A] p-8 rounded-2xl border border-[#1C1C1A]/10 space-y-6">
              <h3 className="font-serif text-xl font-light text-[#B89B6A]">Đăng ký tư vấn Quiet Luxury</h3>
              <p className="text-xs text-[#8A8780] leading-relaxed">Đội ngũ KTS của DQH sẽ liên hệ trực tiếp trong vòng 2 giờ để trao đổi sâu về định hướng không gian của gia đình.</p>
              <form onSubmit={(e) => { e.preventDefault(); alert("✅ Gửi yêu cầu thành công. DQH sẽ liên hệ anh/chị ngay!"); }} className="space-y-4">
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-[#8A8780] mb-1 font-semibold">Họ và tên</label>
                  <input type="text" required placeholder="Nguyễn Văn A" className="w-full bg-[#F5F2EC] border border-[#1C1C1A]/10 px-3 py-2 text-xs rounded focus:outline-none focus:border-[#B89B6A]" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-[#8A8780] mb-1 font-semibold">Số điện thoại</label>
                  <input type="tel" required placeholder="0900 000 000" className="w-full bg-[#F5F2EC] border border-[#1C1C1A]/10 px-3 py-2 text-xs rounded focus:outline-none focus:border-[#B89B6A]" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-[#8A8780] mb-1 font-semibold">Lời nhắn / Yêu cầu</label>
                  <textarea rows={3} placeholder="Mô tả sơ bộ về dự án của anh/chị..." className="w-full bg-[#F5F2EC] border border-[#1C1C1A]/10 px-3 py-2 text-xs rounded focus:outline-none focus:border-[#B89B6A] resize-none" />
                </div>
                <button type="submit" className="w-full text-xs tracking-[0.12em] uppercase text-[#FAF8F4] bg-[#1C1C1A] py-3 hover:bg-[#B89B6A] transition-colors duration-300 font-bold rounded">Gửi yêu cầu tư vấn</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#1C1C1A] px-6 md:px-16 py-10 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-[#FAF8F4]/10 text-[#C4C0B8] text-xs">
        <p className="font-serif text-lg font-light tracking-wide text-white">DQH <span className="italic text-[#B89B6A]">Signature</span></p>
        <p>© 2020 – 2025 DQH Architects. Bảo lưu mọi quyền.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[#B89B6A]">Instagram</a>
          <a href="#" className="hover:text-[#B89B6A]">Facebook</a>
          <a href="#" className="hover:text-[#B89B6A]">Behance</a>
        </div>
      </footer>

      {/* ── FLOATING ADMIN BAR ── */}
      {isPreview && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-stone-900/90 backdrop-blur-md border border-stone-800 px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-5 text-stone-100 text-sm font-sans animate-fade-in transition-all">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-stone-300 tracking-wide text-xs uppercase">Xem trước Portfolio</span>
          </div>
          <div className="h-4 w-px bg-stone-700" />
          <button 
            onClick={() => setShowShareManager(true)}
            className="bg-[#B89B6A] hover:bg-[#B89B6A]/85 active:scale-95 text-stone-50 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
          >
            Tạo &amp; Chia sẻ link
          </button>
        </div>
      )}

      {/* ── SHARING MANAGER PANEL MODAL ── */}
      {isPreview && showShareManager && (
        <div className="fixed inset-0 bg-stone-950/80 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-y-auto relative animate-scale-up">
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

    </div>
  );
}
