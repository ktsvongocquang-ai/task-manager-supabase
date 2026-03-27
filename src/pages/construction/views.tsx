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
  const [photos, setPhotos] = React.useState(0);
  const [note, setNote] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [recording, setRecording] = React.useState<MediaRecorder | null>(null);

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
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5" /> Ảnh công trình
        </h4>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: photos }).map((_, i) => (
            <div key={i} className="w-14 h-14 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
          ))}
          <button onClick={() => setPhotos(p => Math.min(10, p + 1))} className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
            <Camera className="w-5 h-5" />
            <span className="text-[8px] mt-0.5">Chụp</span>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">Tối thiểu 2 ảnh · Watermark tự động</p>
      </div>

      {/* Voice note */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5" /> Ghi chú
        </h4>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Nhập hoặc bấm mic để nói..." rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
        <div className="flex justify-end mt-2">
          <button onClick={async () => {
            if (recording) { recording.stop(); setRecording(null); return; }
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const mr = new MediaRecorder(stream);
              const chunks: Blob[] = [];
              mr.ondataavailable = e => chunks.push(e.data);
              mr.onstop = () => { stream.getTracks().forEach(t => t.stop()); setNote(prev => prev + ' [\uD83C\uDFA4 Ghi \u00e2m ' + new Date().toLocaleTimeString('vi-VN') + ']'); };
              mr.start(); setRecording(mr);
            } catch { setNote(prev => prev + ' [Mic kh\u00f4ng kh\u1ea3 d\u1ee5ng]'); }
          }} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${recording ? 'border-rose-300 bg-rose-50 text-rose-600 animate-pulse' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            <Mic className="w-3 h-3" /> {recording ? '\u25CF D\u1eebng ghi' : 'N\u00f3i'}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button disabled={photos < 2 || !confirmed} onClick={() => setSubmitted(true)} className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        <Check className="w-5 h-5" /> Gửi báo cáo
      </button>
      {(photos < 2 || !confirmed) && (
        <p className="text-[10px] text-amber-600 text-center">
          {!confirmed && 'Xác nhận hạng mục · '}{photos < 2 && `Cần thêm ${2 - photos} ảnh`}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CLIENT COUNTDOWN VIEW
// ═══════════════════════════════════════════════════════════

export function ClientCountdown({ project, milestones }: { project: Project; milestones: Milestone[] }) {
  const daysLeft = Math.ceil((new Date(project.handoverDate).getTime() - Date.now()) / 86400000);
  const totalPaid = milestones.filter(m => m.paymentStatus === 'paid').reduce((s, m) => s + m.paymentAmount, 0);

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
        <div className="mt-3">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round(totalPaid / project.contractValue * 100)}%` }} /></div>
          <p className="text-[10px] text-slate-400 mt-1">{Math.round(totalPaid / project.contractValue * 100)}% đã thanh toán</p>
        </div>
      </div>

      {/* Milestones */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Mốc nghiệm thu</h3>
        <div className="space-y-2">
          {milestones.map(m => (
            <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.status === 'passed' ? 'bg-emerald-500' : m.status === 'pending_internal' ? 'bg-amber-100 border-2 border-amber-400' : 'bg-slate-100 border-2 border-slate-300'}`}>
                {m.status === 'passed' && <Check className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700">{m.name}</p>
                <p className="text-[10px] text-slate-400">{m.status === 'passed' ? m.approvedDate : m.status === 'pending_internal' ? 'Đang kiểm tra...' : 'Sắp tới'}</p>
              </div>
              <span className={`text-xs font-bold ${m.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-slate-400'}`}>{fmt(m.paymentAmount)}</span>
            </div>
          ))}
        </div>
      </div>
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
