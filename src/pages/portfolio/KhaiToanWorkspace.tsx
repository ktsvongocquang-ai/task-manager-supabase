import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

// Workspace toàn màn hình (mobile) / gần toàn màn hình tối đa 1500px (desktop)
// cho công cụ khái toán. Công cụ sống ở public/khai-toan/ (HTML/CSS/JS độc lập,
// app.js tự ghi đè document.body) — PHẢI nhúng qua iframe để cô lập CSS/DOM,
// không import thẳng vào cây React. Iframe chỉ mount khi open=true (lazy-load).
export function KhaiToanWorkspace({ open, onClose }: Props) {
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    scrollYRef.current = window.scrollY;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      window.scrollTo(0, scrollYRef.current);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-[#1A1814]/70 backdrop-blur-sm flex items-center justify-center p-0 md:p-6">
      <div className="w-full h-full md:h-[92vh] md:max-w-[1500px] bg-[#F8F5F0] md:rounded-lg shadow-2xl flex flex-col overflow-hidden">
        <header className="shrink-0 flex items-center justify-between px-5 md:px-8 py-4 bg-[#1A1814] text-white">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-serif text-lg font-semibold tracking-wide shrink-0">
              DQH <span className="italic font-light text-[#B8913A]">Signature</span>
            </span>
            <span className="hidden sm:inline text-white/30">|</span>
            <span className="hidden sm:block text-xs uppercase tracking-[0.12em] text-white/70 truncate">
              Khái toán nội thất &amp; tiến độ
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#B8913A] flex items-center justify-center text-lg font-light transition-colors cursor-pointer shrink-0"
          >
            &times;
          </button>
        </header>
        <div className="flex-1 min-h-0">
          <iframe
            src="/khai-toan/index.html?embed=1"
            title="Khái toán nội thất & tiến độ"
            className="w-full h-full border-0 block"
          />
        </div>
      </div>
    </div>
  );
}
