import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, AlertCircle, FileText, Check, Volume2 } from 'lucide-react';

interface VoiceNoteRecorderProps {
  initialText: string;
  onSave: (audioBase64: string | null, transcription: string) => void;
  onCancel: () => void;
}

export default function VoiceNoteRecorder({ initialText, onSave, onCancel }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [text, setText] = useState<string>(initialText);
  const [interimText, setInterimText] = useState<string>('');
  const [micPermissionError, setMicPermissionError] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [animationBars, setAnimationBars] = useState<number[]>(Array(10).fill(10));
  const [saveAudioFile, setSaveAudioFile] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef<boolean>(false);

  useEffect(() => {
    // Just check support on mount
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
    
    return () => {
      stopRecordingSession();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  // Update animated audio bars
  useEffect(() => {
    if (isRecording) {
      animationIntervalRef.current = setInterval(() => {
        setAnimationBars(
          Array(12)
            .fill(0)
            .map(() => Math.floor(Math.random() * 32) + 6)
        );
      }, 100);
    } else {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
      setAnimationBars(Array(12).fill(6));
    }
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [isRecording]);

  async function startRecordingSession() {
    audioChunksRef.current = [];
    setMicPermissionError(false);

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(micStream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const compiledBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(compiledBlob);
        
        const runtimeUrl = URL.createObjectURL(compiledBlob);
        setAudioUrl(runtimeUrl);

        // Turn off stream tracks
        micStream.getTracks().forEach(track => track.stop());
      };

      // Start actual session
      mediaRecorder.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      setAudioBlob(null);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setInterimText('');

      // Start speech recognition Vietnamese
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e) {}
        }
        
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
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
          setInterimText(interimTranscript);
          if (finalTranscript) {
            setText(prev => {
              const separator = prev.trim() ? '. ' : '';
              return prev + separator + finalTranscript.trim();
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Lỗi SpeechRecognition:', event.error);
        };

        recognition.onend = () => {
          if (isRecordingRef.current) {
            setTimeout(() => {
              try { recognition.start(); } catch (e) {}
            }, 100);
          }
        };

        recognitionRef.current = recognition;
        try { recognition.start(); } catch (e) { console.error(e); }
      }
    } catch (err) {
      console.error('Lỗi truy cập microphone:', err);
      setMicPermissionError(true);
    }
  }

  function stopRecordingSession() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setIsRecording(false);
    isRecordingRef.current = false;
    if (interimText) {
      setText(prev => {
        const separator = prev.trim() ? '. ' : '';
        return prev + separator + interimText.trim();
      });
      setInterimText('');
    }
  }

  function convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function handleConfirmSave() {
    let base64String: string | null = null;
    if (saveAudioFile && audioBlob) {
      try {
        base64String = await convertBlobToBase64(audioBlob);
      } catch (e) {
        console.error('Lỗi chuyển đổi âm thanh base64:', e);
      }
    }
    // Callback with saved audio and transcript text
    onSave(base64String, text);
  }

  function togglePlayback() {
    if (!audioPlayerRef.current || !audioUrl) return;
    const player = audioPlayerRef.current;
    
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  }

  function resetAudioRecord() {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setIsPlaying(false);
  }

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col gap-4">
      {/* Visual Header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
        <div className="flex items-center gap-2">
          <Mic className={`w-4 h-4 ${isRecording ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
          <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Voice Notes & Thuyết minh</span>
        </div>
        {isRecording && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
            ĐANG GHI ÂM (Dịch voice)
          </span>
        )}
      </div>

      {speechSupported === false && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-[11px] text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>Trình duyệt không hỗ trợ dịch tiếng nói tự động. Bạn có thể nói bình thường để ghi file âm thanh và tự gõ mô tả.</span>
        </div>
      )}

      {micPermissionError && (
        <div className="p-2.5 bg-rose-50 border border-rose-150 rounded-lg flex items-start gap-2 text-[11px] text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>Bị chặn quyền truy cập Microphone. Vui lòng cấp quyền micro trong cài đặt trình duyệt của bạn sau đó thử lại.</span>
        </div>
      )}

      {/* Visual Waveform and Primary Recording Action */}
      <div className="flex flex-col items-center justify-center py-2 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden shadow-inner">
        <div className="flex items-end justify-center gap-1 h-12 mb-3 px-6">
          {animationBars.map((height, i) => (
            <div
              key={i}
              style={{ height: `${height}px` }}
              className={`w-1 rounded-full transition-all duration-75 ${
                isRecording ? 'bg-emerald-400' : audioBlob ? 'bg-amber-400' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-4 z-10">
          {!isRecording && !audioUrl ? (
            <button
              onClick={startRecordingSession}
              type="button"
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 active:bg-rose-600 font-semibold text-white text-xs rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-colors"
            >
              <Mic className="w-4 h-4" />
              Bắt đầu nói
            </button>
          ) : isRecording ? (
            <button
              onClick={stopRecordingSession}
              type="button"
              className="px-5 py-2.5 bg-slate-100 hover:bg-white text-slate-900 font-semibold text-xs rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-colors animate-pulse"
            >
              <Square className="w-3.5 h-3.5 text-rose-600" />
              Dừng ghi âm
            </button>
          ) : (
            /* Recorded Playback & reset state */
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayback}
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-slate-100" />
                    Tạm dừng
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                    Nghe lại âm thanh
                  </>
                )}
              </button>

              <button
                onClick={resetAudioRecord}
                type="button"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Ghi âm lại"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" />
                Đã ghi
              </span>
            </div>
          )}
        </div>
        
        {/* Playback ref */}
        {audioUrl && (
          <audio
            ref={audioPlayerRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}
      </div>

      {/* Live transcription textbox */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          Văn bản dịch ra (Có thể tự sửa):
        </label>
        <div className="relative">
          <textarea
            value={text + (interimText ? (text ? ' ' : '') + interimText + '...' : '')}
            onChange={(e) => {
              // If user types, we update text and clear interim so it doesn't mess up
              setText(e.target.value.replace(/\.\.\.$/, ''));
              setInterimText('');
            }}
            placeholder={isRecording ? 'Hãy bắt đầu nói... Hệ thống sẽ tự chuyển thành chữ tiếng Việt.' : 'Kết quả dịch từ giọng nói sẽ hiển thị tại đây. Bạn có thể tự gõ thêm ghi chú.'}
            rows={3}
            className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 leading-relaxed shadow-sm transition-shadow resize-none"
          />
          {isRecording && interimText && (
            <span className="absolute bottom-2 right-2 flex space-x-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 px-1 mt-1">
        <input 
          type="checkbox" 
          id="save-audio-toggle"
          checked={saveAudioFile} 
          onChange={(e) => setSaveAudioFile(e.target.checked)}
          className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
        />
        <label htmlFor="save-audio-toggle" className="text-[11px] text-slate-600 cursor-pointer select-none">
          Lưu kèm file âm thanh gốc <span className="text-amber-600 italic">(Tốn dung lượng CSDL)</span>
        </label>
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
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow transition-colors cursor-pointer"
        >
          <Check className="w-4 h-4" />
          Lưu thuyết minh
        </button>
      </div>
    </div>
  );
}
