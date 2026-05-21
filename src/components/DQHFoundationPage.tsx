import { useState, useEffect } from 'react';

/* ────────────────────────────────────────────────────────────── */
/*  DQH Foundation Page — Quiet Luxury Internal Branding Page    */
/*  Spec: DQH_LandingPage_Spec_Antigravity v1.0                 */
/* ────────────────────────────────────────────────────────────── */

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

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'DM Sans', sans-serif";

/* ── Scroll animation hook ───────────────────────────────────── */
function useFadeUp() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('dqh-visible');
      }),
      { threshold: 0.15 }
    );
    document.querySelectorAll('.dqh-fade-up').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ── Inline style helper ─────────────────────────────────────── */
const label = (color = COLORS.gold): React.CSSProperties => ({
  fontFamily: SANS, fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase' as const,
  color, fontWeight: 500,
});

export default function DQHFoundationPage() {
  useFadeUp();

  return (
    <>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      {/* Global animation styles */}
      <style>{`
        .dqh-fade-up {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .dqh-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .dqh-fade-up:nth-child(2) { transition-delay: 0.1s; }
        .dqh-fade-up:nth-child(3) { transition-delay: 0.2s; }
        .dqh-fade-up:nth-child(4) { transition-delay: 0.3s; }
        .dqh-card-value { transition: all 0.4s ease; cursor: default; }
        .dqh-card-value:hover { background-color: ${COLORS.charcoal} !important; }
        .dqh-card-value:hover .dqh-val-letter { color: ${COLORS.gold} !important; }
        .dqh-card-value:hover .dqh-val-name { color: ${COLORS.cream} !important; }
        .dqh-card-value:hover .dqh-val-sub { color: ${COLORS.goldLight} !important; }
        .dqh-card-value:hover .dqh-val-body { color: ${COLORS.stoneLight} !important; }
        .dqh-card-value:hover .dqh-val-bullet { color: rgba(255,255,255,0.55) !important; }
        .dqh-card-value:hover .dqh-val-dash { color: ${COLORS.gold} !important; }
        @keyframes dqh-pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
      `}</style>

      <div style={{ fontFamily: SANS, color: COLORS.charcoal, lineHeight: 1.9, fontSize: '14px' }}>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* HERO                                                   */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section
          className="dqh-fade-up"
          style={{
            background: 'linear-gradient(160deg, #2A2820 0%, #1C1C1A 60%, #0E0E0C 100%)',
            position: 'relative',
            overflow: 'hidden',
            padding: 'clamp(4rem, 10vw, 7rem) clamp(2rem, 4vw, 4rem)',
          }}
        >
          {/* Decorative vertical line */}
          <div style={{
            position: 'absolute', right: 'clamp(3rem, 12vw, 12rem)', top: 0, bottom: 0,
            width: '0.5px',
            background: `linear-gradient(to bottom, transparent 10%, ${COLORS.gold}40 50%, transparent 90%)`,
          }}>
            <span style={{
              position: 'absolute', top: '50%', right: '-2rem',
              transform: 'rotate(90deg) translateX(-50%)',
              fontFamily: SANS, fontSize: '9px', letterSpacing: '0.25em',
              color: COLORS.stoneLight, whiteSpace: 'nowrap',
            }}>
              Est. 30 · 12 · 2020
            </span>
          </div>

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px' }}>
            <p style={{ ...label(COLORS.stoneLight), marginBottom: '2rem' }}>
              Interior Design & Build Studio · TP.HCM
            </p>

            <h1 style={{
              fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(3rem, 7vw, 5.5rem)',
              lineHeight: 1.05, color: COLORS.cream, margin: '0 0 1.5rem 0',
            }}>
              Define<br />
              <em style={{ fontStyle: 'italic', color: COLORS.stoneLight }}>Quality</em><br />
              Housing
            </h1>

            <p style={{
              fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300,
              fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
              color: COLORS.goldLight, margin: '0 0 2.5rem 0',
            }}>
              "Làm nghề tử tế."
            </p>

            {/* 3 meta info */}
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Mô hình', value: 'Design & Build' },
                { label: 'Phân khúc', value: 'Cao cấp' },
                { label: 'Triết lý', value: 'Quiet Luxury' },
              ].map((m, i) => (
                <div key={i}>
                  <p style={{ ...label(COLORS.stone), marginBottom: '4px' }}>{m.label}</p>
                  <p style={{ fontFamily: SANS, fontSize: '14px', color: COLORS.stoneLight, fontWeight: 400, margin: 0 }}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div style={{
            position: 'absolute', bottom: '2rem', right: '2rem',
            width: '0.5px', height: '40px',
            background: `linear-gradient(to bottom, ${COLORS.gold}, transparent)`,
            animation: 'dqh-pulse 2s infinite',
          }} />
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ABOUT                                                  */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="dqh-fade-up" style={{ background: COLORS.warmWhite, padding: 'clamp(3rem, 6vw, 7rem) clamp(2rem, 4vw, 4rem)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <p style={label()}>Chúng tôi là ai</p>
            <h2 style={{
              fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
              lineHeight: 1.2, margin: '1rem 0 2rem 0', color: COLORS.charcoal,
            }}>
              Không chỉ thiết kế — <em style={{ fontStyle: 'italic' }}>đồng hành trọn vẹn</em>
            </h2>
            <p style={{ color: COLORS.stone, marginBottom: '1rem' }}>
              DQH Architects là studio thiết kế & thi công nội thất tại TP.HCM, hoạt động theo mô hình Design & Build. Chúng tôi đồng hành cùng khách hàng từ ý tưởng đầu tiên đến ngày bàn giao — không phải chỉ làm một phần rồi chuyển giao.
            </p>
            <p style={{ color: COLORS.stone }}>
              Phục vụ phân khúc cao cấp — những khách hàng có tiêu chuẩn cao, hiểu giá trị của chất lượng, và kỳ vọng sự chuyên nghiệp ở từng điểm chạm.
            </p>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '3rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
              {[
                { num: '4+', desc: 'Năm hoạt động' },
                { num: 'D·Q·H', desc: 'Giá trị cốt lõi' },
                { num: '100%', desc: 'Design & Build' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: SERIF, fontSize: '2rem', fontWeight: 300, color: COLORS.charcoal, margin: '0 0 4px 0' }}>{s.num}</p>
                  <p style={{ ...label(), margin: 0 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* MOTTO                                                  */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="dqh-fade-up" style={{ background: COLORS.charcoal, padding: 'clamp(3rem, 6vw, 7rem) clamp(2rem, 4vw, 4rem)' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <p style={label()}>Châm ngôn làm nghề</p>

            <blockquote style={{
              fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300,
              fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1.3,
              color: COLORS.cream, margin: '1.5rem 0 1rem 0',
            }}>
              "Làm nghề <em>tử tế.</em>"
            </blockquote>
            <p style={{ color: COLORS.stoneLight, fontSize: '14px', marginBottom: '3rem', maxWidth: '600px' }}>
              Không phải slogan — đây là cách DQH vận hành mỗi ngày, trong từng quyết định nhỏ của mỗi thành viên.
            </p>

            <div style={{ borderTop: `0.5px solid ${COLORS.border}`, marginBottom: '2rem' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
              {[
                { num: '01', title: 'Tử tế với khách hàng', body: 'Nói thật, làm đúng, không qua loa. Khách hàng trả tiền cho sự tin tưởng — không phải chỉ cho sản phẩm.' },
                { num: '02', title: 'Tử tế với đồng nghiệp', body: 'Hỗ trợ nhau, không đổ lỗi. Người biết dạy người chưa biết. Không ai phải tự giải quyết một mình.' },
                { num: '03', title: 'Tử tế với nghề', body: 'Làm kỹ dù không ai nhìn thấy. Một chi tiết đúng không cần giải thích — người ta cảm nhận được.' },
              ].map((item) => (
                <div key={item.num}>
                  <p style={{ fontFamily: SERIF, fontSize: '2rem', fontWeight: 300, color: COLORS.goldLight, margin: '0 0 0.5rem 0' }}>{item.num}</p>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: COLORS.cream, marginBottom: '0.5rem', letterSpacing: '0.02em' }}>{item.title}</p>
                  <p style={{ fontSize: '13px', color: COLORS.stoneLight, lineHeight: 1.8, margin: 0 }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* VALUES — D · Q · H                                     */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="dqh-fade-up" style={{ background: COLORS.cream, padding: 'clamp(3rem, 6vw, 7rem) clamp(2rem, 4vw, 4rem)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <p style={label()}>Bản sắc thương hiệu</p>
              <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', margin: '1rem 0 0 0', color: COLORS.charcoal }}>
                D · Q · H — <em style={{ fontStyle: 'italic' }}>Ba giá trị sống mỗi ngày</em>
              </h2>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1px', background: COLORS.border,
            }}>
              {[
                {
                  letter: 'D', name: 'ĐỒNG HÀNH', sub: '"Luôn có mặt, kể cả lúc khó."',
                  bullets: ['Lắng nghe khách hàng trước khi phản biện', 'Hỏi khi chưa rõ, không tự đoán', 'Thấy vấn đề → báo ngay, không tồn đọng', 'Không ai làm việc một mình tại DQH'],
                },
                {
                  letter: 'Q', name: 'QUY CHUẨN', sub: '"Làm đúng, làm kỹ, làm có lý do."',
                  bullets: ['Mọi quyết định thiết kế có lý do chuyên môn', 'Bản vẽ đủ chi tiết để thợ làm đúng ngay lần đầu', 'Phát hiện lỗi → dừng, sửa, báo — không che', 'Tiến độ & chi phí minh bạch, không phát sinh bất ngờ'],
                },
                {
                  letter: 'H', name: 'HÀI LÒNG', sub: '"Nụ cười bàn giao là thước đo thành công."',
                  bullets: ['Khách hàng cảm thấy không gian là của họ', 'Tự hào khi nhìn lại việc mình đã làm', 'Mỗi dự án xong → một bài học cho cả team', 'Sự hài lòng tuyệt đối, không phải đủ để giao'],
                },
              ].map((v) => (
                <div key={v.letter} className="dqh-card-value" style={{
                  background: COLORS.cream, padding: 'clamp(2rem, 3vw, 3rem)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Big decorative letter */}
                  <span className="dqh-val-letter" style={{
                    position: 'absolute', top: '-10px', right: '10px',
                    fontFamily: SERIF, fontSize: '5rem', fontWeight: 300,
                    color: 'rgba(28,28,26,0.06)', lineHeight: 1, pointerEvents: 'none',
                    transition: 'color 0.4s ease',
                  }}>{v.letter}</span>

                  <p className="dqh-val-name" style={{ ...label(COLORS.charcoal), fontSize: '11px', fontWeight: 500, letterSpacing: '0.2em', marginBottom: '0.3rem', transition: 'color 0.4s ease' }}>
                    {v.name}
                  </p>
                  <p className="dqh-val-sub" style={{
                    fontFamily: SERIF, fontStyle: 'italic', fontSize: '15px', fontWeight: 300,
                    color: COLORS.stone, marginBottom: '1.5rem', transition: 'color 0.4s ease',
                  }}>{v.sub}</p>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {v.bullets.map((b, j) => (
                      <li key={j} className="dqh-val-bullet" style={{
                        fontSize: '13px', color: COLORS.stone, lineHeight: 1.8,
                        display: 'flex', alignItems: 'flex-start', gap: '8px', transition: 'color 0.4s ease',
                      }}>
                        <span className="dqh-val-dash" style={{ color: COLORS.gold, flexShrink: 0, transition: 'color 0.4s ease' }}>—</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* PHILOSOPHY — Quiet Luxury                              */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="dqh-fade-up" style={{ background: COLORS.warmWhite, padding: 'clamp(3rem, 6vw, 7rem) clamp(2rem, 4vw, 4rem)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(2rem, 5vw, 6rem)' }}>
            {/* Left — Quote block */}
            <div style={{ borderLeft: `0.5px solid ${COLORS.border}`, paddingLeft: '2rem' }}>
              {/* Decorative quote mark */}
              <span style={{ fontFamily: SERIF, fontSize: '4rem', lineHeight: 1, color: `${COLORS.gold}4D`, display: 'block', marginBottom: '-1rem' }}>"</span>
              <blockquote style={{
                fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300,
                fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', lineHeight: 1.4,
                color: COLORS.charcoal, margin: '0 0 2rem 0',
              }}>
                Sang trọng không cần phô trương.
              </blockquote>

              {[
                { num: '01', text: 'Chất lượng nói thay lời quảng cáo — một chi tiết hoàn thiện đúng được cảm nhận, không cần giải thích.' },
                { num: '02', text: 'Sự tinh tế nằm ở những gì biết kiềm chế. Không gian tốt nhất là không gian biết bỏ đi đúng lúc.' },
                { num: '03', text: 'Niềm tin được xây dựng qua hành động, không phải lời hứa. Khách hàng cao cấp không cần thuyết phục — cần được chứng minh.' },
              ].map((p) => (
                <div key={p.num} style={{ borderTop: `0.5px solid ${COLORS.border}`, paddingTop: '1rem', marginBottom: '1rem' }}>
                  <span style={{ fontFamily: SERIF, fontSize: '1.2rem', color: COLORS.gold, fontWeight: 300 }}>{p.num}</span>
                  <p style={{ fontSize: '13px', color: COLORS.stone, lineHeight: 1.8, margin: '0.3rem 0 0 0' }}>{p.text}</p>
                </div>
              ))}
            </div>

            {/* Right — Explanation */}
            <div>
              <p style={label()}>Triết lý thiết kế</p>
              <h2 style={{
                fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(1.6rem, 3vw, 2.5rem)',
                lineHeight: 1.2, margin: '1rem 0 2rem 0', color: COLORS.charcoal,
              }}>
                Quiet Luxury — <em style={{ fontStyle: 'italic' }}>Tinh tế có chủ ý</em>
              </h2>
              <p style={{ color: COLORS.stone, marginBottom: '1rem' }}>
                Quiet Luxury không phải phong cách thiết kế. Đó là cách DQH tiếp cận mọi thứ — từ cách tạo ra không gian, đến cách giao tiếp với khách hàng, đến cách xây dựng đội ngũ.
              </p>
              <p style={{ color: COLORS.stone }}>
                Vẻ đẹp thực sự đến từ tỷ lệ chuẩn mực, vật liệu chân thực, và sự kiềm chế có chủ ý. Người ta cảm nhận được mà không thể giải thích tại sao — đó là dấu hiệu của một không gian thực sự tốt.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* VISION & MISSION                                       */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="dqh-fade-up" style={{ background: COLORS.charcoal }}>
          <div style={{
            maxWidth: '1200px', margin: '0 auto',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          }}>
            {/* Tầm nhìn */}
            <div style={{ padding: 'clamp(3rem, 5vw, 5rem) clamp(2rem, 4vw, 4rem)', borderRight: `0.5px solid rgba(255,255,255,0.08)` }}>
              <p style={label()}>Tầm nhìn</p>
              <h2 style={{
                fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
                lineHeight: 1.3, color: COLORS.cream, margin: '1rem 0 1.5rem 0',
              }}>
                Studio nội thất cao cấp được tin chọn hàng đầu tại TP.HCM.
              </h2>
              <p style={{
                fontSize: '13px', color: `rgba(255,255,255,0.35)`, lineHeight: 1.8,
                borderLeft: `2px solid ${COLORS.gold}40`, paddingLeft: '1rem',
              }}>
                Không phải tham vọng về quy mô — mà là tham vọng về chất lượng được ghi nhớ. Khi khách hàng nghĩ đến một không gian thực sự đúng với họ, họ nghĩ đến DQH.
              </p>
            </div>
            {/* Sứ mệnh */}
            <div style={{ padding: 'clamp(3rem, 5vw, 5rem) clamp(2rem, 4vw, 4rem)' }}>
              <p style={label()}>Sứ mệnh</p>
              <h2 style={{
                fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
                lineHeight: 1.3, color: COLORS.cream, margin: '1rem 0 1.5rem 0',
              }}>
                Mỗi không gian DQH tạo ra phải phản ánh đúng bản sắc của gia chủ.
              </h2>
              <p style={{
                fontSize: '13px', color: `rgba(255,255,255,0.35)`, lineHeight: 1.8,
                borderLeft: `2px solid ${COLORS.gold}40`, paddingLeft: '1rem',
              }}>
                Không copy template. Không làm cho xong. Mỗi dự án là một tác phẩm cá nhân hóa — nơi thẩm mỹ tinh tế hòa quyện với kỹ thuật chuẩn xác.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* 3 COMMITMENTS                                          */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="dqh-fade-up" style={{ background: COLORS.cream, padding: 'clamp(3rem, 6vw, 7rem) clamp(2rem, 4vw, 4rem)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <p style={label()}>Dành cho đội ngũ</p>
              <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', margin: '1rem 0 0 0', color: COLORS.charcoal }}>
                3 điều DQH <em style={{ fontStyle: 'italic' }}>cam kết với bạn</em>
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {[
                { num: 'I', title: 'Sân chơi', body: 'Bạn được thử, được học, được làm những thứ bạn thực sự tự hào. DQH là nơi để phát triển — không chỉ để thực thi.' },
                { num: 'II', title: 'Đồng hành', body: 'Khi bạn gặp khó, có người cùng giải quyết. Không ai bị bỏ lại một mình. Văn hóa DQH là hỗ trợ nhau — không cạnh tranh nội bộ.' },
                { num: 'III', title: 'Công nhận', body: 'Làm tốt thì được nhìn thấy. Đóng góp của bạn có ý nghĩa — và điều đó được ghi nhận rõ ràng.' },
              ].map((c) => (
                <div key={c.num} style={{
                  border: `0.5px solid ${COLORS.border}`,
                  borderTop: `2px solid ${COLORS.gold}`,
                  padding: '2rem',
                  background: COLORS.warmWhite,
                }}>
                  <p style={{ fontFamily: SERIF, fontSize: '1.5rem', fontWeight: 300, color: COLORS.gold, margin: '0 0 0.3rem 0' }}>{c.num}.</p>
                  <p style={{ ...label(COLORS.charcoal), fontSize: '11px', marginBottom: '0.8rem' }}>{c.title.toUpperCase()}</p>
                  <p style={{ fontSize: '13px', color: COLORS.stone, lineHeight: 1.8, margin: 0 }}>{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* CLOSING                                                */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="dqh-fade-up" style={{
          background: COLORS.warmWhite,
          padding: 'clamp(4rem, 8vw, 8rem) clamp(2rem, 4vw, 4rem)',
          textAlign: 'center',
        }}>
          <p style={{ ...label(), marginBottom: '1.5rem' }}>Bạn thuộc về đây nếu</p>
          <h2 style={{
            fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)',
            lineHeight: 1.4, color: COLORS.charcoal, maxWidth: '700px', margin: '0 auto',
          }}>
            Bạn muốn làm tốt hơn là làm nhiều — và muốn công việc để lại <em style={{ fontStyle: 'italic', color: COLORS.stone }}>dấu ấn thật sự.</em>
          </h2>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* FOOTER                                                 */}
        {/* ═══════════════════════════════════════════════════════ */}
        <footer style={{
          background: COLORS.charcoal, padding: '2rem',
          textAlign: 'center', borderTop: `0.5px solid rgba(255,255,255,0.06)`,
        }}>
          <p style={{ fontFamily: SERIF, fontSize: '14px', color: COLORS.stoneLight, margin: '0 0 4px 0' }}>
            DQH Architects
          </p>
          <p style={{ fontSize: '11px', color: COLORS.stone, margin: '0 0 4px 0' }}>
            © 2020 – 2025 · TP.HCM, Việt Nam
          </p>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '12px', color: COLORS.goldLight, margin: 0 }}>
            "Làm nghề tử tế."
          </p>
        </footer>
      </div>
    </>
  );
}
