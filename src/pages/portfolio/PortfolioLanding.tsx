/**
 * DesignCoPage.jsx
 * React + Tailwind CSS clone of https://receptive-questions-750334.framer.app/
 * Adapted for DQH — Architecture & Interior (Vietnamese)
 *
 * Usage (Next.js App Router):
 *   app/page.tsx  →  import DesignCoPage from "@/components/DesignCoPage"
 *
 * Fonts needed in layout.tsx / _document.tsx:
 *   <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet" />
 *
 * tailwind.config.js — extend fonts:
 *   theme: { extend: { fontFamily: {
 *     serif:  ["Cormorant Garamond", "Georgia", "serif"],
 *     sans:   ["DM Sans", "system-ui", "sans-serif"],
 *   }}}
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Công trình", href: "#works" },
  { label: "Về chúng tôi", href: "#about" },
  { label: "Dịch vụ", href: "#services" },
  { label: "Liên hệ", href: "#contact" },
];

const PROJECTS = [
  { id: 1, num: "01", cat: "Biệt thự · Thủ Đức", title: "The Lumé Residence",   img: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=700&q=70" },
  { id: 2, num: "02", cat: "Nhà phố · Quận 3",   title: "The Horizon House",    img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=700&q=70" },
  { id: 3, num: "03", cat: "Penthouse · Quận 7",  title: "The Verena Penthouse", img: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=700&q=70" },
  { id: 4, num: "04", cat: "Boutique · Đà Lạt",   title: "Arden Boutique Resort",img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=700&q=70" },
];

const SERVICES = [
  {
    num: "01", title: "Thiết kế nội thất nhà ở",
    desc: "Chúng tôi tạo ra những không gian phản ánh phong cách sống của bạn — hòa quyện sự thoải mái, tinh tế và nguyên tắc thiết kế trường tồn.",
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=70",
  },
  {
    num: "02", title: "Thiết kế thương mại & văn phòng",
    desc: "Chúng tôi thiết kế môi trường có mục đích — nâng cao nhận diện thương hiệu và cải thiện cách mọi người làm việc, kết nối.",
    img: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&q=70",
  },
  {
    num: "03", title: "Thi công & Quản lý dự án",
    desc: "Giám sát từng giai đoạn với độ chính xác cao. Giá cố định trong hợp đồng, tiến độ cam kết, báo cáo hàng tuần qua Zalo.",
    img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=70",
  },
];

const TESTIMONIALS = [
  { text: "Từ buổi gặp đầu tiên, họ đã hiểu hoàn toàn tầm nhìn của chúng tôi. Thiết kế cuối cùng cảm giác rất tự nhiên — từng phòng đều chảy liền mạch.", name: "Chị Minh Châu", role: "Chủ nhà · Biệt thự Thủ Đức 2024", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=70", bg: "https://images.unsplash.com/photo-1600210491892-03d54730d73e?w=900&q=70" },
  { text: "Checklist nghiệm thu của DQH còn dài hơn danh sách của vợ tôi. Bàn giao xong thực sự không có gì để phàn nàn — từng chi tiết đều hoàn hảo.", name: "Anh Tuấn Anh", role: "Chủ nhà · Nhà phố Quận 3 2023", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=70", bg: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&q=70" },
  { text: "Ban công thấm sau 1 năm, gọi buổi sáng — chiều cùng ngày đã có kỹ thuật viên đến. Bảo hành không phải lời hứa, đó là cam kết thực sự.", name: "Chị Hồng Nhung", role: "Chủ nhà · Căn hộ Quận 7 2022", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=70", bg: "https://images.unsplash.com/photo-1583845112203-29329902332e?w=900&q=70" },
];

const PHILOSOPHY = [
  { kicker: "Sự đơn giản", title: "Simplicity", desc: "Chúng tôi đề cao những đường nét gọn gàng và sự kiềm chế có chủ ý, cho phép mỗi yếu tố được thở và phục vụ đúng mục đích.", img: "https://images.unsplash.com/photo-1616137466211-f939a420be84?w=800&q=70" },
  { kicker: "Sự hài hòa", title: "Harmony", desc: "Mỗi không gian nên cảm thấy gắn kết — sự pha trộn liền mạch của vật liệu, màu sắc và ánh sáng được thiết kế để truyền cảm hứng bình yên.", img: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&q=70" },
  { kicker: "Sự bền vững", title: "Longevity", desc: "Chúng tôi thiết kế với ý định, đảm bảo mỗi quyết định đứng vững trước thử thách của thời gian về cả phong cách lẫn chất lượng.", img: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800&q=70" },
];

const TEAM = [
  { name: "Đỗ Quang Hải",   role: "KTS Trưởng & Founder",    bio: "15+ năm kinh nghiệm thiết kế kiến trúc và nội thất cao cấp. Phong cách xoay quanh việc tạo ra những không gian phản ánh cá tính trong khi duy trì sự tinh tế hiện đại.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=70" },
  { name: "Nguyễn Minh Tuấn", role: "Giám đốc sáng tạo",     bio: "Giám sát tầm nhìn sáng tạo của studio. Con mắt tinh tế về màu sắc, ánh sáng và kết cấu — biến những căn phòng bình thường thành trải nghiệm đáng nhớ.", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=70" },
  { name: "Trần Hoàng Nam",  role: "Kỹ sư kết cấu cao cấp",  bio: "Chuyên gia quy hoạch không gian và kiến trúc. Chuyên môn đảm bảo mọi khái niệm chuyển tiếp liền mạch từ bản vẽ đến thi công thực tế.", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=70" },
  { name: "Lê Văn Khoa",    role: "Quản lý dự án",           bio: "Điều phối tiến độ, giao tiếp khách hàng và giám sát thi công. Đảm bảo mọi thiết kế được thực hiện với độ chính xác và đúng tiến độ cam kết.", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=70" },
];

const FAQS = [
  { q: "DQH cung cấp những dịch vụ gì?", a: "Chúng tôi cung cấp dịch vụ thiết kế nội thất toàn diện bao gồm quy hoạch không gian, thiết kế kiến trúc, thi công và quản lý dự án. Từ tư vấn ban đầu đến bàn giao chìa khoá." },
  { q: "DQH có làm dự án thương mại không?", a: "Có, chúng tôi làm việc trên nhiều loại không gian — từ nhà phố, biệt thự, căn hộ đến văn phòng, khách sạn boutique và không gian thương mại cao cấp." },
  { q: "Thời gian thi công điển hình là bao lâu?", a: "Nhà phố 4 tầng (thô): 4–5 tháng. Nội thất bổ sung: 2–3 tháng. Cải tạo căn hộ: 2–4 tháng. Tất cả được ghi rõ trong hợp đồng với điều khoản phạt nếu trễ." },
  { q: "Tư vấn ban đầu có mất phí không?", a: "Hoàn toàn miễn phí. KTS đến tận nhà khảo sát, phân tích không gian, tư vấn phong cách và ước tính ngân sách sơ bộ — không ràng buộc, không phí." },
  { q: "DQH có cam kết giá không phát sinh không?", a: "Có. Sau khi ký hợp đồng, giá được cố định. BOQ chi tiết từng hạng mục lập trước khi ký. Nếu phát sinh ngoài thiết kế đã duyệt, DQH chịu trách nhiệm chi phí đó." },
];

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

/** Reveal element when it enters viewport */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
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
  return [ref, visible];
}

