// Trạm giám sát: một màn hình cho giám sát công trình — nộp nhật ký trước 17:00, làm việc trong ngày,
// tra quy trình và điền biểu mẫu GS-01 → GS-10. Dữ liệu ghi thẳng vào bảng của app (daily_logs,
// construction_tasks, ai_notes) nên Kanban, Nhật ký và trợ lý AI đều thấy ngay.
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Package, LayoutTemplate, Clock, FileText, BookOpen, FolderOpen, CheckCircle2, AlertTriangle, Camera, Plus, Play, Check, ChevronRight, Loader2, WifiOff, CloudUpload } from 'lucide-react';
import { saveOrQueue, queued, flushQueue, startQueueSync, isNetworkError } from '../../services/offlineQueue';
import { supabase, uploadImageToStorage } from '../../services/supabase';
import type { Project } from './types';
import { Sheet, inputCls, Label, SaveBtn } from './stationUi';
import { MaterialsPanel, ChangeOrdersPanel, TemplateModal } from './SiteModules';
import { FORMS, SOP_GROUPS, ISSUE_TYPES, SUPPORT_FROM, formatForm, type SupervisorForm, type FormField } from './supervisorForms';

type Notify = (msg: string, type?: 'success' | 'error' | 'info') => void;
type Profile = { id?: string; full_name?: string | null; role?: string | null } | null | undefined;
type STask = { id: string; project_id: string; name: string; status: string; start_date: string | null; end_date: string | null; progress: number | null; assignee: string | null };
type Tab = 'today' | 'site' | 'forms';

const vnNow = () => new Date(Date.now() + 7 * 3600_000);
const todayVN = () => vnNow().toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const ddmm = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—');
const isDone = (s?: string | null) => ['done', 'hoàn thành', 'completed'].includes(String(s || '').toLowerCase());
const isClosedProject = (s?: string) => ['completed', 'done', 'hoàn thành', 'cancelled', 'đã bàn giao', 'archived'].includes(String(s || '').toLowerCase());

function useCountdown() {
  const [now, setNow] = useState(vnNow());
  useEffect(() => { const t = setInterval(() => setNow(vnNow()), 30_000); return () => clearInterval(t); }, []);
  const deadline = new Date(now.toISOString().slice(0, 10) + 'T17:00:00Z');
  const ms = deadline.getTime() - now.getTime();
  const h = Math.floor(Math.abs(ms) / 3600_000), m = Math.floor((Math.abs(ms) % 3600_000) / 60_000);
  return { late: ms < 0, label: `${h > 0 ? h + ' giờ ' : ''}${m} phút`, weekday: ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][now.getUTCDay()] };
}

