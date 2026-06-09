import { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import { X, Camera, Upload, Image as ImageIcon, AlertCircle, ArrowRight, Mic, MicOff, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MarkerNote } from '../types';

interface GlobalCaptureModalProps {
  onCaptureComplete: (draft: Partial<MarkerNote>) => void;
  onClose: () => void;
}

export default function GlobalCaptureModal({ onCaptureComplete, onClose }: GlobalCaptureModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  
  // Step 1: Camera states
  const [errorText, setErrorText] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [useWebcam, setUseWebcam] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  // Step 2: Form states
  const [title, setTitle] = useState('');
  const [textNotes, setTextNotes] = useState('');
  const [audioData, setAudioData] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => stopWebcam();
  }, [cameraStream]);

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
      setPhotoData(canvas.toDataURL('image/jpeg', 0.85));
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
      setPhotoData(dataUrl);
    } catch (e) {
      setErrorText('Lỗi đọc ảnh.');
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => setAudioData(reader.result as string);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFinish = () => {
    onCaptureComplete({
      photoData,
      title: title.trim(),
      textNotes: textNotes.trim(),
      audioData,
      createdAt: Date.now()
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f1222] border border-indigo-500/50 text-slate-100 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="px-5 py-4 bg-[#151930] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            <h3 className="font-black text-slate-100 text-sm tracking-wide uppercase">Báo Cáo Lỗi Nhanh</h3>
          </div>
          <button onClick={() => { stopWebcam(); onClose(); }} className="p-1 hover:bg-slate-800 rounded-full text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                {errorText && <div className="text-rose-400 text-xs p-3 bg-rose-500/10 rounded-xl">{errorText}</div>}
                
                {useWebcam ? (
                  <div className="flex flex-col gap-3">
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-black">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={stopWebcam} className="px-4 py-2.5 bg-slate-800 rounded-xl text-xs font-bold w-1/3">Hủy</button>
                      <button onClick={capturePhoto} className="flex-1 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold flex items-center justify-center gap-2">
                        <Camera className="w-4 h-4" /> CHỤP NGAY
                      </button>
                    </div>
                  </div>
                ) : photoData ? (
                  <div className="flex flex-col gap-3">
                    <img src={photoData} className="w-full h-48 object-cover rounded-2xl border border-slate-800" />
                    <div className="flex gap-2">
                      <button onClick={() => setPhotoData(null)} className="px-4 py-2.5 bg-slate-800 rounded-xl text-xs font-bold w-1/3">Chụp lại</button>
                      <button onClick={() => setStep(2)} className="flex-1 bg-emerald-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2">
                        Ghi chú lỗi <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
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
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">
                <div className="flex gap-3 items-start">
                  <img src={photoData!} className="w-16 h-16 object-cover rounded-xl border border-slate-700" />
                  <div className="flex-1 flex flex-col gap-2">
                    <input 
                      type="text" value={title} onChange={e => setTitle(e.target.value)}
                      placeholder="Nhập tên lỗi..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Mô tả chi tiết</span>
                  <textarea 
                    value={textNotes} onChange={e => setTextNotes(e.target.value)}
                    placeholder="Gõ mô tả cách khắc phục, kích thước..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 resize-none h-24 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Ghi âm hiện trường (Tùy chọn)</span>
                  {audioData ? (
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Đã thu âm xong
                      <button onClick={() => setAudioData(null)} className="ml-auto text-rose-400 underline">Thu lại</button>
                    </div>
                  ) : (
                    <button 
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                      {isRecording ? <><MicOff className="w-4 h-4" /> ĐANG THU ÂM... BẤM ĐỂ DỪNG</> : <><Mic className="w-4 h-4" /> Bấm để Thu Âm</>}
                    </button>
                  )}
                </div>

                <button 
                  onClick={handleFinish}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 font-black rounded-xl text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] mt-2"
                >
                  LƯU & CHỌN BẢN VẼ ĐỂ GHIM
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </div>
  );
}
