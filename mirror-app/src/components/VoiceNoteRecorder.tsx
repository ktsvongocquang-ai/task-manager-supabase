import { useState, useRef, useEffect } from 'react';
import { Mic, Square, AlertCircle, FileText, Check } from 'lucide-react';

interface VoiceNoteRecorderProps {
  initialText: string;
  onSave: (audioBase64: string | null, transcription: string) => void;
  onCancel: () => void;
}

export default function VoiceNoteRecorder({ initialText, onSave, onCancel }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [text, setText] = useState<string>(initialText);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [micPermissionError, setMicPermissionError] = useState<boolean>(false);
  const [animationBars, setAnimationBars] = useState<number[]>(Array(10).fill(6));

  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
    return () => stopRecordingSession();
  }, []);

  // Update animated audio bars
  useEffect(() => {
    if (isRecording) {
      animationIntervalRef.current = setInterval(() => {
        setAnimationBars(
          Array(12).fill(0).map(() => Math.floor(Math.random() * 24) + 8)
        );
      }, 100);
    } else {
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
      setAnimationBars(Array(12).fill(6));
    }
    return () => {
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
    };
  }, [isRecording]);

  function startRecordingSession() {
    setMicPermissionError(false);

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
        setText(prev => {
          const separator = prev.trim() ? '. ' : '';
          let updatedText = prev + separator + finalTranscript.trim();
          updatedText = updatedText.charAt(0).toUpperCase() + updatedText.slice(1);
          return updatedText;
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Lỗi SpeechRecognition:', event.error);
      if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        setMicPermissionError(true);
        setIsRecording(false);
        isRecordingRef.current = false;
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
  }

  function stopRecordingSession() {
    isRecordingRef.current = false;
    setIsRecording(false);
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      try { rec.stop(); } catch (e) { console.error(e); }
    }
  }

  function handleConfirmSave() {
    onSave(null, text); // Không còn file ghi âm, chỉ truyền text
  }

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col gap-4">
      {/* Visual Header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
        <div className="flex items-center gap-2">
          <Mic className={`w-4 h-4 ${isRecording ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
          <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Đọc lỗi (Speech to Text)</span>
        </div>
        {isRecording && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
            ĐANG NGHE...
          </span>
        )}
      </div>

      {!speechSupported && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-[11px] text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>Trình duyệt của bạn không hỗ trợ tính năng chuyển giọng nói thành văn bản. Hãy dùng Google Chrome hoặc Safari phiên bản mới.</span>
        </div>
      )}

      {micPermissionError && (
        <div className="p-2.5 bg-rose-50 border border-rose-150 rounded-lg flex items-start gap-2 text-[11px] text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>Bị chặn quyền truy cập Microphone. Vui lòng cấp quyền micro trong cài đặt trình duyệt của bạn sau đó thử lại.</span>
        </div>
      )}

      {/* Primary Action & Waveform */}
      <div className="flex flex-col items-center justify-center py-3 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden shadow-inner">
        <div className="flex items-end justify-center gap-1 h-12 mb-3 px-6">
          {animationBars.map((height, i) => (
            <div
              key={i}
              style={{ height: `${height}px` }}
              className={`w-1 rounded-full transition-all duration-75 ${
                isRecording ? 'bg-emerald-400' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-4 z-10">
          {!isRecording ? (
            <button
              onClick={startRecordingSession}
              disabled={!speechSupported}
              type="button"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 font-semibold text-slate-950 text-sm rounded-full flex items-center gap-2 shadow-md cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic className="w-4 h-4" />
              Bắt đầu đọc lỗi
            </button>
          ) : (
            <button
              onClick={stopRecordingSession}
              type="button"
              className="px-6 py-3 bg-slate-100 hover:bg-white text-slate-900 font-semibold text-sm rounded-full flex items-center gap-2 shadow-md cursor-pointer transition-colors animate-pulse"
            >
              <Square className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
              Dừng đọc
            </button>
          )}
        </div>
      </div>

      {/* Transcription textbox */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          Nội dung (Có thể tự sửa):
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isRecording ? 'Hãy bắt đầu nói... Hệ thống sẽ tự viết ra chữ.' : 'Nội dung sẽ hiện ra ở đây...'}
          rows={3}
          className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 leading-relaxed shadow-sm transition-shadow resize-none"
        />
      </div>

      {/* Action Buttons to Confirm notes */}
      <div className="flex justify-end gap-2 border-t border-slate-200/60 pt-3">
        <button
          onClick={onCancel}
          type="button"
          className="px-4 py-2 hover:bg-slate-100 text-slate-600 text-xs rounded-lg font-medium transition-colors cursor-pointer"
        >
          Hủy
        </button>
        <button
          onClick={handleConfirmSave}
          type="button"
          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition-colors cursor-pointer"
        >
          <Check className="w-4 h-4" />
          Áp dụng văn bản
        </button>
      </div>
    </div>
  );
}
