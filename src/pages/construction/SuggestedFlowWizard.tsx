import { Fragment, useEffect, useMemo, useState } from 'react';
import { X, ListChecks, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { addDays, format, parseISO } from 'date-fns';
import { PROJECT_TYPES } from './types';

type ProjectTypeValue = typeof PROJECT_TYPES[number];

interface SuggestedTask {
  name: string; days: number;
  /** Loại hình áp dụng — bỏ trống = áp dụng cho mọi loại hình (mặc định an toàn). */
  types?: ProjectTypeValue[];
}
interface SuggestedPhase { category: string; tasks: SuggestedTask[] }
interface CustomTask { id: string; name: string; days: number }

/** Flow đề xuất — trình tự giai đoạn + việc thường gặp cho công trình dân dụng, dùng làm gợi ý
 * để người dùng tick chọn thay vì phải gõ tay từng việc từ đầu. Có thể chỉnh sửa nội dung này
 * theo thực tế công ty nếu cần. */
const SUGGESTED_FLOW: SuggestedPhase[] = [
  {
    category: 'KHẢO SÁT & TƯ VẤN',
    tasks: [
      { name: 'Khảo sát hiện trạng', days: 2 },
      { name: 'Xin phép xây dựng', days: 7, types: ['Xây mới', 'Cải tạo', 'Căn hộ'] },
      { name: 'Thiết kế bản vẽ thi công', days: 5 },
    ],
  },
  {
    category: 'PHẦN THÔ',
    tasks: [
      { name: 'Ép cọc / gia cố nền móng', days: 5, types: ['Xây mới'] },
      { name: 'Đổ móng', days: 3, types: ['Xây mới'] },
      { name: 'Dựng cột, đà, sàn', days: 10, types: ['Xây mới'] },
      { name: 'Xây tường bao che', days: 7, types: ['Xây mới', 'Cải tạo'] },
      { name: 'Cán nền', days: 3, types: ['Xây mới', 'Cải tạo', 'Sửa chữa'] },
      { name: 'Chống thấm', days: 2 },
    ],
  },
  {
    category: 'MEP',
    tasks: [
      { name: 'Đi đường ống nước âm tường', days: 4, types: ['Xây mới', 'Cải tạo', 'Căn hộ'] },
      { name: 'Đi dây điện âm tường', days: 4, types: ['Xây mới', 'Cải tạo', 'Căn hộ'] },
      { name: 'Lắp đặt hệ thống điện tổng', days: 3 },
      { name: 'Lắp đặt hệ thống cấp thoát nước', days: 3 },
    ],
  },
  {
    category: 'HOÀN THIỆN',
    tasks: [
      { name: 'Trát tường', days: 5, types: ['Xây mới', 'Cải tạo'] },
      { name: 'Sơn nước', days: 5 },
      { name: 'Lát gạch nền', days: 5, types: ['Xây mới', 'Cải tạo', 'Căn hộ'] },
      { name: 'Ốp gạch WC', days: 3 },
      { name: 'Lắp cửa, cửa sổ', days: 3 },
      { name: 'Lắp thiết bị vệ sinh', days: 2 },
    ],
  },
  {
    category: 'NỘI THẤT',
    tasks: [
      { name: 'Thi công trần thạch cao', days: 5, types: ['Xây mới', 'Cải tạo', 'Căn hộ'] },
      { name: 'Lắp đèn, thiết bị điện', days: 2 },
      { name: 'Lắp đặt nội thất', days: 7 },
      { name: 'Vệ sinh công nghiệp, bàn giao', days: 2 },
    ],
  },
];

const itemId = (category: string, name: string) => `${category}__${name}`;
const STEP_LABELS = { select: '1. Chọn việc đề xuất', review: '2. Tinh chỉnh & thêm hạng mục con' };

export function SuggestedFlowWizard({ isOpen, onClose, onGenerate, projectType }: {
  isOpen: boolean;
  onClose: () => void;
  /** startDate: ngày bắt đầu tính lịch nối tiếp cho toàn bộ flow (không dùng ngày khởi công cũ
   * của dự án — dễ khiến việc mới tạo bị tính "quá hạn" ngay lập tức nếu dự án có ngày khởi công
   * trong quá khứ). Người dùng chỉnh được, mặc định là hôm nay. */
  onGenerate: (tasks: any[], startDate: string) => Promise<void>;
  /** Loại hình công trình của dự án đang chọn — tự ẩn bớt giai đoạn/việc không phù hợp.
   * Không truyền hoặc giá trị lạ (dự án chưa gán loại hình) -> hiện đầy đủ như cũ. */
  projectType?: string | null;
}) {
  const [step, setStep] = useState<'select' | 'review'>('select');

  // Loại hình chọn ngay trong wizard — mặc định theo loại hình đã gán sẵn cho dự án (nếu có),
  // nhưng người dùng chỉnh được tại đây (không bắt buộc phải vào sửa dự án trước).
  const [selectedType, setSelectedType] = useState<string>(() => PROJECT_TYPES.find(t => t === projectType) || '');

  // Lọc theo loại hình: việc không gắn `types` coi như áp dụng mọi loại hình; ẩn hẳn phase nếu rỗng.
  const visibleFlow = useMemo(() => {
    const type = PROJECT_TYPES.find(t => t === selectedType);
    if (!type) return SUGGESTED_FLOW;
    return SUGGESTED_FLOW
      .map(phase => ({ ...phase, tasks: phase.tasks.filter(t => !t.types || t.types.includes(type)) }))
      .filter(phase => phase.tasks.length > 0);
  }, [selectedType]);

  const allIds = useMemo(() => visibleFlow.flatMap(p => p.tasks.map(t => itemId(p.category, t.name))), [visibleFlow]);
  const [checked, setChecked] = useState<Set<string>>(() => new Set(allIds));
  const [daysOverride, setDaysOverride] = useState<Record<string, number>>({});
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  // Bước 2 — hạng mục con tự thêm theo từng nhóm (Hạng mục Lớn), ngoài các việc gợi ý sẵn.
  const [customTasks, setCustomTasks] = useState<Record<string, CustomTask[]>>({});
  const [newCustomName, setNewCustomName] = useState<Record<string, string>>({});
  const [newCustomDays, setNewCustomDays] = useState<Record<string, string>>({});
  // Bước 2 — hạng mục lớn tự thêm hoàn toàn mới (ngoài 5 nhóm gợi ý sẵn), VD "HẠ TẦNG", "NGOẠI THẤT"...
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Bước 2 — cho sửa lại tên Hạng mục lớn (category) và tên từng việc gợi ý (không đụng dữ liệu
  // gốc SUGGESTED_FLOW, chỉ override tên hiển thị/khi tạo).
  const [categoryOverride, setCategoryOverride] = useState<Record<string, string>>({});
  const [taskNameOverride, setTaskNameOverride] = useState<Record<string, string>>({});
  const [targetTotalDays, setTargetTotalDays] = useState('');

  // Đồng bộ lại toàn bộ trạng thái mỗi lần mở modal — tránh trạng thái cũ nếu người dùng đổi dự án
  // (khác loại hình -> visibleFlow khác) mà không unmount component.
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setChecked(new Set(allIds)); setDaysOverride({}); setError('');
      setStartDate(new Date().toISOString().slice(0, 10));
      setSelectedType(PROJECT_TYPES.find(t => t === projectType) || '');
      setCustomTasks({}); setNewCustomName({}); setNewCustomDays({});
      setCategoryOverride({}); setTaskNameOverride({});
      setTargetTotalDays('');
      setCustomCategories([]); setNewCategoryName('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggle = (id: string) => setChecked(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const togglePhase = (phase: SuggestedPhase) => {
    const ids = phase.tasks.map(t => itemId(phase.category, t.name));
    const allOn = ids.every(id => checked.has(id));
    setChecked(prev => {
      const n = new Set(prev);
      ids.forEach(id => allOn ? n.delete(id) : n.add(id));
      return n;
    });
  };

  const addCustomTask = (category: string) => {
    const name = (newCustomName[category] || '').trim();
    if (!name) return;
    const days = Math.max(1, parseInt(newCustomDays[category] || '1') || 1);
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setCustomTasks(prev => ({ ...prev, [category]: [...(prev[category] || []), { id, name, days }] }));
    setNewCustomName(prev => ({ ...prev, [category]: '' }));
    setNewCustomDays(prev => ({ ...prev, [category]: '' }));
  };
  const removeCustomTask = (category: string, id: string) =>
    setCustomTasks(prev => ({ ...prev, [category]: (prev[category] || []).filter(t => t.id !== id) }));
  const updateCustomTaskName = (category: string, id: string, name: string) =>
    setCustomTasks(prev => ({ ...prev, [category]: (prev[category] || []).map(t => t.id === id ? { ...t, name } : t) }));

  /** Thêm hẳn 1 nhóm hạng mục lớn mới (ngoài 5 nhóm gợi ý sẵn) — vd công trình có thêm phần
   * "HẠ TẦNG"/"NGOẠI THẤT" mà flow gợi ý không có sẵn. */
  const addCustomCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const existing = [...visibleFlow.map(p => p.category), ...customCategories].map(c => c.toLowerCase());
    if (existing.includes(name.toLowerCase())) { setError('Hạng mục lớn này đã có rồi'); return; }
    setCustomCategories(prev => [...prev, name]);
    setNewCategoryName('');
    setError('');
  };
  const removeCustomCategory = (category: string) => {
    setCustomCategories(prev => prev.filter(c => c !== category));
    setCustomTasks(prev => { const { [category]: _drop, ...rest } = prev; return rest; });
  };

  const selectedCount = checked.size + Object.values(customTasks).reduce((a, arr) => a + arr.length, 0);

  // Tổng số ngày dự kiến — vì các việc được chọn nối tiếp nhau tuần tự (không chạy song song),
  // tổng số ngày của cả timeline = tổng số ngày của từng việc cộng lại.
  const totalDays = useMemo(() => {
    let sum = 0;
    visibleFlow.forEach(phase => {
      phase.tasks.forEach(t => {
        const id = itemId(phase.category, t.name);
        if (checked.has(id)) sum += daysOverride[id] ?? t.days;
      });
    });
    Object.values(customTasks).forEach(arr => arr.forEach(ct => { sum += ct.days; }));
    return sum;
  }, [visibleFlow, checked, daysOverride, customTasks]);
  const projectedEndDate = totalDays > 0 && startDate ? format(addDays(parseISO(startDate), totalDays - 1), 'dd/MM/yyyy') : null;

  /** Gõ thẳng tổng số ngày mong muốn -> co giãn tỉ lệ số ngày của TẤT CẢ việc đang chọn (kể cả
   * hạng mục con) sao cho cộng lại đúng bằng số đó, làm tròn rồi phân bổ phần dư vào việc dài
   * nhất trước để không dồn hết lệch vào 1 việc nhỏ (không việc nào bị kéo xuống dưới 1 ngày). */
  const applyTargetTotal = () => {
    const target = parseInt(targetTotalDays);
    if (!target || target <= 0) { setError('Nhập tổng số ngày hợp lệ (> 0)'); return; }
    type Entry = { id: string; days: number; kind: 'suggested' | 'custom'; category: string };
    const entries: Entry[] = [];
    visibleFlow.forEach(phase => {
      phase.tasks.forEach(t => {
        const id = itemId(phase.category, t.name);
        if (checked.has(id)) entries.push({ id, days: daysOverride[id] ?? t.days, kind: 'suggested', category: phase.category });
      });
    });
    Object.entries(customTasks).forEach(([category, arr]) => {
      arr.forEach(ct => entries.push({ id: ct.id, days: ct.days, kind: 'custom', category }));
    });
    const sumOriginal = entries.reduce((a, e) => a + e.days, 0);
    if (sumOriginal === 0) { setError('Chưa có việc nào đang chọn để co giãn'); return; }
    const ratio = target / sumOriginal;
    const scaled = entries.map(e => ({ ...e, newDays: Math.max(1, Math.round(e.days * ratio)) }));
    let diff = target - scaled.reduce((a, e) => a + e.newDays, 0);
    let guard = 0;
    while (diff !== 0 && guard < 500) {
      guard++;
      scaled.sort((a, b) => b.newDays - a.newDays);
      if (diff > 0) { scaled[0].newDays += 1; diff -= 1; }
      else {
        const idx = scaled.findIndex(e => e.newDays > 1);
        if (idx === -1) break;
        scaled[idx].newDays -= 1; diff += 1;
      }
    }
    setDaysOverride(prev => {
      const next = { ...prev };
      scaled.filter(e => e.kind === 'suggested').forEach(e => { next[e.id] = e.newDays; });
      return next;
    });
    setCustomTasks(prev => {
      const next = { ...prev };
      scaled.filter(e => e.kind === 'custom').forEach(e => {
        next[e.category] = (next[e.category] || []).map(ct => ct.id === e.id ? { ...ct, days: e.newDays } : ct);
      });
      return next;
    });
    setError('');
  };

  const handleGenerate = async () => {
    const fromFlow = visibleFlow.flatMap(phase => {
      const categoryName = categoryOverride[phase.category] ?? phase.category;
      const suggested = phase.tasks
        .filter(t => checked.has(itemId(phase.category, t.name)))
        .map(t => {
          const id = itemId(phase.category, t.name);
          return { name: taskNameOverride[id] ?? t.name, category: categoryName, days: daysOverride[id] ?? t.days };
        });
      const custom = (customTasks[phase.category] || []).map(ct => ({ name: ct.name, category: categoryName, days: ct.days }));
      return [...suggested, ...custom];
    });
    // Hạng mục lớn tự thêm hoàn toàn mới — không nằm trong visibleFlow nên phải gộp riêng.
    const fromCustomCategories = customCategories.flatMap(cat => {
      const categoryName = categoryOverride[cat] ?? cat;
      return (customTasks[cat] || []).map(ct => ({ name: ct.name, category: categoryName, days: ct.days }));
    });
    const payload = [...fromFlow, ...fromCustomCategories]
      .map(t => ({ ...t, checklist: [], budget: 0, progress: 0, status: 'TODO' }))
      .map((t, idx) => ({ ...t, dependencies: idx > 0 ? [idx - 1] : [] })); // nối tiếp lần lượt theo flow
    if (!payload.length) { setError('Vui lòng chọn hoặc thêm ít nhất 1 hạng mục'); return; }
    setSaving(true); setError('');
    try { await onGenerate(payload, startDate); onClose(); }
    catch (e: any) { setError(e?.message || 'Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  // Danh sách dùng cho Bước 2 — mỗi nhóm gồm việc gợi ý đã tick + hạng mục con tự thêm,
  // nối thêm các hạng mục lớn tự thêm mới (không có việc gợi ý sẵn, chỉ có hạng mục con).
  const reviewGroups = useMemo(() => [
    ...visibleFlow.map(phase => ({
      category: phase.category,
      suggested: phase.tasks.filter(t => checked.has(itemId(phase.category, t.name))),
      custom: customTasks[phase.category] || [],
    })),
    ...customCategories.map(cat => ({
      category: cat,
      suggested: [] as SuggestedTask[],
      custom: customTasks[cat] || [],
    })),
  ], [visibleFlow, checked, customTasks, customCategories]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-3">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">

            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <ListChecks className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="flex items-center gap-1.5 text-xs">
                  {(['select', 'review'] as const).map((s, i) => (
                    <Fragment key={s}>
                      {i > 0 && <span className="text-slate-300">›</span>}
                      <span className={`font-bold ${step === s ? 'text-indigo-600' : 'text-slate-400'}`}>{STEP_LABELS[s]}</span>
                    </Fragment>
                  ))}
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg shrink-0">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {step === 'select' && (
              <>
                <p className="px-4 pt-3 text-xs text-slate-500">
                  Bỏ tick việc không cần, chỉnh số ngày nếu khác thực tế. Các việc được chọn sẽ nối tiếp nhau theo đúng thứ tự flow bên dưới.
                </p>

                <div className="px-4 pt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ngày bắt đầu</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-sm text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 [color-scheme:light]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Loại công trình</label>
                    <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-sm text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                      <option value="">-- Tất cả việc --</option>
                      {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-400 col-span-2">Toàn bộ lịch nối tiếp sẽ tính từ ngày bắt đầu — không dùng ngày khởi công cũ của dự án để tránh việc vừa tạo đã bị tính "quá hạn". Chọn loại công trình để tự ẩn bớt việc không phù hợp.</p>
                  {totalDays > 0 && (
                    <div className="col-span-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-xs text-indigo-700">
                      <div className="flex items-center justify-between font-bold mb-2">
                        <span>Đã chọn {selectedCount} việc</span>
                        <span>Tổng {totalDays} ngày{projectedEndDate ? ` · Dự kiến xong ${projectedEndDate}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min={1} value={targetTotalDays} onChange={e => setTargetTotalDays(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyTargetTotal(); } }}
                          placeholder="Muốn co lại còn bao nhiêu ngày tổng?"
                          className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 border border-indigo-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                        <button type="button" onClick={applyTargetTotal}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shrink-0">
                          Áp dụng
                        </button>
                      </div>
                      <p className="text-[10px] text-indigo-500 mt-1">Nhập tổng số ngày mong muốn rồi bấm Áp dụng — số ngày từng việc sẽ tự co giãn theo tỉ lệ cho khớp tổng đó.</p>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {visibleFlow.map(phase => {
                    const ids = phase.tasks.map(t => itemId(phase.category, t.name));
                    const allOn = ids.every(id => checked.has(id));
                    return (
                      <div key={phase.category}>
                        <button type="button" onClick={() => togglePhase(phase)}
                          className="w-full flex items-center gap-2 mb-2 text-left">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${allOn ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                            {allOn && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </div>
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{phase.category}</span>
                          <div className="flex-1 h-px bg-slate-100" />
                        </button>
                        <div className="space-y-1.5 pl-1">
                          {phase.tasks.map(t => {
                            const id = itemId(phase.category, t.name);
                            const isChecked = checked.has(id);
                            return (
                              <div key={id}
                                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${isChecked ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-100 bg-slate-50/50 opacity-60'}`}>
                                <button type="button" onClick={() => toggle(id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                    {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                  </div>
                                  <span className="text-sm text-slate-700 truncate">{t.name}</span>
                                </button>
                                <label className="flex items-center gap-1 text-xs text-slate-500 shrink-0" onClick={e => e.stopPropagation()}>
                                  <input type="number" min={1} value={daysOverride[id] ?? t.days}
                                    onChange={e => setDaysOverride(prev => ({ ...prev, [id]: parseInt(e.target.value) || 1 }))}
                                    className="w-12 px-1.5 py-1 text-xs text-slate-800 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white" />
                                  ngày
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 space-y-2 shrink-0">
                  {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
                  <div className="flex gap-2">
                    <button onClick={onClose} className="px-4 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-white">
                      Hủy
                    </button>
                    <button onClick={() => { setError(''); setStep('review'); }}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                      Tiếp tục: Tinh chỉnh & thêm hạng mục con →
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 'review' && (
              <>
                <p className="px-4 pt-3 text-xs text-slate-500">
                  Kiểm tra lại từng Hạng mục lớn, chỉnh số ngày nếu cần, thêm hạng mục con nếu thiếu. Bấm "Tạo" khi đã ổn.
                </p>
                <div className="px-4 pt-2 text-[11px] text-slate-400">
                  Ngày bắt đầu <strong className="text-slate-600">{startDate}</strong> · Loại công trình <strong className="text-slate-600">{selectedType || 'Tất cả việc'}</strong>
                </div>
                {totalDays > 0 && (
                  <div className="mx-4 mt-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-xs text-indigo-700">
                    <div className="font-bold mb-2">Tổng {totalDays} ngày{projectedEndDate ? ` · Dự kiến xong ${projectedEndDate}` : ''}</div>
                    <div className="flex items-center gap-2">
                      <input type="number" min={1} value={targetTotalDays} onChange={e => setTargetTotalDays(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyTargetTotal(); } }}
                        placeholder="Muốn co lại còn bao nhiêu ngày tổng?"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 border border-indigo-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                      <button type="button" onClick={applyTargetTotal}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shrink-0">
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {reviewGroups.map(group => (
                    <div key={group.category}>
                      <div className="flex items-center gap-2 mb-2">
                        <input value={categoryOverride[group.category] ?? group.category}
                          onChange={e => setCategoryOverride(prev => ({ ...prev, [group.category]: e.target.value }))}
                          className="text-xs font-bold text-slate-600 uppercase tracking-wide bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-indigo-400 px-0.5 py-0.5 max-w-[220px]" />
                        <div className="flex-1 h-px bg-slate-100" />
                        {customCategories.includes(group.category) && (
                          <button type="button" onClick={() => removeCustomCategory(group.category)}
                            title="Xoá hạng mục lớn này" className="text-slate-400 hover:text-rose-500 shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {group.suggested.length === 0 && group.custom.length === 0 && (
                          <p className="text-xs text-slate-400 italic">Chưa có hạng mục nào trong nhóm này.</p>
                        )}
                        {group.suggested.map(t => {
                          const id = itemId(group.category, t.name);
                          return (
                            <div key={id} className="flex items-center gap-3 p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/50">
                              <input value={taskNameOverride[id] ?? t.name}
                                onChange={e => setTaskNameOverride(prev => ({ ...prev, [id]: e.target.value }))}
                                className="text-sm text-slate-700 flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none focus:border-indigo-400 px-0.5 py-0.5" />
                              <label className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                                <input type="number" min={1} value={daysOverride[id] ?? t.days}
                                  onChange={e => setDaysOverride(prev => ({ ...prev, [id]: parseInt(e.target.value) || 1 }))}
                                  className="w-12 px-1.5 py-1 text-xs text-slate-800 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white" />
                                ngày
                              </label>
                              <button type="button" onClick={() => toggle(id)} className="text-slate-400 hover:text-rose-500 shrink-0">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                        {group.custom.map(ct => (
                          <div key={ct.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50">
                            <div className="flex-1 min-w-0 flex items-center gap-1.5">
                              <input value={ct.name} onChange={e => updateCustomTaskName(group.category, ct.id, e.target.value)}
                                className="text-sm text-slate-700 flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none focus:border-emerald-400 px-0.5 py-0.5" />
                              <span className="text-[10px] text-emerald-600 font-bold uppercase shrink-0">Hạng mục con</span>
                            </div>
                            <label className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                              <input type="number" min={1} value={ct.days}
                                onChange={e => {
                                  const days = Math.max(1, parseInt(e.target.value) || 1);
                                  setCustomTasks(prev => ({ ...prev, [group.category]: prev[group.category].map(x => x.id === ct.id ? { ...x, days } : x) }));
                                }}
                                className="w-12 px-1.5 py-1 text-xs text-slate-800 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white" />
                              ngày
                            </label>
                            <button type="button" onClick={() => removeCustomTask(group.category, ct.id)} className="text-slate-400 hover:text-rose-500 shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {/* Thêm hạng mục con */}
                        <div className="flex items-center gap-2 pt-1">
                          <input value={newCustomName[group.category] || ''} onChange={e => setNewCustomName(prev => ({ ...prev, [group.category]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTask(group.category); } }}
                            placeholder="+ Thêm hạng mục con..."
                            className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 border border-dashed border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-300 bg-white" />
                          <input type="number" min={1} value={newCustomDays[group.category] || ''} onChange={e => setNewCustomDays(prev => ({ ...prev, [group.category]: e.target.value }))}
                            placeholder="1" className="w-14 px-1.5 py-1.5 text-xs text-slate-800 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-emerald-300 bg-white" />
                          <button type="button" onClick={() => addCustomTask(group.category)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shrink-0">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Thêm hạng mục lớn — nhóm mới hoàn toàn, ngoài 5 nhóm gợi ý sẵn (VD "HẠ TẦNG", "NGOẠI THẤT"...) */}
                  <div className="flex items-center gap-2 pt-2 border-t border-dashed border-slate-200">
                    <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomCategory(); } }}
                      placeholder="+ Thêm hạng mục lớn..."
                      className="flex-1 px-2.5 py-2 text-xs font-bold text-slate-700 uppercase border border-dashed border-indigo-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-indigo-50/40" />
                    <button type="button" onClick={addCustomCategory}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shrink-0 flex items-center gap-1">
                      <Plus className="w-4 h-4" /> Thêm
                    </button>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 space-y-2 shrink-0">
                  {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setStep('select')} className="px-4 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-white">
                      ← Quay lại
                    </button>
                    <button onClick={handleGenerate} disabled={saving || selectedCount === 0}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                      {saving ? 'Đang tạo...' : `Tạo ${selectedCount} hạng mục vào Timeline →`}
                    </button>
                  </div>
                </div>
              </>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
