import { useSwipeable } from 'react-swipeable';

interface Props {
  images: string[];
  index: number;
  onClose: () => void;
  onChangeIndex: (next: number) => void;
}

// NV5.4 — lightbox toàn màn hình, vuốt để chuyển ảnh
export function Lightbox({ images, index, onClose, onChangeIndex }: Props) {
  const next = () => onChangeIndex((index + 1) % images.length);
  const prev = () => onChangeIndex((index - 1 + images.length) % images.length);
  const handlers = useSwipeable({ onSwipedLeft: next, onSwipedRight: prev, trackMouse: false });

  if (!images[index]) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" {...handlers}>
      <button
        onClick={onClose}
        aria-label="Đóng"
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center cursor-pointer"
      >
        ✕
      </button>
      {images.length > 1 && (
        <button
          onClick={prev}
          aria-label="Ảnh trước"
          className="absolute left-3 md:left-6 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center cursor-pointer"
        >
          ‹
        </button>
      )}
      <img src={images[index]} alt="" className="max-w-full max-h-full object-contain" />
      {images.length > 1 && (
        <button
          onClick={next}
          aria-label="Ảnh sau"
          className="absolute right-3 md:right-6 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center cursor-pointer"
        >
          ›
        </button>
      )}
    </div>
  );
}
