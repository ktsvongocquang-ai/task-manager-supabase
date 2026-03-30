import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { parseISO, format, addDays, differenceInDays, startOfDay, isValid } from 'date-fns';
import type { CTask, TaskStatus } from './types';
import { Save, CheckSquare, AlertCircle, Printer, Share2, FileSpreadsheet, Download } from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────

const parseDate = (s?: string | null): Date | null => {
  if (!s) return null;
  const d = parseISO(s);
  return isValid(d) ? d : null;
};

const getTaskStart = (t: CTask) => parseDate(t.plannedStart || t.startDate);
const getTaskEnd = (t: CTask) => parseDate(t.plannedEnd || t.endDate);

const getDateRange = (tasks: CTask[]) => {
  const dates = tasks.flatMap(t => [getTaskStart(t), getTaskEnd(t)]).filter(Boolean) as Date[];
  if (!dates.length) { const n = new Date(); return { min: addDays(n, -3), max: addDays(n, 60) }; }
  const min = dates.reduce((a, b) => a < b ? a : b);
  const max = dates.reduce((a, b) => a > b ? a : b);
  return { min: addDays(min, -2), max: addDays(max, 10) };
};

const getDaysBetween = (start: Date, end: Date): Date[] => {
  const arr: Date[] = [];
  let cur = startOfDay(start);
  const endDay = startOfDay(end);
  while (cur <= endDay) { arr.push(cur); cur = addDays(cur, 1); }
  return arr;
};

const STATUS_META: Record<TaskStatus, { label: string; bar: string; dot: string }> = {
  TODO:   { label: 'Chưa làm',        bar: '#94a3b8', dot: 'bg-slate-400' },
  DOING:  { label: 'Đang thi công',   bar: '#2563eb', dot: 'bg-blue-600' },
  REVIEW: { label: 'Chờ nghiệm thu',  bar: '#d97706', dot: 'bg-amber-500' },
  DONE:   { label: 'Hoàn thành',      bar: '#16a34a', dot: 'bg-green-600' },
};

// ── Gantt Chart ────────────────────────────────────────────────────────────────

