import { useEffect, useRef, useState } from 'react';

// Dùng chung cho mọi section mới (phần 1-6) lẫn PortfolioLanding.tsx — giữ
// đúng bảng màu/hiệu ứng fade-in đã có từ bản cũ để đồng bộ thương hiệu.
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

// Tiêu đề section dùng lại ở cả 6 phần: dòng eyebrow nhỏ + heading 2 dòng,
// dòng 2 in nghiêng màu vàng đồng — đúng pattern "(NĂNG LỰC THIẾT KẾ)" /
// "Thiết kế có gu & Công trình thành công" của bản cũ.
export function SectionHeader({
  eyebrow,
  title,
  accent,
  center,
  dark,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  center?: boolean;
  /** true khi section nền tối (vd bg-[#1A1814]) — đổi màu chữ chính sang sáng để đủ tương phản. */
  dark?: boolean;
}) {
  return (
    <div className={`mb-16 md:mb-24 ${center ? 'text-center' : ''}`}>
      <p className="text-xs tracking-[0.22em] uppercase text-[#8A8070] mb-4">{eyebrow}</p>
      <h2 className={`font-sans font-bold text-4xl md:text-5xl tracking-tight leading-[1.1] ${dark ? 'text-[#F5F2EC]' : 'text-[#2C2920]'}`}>
        {title}
        {accent && <><br /><span className="font-serif italic font-light text-[#B8913A]">{accent}</span></>}
      </h2>
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
    <div role="group" aria-label={ariaLabel} className="flex gap-1 p-1 border border-[#2C2920]/15 rounded-sm bg-white shrink-0">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`min-h-[44px] px-4 sm:px-5 text-[11px] sm:text-xs font-semibold tracking-[0.1em] uppercase rounded-sm transition-colors cursor-pointer ${
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
export function NeedsInput({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-rose-600 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5">
      [cần điền: {label}]
    </span>
  );
}
