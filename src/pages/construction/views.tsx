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

export function ClientCountdown({ project, milestones, dailyLogs, phases, tasks }: {
  project: Project; milestones: Milestone[];
  dailyLogs?: import('./types').DailyLog[]; phases?: import('./types').ConstructionPhase[];
  tasks?: import('./types').CTask[];
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

      {/* Mốc nghiệm thu — driven by REVIEW tasks from real data */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Mốc nghiệm thu</h3>
        {(() => {
          // Real REVIEW tasks take priority over mock milestone data
          const reviewTasks = (tasks || []).filter(t => t.status === 'REVIEW' || t.status === 'DONE');
          const hasRealData = reviewTasks.length > 0;

          if (!hasRealData && milestones.length === 0) {
            return (
              <div className="bg-white rounded-xl border border-dashed border-slate-200 p-6 text-center">
                <p className="text-xs text-slate-400">Chưa có hạng mục nào chờ nghiệm thu</p>
              </div>
            );
          }

          const items = hasRealData ? reviewTasks : milestones.map(m => ({
            id: m.id, name: m.name,
            status: m.status === 'passed' ? 'DONE' : 'REVIEW',
            checklist: m.subTasks.map((st: any) => ({ id: st.id, label: st.name, completed: st.status === 'done', required: false })),
            budget: m.paymentAmount, progress: 0,
          }));

          return (
            <div className="space-y-2">
              {items.map((item: any) => {
                const isDone = item.status === 'DONE';
                const checklist = item.checklist || [];
                const doneCount = checklist.filter((c: any) => c.completed).length;
                const isExpanded = expandedMs === item.id;
                return (
                  <div key={item.id}>
                    <div
                      onClick={() => setExpandedMs(isExpanded ? null : item.id)}
                      className={`bg-white rounded-xl border p-4 shadow-sm flex items-center gap-3 cursor-pointer transition-all ${isDone ? 'border-emerald-200 hover:border-emerald-300' : 'border-amber-200 hover:border-amber-300'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-500' : 'bg-amber-100 border-2 border-amber-400'}`}>
                        {isDone
                          ? <Check className="w-4 h-4 text-white" />
                          : <span className="text-amber-500 text-xs font-black">!</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{item.name}</p>
                        <p className={`text-[10px] mt-0.5 font-medium ${isDone ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isDone ? 'Đã nghiệm thu' : 'Chờ nghiệm thu'}
                        </p>
                        {checklist.length > 0 && (
                          <p className="text-[9px] text-slate-400 mt-0.5">{doneCount}/{checklist.length} mục đã xác nhận</p>
                        )}
                      </div>
                      {checklist.length > 0 && (
                        <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform flex-none ${isExpanded ? 'rotate-90' : ''}`} />
                      )}
                    </div>
                    {/* Checklist expansion */}
                    {isExpanded && checklist.length > 0 && (
                      <div className="ml-5 mt-1 bg-white border border-slate-100 rounded-xl divide-y divide-slate-50 shadow-sm py-1">
                        {checklist.map((c: any) => (
                          <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-none ${c.completed ? 'bg-emerald-500' : 'border-2 border-slate-300'}`}>
                              {c.completed && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className={`text-xs ${c.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{c.label}</span>
                          </div>
                        ))}
                        <div className="px-4 py-2">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Tiến độ nghiệm thu</span>
                            <span className="font-bold">{checklist.length > 0 ? Math.round(doneCount / checklist.length * 100) : 0}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${checklist.length > 0 ? Math.round(doneCount / checklist.length * 100) : 0}%` }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
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
// DAILY LOG VIEW & MODALS — Nhật ký thi công chuyên sâu
// ═══════════════════════════════════════════════════════════

export function DailyLogView({ logs, onAddLog, canEdit, isManager }: {
  logs: import('./types').DailyLog[];
  onAddLog?: (log: import('./types').DailyLog) => void;
  canEdit: boolean;
  isManager?: boolean;
}) {
  const [search, setSearch] = React.useState('');
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [selectedLogId, setSelectedLogId] = React.useState<string | null>(null);

  const filtered = logs.filter(l =>
    !search || l.taskCategory.toLowerCase().includes(search.toLowerCase()) || l.notes.toLowerCase().includes(search.toLowerCase()) || l.date.includes(search)
  );

  const selectedLog = logs.find(l => l.id === selectedLogId);

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          📋 Nhật ký công trường <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{logs.length} ngày</span>
        </h3>
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="relative w-64">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm nhật ký..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
            <span className="absolute left-3 top-2.5 text-[10px]">🔍</span>
          </div>
          {canEdit && <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm">+ Tạo báo cáo</button>}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Ngày / Thời tiết</th>
              <th className="py-3 px-4">Hạng mục chính</th>
              <th className="py-3 px-4">Nhân lực</th>
              <th className="py-3 px-4">Đính kèm</th>
              <th className="py-3 px-4">Người báo cáo</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(log => (
              <tr key={log.id} onClick={() => setSelectedLogId(log.id)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-800">{new Date(log.date).toLocaleDateString('vi-VN')}</p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                     Sáng: {log.weatherAM === 'sunny' ? '☀️' : log.weatherAM === 'rainy' ? '🌧️' : '⛅'} · Chiều: {log.weatherPM === 'sunny' ? '☀️' : log.weatherPM === 'rainy' ? '🌧️' : '⛅'}
                  </p>
                </td>
                <td className="py-3 px-4">
                  <p className="font-medium text-slate-700 truncate max-w-[180px]" title={log.taskCategory}>{log.taskCategory}</p>
                  {log.temperature && <p className="text-[10px] text-slate-400">Nhiệt độ: {log.temperature}°C</p>}
                </td>
                <td className="py-3 px-4">
                  <p className="text-xs text-slate-600">Thợ chính: <span className="font-bold">{log.workerCount.main}</span></p>
                  <p className="text-xs text-slate-600">Thợ phụ: <span className="font-bold">{log.workerCount.helper}</span></p>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {log.sitePhotos.length > 0 && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold border border-indigo-100 flex items-center gap-1">📷 {log.sitePhotos.length}</span>}
                    {log.videos.length > 0 && <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-1 rounded font-bold border border-rose-100 flex items-center gap-1">🎬 {log.videos.length}</span>}
                    {log.sitePhotos.length === 0 && log.videos.length === 0 && <span className="text-[10px] text-slate-400 italic">Không có</span>}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">{log.reporterName?.[0] || 'KS'}</div>
                    <span className="text-xs font-medium text-slate-700">{log.reporterName || 'Kỹ sư HT'}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold border ${
                    log.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    log.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                    'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {log.status === 'approved' ? '✓ Đã duyệt' : log.status === 'rejected' ? '✕ Vấn đề' : '⏳ Chờ duyệt'}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">Không tìm thấy dữ liệu nhật ký</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && <DailyLogCreateModal onClose={() => setShowCreateModal(false)} onSave={onAddLog} />}
      {selectedLog && <DailyLogDetailModal log={selectedLog} onClose={() => setSelectedLogId(null)} isManager={isManager} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DAILY LOG CREATE MODAL (Popup Tạo Báo Cáo)
// ═══════════════════════════════════════════════════════════

function DailyLogCreateModal({ onClose, onSave }: { onClose: () => void; onSave?: (log: any) => void }) {
  const [form, setForm] = React.useState({
    taskCategory: '', weatherAM: 'sunny' as import('./types').WeatherType, weatherPM: 'sunny' as import('./types').WeatherType, temperature: 30, taskProgress: 0,
    workerMain: 5, workerHelper: 3, machines: '', materials: '', notes: ''
  });
  const [photos, setPhotos] = React.useState<string[]>([]);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    Array.from(e.target.files).forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setPhotos(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const submit = () => {
    if (!onSave) return;
    onSave({
      id: `dl_${Date.now()}`, date: new Date().toISOString().split('T')[0], projectId: '1',
      weatherAM: form.weatherAM, weatherPM: form.weatherPM, temperature: form.temperature,
      taskCategory: form.taskCategory, taskProgress: form.taskProgress,
      workerCount: { main: form.workerMain, helper: form.workerHelper },
      machines: form.machines, materials: form.materials, notes: form.notes,
      sitePhotos: photos, contractorPhotos: [], videos: [], voiceNotes: [], issues: [],
      createdBy: 'ENGINEER', editable: true, status: 'pending', reporterName: 'Kỹ sư HT', comments: []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Tạo báo cáo ngày</h2>
            <p className="text-xs text-slate-500">Điền thông tin chi tiết các hoạt động tại công trường ngày hôm nay.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-rose-500 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wide border-b pb-2">Thông tin chung</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Thời tiết sáng</label>
                    <select value={form.weatherAM} onChange={e => setForm({...form, weatherAM: e.target.value as any})} className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50">
                      <option value="sunny">☀️ Nắng</option><option value="cloudy">⛅ Nhiều mây</option>
                      <option value="rainy">🌧️ Mưa</option><option value="storm">⛈️ Bão</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Thời tiết chiều</label>
                    <select value={form.weatherPM} onChange={e => setForm({...form, weatherPM: e.target.value as any})} className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50">
                      <option value="sunny">☀️ Nắng</option><option value="cloudy">⛅ Nhiều mây</option>
                      <option value="rainy">🌧️ Mưa</option><option value="storm">⛈️ Bão</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Nhiệt độ trung bình (°C)</label>
                  <input type="number" value={form.temperature} onChange={e => setForm({...form, temperature: +e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50" />
                </div>
              </section>

              <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wide border-b pb-2">Nhân công & Máy móc</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Thợ chính (người)</label><input type="number" value={form.workerMain} onChange={e => setForm({...form, workerMain: +e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50" /></div>
                  <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Thợ phụ (người)</label><input type="number" value={form.workerHelper} onChange={e => setForm({...form, workerHelper: +e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50" /></div>
                </div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Thiết bị / Máy móc sử dụng</label><input placeholder="VD: Máy trộn, xe cuốc..." value={form.machines} onChange={e => setForm({...form, machines: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50" /></div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wide border-b pb-2">Tiến độ & Vật tư</h4>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Công việc đã thi công</label><input placeholder="VD: Xây tường bao tầng lửng..." value={form.taskCategory} onChange={e => setForm({...form, taskCategory: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 mb-3" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">% Hoàn thành hạng mục</label><input type="number" min="0" max="100" value={form.taskProgress} onChange={e => setForm({...form, taskProgress: +e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 mb-3" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Vật tư xuất/nhập/tiêu hao</label><textarea rows={2} placeholder="VD: Xuất 10 bao xi măng, 2 xe cát..." value={form.materials} onChange={e => setForm({...form, materials: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 resize-none" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Ghi chú bổ sung</label><textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 resize-none" /></div>
              </section>

              <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wide">Media Thực tế</h4>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{photos.length}/10 File</span>
                </div>
                <div onClick={() => fileRef.current?.click()} className="group border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-400 hover:bg-white transition-all min-h-[120px]">
                  <div className="w-10 h-10 rounded-full bg-slate-200 group-hover:bg-indigo-100 flex items-center justify-center mb-2 transition-colors">
                    <span className="text-slate-500 group-hover:text-indigo-600">📁</span>
                  </div>
                  <p className="text-xs font-bold text-slate-600 group-hover:text-indigo-600">Nhấn vào đây để tải ảnh / video</p>
                  <p className="text-[10px] text-slate-400 mt-1">Hoặc kéo thả file vào khu vực này</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
                {photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                    {photos.map((p, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm group">
                        <img src={p} className="w-full h-full object-cover" />
                        <button onClick={(e) => { e.stopPropagation(); setPhotos(prev => prev.filter((_, idx) => idx !== i)); }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-4 h-4 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:scale-110">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">Hủy thao tác</button>
          <button onClick={submit} disabled={!form.taskCategory} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
            Gửi báo cáo <span className="text-[10px]">▶</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DAILY LOG DETAIL MODAL (Popup Xem Chi tiết & Duyệt Báo Cáo)
// ═══════════════════════════════════════════════════════════

function DailyLogDetailModal({ log, onClose, isManager }: { log: any; onClose: () => void; isManager?: boolean }) {
  const [comment, setComment] = React.useState('');
  const [commentImages, setCommentImages] = React.useState<string[]>([]);
  const commentFileRef = React.useRef<HTMLInputElement>(null);

  const handleCommentImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    Array.from(e.target.files).forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setCommentImages(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const handleSendComment = () => {
    if (!comment.trim() && commentImages.length === 0) return;
    // Add comment to log (in a real app, this would save to DB)
    const newComment = {
      id: `c_${Date.now()}`,
      author: 'Quản lý',
      text: comment,
      images: commentImages,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    if (!log.comments) log.comments = [];
    log.comments.push(newComment);
    setComment('');
    setCommentImages([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white relative z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Báo cáo ngày {new Date(log.date).toLocaleDateString('vi-VN')}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${log.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : log.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                   {log.status === 'approved' ? '✓ Đã duyệt' : log.status === 'rejected' ? '✕ Yêu cầu sửa' : '⏳ Chờ duyệt'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Người báo cáo: <span className="font-bold text-slate-600">{log.reporterName || 'Kỹ sư HT'}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">✕</button>
        </div>
        <div className="flex flex-1 overflow-hidden bg-slate-50">
          <div className="w-[45%] flex flex-col border-r border-slate-200 bg-white">
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Thời tiết & Nhiệt độ</p>
                  <p className="text-sm font-medium text-slate-700 flex items-center gap-2">Sáng: {log.weatherAM === 'sunny' ? '☀️ Nắng' : log.weatherAM === 'rainy' ? '🌧️ Mưa' : '⛅ Mây'}</p>
                  <p className="text-sm font-medium text-slate-700 flex items-center gap-2 mt-1">Chiều: {log.weatherPM === 'sunny' ? '☀️ Nắng' : log.weatherPM === 'rainy' ? '🌧️ Mưa' : '⛅ Mây'}</p>
                  {log.temperature && <p className="text-sm font-medium text-slate-700 mt-1">Nhiệt độ: {log.temperature}°C</p>}
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Tiến độ thi công</p>
                  <p className="text-xl font-black text-indigo-600">{log.taskProgress || 0}%</p>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style={{ width: `${log.taskProgress || 0}%` }} />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Hạng mục chính</p>
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-sm font-bold text-indigo-900 border-l-4 border-l-indigo-500">{log.taskCategory}</div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Nhân công & Máy móc</p>
                <ul className="space-y-2 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <li className="flex justify-between items-center"><span className="text-slate-500">Thợ chính:</span><span className="font-bold">{log.workerCount.main} người</span></li>
                  <li className="flex justify-between items-center"><span className="text-slate-500">Thợ phụ:</span><span className="font-bold">{log.workerCount.helper} người</span></li>
                  {log.machines && <li className="pt-2 mt-2 border-t border-slate-200 flex flex-col"><span className="text-slate-500 text-[10px] mb-1">Máy móc sử dụng:</span><span className="font-medium text-slate-800">{log.machines}</span></li>}
                </ul>
              </div>
              {log.materials && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Vật tư thi công</p>
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-sm text-emerald-800">{log.materials}</div>
                </div>
              )}
              {log.notes && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Ghi chú bổ sung</p>
                  <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 italic leading-relaxed">{log.notes}</p>
                </div>
              )}
              {log.voiceNotes?.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Ghi âm hiện trường</p>
                  {log.voiceNotes.map((v: string, i: number) => (
                    <p key={i} className="text-sm text-slate-600 italic bg-amber-50 px-3 py-2 rounded-xl border border-amber-100 mb-2">"🎤 {v}"</p>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="w-[55%] flex flex-col bg-slate-100/50 relative">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">📸 Hình ảnh thực tế tại công trường</h4>
                <div className="grid grid-cols-3 gap-3">
                  {log.sitePhotos?.length > 0 ? log.sitePhotos.map((p: string, i: number) => (
                    <div key={i} className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group relative">
                       <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-400 text-xs font-medium group-hover:scale-110 transition-transform duration-300">Ảnh {i + 1}</div>
                    </div>
                  )) : (
                    <div className="col-span-3 text-center py-8 text-sm text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">Không có hình ảnh đính kèm</div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden max-h-[400px]">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">💬 Ý kiến / Nhận xét</h4>
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{log.comments?.length || 0}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {log.comments?.length > 0 ? log.comments.map((c: any) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0">{c.author[0]}</div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-3 relative flex-1">
                        <p className="text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">{c.author} <span className="font-normal text-slate-400">{c.time}</span></p>
                        <p className="text-xs text-slate-700 leading-relaxed">{c.text}</p>
                        {c.images?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-100">
                            {c.images.map((img: string, i: number) => (
                              <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all">
                                <img src={img} className="w-full h-full object-cover" alt={`Ảnh ${i + 1}`} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-xs text-slate-400 italic">Chưa có nhận xét nào cho báo cáo này.</div>
                  )}
                </div>
                {/* Image preview area */}
                {commentImages.length > 0 && (
                  <div className="px-4 pt-3 pb-1 border-t border-slate-100 bg-slate-50/80">
                    <div className="flex flex-wrap gap-2">
                      {commentImages.map((img, i) => (
                        <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shadow-sm group">
                          <img src={img} className="w-full h-full object-cover" alt={`Preview ${i + 1}`} />
                          <button onClick={() => setCommentImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 items-center">
                  <input ref={commentFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleCommentImages} />
                  <button onClick={() => commentFileRef.current?.click()} title="Đính kèm hình ảnh" className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-colors shrink-0">
                    📎
                  </button>
                  <input value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }} placeholder="Nhập ý kiến hoặc phản hồi..." className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 bg-white" />
                  <button onClick={handleSendComment} disabled={!comment.trim() && commentImages.length === 0} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 disabled:opacity-50 transition-colors shrink-0">Gửi</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {(isManager || true) && (
          <div className="p-4 border-t border-slate-200 bg-white flex justify-end items-center gap-3 rounded-b-2xl shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] relative z-20">
            <p className="text-xs text-slate-500 font-medium mr-auto">Báo cáo đang chờ phê duyệt từ quản lý.</p>
            <button onClick={onClose} className="px-5 py-2.5 border border-rose-200 text-rose-600 bg-rose-50 rounded-xl text-sm font-bold hover:bg-rose-100 hover:border-rose-300 transition-colors">Yêu cầu chỉnh sửa</button>
            <button onClick={onClose} className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-600 hover:shadow-lg transition-all flex items-center gap-2">✓ Duyệt báo cáo này</button>
          </div>
        )}
      </div>
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