function ConstructionGantt({
  tasks,
  selectedId,
  onSelect,
  onUpdateTask,
  readOnly,
}: {
  tasks: CTask[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<CTask>) => void;
  readOnly?: boolean;
}) {
  const { min, max } = useMemo(() => getDateRange(tasks), [tasks]);
  const days = useMemo(() => getDaysBetween(min, max), [min.toISOString(), max.toISOString()]);

  const weeks = useMemo(() => {
    const ws: { label: string; count: number }[] = [];
    let wStart = days[0];
    let count = 0;
    days.forEach((day, i) => {
      count++;
      if (day.getDay() === 0 || i === days.length - 1) {
        ws.push({ label: `Tuần ${format(wStart, 'w')} (${format(wStart, 'dd/MM')})`, count });
        count = 0;
        if (i < days.length - 1) wStart = days[i + 1];
      }
    });
    return ws;
  }, [days]);

  const grouped = useMemo(() =>
    tasks.reduce((acc, t) => {
      const cat = t.category || 'KHÁC';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(t);
      return acc;
    }, {} as Record<string, CTask[]>)
  , [tasks]);

  const handleStartChange = (task: CTask, val: string) => {
    if (readOnly) return;
    const ns = parseDate(val);
    if (!ns) return;
    const os = getTaskStart(task);
    const oe = getTaskEnd(task);
    const dur = os && oe ? differenceInDays(oe, os) : (task.duration || task.days || 7) - 1;
    const ne = addDays(ns, dur);
    onUpdateTask(task.id, {
      plannedStart: format(ns, 'yyyy-MM-dd'), startDate: format(ns, 'yyyy-MM-dd'),
      plannedEnd: format(ne, 'yyyy-MM-dd'),   endDate: format(ne, 'yyyy-MM-dd'),
    });
  };

  const handleDurChange = (task: CTask, val: string) => {
    if (readOnly) return;
    const d = parseInt(val, 10);
    if (isNaN(d) || d < 1) return;
    const s = getTaskStart(task) || new Date();
    const ne = addDays(s, d - 1);
    onUpdateTask(task.id, {
      duration: d, days: d,
      plannedEnd: format(ne, 'yyyy-MM-dd'), endDate: format(ne, 'yyyy-MM-dd'),
    });
  };

  let stt = 0;

  return (
    <div className="flex w-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm text-[11px]">
      {/* LEFT PANE */}
      <div className="flex-none w-[500px] min-w-[500px] sticky left-0 z-30 bg-white border-r-2 border-slate-200 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.08)]">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-40 bg-slate-700 text-white">
            <tr className="h-8">
              <th className="border-r border-slate-600 text-center w-8 font-bold">STT</th>
              <th className="border-r border-slate-600 text-left px-2 font-bold">HẠNG MỤC / CÔNG VIỆC</th>
              <th className="border-r border-slate-600 text-center w-24 font-bold">BẮT ĐẦU</th>
              <th className="border-r border-slate-600 text-center w-12 font-bold">NGÀY</th>
              <th className="text-center w-20 font-bold">TIẾN ĐỘ</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([cat, catTasks], ci) => (
              <React.Fragment key={cat}>
                <tr className="h-8 bg-slate-100">
                  <td className="border-r border-slate-200 text-center text-slate-600 font-bold">{ci + 1}</td>
                  <td colSpan={4} className="px-2 text-slate-700 font-bold text-xs uppercase tracking-wide">{cat}</td>
                </tr>
                {catTasks.map(task => {
                  const ts = getTaskStart(task);
                  const te = getTaskEnd(task);
                  const dur = ts && te ? differenceInDays(te, ts) + 1 : task.duration || task.days || 0;
                  const sel = selectedId === task.id;
                  stt++;
                  return (
                    <tr
                      key={task.id}
                      className={`h-9 border-b border-slate-100 cursor-pointer transition-colors ${sel ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-300' : 'hover:bg-slate-50'}`}
                      onClick={() => onSelect(task.id)}
                    >
                      <td className="border-r border-slate-100 text-center text-slate-400">{stt}</td>
                      <td className="border-r border-slate-100 px-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-2 h-2 rounded-full flex-none ${STATUS_META[task.status]?.dot || 'bg-slate-400'}`} />
                          <span className="truncate text-slate-800" title={task.name}>{task.name}</span>
                        </div>
                      </td>
                      <td className="border-r border-slate-100 p-0">
                        {readOnly ? (
                          <div className="w-full h-9 flex items-center justify-center text-slate-600">
                            {ts ? format(ts, 'dd/MM/yy') : '--'}
                          </div>
                        ) : (
                          <input
                            type="date"
                            className="w-full h-9 text-center bg-transparent outline-none hover:bg-indigo-50 focus:bg-indigo-50 cursor-pointer"
                            value={ts ? format(ts, 'yyyy-MM-dd') : ''}
                            onChange={e => { e.stopPropagation(); handleStartChange(task, e.target.value); }}
                            onClick={e => e.stopPropagation()}
                          />
                        )}
                      </td>
                      <td className="border-r border-slate-100 p-0">
                        {readOnly ? (
                          <div className="w-full h-9 flex items-center justify-center text-slate-600">{dur || '--'}</div>
                        ) : (
                          <input
                            type="number"
                            className="w-full h-9 text-center bg-transparent outline-none hover:bg-indigo-50 focus:bg-indigo-50 cursor-pointer"
                            value={dur || ''}
                            min={1}
                            onChange={e => { e.stopPropagation(); handleDurChange(task, e.target.value); }}
                            onClick={e => e.stopPropagation()}
                          />
                        )}
                      </td>
                      <td className="text-center px-1">
                        <div className="flex items-center gap-1 justify-center">
                          <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${task.progress || 0}%`, backgroundColor: STATUS_META[task.status]?.bar || '#94a3b8' }}
                            />
                          </div>
                          <span className="text-slate-400 w-6 text-right">{task.progress || 0}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* RIGHT PANE */}
      <div className="flex-1 overflow-x-auto">
        <table className="border-collapse" style={{ minWidth: `${days.length * 30}px`, width: '100%' }}>
          <thead className="sticky top-0 z-20 bg-slate-700 text-white">
            <tr className="h-8">
              {weeks.map((w, i) => (
                <th key={i} colSpan={w.count} className="border-r border-slate-600 text-center font-bold text-[9px] uppercase tracking-wide px-1">
                  {w.label}
                </th>
              ))}
            </tr>
            <tr className="h-8 bg-slate-50 text-slate-600">
              {days.map((day, i) => {
                const isSun = day.getDay() === 0;
                const isSat = day.getDay() === 6;
                return (
                  <th
                    key={i}
                    className={`w-[30px] min-w-[30px] border-r border-slate-200 text-center font-normal ${isSun ? 'bg-red-50 text-red-400' : isSat ? 'bg-orange-50 text-orange-400' : ''}`}
                  >
                    <div className="text-[10px] font-bold">{day.getDate()}</div>
                    <div className="text-[8px] opacity-60">{['CN','T2','T3','T4','T5','T6','T7'][day.getDay()]}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([cat, catTasks]) => (
              <React.Fragment key={`g-${cat}`}>
                <tr className="h-8 bg-slate-100">
                  {days.map((_, i) => <td key={i} className="border-r border-slate-200" />)}
                </tr>
                {catTasks.map(task => {
                  const ts = getTaskStart(task);
                  const te = getTaskEnd(task);
                  const sel = selectedId === task.id;
                  const barColor = STATUS_META[task.status]?.bar || '#94a3b8';

                  return (
                    <tr
                      key={`g-${task.id}`}
                      className={`h-9 border-b border-slate-100 cursor-pointer ${sel ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                      onClick={() => onSelect(task.id)}
                    >
                      {days.map((day, i) => {
                        const isSun = day.getDay() === 0;
                        const isSat = day.getDay() === 6;
                        const dayStart = startOfDay(day);

                        let inRange = false;
                        let isFirst = false;
                        let isLast = false;

                        if (ts && te) {
                          const s = startOfDay(ts);
                          const e = startOfDay(te);
                          inRange = dayStart >= s && dayStart <= e;
                          isFirst = dayStart.getTime() === s.getTime();
                          isLast = dayStart.getTime() === e.getTime();
                        }

                        return (
                          <td
                            key={i}
                            className={`border-r border-slate-100 p-0 ${!inRange && (isSun || isSat) ? 'bg-red-50/20' : ''}`}
                          >
                            {inRange && (
                              <div className="relative mx-px my-1.5 h-6 overflow-hidden"
                                style={{
                                  borderRadius: `${isFirst ? '12px' : '0'} ${isLast ? '12px' : '0'} ${isLast ? '12px' : '0'} ${isFirst ? '12px' : '0'}`,
                                  backgroundColor: barColor,
                                }}
                              >
                                {(task.progress || 0) > 0 && (
                                  <div className="absolute left-0 top-0 h-full bg-white/25" style={{ width: `${task.progress}%` }} />
                                )}
                                {isFirst && task.checklist?.length > 0 && (
                                  <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-white/80 font-bold">
                                    {task.checklist.filter(x => x.completed).length}/{task.checklist.length}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Task Detail Panel ──────────────────────────────────────────────────────────

function TaskDetailPanel({
  task,
  onUpdate,
  onClose,
  readOnly,
}: {
  task: CTask;
  onUpdate: (updates: Partial<CTask>) => void;
  onClose: () => void;
  readOnly?: boolean;
}) {
  const [localProgress, setLocalProgress] = useState(task.progress || 0);
  const [localStatus, setLocalStatus] = useState<TaskStatus>(task.status);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalProgress(task.progress || 0);
    setLocalStatus(task.status);
  }, [task.id, task.progress, task.status]);

  const toggleChecklist = (itemId: string) => {
    if (readOnly) return;
    const updated = task.checklist.map(c => c.id === itemId ? { ...c, completed: !c.completed } : c);
    const done = updated.filter(x => x.completed).length;
    const prog = updated.length > 0 ? Math.round((done / updated.length) * 100) : localProgress;
    setLocalProgress(prog);
    onUpdate({ checklist: updated, progress: prog });
  };

  const handleSave = async () => {
    if (readOnly) return;
    setSaving(true);
    try {
      await supabase.from('construction_tasks').update({
        status: localStatus,
        progress: localProgress,
        checklist: task.checklist,
      }).eq('id', task.id);
      onUpdate({ status: localStatus, progress: localProgress });
    } finally {
      setSaving(false);
    }
  };

  const ts = getTaskStart(task);
  const te = getTaskEnd(task);
  const dur = ts && te ? differenceInDays(te, ts) + 1 : task.duration || task.days || 0;
  const completedCount = task.checklist?.filter(x => x.completed).length || 0;
  const totalCount = task.checklist?.length || 0;

  return (
    <div className="border border-indigo-200 rounded-xl bg-white shadow-md overflow-hidden">
      <div className="bg-indigo-600 px-4 py-3 flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm truncate">{task.name}</h3>
          <div className="flex items-center gap-4 mt-1 text-indigo-200 text-xs">
            <span>{ts ? format(ts, 'dd/MM/yyyy') : '--'} → {te ? format(te, 'dd/MM/yyyy') : '--'}</span>
            <span>{dur} ngày</span>
            <span>{(task.budget || 0).toLocaleString('vi-VN')}đ</span>
          </div>
        </div>
        <button onClick={onClose} className="text-indigo-200 hover:text-white ml-4 text-xl leading-none">✕</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* Checklist */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
              CHECKLIST NGHIỆM THU
            </h4>
            {totalCount > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${completedCount === totalCount ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {completedCount}/{totalCount}
              </span>
            )}
          </div>
          {totalCount > 0 ? (
            <div className="space-y-2">
              {task.checklist.map(item => (
                <label key={item.id} className={`flex items-start gap-2.5 ${readOnly ? '' : 'cursor-pointer'} group`}>
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleChecklist(item.id)}
                    disabled={readOnly}
                    className="mt-0.5 w-4 h-4 accent-indigo-600 flex-none"
                  />
                  <span className={`text-xs leading-relaxed ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {item.label}
                    {item.required && <span className="text-red-400 ml-1">*</span>}
                  </span>
                </label>
              ))}
              {totalCount > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>Nghiệm thu</span>
                    <span>{Math.round((completedCount / totalCount) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Chưa có checklist nghiệm thu.</p>
          )}
        </div>

        {/* Progress + Status */}
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2">TIẾN ĐỘ THỰC TẾ</h4>
            <div className="flex items-center gap-3">
              <input
                type="range" min={0} max={100} value={localProgress}
                onChange={e => !readOnly && setLocalProgress(Number(e.target.value))}
                disabled={readOnly}
                className="flex-1 accent-blue-600 h-2"
              />
              <span className="text-base font-bold text-blue-600 w-12 text-right">{localProgress}%</span>
            </div>
            <div className="mt-1.5 w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${localProgress}%`, backgroundColor: localProgress >= 100 ? '#16a34a' : '#2563eb' }} />
            </div>
          </div>

          {!readOnly && (
            <>
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">TRẠNG THÁI</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(STATUS_META) as TaskStatus[]).map(s => (
                    <button key={s} onClick={() => setLocalStatus(s)}
                      className={`py-2 px-2 text-[11px] font-bold rounded-lg border-2 transition-all ${localStatus === s ? 'border-transparent text-white' : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300'}`}
                      style={localStatus === s ? { backgroundColor: STATUS_META[s].bar } : {}}>
                      {STATUS_META[s].label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Đang lưu...' : 'Lưu cập nhật'}
              </button>
            </>
          )}

          {readOnly && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700">TRẠNG THÁI</h4>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: STATUS_META[localStatus]?.bar }}>
                {STATUS_META[localStatus]?.label}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PDF Export ────────────────────────────────────────────────────────────────

async function exportGanttToPDF(ganttRef: React.RefObject<HTMLDivElement>, projectName?: string) {
  const el = ganttRef.current;
  if (!el) return;
  try {
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;

    const canvas = await html2canvas(el, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      width: el.scrollWidth,
      height: el.scrollHeight,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfW = 297; // A4 landscape mm
    const pdfH = 210;
    const imgW = pdfW - 10;
    const imgH = (canvas.height * imgW) / canvas.width;

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    pdf.setFontSize(14);
    pdf.text(`Tiến Độ Thi Công${projectName ? ` — ${projectName}` : ''}`, 5, 8);
    pdf.setFontSize(8);
    pdf.text(`Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`, 5, 14);

    let yPos = 18;
    let remaining = imgH;
    let sourceY = 0;

    while (remaining > 0) {
      const pageH = pdfH - yPos - 5;
      const sliceH = Math.min(remaining, pageH);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = (sliceH / imgW) * canvas.width;
      const ctx = sliceCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceCanvas.height, 0, 0, sliceCanvas.width, sliceCanvas.height);
        pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 5, yPos, imgW, sliceH);
      }
      remaining -= sliceH;
      sourceY += sliceCanvas.height;
      if (remaining > 0) { pdf.addPage(); yPos = 5; }
    }

    pdf.save(`tien-do-${projectName || 'cong-trinh'}-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  } catch (e) {
    console.error('PDF export failed:', e);
    window.print();
  }
}

// ── Main Module ────────────────────────────────────────────────────────────────

export function ProjectManagementAIModule({
  projectId,
  externalTasks,
  readOnly = false,
  onUpdateTask,
  onOpenImport,
}: {
  projectId?: string;
  externalTasks?: CTask[];
  readOnly?: boolean;
  onUpdateTask?: (id: string, updates: Partial<CTask>) => void;
  onOpenImport?: () => void;
}) {
  const [localTasks, setLocalTasks] = useState<CTask[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [exporting, setExporting] = useState(false);
  const ganttRef = useRef<HTMLDivElement>(null);

  // If externalTasks provided, use them (sync from parent)
  const tasks: CTask[] = externalTasks && externalTasks.length > 0
    ? externalTasks.filter(t => t.plannedStart || t.startDate) // only tasks with dates
    : localTasks;

  // Load from Supabase only when no external tasks provided
  useEffect(() => {
    if (externalTasks !== undefined) { setLoading(false); return; }
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from('construction_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLocalTasks(data.map((t: any): CTask => ({
            id: t.id, name: t.name, category: t.category || 'KHÁC',
            status: (t.status as TaskStatus) || 'TODO',
            subcontractor: t.subcontractor || '',
            days: t.days || 0, budget: t.budget || 0, spent: t.spent || 0,
            approved: t.approved || false,
            dependencies: t.dependencies || [],
            tags: t.tags || [],
            issues: t.issues || [],
            checklist: (t.checklist || []).map((item: any, idx: number) =>
              typeof item === 'string'
                ? { id: `c-${t.id}-${idx}`, label: item, completed: false, required: false }
                : item
            ),
            progress: t.progress || 0,
            startDate: t.start_date || t.planned_start || undefined,
            endDate: t.end_date || t.planned_end || undefined,
            plannedStart: t.planned_start || t.start_date || undefined,
            plannedEnd: t.planned_end || t.end_date || undefined,
            duration: t.duration || t.days || 1,
          })));
        }
        setLoading(false);
      });
  }, [projectId, externalTasks]);

  const selectedTask = tasks.find(t => t.id === selectedId) || null;

  const handleUpdateTask = (id: string, updates: Partial<CTask>) => {
    setLocalTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (onUpdateTask) onUpdateTask(id, updates);
  };

  const handleSaveDates = async () => {
    if (!projectId || !tasks.length || readOnly) return;
    setSaving(true);
    const upserts = tasks.map(t => ({
      id: t.id, project_id: projectId,
      planned_start: t.plannedStart || t.startDate,
      planned_end: t.plannedEnd || t.endDate,
      start_date: t.startDate || t.plannedStart,
      end_date: t.endDate || t.plannedEnd,
      duration: t.duration || t.days,
      days: t.days || t.duration,
    }));
    const { error } = await supabase.from('construction_tasks').upsert(upserts, { onConflict: 'id' });
    setSaving(false);
    setSaveMsg(error ? '⚠ Lỗi lưu' : `✓ Đã lưu ${tasks.length} hạng mục`);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handleExportPDF = async () => {
    setExporting(true);
    await exportGanttToPDF(ganttRef, projectId);
    setExporting(false);
  };

  const stats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter(t => t.status === 'DONE').length,
    doing: tasks.filter(t => t.status === 'DOING').length,
    review: tasks.filter(t => t.status === 'REVIEW').length,
    avgProgress: tasks.length ? Math.round(tasks.reduce((a, t) => a + (t.progress || 0), 0) / tasks.length) : 0,
  }), [tasks]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Đang tải tiến độ thi công...</p>
      </div>
    </div>
  );

  if (!tasks.length) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="w-12 h-12 text-slate-200" />
      <div className="text-center">
        <p className="font-bold text-slate-600">Chưa có dữ liệu tiến độ</p>
        <p className="text-sm text-slate-500 mt-1">
          {readOnly
            ? 'Nhà thầu chưa nhập timeline thi công'
            : 'Nhập báo giá hoặc file PDF timeline để AI tạo tiến độ tự động'}
        </p>
      </div>
      {onOpenImport && !readOnly && (
        <button onClick={onOpenImport}
          className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-colors shadow-md">
          <FileSpreadsheet className="w-4 h-4" />
          Nhập Báo Giá / PDF Timeline
        </button>
      )}
    </div>
  );

  return (
    <div className="p-3 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">📊 Tiến Độ Thi Công</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {stats.total} hạng mục · Hoàn thành {stats.done} · Đang làm {stats.doing} · Chờ nghiệm thu {stats.review}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-500 mr-1">
            {(Object.keys(STATUS_META) as TaskStatus[]).map(s => (
              <div key={s} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: STATUS_META[s].bar }} />
                {STATUS_META[s].label}
              </div>
            ))}
          </div>
          {saveMsg && <span className="text-xs text-emerald-600 font-medium">{saveMsg}</span>}
          {/* Export PDF */}
          <button onClick={handleExportPDF} disabled={exporting}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60">
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Đang xuất...' : 'Xuất PDF'}
          </button>
          {/* Share */}
          <button
            onClick={() => {
              const url = `${window.location.origin}/construction?project=${projectId}&role=homeowner`;
              navigator.clipboard.writeText(url).then(() => setSaveMsg('✓ Đã copy link chia sẻ'));
            }}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors">
            <Share2 className="w-3.5 h-3.5" />
            Chia sẻ
          </button>
          {/* Save dates — hidden for readOnly */}
          {!readOnly && (
            <button onClick={handleSaveDates} disabled={saving}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors">
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Đang lưu...' : 'Lưu lịch'}
            </button>
          )}
          {/* Import button for non-readOnly when has tasks */}
          {!readOnly && onOpenImport && (
            <button onClick={onOpenImport}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              + Nhập thêm
            </button>
          )}
        </div>
      </div>

      {/* Overall progress */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-slate-600 mb-1.5">
            <span className="font-bold">Tiến độ tổng thể</span>
            <span className="font-bold text-blue-600">{stats.avgProgress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${stats.avgProgress}%`, backgroundColor: stats.avgProgress >= 100 ? '#16a34a' : '#2563eb' }} />
          </div>
        </div>
        <div className="text-right text-xs text-slate-500 shrink-0">
          <div className="text-emerald-600 font-bold text-sm">{stats.done}/{stats.total}</div>
          <div>hoàn thành</div>
        </div>
      </div>

      {/* Gantt */}
      <div ref={ganttRef} className="overflow-x-auto rounded-xl">
        <ConstructionGantt
          tasks={tasks}
          selectedId={selectedId}
          onSelect={id => setSelectedId(prev => prev === id ? null : id)}
          onUpdateTask={handleUpdateTask}
          readOnly={readOnly}
        />
      </div>
      {!readOnly && (
        <p className="text-[10px] text-slate-400 text-center">
          Click vào hàng để xem checklist nghiệm thu · Chỉnh trực tiếp ngày bắt đầu và số ngày trên bảng
        </p>
      )}

      {/* Detail panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onUpdate={updates => handleUpdateTask(selectedTask.id, updates)}
          onClose={() => setSelectedId(null)}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
