import React, { useRef, useState, useEffect } from 'react';
import { MarkerNote } from '../types';
import { X, Mic, MicOff, Camera, Trash2, ZoomIn } from 'lucide-react';
import ImageGalleryModal from './modals/ImageGalleryModal';

interface MarkerDetailModalProps {
  marker: MarkerNote;
  onUpdate: (id: string, updates: Partial<MarkerNote>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onTriggerCamera?: (markerId: string) => void;
  /** Số thứ tự lỗi trong danh sách dự án — dùng để tạo mã logic */
  defectIndex?: number;
}

const parseImages = (photoData: string | null): string[] => {
  if (!photoData) return [];
  try {
    const parsed = JSON.parse(photoData);
    if (Array.isArray(parsed)) return parsed;
    return [photoData];
  } catch {
    return [photoData];
  }
};

export const MarkerDetailModal: React.FC<MarkerDetailModalProps> = ({
  marker,
  onUpdate,
  onDelete,
  onClose,
  onTriggerCamera,
  defectIndex
}) => {
  const [title, setTitle] = useState(marker.title || '');
  const [description, setDescription] = useState(marker.textNotes || '');
  const [status, setStatus] = useState(marker.tags?.[0] || 'Chưa sửa');
  const [severity, setSeverity] = useState(marker.severity || 'medium');
  const [assignee, setAssignee] = useState(marker.assignee || '');
  
  // Inline Speech-to-Text
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Gallery zoom
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Keep internal state synced when marker changes
  useEffect(() => {
    setTitle(marker.title || '');
    setDescription(marker.textNotes || '');
    setStatus(marker.tags?.[0] || 'Chưa sửa');
    setSeverity(marker.severity || 'medium');
    setAssignee(marker.assignee || '');
    // Stop speech when marker changes
    stopSpeech();
  }, [marker]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => { stopSpeech(); };
  }, []);

  // ── Speech-to-Text ──────────────────────────────────────
  function toggleSpeech() {
    if (isSpeechActive) {
      stopSpeech();
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt không hỗ trợ nhận diện giọng nói. Hãy dùng Chrome hoặc Safari mới nhất.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // continuous=true lỗi trên iOS Safari. Dùng false và tự restart.
    recognition.interimResults = true;
    recognition.lang = 'vi-VN';
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        setDescription(prev => {
          const sep = prev.trim() ? '. ' : '';
          let text = prev + sep + finalTranscript.trim();
          // capitalize first letter
          text = text.charAt(0).toUpperCase() + text.slice(1);
          return text;
        });
      }
    };
    
    recognition.onerror = (event: any) => {
      console.warn('Speech error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        setIsSpeechActive(false);
        alert('Vui lòng cấp quyền Microphone cho trình duyệt!');
      }
    };
    
