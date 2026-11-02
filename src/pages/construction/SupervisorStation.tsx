// Trạm giám sát: một màn hình cho giám sát công trình — nộp nhật ký trước 17:00, làm việc trong ngày,
// tra quy trình và điền biểu mẫu GS-01 → GS-10. Dữ liệu ghi thẳng vào bảng của app (daily_logs,
// construction_tasks, ai_notes) nên Kanban, Nhật ký và trợ lý AI đều thấy ngay.
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Package, FilePlus2, LayoutTemplate, Clock, FileText, ListChecks, BookOpen, FolderOpen, CheckCircle2, AlertTriangle, Camera, X, Plus, Play, Check, ChevronRight, Loader2 } from 'lucide-react';
import { supabase, uploadImageToStorage } from '../../services/supabase';
import type { Project } from './types';
import { Sheet, inputCls, Label, SaveBtn } from './stationUi';
import { MaterialsPanel, ChangeOrdersPanel, TemplateModal } from './SiteModules';
import { FORMS, SOP_GROUPS, ISSUE_TYPES, SUPPORT_FROM, formatForm, type SupervisorForm, type FormField } from './supervisorForms';

type Notify = (msg: string, type?: 'success' | 'error' | 'info') => void;
type Profile = { id?: string; full_name?: string | null; role?: string | null } | null | undefined;
type STask = { id: string; project_id: string; name: string; status: string; start_date: string | null; end_date: string | null; progress: number | null; assignee: string | null };
type Tab = 'report' | 'tasks' | 'materials' | 'changes' | 'sop' | 'forms';

const vnNow = () => new Date(Date.now() + 7 * 3600_000);
const todayVN = () => vnNow().toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const ddmm = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—');
const isDone = (s?: string | null) => ['done', 'hoàn thành', 'completed'].includes(String(s || '').toLowerCase());
const isClosedProject = (s?: string) => ['completed', 'done', 'hoàn thành', 'cancelled', 'đã bàn giao', 'archived'].includes(String(s || '').toLowerCase());

/** Ghi 1 dòng; nếu database chưa có cột mới (chưa chạy migration) thì ghi lại với các cột cơ bản. */
async function insertWithFallback(table: string, full: Record<string, any>, basicKeys: string[]) {
  const r1 = await supabase.from(table).insert(full);
  if (!r1.error) return null;
  if (!/column|schema cache/i.test(r1.error.message)) return r1.error.message;
  const basic = Object.fromEntries(Object.entries(full).filter(([k]) => basicKeys.includes(k)));
  const r2 = await supabase.from(table).insert(basic);
  return r2.error ? r2.error.message : null;
}

function useCountdown() {
  const [now, setNow] = useState(vnNow());
  useEffect(() => { const t = setInterval(() => setNow(vnNow()), 30_000); return () => clearInterval(t); }, []);
  const deadline = new Date(now.toISOString().slice(0, 10) + 'T17:00:00Z');
  const ms = deadline.getTime() - now.getTime();
  const h = Math.floor(Math.abs(ms) / 3600_000), m = Math.floor((Math.abs(ms) % 3600_000) / 60_000);
  return { late: ms < 0, label: `${h > 0 ? h + ' giờ ' : ''}${m} phút`, weekday: ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][now.getUTCDay()] };
}

