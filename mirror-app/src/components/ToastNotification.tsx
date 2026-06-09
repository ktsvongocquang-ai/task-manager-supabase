import { useEffect, useState } from 'react';
import { X, CheckCircle2, FileText, MapPin, RotateCcw, MessageSquare, Trash2, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error' | 'phase';

export interface Toast {
  id: string;
  type: ToastType;
  emoji?: string;
  message: string;
  subtext?: string;
  duration?: number;
}

interface ToastNotificationProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const TYPE_STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-950 border-emerald-700 text-emerald-100',
  info:    'bg-indigo-950 border-indigo-700 text-indigo-100',
  warning: 'bg-amber-950 border-amber-700 text-amber-100',
  error:   'bg-rose-950 border-rose-700 text-rose-100',
  phase:   'bg-violet-950 border-violet-700 text-violet-100',
};

const TYPE_ICON: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
  info:    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
  error:   <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />,
  phase:   <RotateCcw className="w-4 h-4 text-violet-400 shrink-0" />,
};

const TYPE_BAR: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  info:    'bg-indigo-500',
  warning: 'bg-amber-500',
  error:   'bg-rose-500',
  phase:   'bg-violet-500',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    // Slide in
    const t1 = setTimeout(() => setVisible(true), 10);
    // Start leaving
    const t2 = setTimeout(() => setLeaving(true), duration - 400);
    // Remove
    const t3 = setTimeout(() => onDismiss(), duration);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  function handleDismiss() {
    setLeaving(true);
    setTimeout(() => onDismiss(), 350);
  }

  return (
    <div
      className={`
        relative flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-2xl
        min-w-[260px] max-w-[340px] w-full cursor-pointer select-none overflow-hidden
        transition-all duration-350 ease-out
        ${TYPE_STYLES[toast.type]}
        ${visible && !leaving
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-4 scale-95'
        }
      `}
      onClick={handleDismiss}
    >
      {/* Animated progress bar at bottom */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/10">
        <div
          className={`h-full ${TYPE_BAR[toast.type]} rounded-full`}
          style={{
            animation: `toast-shrink ${duration}ms linear forwards`,
          }}
        />
      </div>

      {/* Icon or emoji */}
      <div className="mt-0.5 shrink-0">
        {toast.emoji
          ? <span className="text-base leading-none">{toast.emoji}</span>
          : TYPE_ICON[toast.type]
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold leading-snug break-words">{toast.message}</p>
        {toast.subtext && (
          <p className="text-[11px] opacity-60 mt-0.5 truncate">{toast.subtext}</p>
        )}
      </div>

      {/* Close */}
      <button
        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
        className="shrink-0 mt-0.5 opacity-40 hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function ToastNotification({ toasts, onDismiss }: ToastNotificationProps) {
  return (
    <>
      {/* Inject keyframe animation */}
      <style>{`
        @keyframes toast-shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      {/* Toast stack — bottom-left, mobile friendly */}
      <div
        className="fixed bottom-5 left-4 z-[9999] flex flex-col-reverse gap-2 pointer-events-none"
        style={{ maxWidth: '340px' }}
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={() => onDismiss(t.id)} />
          </div>
        ))}
      </div>
    </>
  );
}
