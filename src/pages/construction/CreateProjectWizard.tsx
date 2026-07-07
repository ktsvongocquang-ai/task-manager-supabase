import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, ChevronLeft, ChevronRight, ChevronDown, AlertCircle, Check, Loader2, Building2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import type { NewProjectItem, NewItemTask } from '../../hooks/useConstructionData';

// ═══════════════════════════════════════════════════════════
// Wizard "Tạo 1 công trình đầy đủ": Nhập công trình → Tạo hạng mục → Tạo công việc → Kiểm tra
// Không lưu incremental — chỉ gửi 1 lần ở bước cuối (giống app tham khảo).
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

const STEPS = ['Nhập công trình', 'Tạo hạng mục', 'Tạo công việc', 'Kiểm tra'];

const numOrZero = (v: string) => parseInt(v.replace(/\D/g, '')) || 0;
const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white';
const labelCls = 'text-[11px] font-bold text-slate-500 uppercase tracking-wide';

const emptyForm = () => ({
  projectCode: '', name: '', customerId: '', address: '', projectType: '',
  startDate: '', handoverDate: '', contractValue: '', budget: '', status: 'preparing', progress: '0', note: '',
});

const emptyItem = (): WizardItem => ({
  _key: crypto.randomUUID(), name: '', startDate: '', endDate: '', progress: 0, budget: 0,
  actualCost: 0, assignee: '', status: 'Đang làm', note: '', tasks: [],
});

const emptyTask = (): WizardTask => ({
  _key: crypto.randomUUID(), name: '', startDate: '', days: 1, status: 'TODO', progress: 0, note: '',
});