export function SupervisorStation({ projects, profile, notify, onDataChanged, action, onActionDone }: { projects: Project[]; profile: Profile; notify?: Notify; onDataChanged?: () => void; action?: string | null; onActionDone?: () => void }) {
  const say: Notify = notify || ((m) => alert(m));
  const [tab, setTab] = useState<Tab>('today');
  const [siteTab, setSiteTab] = useState<'materials' | 'changes'>('materials');
  const [showSop, setShowSop] = useState(false);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [tasks, setTasks] = useState<STask[]>([]);
  const [loading, setLoading] = useState(true);
  const [diaryFor, setDiaryFor] = useState<Project | null>(null);
  const [openForm, setOpenForm] = useState<SupervisorForm | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [waiting, setWaiting] = useState(() => queued().length);
  const [online, setOnline] = useState(() => navigator.onLine);
  const cd = useCountdown();
  const today = todayVN();

  const active = useMemo(() => projects.filter(p => !isClosedProject(p.status) && !String(p.id).startsWith('p')), [projects]);
  const ids = useMemo(() => active.map(p => p.id), [active]);
  const nameOf = useCallback((id: string) => active.find(p => p.id === id)?.name || '', [active]);

  const load = useCallback(async () => {
    if (!ids.length) { setLoading(false); return; }
    setLoading(true);
    const [logs, ts] = await Promise.all([
      supabase.from('daily_logs').select('project_id').in('project_id', ids).eq('date', today),
      supabase.from('construction_tasks').select('id, project_id, name, status, start_date, end_date, progress, assignee').in('project_id', ids),
    ]);
    // Nhật ký đang nằm trong hàng chờ (mất sóng) cũng tính là đã nộp
    const pendingLogs = queued().filter(q => q.table === 'daily_logs' && q.row.date === today).map(q => q.row.project_id);
    setSubmitted(new Set([...(logs.data || []).map((l: any) => l.project_id), ...pendingLogs]));
    if (ts.data) setTasks((ts.data as STask[]).filter(t => !isDone(t.status)));
    setLoading(false);
  }, [ids, today]);
  useEffect(() => { load(); }, [load]);

  // Theo dõi sóng + hàng chờ; có sóng lại thì tự gửi
  useEffect(() => {
    startQueueSync(n => { say(`Đã gửi ${n} bản ghi lưu tạm lúc mất sóng`, 'success'); load(); onDataChanged?.(); });
    const onQ = () => setWaiting(queued().length);
    const onNet = () => setOnline(navigator.onLine);
    window.addEventListener('dqh-queue-changed', onQ);
    window.addEventListener('online', onNet); window.addEventListener('offline', onNet);
    return () => { window.removeEventListener('dqh-queue-changed', onQ); window.removeEventListener('online', onNet); window.removeEventListener('offline', onNet); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => {
    const in7 = addDays(today, 7);
    const overdue = tasks.filter(t => t.end_date && t.end_date < today);
    const dueToday = tasks.filter(t => t.end_date === today);
    const doing = tasks.filter(t => !overdue.includes(t) && !dueToday.includes(t) && /doing|review|in_progress|đang/i.test(t.status));
    const soon = tasks.filter(t => ![...overdue, ...dueToday, ...doing].includes(t) && t.end_date && t.end_date <= in7);
    return [
      { key: 'overdue', label: 'Trễ hạn', tone: 'text-rose-700 bg-rose-50', items: overdue },
      { key: 'today', label: 'Đến hạn hôm nay', tone: 'text-amber-700 bg-amber-50', items: dueToday },
      { key: 'doing', label: 'Đang làm', tone: 'text-indigo-700 bg-indigo-50', items: doing },
      { key: 'soon', label: '7 ngày tới', tone: 'text-slate-700 bg-slate-100', items: soon },
    ];
  }, [tasks, today]);

  const setTaskStatus = async (t: STask, status: 'DOING' | 'DONE') => {
    const upd: any = { status, updated_at: new Date().toISOString() };
    if (status === 'DONE') upd.progress = 100; else upd.progress = Math.max(t.progress || 0, 10);
    const { error } = await supabase.from('construction_tasks').update(upd).eq('id', t.id);
    if (error) return say(isNetworkError(error.message) ? 'Mất sóng — thử lại khi có mạng' : 'Lỗi cập nhật: ' + error.message, 'error');
    say(status === 'DONE' ? `Đã xong: ${t.name}` : `Bắt đầu: ${t.name}`, 'success');
    setTasks(prev => status === 'DONE' ? prev.filter(x => x.id !== t.id) : prev.map(x => x.id === t.id ? { ...x, ...upd } : x));
    onDataChanged?.();
  };

  const pending = active.filter(p => !submitted.has(p.id));
  const setTaskProgress = async (t: STask, progress: number) => {
    const upd: any = { progress, updated_at: new Date().toISOString() };
    if (progress > 0 && !/doing|review|in_progress|đang/i.test(t.status)) upd.status = 'DOING';
    const { error } = await supabase.from('construction_tasks').update(upd).eq('id', t.id);
    if (error) return say(isNetworkError(error.message) ? 'Mất sóng — thử lại khi có mạng' : 'Lỗi cập nhật: ' + error.message, 'error');
    setTasks(prev => prev.map(x => x.id === t.id ? { ...x, ...upd } : x));
    onDataChanged?.();
  };

  // Thao tác nhanh từ menu góc trên (?do=diary|GS-06|GS-08|materials|task)
  useEffect(() => {
    if (!action || loading) return;
    if (action === 'diary') {
      setTab('today');
      if (pending.length === 1) setDiaryFor(pending[0]);
      else if (!pending.length && active.length) say('Đã nộp đủ nhật ký hôm nay', 'success');
      // nhiều công trình chưa nộp: để danh sách hiện ra cho chọn
    } else if (action === 'materials') { setTab('site'); setSiteTab('materials'); }
    else if (action === 'changes') { setTab('site'); setSiteTab('changes'); }
    else if (action === 'task') setNewTaskOpen(true);
    else { const f = FORMS.find(x => x.code === action); if (f) setOpenForm(f); }
    onActionDone?.();
  }, [action, loading]); // eslint-disable-line react-hooks/exhaustive-deps
  const openForms = (f: SupervisorForm) => f.kind === 'diary' ? (setTab('today'), pending[0] && setDiaryFor(pending[0])) : f.kind === 'task' ? setNewTaskOpen(true) : setOpenForm(f);
  const lateCount = groups[0].items.length;
  const tabs: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: 'today', label: 'Hôm nay', icon: FileText, badge: pending.length + lateCount },
    { id: 'site', label: 'Vật tư · PS', icon: Package },
    { id: 'forms', label: 'Biểu mẫu', icon: FolderOpen },
  ];

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4">
      {(!online || waiting > 0) && (
        <div className={`rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2 ${online ? 'bg-amber-50 text-amber-800' : 'bg-slate-800 text-white'}`}>
          {online ? <CloudUpload className="w-4 h-4 shrink-0" /> : <WifiOff className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{online ? `${waiting} bản ghi đang chờ gửi` : `Mất sóng — cứ nộp bình thường, app tự gửi khi có mạng${waiting ? ` (${waiting} đang chờ)` : ''}`}</span>
          {online && waiting > 0 && <button onClick={async () => { const n = await flushQueue(); say(n ? `Đã gửi ${n} bản ghi` : 'Chưa gửi được, thử lại sau', n ? 'success' : 'error'); load(); }} className="px-2 py-1 rounded-md bg-amber-600 text-white">Gửi ngay</button>}
        </div>
      )}

      {/* Đồng hồ hạn nộp */}
      <div className={`rounded-2xl border p-4 flex items-center gap-4 ${cd.late && pending.length ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
        <Clock className={`w-8 h-8 shrink-0 ${cd.late && pending.length ? 'text-rose-600' : 'text-[#7A1216]'}`} />
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">Hạn nộp nhật ký ngày · 17:00</p>
          <p className="text-2xl font-bold text-slate-900 leading-tight">{pending.length === 0 && active.length ? 'Đã nộp đủ' : cd.late ? `Trễ ${cd.label}` : `Còn ${cd.label}`}</p>
          <p className="text-xs text-slate-500">{cd.weekday}, {ddmm(today)} · đã nộp {active.length - pending.length}/{active.length} công trình</p>
        </div>
      </div>

      {/* Thanh chọn: 3 mục */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${tab === t.id ? 'bg-white text-[#7A1216] shadow-sm' : 'text-slate-500'}`}>
            <t.icon className="w-4 h-4 shrink-0" /><span className="truncate">{t.label}</span>
            {!!t.badge && <span className="px-1.5 rounded-full bg-rose-600 text-white text-[10px]">{t.badge}</span>}
          </button>
        ))}
      </div>

      {loading && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải…</div>}
      {!loading && !active.length && <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-4">Chưa có công trình nào đang thi công được phân cho bạn.</p>}

      {/* HÔM NAY: nhật ký + việc */}
      {tab === 'today' && !loading && active.length > 0 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-800">Nhật ký ngày — mỗi công trình 1 lần, khoảng 30 giây</h2>
              <a href="/cong-truong" className="text-xs font-semibold text-[#7A1216] whitespace-nowrap">Nhật ký đầy đủ →</a>
            </div>
            {active.map(p => {
              const ok = submitted.has(p.id);
              return (
                <button key={p.id} onClick={() => !ok && setDiaryFor(p)} className={`w-full text-left rounded-2xl p-4 flex items-center gap-3 border transition-all ${ok ? 'bg-emerald-50 border-emerald-200' : 'bg-[#7A1216] border-[#7A1216] text-white active:scale-[0.99]'}`}>
                  {ok ? <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" /> : <FileText className="w-6 h-6 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${ok ? 'text-emerald-900' : ''}`}>{p.name}</p>
                    <p className={`text-xs ${ok ? 'text-emerald-700' : 'text-white/80'}`}>{ok ? 'Đã nộp hôm nay' : 'Chưa nộp · bấm để nộp'}</p>
                  </div>
                  {!ok && <ChevronRight className="w-5 h-5 shrink-0" />}
                </button>
              );
            })}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button onClick={() => setOpenForm(FORMS.find(x => x.code === 'GS-06')!)} className="rounded-xl p-3 text-left bg-white border border-slate-200 hover:border-slate-300"><AlertTriangle className="w-4 h-4 text-amber-600 mb-1" /><p className="font-bold text-slate-800 text-xs leading-snug">Báo sự cố</p></button>
              <button onClick={() => { setTab('site'); setSiteTab('materials'); }} className="rounded-xl p-3 text-left bg-white border border-slate-200 hover:border-slate-300"><Package className="w-4 h-4 text-[#7A1216] mb-1" /><p className="font-bold text-slate-800 text-xs leading-snug">Báo thiếu vật tư</p></button>
              <button onClick={() => setOpenForm(FORMS.find(x => x.code === 'GS-08')!)} className="rounded-xl p-3 text-left bg-white border border-slate-200 hover:border-slate-300"><CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1" /><p className="font-bold text-slate-800 text-xs leading-snug">Nghiệm thu</p></button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-800">Việc ở công trình</h2>
              <div className="flex gap-1.5">
                <button onClick={() => setNewTaskOpen(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#7A1216] text-white font-semibold text-xs"><Plus className="w-3.5 h-3.5" /> Giao việc</button>
                <button onClick={() => setTemplateOpen(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs"><LayoutTemplate className="w-3.5 h-3.5" /> Mẫu</button>
              </div>
            </div>
            {groups.map(g => g.items.length > 0 && (
              <div key={g.key}>
                <p className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md mb-2 ${g.tone}`}>{g.label} · {g.items.length}</p>
                <div className="space-y-2">
                  {g.items.slice(0, g.key === 'soon' ? 8 : 30).map(t => (
                    <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{t.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{nameOf(t.project_id)} · hạn {ddmm(t.end_date)}{t.assignee ? ` · ${t.assignee}` : ''}{t.progress ? ` · ${t.progress}%` : ''}</p>
                      </div>
                      <select aria-label={`% hoàn thành ${t.name}`} value={t.progress || 0} onChange={e => setTaskProgress(t, Number(e.target.value))} className="h-9 px-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white">
                        {[0, 10, 25, 50, 75, 90].map(n => <option key={n} value={n}>{n}%</option>)}
                      </select>
                      {!/doing|review|in_progress|đang/i.test(t.status) && <button onClick={() => setTaskStatus(t, 'DOING')} className="px-2.5 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold flex items-center gap-1" title="Bắt đầu"><Play className="w-3.5 h-3.5" />Làm</button>}
                      <button onClick={() => setTaskStatus(t, 'DONE')} className="px-2.5 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1" title="Xong"><Check className="w-3.5 h-3.5" />Xong</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {groups.every(g => !g.items.length) && <p className="text-sm text-slate-500">Không có việc nào trễ, đến hạn hoặc đang làm.</p>}
          </div>
        </div>
      )}

      {/* VẬT TƯ · PHÁT SINH */}
      {tab === 'site' && !loading && active.length > 0 && (
        <div className="space-y-3">
          <div className="inline-flex bg-slate-100 p-1 rounded-lg">
            {([['materials', 'Vật tư'], ['changes', 'Phát sinh']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setSiteTab(id)} className={`px-4 py-1.5 rounded-md text-xs font-semibold ${siteTab === id ? 'bg-white text-[#7A1216] shadow-sm' : 'text-slate-500'}`}>{label}</button>
            ))}
          </div>
          {siteTab === 'materials' && <MaterialsPanel projects={active} profile={profile} say={say} />}
          {siteTab === 'changes' && <ChangeOrdersPanel projects={active} profile={profile} say={say} onScheduled={() => { load(); onDataChanged?.(); }} />}
        </div>
      )}

      {/* BIỂU MẪU + QUY TRÌNH */}
      {tab === 'forms' && (
        <div className="space-y-2">
          {FORMS.map(f => (
            <button key={f.code} onClick={() => openForms(f)} className="w-full text-left bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 hover:border-slate-300">
              <span className={`text-[11px] font-bold px-2 py-1 rounded-md shrink-0 ${f.kind === 'diary' ? 'bg-[#7A1216] text-white' : 'bg-slate-100 text-slate-700'}`}>{f.code}</span>
              <span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-slate-800 truncate">{f.name}</span><span className="block text-[11px] text-slate-500">{f.when}</span></span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          ))}
          <button onClick={() => setShowSop(v => !v)} className="w-full flex items-center justify-between gap-2 mt-3 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold">
            <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Quy trình giám sát (6 bước)</span>
            <ChevronRight className={`w-4 h-4 transition-transform ${showSop ? 'rotate-90' : ''}`} />
          </button>
          {showSop && SOP_GROUPS.map(g => (
            <div key={g.n} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#7A1216] text-white text-sm font-bold flex items-center justify-center shrink-0">{g.n}</span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800">{g.name}</p>
                  <p className="text-sm text-slate-600 mt-1">{g.text}</p>
                  <p className="text-xs font-semibold text-slate-800 mt-2">Hạn: {g.sla}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {FORMS.filter(f => f.group === g.n).map(f => (
                      <button key={f.code} onClick={() => openForms(f)} className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200">{f.code}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {diaryFor && <DiaryModal project={diaryFor} profile={profile} tasks={tasks.filter(t => t.project_id === diaryFor.id)} onClose={() => setDiaryFor(null)} onSaved={(q, doneIds) => {
        const p = diaryFor; setDiaryFor(null);
        say(q ? 'Mất sóng: đã lưu tạm nhật ký, có mạng app tự gửi' : 'Đã nộp nhật ký', 'success');
        setSubmitted(prev => new Set([...prev, p.id]));
        if (doneIds.length) setTasks(prev => prev.filter(t => !doneIds.includes(t.id)));
        if (!q) { load(); onDataChanged?.(); }
      }} say={say} />}
      {openForm && <NoteFormModal form={openForm} projects={active} profile={profile} onClose={() => setOpenForm(null)} onSaved={(q) => { const c = openForm.code; setOpenForm(null); say(q ? `Mất sóng: đã lưu tạm ${c}` : `Đã lưu ${c}`, 'success'); }} say={say} />}
      {templateOpen && <TemplateModal projects={active} say={say} onClose={() => setTemplateOpen(false)} onSaved={() => { setTemplateOpen(false); say('Đã nạp mẫu tiến độ', 'success'); load(); onDataChanged?.(); }} />}
      {newTaskOpen && <NewTaskModal projects={active} onClose={() => setNewTaskOpen(false)} onSaved={(q) => { setNewTaskOpen(false); say(q ? 'Mất sóng: đã lưu tạm việc giao' : 'Đã giao việc', 'success'); if (!q) { load(); onDataChanged?.(); } }} say={say} />}
    </div>
  );
}

/* ---------- GS-07 Nhật ký ngày: bản nhanh 30 giây ---------- */
const WORKER_CHIPS = [2, 3, 4, 6, 8, 10];
function DiaryModal({ project, profile, tasks, onClose, onSaved, say }: { project: Project; profile: Profile; tasks: STask[]; onClose: () => void; onSaved: (queued: boolean, doneTaskIds: string[]) => void; say: Notify }) {
  const [v, setV] = useState<Record<string, any>>({ mat_bang: 'Sẵn sàng', loai: '', ho_tro: 'Không cần', progress: '' });
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [last, setLast] = useState<{ team_name?: string | null; tomorrow_plan?: string | null; main_workers?: number | null } | null>(null);
  const set = (k: string, val: any) => setV(p => ({ ...p, [k]: val }));

  // Lấy nhật ký gần nhất của công trình để điền sẵn (đội, số công, việc hôm qua hẹn làm hôm nay)
  useEffect(() => {
    let off = false;
    supabase.from('daily_logs').select('team_name, tomorrow_plan, main_workers').eq('project_id', project.id).lt('date', todayVN()).order('date', { ascending: false }).limit(1)
      .then(({ data }) => {
        const l = data?.[0];
        if (off || !l) return;
        setLast(l);
        setV(p => ({ ...p, doi: p.doi || l.team_name || '', so_cong: p.so_cong || (l.main_workers ? String(l.main_workers) : '') }));
      });
    return () => { off = true; };
  }, [project.id]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!navigator.onLine) return say('Mất sóng: chưa tải ảnh được. Nộp chữ trước, có sóng chụp bổ sung ở GS-08 hoặc gửi Zalo.', 'error');
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).slice(0, 10)) urls.push(await uploadImageToStorage(f));
      setPhotos(p => [...p, ...urls]);
    } catch (e: any) { say('Lỗi tải ảnh: ' + (e?.message || e), 'error'); }
    finally { setUploading(false); }
  };

  const save = async () => {
    const lam = String(v.hang_muc || '').trim() || tasks.filter(t => doneIds.includes(t.id)).map(t => t.name).join(', ');
    if (!lam || !v.so_cong) return say('Điền 2 ô: hôm nay làm gì, và số thợ', 'error');
    setBusy(true);
    const doneNames = tasks.filter(t => doneIds.includes(t.id)).map(t => t.name);
    const lines = [
      v.khu_vuc && `Khu vực: ${v.khu_vuc}`,
      v.doi && `Đội thi công: ${v.doi}`,
      `Số công có mặt: ${v.so_cong}`,
      v.mat_bang !== 'Sẵn sàng' && `Tình trạng mặt bằng: ${v.mat_bang}`,
      `Hôm nay: ${lam}${v.progress !== '' ? ` — ${v.progress}%` : ''}`,
      doneNames.length && `Xong: ${doneNames.join(', ')}`,
      v.vuong && `Vướng mắc${v.loai ? ' (' + v.loai + ')' : ''}: ${v.vuong}`,
      v.ho_tro && v.ho_tro !== 'Không cần' && `Cần hỗ trợ từ: ${v.ho_tro}`,
      v.mai && `Kế hoạch mai: ${v.mai}`,
    ].filter(Boolean).join('\n');
    const row: Record<string, any> = {
      project_id: project.id, date: todayVN(), content: lines, notes: lines,
      work_item: lam, task_category: lam, task_progress: v.progress === '' ? null : Number(v.progress),
      main_workers: Number(v.so_cong) || 0, helper_workers: 0, weather: 'sunny/sunny', photo_urls: photos,
      status: 'pending', reporter_name: profile?.full_name || '', created_by: 'ENGINEER', editable: true,
      engineer_id: profile?.id || null, team_name: v.doi || null, today_summary: `${lam}${v.progress !== '' ? ' ' + v.progress + '%' : ''}`,
      tomorrow_plan: v.mai || null, is_issue: !!v.vuong,
    };
    const r = await saveOrQueue('daily_logs', row, `Nhật ký ${project.name}`, ['project_id', 'date', 'notes', 'content', 'main_workers', 'photo_urls', 'status', 'reporter_name', 'created_by', 'engineer_id', 'weather']);
    if (!r.ok) { setBusy(false); return say('Lỗi lưu nhật ký: ' + r.error, 'error'); }
    // Việc đã tick "xong hôm nay" -> cập nhật tiến độ (có sóng mới làm được)
    if (doneIds.length && !r.queued) {
      await supabase.from('construction_tasks').update({ status: 'DONE', progress: 100, updated_at: new Date().toISOString() }).in('id', doneIds);
    }
    setBusy(false);
    onSaved(r.queued, r.queued ? [] : doneIds);
  };

  const chip = (on: boolean) => `px-3 py-2 rounded-lg text-xs font-semibold border ${on ? 'bg-[#7A1216] text-white border-[#7A1216]' : 'bg-white text-slate-700 border-slate-200'}`;
  return (
    <Sheet title="Nhật ký ngày · GS-07" sub={project.name} onClose={onClose} footer={<SaveBtn busy={busy || uploading} onClick={save} label={navigator.onLine ? 'Nộp nhật ký' : 'Lưu tạm (mất sóng)'} />}>
      {tasks.length > 0 && (
        <div><Label>Việc xong hôm nay (bấm chọn)</Label>
          <div className="flex flex-wrap gap-1.5">{tasks.slice(0, 12).map(t => (
            <button key={t.id} onClick={() => setDoneIds(p => p.includes(t.id) ? p.filter(x => x !== t.id) : [...p, t.id])} className={chip(doneIds.includes(t.id))}>{doneIds.includes(t.id) && '✓ '}{t.name}</button>
          ))}</div>
        </div>
      )}
      <div><Label req>Hôm nay làm gì</Label>
        <textarea rows={2} className={inputCls} value={v.hang_muc || ''} onChange={e => set('hang_muc', e.target.value)} placeholder={last?.tomorrow_plan ? `Hôm qua hẹn: ${last.tomorrow_plan}` : 'Bắn vách bếp, gắn phụ kiện tủ áo'} />
        {last?.tomorrow_plan && !v.hang_muc && <button onClick={() => set('hang_muc', last.tomorrow_plan)} className="mt-1 text-[11px] font-semibold text-[#7A1216]">↳ Đúng như hôm qua hẹn</button>}
      </div>
      <div><Label req>Số thợ có mặt</Label>
        <div className="flex flex-wrap gap-1.5 items-center">
          {WORKER_CHIPS.map(n => <button key={n} onClick={() => set('so_cong', String(n))} className={chip(String(n) === String(v.so_cong))}>{n}</button>)}
          <input type="number" inputMode="numeric" min={0} className={inputCls + ' !w-20'} value={v.so_cong || ''} onChange={e => set('so_cong', e.target.value)} placeholder="khác" />
        </div>
      </div>
      <div><Label>Ảnh hiện trường (nên ≥ 3 ảnh)</Label>
        <div className="flex flex-wrap gap-2">
          {photos.map(u => <img key={u} src={u} className="w-16 h-16 object-cover rounded-lg border border-slate-200" />)}
          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 cursor-pointer">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => upload(e.target.files)} />
          </label>
        </div>
      </div>
      <div><Label>Vướng mắc (nếu có)</Label><textarea rows={2} className={inputCls} value={v.vuong || ''} onChange={e => set('vuong', e.target.value)} placeholder="Thiếu cây U nhôm, thiếu ổ khoá cửa phòng" /></div>
      {v.vuong && (
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Loại</Label><select className={inputCls} value={v.loai} onChange={e => set('loai', e.target.value)}><option value="">—</option>{ISSUE_TYPES.map(o => <option key={o}>{o}</option>)}</select></div>
          <div><Label>Cần hỗ trợ từ</Label><select className={inputCls} value={v.ho_tro} onChange={e => set('ho_tro', e.target.value)}>{SUPPORT_FROM.map(o => <option key={o}>{o}</option>)}</select></div>
        </div>
      )}
      <button onClick={() => setMore(m => !m)} className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 py-1">
        <span>Chi tiết thêm: khu vực, đội, mặt bằng, %, kế hoạch mai</span><ChevronRight className={`w-4 h-4 transition-transform ${more ? 'rotate-90' : ''}`} />
      </button>
      {more && (<>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Khu vực</Label><input className={inputCls} value={v.khu_vuc || ''} onChange={e => set('khu_vuc', e.target.value)} placeholder="Tầng 1 bếp" /></div>
          <div><Label>Đội thi công</Label><input className={inputCls} value={v.doi || ''} onChange={e => set('doi', e.target.value)} placeholder="Tổ anh Cường" /></div>
        </div>
        <div><Label>Tình trạng mặt bằng</Label>
          <div className="grid grid-cols-3 gap-1.5">{['Sẵn sàng', 'Vướng một phần', 'Chưa làm được'].map(o => <button key={o} onClick={() => set('mat_bang', o)} className={chip(v.mat_bang === o)}>{o}</button>)}</div>
        </div>
        <div><Label>% hoàn thành hạng mục</Label>
          <div className="flex flex-wrap gap-1.5">{[25, 50, 75, 100].map(n => <button key={n} onClick={() => set('progress', String(n))} className={chip(String(n) === String(v.progress))}>{n}%</button>)}</div>
        </div>
        <div><Label>Kế hoạch ngày mai</Label><textarea rows={2} className={inputCls} value={v.mai || ''} onChange={e => set('mai', e.target.value)} placeholder="Dặm màu, gắn U nhôm" /></div>
      </>)}
    </Sheet>
  );
}

/* ---------- Biên bản GS-01..10 (ghi ai_notes) ---------- */
function FieldInput({ f, value, onChange }: { f: FormField; value: any; onChange: (v: any) => void }) {
  if (f.type === 'textarea') return <textarea rows={2} className={inputCls} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={f.placeholder} />;
  if (f.type === 'select') return <select className={inputCls} value={value || ''} onChange={e => onChange(e.target.value)}><option value="">—</option>{f.options!.map(o => <option key={o}>{o}</option>)}</select>;
  if (f.type === 'checks') {
    const cur: string[] = Array.isArray(value) ? value : [];
    return <div className="space-y-1.5">{f.options!.map(o => (
      <label key={o} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" className="w-4 h-4 accent-[#7A1216]" checked={cur.includes(o)} onChange={e => onChange(e.target.checked ? [...cur, o] : cur.filter(x => x !== o))} />{o}</label>
    ))}</div>;
  }
  return <input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} className={inputCls} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={f.placeholder} />;
}

function NoteFormModal({ form, projects, profile, onClose, onSaved, say }: { form: SupervisorForm; projects: Project[]; profile: Profile; onClose: () => void; onSaved: (queued: boolean) => void; say: Notify }) {
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [v, setV] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!navigator.onLine) return say('Mất sóng: chưa tải ảnh được, lưu chữ trước rồi bổ sung ảnh sau.', 'error');
    setUploading(true);
    try { const urls: string[] = []; for (const f of Array.from(files).slice(0, 10)) urls.push(await uploadImageToStorage(f)); setPhotos(p => [...p, ...urls]); }
    catch (e: any) { say('Lỗi tải ảnh: ' + (e?.message || e), 'error'); }
    finally { setUploading(false); }
  };
  const save = async () => {
    const miss = form.fields.filter(f => f.required && (v[f.key] == null || v[f.key] === ''));
    if (!projectId) return say('Chọn công trình', 'error');
    if (miss.length) return say('Điền: ' + miss.map(f => f.label).join(', '), 'error');
    setBusy(true);
    const isIssue = form.noteKind === 'van_de' || (form.code === 'GS-05' && v.tinh_trang && v.tinh_trang !== 'Đủ, đạt') || (form.code === 'GS-08' && String(v.ket_luan || '').startsWith('Không'));
    const r = await saveOrQueue('ai_notes', {
      project_id: projectId, project_source: 'construction', author_id: profile?.id || null,
      kind: form.noteKind || 'bien_ban', title: `${form.code} · ${form.name}`, content: formatForm(form, v) + (photos.length ? `\nẢnh hiện trường:\n${photos.join('\n')}` : ''), is_issue: !!isIssue,
    }, `${form.code} ${form.name}`);
    setBusy(false);
    if (!r.ok) return say(/ai_notes/.test(r.error) ? 'Chưa bật bảng biểu mẫu: cần chạy file cập nhật dữ liệu (migration) trước.' : 'Lỗi lưu: ' + r.error, 'error');
    onSaved(r.queued);
  };
  return (
    <Sheet title={`${form.code} · ${form.name}`} sub={form.when} onClose={onClose} footer={<SaveBtn busy={busy || uploading} onClick={save} label="Lưu biểu mẫu" />}>
      <div><Label req>Công trình</Label><select className={inputCls} value={projectId} onChange={e => setProjectId(e.target.value)}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      {form.code === 'GS-06' && v.doi_chi_phi?.startsWith('Có') && (
        <div className="flex gap-2 p-3 rounded-xl bg-amber-50 text-amber-800 text-xs"><AlertTriangle className="w-4 h-4 shrink-0" />Chỉ làm sau khi khách ký phiếu phát sinh.</div>
      )}
      {form.fields.map(f => <div key={f.key}><Label req={f.required}>{f.label}</Label><FieldInput f={f} value={v[f.key]} onChange={val => setV(p => ({ ...p, [f.key]: val }))} /></div>)}
      <div><Label>Ảnh hiện trường</Label>
        <div className="flex flex-wrap gap-2">
          {photos.map(u => <img key={u} src={u} alt="" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />)}
          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-500 cursor-pointer" aria-label="Chụp hoặc chọn ảnh">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={e => upload(e.target.files)} />
          </label>
        </div>
      </div>
    </Sheet>
  );
}

/* ---------- GS-04 Giao việc cho tổ ---------- */
function NewTaskModal({ projects, onClose, onSaved, say }: { projects: Project[]; onClose: () => void; onSaved: (queued: boolean) => void; say: Notify }) {
  const [v, setV] = useState<Record<string, any>>({ project_id: projects[0]?.id || '', due: todayVN() });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!v.project_id || !v.name || !v.to) return say('Điền đủ: công trình, việc, tổ/người làm', 'error');
    setBusy(true);
    const r = await saveOrQueue('construction_tasks', {
      project_id: v.project_id, name: String(v.name).trim(), category: 'Giao việc đầu ngày', status: 'TODO',
      start_date: todayVN(), end_date: v.due || todayVN(), days: 1, progress: 0, note: v.note || '', assignee: String(v.to).trim(),
      priority: 'Trung bình', budget: 0, spent: 0, checklist: [], issues: [], tags: [], dependencies: [], approved: false, subcontractor: '',
    }, `Giao việc: ${v.name}`);
    setBusy(false);
    if (!r.ok) return say('Lỗi giao việc: ' + r.error, 'error');
    onSaved(r.queued);
  };
  return (
    <Sheet title="Giao việc cho tổ · GS-04" onClose={onClose} footer={<SaveBtn busy={busy} onClick={save} label="Giao việc" />}>
      <div><Label req>Công trình</Label><select className={inputCls} value={v.project_id} onChange={e => setV(p => ({ ...p, project_id: e.target.value }))}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      <div><Label req>Việc cần làm</Label><input className={inputCls} value={v.name || ''} onChange={e => setV(p => ({ ...p, name: e.target.value }))} placeholder="Lắp tủ áo phòng master" /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label req>Tổ / người làm</Label><input className={inputCls} value={v.to || ''} onChange={e => setV(p => ({ ...p, to: e.target.value }))} placeholder="Tổ anh Cường" /></div>
        <div><Label>Hạn</Label><input type="date" className={inputCls} value={v.due} onChange={e => setV(p => ({ ...p, due: e.target.value }))} /></div>
      </div>
      <div><Label>Ghi chú / tiêu chuẩn</Label><textarea rows={2} className={inputCls} value={v.note || ''} onChange={e => setV(p => ({ ...p, note: e.target.value }))} /></div>
    </Sheet>
  );
}