export function SupervisorStation({ projects, profile, notify, onDataChanged }: { projects: Project[]; profile: Profile; notify?: Notify; onDataChanged?: () => void }) {
  const say: Notify = notify || ((m) => alert(m));
  const [tab, setTab] = useState<Tab>('report');
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [tasks, setTasks] = useState<STask[]>([]);
  const [loading, setLoading] = useState(true);
  const [diaryFor, setDiaryFor] = useState<Project | null>(null);
  const [openForm, setOpenForm] = useState<SupervisorForm | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
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
    setSubmitted(new Set((logs.data || []).map((l: any) => l.project_id)));
    setTasks(((ts.data || []) as STask[]).filter(t => !isDone(t.status)));
    setLoading(false);
  }, [ids, today]);
  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    const in7 = addDays(today, 7);
    const overdue = tasks.filter(t => t.end_date && t.end_date < today);
    const dueToday = tasks.filter(t => t.end_date === today);
    const doing = tasks.filter(t => !overdue.includes(t) && !dueToday.includes(t) && /doing|review|in_progress/i.test(t.status));
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
    if (error) return say('Lỗi cập nhật: ' + error.message, 'error');
    say(status === 'DONE' ? `Đã xong: ${t.name}` : `Bắt đầu: ${t.name}`, 'success');
    setTasks(prev => status === 'DONE' ? prev.filter(x => x.id !== t.id) : prev.map(x => x.id === t.id ? { ...x, ...upd } : x));
    onDataChanged?.();
  };

  const pending = active.filter(p => !submitted.has(p.id));
  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'report', label: 'Báo cáo', icon: FileText },
    { id: 'tasks', label: 'Việc', icon: ListChecks },
    { id: 'materials', label: 'Vật tư', icon: Package },
    { id: 'changes', label: 'Phát sinh', icon: FilePlus2 },
    { id: 'sop', label: 'Quy trình', icon: BookOpen },
    { id: 'forms', label: 'Biểu mẫu', icon: FolderOpen },
  ];

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4">
      {/* Đồng hồ hạn nộp */}
      <div className={`rounded-2xl border p-4 flex items-center gap-4 ${cd.late && pending.length ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
        <Clock className={`w-8 h-8 shrink-0 ${cd.late && pending.length ? 'text-rose-600' : 'text-[#7A1216]'}`} />
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">Hạn nộp nhật ký ngày · 17:00</p>
          <p className="text-2xl font-bold text-slate-900 leading-tight">{pending.length === 0 && active.length ? 'Đã nộp đủ' : cd.late ? `Trễ ${cd.label}` : `Còn ${cd.label}`}</p>
          <p className="text-xs text-slate-500">{cd.weekday}, {ddmm(today)} · đã nộp {active.length - pending.length}/{active.length} công trình</p>
        </div>
      </div>

      {/* Thanh chọn */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-slate-100 p-1 rounded-xl">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t.id ? 'bg-white text-[#7A1216] shadow-sm' : 'text-slate-500'}`}>
            <t.icon className="w-4 h-4" />{t.label}
            {t.id === 'tasks' && groups[0].items.length > 0 && <span className="ml-0.5 px-1.5 rounded-full bg-rose-600 text-white text-[10px]">{groups[0].items.length}</span>}
          </button>
        ))}
      </div>

      {loading && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải…</div>}
      {!loading && !active.length && <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-4">Chưa có công trình nào đang thi công được phân cho bạn.</p>}

      {/* BÁO CÁO */}
      {tab === 'report' && !loading && active.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800">Nhật ký ngày (GS-07) — mỗi công trình 1 lần</h2>
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
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button onClick={() => setTab('materials')} className="rounded-2xl p-4 text-left bg-white border border-slate-200 hover:border-slate-300"><p className="text-[11px] font-bold text-[#7A1216]">VẬT TƯ</p><p className="font-bold text-slate-800 text-sm leading-snug">Báo thiếu, theo dõi hàng về</p></button>
            <button onClick={() => setTab('changes')} className="rounded-2xl p-4 text-left bg-white border border-slate-200 hover:border-slate-300"><p className="text-[11px] font-bold text-[#7A1216]">PHÁT SINH</p><p className="font-bold text-slate-800 text-sm leading-snug">Lập phiếu, chờ khách đồng ý</p></button>
            {['GS-06', 'GS-08'].map(code => { const f = FORMS.find(x => x.code === code)!; return (
              <button key={code} onClick={() => setOpenForm(f)} className="rounded-2xl p-4 text-left bg-white border border-slate-200 hover:border-slate-300">
                <p className="text-[11px] font-bold text-[#7A1216]">{f.code}</p>
                <p className="font-bold text-slate-800 text-sm leading-snug">{f.name}</p>
                <p className="text-[11px] text-slate-500 mt-1">{f.when}</p>
              </button>
            ); })}
          </div>
        </div>
      )}

      {/* VIỆC */}
      {tab === 'tasks' && !loading && active.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setNewTaskOpen(true)} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#7A1216] text-white font-semibold text-sm"><Plus className="w-4 h-4" /> Giao việc cho tổ</button>
            <button onClick={() => setTemplateOpen(true)} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm"><LayoutTemplate className="w-4 h-4" /> Nạp mẫu tiến độ</button>
          </div>
          {groups.map(g => g.items.length > 0 && (
            <div key={g.key}>
              <p className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md mb-2 ${g.tone}`}>{g.label} · {g.items.length}</p>
              <div className="space-y-2">
                {g.items.map(t => (
                  <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{t.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{nameOf(t.project_id)} · hạn {ddmm(t.end_date)}{t.assignee ? ` · ${t.assignee}` : ''}{t.progress ? ` · ${t.progress}%` : ''}</p>
                    </div>
                    {!/doing|review|in_progress/i.test(t.status) && <button onClick={() => setTaskStatus(t, 'DOING')} className="p-2 rounded-lg bg-indigo-50 text-indigo-700" title="Bắt đầu"><Play className="w-4 h-4" /></button>}
                    <button onClick={() => setTaskStatus(t, 'DONE')} className="p-2 rounded-lg bg-emerald-50 text-emerald-700" title="Xong"><Check className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {groups.every(g => !g.items.length) && <p className="text-sm text-slate-500">Không có việc nào trễ, đến hạn hoặc đang làm.</p>}
        </div>
      )}

      {/* VẬT TƯ */}
      {tab === 'materials' && !loading && active.length > 0 && <MaterialsPanel projects={active} profile={profile} say={say} />}

      {/* PHÁT SINH */}
      {tab === 'changes' && !loading && active.length > 0 && <ChangeOrdersPanel projects={active} profile={profile} say={say} onScheduled={() => { load(); onDataChanged?.(); }} />}

      {/* QUY TRÌNH */}
      {tab === 'sop' && (
        <div className="space-y-3">
          {SOP_GROUPS.map(g => (
            <div key={g.n} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#7A1216] text-white text-sm font-bold flex items-center justify-center shrink-0">{g.n}</span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800">{g.name}</p>
                  <p className="text-sm text-slate-600 mt-1">{g.text}</p>
                  <p className="text-xs font-semibold text-slate-800 mt-2">Hạn: {g.sla}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {FORMS.filter(f => f.group === g.n).map(f => (
                      <button key={f.code} onClick={() => f.kind === 'diary' ? setTab('report') : f.kind === 'task' ? setNewTaskOpen(true) : setOpenForm(f)} className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200">{f.code}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BIỂU MẪU */}
      {tab === 'forms' && (
        <div className="space-y-2">
          {FORMS.map(f => (
            <button key={f.code} onClick={() => f.kind === 'diary' ? setTab('report') : f.kind === 'task' ? setNewTaskOpen(true) : setOpenForm(f)} className="w-full text-left bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 hover:border-slate-300">
              <span className={`text-[11px] font-bold px-2 py-1 rounded-md shrink-0 ${f.kind === 'diary' ? 'bg-[#7A1216] text-white' : 'bg-slate-100 text-slate-700'}`}>{f.code}</span>
              <span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-slate-800 truncate">{f.name}</span><span className="block text-[11px] text-slate-500">{f.when}</span></span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {diaryFor && <DiaryModal project={diaryFor} profile={profile} tasks={tasks.filter(t => t.project_id === diaryFor.id)} onClose={() => setDiaryFor(null)} onSaved={() => { setDiaryFor(null); say('Đã nộp nhật ký', 'success'); load(); onDataChanged?.(); }} say={say} />}
      {openForm && <NoteFormModal form={openForm} projects={active} profile={profile} onClose={() => setOpenForm(null)} onSaved={() => { setOpenForm(null); say(`Đã lưu ${openForm.code}`, 'success'); }} say={say} />}
      {templateOpen && <TemplateModal projects={active} say={say} onClose={() => setTemplateOpen(false)} onSaved={() => { setTemplateOpen(false); say('Đã nạp mẫu tiến độ', 'success'); load(); onDataChanged?.(); }} />}
      {newTaskOpen && <NewTaskModal projects={active} onClose={() => setNewTaskOpen(false)} onSaved={() => { setNewTaskOpen(false); say('Đã giao việc', 'success'); load(); onDataChanged?.(); }} say={say} />}
    </div>
  );
}

/* ---------- GS-07 Nhật ký ngày ---------- */
function DiaryModal({ project, profile, tasks, onClose, onSaved, say }: { project: Project; profile: Profile; tasks: STask[]; onClose: () => void; onSaved: () => void; say: Notify }) {
  const [v, setV] = useState<Record<string, any>>({ mat_bang: 'Sẵn sàng', loai: '', ho_tro: 'Không cần', progress: '' });
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: string, val: any) => setV(p => ({ ...p, [k]: val }));

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).slice(0, 10)) urls.push(await uploadImageToStorage(f));
      setPhotos(p => [...p, ...urls]);
    } catch (e: any) { say('Lỗi tải ảnh: ' + (e?.message || e), 'error'); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!v.khu_vuc || !v.hang_muc || !v.so_cong || !v.mai) return say('Điền đủ: khu vực, số công, hạng mục, kế hoạch mai', 'error');
    setBusy(true);
    const lines = [
      `Khu vực: ${v.khu_vuc}`,
      v.doi && `Đội thi công: ${v.doi}`,
      `Số công có mặt: ${v.so_cong}`,
      `Tình trạng mặt bằng: ${v.mat_bang}`,
      `Hạng mục: ${v.hang_muc}${v.progress !== '' ? ` — ${v.progress}%` : ''}`,
      v.vuong && `Vướng mắc${v.loai ? ' (' + v.loai + ')' : ''}: ${v.vuong}`,
      v.ho_tro && v.ho_tro !== 'Không cần' && `Cần hỗ trợ từ: ${v.ho_tro}`,
      `Kế hoạch mai: ${v.mai}`,
    ].filter(Boolean).join('\n');
    const row: Record<string, any> = {
      project_id: project.id, date: todayVN(), content: lines, notes: lines,
      work_item: v.hang_muc, task_category: v.hang_muc, task_progress: v.progress === '' ? null : Number(v.progress),
      main_workers: Number(v.so_cong) || 0, helper_workers: 0, weather: 'sunny/sunny', photo_urls: photos,
      status: 'pending', reporter_name: profile?.full_name || '', created_by: 'ENGINEER', editable: true,
      engineer_id: profile?.id || null, team_name: v.doi || null, today_summary: `${v.hang_muc}${v.progress !== '' ? ' ' + v.progress + '%' : ''}`,
      tomorrow_plan: v.mai, is_issue: !!v.vuong,
    };
    const err = await insertWithFallback('daily_logs', row, ['project_id', 'date', 'notes', 'content', 'main_workers', 'photo_urls', 'status', 'reporter_name', 'created_by', 'engineer_id', 'weather']);
    setBusy(false);
    if (err) return say('Lỗi lưu nhật ký: ' + err, 'error');
    onSaved();
  };

  return (
    <Sheet title="Nhật ký ngày · GS-07" sub={project.name} onClose={onClose} footer={<SaveBtn busy={busy || uploading} onClick={save} label="Nộp nhật ký" />}>
      <div><Label req>Khu vực thi công trong ngày</Label><input className={inputCls} value={v.khu_vuc || ''} onChange={e => set('khu_vuc', e.target.value)} placeholder="Tầng 1 bếp, tầng 3 phòng master" /></div>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2"><Label>Đội thi công</Label><input className={inputCls} value={v.doi || ''} onChange={e => set('doi', e.target.value)} placeholder="Tổ anh Cường" /></div>
        <div><Label req>Số công</Label><input type="number" inputMode="numeric" min={0} className={inputCls} value={v.so_cong || ''} onChange={e => set('so_cong', e.target.value)} /></div>
      </div>
      <div><Label>Tình trạng mặt bằng</Label>
        <div className="grid grid-cols-3 gap-1.5">{['Sẵn sàng', 'Vướng một phần', 'Chưa làm được'].map(o => <button key={o} onClick={() => set('mat_bang', o)} className={`py-2 rounded-lg text-xs font-semibold border ${v.mat_bang === o ? 'bg-[#7A1216] text-white border-[#7A1216]' : 'bg-white text-slate-700 border-slate-200'}`}>{o}</button>)}</div>
      </div>
      <div><Label req>Hạng mục thực hiện</Label>
        <input list="gs07-tasks" className={inputCls} value={v.hang_muc || ''} onChange={e => set('hang_muc', e.target.value)} placeholder="Bắn vách bếp, gắn phụ kiện" />
        <datalist id="gs07-tasks">{tasks.map(t => <option key={t.id} value={t.name} />)}</datalist>
      </div>
      <div><Label>% hoàn thành hạng mục</Label><input type="number" inputMode="numeric" min={0} max={100} className={inputCls} value={v.progress} onChange={e => set('progress', e.target.value)} placeholder="70" /></div>
      <div><Label>Vướng mắc / phát sinh</Label><textarea rows={2} className={inputCls} value={v.vuong || ''} onChange={e => set('vuong', e.target.value)} placeholder="Thiếu cây U nhôm, thiếu ổ khoá cửa phòng" /></div>
      {v.vuong && (
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Loại</Label><select className={inputCls} value={v.loai} onChange={e => set('loai', e.target.value)}><option value="">—</option>{ISSUE_TYPES.map(o => <option key={o}>{o}</option>)}</select></div>
          <div><Label>Cần hỗ trợ từ</Label><select className={inputCls} value={v.ho_tro} onChange={e => set('ho_tro', e.target.value)}>{SUPPORT_FROM.map(o => <option key={o}>{o}</option>)}</select></div>
        </div>
      )}
      <div><Label req>Kế hoạch ngày mai</Label><textarea rows={2} className={inputCls} value={v.mai || ''} onChange={e => set('mai', e.target.value)} placeholder="Dặm màu, gắn U nhôm, gắn giường master" /></div>
      <div><Label>Ảnh hiện trường (nên ≥ 3 ảnh)</Label>
        <div className="flex flex-wrap gap-2">
          {photos.map(u => <img key={u} src={u} className="w-16 h-16 object-cover rounded-lg border border-slate-200" />)}
          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 cursor-pointer">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => upload(e.target.files)} />
          </label>
        </div>
      </div>
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

function NoteFormModal({ form, projects, profile, onClose, onSaved, say }: { form: SupervisorForm; projects: Project[]; profile: Profile; onClose: () => void; onSaved: () => void; say: Notify }) {
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [v, setV] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const miss = form.fields.filter(f => f.required && (v[f.key] == null || v[f.key] === ''));
    if (!projectId) return say('Chọn công trình', 'error');
    if (miss.length) return say('Điền: ' + miss.map(f => f.label).join(', '), 'error');
    setBusy(true);
    const isIssue = form.noteKind === 'van_de' || (form.code === 'GS-05' && v.tinh_trang && v.tinh_trang !== 'Đủ, đạt') || (form.code === 'GS-08' && String(v.ket_luan || '').startsWith('Không'));
    const { error } = await supabase.from('ai_notes').insert({
      project_id: projectId, project_source: 'construction', author_id: profile?.id || null,
      kind: form.noteKind || 'bien_ban', title: `${form.code} · ${form.name}`, content: formatForm(form, v), is_issue: !!isIssue,
    });
    setBusy(false);
    if (error) return say(/ai_notes/.test(error.message) ? 'Chưa bật bảng biểu mẫu: cần chạy file cập nhật dữ liệu (migration) trước.' : 'Lỗi lưu: ' + error.message, 'error');
    onSaved();
  };
  return (
    <Sheet title={`${form.code} · ${form.name}`} sub={form.when} onClose={onClose} footer={<SaveBtn busy={busy} onClick={save} label="Lưu biểu mẫu" />}>
      <div><Label req>Công trình</Label><select className={inputCls} value={projectId} onChange={e => setProjectId(e.target.value)}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      {form.code === 'GS-06' && v.doi_chi_phi?.startsWith('Có') && (
        <div className="flex gap-2 p-3 rounded-xl bg-amber-50 text-amber-800 text-xs"><AlertTriangle className="w-4 h-4 shrink-0" />Chỉ làm sau khi khách ký phiếu phát sinh.</div>
      )}
      {form.fields.map(f => <div key={f.key}><Label req={f.required}>{f.label}</Label><FieldInput f={f} value={v[f.key]} onChange={val => setV(p => ({ ...p, [f.key]: val }))} /></div>)}
    </Sheet>
  );
}

/* ---------- GS-04 Giao việc cho tổ ---------- */
function NewTaskModal({ projects, onClose, onSaved, say }: { projects: Project[]; onClose: () => void; onSaved: () => void; say: Notify }) {
  const [v, setV] = useState<Record<string, any>>({ project_id: projects[0]?.id || '', due: todayVN() });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!v.project_id || !v.name || !v.to) return say('Điền đủ: công trình, việc, tổ/người làm', 'error');
    setBusy(true);
    const { error } = await supabase.from('construction_tasks').insert({
      project_id: v.project_id, name: String(v.name).trim(), category: 'Giao việc đầu ngày', status: 'TODO',
      start_date: todayVN(), end_date: v.due || todayVN(), days: 1, progress: 0, note: v.note || '', assignee: String(v.to).trim(),
      priority: 'Trung bình', budget: 0, spent: 0, checklist: [], issues: [], tags: [], dependencies: [], approved: false, subcontractor: '',
    });
    setBusy(false);
    if (error) return say('Lỗi giao việc: ' + error.message, 'error');
    onSaved();
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
