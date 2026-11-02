// "Việc được giao": việc dự án thiết kế giao cho mình (bảng tasks), xếp theo Trễ / Hôm nay / Tuần này / Sau / Chưa có hạn.
// Mỗi dòng bấm 1 lần: Bắt đầu → Gửi duyệt; việc chưa có hạn thì chọn nhanh Mai / 3 ngày / Thứ 6 / Tuần sau.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Briefcase, Play, Send, CalendarPlus, ChevronDown, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../services/supabase';

type T = { id: string; task_code: string | null; name: string; status: string; due_date: string | null; completion_pct: number | null; project_id: string | null; priority: string | null };
type Notify = (msg: string, type?: 'success' | 'error') => void;

const vnToday = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
const plus = (iso: string, n: number) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const nextFriday = (iso: string) => { const d = new Date(iso + 'T00:00:00Z'); const add = (5 - d.getUTCDay() + 7) % 7 || 7; return plus(iso, add); };
const ddmm = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '');
const CLOSED = ['Hoàn thành', 'Hủy bỏ', 'Huỷ bỏ', 'Done', 'done', 'Cancelled'];
const isDoing = (s: string) => /đang|doing|in_progress/i.test(s);
const isReview = (s: string) => /chờ duyệt|review/i.test(s);

export function AssignedTasks({ userId, notify }: { userId: string; notify?: Notify }) {
  const say: Notify = notify || ((m) => console.log(m));
  const [items, setItems] = useState<T[]>([]);
  const [projects, setProjects] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({ late: true, today: true, week: true, later: false, nodue: true });
  const [dueFor, setDueFor] = useState<string | null>(null);
  const today = vnToday();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('tasks')
      .select('id, task_code, name, status, due_date, completion_pct, project_id, priority')
      .or(`assignee_id.eq.${userId},supporter_id.eq.${userId}`)
      .not('status', 'in', `(${CLOSED.map(s => `"${s}"`).join(',')})`)
      .order('due_date', { ascending: true, nullsFirst: false }).limit(200);
    const rows = (data || []) as T[];
    setItems(rows);
    const pids = [...new Set(rows.map(r => r.project_id).filter(Boolean))] as string[];
    if (pids.length) {
      const { data: ps } = await supabase.from('projects').select('id, name').in('id', pids);
      setProjects(Object.fromEntries((ps || []).map((p: any) => [p.id, p.name])));
    }
    setLoading(false);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    const in7 = plus(today, 7);
    const g = { late: [] as T[], today: [] as T[], week: [] as T[], later: [] as T[], nodue: [] as T[] };
    for (const t of items) {
      if (!t.due_date) g.nodue.push(t);
      else if (t.due_date < today) g.late.push(t);
      else if (t.due_date === today) g.today.push(t);
      else if (t.due_date <= in7) g.week.push(t);
      else g.later.push(t);
    }
    return [
      { key: 'late', label: 'Trễ hạn', tone: 'text-rose-700 bg-rose-50', items: g.late },
      { key: 'today', label: 'Hôm nay', tone: 'text-amber-700 bg-amber-50', items: g.today },
      { key: 'week', label: '7 ngày tới', tone: 'text-indigo-700 bg-indigo-50', items: g.week },
      { key: 'nodue', label: 'Chưa có hạn — đặt hạn giúp nhé', tone: 'text-slate-700 bg-slate-100', items: g.nodue },
      { key: 'later', label: 'Sau đó', tone: 'text-slate-600 bg-slate-50', items: g.later },
    ];
  }, [items, today]);

  const update = async (t: T, patch: Partial<T>, msg: string) => {
    const prev = items;
    setItems(list => list.map(x => (x.id === t.id ? { ...x, ...patch } : x)));
    const { error } = await supabase.from('tasks').update(patch).eq('id', t.id);
    if (error) { setItems(prev); return say('Lỗi cập nhật: ' + error.message, 'error'); }
    say(msg, 'success');
  };

  const late = groups[0].items.length;
  if (loading) return <div className="flex items-center gap-2 text-sm text-slate-500 py-3"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải việc được giao…</div>;

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-bold text-slate-900 flex items-center gap-2"><Briefcase className="w-5 h-5 text-[#7A1216]" /> Việc dự án được giao</h2>
        <span className="text-xs text-slate-500">{items.length} việc{late ? <b className="text-rose-600"> · {late} trễ</b> : ''}</span>
      </div>
      {!items.length && <p className="text-sm text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Không có việc dự án nào đang mở.</p>}
      <div className="space-y-3">
        {groups.map(g => g.items.length > 0 && (
          <div key={g.key}>
            <button onClick={() => setOpen(o => ({ ...o, [g.key]: !o[g.key] }))} className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${g.tone}`}>
              {g.label} · {g.items.length}<ChevronDown className={`w-3.5 h-3.5 transition-transform ${open[g.key] ? '' : '-rotate-90'}`} />
            </button>
            {open[g.key] && (
              <div className="mt-2 space-y-2">
                {g.items.map(t => (
                  <div key={t.id} className="border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => window.dispatchEvent(new CustomEvent('openChatTask', { detail: t.id }))} className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold text-slate-800 truncate">{t.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {[t.task_code, t.project_id && projects[t.project_id], t.due_date && `hạn ${ddmm(t.due_date)}`, isReview(t.status) ? 'đang chờ duyệt' : isDoing(t.status) ? 'đang làm' : 'chưa bắt đầu'].filter(Boolean).join(' · ')}
                        </p>
                      </button>
                      {!t.due_date && <button onClick={() => setDueFor(dueFor === t.id ? null : t.id)} className="px-2.5 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1"><CalendarPlus className="w-3.5 h-3.5" />Hạn</button>}
                      {!isDoing(t.status) && !isReview(t.status) && <button onClick={() => update(t, { status: 'Đang thực hiện' }, `Bắt đầu: ${t.name}`)} className="px-2.5 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold flex items-center gap-1"><Play className="w-3.5 h-3.5" />Làm</button>}
                      {isDoing(t.status) && <button onClick={() => update(t, { status: 'Chờ duyệt', completion_pct: Math.max(t.completion_pct || 0, 90) }, `Đã gửi duyệt: ${t.name}`)} className="px-2.5 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1"><Send className="w-3.5 h-3.5" />Gửi duyệt</button>}
                    </div>
                    {dueFor === t.id && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {[['Mai', plus(today, 1)], ['3 ngày', plus(today, 3)], ['Thứ 6', nextFriday(today)], ['Tuần sau', plus(today, 7)]].map(([label, d]) => (
                          <button key={label} onClick={() => { setDueFor(null); update(t, { due_date: d }, `Hạn ${ddmm(d)}: ${t.name}`); }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">{label} <span className="text-slate-400">{ddmm(d)}</span></button>
                        ))}
                        <input type="date" min={today} onChange={e => e.target.value && (setDueFor(null), update(t, { due_date: e.target.value }, `Hạn ${ddmm(e.target.value)}: ${t.name}`))} className="px-2 py-1 rounded-lg border border-slate-200 text-xs" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
