import { useState, useRef, useEffect, ChangeEvent, useMemo } from 'react';
import { X, Camera, Upload, Image as ImageIcon, ArrowRight, Mic, MicOff, CheckCircle2, Plus, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MarkerNote } from '../types';

// --- Hằng số cho chip chọn ---
const CATEGORY_CHIPS = ['Nội thất', 'Kết cấu', 'MEP', 'Ốp lát', 'Hoàn thiện', 'Trần & Đèn'] as const;

const SEVERITY_CHIPS = [
  { label: 'Nhẹ', value: 'low' as const, color: 'emerald' },
  { label: 'Cần sửa', value: 'medium' as const, color: 'amber' },
  { label: 'Nghiêm trọng', value: 'critical' as const, color: 'rose' },
] as const;

const LS_RECENT_LOCATIONS = 'dqh_recent_locations';

// --- Helpers ---
function generateAutoTitle(category: string, location: string): string {
  const parts: string[] = [];
  if (category) parts.push(category);
  if (location) parts.push(location);
  return parts.length > 0 ? parts.join(' — ') : 'Sự cố mới';
}

function getRecentLocations(): string[] {
  try {
    const raw = localStorage.getItem(LS_RECENT_LOCATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentLocation(location: string) {
  if (!location.trim()) return;
  const trimmed = location.trim();
  const existing = getRecentLocations().filter(l => l !== trimmed);
  const updated = [trimmed, ...existing].slice(0, 10);
  localStorage.setItem(LS_RECENT_LOCATIONS, JSON.stringify(updated));
}

// --- Props ---
interface GlobalCaptureModalProps {
  onCaptureComplete: (draft: Partial<MarkerNote>) => void;
  onClose: () => void;
  defaultProjectName?: string;
}

export default function GlobalCaptureModal({ onCaptureComplete, onClose, defaultProjectName }: GlobalCaptureModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Camera & Multi-photo states
  const [errorText, setErrorText] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [useWebcam, setUseWebcam] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Step 2: Form states (chip-based)
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'critical' | ''>('');
  const [location, setLocation] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const recentLocations = useMemo(() => getRecentLocations(), []);

  // Auto-title dựa trên category + location
  const autoTitle = useMemo(() => generateAutoTitle(category, location), [category, location]);
  const displayTitle = customTitle || autoTitle;

  useEffect(() => {
    return () => stopWebcam();
  }, [cameraStream]);

  // --- Camera logic (giữ nguyên) ---
  async function startWebcam() {
    try {
      setErrorText(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setUseWebcam(true);
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.error(err));
        }
      }, 100);
    } catch (err: any) {
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        setErrorText("Không thể kết nối camera.");
      }
    }
  }

  function stopWebcam() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setUseWebcam(false);
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotos(prev => [...prev, dataUrl]);
      stopWebcam();
    }
  }

  async function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setErrorText('Vui lòng chọn hình ảnh!');
      return;
    }
    setErrorText(null);
    try {
      const { compressImage } = await import('../utils/pdfUtils');
      const dataUrl = await compressImage(file);
      setPhotos(prev => [...prev, dataUrl]);
    } catch (e) {
      setErrorText('Lỗi đọc ảnh.');
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input để có thể chọn lại cùng file
    if (e.target) e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // --- Speech To Text (Đọc lỗi) ---
  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Tương thích iOS
    recognition.interimResults = true;
    recognition.lang = 'vi-VN';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscription(prev => {
          const separator = prev.trim() ? '. ' : '';
          let updatedText = prev + separator + finalTranscript.trim();
          return updatedText.charAt(0).toUpperCase() + updatedText.slice(1);
        });
      }
    };

    recognition.onend = () => {
      if (isRecordingRef.current) {
        setTimeout(() => {
          if (isRecordingRef.current) {
            try { recognition.start(); } catch (e) { console.log('restart failed', e); }
          }
        }, 300);
      } else {
        setIsRecording(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
      isRecordingRef.current = true;
    } catch (e) {
      console.error(e);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
  };

  // --- Lưu & hoàn thành ---
  const handleFinish = () => {
    // Lưu vị trí gần đây vào localStorage
    saveRecentLocation(location);

    // Tạo photoData: JSON array nếu nhiều ảnh, string đơn nếu 1 ảnh
    let photoData: string | null = null;
    if (photos.length > 1) {
      photoData = JSON.stringify(photos);
    } else if (photos.length === 1) {
      photoData = photos[0];
    }

    // Map severity chip sang MarkerNote severity
    const severityMap: Record<string, MarkerNote['severity']> = {
      low: 'low',
      medium: 'medium',
      critical: 'critical',
    };

    // Tạo tags array
    const tags: string[] = ['Chưa sửa'];
    if (category) tags.push(category);

    onCaptureComplete({
      photoData,
      title: displayTitle,
      textNotes: transcription,
      audioData: null,
      severity: severity ? severityMap[severity] : undefined,
      tags,
      createdAt: Date.now(),
      // Truyền location cho App.tsx auto-title (accessed via (draft as any).location)
      ...(location ? { location: location.trim() } : {}),
    } as any);
  };

  // --- Drag/Drop handler ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // --- Nút chụp thêm ảnh ---
  const handleAddMore = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && cameraInputRef.current) {
      cameraInputRef.current.click();
    } else {
      startWebcam();
    }
  };

  // --- Severity chip styles ---
  const getSeverityChipStyle = (chip: typeof SEVERITY_CHIPS[number], isActive: boolean) => {
    if (!isActive) return 'bg-slate-800/60 text-slate-400 border-slate-700';
    switch (chip.color) {
      case 'emerald': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
      case 'amber': return 'bg-amber-500/20 text-amber-400 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]';
      case 'rose': return 'bg-rose-500/20 text-rose-400 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.2)]';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f1222] border border-indigo-500/50 text-slate-100 rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[95dvh]"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#151930] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-black text-slate-100 text-sm tracking-wide uppercase">Báo Cáo Lỗi Nhanh</h3>
              {defaultProjectName && (
                <p className="text-[10px] text-slate-500 mt-0.5">{defaultProjectName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Step indicator */}
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? 'bg-indigo-400' : 'bg-indigo-400/30'}`} />
              <div className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? 'bg-indigo-400' : 'bg-indigo-400/30'}`} />
            </div>
            <button onClick={() => { stopWebcam(); onClose(); }} className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                {errorText && <div className="text-rose-400 text-xs p-3 bg-rose-500/10 rounded-xl">{errorText}</div>}

                {/* Webcam đang bật */}
                {useWebcam ? (
                  <div className="flex flex-col gap-3">
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-black">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={stopWebcam} className="px-4 py-2.5 bg-slate-800 rounded-xl text-xs font-bold w-1/3">Hủy</button>
                      <button onClick={capturePhoto} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold flex items-center justify-center gap-2">
                        <Camera className="w-4 h-4" /> CHỤP NGAY
                      </button>
                    </div>
                  </div>
                ) : photos.length > 0 ? (
                  /* Đã có ảnh — hiển thị thumbnails + nút chụp thêm */
                  <div className="flex flex-col gap-3">
                    {/* Photo grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {photos.map((photo, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-700 group">
                          <img src={photo} className="w-full h-full object-cover" alt={`Ảnh ${i + 1}`} />
                          <button
                            onClick={() => removePhoto(i)}
                            className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3.5 h-3.5 text-white" />
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black/60 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-md">
                            {i + 1}
                          </div>
                        </div>
                      ))}
                      {/* Nút chụp thêm */}
                      <button
                        onClick={handleAddMore}
                        className="aspect-square rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-1 hover:border-indigo-500 transition-colors text-slate-500 hover:text-indigo-400"
                      >
                        <Plus className="w-5 h-5" />
                        <span className="text-[10px] font-bold">Thêm</span>
                      </button>
                    </div>

                    {/* Nút tiếp tục */}
                    <button
                      onClick={() => setStep(2)}
                      className="w-full py-3 bg-emerald-500 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 text-sm"
                    >
                      Tiếp tục
                      <span className="bg-emerald-600 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {photos.length} ảnh
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* Chưa có ảnh — hiện các nút chụp/chọn + drag zone */
                  <div
                    className={`flex flex-col gap-3 ${isDragOver ? 'ring-2 ring-indigo-500 rounded-2xl' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <button onClick={() => {
                      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                      if (isMobile && cameraInputRef.current) {
                        cameraInputRef.current.click();
                      } else {
                        startWebcam();
                      }
                    }} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-2 hover:border-indigo-500 transition-colors">
                      <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center"><Camera className="w-6 h-6" /></div>
                      <span className="font-bold">Mở Camera Điện Thoại</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-2 hover:border-emerald-500 transition-colors">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center"><ImageIcon className="w-6 h-6" /></div>
                      <span className="font-bold">Chọn Ảnh Từ Thư Viện</span>
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* ========== STEP 2: Form chip-based ========== */
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-5">

                {/* Ảnh thumbnails nhỏ + nút quay lại */}
                <div className="flex items-center gap-2">
                  <button onClick={() => setStep(1)} className="shrink-0 text-xs text-indigo-400 font-bold px-2 py-1 hover:bg-slate-800 rounded-lg">
                    ← Ảnh
                  </button>
                  <div className="flex gap-1.5 overflow-x-auto flex-1">
                    {photos.map((photo, i) => (
                      <img key={i} src={photo} className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0" alt={`Ảnh ${i + 1}`} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 shrink-0">{photos.length} ảnh</span>
                </div>

                {/* Hạng mục chips */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hạng mục</span>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_CHIPS.map(chip => (
                      <button
                        key={chip}
                        onClick={() => setCategory(prev => prev === chip ? '' : chip)}
                        className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all ${
                          category === chip
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                            : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mức độ chips */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mức độ</span>
                  <div className="flex gap-2">
                    {SEVERITY_CHIPS.map(chip => {
                      const isActive = severity === chip.value;
                      return (
                        <button
                          key={chip.value}
                          onClick={() => setSeverity(prev => prev === chip.value ? '' : chip.value)}
                          className={`flex-1 py-2.5 rounded-full text-xs font-bold border transition-all ${getSeverityChipStyle(chip, isActive)}`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vị trí input với datalist */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vị trí</span>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      list="recent-locations"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="VD: Tầng 2 · Phòng ngủ"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <datalist id="recent-locations">
                      {recentLocations.map((loc, i) => (
                        <option key={i} value={loc} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Auto-title preview */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tiêu đề tự động</span>
                  {isEditingTitle ? (
                    <input
                      type="text"
                      value={customTitle}
                      onChange={e => setCustomTitle(e.target.value)}
                      onBlur={() => { if (!customTitle.trim()) setIsEditingTitle(false); }}
                      autoFocus
                      placeholder={autoTitle}
                      className="w-full bg-slate-900 border border-indigo-500 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-200 hover:border-slate-600 transition-colors flex items-center justify-between"
                    >
                      <span className="truncate">{displayTitle}</span>
                      <span className="text-[10px] text-indigo-400 font-bold shrink-0 ml-2">Sửa</span>
                    </button>
                  )}
                </div>

                {/* Đọc lỗi (Speech To Text) */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đọc lỗi (Chuyển giọng nói thành văn bản)</span>
                  
                  {transcription && (
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-300 relative">
                      {transcription}
                      <button 
                        onClick={() => setTranscription('')}
                        className="absolute top-2 right-2 p-1 bg-slate-800 rounded text-rose-400 hover:bg-slate-700"
                        title="Xóa nội dung"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {isRecording ? <><MicOff className="w-4 h-4" /> ĐANG NGHE... BẤM ĐỂ DỪNG</> : <><Mic className="w-4 h-4" /> Bấm để đọc lỗi</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky save button — chỉ hiện ở step 2 */}
        {step === 2 && (
          <div className="px-5 pb-5 pt-3 border-t border-slate-800/50 bg-[#0f1222] shrink-0">
            <button
              onClick={handleFinish}
              disabled={photos.length === 0}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 font-black rounded-xl text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all text-sm"
            >
              LƯU & CHỌN BẢN VẼ ĐỂ GHIM
            </button>
          </div>
        )}

        {/* Hidden inputs */}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </div>
  );
}
