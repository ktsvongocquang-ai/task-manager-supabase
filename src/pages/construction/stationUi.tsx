// Khung modal và ô nhập dùng chung cho Trạm giám sát.
import { X, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

/* ---------- Khung modal dùng chung ---------- */
export function Sheet({ title, sub, onClose, children, footer }: { title: string; sub?: string; onClose: () => void; children: any; footer: any }) {
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative bg-white w-full sm:max-w-lg max-h-[92dvh] rounded-t-2xl sm:rounded-2xl flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="min-w-0"><p className="font-bold text-slate-900">{title}</p>{sub && <p className="text-xs text-slate-500 truncate">{sub}</p>}</div>
          <button onClick={onClose} aria-label="Đóng" className="w-10 h-10 -mr-1.5 flex items-center justify-center rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-4 overflow-y-auto overscroll-contain space-y-3" onFocusCapture={e => { const el = e.target as HTMLElement; if (/INPUT|TEXTAREA|SELECT/.test(el.tagName)) setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300) }}>{children}</div>
        <div className="p-4 border-t border-slate-100" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>{footer}</div>
      </div>
    </div>
  );
}
export const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1216]/20';
export const Label = ({ children, req }: { children: any; req?: boolean }) => <label className="block text-xs font-semibold text-slate-700 mb-1">{children}{req && <span className="text-rose-600"> *</span>}</label>;
export const SaveBtn = ({ busy, onClick, label }: { busy: boolean; onClick: () => void; label: string }) => (
  <button disabled={busy} onClick={onClick} className="w-full py-3 rounded-xl bg-[#7A1216] text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2">{busy && <Loader2 className="w-4 h-4 animate-spin" />}{label}</button>
);

