// Vật tư theo trạng thái, phát sinh phải khách đồng ý mới vào tiến độ, nạp mẫu tiến độ.
// Dùng trong Trạm giám sát (giám sát + PM). Khách chốt vật tư / duyệt phát sinh qua link /c/<mã>.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Loader2, CheckCircle2, XCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { supabase } from '../../services/supabase';
import type { Project } from './types';
import { Sheet, inputCls, Label, SaveBtn } from './stationUi';
import { TEMPLATES, buildFromTemplate } from './scheduleTemplates';

type Notify = (msg: string, type?: 'success' | 'error' | 'info') => void;
type Profile = { id?: string; full_name?: string | null; role?: string | null } | null | undefined;

const todayVN = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
const ddmm = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—');
const money = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' đ';
const isManager = (role?: string | null) => ['Admin', 'Quản lý thi công', 'Quản lý thiết kế'].includes(role || '');
const MISSING_TABLE = /site_materials|change_orders|schema cache|does not exist/i;
const migrateMsg = 'Chưa bật bảng vật tư / phát sinh: cần chạy file supabase/migrations/20261103_vat_tu_phat_sinh.sql.';

/* ======================= VẬT TƯ ======================= */
type Material = { id: string; project_id: string; name: string; quantity: number | null; unit: string | null; for_item: string | null; need_by: string | null; status: string; owner_choice: string | null; owner_decision: string | null; supplier: string | null; note: string | null };
export const MAT_STATUS: { id: string; label: string; tone: string }[] = [
  { id: 'can_dat', label: 'Cần đặt', tone: 'bg-rose-50 text-rose-700' },
  { id: 'cho_chu_nha', label: 'Chờ chủ nhà chốt', tone: 'bg-amber-50 text-amber-800' },
  { id: 'da_dat', label: 'Đã đặt', tone: 'bg-indigo-50 text-indigo-700' },
  { id: 'dang_ve', label: 'Đang về', tone: 'bg-sky-50 text-sky-700' },
  { id: 'da_ve', label: 'Đã về', tone: 'bg-emerald-50 text-emerald-700' },
];
const NEXT: Record<string, string> = { can_dat: 'da_dat', da_dat: 'dang_ve', dang_ve: 'da_ve' };

