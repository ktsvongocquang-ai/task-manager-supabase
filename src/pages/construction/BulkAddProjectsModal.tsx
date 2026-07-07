import { useState, useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Copy, ChevronDown, ChevronUp, AlertCircle, Check, Loader2, Layers, Image as ImageIcon, FileText } from 'lucide-react';
import { supabase } from '../../services/supabase';

// ═══════════════════════════════════════════════════════════
// "Thêm nhiều công trình nhanh": nhiều thẻ công trình cùng lúc, mỗi thẻ có
// 2 ô upload (Ảnh công trình / Hồ sơ hợp đồng). Review-gate 2 lần bấm — khớp
// saveWizardRows()/renderWizardReview() của app tham khảo.
// ═══════════════════════════════════════════════════════════

export interface BulkProjectRow {
  name: string; customerId: string; customerName: string; address: string; projectType: string;
  startDate: string; handoverDate: string; contractValue: number; budget: number;
  managerName: string; status: string; progress: number; note: string;
  photoFile?: File; contractFile?: File;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (rows: BulkProjectRow[]) => Promise<{ created: number; uploadErrors: number }>;
}

interface Card {
  _key: string; name: string; customerId: string; address: string; projectType: string;
  startDate: string; handoverDate: string; contractValue: string; budget: string;
  managerName: string; status: string; progress: string; note: string;
  photoFile?: File; contractFile?: File;
  open: boolean;
}

const STATUS_OPTIONS = [
  { value: 'preparing', label: 'Chuẩn bị' },
  { value: 'in_progress', label: 'Đang thi công' },
  { value: 'paused', label: 'Tạm dừng' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'warranty', label: 'Bảo hành' },
];

const numOrZero = (v: string) => parseInt(v.replace(/\D/g, '')) || 0;
const inputCls = 'w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white';
const labelCls = 'text-[10px] font-bold text-slate-500 uppercase tracking-wide';

const emptyCard = (): Card => ({
  _key: crypto.randomUUID(), name: '', customerId: '', address: '', projectType: '',
  startDate: '', handoverDate: '', contractValue: '', budget: '', managerName: '',
  status: 'preparing', progress: '0', note: '', open: true,
});

const isCardMeaningful = (c: Card) =>
  !!(c.name.trim() || c.customerId || c.address.trim() || numOrZero(c.contractValue) || c.photoFile || c.contractFile);

