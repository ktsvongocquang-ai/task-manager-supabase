import React from 'react';
import {
  TrendingUp, DollarSign, ChevronRight, Check,
  Bell, Star, Users, FileText, Download, Camera, Mic,
  CheckCircle2
} from 'lucide-react';
import type { Project, CTask, Approval, Milestone, Subcontractor, Notification, AttendanceData, FinanceData } from './types';
import { fmt } from './types';

// ═══════════════════════════════════════════════════════════
// MANAGER DASHBOARD — Multi-project overview
// ═══════════════════════════════════════════════════════════

const riskDot = (level: string) => {
  const colors: Record<string, string> = { green: 'bg-emerald-500', yellow: 'bg-amber-500', red: 'bg-rose-500' };
  return colors[level] || 'bg-slate-300';
};

const notifColor = (level: string) => {
  const colors: Record<string, string> = { critical: 'bg-rose-500', action: 'bg-amber-500', good: 'bg-emerald-500', info: 'bg-sky-400' };
  return colors[level] || 'bg-slate-400';
};

const approvalColor = (type: string) => {
  const colors: Record<string, string> = { budget_alert: 'border-rose-400 bg-rose-50', variation: 'border-amber-400 bg-amber-50', qc: 'border-teal-400 bg-teal-50', material: 'border-indigo-400 bg-indigo-50' };
  return colors[type] || 'border-slate-300 bg-slate-50';
};