/** Animated number counter */
function useCounter(target, duration = 1500) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const steps = 60;
    const inc = target / steps;
    let cur = 0;
    const id = setInterval(() => {
      cur = Math.min(cur + inc, target);
      setCount(Math.floor(cur));
      if (cur >= target) clearInterval(id);
    }, duration / steps);
    return () => clearInterval(id);
  }, [started, target, duration]);

  return [ref, count];
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Fade-up reveal wrapper */
function Reveal({ children, className = "", delay = 0, direction = "up" }) {
  const [ref, visible] = useReveal();
  const base = direction === "left"
    ? "translate-x-[-28px]"
    : "translate-y-[28px]";
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${base}`} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Section tag label */
function Tag({ children }) {
  return (
    <p className="text-xs tracking-[0.22em] uppercase text-stone-400 font-sans mb-4">
      {children}
    </p>
  );
}

/** Dark CTA button */
function BtnDark({ children, href = "#", onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="inline-block text-xs tracking-[0.12em] uppercase text-stone-50 bg-stone-900 px-8 py-3.5 hover:bg-amber-700 transition-colors duration-300 font-sans"
    >
      {children}
    </a>
  );
}

/** Arrow link */
function BtnArrow({ children, href = "#" }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 text-xs tracking-[0.12em] uppercase text-stone-900 hover:gap-4 transition-all duration-300 font-sans group"
    >
      {children}
      <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTIONS
// ─────────────────────────────────────────────────────────────────────────────

/* ── Navbar ── */
function Navbar({ mobileOpen, setMobileOpen }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 px-6 md:px-16 py-5 flex items-center justify-between transition-all duration-400 ${
          scrolled ? "bg-stone-50/92 backdrop-blur-xl border-b border-stone-200" : ""
        }`}
      >
        <a href="#" className="font-serif text-xl font-semibold tracking-wide text-stone-900">
          DQH
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex gap-9 list-none">
          {NAV_LINKS.map((l) => (
            <li key={l.label}>
              <a href={l.href} className="text-xs tracking-[0.12em] uppercase text-stone-400 hover:text-stone-900 transition-colors duration-300 font-sans">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a href="#contact" className="hidden md:inline-block text-xs tracking-[0.1em] uppercase text-stone-50 bg-stone-900 px-6 py-2.5 hover:bg-amber-700 transition-colors duration-300 font-sans">
          Đặt lịch tư vấn
        </a>

        {/* Hamburger */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-1"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Menu"
        >
          <span className={`block w-5 h-px bg-stone-900 transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-[6px]" : ""}`} />
          <span className={`block w-5 h-px bg-stone-900 transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-px bg-stone-900 transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-[6px]" : ""}`} />
        </button>
      </nav>

      {/* Mobile fullscreen menu */}
      <div
        className={`fixed inset-0 z-40 bg-stone-50 flex flex-col items-center justify-center gap-8 transition-all duration-400 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {NAV_LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            onClick={() => setMobileOpen(false)}
            className="font-serif text-4xl font-light text-stone-900 tracking-wide hover:text-amber-700 transition-colors duration-300"
          >
            {l.label}
          </a>
        ))}
      </div>
    </>
  );
}

/* ── Hero ── */
function Hero() {
  return (
    <section id="hero" className="min-h-screen grid grid-cols-1 md:grid-cols-2 overflow-hidden">
      {/* Left */}
      <div className="flex flex-col justify-end px-6 md:px-16 pb-16 pt-32 md:pt-0 bg-[#F8F5F0] relative z-10">
        <Reveal>
          <p className="text-xs tracking-[0.25em] uppercase text-stone-400 mb-7 flex items-center gap-3 font-sans">
            <span className="w-6 h-px bg-stone-400 inline-block" />
            Trụ sở tại TP. Hồ Chí Minh, Việt Nam
          </p>
        </Reveal>

        <Reveal delay={100}>
          <h1 className="font-serif text-[clamp(2.8rem,6vw,5rem)] font-light leading-[1.08] mb-7 text-stone-900">
            Không gian sống
            <br />
            <em className="not-italic text-amber-700">tinh tế.</em>
            <br />
            Kiến tạo cho bạn.
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="text-[0.95rem] text-stone-500 leading-[1.85] max-w-[420px] mb-10 font-sans">
            Chúng tôi tạo ra những không gian tinh tế — kết hợp sự thoải mái, thẩm mỹ và thiết kế bền vững, được điều chỉnh theo phong cách sống của bạn.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="flex items-center gap-5 flex-wrap">
            <BtnDark href="#works">Xem công trình</BtnDark>
            <BtnArrow href="#contact">Tư vấn miễn phí</BtnArrow>
          </div>
        </Reveal>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 right-10 hidden md:flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-10 bg-stone-400 animate-pulse" />
          <span className="text-[0.55rem] tracking-[0.2em] uppercase text-stone-400 [writing-mode:vertical-rl] font-sans">Scroll</span>
        </div>
      </div>

      {/* Right — hero image */}
      <div className="relative overflow-hidden h-[55vw] md:h-auto">
        <img
          src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1400&q=80"
          alt="DQH Interior"
          className="w-full h-full object-cover transition-transform duration-[8s] ease-out hover:scale-105"
        />
      </div>
    </section>
  );
}

/* ── Marquee ── */
function Marquee() {
  const items = ["Kiến trúc & Nội thất", "Modern Tropical Biophilic", "Thi công chuyên nghiệp", "Bảo hành 10 năm", "Giá cố định", "150+ công trình"];
  const doubled = [...items, ...items];
  return (
    <div className="border-y border-stone-200 overflow-hidden bg-white py-4">
      <div
        className="flex whitespace-nowrap"
        style={{ animation: "marquee 28s linear infinite" }}
      >
        {doubled.map((t, i) => (
          <span key={i} className="font-serif text-base italic text-stone-400 px-10">
            {t}
            <span className="text-amber-600 ml-10">✦</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }`}</style>
    </div>
  );
}

/* ── Works ── */
function Works() {
  const [hovered, setHovered] = useState(null);
  return (
    <section id="works" className="px-6 md:px-16 py-24 bg-[#F8F5F0]">
      {/* Header */}
      <div className="flex justify-between items-end mb-14">
        <div>
          <Reveal><Tag>(công trình)</Tag></Reveal>
          <Reveal delay={100}>
            <h2 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-light text-stone-900">
              Công trình <em className="not-italic text-amber-700">nổi bật</em>
            </h2>
          </Reveal>
        </div>
        <Reveal delay={200}>
          <BtnArrow href="#">Xem tất cả</BtnArrow>
        </Reveal>
      </div>

      {/* List */}
      <div className="flex flex-col">
        {PROJECTS.map((p, i) => (
          <a
            key={p.id}
            href="#"
            className="grid grid-cols-[48px_1fr] md:grid-cols-[60px_1fr_340px] gap-0 items-center py-6 border-t border-stone-200 last:border-b hover:bg-stone-900/[0.015] transition-colors duration-300 no-underline text-inherit group"
            onMouseEnter={() => setHovered(p.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="font-serif text-sm italic text-stone-400">{p.num}</span>
            <div className="pl-8 md:pl-10">
              <p className="text-[0.6rem] tracking-[0.18em] uppercase text-stone-400 mb-1 font-sans">{p.cat}</p>
              <p className="font-serif text-xl md:text-2xl font-light text-stone-900 group-hover:text-amber-700 transition-colors duration-300">
                {p.title}
              </p>
            </div>
            {/* Hover image — desktop only */}
            <div
              className={`hidden md:block overflow-hidden transition-all duration-400 ${
                hovered === p.id ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"
              }`}
            >
              <img src={p.img} alt={p.title} className="w-full h-[190px] object-cover" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ── About ── */
function About() {
  const [r0, c0] = useCounter(150);
  const [r1, c1] = useCounter(12);
  const [r2, c2] = useCounter(98);

  return (
    <section id="about" className="px-6 md:px-16 py-24 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
        {/* Image */}
        <Reveal direction="left">
          <div className="relative overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80"
              alt="DQH Studio"
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="absolute bottom-6 left-6 bg-white px-5 py-2.5 text-[0.62rem] tracking-[0.15em] uppercase text-stone-900 font-sans">
              Thành lập 2012 · TP.HCM
            </div>
          </div>
        </Reveal>

        {/* Text */}
        <div>
          <Reveal><Tag>(về chúng tôi)</Tag></Reveal>
          <Reveal delay={100}>
            <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-light leading-[1.12] text-stone-900 mb-6">
              Thiết kế không gian với{" "}
              <em className="not-italic text-amber-700">mục đích</em> và sự chính xác
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-[0.92rem] text-stone-500 leading-[1.9] mb-4 font-sans">
              Chúng tôi tiếp cận mỗi không gian như một sự cân bằng giữa chức năng, hình thức và cảm xúc. Qua vật liệu, ánh sáng và kết cấu được chọn lọc, DQH tạo ra những nội thất phản ánh cá tính đồng thời trường tồn với thời gian.
            </p>
            <p className="text-[0.92rem] text-stone-500 leading-[1.9] font-sans">
              Với 12 năm kinh nghiệm và hơn 150 công trình hoàn thành, chúng tôi tự hào là đơn vị được tin tưởng bởi những gia chủ khó tính nhất tại Việt Nam.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-9"><BtnDark href="#contact">Liên hệ chúng tôi</BtnDark></div>
          </Reveal>

          {/* Stats */}
          <Reveal delay={400}>
            <div className="flex gap-8 mt-12 pt-10 border-t border-stone-200">
              {[
                { ref: r0, val: c0, suffix: "+", label: "Công trình hoàn thành" },
                { ref: r1, val: c1, suffix: "+", label: "Năm kinh nghiệm" },
                { ref: r2, val: c2, suffix: "%", label: "Khách hàng hài lòng" },
              ].map((s) => (
                <div key={s.label} ref={s.ref} className="flex-1">
                  <p className="font-serif text-[2.6rem] font-light leading-none mb-1 text-stone-900">
                    {s.val}
                    <span className="text-2xl">{s.suffix}</span>
                  </p>
                  <p className="text-[0.65rem] tracking-[0.12em] uppercase text-stone-400 font-sans leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Services ── */
function Services() {
  return (
    <section id="services" className="px-6 md:px-16 py-24 bg-[#F8F5F0]">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end mb-16">
        <div>
          <Reveal><Tag>(dịch vụ)</Tag></Reveal>
          <Reveal delay={100}>
            <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-light text-stone-900">
              Dịch vụ <em className="not-italic text-amber-700">dành riêng</em> cho bạn
            </h2>
          </Reveal>
        </div>
        <Reveal delay={200}>
          <p className="text-[0.9rem] text-stone-500 leading-[1.85] font-sans">
            Từ tư vấn ý tưởng đến bàn giao chìa khoá — chúng tôi đồng hành toàn diện trong mỗi dự án.
          </p>
        </Reveal>
      </div>

      {/* List */}
      <div className="flex flex-col">
        {SERVICES.map((s, i) => (
          <Reveal key={s.num} delay={i * 80}>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6 md:gap-16 py-10 border-t border-stone-200 last:border-b items-center group">
              <div>
                <p className="font-serif text-sm italic text-stone-400 mb-3">{s.num}</p>
                <h3 className="font-serif text-[1.4rem] font-light text-stone-900 mb-3 group-hover:text-amber-700 transition-colors duration-300">
                  {s.title}
                </h3>
                <p className="text-[0.87rem] text-stone-500 leading-[1.75] max-w-[440px] mb-4 font-sans">{s.desc}</p>
                <BtnArrow href="#contact">Đặt dịch vụ</BtnArrow>
              </div>
              <div className="overflow-hidden">
                <img
                  src={s.img}
                  alt={s.title}
                  className="w-full aspect-[4/3] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── Testimonials ── */
function Testimonials() {
  const [cur, setCur] = useState(0);
  const next = useCallback(() => setCur((c) => (c + 1) % TESTIMONIALS.length), []);
  const prev = useCallback(() => setCur((c) => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length), []);

  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next]);

  const t = TESTIMONIALS[cur];

  return (
    <section id="testimonials" className="bg-stone-900 px-6 md:px-16 py-24 overflow-hidden">
      <p className="text-[0.62rem] tracking-[0.22em] uppercase text-stone-500 mb-8 font-sans">(đánh giá)</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div>
          <p className="font-serif text-5xl italic text-stone-600 leading-none mb-6">"</p>
          <blockquote
            key={cur}
            className="font-serif text-[clamp(1.2rem,2.2vw,1.8rem)] font-light italic leading-[1.55] text-stone-100 mb-8 transition-all duration-500"
          >
            {t.text}
          </blockquote>
          <p className="font-serif text-amber-500 text-base mb-1">{t.name}</p>
          <p className="text-[0.65rem] tracking-[0.14em] uppercase text-stone-500 font-sans mb-8">{t.role}</p>

          {/* Avatars */}
          <div className="flex gap-3 mb-8">
            {TESTIMONIALS.map((tt, i) => (
              <button
                key={i}
                onClick={() => setCur(i)}
                className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all duration-300 ${
                  i === cur ? "border-amber-500" : "border-transparent"
                }`}
              >
                <img src={tt.img} alt={tt.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Arrows */}
          <div className="flex gap-3">
            {[["‹", prev], ["›", next]].map(([label, fn]) => (
              <button
                key={label}
                onClick={fn}
                className="w-10 h-10 border border-stone-700 text-stone-400 hover:border-amber-500 hover:text-amber-500 transition-all duration-300 flex items-center justify-center text-lg"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right image */}
        <div className="hidden md:block overflow-hidden aspect-[4/3]">
          <img
            key={t.bg}
            src={t.bg}
            alt=""
            className="w-full h-full object-cover transition-all duration-700"
          />
        </div>
      </div>
    </section>
  );
}

/* ── Philosophy ── */
function Philosophy() {
  return (
    <section id="philosophy" className="px-6 md:px-16 py-24 bg-white">
      <div className="text-center max-w-xl mx-auto mb-16">
        <Reveal><Tag>(triết lý)</Tag></Reveal>
        <Reveal delay={100}>
          <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-light text-stone-900">
            Triết lý thiết kế <em className="not-italic text-amber-700">của chúng tôi</em>
          </h2>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0.5">
        {PHILOSOPHY.map((p, i) => (
          <Reveal key={p.title} delay={i * 100}>
            <div className="relative overflow-hidden aspect-[3/4] group cursor-default">
              <img
                src={p.img}
                alt={p.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />
              {/* Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/85 via-transparent to-transparent group-hover:from-stone-900/90 group-hover:via-stone-900/20 transition-all duration-400" />
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <p className="text-[0.6rem] tracking-[0.2em] uppercase text-amber-400 mb-2 font-sans">{p.kicker}</p>
                <h3 className="font-serif text-[1.35rem] font-light text-stone-100 mb-2">{p.title}</h3>
                <p className="text-[0.78rem] text-stone-300/70 leading-[1.65] font-sans max-h-0 group-hover:max-h-24 overflow-hidden transition-all duration-400">
                  {p.desc}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── Team ── */
function Team() {
  return (
    <section id="team" className="px-6 md:px-16 py-24 bg-[#F8F5F0]">
      <div className="mb-14">
        <Reveal><Tag>(đội ngũ)</Tag></Reveal>
        <Reveal delay={100}>
          <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-light text-stone-900">
            Những người <em className="not-italic text-amber-700">tạo nên</em> DQH
          </h2>
        </Reveal>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
        {TEAM.map((m, i) => (
          <Reveal key={m.name} delay={i * 80}>
            <div className="group">
              <div className="overflow-hidden aspect-[3/4] mb-5">
                <img
                  src={m.img}
                  alt={m.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="font-serif text-[1.1rem] text-stone-900 mb-1">{m.name}</h3>
              <p className="text-[0.62rem] tracking-[0.14em] uppercase text-amber-700 mb-2 font-sans">{m.role}</p>
              <p className="text-[0.78rem] text-stone-500 leading-[1.65] font-sans">{m.bio}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── FAQ ── */
function FAQ() {
  const [open, setOpen] = useState(null);
  const toggle = (i) => setOpen((c) => (c === i ? null : i));

  return (
    <section id="faq" className="px-6 md:px-16 py-24 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">
        <div>
          <Reveal><Tag>(faq)</Tag></Reveal>
          <Reveal delay={100}>
            <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-light text-stone-900 mb-10">
              Câu hỏi <em className="not-italic text-amber-700">thường gặp</em>
            </h2>
          </Reveal>

          <div className="flex flex-col">
            {FAQS.map((f, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="border-t border-stone-200 last:border-b overflow-hidden">
                  <button
                    onClick={() => toggle(i)}
                    className="w-full text-left flex justify-between items-center py-5 font-serif text-[1.02rem] font-light text-stone-900 hover:text-amber-700 transition-colors duration-300"
                  >
                    {f.q}
                    <span className={`text-stone-400 text-xl ml-5 flex-shrink-0 transition-transform duration-300 font-sans ${open === i ? "rotate-45 text-amber-700" : ""}`}>
                      +
                    </span>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-400 ease-out"
                    style={{ maxHeight: open === i ? "200px" : "0px" }}
                  >
                    <p className="text-[0.88rem] text-stone-500 leading-[1.8] pb-5 font-sans">{f.a}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Sticky image */}
        <Reveal direction="left">
          <div className="hidden md:block aspect-[3/4] overflow-hidden sticky top-24">
            <img
              src="https://images.unsplash.com/photo-1615529182904-14819c35db37?w=900&q=80"
              alt="FAQ"
              className="w-full h-full object-cover"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Contact ── */
function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", type: "", message: "" });
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("✅ Cảm ơn bạn đã liên hệ!\nDQH sẽ phản hồi trong vòng 2 giờ làm việc.");
  };

  const inputCls = "w-full bg-transparent border-0 border-b border-stone-200 pb-2 pt-1 text-[0.92rem] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors duration-300 font-sans";
  const labelCls = "block text-[0.6rem] tracking-[0.16em] uppercase text-stone-400 mb-2 font-sans";

  return (
    <section id="contact" className="px-6 md:px-16 py-24 bg-[#F8F5F0]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">
        {/* Left — info */}
        <div>
          <Reveal><Tag>(liên hệ)</Tag></Reveal>
          <Reveal delay={100}>
            <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-light text-stone-900 mb-12">
              Kết nối
              <br />
              <em className="not-italic text-amber-700">với chúng tôi</em>
            </h2>
          </Reveal>

          <div className="flex flex-col gap-8">
            {[
              { label: "Địa chỉ", val: "123 Nguyễn Văn Linh, Quận 7, TP.HCM", href: "#" },
              { label: "Email", val: "info@dqh.vn", href: "mailto:info@dqh.vn" },
              { label: "Điện thoại", val: "0900 000 000", href: "tel:0900000000" },
              { label: "Giờ làm việc", val: "Thứ 2 – Thứ 7, 8:00 – 17:30", href: null },
            ].map((c, i) => (
              <Reveal key={c.label} delay={100 + i * 60}>
                <div>
                  <p className={labelCls}>{c.label}</p>
                  {c.href ? (
                    <a href={c.href} className="font-serif text-[1.02rem] text-stone-900 hover:text-amber-700 transition-colors duration-300">{c.val}</a>
                  ) : (
                    <p className="font-serif text-[1.02rem] text-stone-900">{c.val}</p>
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={400}>
            <div className="mt-10 overflow-hidden aspect-[4/3]">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80"
                alt="DQH Office"
                className="w-full h-full object-cover"
              />
            </div>
          </Reveal>
        </div>

        {/* Right — form */}
        <Reveal delay={150}>
          <form onSubmit={handleSubmit} className="pt-2 flex flex-col gap-6">
            <div>
              <label className={labelCls}>Họ và tên</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Nguyễn Văn A" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Số điện thoại</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="0900 000 000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Loại dự án</label>
              <input name="type" value={form.type} onChange={handleChange} placeholder="Nhà phố / Biệt thự / Căn hộ / Văn phòng…" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Lời nhắn</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Chia sẻ với chúng tôi về không gian và kỳ vọng của bạn…"
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </div>
            <button
              type="submit"
              className="mt-2 self-start text-xs tracking-[0.12em] uppercase text-stone-50 bg-stone-900 px-10 py-3.5 hover:bg-amber-700 transition-colors duration-300 font-sans"
            >
              Gửi yêu cầu tư vấn
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Footer ── */
function Footer() {
  return (
    <footer className="bg-stone-900 px-6 md:px-16 py-10 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-stone-800">
      <p className="font-serif text-lg font-light tracking-wide text-stone-200">DQH</p>
      <p className="text-[0.62rem] tracking-[0.1em] uppercase text-stone-500 font-sans">
        © 2025 DQH Architecture & Interior. All rights reserved.
      </p>
      <div className="flex gap-7">
        {["Instagram", "Facebook", "Behance"].map((l) => (
          <a key={l} href="#" className="text-[0.62rem] tracking-[0.12em] uppercase text-stone-500 hover:text-amber-500 transition-colors duration-300 font-sans">
            {l}
          </a>
        ))}
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function PortfolioLanding() {
  const { token } = useParams<{ token: string }>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [error, setError] = useState('');
  const [pin, setPin] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (token) fetchPortfolio();
  }, [token]);

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
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F5F0] text-stone-900 font-sans">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F5F0] text-stone-900 font-sans px-4 text-center">
        <h1 className="font-serif text-3xl mb-4">Oops!</h1>
        <p className="text-stone-500">{error}</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F5F0] text-stone-900 font-sans px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-center">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="font-serif text-2xl mb-2 text-stone-900">{portfolio?.title}</h2>
          <p className="text-sm text-stone-500 mb-8">Vui lòng nhập Mã PIN để xem Hồ sơ năng lực này.</p>
          
          <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
            <input 
              type="password" 
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Nhập mã PIN"
              className="w-full text-center tracking-widest bg-stone-50 border border-stone-200 px-4 py-3 rounded-lg focus:outline-none focus:border-stone-900 transition-colors font-mono"
              autoFocus
            />
            <button type="submit" className="w-full text-xs tracking-[0.12em] uppercase text-stone-50 bg-stone-900 px-8 py-3.5 hover:bg-amber-700 transition-colors duration-300 rounded-lg">
              Xác nhận
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased bg-[#F8F5F0] text-stone-900">
      <Navbar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <Hero />
      <Marquee />
      <Works />
      <About />
      <Services />
      <Testimonials />
      <Philosophy />
      <Team />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}
