import { useRef, useState } from 'react';

interface Props {
  before: string;
  after: string;
  alt: string;
  onOpen?: () => void;
}

// NV5.3 — kéo bằng tay (Pointer Events hoạt động cho cả chuột lẫn chạm), ảnh tỷ lệ 4:5
export function BeforeAfterSlider({ before, after, alt, onOpen }: Props) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateFromClientX = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/5] overflow-hidden rounded-lp select-none touch-none cursor-ew-resize bg-lp-greige"
      onPointerDown={e => {
        draggingRef.current = true;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        updateFromClientX(e.clientX);
      }}
      onPointerMove={e => {
        if (draggingRef.current) updateFromClientX(e.clientX);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
      onPointerLeave={() => {
        draggingRef.current = false;
      }}
      onClick={onOpen}
    >
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${after})` }} aria-label={alt} role="img" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${before})` }} />
      </div>
      <div className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-lp-espresso text-xs shadow-sm">
          ⇔
        </div>
      </div>
      <span className="absolute bottom-2 left-2 text-[10px] uppercase tracking-wide bg-black/50 text-white px-2 py-1 rounded-lp pointer-events-none">
        Trước
      </span>
      <span className="absolute bottom-2 right-2 text-[10px] uppercase tracking-wide bg-black/50 text-white px-2 py-1 rounded-lp pointer-events-none">
        Sau
      </span>
    </div>
  );
}