    recognition.onend = () => {
      // Tự động khởi động lại nếu user chưa bấm tắt
      if (recognitionRef.current) {
        setTimeout(() => {
          if (recognitionRef.current) {
            try { recognition.start(); } catch(e) { console.log('restart failed', e) }
          }
        }, 300);
      } else {
        setIsSpeechActive(false);
      }
    };
    
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsSpeechActive(true);
    } catch(e) { 
      console.error(e); 
      setIsSpeechActive(false);
    }
  }

  function stopSpeech() {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null; // xóa ref trước để onend không restart lại
      try { rec.stop(); } catch(_) {}
    }
    setIsSpeechActive(false);
  }

  // ── Mã lỗi logic ────────────────────────────────────────
  // Dùng defectIndex nếu có, fallback lấy số từ createdAt timestamp
  const defectCode = defectIndex != null
    ? String(defectIndex + 1).padStart(3, '0')
    : String(Math.floor((marker.createdAt % 10000))).padStart(4, '0');

  // Lấy hạng mục từ tags
  const categoryTag = marker.tags?.find(t =>
    ['Nội thất', 'Kết cấu', 'MEP', 'Ốp lát', 'Hoàn thiện', 'Trần & Đèn'].includes(t)
  );

  const handleSave = () => {
    stopSpeech();
    onUpdate(marker.id, {
      title,
      textNotes: description,
      tags: [status, ...(categoryTag ? [categoryTag] : [])],
      severity,
      assignee
    });
    onClose();
  };

  const images = parseImages(marker.photoData);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#2a2a2a] rounded-2xl shadow-2xl flex flex-col border border-[#3a3a3a] overflow-hidden transform transition-all animate-fade-in">
        
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#3a3a3a]">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Chi tiết lỗi</p>
            <h2 className="text-xl font-bold text-white mt-0.5 flex items-center gap-2">
              {categoryTag && (
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                  {categoryTag}
                </span>
              )}
              <span>#{defectCode}</span>
            </h2>
          </div>
          <button 
            onClick={() => { stopSpeech(); onClose(); }}
            className="p-2 -mr-2 -mt-2 text-gray-400 hover:text-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
          
          {/* Tiêu đề lỗi */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Tiêu đề lỗi *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Vd: Vách ốp bị bong tróc"
              className="w-full bg-[#1c1c1c] text-white text-sm border border-[#3a3a3a] rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div className="flex gap-4">
            {/* Trạng thái */}
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Trạng thái
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-[#1c1c1c] text-white text-sm border border-[#3a3a3a] rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none"
              >
                <option value="Chưa sửa">Chưa sửa</option>
                <option value="Đang sửa">Đang sửa</option>
                <option value="Đã sửa">Đã sửa</option>
              </select>
            </div>

            {/* Mức độ */}
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Mức độ
              </label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as any)}
                className="w-full bg-[#1c1c1c] text-white text-sm border border-[#3a3a3a] rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none"
              >
                <option value="critical">Nghiêm trọng</option>
                <option value="high">Cao</option>
                <option value="medium">Trung bình</option>
                <option value="low">Thấp</option>
              </select>
            </div>
          </div>

          {/* Chi tiết & Giao sửa + Speech-to-Text */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                Mô tả lỗi & Giao sửa
              </label>
              <button
                onClick={toggleSpeech}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  isSpeechActive
                    ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                    : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 border border-indigo-500/30'
                }`}
              >
                {isSpeechActive ? <MicOff size={12} /> : <Mic size={12} />}
                {isSpeechActive ? '⏹ Dừng' : '🎙 Đọc lỗi'}
              </button>
            </div>
            {isSpeechActive && (
              <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping shrink-0"></span>
                <span className="text-[11px] text-rose-300 font-bold">Đang nghe... Hãy nói mô tả lỗi bằng tiếng Việt</span>
              </div>
            )}
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={isSpeechActive ? 'Đang chờ giọng nói...' : 'Mô tả chi tiết lỗi, giao sửa cho ai...'}
              rows={3}
              className={`w-full bg-[#1c1c1c] text-white text-sm border rounded-xl px-3 py-2.5 focus:outline-none transition-all resize-none ${
                isSpeechActive
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/5'
                  : 'border-[#3a3a3a] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              }`}
            />
            {marker.transcription && (
              <div className="mt-2 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <p className="text-[11px] italic text-indigo-200">"{marker.transcription}"</p>
              </div>
            )}
          </div>

          {/* Camera Button */}
          <button
            onClick={() => onTriggerCamera?.(marker.id)}
            className="w-full py-3 flex items-center justify-center gap-2 border border-dashed border-[#555] rounded-xl text-gray-300 hover:text-white hover:border-gray-400 transition-colors bg-[#1c1c1c]/50"
          >
            <Camera size={16} />
            <span className="text-sm font-medium">Chụp / Thêm ảnh hiện trạng</span>
          </button>
          
          {/* Display existing photos — CLICKABLE to zoom */}
          {images.length > 0 && (
            <div className="mt-1">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {images.map((url: string, i: number) => (
                  <div
                    key={i}
                    className="relative shrink-0 cursor-pointer group"
                    onClick={() => { setGalleryIndex(i); setGalleryOpen(true); }}
                  >
                    <img
                      src={url}
                      alt={`Ảnh ${i + 1}`}
                      className="h-20 w-20 rounded-lg object-cover border border-[#444] group-hover:border-indigo-400 transition-colors"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors flex items-center justify-center">
                      <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-gray-500 mt-1">Chạm ảnh để phóng to</p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#3a3a3a] flex items-center justify-between bg-[#232323]">
          <button 
            onClick={() => { stopSpeech(); onDelete(marker.id); }}
            className="flex items-center gap-1.5 px-3 py-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors text-sm font-medium"
          >
            <Trash2 size={16} />
            Gỡ pin
          </button>
          
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 bg-white hover:bg-gray-200 text-black rounded-full text-sm font-bold shadow-lg transition-all active:scale-95"
          >
            Xong & đóng
          </button>
        </div>

      </div>

      {/* Image Gallery with Zoom */}
      {galleryOpen && (
        <ImageGalleryModal
          images={images}
          initialIndex={galleryIndex}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  );
};
