// Màn hình Điều hành cho Giám đốc và PM: mọi công trình (thi công + thiết kế) trên một trang,
// xếp đỏ → vàng → xanh, cộng việc trễ theo người và công trình chưa nộp nhật ký hôm nay.
// Đọc từ các view v_projects / v_tasks / v_logs (cùng nguồn với trợ lý AI và báo cáo 17:30).
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, HardHat, PenTool, RefreshCw, Users } from 'lucide-react';
import { supabase } from '../../services/supabase';

type VProject = { id: string; source: 'core' | 'construction' | 'marketing'; name: string; status: string | null; owner_name: string | null; end_date: string | null };
type VTask = { id: string; source: string; project_id: string | null; project_source: string | null; title: string; status: string; due_date: string | null; assignee_ids: string[] | null; assignee_name: string | null; progress_pct: number | null };
type VLog = { project_id: string | null; kind: string; log_date: string; is_issue: boolean; content: string | null };
type Person = { id: string; full_name: string };

const vnToday = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const ddmm = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—');
const CLOSED = ['done', 'completed', 'hoàn thành', 'cancelled', 'hủy bỏ', 'archived', 'đã bàn giao', 'lưu trữ'];
const isOpenProject = (s: string | null) => !CLOSED.includes(String(s || '').toLowerCase());
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

type Row = { p: VProject; total: number; done: number; overdue: number; issues: number; diaryToday: boolean | null; tone: 'red' | 'amber' | 'green'; nextDue: string | null };

