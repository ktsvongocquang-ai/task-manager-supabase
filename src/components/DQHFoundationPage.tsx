import { useState, useEffect, useRef } from 'react';
import {
  Heart, Target, Users, Sparkles, ArrowDown,
  Star, HandHeart, Award, Eye, Compass, Shield,
  ChevronRight
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────── */
/*  DQH Foundation Page — Internal Branding Landing Page         */
/* ────────────────────────────────────────────────────────────── */

export default function DQHFoundationPage() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <div className="space-y-0 overflow-hidden">
      {/* ═══ HERO ═══ */}
      <section
        id="hero" data-animate
        className={`relative overflow-hidden rounded-2xl transition-all duration-700 ${isVisible('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #533483 100%)',
          minHeight: '380px',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-[-60px] right-[-60px] w-[250px] h-[250px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-40px] left-[-40px] w-[200px] h-[200px] rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 py-16">
          {/* Logo text */}
          <div className="mb-2">
            <span className="text-[11px] font-semibold tracking-[0.3em] uppercase text-purple-300/70">Interior Design & Build Studio</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>
            <span className="text-purple-300">D</span>
            <span className="text-white/90">Q</span>
            <span className="text-amber-300">H</span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 font-light tracking-wide mb-8">
            Define Quality Housing
          </p>

          {/* Slogan */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-8 py-5 max-w-lg">
            <p className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
              "Làm nghề tử tế."
            </p>
            <p className="text-sm text-white/50">
              Thiết kế & Thi công Nội thất Cao cấp · TP.HCM · Est. 2020
            </p>
          </div>

          <div className="mt-8 animate-bounce">
            <ArrowDown size={20} className="text-white/30" />
          </div>
        </div>
      </section>

      {/* ═══ DQH LÀ GÌ? ═══ */}
      <section
        id="about" data-animate
        className={`bg-white rounded-2xl border border-gray-200 p-8 md:p-10 transition-all duration-700 delay-100 ${isVisible('about') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block px-3 py-1 bg-purple-50 text-purple-600 text-[11px] font-semibold rounded-full uppercase tracking-wider mb-4">
            Về DQH
          </span>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Chúng tôi là ai?</h2>
          <p className="text-base text-gray-600 leading-relaxed mb-4">
            Công ty thiết kế & thi công nội thất tại TP.HCM, thành lập <strong>30/12/2020</strong>.
          </p>
          <p className="text-base text-gray-600 leading-relaxed mb-4">
            Làm theo mô hình <span className="font-semibold text-purple-700">Design & Build</span> — đồng hành cùng khách hàng từ thiết kế đến hoàn thiện thi công, không phải chỉ làm một phần rồi bàn giao.
          </p>
          <p className="text-base text-gray-600 leading-relaxed">
            Phân khúc khách hàng: <span className="font-semibold text-gray-900">cao cấp</span>. Họ có tiêu chuẩn cao, trả tiền xứng đáng, và kỳ vọng sự chuyên nghiệp ở <em>từng điểm chạm</em>.
          </p>
        </div>
      </section>

      {/* ═══ CHÂM NGÔN ═══ */}
      <section
        id="motto" data-animate
        className={`rounded-2xl p-8 md:p-10 transition-all duration-700 delay-150 ${isVisible('motto') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{ background: 'linear-gradient(135deg, #fdf4ff 0%, #f5f3ff 50%, #eff6ff 100%)' }}
      >
        <div className="max-w-2xl mx-auto text-center mb-8">
          <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-[11px] font-semibold rounded-full uppercase tracking-wider mb-4">
            Châm ngôn
          </span>
          <h2 className="text-3xl font-black text-gray-900 mb-2">"Làm nghề tử tế."</h2>
          <p className="text-sm text-gray-500">Không phải slogan — đây là cách DQH vận hành mỗi ngày.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { icon: Heart, color: '#EC4899', bg: '#FDF2F8', title: 'Tử tế với khách hàng', desc: 'Nói thật, làm đúng, không qua loa.' },
            { icon: Users, color: '#8B5CF6', bg: '#F5F3FF', title: 'Tử tế với đồng nghiệp', desc: 'Hỗ trợ nhau, không đổ lỗi.' },
            { icon: Sparkles, color: '#F59E0B', bg: '#FFFBEB', title: 'Tử tế với nghề', desc: 'Làm kỹ dù không ai nhìn thấy.' },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 text-center border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: item.bg }}
              >
                <item.icon size={22} style={{ color: item.color }} />
              </div>
              <h3 className="font-bold text-sm text-gray-900 mb-2">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ D · Q · H NGHĨA LÀ GÌ? ═══ */}
      <section
        id="dqh-meaning" data-animate
        className={`bg-gray-900 rounded-2xl p-8 md:p-10 transition-all duration-700 delay-200 ${isVisible('dqh-meaning') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-white/10 text-white/70 text-[11px] font-semibold rounded-full uppercase tracking-wider mb-4">
            Ý nghĩa thương hiệu
          </span>
          <h2 className="text-2xl font-bold text-white">
            <span className="text-purple-400">D</span> · <span className="text-white">Q</span> · <span className="text-amber-400">H</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {[
            {
              letter: 'D', label: 'ĐỒNG HÀNH', color: '#A78BFA', bg: 'rgba(167,139,250,0.15)',
              client: 'Luôn có mặt, kể cả lúc khó',
              work: 'Hỏi khi chưa rõ, không tự đoán',
            },
            {
              letter: 'Q', label: 'QUY CHUẨN', color: '#F9FAFB', bg: 'rgba(255,255,255,0.08)',
              client: 'Làm đúng bản vẽ, đúng cam kết',
              work: 'Làm có quy trình, không tự phá chuẩn',
            },
            {
              letter: 'H', label: 'HÀI LÒNG', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)',
              client: 'Khách hàng thấy xứng đáng',
              work: 'Tự hào khi nhìn lại việc mình làm',
            },
          ].map((item, i) => (
            <div key={i} className="rounded-xl p-6 border border-white/10" style={{ backgroundColor: item.bg }}>
              <div className="text-center mb-5">
                <span className="text-4xl font-black" style={{ color: item.color }}>{item.letter}</span>
                <p className="text-[11px] font-semibold tracking-widest mt-1" style={{ color: item.color }}>{item.label}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Với khách hàng</p>
                  <p className="text-sm text-white/80 leading-relaxed">{item.client}</p>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Với công việc hàng ngày</p>
                  <p className="text-sm text-white/80 leading-relaxed">{item.work}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 3 CAM KẾT ═══ */}
      <section
        id="commitments" data-animate
        className={`bg-white rounded-2xl border border-gray-200 p-8 md:p-10 transition-all duration-700 delay-100 ${isVisible('commitments') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-[11px] font-semibold rounded-full uppercase tracking-wider mb-4">
            Cam kết
          </span>
          <h2 className="text-2xl font-bold text-gray-900">3 Điều DQH cam kết với bạn</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {[
            {
              icon: Target, color: '#7C3AED', bg: '#F5F3FF',
              title: 'Sân chơi',
              desc: 'Bạn được thử, được học, được làm thứ mình tự hào.',
            },
            {
              icon: HandHeart, color: '#059669', bg: '#ECFDF5',
              title: 'Đồng hành',
              desc: 'Khi bạn gặp khó, có người cùng giải quyết. Không ai bị bỏ lại một mình.',
            },
            {
              icon: Award, color: '#D97706', bg: '#FFFBEB',
              title: 'Công nhận',
              desc: 'Làm tốt thì được nhìn thấy. Không cần tự PR.',
            },
          ].map((item, i) => (
            <div key={i} className="rounded-xl p-6 text-center border-2 border-dashed hover:border-solid transition-all duration-300" style={{ borderColor: `${item.color}30` }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: item.bg }}>
                <item.icon size={24} style={{ color: item.color }} />
              </div>
              <h3 className="font-bold text-base text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TẦM NHÌN & SỨ MỆNH ═══ */}
      <section
        id="vision" data-animate
        className={`rounded-2xl overflow-hidden transition-all duration-700 delay-150 ${isVisible('vision') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Tầm nhìn */}
          <div className="p-8 md:p-10" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Eye size={18} className="text-purple-200" />
              <span className="text-[11px] font-semibold tracking-widest uppercase text-purple-200">Tầm nhìn</span>
            </div>
            <p className="text-xl font-bold text-white leading-relaxed">
              Studio nội thất cao cấp được tin chọn hàng đầu tại TP.HCM.
            </p>
          </div>
          {/* Sứ mệnh */}
          <div className="p-8 md:p-10" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Compass size={18} className="text-green-200" />
              <span className="text-[11px] font-semibold tracking-widest uppercase text-green-200">Sứ mệnh</span>
            </div>
            <p className="text-xl font-bold text-white leading-relaxed">
              Mỗi không gian DQH tạo ra phải phản ánh đúng bản sắc của gia chủ — không copy template, không làm cho xong.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ 3 GIÁ TRỊ CỐT LÕI ═══ */}
      <section
        id="values" data-animate
        className={`bg-white rounded-2xl border border-gray-200 p-8 md:p-10 transition-all duration-700 delay-200 ${isVisible('values') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 text-[11px] font-semibold rounded-full uppercase tracking-wider mb-4">
            Giá trị cốt lõi
          </span>
          <h2 className="text-2xl font-bold text-gray-900">3 Giá trị DQH sống mỗi ngày</h2>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          {[
            {
              icon: Star, color: '#EF4444', gradient: 'linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)',
              title: 'THÁI ĐỘ', subtitle: 'Tận tâm trong từng chi tiết',
              bullets: [
                'Duyệt sample vật liệu thật trước khi trình khách',
                'Mọi quyết định thiết kế đều có lý do — không "thấy đẹp thì làm"',
                'Phát hiện lỗi thi công → dừng, sửa, báo — không che',
                'Trình concept phải giải thích được "tại sao"',
              ],
            },
            {
              icon: Shield, color: '#3B82F6', gradient: 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)',
              title: 'TRÁCH NHIỆM', subtitle: 'Chủ động, không chờ nhắc',
              bullets: [
                'Phần việc của mình → tự track, không cần Leader nhắc',
                'Thấy vấn đề → báo ngay trong ngày, không tồn đọng',
                'Thấy lỗi người khác → nói thẳng, xây dựng',
                'Feedback phải cụ thể — không nói chung chung',
              ],
            },
            {
              icon: HandHeart, color: '#059669', gradient: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
              title: 'ĐỒNG HÀNH', subtitle: 'Cùng khách & đội ngũ phát triển',
              bullets: [
                'Lắng nghe khách trước khi phản biện',
                'Khách yêu cầu sai → tư vấn thẳng, giải thích tại sao',
                'Mỗi dự án xong → review 1 bài học cho cả team',
                'Chia sẻ kiến thức nội bộ — người biết dạy người chưa biết',
              ],
            },
          ].map((val, i) => (
            <div
              key={i}
              className="rounded-xl p-6 border border-gray-100 hover:shadow-md transition-all duration-300"
              style={{ background: val.gradient }}
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm">
                  <val.icon size={20} style={{ color: val.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-sm tracking-wide" style={{ color: val.color }}>{val.title}</h3>
                    <span className="text-xs text-gray-500">— {val.subtitle}</span>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {val.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-2 text-[13px] text-gray-600">
                        <ChevronRight size={12} className="flex-shrink-0 mt-1" style={{ color: val.color }} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TRIẾT LÝ THIẾT KẾ ═══ */}
      <section
        id="philosophy" data-animate
        className={`rounded-2xl p-8 md:p-10 text-center transition-all duration-700 delay-100 ${isVisible('philosophy') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
      >
        <span className="inline-block px-3 py-1 bg-white/10 text-white/60 text-[11px] font-semibold rounded-full uppercase tracking-wider mb-6">
          Triết lý thiết kế
        </span>
        <blockquote className="text-xl md:text-2xl font-bold text-white leading-relaxed max-w-2xl mx-auto mb-4">
          "Quiet Luxury" — Sang trọng không cần phô trương.
        </blockquote>
        <p className="text-sm text-white/50 max-w-xl mx-auto leading-relaxed">
          Vẻ đẹp thực sự đến từ tỷ lệ chuẩn mực, vật liệu chân thực, và sự kiềm chế có chủ ý.
          Không gian tốt nhất là không gian người ta cảm nhận được mà không thể giải thích tại sao.
        </p>
      </section>
    </div>
  );
}
