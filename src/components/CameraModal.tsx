import { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import { X, Camera, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface CameraModalProps {
  onCapture: (photoBase64: string) => void;
  onClose: () => void;
}

export default function CameraModal({ onCapture, onClose }: CameraModalProps) {
  const [errorText, setErrorText] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [useWebcam, setUseWebcam] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  // Two separate inputs to grant users choice on mobile: live photo OR media library file
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Request video stream
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
          videoRef.current.play().catch(err => console.error("Lỗi chạy video stream:", err));
        }
      }, 100);
    } catch (err: any) {
      console.warn("Không mở được camera trực tiếp, kích hoạt fallback input file:", err);
      // Fallback: trigger native OS file upload camera dialog
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        setErrorText("Không thể kết nối camera. Vui lòng chọn ảnh từ thiết bị.");
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
      setPreviewData(dataUrl);
      stopWebcam();
    }
  }

  // Parse files to DataURI base64 and compress
  async function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setErrorText('Tệp tin không hợp lệ. Vui lòng chỉ tải lên tài liệu hình ảnh hiện trường!');
      return;
    }
    setErrorText(null);
    try {
      // Lazy load compressImage to avoid circular deps or complex imports if not needed, 
      // but here we just import it directly.
      const { compressImage } = await import('../utils/pdfUtils');
      const dataUrl = await compressImage(file);
      setPreviewData(dataUrl);
    } catch (e) {
      setErrorText('Lỗi khi nén và đọc tệp tin hình ảnh.');
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  // Drag and drop mechanics for computer uploads
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  function handleClose() {
    stopWebcam();
    onClose();
  }

  function handleSave() {
    if (previewData) {
      onCapture(previewData);
      stopWebcam();
      onClose();
    }
  }

  return (
    <div id="camera-modal-backdrop" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wide">Tải Ảnh Lỗi Hiện Trường</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>

        {/* Content Viewport */}
        <div className="p-6 flex flex-col gap-5">
          
          {errorText && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {useWebcam ? (
            /* Live Webcam feed view */
            <div className="flex flex-col gap-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 max-h-[280px] flex items-center justify-center shadow-inner aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover block"
                />
                <div className="absolute top-2 left-2 bg-emerald-500/80 text-slate-950 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping inline-block" />
                  LIVE CAMERA
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => { stopWebcam(); setPreviewData(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-all text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Hủy / Chọn lại
                </button>
                <button
                  onClick={capturePhoto}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 font-extrabold rounded-xl text-slate-950 transition-all text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  CHỤP ẢNH NGAY
                </button>
              </div>
            </div>
          ) : previewData ? (
            /* Selected Image Preview with Confirm */
            <div className="flex flex-col gap-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 max-h-[280px] flex items-center justify-center shadow-inner">
                <img
                  src={previewData}
                  className="max-h-[275px] max-w-full object-contain block"
                  alt="Ảnh hiện trường tải lên"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setPreviewData(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-all text-xs text-slate-400 hover:text-slate-250 cursor-pointer"
                >
                  Chọn tệp khác
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 font-extrabold rounded-xl text-slate-950 transition-all text-xs cursor-pointer shadow-md"
                >
                  ✓ Xác nhận đính kèm ảnh
                </button>
              </div>
            </div>
          ) : (
            /* Upload options for user */
            <div className="flex flex-col gap-4">
              <p className="text-xs text-slate-400 leading-normal">
                Vui lòng chọn phương thức tải lên hình ảnh biên bản lỗi kỹ thuật hiện trường. Bạn có thể chụp ảnh trực tiếp từ camera điện thoại, hoặc chọn ảnh/ảnh chụp sẵn từ thư viện ảnh máy tính hoặc điện thoại di động:
              </p>

              {/* Grid with 2 distinct native entrypoints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mode A: Real Camera Trigger */}
                <button
                  onClick={startWebcam}
                  className="flex flex-col items-center justify-center p-5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-2xl cursor-pointer text-center group transition-all"
                >
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mb-2.5">
                    <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs text-slate-200 font-bold block mb-1">Chụp Ảnh Trực Tiếp</span>
                  <span className="text-[10px] text-slate-500 leading-tight">Mở Camera của điện thoại, máy tính bảng để chụp</span>
                </button>

                {/* Mode B: File picker/Album selector */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-2xl cursor-pointer text-center group transition-all"
                >
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mb-2.5">
                    <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs text-slate-200 font-bold block mb-1">Chọn Từ Thư Viện / Album</span>
                  <span className="text-[10px] text-slate-500 leading-tight">Tải ảnh chụp từ Album điện thoại hoặc từ Máy tính</span>
                </button>
              </div>

              {/* Desktop Drag Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-500/5 text-emerald-300'
                    : 'border-slate-800 bg-slate-950/20 text-slate-500'
                }`}
              >
                <Upload className="w-5 h-5 text-slate-600 mb-1.5" />
                <p className="text-[10px] leading-tight text-slate-400">
                  Hoặc kéo thả file ảnh lỗi trực tiếp vào đây để tải tin
                </p>
              </div>

              <span className="text-[9px] text-slate-500 text-center block font-mono">
                HỖ TRỢ 100% THIẾT BỊ ANDROID, IOS (IPHONE/IPAD), WINDOWS & MAC
              </span>
            </div>
          )}
        </div>

        {/* Hidden Input A: Camera input (mobile forces camera shooter) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Hidden Input B: General File pick (mobile prompts album/file library selector) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {/* Hidden canvas for drawing video frames */}
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </div>
  );
}
