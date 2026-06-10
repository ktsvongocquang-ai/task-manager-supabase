import { useState } from 'react';
import { CheckSquare2, Clock, User, ChevronDown, ChevronUp, Stamp } from 'lucide-react';

export interface ConfirmStamp {
  type: 'chot_ho_so' | 'xu_nhan_ban_ve' | 'gs_mat_bang' | 'nghiem_thu';
  by: string;
  at: number;
  note?: string;
}

const STAMP_CONFIG = [
  {
    type: 'chot_ho_so' as const,
    label: 'Chốt hồ sơ nội bộ',
    sub: 'QL xác nhận hồ sơ đủ điều kiện giao xưởng',
    who: 'Quản lý',
    color: 'indigo',
    icon: '📋',
  },
  {
    type: 'xu_nhan_ban_ve' as const,
    label: 'Xưởng đã nhận bản vẽ',
    sub: 'XU xác nhận đã nhận đủ bản vẽ để sản xuất',
    who: 'Xưởng / Thợ',
    color: 'orange',
    icon: '🏭',
  },
  {
    type: 'gs_mat_bang' as const,
    label: 'GS nghiệm thu mặt bằng',
    sub: 'Giám sát xác nhận công trình đạt yêu cầu kỹ thuật',
    who: 'Giám sát',
    color: 'emerald',
    icon: '🔍',
  },
  {
    type: 'nghiem_thu' as const,
    label: 'Nghiệm thu & bàn giao',
    sub: 'QL xác nhận hoàn thành, sẵn sàng bàn giao khách',
    who: 'Quản lý',
    color: 'purple',
    icon: '🏆',
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; badge: string; btn: string; stamp: string }> = {
  indigo:  { bg: 'bg-indigo-500/5',  border: 'border-indigo-800/40',  badge: 'bg-indigo-500/20 text-indigo-300',  btn: 'bg-indigo-600 hover:bg-indigo-500',   stamp: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30' },
  orange:  { bg: 'bg-orange-500/5',  border: 'border-orange-800/40',  badge: 'bg-orange-500/20 text-orange-300',  btn: 'bg-orange-600 hover:bg-orange-500',   stamp: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
  emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-800/40', badge: 'bg-emerald-500/20 text-emerald-300',btn: 'bg-emerald-600 hover:bg-emerald-500', stamp: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  purple:  { bg: 'bg-purple-500/5',  border: 'border-purple-800/40',  badge: 'bg-purple-500/20 text-purple-300',  btn: 'bg-purple-600 hover:bg-purple-500',   stamp: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
};

function loadStamps(projectId: string): ConfirmStamp[] {
  try {
    return JSON.parse(localStorage.getItem(`sdqh_stamps_${projectId}`) || '[]');
  } catch { return []; }
}

function saveStamps(projectId: string, stamps: ConfirmStamp[]) {
  localStorage.setItem(`sdqh_stamps_${projectId}`, JSON.stringify(stamps));
}

interface ConfirmStampsProps {
  projectId: string;
  currentUserName: string;
}

export default function ConfirmStamps({ projectId, currentUserName }: ConfirmStampsProps) {
  const [stamps, setStamps] = useState<ConfirmStamp[]>(() => loadStamps(projectId));
  const [open, setOpen] = useState(false);
  const [confirmingType, setConfirmingType] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const doneCount = stamps.length;
  const totalCount = STAMP_CONFIG.length;
  const pct = Math.round((doneCount / totalCount) * 100);

  function getStamp(type: string) {
    return stamps.find(s => s.type === type);
  }

  function handleConfirm(type: ConfirmStamp['type']) {
    const newStamp: ConfirmStamp = {
      type,
      by: currentUserName,
      at: Date.now(),
      note: noteInput.trim() || undefined,
    };
    const updated = [...stamps.filter(s => s.type !== type), newStamp];
    setStamps(updated);
    saveStamps(projectId, updated);
    setConfirmingType(null);
    setNoteInput('');
  }

  function handleRevoke(type: string) {
    if (!confirm('Hủy xác nhận này?')) return;
    const updated = stamps.filter(s => s.type !== type);
    setStamps(updated);
    saveStamps(projectId, updated);
  }

  return (
    <div className="mt-4 rounded-2xl overflow-hidden border border-slate-800/60 bg-slate-900/40">
      {/* Header toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Stamp className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-black text-slate-200">Xác nhận tiến độ</span>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-20 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-1.5 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-500">{doneCount}/{totalCount}</span>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {STAMP_CONFIG.map(cfg => {
            const stamp = getStamp(cfg.type);
            const c = COLOR_MAP[cfg.color];
            const isConfirming = confirmingType === cfg.type;

            return (
              <div key={cfg.type} className={`rounded-xl border ${stamp ? c.border : 'border-slate-800'} ${stamp ? c.bg : ''} p-3 transition-all`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg shrink-0 mt-0.5">{cfg.icon}</span>
                    <div>
                      <p className={`text-sm font-black ${stamp ? 'text-white' : 'text-slate-300'}`}>
                        {cfg.label}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{cfg.sub}</p>
                      {stamp && (
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.stamp}`}>
                            ✓ {stamp.by}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Clock className="w-3 h-3" />
                            {new Date(stamp.at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {stamp.note && (
                            <span className="text-[10px] text-slate-400 italic w-full">"{stamp.note}"</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {!stamp ? (
                    <button
                      onClick={() => { setConfirmingType(cfg.type); setNoteInput(''); }}
                      className={`shrink-0 px-3 py-1.5 ${c.btn} text-white text-[11px] font-black rounded-xl cursor-pointer transition-colors flex items-center gap-1`}
                    >
                      <CheckSquare2 className="w-3.5 h-3.5" />
                      Xác nhận
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRevoke(cfg.type)}
                      className="shrink-0 text-[10px] text-slate-600 hover:text-rose-400 transition-colors cursor-pointer px-2 py-1 hover:bg-rose-500/10 rounded-lg"
                    >
                      Hủy
                    </button>
                  )}
                </div>

                {/* Inline confirm dialog */}
                {isConfirming && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="text-[11px] text-slate-400">
                        Ký bởi: <strong className="text-white">{currentUserName}</strong>
                      </span>
                    </div>
                    <input
                      type="text"
                      value={noteInput}
                      onChange={e => setNoteInput(e.target.value)}
                      placeholder="Ghi chú (tuỳ chọn)..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500 mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirm(cfg.type)}
                        className={`flex-1 py-2 ${c.btn} text-white text-xs font-black rounded-xl cursor-pointer transition-colors`}
                      >
                        ✅ Xác nhận ngay
                      </button>
                      <button
                        onClick={() => setConfirmingType(null)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