export function CreateProjectWizard({ isOpen, onClose, onCreate }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm());
  const [items, setItems] = useState<WizardItem[]>([emptyItem()]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStep(0); setForm(emptyForm()); setItems([emptyItem()]); setExpandedItem(null);
    setIsAddingCustomer(false); setNewCustomerName(''); setError('');
  };

  useEffect(() => {
    if (!isOpen) return;
    reset();
    (async () => {
      const [custRes, lookupRes] = await Promise.all([
        supabase.from('customers').select('id,name').order('name'),
        supabase.from('finance_lookups').select('label').eq('list_key', 'project_type').order('sort_order'),
      ]);
      if (custRes.data) setCustomers(custRes.data as { id: string; name: string }[]);
      if (lookupRes.data) setProjectTypes((lookupRes.data as { label: string }[]).map(l => l.label));
    })();
  }, [isOpen]);

  const setF = (k: keyof ReturnType<typeof emptyForm>, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleQuickAddCustomer = async () => {
    if (!newCustomerName.trim()) return;
    const { data, error: e } = await supabase.from('customers').insert([{ name: newCustomerName.trim() }]).select().single();
    if (e || !data) { setError('Không tạo được khách hàng mới'); return; }
    setCustomers(prev => [...prev, { id: data.id, name: data.name }].sort((a, b) => a.name.localeCompare(b.name)));
    setF('customerId', data.id);
    setNewCustomerName(''); setIsAddingCustomer(false);
  };

  const updateItem = (key: string, patch: Partial<WizardItem>) =>
    setItems(prev => prev.map(it => it._key === key ? { ...it, ...patch } : it));
  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (key: string) => setItems(prev => prev.length > 1 ? prev.filter(it => it._key !== key) : prev);

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

  const namedItems = items.filter(it => it.name.trim());
  const totalTasks = namedItems.reduce((s, it) => s + it.tasks.filter(t => t.name.trim()).length, 0);

  const validateStep1 = () => {
    if (!form.name.trim()) { setError('Vui lòng nhập Tên công trình'); return false; }
    if (numOrZero(form.contractValue) <= 0) { setError('Vui lòng nhập Giá trị hợp đồng'); return false; }
    setError(''); return true;
  };

  const goNext = () => {
    if (step === 0 && !validateStep1()) return;
    setError('');
    setStep(s => Math.min(3, s + 1));
  };
  const goPrev = () => { setError(''); setStep(s => Math.max(0, s - 1)); };

  const handleSave = async () => {
    if (!validateStep1()) { setStep(0); return; }
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
      const payloadItems: NewProjectItem[] = namedItems.map(it => ({
        name: it.name.trim(), startDate: it.startDate || undefined, endDate: it.endDate || undefined,
        progress: it.progress || 0, budget: it.budget || 0, actualCost: it.actualCost || 0,
        assignee: it.assignee || '', status: it.status || 'Đang làm', note: it.note || '',
        tasks: it.tasks.filter(t => t.name.trim()).map(t => ({
          name: t.name.trim(), startDate: t.startDate || undefined, days: t.days || 1,
          status: t.status || 'TODO', progress: t.progress || 0, note: t.note || '',
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
            className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

            {/* Header + step indicator */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 overflow-x-auto">
                <Building2 className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                  {STEPS.map((label, i) => (
                    <React.Fragment key={label}>
                      {i > 0 && <span className="text-slate-300">›</span>}
                      <span className={`font-bold ${step === i ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {i + 1}. {label}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
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
                      <label className={labelCls}>Mã khách hàng</label>
                      {!isAddingCustomer ? (
                        <div className="mt-1 flex gap-2">
                          <select className={inputCls} value={form.customerId} onChange={e => setF('customerId', e.target.value)}>
                            <option value="">-- Chọn khách hàng --</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <button onClick={() => setIsAddingCustomer(true)} type="button"
                            className="shrink-0 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500"><Plus className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="mt-1 flex gap-2">
                          <input className={inputCls} value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="Tên khách hàng mới" autoFocus />
                          <button onClick={handleQuickAddCustomer} type="button" className="shrink-0 px-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"><Check className="w-4 h-4" /></button>
                          <button onClick={() => { setIsAddingCustomer(false); setNewCustomerName(''); }} type="button" className="shrink-0 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500"><X className="w-4 h-4" /></button>
                        </div>
                      )}
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

              {/* ── STEP 2: Tạo hạng mục ── */}
              {step === 1 && (
                <div className="space-y-3">
                  {items.map((it, idx) => (
                    <div key={it._key} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600">Hạng mục {idx + 1}</span>
                        {items.length > 1 && (
                          <button onClick={() => removeItem(it._key)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="col-span-2 md:col-span-2">
                          <label className={labelCls}>Tên hạng mục *</label>
                          <input className={`mt-1 ${inputCls}`} value={it.name} onChange={e => updateItem(it._key, { name: e.target.value })} placeholder="VD: Phần thô" />
                        </div>
                        <div>
                          <label className={labelCls}>Bắt đầu</label>
                          <input type="date" className={`mt-1 ${inputCls}`} value={it.startDate || ''} onChange={e => updateItem(it._key, { startDate: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelCls}>Kết thúc</label>
                          <input type="date" className={`mt-1 ${inputCls}`} value={it.endDate || ''} onChange={e => updateItem(it._key, { endDate: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelCls}>Tiến độ (%)</label>
                          <input type="number" min={0} max={100} className={`mt-1 ${inputCls}`} value={it.progress || 0} onChange={e => updateItem(it._key, { progress: numOrZero(e.target.value) })} />
                        </div>
                        <div>
                          <label className={labelCls}>Chi phí dự kiến</label>
                          <input className={`mt-1 ${inputCls}`} value={it.budget || ''} onChange={e => updateItem(it._key, { budget: numOrZero(e.target.value) })} placeholder="0" />
                        </div>
                        <div>
                          <label className={labelCls}>Chi phí thực tế</label>
                          <input className={`mt-1 ${inputCls}`} value={it.actualCost || ''} onChange={e => updateItem(it._key, { actualCost: numOrZero(e.target.value) })} placeholder="0" />
                        </div>
                        <div>
                          <label className={labelCls}>Người phụ trách</label>
                          <input className={`mt-1 ${inputCls}`} value={it.assignee || ''} onChange={e => updateItem(it._key, { assignee: e.target.value })} />
                        </div>
                        <div className="col-span-2 md:col-span-4">
                          <label className={labelCls}>Trạng thái</label>
                          <select className={`mt-1 ${inputCls} md:w-40`} value={it.status || 'Đang làm'} onChange={e => updateItem(it._key, { status: e.target.value })}>
                            {ITEM_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addItem} type="button" className="w-full py-2 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Thêm hạng mục
                  </button>
                </div>
              )}

              {/* ── STEP 3: Tạo công việc ── */}
              {step === 2 && (
                <div className="space-y-2">
                  {namedItems.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">Chưa có hạng mục nào ở bước trước — quay lại bước 2 để thêm hạng mục.</p>
                  )}
                  {namedItems.map(it => {
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
                            {it.tasks.map(t => (
                              <div key={t._key} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end border-b border-slate-100 pb-2">
                                <div className="col-span-2">
                                  <label className={labelCls}>Tên công việc *</label>
                                  <input className={`mt-1 ${inputCls}`} value={t.name} onChange={e => updateTask(it._key, t._key, { name: e.target.value })} />
                                </div>
                                <div>
                                  <label className={labelCls}>Bắt đầu</label>
                                  <input type="date" className={`mt-1 ${inputCls}`} value={t.startDate || ''} onChange={e => updateTask(it._key, t._key, { startDate: e.target.value })} />
                                </div>
                                <div>
                                  <label className={labelCls}>Số ngày</label>
                                  <input type="number" min={1} className={`mt-1 ${inputCls}`} value={t.days || 1} onChange={e => updateTask(it._key, t._key, { days: numOrZero(e.target.value) || 1 })} />
                                </div>
                                <div>
                                  <label className={labelCls}>Trạng thái</label>
                                  <select className={`mt-1 ${inputCls}`} value={t.status || 'TODO'} onChange={e => updateTask(it._key, t._key, { status: e.target.value })}>
                                    {TASK_STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                  </select>
                                </div>
                                <div className="flex items-end gap-1">
                                  <div className="flex-1">
                                    <label className={labelCls}>Tiến độ (%)</label>
                                    <input type="number" min={0} max={100} className={`mt-1 ${inputCls}`} value={t.progress || 0} onChange={e => updateTask(it._key, t._key, { progress: numOrZero(e.target.value) })} />
                                  </div>
                                  <button onClick={() => removeTask(it._key, t._key)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            ))}
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
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <p className="text-sm font-bold text-indigo-700">{form.name}</p>
                    <p className="text-xs text-indigo-600 mt-1">
                      {namedItems.length} hạng mục · {totalTasks} công việc · Giá trị hợp đồng: {numOrZero(form.contractValue).toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                  <div className="space-y-2">
                    {namedItems.map(it => (
                      <div key={it._key} className="border border-slate-200 rounded-xl p-3">
                        <p className="text-sm font-bold text-slate-700">{it.name}</p>
                        {it.tasks.filter(t => t.name.trim()).length > 0 ? (
                          <ul className="mt-1.5 space-y-1">
                            {it.tasks.filter(t => t.name.trim()).map(t => (
                              <li key={t._key} className="text-xs text-slate-500 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-slate-300" /> {t.name} ({t.days || 1} ngày)
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400 mt-1">Chưa có công việc</p>
                        )}
                      </div>
                    ))}
                    {namedItems.length === 0 && (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-3">Dự án sẽ được tạo không kèm hạng mục nào. Bạn có thể thêm hạng mục sau.</p>
                    )}
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
                <button onClick={handleSave} disabled={saving} type="button"
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 disabled:opacity-50">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : <><Check className="w-4 h-4" /> Lưu công trình</>}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
