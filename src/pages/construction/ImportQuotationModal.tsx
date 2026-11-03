import React, { useState } from 'react';
import {
  FileSpreadsheet, X, Upload, Check, AlertCircle, Bot, Building2, TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { aiConstructionService } from '../../services/aiConstructionService';

export interface ExtractedProjectInfo {
  name: string; ownerName: string; address: string;
  contractValue: number; budget: number; startDate: string; handoverDate: string;
}

const CAT_STYLE: Record<string, string> = {
  'PHẦN THÔ':   'bg-red-100 text-red-700 border border-red-200',
  'ĐIỆN NƯỚC':  'bg-blue-100 text-blue-700 border border-blue-200',
  'HOÀN THIỆN': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'KHÁC':       'bg-slate-100 text-slate-600 border border-slate-200',
};

/**
 * Modal "Import AI timeline" — dùng chung giữa app DQH (Construction.tsx) và sdqh (ConstructionHome.tsx).
 * `onCreateProject` không truyền -> ẩn hẳn chế độ "Tạo dự án mới", chỉ còn "Cập nhật / Ghi đè Timeline"
 * (sdqh không tạo dự án mới, chỉ app DQH mới tạo).
 */
export function ImportQuotationModal({ isOpen, onClose, onGenerate, onCreateProject }: {
  isOpen: boolean; onClose: () => void;
  onGenerate: (tasks: any[]) => Promise<void>;
  onCreateProject?: (info: ExtractedProjectInfo, tasks: any[]) => Promise<void>;
}) {
  const [mode, setMode] = useState<'replace_project' | 'create_project'>('replace_project');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const [fileMime, setFileMime] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'confirm'>('upload');
  const [editedTasks, setEditedTasks] = useState<any[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<Set<number>>(new Set());
  const [extractedInfo, setExtractedInfo] = useState<ExtractedProjectInfo>({
    name: '', ownerName: '', address: '', contractValue: 0, budget: 0, startDate: '', handoverDate: '',
  });
  const fileRef = React.useRef<HTMLInputElement>(null);

  const reset = () => {
    setText(''); setFileName(''); setFileBase64(''); setFileMime(''); setError('');
    setStep('upload'); setEditedTasks([]); setSelectedIdx(new Set());
  };

  const handleFileRead = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') {
      const reader = new FileReader();
      reader.onload = ev => {
        const base64 = (ev.target?.result as string).split(',')[1];
        setFileBase64(base64); setFileMime('application/pdf'); setText('');
      };
      reader.readAsDataURL(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const { read, utils } = await import('xlsx');
          const wb = read(ev.target?.result, { type: 'array' });
          const lines: string[] = [];
          wb.SheetNames.forEach(name => {
            const csv = utils.sheet_to_csv(wb.Sheets[name]);
            if (csv.trim()) lines.push(`[Sheet: ${name}]\n${csv}`);
          });
          setText(lines.join('\n\n')); setFileBase64(''); setFileMime('');
        } catch { setError('Không đọc được file Excel. Thử lưu lại dạng .xlsx'); }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = ev => { setText(ev.target?.result as string || ''); setFileBase64(''); setFileMime(''); };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim() && !fileBase64) { setError('Vui lòng chọn file hoặc nhập nội dung'); return; }
    setIsAnalyzing(true); setError('');
    try {
      let tasks: any[] = [];
      let info: ExtractedProjectInfo = { name: '', ownerName: '', address: '', contractValue: 0, budget: 0, startDate: '', handoverDate: '' };
      if (fileBase64 && fileMime) {
        const result = await aiConstructionService.analyzeFileMultimodal(fileBase64, fileMime);
        tasks = result.tasks; info = result.projectInfo;
      } else {
        tasks = await aiConstructionService.generateTimelineFromQuotation(text);
        if (mode === 'create_project') info = await aiConstructionService.extractProjectInfo(text);
      }
      setEditedTasks(JSON.parse(JSON.stringify(tasks)));
      setSelectedIdx(new Set(tasks.map((_, i) => i))); // all selected by default
      setExtractedInfo(info);
      setStep('preview');
    } catch (e: any) {
      setError(e?.message || 'AI phân tích thất bại. Kiểm tra API key.');
    } finally { setIsAnalyzing(false); }
  };

  const handleConfirmPreview = async () => {
    const selected = editedTasks.filter((_, i) => selectedIdx.has(i));
    if (!selected.length) { setError('Vui lòng chọn ít nhất 1 hạng mục'); return; }
    if (mode === 'create_project') { setStep('confirm'); return; }
    setIsAnalyzing(true); setError('');
    try { await onGenerate(selected); reset(); onClose(); }
    catch (e: any) { setError(e?.message || 'Lỗi khi lưu'); }
    finally { setIsAnalyzing(false); }
  };

  const handleConfirmCreate = async () => {
    if (!onCreateProject) return;
    const selected = editedTasks.filter((_, i) => selectedIdx.has(i));
    setIsAnalyzing(true); setError('');
    try { await onCreateProject(extractedInfo, selected); reset(); onClose(); }
    catch (e: any) { setError(e?.message || 'Lỗi khi tạo dự án'); }
    finally { setIsAnalyzing(false); }
  };

  const allSelected = selectedIdx.size === editedTasks.length && editedTasks.length > 0;
  const toggleAll = () => setSelectedIdx(allSelected ? new Set() : new Set(editedTasks.map((_, i) => i)));
  const updateTask = (idx: number, field: string, val: any) =>
    setEditedTasks(prev => prev.map((t, i) => i === idx ? { ...t, [field]: val } : t));

  // Group by category for preview display
  const groupedPreview = React.useMemo(() => {
    const map = new Map<string, { task: any; idx: number }[]>();
    editedTasks.forEach((task, idx) => {
      const cat = task.category || 'KHÁC';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push({ task, idx });
    });
    return map;
  }, [editedTasks]);

  const fileTypeLabel = fileMime === 'application/pdf' ? '📄 PDF' : fileName.includes('.xl') ? '📊 Excel' : fileName ? '📝 Text' : '';
  const STEP_LABELS = { upload: '1. Tải file', preview: '2. Chọn hạng mục', confirm: '3. Thông tin dự án' };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-3">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className={`w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl transition-all ${step === 'preview' ? 'max-w-2xl' : 'max-w-lg'}`}>

            {/* Header + step indicator */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="flex items-center gap-1.5 text-xs">
                  {(['upload', 'preview', 'confirm'] as const).map((s, i) => (
                    <React.Fragment key={s}>
                      {i > 0 && <span className="text-slate-300">›</span>}
                      <span className={`font-bold ${step === s ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {STEP_LABELS[s]}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <button onClick={() => { reset(); onClose(); }} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* ── STEP 1: Upload ── */}
            {step === 'upload' && (
              <div className="p-5 space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {([['replace_project', 'Cập nhật / Ghi đè Timeline'], ...(onCreateProject ? [['create_project', 'Tạo dự án mới']] : [])] as ['replace_project' | 'create_project', string][]).map(([m, label]) => (
                    <button key={m} onClick={() => setMode(m)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer text-center"
                  onClick={() => fileRef.current?.click()}>
                  {fileName ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-bold text-indigo-600">{fileTypeLabel} {fileName}</span>
                      <button onClick={e => { e.stopPropagation(); reset(); }} className="text-slate-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-600 font-bold">Kéo thả hoặc click chọn file</p>
                      <p className="text-[11px] text-slate-400 mt-1">PDF (timeline / hợp đồng) • Excel (.xlsx) báo giá • Text / CSV</p>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept=".txt,.csv,.pdf,.xlsx,.xls" onChange={handleFileRead} className="hidden" />
                </div>
                {!fileBase64 && (
                  <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                    <p className="text-[11px] text-indigo-700 font-medium mb-2">💡 Hoặc paste nội dung trực tiếp:</p>
                    <textarea value={text} onChange={e => { setText(e.target.value); setFileName(''); }}
                      placeholder={'VD:\nMóng cọc ép: 150tr, 5 ngày\nXây tường trệt: 120tr, 7 ngày\nMEP: 180tr, 8 ngày...'}
                      rows={5} className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white resize-none" />
                  </div>
                )}
                {fileBase64 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-xs text-emerald-700 font-medium">PDF đã tải — AI sẽ đọc trực tiếp bằng Gemini multimodal</p>
                  </div>
                )}
                {error && <p className="text-xs text-rose-600 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
                <div className="flex gap-3">
                  <button onClick={handleAnalyze} disabled={isAnalyzing || (!text.trim() && !fileBase64)}
                    className="flex-1 bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isAnalyzing ? <><Bot className="w-4 h-4 animate-pulse" /> Đang phân tích AI...</> : <><Bot className="w-4 h-4" /> Phân Tích AI</>}
                  </button>
                  <button onClick={() => { reset(); onClose(); }} className="px-4 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">Hủy</button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Preview + Select ── */}
            {step === 'preview' && (
              <div className="flex flex-col max-h-[80vh]">
                {/* Summary bar */}
                <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                  <p className="text-xs text-indigo-700 font-bold">
                    AI tìm thấy {editedTasks.length} hạng mục — đã chọn {selectedIdx.size}
                  </p>
                  <button onClick={toggleAll}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${allSelected ? 'bg-white border-indigo-300 text-indigo-600' : 'bg-indigo-600 text-white border-transparent'}`}>
                    {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>

                {/* Task list — scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {Array.from(groupedPreview.entries()).map(([cat, items]) => (
                    <div key={cat}>
                      {/* Category header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_STYLE[cat] || CAT_STYLE['KHÁC']}`}>{cat}</span>
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-[10px] text-slate-400">{items.length} hạng mục</span>
                      </div>
                      <div className="space-y-2">
                        {items.map(({ task, idx }) => {
                          const checked = selectedIdx.has(idx);
                          return (
                            <div key={idx}
                              className={`flex gap-3 p-3 rounded-xl border transition-all cursor-pointer ${checked ? 'border-indigo-300 bg-indigo-50/60' : 'border-slate-200 bg-white opacity-60'}`}
                              onClick={() => {
                                setSelectedIdx(prev => {
                                  const n = new Set(prev);
                                  checked ? n.delete(idx) : n.add(idx);
                                  return n;
                                });
                              }}
                            >
                              {/* Checkbox */}
                              <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                              </div>

                              {/* Task info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{task.name}</p>
                                {/* Editable fields */}
                                <div className="flex items-center gap-3 mt-1.5" onClick={e => e.stopPropagation()}>
                                  <label className="flex items-center gap-1 text-xs text-slate-500">
                                    Thời gian:
                                    <input type="number" min={1} value={task.days}
                                      onChange={e => updateTask(idx, 'days', parseInt(e.target.value) || 1)}
                                      className="w-12 px-1.5 py-0.5 text-xs border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white" />
                                    ngày
                                  </label>
                                  <label className="flex items-center gap-1 text-xs text-slate-500">
                                    Bắt đầu:
                                    <input type="date" value={task.startDate || ''}
                                      onChange={e => updateTask(idx, 'startDate', e.target.value)}
                                      className="px-1.5 py-0.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white cursor-pointer hover:bg-slate-50" />
                                  </label>
                                </div>
                                {/* Checklist preview */}
                                {task.checklist?.length > 0 && (
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {task.checklist.slice(0, 2).map((c: string, ci: number) => (
                                      <span key={ci} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">✓ {c}</span>
                                    ))}
                                    {task.checklist.length > 2 && (
                                      <span className="text-[10px] text-slate-400">+{task.checklist.length - 2} mục nghiệm thu</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Duration badge */}
                              <div className="shrink-0 text-right">
                                <div className="text-xs font-bold text-slate-600">{task.days}d</div>
                                <div className="text-[10px] text-slate-400">{task.startDate || '—'}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 space-y-2">
                  {selectedIdx.size > 0 && (() => {
                    const selectedTasks = editedTasks.filter((_, i) => selectedIdx.has(i));
                    const totalCost = selectedTasks.reduce((a, t) => a + (t.budget || 0), 0);
                    // Calculate true project duration
                    let minDate = new Date(8640000000000000);
                    let maxDate = new Date(-8640000000000000);
                    let hasDates = false;
                    selectedTasks.forEach(t => {
                      if (t.startDate) {
                        hasDates = true;
                        const sd = new Date(t.startDate);
                        if (!isNaN(sd.getTime())) {
                          if (sd < minDate) minDate = sd;
                          const ed = new Date(sd.getTime() + (Math.max(0, t.days - 1)) * 86400000);
                          if (ed > maxDate) maxDate = ed;
                        }
                      }
                    });
                    const diffDays = hasDates ? Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 3600 * 24)) + 1) : 0;

                    return (
                      <div className="flex gap-3 text-xs text-slate-500 justify-between px-1">
                        <span>Tổng thời gian: <strong className="text-slate-700">{hasDates ? diffDays : selectedTasks.reduce((a, t) => a + (t.days || 0), 0)} ngày</strong></span>
                        <span>Đã chọn: <strong className="text-slate-700">{selectedTasks.length} mục</strong></span>
                      </div>
                    );
                  })()}
                  {error && <p className="text-xs text-rose-600 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setStep('upload')} className="px-4 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-white">
                      ← Phân tích lại
                    </button>
                    <button onClick={handleConfirmPreview} disabled={isAnalyzing || selectedIdx.size === 0}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                      {isAnalyzing ? 'Đang lưu...' : <>{mode === 'create_project' ? <Building2 className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />} Thêm {selectedIdx.size} hạng mục vào Timeline →</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Project Info (create_project mode only) ── */}
            {step === 'confirm' && (
              <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
                <p className="text-xs text-slate-500 font-medium">AI đã trích xuất thông tin dự án. Kiểm tra và chỉnh sửa trước khi tạo:</p>
                {([
                  { label: 'Tên dự án', key: 'name', type: 'text' },
                  { label: 'Chủ nhà', key: 'ownerName', type: 'text' },
                  { label: 'Địa chỉ công trình', key: 'address', type: 'text' },
                  { label: 'Giá trị hợp đồng (đ)', key: 'contractValue', type: 'number' },
                  { label: 'Ngân sách (đ)', key: 'budget', type: 'number' },
                  { label: 'Ngày khởi công', key: 'startDate', type: 'date' },
                  { label: 'Ngày bàn giao', key: 'handoverDate', type: 'date' },
                ] as { label: string; key: keyof ExtractedProjectInfo; type: string }[]).map(f => (
                  <div key={f.key}>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">{f.label}</label>
                    <input type={f.type} value={(extractedInfo as any)[f.key] || ''}
                      onChange={e => setExtractedInfo(i => ({ ...i, [f.key]: f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))}
                      className="mt-0.5 w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                  </div>
                ))}
                <div className="bg-indigo-50 rounded-xl px-3 py-2.5 border border-indigo-100">
                  <p className="text-[11px] text-indigo-700 font-bold">{selectedIdx.size} hạng mục đã chọn sẽ được tạo tự động</p>
                </div>
                {error && <p className="text-xs text-rose-600 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
                <div className="flex gap-3 pt-1">
                  <button onClick={handleConfirmCreate} disabled={isAnalyzing}
                    className="flex-1 bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isAnalyzing ? 'Đang tạo...' : <><Building2 className="w-4 h-4" /> Tạo Dự Án & Timeline</>}
                  </button>
                  <button onClick={() => setStep('preview')} className="px-4 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">Sửa lại</button>
                </div>
              </div>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
