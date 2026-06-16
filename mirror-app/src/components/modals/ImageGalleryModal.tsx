import { useState, useRef, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageGalleryModalProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ImageGalleryModal({ images, initialIndex = 0, onClose }: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const lastPinchDistance = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!images || images.length === 0) return null;

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    resetZoom();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    resetZoom();
  };

  // Zoom with buttons
  const zoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(s => Math.min(s * 1.5, 5));
  };

  const zoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newScale = Math.max(scale / 1.5, 1);
    setScale(newScale);
    if (newScale <= 1) setTranslate({ x: 0, y: 0 });
  };

  // Double-tap to zoom
  const lastTap = useRef(0);
  const handleImageClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double-tap
      if (scale > 1) {
        resetZoom();
      } else {
        setScale(2.5);
      }
    }
    lastTap.current = now;
  };

  // Pinch-to-zoom (touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistance.current = Math.hypot(dx, dy);
    } else if (e.touches.length === 1 && scale > 1) {
      // Panning when zoomed
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      translateStart.current = { ...translate };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistance.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.hypot(dx, dy);
      const ratio = distance / lastPinchDistance.current;
      lastPinchDistance.current = distance;
      setScale(s => Math.max(1, Math.min(s * ratio, 5)));
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      setTranslate({
        x: translateStart.current.x + dx,
        y: translateStart.current.y + dy
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    lastPinchDistance.current = null;
    setIsDragging(false);
    // If scale went below 1, snap back
    if (scale < 1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  };

  // Mouse wheel zoom (desktop)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(s => {
        const newScale = Math.max(1, Math.min(s * delta, 5));
        if (newScale <= 1) setTranslate({ x: 0, y: 0 });
        return newScale;
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Mouse drag for desktop panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    translateStart.current = { ...translate };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTranslate({
      x: translateStart.current.x + dx,
      y: translateStart.current.y + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md" onClick={() => scale <= 1 && onClose()}>
      
      {/* Top toolbar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent z-50">
        <div className="flex items-center gap-2">
          <span className="text-white/70 text-xs font-bold">
            {currentIndex + 1} / {images.length}
          </span>
          {scale > 1 && (
            <span className="text-emerald-400 text-[10px] font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full">
              {Math.round(scale * 100)}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={zoomIn}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            title="Phóng to"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          {scale > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); resetZoom(); }}
              className="p-2 text-amber-400/80 hover:text-amber-300 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              title="Về kích thước gốc"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer ml-1"
            title="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden select-none"
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        onClick={handleImageClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={images[currentIndex]}
          alt={`Ảnh ${currentIndex + 1}`}
          className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg select-none pointer-events-none"
          style={{
            transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          draggable={false}
        />
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-50 p-2.5 rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all backdrop-blur-sm cursor-pointer border border-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-50 p-2.5 rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all backdrop-blur-sm cursor-pointer border border-white/10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md z-50 border border-white/10">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); resetZoom(); }}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? 'bg-white scale-125 shadow-lg' : 'bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Zoom hint — first-time */}
      {scale <= 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-white/40 text-[10px] font-medium z-50 pointer-events-none">
          Chạm 2 lần hoặc chụm ngón để phóng to
        </div>
      )}
    </div>
  );
}