export function MaterialsPanel({ projects, profile, say }: { projects: Project[]; profile: Profile; say: Notify }) {
  const [rows, setRows] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('open');
  const [adding, setAdding] = useState(false);
  const ids = useMemo(() => projects.map(p => p.id), [projects]);
  const nameOf = (id: string) => projects.find(p => p.id === id)?.name || '';
  const today = todayVN();

  const load = useCallback(async () => {
    if (!ids.length) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from('site_materials').select('*').in('project_id', ids).neq('status', 'huy').order('need_by', { ascending: true, nullsFirst: false });
    setLoading(false);
    if (error) return say(MISSING_TABLE.test(error.message) ? migrateMsg : error.message, 'error');
    setRows((data || []) as Material[]);
  }, [ids]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (m: Material, status: string) => {
    const { error } = await supabase.from('site_materials').update({ status, updated_at: new Date().toISOString() }).eq('id', m.id);
    if (error) return say(error.message, 'error');
    setRows(r => r.map(x => x.id === m.id ? { ...x, status } : x));
  };

  const late = (m: Material) => m.status !== 'da_ve' && m.need_by && m.need_by < today;
  const in3 = new Date(Date.parse(today + 'T00:00:00Z') + 3 * 864e5).toISOString().slice(0, 10);
  const urgent = (m: Material) => m.status !== 'da_ve' && m.need_by && m.need_by <= in3;
  const shown = rows.filter(m => filter === 'open' ? m.status !== 'da_ve' : filter === 'all' ? true : m.status === filter);
  const count = (id: string) => rows.filter(m => m.status === id).length;

  return (
    <div className="space-y-3">
      <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#7A1216] text-white font-semibold text-sm"><Plus className="w-4 h-4" /> Thêm vật tư cần có</button>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {[{ id: 'open', label: `Chưa về (${rows.filter(m => m.status !== 'da_ve').length})` }, ...MAT_STATUS.map(s => ({ id: s.id, label: `${s.label} (${count(s.id)})` })), { id: 'all', label: 'Tất cả' }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border ${filter === f.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>{f.label}</button>
        ))}
      </div>
      {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      {!loading && !shown.length && <p className="text-sm text-slate-500">Không có vật tư nào ở mục này.</p>}
      {shown.map(m => {
        const st = MAT_STATUS.find(s => s.id === m.status);
        return (
          <div key={m.id} className={`bg-white border rounded-xl p-3 ${late(m) ? 'border-rose-300' : 'border-slate-200'}`}>
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{m.name}{m.quantity ? ` · ${m.quantity} ${m.unit || ''}` : ''}</p>
                <p className="text-[11px] text-slate-500">{nameOf(m.project_id)}{m.for_item ? ` · cho ${m.for_item}` : ''} · cần trước {ddmm(m.need_by)}{late(m) ? ' · TRỄ' : urgent(m) ? ' · gấp' : ''}</p>
                {m.status === 'cho_chu_nha' && m.owner_choice && <p className="text-[11px] text-amber-800 mt-1">Chủ nhà cần chốt: {m.owner_choice}</p>}
                {m.owner_decision && <p className="text-[11px] text-emerald-700 mt-1">Chủ nhà đã chốt: {m.owner_decision}</p>}
              </div>
              <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-md ${st?.tone}`}>{st?.label}</span>
            </div>
            {NEXT[m.status] && (
              <button onClick={() => setStatus(m, NEXT[m.status])} className="mt-2 w-full flex items-center justify-center gap-1 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                Chuyển sang: {MAT_STATUS.find(s => s.id === NEXT[m.status])?.label} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
      {adding && <MaterialModal projects={projects} profile={profile} say={say} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); say('Đã thêm vật tư', 'success'); }} />}
    </div>
  );
}

function MaterialModal({ projects, profile, say, onClose, onSaved }: { projects: Project[]; profile: Profile; say: Notify; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState<Record<string, any>>({ project_id: projects[0]?.id || '', unit: '' , needOwner: false });
  const [busy, setBusy] = useState(false);
  const set = (k: string, x: any) => setV(p => ({ ...p, [k]: x }));
  const save = async () => {
    if (!v.project_id || !v.name || !v.need_by) return say('Điền: công trình, tên vật tư, hạn cần có', 'error');
    if (v.needOwner && !v.owner_choice) return say('Ghi rõ chủ nhà cần chốt gì', 'error');
    setBusy(true);
    const { error } = await supabase.from('site_materials').insert({
      project_id: v.project_id, name: String(v.name).trim(), quantity: v.quantity ? Number(v.quantity) : null, unit: v.unit || null,
      for_item: v.for_item || null, need_by: v.need_by, status: v.needOwner ? 'cho_chu_nha' : 'can_dat',
      owner_choice: v.needOwner ? v.owner_choice : null, supplier: v.supplier || null, created_by: profile?.id || null,
    });
    setBusy(false);
    if (error) return say(MISSING_TABLE.test(error.message) ? migrateMsg : error.message, 'error');
    onSaved();
  };
  return (
    <Sheet title="Vật tư cần có" onClose={onClose} footer={<SaveBtn busy={busy} onClick={save} label="Lưu" />}>
      <div><Label req>Công trình</Label><select className={inputCls} value={v.project_id} onChange={e => set('project_id', e.target.value)}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      <div><Label req>Tên vật tư, quy cách</Label><input className={inputCls} value={v.name || ''} onChange={e => set('name', e.target.value)} placeholder="Gạch 60x60 men mờ, cây U nhôm 10mm…" /></div>
      <div className="grid grid-cols-3 gap-2">
        <div><Label>Số lượng</Label><input type="number" inputMode="decimal" className={inputCls} value={v.quantity || ''} onChange={e => set('quantity', e.target.value)} /></div>
        <div><Label>Đơn vị</Label><input list="mat-units" className={inputCls} value={v.unit} onChange={e => set('unit', e.target.value)} /><datalist id="mat-units">{['m²', 'md', 'cái', 'bộ', 'tấm', 'thùng', 'bao', 'cuộn', 'lít'].map(u => <option key={u} value={u} />)}</datalist></div>
        <div><Label req>Cần trước</Label><input type="date" className={inputCls} value={v.need_by || ''} onChange={e => set('need_by', e.target.value)} /></div>
      </div>
      <div><Label>Phục vụ hạng mục</Label><input className={inputCls} value={v.for_item || ''} onChange={e => set('for_item', e.target.value)} placeholder="Ốp lát WC tầng 2" /></div>
      <div><Label>Nhà cung cấp</Label><input className={inputCls} value={v.supplier || ''} onChange={e => set('supplier', e.target.value)} /></div>
      <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" className="w-4 h-4 accent-[#7A1216]" checked={v.needOwner} onChange={e => set('needOwner', e.target.checked)} />Chủ nhà phải chốt mẫu / màu / phương án trước khi đặt</label>
      {v.needOwner && <div><Label req>Chủ nhà cần chốt gì</Label><textarea rows={2} className={inputCls} value={v.owner_choice || ''} onChange={e => set('owner_choice', e.target.value)} placeholder="Chọn 1 trong 2 màu gỗ: Óc chó tự nhiên / Óc chó sậm (đã gửi mẫu)" /></div>}
    </Sheet>
  );
}

/* ======================= PHÁT SINH ======================= */
type ChangeOrder = { id: string; project_id: string; code: string | null; title: string; description: string | null; cost: number; extra_days: number; status: string; client_note: string | null; task_id: string | null; created_at: string };
const CO_STATUS: Record<string, { label: string; tone: string }> = {
  cho_khach: { label: 'Chờ khách đồng ý', tone: 'bg-amber-50 text-amber-800' },
  khach_dong_y: { label: 'Khách đồng ý — chờ đưa vào tiến độ', tone: 'bg-indigo-50 text-indigo-700' },
  khach_tu_choi: { label: 'Khách từ chối', tone: 'bg-slate-100 text-slate-600' },
  da_vao_tien_do: { label: 'Đã vào tiến độ', tone: 'bg-emerald-50 text-emerald-700' },
};

export function ChangeOrdersPanel({ projects, profile, say, onScheduled }: { projects: Project[]; profile: Profile; say: Notify; onScheduled?: () => void }) {
  const [rows, setRows] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const ids = useMemo(() => projects.map(p => p.id), [projects]);
  const nameOf = (id: string) => projects.find(p => p.id === id)?.name || '';
  const canApprove = isManager(profile?.role);

  const load = useCallback(async () => {
    if (!ids.length) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from('change_orders').select('*').in('project_id', ids).neq('status', 'huy').order('created_at', { ascending: false });
    setLoading(false);
    if (error) return say(MISSING_TABLE.test(error.message) ? migrateMsg : error.message, 'error');
    setRows((data || []) as ChangeOrder[]);
  }, [ids]);
  useEffect(() => { load(); }, [load]);

  // Chỉ phát sinh khách đã đồng ý mới tạo việc trong tiến độ (database cũng chặn bằng trigger).
  const schedule = async (c: ChangeOrder) => {
    setBusyId(c.id);
    const start = todayVN();
    const days = Math.max(1, c.extra_days || 1);
    const end = new Date(Date.parse(start + 'T00:00:00Z') + (days - 1) * 864e5).toISOString().slice(0, 10);
    const { data: t, error } = await supabase.from('construction_tasks').insert({
      project_id: c.project_id, name: `${c.code || 'PS'} · ${c.title}`, category: 'Phát sinh đã duyệt', status: 'TODO',
      start_date: start, end_date: end, days, progress: 0, note: c.description || '', assignee: '', priority: 'Cao',
      budget: c.cost || 0, spent: 0, checklist: [], issues: [], tags: ['phat-sinh'], dependencies: [], approved: true, subcontractor: '',
    }).select('id').single();
    if (error) { setBusyId(null); return say(error.message, 'error'); }
    const u = await supabase.from('change_orders').update({ status: 'da_vao_tien_do', task_id: t?.id }).eq('id', c.id);
    setBusyId(null);
    if (u.error) return say(u.error.message, 'error');
    say(`Đã đưa ${c.code} vào tiến độ`, 'success'); load(); onScheduled?.();
  };

  const recordDecision = async (c: ChangeOrder, approve: boolean) => {
    const note = prompt(approve ? 'Khách đồng ý qua đâu? (VD: ký giấy ngày…, Zalo…)' : 'Lý do khách từ chối:') ?? null;
    if (note === null) return;
    const { error } = await supabase.from('change_orders').update({ status: approve ? 'khach_dong_y' : 'khach_tu_choi', client_note: note, client_decided_at: new Date().toISOString() }).eq('id', c.id);
    if (error) return say(error.message, 'error');
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 p-3 rounded-xl bg-amber-50 text-amber-900 text-xs"><AlertTriangle className="w-4 h-4 shrink-0" />Phát sinh chỉ vào tiến độ khi khách đã đồng ý. Khách đồng ý ngay trên link xem tiến độ, hoặc PM ghi nhận khi khách ký giấy.</div>
      <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#7A1216] text-white font-semibold text-sm"><Plus className="w-4 h-4" /> Lập phiếu phát sinh</button>
      {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      {!loading && !rows.length && <p className="text-sm text-slate-500">Chưa có phát sinh nào.</p>}
      {rows.map(c => (
        <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{c.code} · {c.title}</p>
              <p className="text-[11px] text-slate-500">{nameOf(c.project_id)} · {c.cost >= 0 ? '+' : ''}{money(c.cost)} · {c.extra_days > 0 ? `+${c.extra_days} ngày` : 'không thêm ngày'}</p>
              {c.client_note && <p className="text-[11px] text-slate-600 mt-1">Ghi nhận: {c.client_note}</p>}
            </div>
            <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-md ${CO_STATUS[c.status]?.tone}`}>{CO_STATUS[c.status]?.label}</span>
          </div>
          {c.status === 'cho_khach' && canApprove && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => recordDecision(c, true)} className="py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Khách đã ký</button>
              <button onClick={() => recordDecision(c, false)} className="py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1"><XCircle className="w-3.5 h-3.5" /> Khách từ chối</button>
            </div>
          )}
          {c.status === 'khach_dong_y' && canApprove && (
            <button disabled={busyId === c.id} onClick={() => schedule(c)} className="w-full py-2 rounded-lg bg-[#7A1216] text-white text-xs font-semibold disabled:opacity-60">{busyId === c.id ? 'Đang tạo…' : 'Đưa vào tiến độ'}</button>
          )}
        </div>
      ))}
      {adding && <ChangeOrderModal projects={projects} profile={profile} existing={rows} say={say} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); say('Đã lập phiếu phát sinh, chờ khách đồng ý', 'success'); }} />}
    </div>
  );
}