export function Overview() {
  const navigate = useNavigate();
  const [state, setState] = useState<{ loading: boolean; error?: string; projects: VProject[]; tasks: VTask[]; logs: VLog[]; people: Person[] }>({ loading: true, projects: [], tasks: [], logs: [], people: [] });
  const today = vnToday();

  const load = async () => {
    setState(s => ({ ...s, loading: true, error: undefined }));
    const since = addDays(today, -7);
    const [p, t, l, pe] = await Promise.all([
      supabase.from('v_projects').select('id, source, name, status, owner_name, end_date').in('source', ['core', 'construction']),
      supabase.from('v_tasks').select('id, source, project_id, project_source, title, status, due_date, assignee_ids, assignee_name, progress_pct').neq('status', 'cancelled').limit(5000),
      supabase.from('v_logs').select('project_id, kind, log_date, is_issue, content').gte('log_date', since).limit(2000),
      supabase.from('profiles').select('id, full_name'),
    ]);
    const err = p.error || t.error || l.error;
    if (err) return setState({ loading: false, error: /v_projects|v_tasks|v_logs|does not exist|schema cache/i.test(err.message) ? 'Chưa chạy file cập nhật dữ liệu (supabase/migrations/20261102_ai_api_mcp.sql) nên chưa có số liệu tổng hợp.' : err.message, projects: [], tasks: [], logs: [], people: [] });
    setState({ loading: false, projects: (p.data || []) as VProject[], tasks: (t.data || []) as VTask[], logs: (l.data || []) as VLog[], people: (pe.data || []) as Person[] });
  };
  useEffect(() => { load(); }, []);

  const rows: Row[] = useMemo(() => {
    const out = state.projects.filter(p => isOpenProject(p.status)).map(p => {
      const ts = state.tasks.filter(t => t.project_id === p.id && t.project_source === p.source);
      const open = ts.filter(t => t.status !== 'done');
      const overdue = open.filter(t => t.due_date && t.due_date < today).length;
      const issues = state.logs.filter(l => l.project_id === p.id && l.is_issue).length;
      const diaryToday = p.source === 'construction' ? state.logs.some(l => l.project_id === p.id && l.kind === 'nhat_ky' && l.log_date === today) : null;
      const nextDue = open.map(t => t.due_date).filter(Boolean).sort()[0] || null;
      const tone: Row['tone'] = overdue ? 'red' : issues || diaryToday === false ? 'amber' : 'green';
      return { p, total: ts.length, done: ts.length - open.length, overdue, issues, diaryToday, tone, nextDue };
    });
    const rank = { red: 0, amber: 1, green: 2 };
    return out.sort((a, b) => rank[a.tone] - rank[b.tone] || b.overdue - a.overdue || a.p.name.localeCompare(b.p.name));
  }, [state, today]);

  const byPerson = useMemo(() => {
    const names = new Map(state.people.map(p => [p.id, p.full_name]));
    const count = new Map<string, number>();
    for (const t of state.tasks) {
      if (t.status === 'done' || !t.due_date || t.due_date >= today) continue;
      const who = [...(t.assignee_ids || []).map(id => names.get(id)).filter(Boolean) as string[]];
      if (t.assignee_name) {
        const hit = state.people.filter(p => fold(p.full_name).split(' ').pop() === fold(t.assignee_name!).split(' ').pop());
        who.push(hit.length === 1 ? hit[0].full_name : t.assignee_name);
      }
      for (const w of new Set(who.length ? who : ['Chưa giao'])) count.set(w, (count.get(w) || 0) + 1);
    }
    return [...count].sort((a, b) => b[1] - a[1]);
  }, [state, today]);

  const issues = useMemo(() => state.logs.filter(l => l.is_issue).sort((a, b) => b.log_date.localeCompare(a.log_date)).slice(0, 8), [state]);
  const nameOf = (id: string | null) => state.projects.find(p => p.id === id)?.name || '';
  const red = rows.filter(r => r.tone === 'red').length, amber = rows.filter(r => r.tone === 'amber').length, green = rows.filter(r => r.tone === 'green').length;
  const missing = rows.filter(r => r.diaryToday === false);
  const dot = { red: 'bg-rose-500', amber: 'bg-amber-400', green: 'bg-emerald-500' };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Điều hành</h1>
          <p className="text-sm text-slate-500">{ddmm(today)} · {rows.length} công trình đang chạy</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50" title="Tải lại"><RefreshCw className={`w-4 h-4 text-slate-600 ${state.loading ? 'animate-spin' : ''}`} /></button>
      </div>

      {state.error && <div className="flex gap-2 p-4 rounded-xl bg-amber-50 text-amber-900 text-sm"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{state.error}</div>}

      {!state.error && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Có việc trễ', value: red, cls: 'text-rose-700' },
              { label: 'Cần để ý', value: amber, cls: 'text-amber-700' },
              { label: 'Ổn', value: green, cls: 'text-emerald-700' },
              { label: 'Chưa nộp nhật ký hôm nay', value: missing.length, cls: missing.length ? 'text-rose-700' : 'text-slate-900' },
            ].map(k => (
              <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-4">
                <p className={`text-3xl font-bold ${k.cls}`}>{state.loading ? '…' : k.value}</p>
                <p className="text-xs text-slate-500 mt-1">{k.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 text-sm font-bold text-slate-800">Công trình · đỏ = có việc trễ, vàng = có vấn đề hoặc thiếu nhật ký</div>
              <div className="divide-y divide-slate-100">
                {rows.map(r => (
                  <button key={r.p.source + r.p.id} onClick={() => navigate(r.p.source === 'construction' ? '/construction' : '/projects')} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot[r.tone]}`} />
                    {r.p.source === 'construction' ? <HardHat className="w-4 h-4 text-slate-400 shrink-0" /> : <PenTool className="w-4 h-4 text-slate-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{r.p.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {r.total ? `${Math.round((r.done / r.total) * 100)}% (${r.done}/${r.total} việc)` : 'chưa có việc'}
                        {r.p.owner_name ? ` · ${r.p.owner_name}` : ''}{r.nextDue ? ` · hạn gần nhất ${ddmm(r.nextDue)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-semibold">
                      {r.overdue > 0 && <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700">{r.overdue} trễ</span>}
                      {r.issues > 0 && <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">{r.issues} vấn đề</span>}
                      {r.diaryToday === false && <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">thiếu NK</span>}
                      {r.diaryToday === true && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                  </button>
                ))}
                {!state.loading && !rows.length && <p className="px-4 py-6 text-sm text-slate-500">Không có công trình nào đang chạy.</p>}
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-white border border-slate-200 rounded-2xl">
                <div className="px-4 py-3 border-b border-slate-100 text-sm font-bold text-slate-800 flex items-center gap-2"><Users className="w-4 h-4" /> Việc trễ theo người</div>
                <div className="p-2">
                  {byPerson.length ? byPerson.map(([n, c]) => (
                    <div key={n} className="flex items-center justify-between px-2 py-1.5 text-sm"><span className="text-slate-700 truncate">{n}</span><span className="font-bold text-rose-700">{c}</span></div>
                  )) : <p className="px-2 py-2 text-sm text-slate-500">Không ai trễ việc.</p>}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl">
                <div className="px-4 py-3 border-b border-slate-100 text-sm font-bold text-slate-800 flex items-center gap-2"><Clock className="w-4 h-4" /> Vấn đề 7 ngày qua</div>
                <div className="p-3 space-y-2">
                  {issues.length ? issues.map((l, i) => (
                    <div key={i} className="text-xs"><p className="font-semibold text-slate-700">{ddmm(l.log_date)} · {nameOf(l.project_id)}</p><p className="text-slate-600 line-clamp-2">{l.content}</p></div>
                  )) : <p className="text-sm text-slate-500">Không có vấn đề nào được ghi.</p>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