export function ManagerDashboard({
  projects, finance, approvals, notifications, onSelectProject
}: {
  projects: Project[]; finance: FinanceData; approvals: Approval[];
  notifications: Notification[]; onSelectProject: (p: Project) => void;
}) {
  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Finance Strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Thu tháng này', value: fmt(finance.monthlyInflow), color: 'text-emerald-600', icon: <TrendingUp className="w-4 h-4 text-emerald-500" /> },
          { label: 'Chi tháng này', value: fmt(finance.monthlyOutflow), color: 'text-rose-600', icon: <TrendingUp className="w-4 h-4 text-rose-500 rotate-180" /> },
          { label: 'Vốn lưu động', value: fmt(finance.workingCapital), color: 'text-indigo-600', icon: <DollarSign className="w-4 h-4 text-indigo-500" /> },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1 mb-1">{item.icon}</div>
            <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Project Cards with Traffic Lights */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          Công trình ({projects.length})
        </h3>
        <div className="space-y-2">
          {projects.map(p => {
            const timeProgress = 50; // simplified
            const tdOk = p.progress >= timeProgress - 10;
            const tcOk = p.budgetSpent <= p.progress * 1.15;
            return (
              <div key={p.id} onClick={() => onSelectProject(p)} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{p.address}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Traffic dots */}
                    <div className="flex gap-2">
                      {[
                        { label: 'TĐ', ok: tdOk, color: tdOk ? 'bg-emerald-500' : p.progress >= timeProgress - 20 ? 'bg-amber-500' : 'bg-rose-500' },
                        { label: 'TC', ok: tcOk, color: tcOk ? 'bg-emerald-500' : p.budgetSpent <= p.progress * 1.3 ? 'bg-amber-500' : 'bg-rose-500' },
                        { label: 'RR', ok: true, color: riskDot(p.riskLevel) },
                      ].map((d, i) => (
                        <div key={i} className="flex flex-col items-center gap-0.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${d.color}`} />
                          <span className="text-[8px] text-slate-400">{d.label}</span>
                        </div>
                      ))}
                    </div>
                    <span className="text-lg font-bold text-slate-800">{p.progress}%</span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full rounded-full ${riskDot(p.riskLevel)}`} style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Approval Queue */}
      {pendingApprovals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Cần hành động
            </h3>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">{pendingApprovals.length} chờ duyệt</span>
          </div>
          <div className="space-y-2">
            {pendingApprovals.map(a => (
              <div key={a.id} className={`p-3 rounded-xl border-l-4 ${approvalColor(a.type)} cursor-pointer hover:shadow-sm transition-all`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">{a.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{a.detail}</p>
                    <p className="text-[9px] text-slate-400 mt-1">{a.date}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cash Flow Forecast */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-indigo-500" /> Dòng tiền 30 ngày tới
        </h3>
        <div className="space-y-3">
          {finance.upcoming.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-xs font-medium text-slate-700">{item.desc}</p>
                <p className="text-[10px] text-slate-400">{item.dueDate}</p>
              </div>
              <span className={`text-sm font-bold ${item.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {item.type === 'in' ? '+' : '-'}{fmt(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-3.5 h-3.5" /> Thông báo
          </h3>
          {unread > 0 && <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">{unread} mới</span>}
        </div>
        <div className="space-y-1">
          {notifications.slice(0, 5).map(n => (
            <div key={n.id} className={`flex items-start gap-2.5 py-2.5 border-b border-slate-50 ${n.read ? 'opacity-50' : ''}`}>
              <div className={`w-2 h-2 rounded-full ${notifColor(n.level)} mt-1.5 shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700">{n.msg}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ENGINEER DAILY REPORT
// ═══════════════════════════════════════════════════════════

export function EngineerDailyReport({ tasks, project }: { tasks: CTask[]; project: Project }) {
  const [confirmed, setConfirmed] = React.useState(false);
  const [workers, setWorkers] = React.useState({ main: 5, helper: 3 });
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [note, setNote] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Trình duyệt không hỗ trợ Speech API'); return; }
    const rec = new SR(); rec.lang = 'vi-VN'; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e: any) => {
      let t = ''; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setNote(t);
    };
    rec.onend = () => setIsListening(false);
    rec.start(); setIsListening(true);
  };

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    Array.from(e.target.files).forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setPhotos(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const activeTask = tasks.find(t => t.status === 'DOING');

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 border-2 border-emerald-200">
          <Check className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-emerald-600">Đã gửi báo cáo!</h3>
        <p className="text-sm text-slate-400 mt-2">Dữ liệu đang đồng bộ lên hệ thống...</p>
        <button onClick={() => setSubmitted(false)} className="mt-4 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">
          Tạo báo cáo mới
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Báo cáo hôm nay</h2>
        <p className="text-xs text-slate-400 mt-0.5">{project.name} · {new Date().toLocaleDateString('vi-VN')}</p>
      </div>

      {/* AI Suggestion */}
      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2">🤖 AI ĐỀ XUẤT</p>
        <p className="text-sm text-slate-800">Hôm nay theo kế hoạch: <strong>{activeTask?.name || 'Không có hạng mục đang thi công'}</strong></p>
        <p className="text-[10px] text-slate-500 mt-1">Thời tiết: Nắng 33°C · GPS: 10.8012, 106.7109</p>
        <div className="flex gap-2 mt-3">
          <button onClick={() => setConfirmed(true)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${confirmed ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            {confirmed ? '✓ Đã xác nhận' : 'Đúng'}
          </button>
          <button className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50">Sửa hạng mục</button>
        </div>
      </div>

      {/* Workers */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> Nhân sự
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {[{ label: 'Thợ chính', key: 'main' as const }, { label: 'Thợ phụ', key: 'helper' as const }].map(w => (
            <div key={w.key} className="flex items-center justify-between">
              <span className="text-xs text-slate-600">{w.label}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setWorkers(p => ({ ...p, [w.key]: Math.max(0, p[w.key] - 1) }))} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-sm">-</button>
                <span className="text-lg font-bold text-slate-800 w-6 text-center">{workers[w.key]}</span>
                <button onClick={() => setWorkers(p => ({ ...p, [w.key]: p[w.key] + 1 }))} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-sm">+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Photos */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" /> Ảnh công trình
          </h4>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">Lưu trên Cloud Supabase</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {photos.map((p, i) => (
            <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 group">
              <img src={p} className="w-full h-full object-cover" />
              <button onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] w-4 h-4 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">✕</button>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()} className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors bg-slate-50">
            <Camera className="w-5 h-5" />
            <span className="text-[8px] mt-0.5 font-bold">Thêm ảnh</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handlePhotos} />
        </div>
        <p className="text-[10px] text-slate-400 mt-3 font-medium">Tối thiểu 2 ảnh · Watermark tự động gắn toạ độ GPS và Timestamp</p>
      </div>

      {/* Voice note */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5" /> Ghi chú (Nhập phím hoặc đọc Voice)
        </h4>
        <div className="relative">
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Nhập hoặc bấm mic để nói (Speech-to-text)..." rows={3} className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none transition-all ${isListening ? 'border-rose-300 ring-4 ring-rose-50 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100'}`} />
          {isListening && <span className="absolute top-2 right-2 text-[10px] font-bold text-rose-500 animate-pulse flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Đang nghe...</span>}
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-[10px] text-slate-400">Hỗ trợ nhận diện giọng nói tiếng Việt siêu tốc (Voice Speed)</p>
          <button onClick={() => { if (isListening) { setIsListening(false); return; } startVoice(); }} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all shadow-sm ${isListening ? 'border-rose-300 bg-rose-50 text-rose-600 animate-pulse' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Mic className="w-3.5 h-3.5" /> {isListening ? 'Dừng ghi' : 'Bật Voice'}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button disabled={photos.length < 2 || !confirmed} onClick={() => setSubmitted(true)} className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        <Check className="w-5 h-5" /> Gửi báo cáo
      </button>
      {(photos.length < 2 || !confirmed) && (
        <p className="text-[10px] text-amber-600 text-center font-bold">
          {!confirmed ? '⚠ Cần xác nhận hạng mục AI đề xuất.' : `⚠ Cần upload tối thiểu 2 ảnh chụp (hiện có ${photos.length}).`}
        </p>
      )}
    </div>
  );
}

export function ClientCountdown({ project, milestones, dailyLogs, phases }: {
  project: Project; milestones: Milestone[];
  dailyLogs?: import('./types').DailyLog[]; phases?: import('./types').ConstructionPhase[];
}) {
  const daysLeft = Math.ceil((new Date(project.handoverDate).getTime() - Date.now()) / 86400000);
  const totalPaid = milestones.filter(m => m.paymentStatus === 'paid').reduce((s, m) => s + m.paymentAmount, 0);
  const [expandedMs, setExpandedMs] = React.useState<string | null>(null);
  const [showPhases, setShowPhases] = React.useState(false);
  const [showDiary, setShowDiary] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Hero Countdown */}
      <div className="text-center py-6">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Ngày bàn giao dự kiến</p>
        <p className="text-5xl font-black text-indigo-600 mt-1">{daysLeft}</p>
        <p className="text-sm text-slate-500 font-medium">ngày nữa</p>
        <div className="mt-4 mx-auto max-w-xs">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
          </div>
          <p className="text-xs font-bold text-slate-600 mt-2">Tổng thể: {project.progress}%</p>
        </div>
      </div>

      {/* Finance Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-[10px] text-slate-400 font-bold">Giá trị hợp đồng</p><p className="text-lg font-bold text-slate-800">{fmt(project.contractValue)}</p></div>
          <div><p className="text-[10px] text-slate-400 font-bold">Đã thanh toán</p><p className="text-lg font-bold text-emerald-600">{fmt(totalPaid)}</p></div>
        </div>
        {project.unexpectedCosts > 0 && (
          <div className="mt-3 p-2 bg-rose-50 rounded-lg border border-rose-200">
            <p className="text-[10px] text-rose-500 font-bold">Phát sinh ngoài dự kiến</p>
            <p className="text-sm font-bold text-rose-600">{fmt(project.unexpectedCosts)}</p>
          </div>
        )}
        <div className="mt-3">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round(totalPaid / project.contractValue * 100)}%` }} /></div>
          <p className="text-[10px] text-slate-400 mt-1">{Math.round(totalPaid / project.contractValue * 100)}% đã thanh toán</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-sm">
          <p className="text-[10px] text-emerald-500 font-bold">Nhật ký</p>
          <p className="text-2xl font-black text-emerald-600">{project.totalDiaryEntries}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-sm">
          <p className="text-[10px] text-amber-500 font-bold">Ngày nghỉ</p>
          <p className="text-2xl font-black text-amber-600">{project.daysOff}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-sm">
          <p className="text-[10px] text-indigo-500 font-bold">Hồ sơ</p>
          <p className="text-2xl font-black text-indigo-600">{project.totalDocuments}</p>
        </div>
      </div>

      {/* Milestones — EXPANDABLE with sub-tasks */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Mốc nghiệm thu</h3>
        <div className="space-y-2">
          {milestones.map(m => (
            <div key={m.id}>
              <div
                onClick={() => setExpandedMs(expandedMs === m.id ? null : m.id)}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3 cursor-pointer hover:border-indigo-300 transition-all"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.status === 'passed' ? 'bg-emerald-500' : m.status === 'pending_internal' ? 'bg-amber-100 border-2 border-amber-400' : 'bg-slate-100 border-2 border-slate-300'}`}>
                  {m.status === 'passed' && <Check className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700">{m.name}</p>
                  <p className="text-[10px] text-slate-400">{m.status === 'passed' ? m.approvedDate : m.status === 'pending_internal' ? 'Đang kiểm tra...' : 'Sắp tới'}</p>
                  {m.subTasks.length > 0 && <p className="text-[9px] text-indigo-400 mt-0.5">{m.subTasks.filter(s => s.status === 'done').length}/{m.subTasks.length} công việc</p>}
                </div>
                <span className={`text-xs font-bold ${m.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-slate-400'}`}>{fmt(m.paymentAmount)}</span>
                <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${expandedMs === m.id ? 'rotate-90' : ''}`} />
              </div>
              {/* Sub-tasks expansion */}
              {expandedMs === m.id && m.subTasks.length > 0 && (
                <div className="ml-5 mt-1 space-y-1 border-l-2 border-indigo-100 pl-4 py-2">
                  {m.subTasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2 py-1.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[8px] ${st.status === 'done' ? 'bg-emerald-500 text-white' : st.status === 'doing' ? 'bg-amber-400 text-white animate-pulse' : 'bg-slate-200'}`}>
                        {st.status === 'done' && '✓'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-medium ${st.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{st.name}</p>
                        {st.status === 'doing' && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-400 rounded-full" style={{ width: `${st.progress}%` }} /></div>
                            <span className="text-[9px] font-bold text-amber-600">{st.progress}%</span>
                          </div>
                        )}
                        {st.note && <p className="text-[9px] text-amber-500 mt-0.5">⚠ {st.note}</p>}
                      </div>
                      {st.photos.length > 0 && (
                        <span className="text-[9px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded font-bold">{st.photos.length} 📷</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Construction Phases — Mini accordion */}
      {phases && phases.length > 0 && (
        <div>
          <button onClick={() => setShowPhases(!showPhases)} className="w-full flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 hover:text-indigo-600 transition-colors">
            Hạng mục thi công
            <ChevronRight className={`w-4 h-4 transition-transform ${showPhases ? 'rotate-90' : ''}`} />
          </button>
          {showPhases && (
            <div className="space-y-1 relative">
              <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-slate-200" />
              {phases.map(p => (
                <div key={p.id} className="flex items-center gap-3 py-1.5 pl-1 relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] z-10 ${p.status === 'done' ? 'bg-emerald-500 text-white' : p.status === 'doing' ? 'bg-blue-500 text-white animate-pulse' : 'bg-white border-2 border-slate-300'}`}>
                    {p.status === 'done' ? '✓' : p.status === 'doing' ? '⚡' : p.order}
                  </div>
                  <div className="flex-1">
                    <p className={`text-[11px] font-medium ${p.status === 'done' ? 'text-slate-400' : p.status === 'doing' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>{p.name}</p>
                    {p.note && <p className="text-[9px] text-slate-400">{p.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Daily Diary preview */}
      {dailyLogs && dailyLogs.length > 0 && (
        <div>
          <button onClick={() => setShowDiary(!showDiary)} className="w-full flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 hover:text-indigo-600 transition-colors">
            Nhật ký gần nhất
            <ChevronRight className={`w-4 h-4 transition-transform ${showDiary ? 'rotate-90' : ''}`} />
          </button>
          {showDiary && (
            <div className="space-y-2">
              {dailyLogs.slice(0, 5).map(log => (
                <div key={log.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-700">{new Date(log.date).toLocaleDateString('vi-VN')}</p>
                    <div className="flex items-center gap-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${log.weatherAM === 'sunny' ? 'bg-amber-50 text-amber-600 border-amber-200' : log.weatherAM === 'rainy' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {log.weatherAM === 'sunny' ? '☀️' : log.weatherAM === 'rainy' ? '🌧️' : '⛅'}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${log.weatherPM === 'sunny' ? 'bg-amber-50 text-amber-600 border-amber-200' : log.weatherPM === 'rainy' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {log.weatherPM === 'sunny' ? '☀️' : log.weatherPM === 'rainy' ? '🌧️' : '⛅'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-1">{log.taskCategory}</p>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{log.notes}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {log.sitePhotos.length > 0 && <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold">📷 {log.sitePhotos.length}</span>}
                    {log.contractorPhotos.length > 0 && <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold">🏗️ {log.contractorPhotos.length}</span>}
                    {log.videos.length > 0 && <span className="text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold">🎬 {log.videos.length}</span>}
                    {log.voiceNotes.length > 0 && <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">🎤 {log.voiceNotes.length}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUBCONTRACTOR VIEW
// ═══════════════════════════════════════════════════════════

export function SubcontractorView({ subcontractors }: { subcontractors: Subcontractor[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-700">Thầu phụ</h3>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors">+ Thêm</button>
      </div>
      {subcontractors.map(s => (
        <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-800">{s.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.trade} · {s.phone}</p>
            </div>
            <div className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /><span className="text-sm font-bold text-amber-600">{s.rating}</span></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{s.projectIds.length} công trình</p>
          <div className="flex gap-2 mt-3">
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50">Gửi báo giá</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50">Xem lịch sử</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ATTENDANCE VIEW
// ═══════════════════════════════════════════════════════════

export function AttendanceView({ attendance }: { attendance: AttendanceData | undefined }) {
  if (!attendance) return <div className="text-center py-12 text-slate-400 text-sm">Chưa có dữ liệu chấm công</div>;
  const monthTotal = attendance.thisMonth.main * attendance.dailyRate.main + attendance.thisMonth.helper * attendance.dailyRate.helper;
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h4 className="text-sm font-bold text-slate-700 mb-4">Tuần này</h4>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div><p className="text-3xl font-bold text-indigo-600">{attendance.thisWeek.main}</p><p className="text-[10px] text-slate-400 font-bold">Công thợ chính</p></div>
          <div><p className="text-3xl font-bold text-teal-600">{attendance.thisWeek.helper}</p><p className="text-[10px] text-slate-400 font-bold">Công thợ phụ</p></div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h4 className="text-sm font-bold text-slate-700 mb-4">Tháng này</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-[10px] text-slate-400">Thợ chính: {attendance.thisMonth.main} công</p><p className="text-sm font-bold text-slate-800">{fmt(attendance.thisMonth.main * attendance.dailyRate.main)}</p></div>
          <div><p className="text-[10px] text-slate-400">Thợ phụ: {attendance.thisMonth.helper} công</p><p className="text-sm font-bold text-slate-800">{fmt(attendance.thisMonth.helper * attendance.dailyRate.helper)}</p></div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400">Tổng chi nhân công tháng</p>
          <p className="text-xl font-bold text-amber-600">{fmt(monthTotal)}</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// REPORTS VIEW
// ═══════════════════════════════════════════════════════════

export function ReportsView({ tasks, projectName }: { tasks?: any[]; projectName?: string }) {
  const generateCSV = (type: string) => {
    const name = projectName || 'D\u1ef1 \u00e1n';
    const date = new Date().toLocaleDateString('vi-VN');
    let csv = '';
    if (type === 'progress') {
      csv = 'H\u1ea1ng m\u1ee5c,Tr\u1ea1ng th\u00e1i,Ti\u1ebfn \u0111\u1ed9,Ng\u00e2n s\u00e1ch\n';
      (tasks || []).forEach(t => { csv += `"${t.name}","${t.status}",${t.progress}%,${t.budget}\n`; });
    } else if (type === 'finance') {
      csv = 'H\u1ea1ng m\u1ee5c,Ng\u00e2n s\u00e1ch,\u0110\u00e3 chi,C\u00f2n l\u1ea1i\n';
      (tasks || []).forEach(t => { csv += `"${t.name}",${t.budget},${t.spent},${t.budget - t.spent}\n`; });
    } else if (type === 'attendance') {
      csv = 'Ng\u00e0y,Th\u1ee3 ch\u00ednh,Th\u1ee3 ph\u1ee5,T\u1ed5ng\n28/03,5,3,8\n27/03,6,3,9\n26/03,4,2,6\n';
    } else {
      csv = `B\u00e1o c\u00e1o ${type}\nD\u1ef1 \u00e1n: ${name}\nNg\u00e0y: ${date}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${type}_${date.replace(/\//g, '-')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const generatePDF = (type: string) => {
    const name = projectName || 'D\u1ef1 \u00e1n';
    const date = new Date().toLocaleDateString('vi-VN');
    const w = window.open('', '_blank');
    if (!w) return;
    let html = `<html><head><title>${type}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{color:#4f46e5}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f1f5f9;font-size:12px}</style></head><body>`;
    html += `<h1>DQH - ${name}</h1><p>Ng\u00e0y xu\u1ea5t: ${date}</p>`;
    if (type === 'progress' && tasks) {
      html += '<h2>B\u00e1o c\u00e1o ti\u1ebfn \u0111\u1ed9</h2><table><tr><th>H\u1ea1ng M\u1ee5c</th><th>Tr\u1ea1ng th\u00e1i</th><th>Ti\u1ebfn \u0111\u1ed9</th></tr>';
      tasks.forEach(t => { html += `<tr><td>${t.name}</td><td>${t.status}</td><td>${t.progress}%</td></tr>`; });
      html += '</table>';
    } else {
      html += `<h2>${type}</h2><p>D\u1eef li\u1ec7u xu\u1ea5t t\u1eeb h\u1ec7 th\u1ed1ng DQH App.</p>`;
    }
    html += '<script>setTimeout(()=>window.print(),500)<\/script></body></html>';
    w.document.write(html); w.document.close();
  };

  const reports = [
    { name: 'B\u00e1o c\u00e1o ti\u1ebfn \u0111\u1ed9 tu\u1ea7n', format: 'PDF', color: 'bg-rose-50 text-rose-600 border-rose-200', action: () => generatePDF('progress') },
    { name: 'T\u1ed5ng h\u1ee3p t\u00e0i ch\u00ednh th\u00e1ng', format: 'Excel', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', action: () => generateCSV('finance') },
    { name: 'H\u1ed3 s\u01a1 nghi\u1ec7m thu QC', format: 'PDF', color: 'bg-teal-50 text-teal-600 border-teal-200', action: () => generatePDF('qc') },
    { name: '\u0110\u1ed1i so\u00e1t th\u1ea7u ph\u1ee5', format: 'PDF + Excel', color: 'bg-amber-50 text-amber-600 border-amber-200', action: () => { generatePDF('thau-phu'); generateCSV('thau-phu'); } },
    { name: 'B\u1ea3ng ch\u1ea5m c\u00f4ng', format: 'Excel', color: 'bg-pink-50 text-pink-600 border-pink-200', action: () => generateCSV('attendance') },
    { name: 'B\u00e1o c\u00e1o g\u1eedi kh\u00e1ch h\u00e0ng', format: 'PDF (branded)', color: 'bg-indigo-50 text-indigo-600 border-indigo-200', action: () => generatePDF('client') },
  ];
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-700">Xu\u1ea5t b\u00e1o c\u00e1o</h3>
      {reports.map((r, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${r.color}`}><FileText className="w-4 h-4" /></div>
            <div><p className="text-xs font-bold text-slate-800">{r.name}</p><p className="text-[10px] text-slate-400">{r.format}</p></div>
          </div>
          <button onClick={r.action} className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50 hover:border-indigo-300 transition-colors"><Download className="w-3 h-3" /> T\u1ea1o</button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DAILY LOG VIEW — Nhật ký thi công chi tiết
// ═══════════════════════════════════════════════════════════

export function DailyLogView({ logs, onAddLog, canEdit }: {
  logs: import('./types').DailyLog[];
  onAddLog?: (log: import('./types').DailyLog) => void;
  canEdit: boolean;
}) {
  const [search, setSearch] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [expandedLog, setExpandedLog] = React.useState<string | null>(null);
  const [newLog, setNewLog] = React.useState({
    taskCategory: '', notes: '', weatherAM: 'sunny' as import('./types').WeatherType, weatherPM: 'sunny' as import('./types').WeatherType,
    workerMain: 5, workerHelper: 3,
  });
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [isListening, setIsListening] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const filtered = logs.filter(l =>
    !search || l.taskCategory.toLowerCase().includes(search.toLowerCase()) || l.notes.toLowerCase().includes(search.toLowerCase()) || l.date.includes(search)
  );

  const wtIcon = (w: string) => w === 'sunny' ? '☀️' : w === 'rainy' ? '🌧️' : w === 'storm' ? '⛈️' : '⛅';
  const wtColor = (w: string) => w === 'sunny' ? 'bg-amber-50 text-amber-600 border-amber-200' : w === 'rainy' ? 'bg-blue-50 text-blue-600 border-blue-200' : w === 'storm' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-500 border-slate-200';

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Trình duyệt không hỗ trợ Speech API'); return; }
    const rec = new SR(); rec.lang = 'vi-VN'; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e: any) => {
      let t = ''; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setNewLog(prev => ({ ...prev, notes: t }));
    };
    rec.onend = () => setIsListening(false);
    rec.start(); setIsListening(true);
  };

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    Array.from(e.target.files).forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setPhotos(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const submitLog = () => {
    if (!newLog.taskCategory) return;
    const log: import('./types').DailyLog = {
      id: `dl_${Date.now()}`, date: new Date().toISOString().split('T')[0], projectId: '1',
      weatherAM: newLog.weatherAM, weatherPM: newLog.weatherPM,
      taskCategory: newLog.taskCategory, taskProgress: 0,
      workerCount: { main: newLog.workerMain, helper: newLog.workerHelper },
      sitePhotos: photos, contractorPhotos: [], videos: [], voiceNotes: newLog.notes ? [newLog.notes] : [],
      notes: newLog.notes, issues: [], createdBy: 'ENGINEER', editable: true,
    };
    onAddLog?.(log); setShowForm(false);
    setNewLog({ taskCategory: '', notes: '', weatherAM: 'sunny', weatherPM: 'sunny', workerMain: 5, workerHelper: 3 });
    setPhotos([]);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">📋 Nhật ký thi công <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{logs.length} bản ghi</span></h3>
        {canEdit && <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">+ Thêm</button>}
      </div>

      {/* Search */}
      <div className="relative">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm nhật ký..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
        <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-xl border-2 border-indigo-200 p-4 shadow-lg space-y-3">
          <p className="text-xs font-bold text-indigo-600">📝 Thêm nhật ký mới — {new Date().toLocaleDateString('vi-VN')}</p>
          <input value={newLog.taskCategory} onChange={e => setNewLog({...newLog, taskCategory: e.target.value})} placeholder="Hạng mục (VD: BTCT tầng lừng)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
          {/* Weather */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-slate-400 font-bold mb-1">Thời tiết sáng</p>
              <div className="flex gap-1">
                {(['sunny', 'cloudy', 'rainy', 'storm'] as const).map(w => (
                  <button key={w} onClick={() => setNewLog({...newLog, weatherAM: w})}
                    className={`text-sm px-2 py-1 rounded-lg border transition-all ${newLog.weatherAM === w ? 'border-indigo-400 bg-indigo-50 scale-110' : 'border-slate-200 hover:border-slate-300'}`}>
                    {wtIcon(w)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold mb-1">Thời tiết chiều</p>
              <div className="flex gap-1">
                {(['sunny', 'cloudy', 'rainy', 'storm'] as const).map(w => (
                  <button key={w} onClick={() => setNewLog({...newLog, weatherPM: w})}
                    className={`text-sm px-2 py-1 rounded-lg border transition-all ${newLog.weatherPM === w ? 'border-indigo-400 bg-indigo-50 scale-110' : 'border-slate-200 hover:border-slate-300'}`}>
                    {wtIcon(w)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Workers */}
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-[10px] text-slate-400 font-bold mb-1">Thợ chính</p><input type="number" value={newLog.workerMain} onChange={e => setNewLog({...newLog, workerMain: +e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
            <div><p className="text-[10px] text-slate-400 font-bold mb-1">Thợ phụ</p><input type="number" value={newLog.workerHelper} onChange={e => setNewLog({...newLog, workerHelper: +e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          </div>
          {/* Notes + Voice */}
          <div className="relative">
            <textarea value={newLog.notes} onChange={e => setNewLog({...newLog, notes: e.target.value})} placeholder="Ghi chú công việc..." rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:border-indigo-400" />
            <div className="absolute right-2 bottom-2 flex gap-1">
              <button onClick={() => fileRef.current?.click()} className="p-1.5 hover:bg-slate-100 rounded-lg" title="Chụp/chọn ảnh"><Camera className="w-4 h-4 text-slate-400" /></button>
              <button onClick={startVoice} className={`p-1.5 rounded-lg transition-all ${isListening ? 'bg-rose-100 animate-pulse' : 'hover:bg-slate-100'}`} title="Nói để nhập">
                <Mic className={`w-4 h-4 ${isListening ? 'text-rose-500' : 'text-slate-400'}`} />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handlePhotos} />
          </div>
          {/* Photo preview */}
          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {photos.map((p, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group">
                  <img src={p} className="w-full h-full object-cover" />
                  <button onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] w-4 h-4 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={submitLog} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">Lưu nhật ký</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50">Hủy</button>
          </div>
        </div>
      )}

      {/* Log entries */}
      <div className="space-y-2">
        {filtered.map(log => (
          <div key={log.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)} className="p-3 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-700">{new Date(log.date).toLocaleDateString('vi-VN')}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${wtColor(log.weatherAM)}`}>{wtIcon(log.weatherAM)}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${wtColor(log.weatherPM)}`}>{wtIcon(log.weatherPM)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {log.sitePhotos.length > 0 && <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold">📷 +{log.sitePhotos.length}</span>}
                  {log.contractorPhotos.length > 0 && <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold">🏗️ +{log.contractorPhotos.length}</span>}
                  {log.videos.length > 0 && <span className="text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold">🎬 {log.videos.length}</span>}
                  <ChevronRight className={`w-3.5 h-3.5 text-slate-300 transition-transform ${expandedLog === log.id ? 'rotate-90' : ''}`} />
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 font-medium">{log.taskCategory}</p>
            </div>
            {expandedLog === log.id && (
              <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 rounded-lg p-2"><p className="text-[9px] text-slate-400 font-bold">Tiến độ</p><p className="text-sm font-bold text-indigo-600">{log.taskProgress}%</p></div>
                  <div className="bg-slate-50 rounded-lg p-2"><p className="text-[9px] text-slate-400 font-bold">Thợ chính</p><p className="text-sm font-bold text-slate-700">{log.workerCount.main}</p></div>
                  <div className="bg-slate-50 rounded-lg p-2"><p className="text-[9px] text-slate-400 font-bold">Thợ phụ</p><p className="text-sm font-bold text-slate-700">{log.workerCount.helper}</p></div>
                </div>
                <div><p className="text-[10px] text-slate-400 font-bold mb-1">Ghi chú</p><p className="text-xs text-slate-600 leading-relaxed">{log.notes}</p></div>
                {log.voiceNotes.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold mb-1">🎤 Ghi âm</p>
                    {log.voiceNotes.map((v, i) => (
                      <p key={i} className="text-xs text-slate-600 italic bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-200 mb-1">"{v}"</p>
                    ))}
                  </div>
                )}
                {(log.sitePhotos.length > 0 || log.contractorPhotos.length > 0) && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold mb-1">Hình ảnh công trường ({log.sitePhotos.length})</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {log.sitePhotos.slice(0, 4).map((_, i) => (
                        <div key={i} className="w-14 h-14 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center text-lg">📷</div>
                      ))}
                      {log.sitePhotos.length > 4 && <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-500">+{log.sitePhotos.length - 4}</div>}
                    </div>
                    {log.contractorPhotos.length > 0 && (
                      <>
                        <p className="text-[10px] text-slate-400 font-bold mt-2 mb-1">Hình ảnh nhà thầu báo cáo ({log.contractorPhotos.length})</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {log.contractorPhotos.slice(0, 4).map((_, i) => (
                            <div key={i} className="w-14 h-14 bg-gradient-to-br from-amber-200 to-amber-300 rounded-lg flex items-center justify-center text-lg">🏗️</div>
                          ))}
                          {log.contractorPhotos.length > 4 && <div className="w-14 h-14 bg-amber-50 rounded-lg flex items-center justify-center text-[10px] font-bold text-amber-500">+{log.contractorPhotos.length - 4}</div>}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {log.videos.length > 0 && (
                  <div className="flex gap-1.5">
                    {log.videos.map((_, i) => (
                      <div key={i} className="w-14 h-14 bg-gradient-to-br from-indigo-300 to-indigo-400 rounded-lg flex items-center justify-center text-white text-lg">▶</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">Không tìm thấy nhật ký nào</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROJECT OVERVIEW — Tổng quan tài chính dự án
// ═══════════════════════════════════════════════════════════

export function ProjectOverview({ project, subcontractors, milestones }: {
  project: Project; subcontractors: import('./types').Subcontractor[]; milestones: import('./types').Milestone[];
}) {
  const totalPaid = milestones.filter(m => m.paymentStatus === 'paid').reduce((s, m) => s + m.paymentAmount, 0);
  const cards = [
    { label: 'Giá trị HĐ đang quản lý', value: fmt(project.contractValue), color: 'text-slate-800', bg: 'bg-white' },
    { label: 'Đã thanh toán', value: fmt(totalPaid), color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Phát sinh ngoài dự kiến', value: fmt(project.unexpectedCosts), color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Nhà thầu & NCC', value: String(subcontractors.length), color: 'text-slate-700', bg: 'bg-white' },
    { label: 'Hồ sơ & Tài liệu', value: String(project.totalDocuments), color: 'text-slate-700', bg: 'bg-white' },
    { label: 'Nhật ký công việc', value: String(project.totalDiaryEntries), color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Theo dõi ngày nghỉ', value: String(project.daysOff), color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-3">
      {cards.map((c, i) => (
        <div key={i} className={`rounded-xl border border-slate-200 p-4 shadow-sm ${c.bg}`}>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{c.label}</p>
          <p className={`text-2xl font-black mt-1 ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAYMENT HISTORY — Lịch sử thanh toán chi tiết
// ═══════════════════════════════════════════════════════════

export function PaymentHistory({ payments }: { payments: import('./types').PaymentRecord[] }) {
  const [search, setSearch] = React.useState('');
  const filtered = payments.filter(p => !search || p.description.toLowerCase().includes(search.toLowerCase()) || p.date.includes(search));
  const totalOut = payments.filter(p => p.type === 'payment_out').reduce((s, p) => s + p.amount, 0);
  const totalIn = payments.filter(p => p.type === 'payment_in').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">💰 Lịch sử thanh toán</h3>
        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{payments.length} giao dịch</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3"><p className="text-[10px] text-emerald-500 font-bold">Tổng thu</p><p className="text-lg font-bold text-emerald-600">{fmt(totalIn)}</p></div>
        <div className="bg-rose-50 rounded-xl border border-rose-200 p-3"><p className="text-[10px] text-rose-500 font-bold">Tổng chi</p><p className="text-lg font-bold text-rose-600">{fmt(totalOut)}</p></div>
      </div>
      <div className="relative">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
        <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
      </div>
      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700">{new Date(p.date).toLocaleDateString('vi-VN')}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{p.description}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{p.category}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${p.type === 'payment_in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {p.type === 'payment_in' ? '+' : ''}{fmt(p.amount)}
                </p>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${p.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                  {p.status === 'confirmed' ? '✓ Xác nhận' : '⏳ Chờ'}
                </span>
              </div>
            </div>
            {p.billPhotos.length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {p.billPhotos.slice(0, 3).map((_, i) => (
                  <div key={i} className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center text-sm border border-amber-300">📄</div>
                ))}
                {p.billPhotos.length > 3 && <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-[9px] font-bold text-amber-500">+{p.billPhotos.length - 3}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CONTRACTOR PROGRESS CHART — Biểu đồ tiến độ nhà thầu
// ═══════════════════════════════════════════════════════════

export function ContractorProgressChart({ subcontractors }: { subcontractors: import('./types').Subcontractor[] }) {
  const withData = subcontractors.filter(s => s.contractAmount && s.contractAmount > 0);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">📊 Tiến độ nhà thầu</h3>
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
        {withData.map(s => {
          const paymentPct = s.contractAmount ? Math.round((s.paidAmount || 0) / s.contractAmount * 100) : 0;
          return (
            <div key={s.id}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-bold text-slate-700 truncate">{s.name}</p>
                <p className="text-[9px] text-slate-400">{fmt(s.contractAmount || 0)}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${s.progressPercent || 0}%` }} /></div>
                  <span className="text-[9px] font-bold text-blue-600 w-8 text-right">{s.progressPercent || 0}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${paymentPct}%` }} /></div>
                  <span className="text-[9px] font-bold text-emerald-600 w-8 text-right">{paymentPct}%</span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[8px] text-blue-400 flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full inline-block" /> Tiến độ giao</span>
                <span className="text-[8px] text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" /> % Thanh toán</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

