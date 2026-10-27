import { createContext, useContext, useEffect, useRef, useState } from 'react';

// true chỉ khi người xem đang đăng nhập với quyền chỉnh sửa landing page
// (Admin/Marketing) — dùng để: (1) hiện thanh công cụ "Xem trước/Chia sẻ",
// (2) hiện nhãn đỏ [cần điền] của NeedsInput. Khách công khai ở /p luôn thấy
// false nên không bao giờ lộ nhãn debug hay thanh biên tập ra trang thật.
export const LandingAdminContext = createContext(false);
export const useLandingAdmin = () => useContext(LandingAdminContext);

// Dùng chung cho mọi section mới (phần 1-6) lẫn PortfolioLanding.tsx — giữ
// đúng bảng màu/hiệu ứng fade-in đã có từ bản cũ để đồng bộ thương hiệu.
// 2 token chữ dùng chung cho mọi khối "nhãn nhỏ + giá trị" (Chi phí, Quy
// trình, Công ty...) — trước đây mỗi nơi tự chọn 1 cỡ/tracking riêng (10px
// vs 11px, tracking 0.14em vs 0.16em vs 0.2em...) khiến các thẻ cạnh nhau
// nhìn không đồng bộ dù cùng vai trò hiển thị.
export const LABEL_CLS = 'text-[10px] tracking-[0.16em] uppercase text-[#8A8070] font-semibold';
export const VALUE_CLS = 'text-sm text-[#2C2920] leading-snug';

export const COLORS = {
  cream: '#F5F2EC',
  warmWhite: '#F8F5F0',
  charcoal: '#1A1814',
  textDark: '#2C2920',
  stone: '#8A8070',
  stoneLight: '#C4C0B8',
  gold: '#B8913A',
  goldLight: '#D4BC95',
  border: 'rgba(44,41,32,0.10)',
};

export function useReveal(threshold = 0.12) {
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

export function Reveal({ children, delay = 0, threshold = 0.12 }: { children: React.ReactNode; delay?: number; threshold?: number }) {
  const [ref, visible] = useReveal(threshold);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 1000ms cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}ms, transform 1000ms cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Dùng riêng cho nội dung LUÔN hiện ngay khi tải trang (vd hero — đã nằm
// trong viewport đầu tiên, không cần chờ IntersectionObserver). Khác Reveal:
// không bắt đầu từ "gần như vô hình" (opacity 0 + dịch chuyển 24px) mà từ
// opacity 0.4 tại chỗ, rõ dần trong ≤350ms — tránh cảm giác chữ "biến mất"
// lúc mới vào trang. Tôn trọng prefers-reduced-motion: hiện ngay, không animate.
export function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (reduced) return <>{children}</>;
  return (
    <div style={{ opacity: visible ? 1 : 0.4, transition: 'opacity 350ms ease-out' }}>
      {children}
    </div>
  );
}

// Tiêu đề section dùng lại ở cả 6 phần: dòng eyebrow nhỏ + heading 2 dòng,
// dòng 2 in nghiêng màu vàng đồng — đúng pattern "(NĂNG LỰC THIẾT KẾ)" /
// "Thiết kế có gu & Công trình thành công" của bản cũ. Cỡ chữ/độ đậm/khoảng
// cách tiết chế lại (font-semibold thay vì bold, mb ngắn hơn) cho đúng tinh
// thần "quiet luxury" — tránh tiêu đề quá to/đậm/chiếm nhiều khoảng trống
// trên mobile. `action` để gắn thêm 1 control (vd SegmentedToggle) cùng hàng
// với tiêu đề trên desktop, tự rớt xuống dưới trên mobile.
export function SectionHeader({
  eyebrow,
  title,
  accent,
  caption,
  center,
  dark,
  action,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  /** dòng chú thích nhỏ dưới tiêu đề, vd giải thích ký hiệu DQH/JUX. */
  caption?: string;
  center?: boolean;
  /** true khi section nền tối (vd bg-[#1A1814]) — đổi màu chữ chính sang sáng để đủ tương phản. */
  dark?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className={`mb-8 md:mb-12 flex flex-wrap items-end gap-x-8 gap-y-5 ${center ? 'justify-center text-center' : 'justify-between'}`}>
      <div>
        <p className="text-[11px] tracking-[0.22em] uppercase text-[#8A8070] mb-3 font-medium">{eyebrow}</p>
        <h2 className={`font-sans font-semibold text-[32px] sm:text-4xl md:text-[44px] tracking-tight leading-[1.1] ${dark ? 'text-[#F5F2EC]' : 'text-[#2C2920]'}`}>
          {title}
          {/* font-normal (không dùng font-light) — chữ nghiêng mảnh quá dễ làm
              mất dấu tiếng Việt, nhất là ở cỡ nhỏ trên mobile. */}
          {accent && <><br /><span className="font-serif italic font-normal text-[#B8913A]">{accent}</span></>}
        </h2>
        {caption && <p className={`text-xs mt-3 ${dark ? 'text-white/50' : 'text-[#8A8070]'}`}>{caption}</p>}
      </div>
      {action}
    </div>
  );
}

// Hàng nút chuyển (segmented control) dùng chung cho Chi phí & Quy trình —
// cùng hàng với tiêu đề section, bên phải. aria-pressed cho a11y.
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex gap-1 p-1 border border-[#2C2920]/15 rounded-sm bg-white shrink-0 max-w-full overflow-x-auto">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`min-h-[44px] px-3 sm:px-5 text-[11px] sm:text-xs font-semibold tracking-[0.1em] uppercase rounded-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            value === opt.value ? 'bg-[#1A1814] text-[#F8F5F0]' : 'bg-transparent text-[#2C2920] hover:bg-[#F5F2EC]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// Nhãn [cần điền] hiện trực tiếp trên UI cho mọi chỗ còn thiếu dữ liệu thật
// (giá, ảnh, tên người, đơn giá/m2...) — dễ thấy khi preview, dễ tìm (Ctrl+F
// "cần điền") khi điền nội dung thật sau này, không lẫn với placeholder mờ
// kiểu "..." dễ bị bỏ sót.
// Chỉ hiện nhãn đỏ debug này với người có quyền chỉnh sửa (xem
// LandingAdminContext) — khách xem trang công khai sẽ không render gì cả
// (block cha tự ẩn theo, không để lộ "[cần điền: ...]" lên trang thật).
export function NeedsInput({ label }: { label: string }) {
  const isAdmin = useLandingAdmin();
  if (!isAdmin) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-rose-600 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5">
      [cần điền: {label}]
    </span>
  );
}
