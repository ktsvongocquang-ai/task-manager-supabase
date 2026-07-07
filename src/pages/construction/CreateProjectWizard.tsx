import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Copy, ChevronLeft, ChevronRight, ChevronDown, AlertCircle, Check, Loader2, Building2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { MultiSelectStaff, type StaffOption } from '../../components/MultiSelectStaff';
import type { NewProjectItem, NewItemTask } from '../../hooks/useConstructionData';

// ═══════════════════════════════════════════════════════════
// Wizard "Tạo 1 công trình đầy đủ": Nhập công trình → Tạo hạng mục → Tạo công việc → Kiểm tra
// Không lưu incremental — chỉ gửi 1 lần ở bước cuối (giống app tham khảo).
// Điều hướng bước tự do (bấm thẳng vào step nào cũng được) — validate CHỈ chạy ở bước Kiểm tra,
// khớp hành vi validateTreeWizard32()/goTreeStep33() của app tham khảo.
// ═══════════════════════════════════════════════════════════

export interface NewProjectInfo {
  projectCode: string; name: string; customerId: string; customerName: string; address: string;
  projectType: string; startDate: string; handoverDate: string;
  contractValue: number; budget: number; status: string; progress: number; note: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (info: NewProjectInfo, items: NewProjectItem[]) => Promise<void>;
}

type WizardTask = NewItemTask & { _key: string };
type WizardItem = Omit<NewProjectItem, 'tasks'> & { _key: string; tasks: WizardTask[] };

const STATUS_OPTIONS = [
  { value: 'preparing', label: 'Chuẩn bị' },
  { value: 'in_progress', label: 'Đang thi công' },
  { value: 'paused', label: 'Tạm dừng' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'warranty', label: 'Bảo hành' },
];

const ITEM_STATUS_OPTIONS = ['Đang làm', 'Hoàn thành', 'Tạm dừng'];
const TASK_STATUS_OPTIONS = [
  { value: 'TODO', label: 'Cần làm' },
  { value: 'DOING', label: 'Đang làm' },
  { value: 'REVIEW', label: 'Nghiệm thu' },
  { value: 'DONE', label: 'Hoàn thành' },
];
const PRIORITY_OPTIONS = ['Thấp', 'Trung bình', 'Cao'];

const STEPS = [
  { label: 'Nhập công trình', icon: Building2 },
  { label: 'Tạo hạng mục', icon: ChevronDown },
  { label: 'Tạo công việc', icon: Check },
  { label: 'Kiểm tra', icon: AlertCircle },
];

const numOrZero = (v: string) => parseInt(v.replace(/\D/g, '')) || 0;
const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white';
const cellInputCls = 'w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white';
const labelCls = 'text-[11px] font-bold text-slate-500 uppercase tracking-wide';
const thCls = 'px-2 py-2 text-left font-bold whitespace-nowrap';

const emptyForm = () => ({
  projectCode: '', name: '', customerId: '', address: '', projectType: '',
  startDate: '', handoverDate: '', contractValue: '', budget: '', status: 'preparing', progress: '0', note: '',
});

const emptyQuickCustomer = () => ({ name: '', phone: '', email: '', contact_person: '', address: '', note: '' });

const emptyItem = (): WizardItem => ({
  _key: crypto.randomUUID(), name: '', startDate: '', endDate: '', progress: 0, budget: 0,
  actualCost: 0, assignee: '', status: 'Đang làm', note: '', tasks: [],
});

const emptyTask = (): WizardTask => ({
  _key: crypto.randomUUID(), name: '', startDate: '', days: 1, status: 'TODO', progress: 0, note: '',
  assignee: '', priority: 'Trung bình',
});

const isTaskMeaningful = (t: WizardTask) => !!(t.name.trim() || t.startDate || (t.assignee || '').trim() || (t.note || '').trim());
const isItemMeaningful = (it: WizardItem) =>
  !!(it.name.trim() || it.startDate || it.endDate || it.budget || it.actualCost || (it.assignee || '').trim() || (it.note || '').trim())
  || it.tasks.some(isTaskMeaningful);