export function BulkAddProjectsModal({ isOpen, onClose, onCreate }: Props) {
  const [cards, setCards] = useState<Card[]>([emptyCard(), emptyCard(), emptyCard()]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [staff, setStaff] = useState<{ id: string; full_name: string }[]>([]);
  const [mode, setMode] = useState<'edit' | 'review'>('edit');
  const [quickCustomerFor, setQuickCustomerFor] = useState<string | null>(null);
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ created: number; uploadErrors: number } | null>(null);

  const reset = () => {
    setCards([emptyCard(), emptyCard(), emptyCard()]);
    setMode('edit'); setQuickCustomerFor(null); setQuickCustomerName('');
    setError(''); setResult(null);
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
      if (staffRes.data) setStaff((staffRes.data as any[]).filter(p => p.full_name));
    })();
  }, [isOpen]);

  const updateCard = (key: string, patch: Partial<Card>) =>
    setCards(prev => prev.map(c => c._key === key ? { ...c, ...patch } : c));
  const addCard = () => setCards(prev => [...prev, emptyCard()]);
  const removeCard = (key: string) => setCards(prev => prev.length > 1 ? prev.filter(c => c._key !== key) : prev);
  const duplicateCard = (key: string) => setCards(prev => {
    const idx = prev.findIndex(c => c._key === key);
    if (idx === -1) return prev;
    const clone: Card = { ...prev[idx], _key: crypto.randomUUID(), photoFile: undefined, contractFile: undefined, open: true };
    const next = [...prev];
    next.splice(idx + 1, 0, clone);
    return next;
  });
  const toggleCard = (key: string) => updateCard(key, { open: !cards.find(c => c._key === key)?.open });

  const handleSaveQuickCustomer = async () => {
    if (!quickCustomerName.trim() || !quickCustomerFor) return;
    const { data, error: e } = await supabase.from('customers').insert([{ name: quickCustomerName.trim() }]).select().single();
    if (e || !data) { setError('Không tạo được khách hàng mới'); return; }
    setCustomers(prev => [...prev, { id: data.id, name: data.name }].sort((a, b) => a.name.localeCompare(b.name)));
    updateCard(quickCustomerFor, { customerId: data.id });
    setQuickCustomerName(''); setQuickCustomerFor(null);
  };

  const meaningfulCards = cards.filter(isCardMeaningful);
  const errors: string[] = [];
  meaningfulCards.forEach((c, idx) => {
    if (!c.name.trim()) errors.push(`Dòng ${idx + 1}: thiếu Tên công trình`);
    if (!c.customerId) errors.push(`Dòng ${idx + 1}: thiếu Mã khách hàng`);
    if (numOrZero(c.contractValue) <= 0) errors.push(`Dòng ${idx + 1}: thiếu Giá trị hợp đồng`);
  });
  const fileCount = meaningfulCards.reduce((s, c) => s + (c.photoFile ? 1 : 0) + (c.contractFile ? 1 : 0), 0);
  const totalContract = meaningfulCards.reduce((s, c) => s + numOrZero(c.contractValue), 0);

  const goReview = () => setMode('review');
  const goEdit = () => setMode('edit');

  const handleSave = async () => {
    if (errors.length || !meaningfulCards.length) return;
    setSaving(true); setError('');
    try {
      const rows: BulkProjectRow[] = meaningfulCards.map(c => ({
        name: c.name.trim(), customerId: c.customerId,
        customerName: customers.find(cu => cu.id === c.customerId)?.name || '',
        address: c.address.trim(), projectType: c.projectType,
        startDate: c.startDate, handoverDate: c.handoverDate,
        contractValue: numOrZero(c.contractValue), budget: numOrZero(c.budget),
        managerName: c.managerName, status: c.status, progress: numOrZero(c.progress), note: c.note.trim(),
        photoFile: c.photoFile, contractFile: c.contractFile,
      }));
      const res = await onCreate(rows);
      setResult(res);
    } catch (e: any) {
      setError(e?.message || 'Lỗi khi tạo công trình');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseAll = () => { reset(); onClose(); };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-3">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <p className="text-sm font-bold text-slate-800">Thêm nhiều công trình nhanh</p>
              </div>
              <button onClick={handleCloseAll} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {result ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                  <Check className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-emerald-700">
                    Đã tạo {result.created} công trình{result.uploadErrors > 0 ? `, ${result.uploadErrors} file lỗi cần kiểm tra` : ''}.
                  </p>
                  <button onClick={handleCloseAll} type="button" className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg">Đóng</button>
                </div>
              ) : mode === 'edit' ? (
                <>
                  {cards.map((c, idx) => (
                    <CardEditor key={c._key} card={c} index={idx} canRemove={cards.length > 1}
                      customers={customers} projectTypes={projectTypes} staff={staff}
                      onUpdate={patch => updateCard(c._key, patch)}
                      onDuplicate={() => duplicateCard(c._key)}
                      onRemove={() => removeCard(c._key)}
                      onToggle={() => toggleCard(c._key)}
                      onQuickAddCustomer={() => { setQuickCustomerFor(c._key); setQuickCustomerName(''); }}
                    />
                  ))}
                  <button onClick={addCard} type="button" className="w-full py-2 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Thêm dòng
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Dòng dữ liệu', value: meaningfulCards.length },
                      { label: 'Dòng lỗi', value: errors.length },
                      { label: 'File đính kèm', value: fileCount },
                      { label: 'Tổng giá trị', value: `${(totalContract / 1e9).toFixed(1)} Tỷ` },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                        <p className={`text-lg font-black ${s.label === 'Dòng lỗi' && Number(s.value) > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  {errors.length > 0 ? (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 space-y-1.5">
                      {errors.map((err, i) => (
                        <p key={i} className="text-xs text-rose-700 font-medium flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {err}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <p className="text-xs text-emerald-700 font-bold flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Dữ liệu hợp lệ, sẵn sàng lưu.</p>
                    </div>
                  )}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                        <tr><th className="px-3 py-2 text-left">Tên công trình</th><th className="px-3 py-2 text-left">Khách hàng</th><th className="px-3 py-2 text-right">Giá trị hợp đồng</th><th className="px-3 py-2 text-center">File</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {meaningfulCards.map((c) => (
                          <tr key={c._key}>
                            <td className="px-3 py-2 font-bold text-slate-700">{c.name || '(chưa đặt tên)'}</td>
                            <td className="px-3 py-2 text-slate-500">{customers.find(cu => cu.id === c.customerId)?.name || '--'}</td>
                            <td className="px-3 py-2 text-right">{numOrZero(c.contractValue).toLocaleString('vi-VN')} đ</td>
                            <td className="px-3 py-2 text-center text-slate-400">{(c.photoFile ? 1 : 0) + (c.contractFile ? 1 : 0)}</td>
                          </tr>
                        ))}
                        {meaningfulCards.length === 0 && <tr><td colSpan={4} className="px-3 py-4 text-center text-slate-400">Chưa có dòng nào</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-rose-600 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}</p>}
            </div>

            {!result && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between shrink-0">
                {mode === 'review' ? (
                  <button onClick={goEdit} type="button" className="px-4 py-2 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-50">← Quay lại sửa</button>
                ) : <span />}
                {mode === 'edit' ? (
                  <button onClick={goReview} type="button" className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5">Kiểm tra dữ liệu</button>
                ) : (
                  <button onClick={handleSave} disabled={saving || errors.length > 0 || !meaningfulCards.length} type="button"
                    className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 disabled:opacity-50">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : errors.length > 0 ? <><AlertCircle className="w-4 h-4" /> Cần sửa lỗi</> : <><Check className="w-4 h-4" /> Lưu dữ liệu</>}
                  </button>
                )}
              </div>
            )}
          </motion.div>

          {/* Quick-add customer mini modal */}
          <AnimatePresence>
            {quickCustomerFor && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center p-3" onClick={() => setQuickCustomerFor(null)}>
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                  onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-800">Tạo nhanh khách hàng</p>
                    <button onClick={() => setQuickCustomerFor(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  <div className="p-4 space-y-2.5">
                    <input className={inputCls} value={quickCustomerName} onChange={e => setQuickCustomerName(e.target.value)} placeholder="Tên khách hàng" autoFocus />
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setQuickCustomerFor(null)} type="button" className="flex-1 px-3 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-50">Hủy</button>
                      <button onClick={handleSaveQuickCustomer} type="button" className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg">Lưu & chọn</button>
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

// ── 1 thẻ công trình trong danh sách "Thêm nhiều nhanh" ──
function CardEditor({ card, index, canRemove, customers, projectTypes, staff, onUpdate, onDuplicate, onRemove, onToggle, onQuickAddCustomer }: {
  card: Card; index: number; canRemove: boolean;
  customers: { id: string; name: string }[]; projectTypes: string[]; staff: { id: string; full_name: string }[];
  onUpdate: (patch: Partial<Card>) => void; onDuplicate: () => void; onRemove: () => void; onToggle: () => void;
  onQuickAddCustomer: () => void;
}) {
  const photoRef = useRef<HTMLInputElement>(null);
  const contractRef = useRef<HTMLInputElement>(null);
  const filledCount = [card.name, card.customerId, card.address, card.projectType, card.startDate, card.handoverDate, card.contractValue, card.budget, card.managerName, card.note].filter(v => String(v || '').trim()).length;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center">{index + 1}</span>
          <div>
            <p className="text-xs font-bold text-slate-700">{card.name || `Công trình ${index + 1}`}</p>
            <p className="text-[10px] text-slate-400">{filledCount} trường đã nhập{(card.photoFile || card.contractFile) ? `, ${(card.photoFile ? 1 : 0) + (card.contractFile ? 1 : 0)} file` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onDuplicate} className="p-1.5 text-slate-400 hover:text-indigo-600" title="Nhân bản"><Copy className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={onToggle} className="p-1.5 text-slate-400 hover:text-slate-600">{card.open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
          <button type="button" onClick={onRemove} disabled={!canRemove} className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {card.open && (
        <div className="p-3 space-y-2.5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="col-span-2">
              <label className={labelCls}>Tên công trình *</label>
              <input className={`mt-1 ${inputCls}`} value={card.name} onChange={e => onUpdate({ name: e.target.value })} placeholder="VD: Nhà cô Lan - Q.7" />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Mã khách hàng *</label>
              <div className="mt-1 flex gap-1.5">
                <select className={inputCls} value={card.customerId} onChange={e => onUpdate({ customerId: e.target.value })}>
                  <option value="">-- Chọn --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={onQuickAddCustomer} type="button" className="shrink-0 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Loại công trình</label>
              <select className={`mt-1 ${inputCls}`} value={card.projectType} onChange={e => onUpdate({ projectType: e.target.value })}>
                <option value="">-- Chọn --</option>
                {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Người phụ trách</label>
              <select className={`mt-1 ${inputCls}`} value={card.managerName} onChange={e => onUpdate({ managerName: e.target.value })}>
                <option value="">-- Chọn --</option>
                {staff.map(s => <option key={s.id} value={s.full_name}>{s.full_name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Địa chỉ</label>
              <input className={`mt-1 ${inputCls}`} value={card.address} onChange={e => onUpdate({ address: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Ngày bắt đầu</label>
              <input type="date" className={`mt-1 ${inputCls}`} value={card.startDate} onChange={e => onUpdate({ startDate: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Ngày dự kiến hoàn thành</label>
              <input type="date" className={`mt-1 ${inputCls}`} value={card.handoverDate} onChange={e => onUpdate({ handoverDate: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Giá trị hợp đồng (đ) *</label>
              <input className={`mt-1 ${inputCls}`} value={card.contractValue} onChange={e => onUpdate({ contractValue: e.target.value })} placeholder="2800000000" />
            </div>
            <div>
              <label className={labelCls}>Dự toán chi phí (đ)</label>
              <input className={`mt-1 ${inputCls}`} value={card.budget} onChange={e => onUpdate({ budget: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>Trạng thái</label>
              <select className={`mt-1 ${inputCls}`} value={card.status} onChange={e => onUpdate({ status: e.target.value })}>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Tiến độ (%)</label>
              <input type="number" min={0} max={100} className={`mt-1 ${inputCls}`} value={card.progress} onChange={e => onUpdate({ progress: e.target.value })} />
            </div>
            <div className="col-span-2 md:col-span-4">
              <label className={labelCls}>Ghi chú</label>
              <input className={`mt-1 ${inputCls}`} value={card.note} onChange={e => onUpdate({ note: e.target.value })} />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2.5">
            <p className={`${labelCls} mb-1.5`}>File/ảnh đính kèm</p>
            <div className="grid grid-cols-2 gap-2">
              <FileSlot icon={<ImageIcon className="w-4 h-4" />} label="Ảnh công trình" file={card.photoFile}
                inputRef={photoRef} accept="image/*" onSelect={f => onUpdate({ photoFile: f })} onRemove={() => onUpdate({ photoFile: undefined })} />
              <FileSlot icon={<FileText className="w-4 h-4" />} label="Hồ sơ / hợp đồng" file={card.contractFile}
                inputRef={contractRef} accept=".pdf,.doc,.docx,.xlsx,.xls,image/*" onSelect={f => onUpdate({ contractFile: f })} onRemove={() => onUpdate({ contractFile: undefined })} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileSlot({ icon, label, file, inputRef, accept, onSelect, onRemove }: {
  icon: ReactNode; label: string; file?: File; inputRef: RefObject<HTMLInputElement | null>;
  accept: string; onSelect: (f: File) => void; onRemove: () => void;
}) {
  return (
    <div onClick={() => !file && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-2.5 text-center ${file ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 hover:border-indigo-300 cursor-pointer'}`}>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onSelect(f); e.target.value = ''; }} />
      {file ? (
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] text-emerald-700 font-bold truncate flex items-center gap-1">{icon} {file.name}</span>
          <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }} className="text-slate-400 hover:text-rose-500 shrink-0"><X className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">{icon} {label}</span>
      )}
    </div>
  );
}
