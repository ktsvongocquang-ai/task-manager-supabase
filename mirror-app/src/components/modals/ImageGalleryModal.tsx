import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryModalProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ImageGalleryModal({ images, initialIndex = 0, onClose }: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!images || images.length === 0) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm" onClick={onClose}>
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-slate-300 bg-slate-800/50 p-2 rounded-full transition-colors z-50 cursor-pointer"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative w-full max-w-5xl max-h-screen flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        {images.length > 1 && (
          <button 
            onClick={handlePrev}
            className="absolute left-4 z-10 p-3 rounded-full bg-slate-800/50 text-white hover:bg-slate-700/80 transition-colors backdrop-blur-md cursor-pointer"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        <img 
          src={images[currentIndex]} 
          alt={`Image ${currentIndex + 1}`} 
          className="max-h-[90vh] max-w-full object-contain rounded-xl shadow-2xl"
        />

        {images.length > 1 && (
          <button 
            onClick={handleNext}
            className="absolute right-4 z-10 p-3 rounded-full bg-slate-800/50 text-white hover:bg-slate-700/80 transition-colors backdrop-blur-md cursor-pointer"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 rounded-full bg-slate-900/50 backdrop-blur-md">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'
                } cursor-pointer`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