export function CreateProjectWizard({ isOpen, onClose, onCreate }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm());
  const [items, setItems] = useState<WizardItem[]>([emptyItem()]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState(emptyQuickCustomer());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStep(0); setForm(emptyForm()); setItems([emptyItem()]); setExpandedItem(null);
    setIsQuickCustomerOpen(false); setQuickCustomer(emptyQuickCustomer()); setError('');
  };

  useEffect(() => {
    if (!isOpen) return;
    reset();
    (async () => {
      const [custRes, lookupRes, staffRes] = await Promise.all([
        supabase.from('customers').select('id,name').order('name'),
        supabase.from('finance_lookups').select('label').eq('list_key', 'project_type').order('sort_order'),
        supabase.from('profiles').select('id,full_name').order('full_name'),
      ]);
      if (custRes.data) setCustomers(custRes.data as { id: string; name: string }[]);
      if (lookupRes.data) setProjectTypes((lookupRes.data as { label: string }[]).map(l => l.label));
      if (staffRes.data) setStaff((staffRes.data as any[]).filter(p => p.full_name) as StaffOption[]);
    })();
  }, [isOpen]);

  const setF = (k: keyof ReturnType<typeof emptyForm>, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSaveQuickCustomer = async () => {
    if (!quickCustomer.name.trim()) { setError('Vui lòng nhập Tên khách hàng'); return; }
    const { data, error: e } = await supabase.from('customers').insert([{
      name: quickCustomer.name.trim(), phone: quickCustomer.phone.trim() || null,
      email: quickCustomer.email.trim() || null, contact_person: quickCustomer.contact_person.trim() || null,
      address: quickCustomer.address.trim() || null, note: quickCustomer.note.trim() || null,
    }]).select().single();
    if (e || !data) { setError('Không tạo được khách hàng mới'); return; }
    setCustomers(prev => [...prev, { id: data.id, name: data.name }].sort((a, b) => a.name.localeCompare(b.name)));
    setF('customerId', data.id);
    setQuickCustomer(emptyQuickCustomer());
    setIsQuickCustomerOpen(false);
    setError('');
  };

  const updateItem = (key: string, patch: Partial<WizardItem>) =>
    setItems(prev => prev.map(it => it._key === key ? { ...it, ...patch } : it));
  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (key: string) => setItems(prev => prev.length > 1 ? prev.filter(it => it._key !== key) : prev);
  const duplicateItem = (key: string) => setItems(prev => {
    const idx = prev.findIndex(it => it._key === key);
    if (idx === -1) return prev;
    const clone: WizardItem = { ...prev[idx], _key: crypto.randomUUID(), tasks: prev[idx].tasks.map(t => ({ ...t, _key: crypto.randomUUID() })) };
    const next = [...prev];
    next.splice(idx + 1, 0, clone);
    return next;
  });

  const addTask = (itemKey: string) =>
    setItems(prev => prev.map(it => it._key === itemKey ? { ...it, tasks: [...it.tasks, emptyTask()] } : it));
  const updateTask = (itemKey: string, taskKey: string, patch: Partial<NewItemTask>) =>
    setItems(prev => prev.map(it => it._key === itemKey
      ? { ...it, tasks: it.tasks.map((t): WizardTask => t._key === taskKey ? { ...t, ...patch } : t) }
      : it));
  const removeTask = (itemKey: string, taskKey: string) =>
    setItems(prev => prev.map(it => it._key === itemKey
      ? { ...it, tasks: it.tasks.filter(t => t._key !== taskKey) }
      : it));
  const duplicateTask = (itemKey: string, taskKey: string) => setItems(prev => prev.map(it => {
    if (it._key !== itemKey) return it;
    const idx = it.tasks.findIndex(t => t._key === taskKey);
    if (idx === -1) return it;
    const clone: WizardTask = { ...it.tasks[idx], _key: crypto.randomUUID() };
    const tasks = [...it.tasks];
    tasks.splice(idx + 1, 0, clone);
    return { ...it, tasks };
  }));

  // ── Validation (khớp validateTreeWizard32): chỉ Tên công trình/Mã khách hàng/Giá trị hợp đồng,
  // Tên hạng mục, Tên công việc là bắt buộc — dòng hoàn toàn trống bị bỏ qua âm thầm ──
  const meaningfulItems = items.filter(isItemMeaningful);
  const errors: string[] = [];
  if (!form.name.trim()) errors.push('Công trình: thiếu Tên công trình');
  if (!form.customerId) errors.push('Công trình: thiếu Mã khách hàng');
  if (numOrZero(form.contractValue) <= 0) errors.push('Công trình: thiếu Giá trị hợp đồng');
  if (!meaningfulItems.length) errors.push('Cần nhập ít nhất 1 hạng mục.');
  const itemTaskLists = meaningfulItems.map(it => ({ item: it, tasks: it.tasks.filter(isTaskMeaningful) }));
  meaningfulItems.forEach((it, idx) => {
    if (!it.name.trim()) errors.push(`Hạng mục ${idx + 1}: thiếu Tên hạng mục`);
  });
  itemTaskLists.forEach(({ tasks }, idx) => {
    tasks.forEach((t, tidx) => {
      if (!t.name.trim()) errors.push(`Hạng mục ${idx + 1} → Công việc ${tidx + 1}: thiếu Tên công việc`);
    });
  });
  const totalTasks = itemTaskLists.reduce((s, x) => s + x.tasks.length, 0);

  const goNext = () => setStep(s => Math.min(3, s + 1));
  const goPrev = () => setStep(s => Math.max(0, s - 1));

  const handleSave = async () => {
    if (errors.length) return;
    setSaving(true); setError('');
    try {
      const customerName = customers.find(c => c.id === form.customerId)?.name || '';
      const info: NewProjectInfo = {
        projectCode: form.projectCode.trim(), name: form.name.trim(),
        customerId: form.customerId || '', customerName, address: form.address.trim(),
        projectType: form.projectType, startDate: form.startDate, handoverDate: form.handoverDate,
        contractValue: numOrZero(form.contractValue), budget: numOrZero(form.budget),
        status: form.status, progress: numOrZero(form.progress), note: form.note.trim(),
      };
      const payloadItems: NewProjectItem[] = meaningfulItems.map(it => ({
        name: it.name.trim(), startDate: it.startDate || undefined, endDate: it.endDate || undefined,
        progress: it.progress || 0, budget: it.budget || 0, actualCost: it.actualCost || 0,
        assignee: it.assignee || '', status: it.status || 'Đang làm', note: it.note || '',
        tasks: it.tasks.filter(isTaskMeaningful).map(t => ({
          name: t.name.trim(), startDate: t.startDate || undefined, days: t.days || 1,
          status: t.status || 'TODO', progress: t.progress || 0, note: t.note || '',
          assignee: t.assignee || '', priority: t.priority || 'Trung bình',
        })),
      }));
      await onCreate(info, payloadItems);
      reset();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Lỗi khi tạo dự án');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-3">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

            {/* Header + step tabs (bấm nhảy tự do, không chặn) */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {STEPS.map((s, i) => (
                  <button key={s.label} type="button" onClick={() => setStep(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                      step === i ? 'bg-indigo-600 text-white' : i < step ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}>
                    {i < step ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                    {s.label}
                  </button>
                ))}
              </div>
              <button onClick={() => { reset(); onClose(); }} className="p-1.5 hover:bg-slate-100 rounded-lg shrink-0">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* ── STEP 1: Nhập công trình ── */}
              {step === 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className={labelCls}>Tên công trình *</label>
                      <input className={`mt-1 ${inputCls}`} value={form.name} onChange={e => setF('name', e.target.value)} placeholder="VD: Nhà cô Lan - Q.7" />
                    </div>
                    <div>
                      <label className={labelCls}>Mã công trình</label>
                      <input className={`mt-1 ${inputCls}`} value={form.projectCode} onChange={e => setF('projectCode', e.target.value)} placeholder="CT-001" />
                    </div>
                    <div>
                      <label className={labelCls}>Loại công trình</label>
                      <select className={`mt-1 ${inputCls}`} value={form.projectType} onChange={e => setF('projectType', e.target.value)}>
                        <option value="">-- Chọn --</option>
                        {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Mã khách hàng *</label>
                      <div className="mt-1 flex gap-2">
                        <select className={inputCls} value={form.customerId} onChange={e => setF('customerId', e.target.value)}>
                          <option value="">-- Chọn khách hàng --</option>
                          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button onClick={() => setIsQuickCustomerOpen(true)} type="button"
                          className="shrink-0 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Địa chỉ</label>
                      <input className={`mt-1 ${inputCls}`} value={form.address} onChange={e => setF('address', e.target.value)} placeholder="123 Đường số 4, P. Tân Phong, Q7" />
                    </div>
                    <div>
                      <label className={labelCls}>Ngày bắt đầu</label>
                      <input type="date" className={`mt-1 ${inputCls}`} value={form.startDate} onChange={e => setF('startDate', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Ngày dự kiến hoàn thành</label>
                      <input type="date" className={`mt-1 ${inputCls}`} value={form.handoverDate} onChange={e => setF('handoverDate', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Giá trị hợp đồng (đ) *</label>
                      <input className={`mt-1 ${inputCls}`} value={form.contractValue} onChange={e => setF('contractValue', e.target.value)} placeholder="2800000000" />
                    </div>
                    <div>
                      <label className={labelCls}>Dự toán chi phí (đ)</label>
                      <input className={`mt-1 ${inputCls}`} value={form.budget} onChange={e => setF('budget', e.target.value)} placeholder="1700000000" />
                    </div>
                    <div>
                      <label className={labelCls}>Trạng thái</label>
                      <select className={`mt-1 ${inputCls}`} value={form.status} onChange={e => setF('status', e.target.value)}>
                        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Tiến độ (%)</label>
                      <input type="number" min={0} max={100} className={`mt-1 ${inputCls}`} value={form.progress} onChange={e => setF('progress', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Ghi chú</label>
                      <textarea rows={2} className={`mt-1 ${inputCls} resize-none`} value={form.note} onChange={e => setF('note', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Tạo hạng mục (table, cột # và Thao tác dán cố định) ── */}
              {step === 1 && (
                <div className="space-y-3">
                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="min-w-[1080px] w-full text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                        <tr>
                          <th className={`${thCls} sticky left-0 z-10 bg-slate-50 w-8 text-center`}>#</th>
                          <th className={`${thCls} min-w-[160px]`}>Tên hạng mục *</th>
                          <th className={thCls}>Bắt đầu</th>
                          <th className={thCls}>Kết thúc</th>
                          <th className={`${thCls} w-16`}>Tiến độ %</th>
                          <th className={`${thCls} min-w-[110px]`}>Chi phí dự kiến</th>
                          <th className={`${thCls} min-w-[110px]`}>Chi phí thực tế</th>
                          <th className={`${thCls} min-w-[150px]`}>Người phụ trách</th>
                          <th className={`${thCls} min-w-[110px]`}>Trạng thái</th>
                          <th className={`${thCls} min-w-[150px]`}>Ghi chú</th>
                          <th className={`${thCls} sticky right-0 z-10 bg-slate-50 text-center w-16`}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((it, idx) => (
                          <tr key={it._key} className="hover:bg-slate-50/70">
                            <td className="sticky left-0 z-10 bg-white px-2 py-1.5 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-2 py-1.5"><input className={cellInputCls} value={it.name} onChange={e => updateItem(it._key, { name: e.target.value })} placeholder="VD: Phần thô" /></td>
                            <td className="px-2 py-1.5"><input type="date" className={cellInputCls} value={it.startDate || ''} onChange={e => updateItem(it._key, { startDate: e.target.value })} /></td>
                            <td className="px-2 py-1.5"><input type="date" className={cellInputCls} value={it.endDate || ''} onChange={e => updateItem(it._key, { endDate: e.target.value })} /></td>
                            <td className="px-2 py-1.5"><input type="number" min={0} max={100} className={cellInputCls} value={it.progress || 0} onChange={e => updateItem(it._key, { progress: numOrZero(e.target.value) })} /></td>
                            <td className="px-2 py-1.5"><input className={cellInputCls} value={it.budget || ''} onChange={e => updateItem(it._key, { budget: numOrZero(e.target.value) })} placeholder="0" /></td>
                            <td className="px-2 py-1.5"><input className={cellInputCls} value={it.actualCost || ''} onChange={e => updateItem(it._key, { actualCost: numOrZero(e.target.value) })} placeholder="0" /></td>
                            <td className="px-2 py-1.5"><MultiSelectStaff options={staff} value={it.assignee || ''} onChange={v => updateItem(it._key, { assignee: v })} /></td>
                            <td className="px-2 py-1.5">
                              <select className={cellInputCls} value={it.status || 'Đang làm'} onChange={e => updateItem(it._key, { status: e.target.value })}>
                                {ITEM_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-1.5"><input className={cellInputCls} value={it.note || ''} onChange={e => updateItem(it._key, { note: e.target.value })} /></td>
                            <td className="sticky right-0 z-10 bg-white px-2 py-1.5">
                              <div className="flex items-center justify-center gap-1">
                                <button type="button" onClick={() => duplicateItem(it._key)} className="p-1 text-slate-400 hover:text-indigo-600"><Copy className="w-3.5 h-3.5" /></button>
                                <button type="button" onClick={() => removeItem(it._key)} disabled={items.length <= 1} className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={addItem} type="button" className="w-full py-2 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Thêm hạng mục
                  </button>
                </div>
              )}

              {/* ── STEP 3: Tạo công việc (accordion theo hạng mục, mỗi hạng mục là 1 table) ── */}
              {step === 2 && (
                <div className="space-y-2">
                  {items.every(it => !it.name.trim()) && (
                    <p className="text-xs text-slate-400 text-center py-6">Chưa có hạng mục nào ở bước trước — quay lại bước 2 để thêm hạng mục.</p>
                  )}
                  {items.filter(it => it.name.trim()).map(it => {
                    const isOpen2 = expandedItem === it._key;
                    return (
                      <div key={it._key} className="border border-slate-200 rounded-xl overflow-hidden">
                        <button onClick={() => setExpandedItem(isOpen2 ? null : it._key)} type="button"
                          className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100">
                          <span className="text-sm font-bold text-slate-700">{it.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">{it.tasks.filter(t => t.name.trim()).length} công việc</span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen2 ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        {isOpen2 && (
                          <div className="p-3 space-y-2">
                            <div className="border border-slate-200 rounded-xl overflow-x-auto">
                              <table className="min-w-[860px] w-full text-xs border-collapse">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                                  <tr>
                                    <th className={`${thCls} min-w-[160px]`}>Tên công việc *</th>
                                    <th className={`${thCls} min-w-[140px]`}>Người phụ trách</th>
                                    <th className={thCls}>Bắt đầu</th>
                                    <th className={`${thCls} w-16`}>Số ngày</th>
                                    <th className={`${thCls} min-w-[100px]`}>Ưu tiên</th>
                                    <th className={`${thCls} min-w-[110px]`}>Trạng thái</th>
                                    <th className={`${thCls} w-16`}>Tiến độ %</th>
                                    <th className={`${thCls} min-w-[140px]`}>Ghi chú</th>
                                    <th className={`${thCls} text-center w-16`}>Thao tác</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {it.tasks.map(t => (
                                    <tr key={t._key} className="hover:bg-slate-50/70">
                                      <td className="px-2 py-1.5"><input className={cellInputCls} value={t.name} onChange={e => updateTask(it._key, t._key, { name: e.target.value })} /></td>
                                      <td className="px-2 py-1.5"><MultiSelectStaff options={staff} value={t.assignee || ''} onChange={v => updateTask(it._key, t._key, { assignee: v })} /></td>
                                      <td className="px-2 py-1.5"><input type="date" className={cellInputCls} value={t.startDate || ''} onChange={e => updateTask(it._key, t._key, { startDate: e.target.value })} /></td>
                                      <td className="px-2 py-1.5"><input type="number" min={1} className={cellInputCls} value={t.days || 1} onChange={e => updateTask(it._key, t._key, { days: numOrZero(e.target.value) || 1 })} /></td>
                                      <td className="px-2 py-1.5">
                                        <select className={cellInputCls} value={t.priority || 'Trung bình'} onChange={e => updateTask(it._key, t._key, { priority: e.target.value })}>
                                          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                      </td>
                                      <td className="px-2 py-1.5">
                                        <select className={cellInputCls} value={t.status || 'TODO'} onChange={e => updateTask(it._key, t._key, { status: e.target.value })}>
                                          {TASK_STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                      </td>
                                      <td className="px-2 py-1.5"><input type="number" min={0} max={100} className={cellInputCls} value={t.progress || 0} onChange={e => updateTask(it._key, t._key, { progress: numOrZero(e.target.value) })} /></td>
                                      <td className="px-2 py-1.5"><input className={cellInputCls} value={t.note || ''} onChange={e => updateTask(it._key, t._key, { note: e.target.value })} /></td>
                                      <td className="px-2 py-1.5">
                                        <div className="flex items-center justify-center gap-1">
                                          <button type="button" onClick={() => duplicateTask(it._key, t._key)} className="p-1 text-slate-400 hover:text-indigo-600"><Copy className="w-3.5 h-3.5" /></button>
                                          <button type="button" onClick={() => removeTask(it._key, t._key)} className="p-1 text-slate-400 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                  {it.tasks.length === 0 && (
                                    <tr><td colSpan={9} className="px-3 py-4 text-center text-slate-400">Chưa có công việc</td></tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            <button onClick={() => addTask(it._key)} type="button" className="w-full py-1.5 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-lg text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1.5">
                              <Plus className="w-3 h-3" /> Thêm công việc
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── STEP 4: Kiểm tra ── */}
              {step === 3 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Hạng mục', value: meaningfulItems.length },
                      { label: 'Công việc', value: totalTasks },
                      { label: 'File', value: 0 },
                      { label: 'Lỗi', value: errors.length },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                        <p className={`text-xl font-black ${s.label === 'Lỗi' && s.value > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {errors.length > 0 ? (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 space-y-1.5">
                      {errors.map((err, i) => (
                        <p key={i} className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {err}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <p className="text-xs text-emerald-700 font-bold flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Dữ liệu hợp lệ, sẵn sàng lưu.</p>
                    </div>
                  )}

                  <div className="border border-slate-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Công trình mới</p>
                    <p className="text-sm font-bold text-slate-700">{form.name || '(chưa đặt tên)'}</p>
                    <div className="mt-2 space-y-2">
                      {itemTaskLists.map(({ item, tasks }, idx) => (
                        <div key={item._key} className="pl-3 border-l-2 border-indigo-200">
                          <p className="text-xs font-bold text-slate-700">{idx + 1}. {item.name || '(chưa đặt tên)'}</p>
                          {tasks.length > 0 ? (
                            <ul className="mt-1 space-y-0.5">
                              {tasks.map(t => (
                                <li key={t._key} className="text-xs text-slate-500 pl-3">— {t.name || '(chưa đặt tên)'} ({t.days || 1} ngày)</li>
                              ))}
                            </ul>
                          ) : <p className="text-xs text-slate-400 pl-3">Chưa có công việc</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-rose-600 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}</p>}
            </div>

            {/* Footer nav */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button onClick={goPrev} disabled={step === 0} type="button"
                className="px-4 py-2 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-50 disabled:opacity-30 flex items-center gap-1.5">
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>
              {step < 3 ? (
                <button onClick={goNext} type="button"
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5">
                  Tiếp tục <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSave} disabled={saving || errors.length > 0} type="button"
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 disabled:opacity-50">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : errors.length > 0 ? <><AlertCircle className="w-4 h-4" /> Cần sửa lỗi</> : <><Check className="w-4 h-4" /> Lưu công trình</>}
                </button>
              )}
            </div>
          </motion.div>

          {/* Modal "Tạo nhanh khách hàng" — khớp saveQuickCustomer34 (Tên/SĐT/Email/Người liên hệ/Địa chỉ/Ghi chú) */}
          <AnimatePresence>
            {isQuickCustomerOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center p-3" onClick={() => setIsQuickCustomerOpen(false)}>
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                  onClick={e => e.stopPropagation()} className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-800">Tạo nhanh khách hàng</p>
                    <button onClick={() => setIsQuickCustomerOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  <div className="p-4 space-y-2.5">
                    <div><label className={labelCls}>Tên khách hàng *</label>
                      <input className={`mt-1 ${inputCls}`} value={quickCustomer.name} onChange={e => setQuickCustomer(q => ({ ...q, name: e.target.value }))} autoFocus /></div>
                    <div><label className={labelCls}>Số điện thoại</label>
                      <input className={`mt-1 ${inputCls}`} value={quickCustomer.phone} onChange={e => setQuickCustomer(q => ({ ...q, phone: e.target.value }))} /></div>
                    <div><label className={labelCls}>Email</label>
                      <input className={`mt-1 ${inputCls}`} value={quickCustomer.email} onChange={e => setQuickCustomer(q => ({ ...q, email: e.target.value }))} /></div>
                    <div><label className={labelCls}>Người liên hệ</label>
                      <input className={`mt-1 ${inputCls}`} value={quickCustomer.contact_person} onChange={e => setQuickCustomer(q => ({ ...q, contact_person: e.target.value }))} /></div>
                    <div><label className={labelCls}>Địa chỉ</label>
                      <textarea rows={2} className={`mt-1 ${inputCls} resize-none`} value={quickCustomer.address} onChange={e => setQuickCustomer(q => ({ ...q, address: e.target.value }))} /></div>
                    <div><label className={labelCls}>Ghi chú</label>
                      <textarea rows={2} className={`mt-1 ${inputCls} resize-none`} value={quickCustomer.note} onChange={e => setQuickCustomer(q => ({ ...q, note: e.target.value }))} /></div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setIsQuickCustomerOpen(false)} type="button" className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">Hủy</button>
                      <button onClick={handleSaveQuickCustomer} type="button" className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5"><Check className="w-4 h-4" /> Lưu & chọn</button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