function ChangeOrderModal({ projects, profile, existing, say, onClose, onSaved }: { projects: Project[]; profile: Profile; existing: ChangeOrder[]; say: Notify; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState<Record<string, any>>({ project_id: projects[0]?.id || '', extra_days: 0 });
  const [busy, setBusy] = useState(false);
  const set = (k: string, x: any) => setV(p => ({ ...p, [k]: x }));
  const save = async () => {
    if (!v.project_id || !v.title || v.cost === undefined || v.cost === '') return say('Điền: công trình, nội dung, chi phí (ghi 0 nếu không đổi)', 'error');
    setBusy(true);
    const { count } = await supabase.from('change_orders').select('id', { count: 'exact', head: true }).eq('project_id', v.project_id);
    const n = (count ?? existing.filter(c => c.project_id === v.project_id).length) + 1;
    const { error } = await supabase.from('change_orders').insert({
      project_id: v.project_id, code: `PS-${String(n).padStart(2, '0')}`, title: String(v.title).trim(), description: v.description || null,
      cost: Number(String(v.cost).replace(/[^\d-]/g, '')) || 0, extra_days: Number(v.extra_days) || 0, requested_by: profile?.id || null,
    });
    setBusy(false);
    if (error) return say(MISSING_TABLE.test(error.message) ? migrateMsg : error.message, 'error');
    onSaved();
  };
  return (
    <Sheet title="Phiếu phát sinh" sub="Gửi khách đồng ý trước khi làm" onClose={onClose} footer={<SaveBtn busy={busy} onClick={save} label="Lập phiếu" />}>
      <div><Label req>Công trình</Label><select className={inputCls} value={v.project_id} onChange={e => set('project_id', e.target.value)}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      <div><Label req>Nội dung thay đổi / làm thêm</Label><input className={inputCls} value={v.title || ''} onChange={e => set('title', e.target.value)} placeholder="Thêm tủ giày âm tường sảnh" /></div>
      <div><Label>Mô tả, lý do</Label><textarea rows={2} className={inputCls} value={v.description || ''} onChange={e => set('description', e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label req>Chi phí thêm (đ)</Label><input inputMode="numeric" className={inputCls} value={v.cost ?? ''} onChange={e => set('cost', e.target.value)} placeholder="12500000" /></div>
        <div><Label>Thêm ngày thi công</Label><input type="number" min={0} className={inputCls} value={v.extra_days} onChange={e => set('extra_days', e.target.value)} /></div>
      </div>
    </Sheet>
  );
}

/* ======================= NẠP MẪU TIẾN ĐỘ ======================= */
export function TemplateModal({ projects, say, onClose, onSaved }: { projects: Project[]; say: Notify; onClose: () => void; onSaved: () => void }) {
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [tplId, setTplId] = useState(TEMPLATES[0].id);
  const proj = projects.find(p => p.id === projectId);
  const [start, setStart] = useState(proj?.startDate || todayVN());
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (proj?.startDate) setStart(proj.startDate); }, [projectId]);
  const items = useMemo(() => buildFromTemplate(TEMPLATES.find(t => t.id === tplId)!, start), [tplId, start]);
  const save = async () => {
    if (!projectId || !start) return say('Chọn công trình và ngày khởi công', 'error');
    setBusy(true);
    const { count } = await supabase.from('construction_tasks').select('id', { count: 'exact', head: true }).eq('project_id', projectId);
    if ((count || 0) > 0 && !confirm(`Công trình đã có ${count} việc. Vẫn thêm ${items.length} việc từ mẫu?`)) { setBusy(false); return; }
    const { error } = await supabase.from('construction_tasks').insert(items.map(i => ({
      project_id: projectId, name: i.name, category: i.category, status: 'TODO', start_date: i.start_date, end_date: i.end_date, days: i.days,
      progress: 0, note: '', assignee: '', priority: 'Trung bình', budget: 0, spent: 0, checklist: [], issues: [], tags: ['mau'], dependencies: [], approved: false, subcontractor: '',
    })));
    setBusy(false);
    if (error) return say(error.message, 'error');
    onSaved();
  };
  return (
    <Sheet title="Nạp mẫu tiến độ" sub="Nạp xong chỉnh lại theo thực tế công trình" onClose={onClose} footer={<SaveBtn busy={busy} onClick={save} label={`Nạp ${items.length} việc`} />}>
      <div><Label req>Công trình</Label><select className={inputCls} value={projectId} onChange={e => setProjectId(e.target.value)}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      <div><Label req>Mẫu</Label>
        <div className="space-y-1.5">{TEMPLATES.map(t => (
          <button key={t.id} onClick={() => setTplId(t.id)} className={`w-full text-left px-3 py-2 rounded-xl border text-sm ${tplId === t.id ? 'border-[#7A1216] bg-[#7A1216]/5' : 'border-slate-200'}`}><span className="font-semibold text-slate-800">{t.name}</span> <span className="text-xs text-slate-500">· {t.note}</span></button>
        ))}</div>
      </div>
      <div><Label req>Ngày khởi công</Label><input type="date" className={inputCls} value={start} onChange={e => setStart(e.target.value)} /></div>
      <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 max-h-48 overflow-y-auto space-y-0.5">
        {items.map((i, k) => <div key={k} className="flex justify-between gap-2"><span className="truncate">{i.name}</span><span className="shrink-0 text-slate-400">{ddmm(i.start_date)}–{ddmm(i.end_date)}</span></div>)}
        <p className="pt-1 font-semibold text-slate-800">Bàn giao dự kiến: {ddmm(items[items.length - 1]?.end_date)}</p>
      </div>
    </Sheet>
  );
}
