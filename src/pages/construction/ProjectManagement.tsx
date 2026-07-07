import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { parseISO, format, addDays, differenceInDays, startOfDay, isValid } from 'date-fns';
import type { CTask, TaskStatus } from './types';
import { Save, CheckSquare, AlertCircle, Share2, FileSpreadsheet, Download, Trash2, Plus, GripVertical } from 'lucide-react';
import { WorkflowManager, type WorkflowStage } from './views';

// ── Helpers ────────────────────────────────────────────────────────────────────

// Category ordering: A, B, C, ... Z, AA, AB, ... (26-based, like spreadsheet columns)
const categoryLetter = (index: number): string => {
  let n = index, s = '';
  do { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } while (n >= 0);
  return s;
};

const parseDate = (s?: string | null): Date | null => {
  if (!s) return null;
  const d = parseISO(s);
  return isValid(d) ? d : null;
};

const getTaskStart = (t: CTask) => parseDate(t.plannedStart || t.startDate);
const getTaskEnd = (t: CTask) => parseDate(t.plannedEnd || t.endDate);

const getDateRange = (tasks: CTask[], extraStart?: string, extraEnd?: string) => {
  const dates = tasks.flatMap(t => [getTaskStart(t), getTaskEnd(t)]).filter(Boolean) as Date[];
  const es = parseDate(extraStart); if (es) dates.push(es);
  const ee = parseDate(extraEnd); if (ee) dates.push(ee);
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
  onDeleteTask,
  onCreateTask,  onReorderTasks,
  readOnly,
  projectStartDate,
  projectEndDate,
  onUpdateProjectDates,
  categoryOrder,
  justCreatedId,
  onClearJustCreated,
}: {
  tasks: CTask[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<CTask>) => void;
  onDeleteTask?: (id: string) => void;  onCreateTask?: (category: string) => void;
  onReorderTasks?: (reordered: CTask[]) => void;
  readOnly?: boolean;
  projectStartDate?: string;
  projectEndDate?: string;
  onUpdateProjectDates?: (start?: string, end?: string) => void;
  categoryOrder?: string[];
  // Task vừa bấm "+ Thêm việc" tạo ra — chỉ dùng để autoFocus ô tên ngay dòng đó, KHÔNG mở
  // popup checklist/tiến độ (selectedId/onSelect) như khi click chọn 1 task có sẵn.
  justCreatedId?: string | null;
  onClearJustCreated?: () => void;
}) {
  const { min, max } = useMemo(() => getDateRange(tasks, projectStartDate, projectEndDate), [tasks, projectStartDate, projectEndDate]);
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

  // Order categories (hạng mục lớn) by the saved Workflow flow. Categories from
  // the flow that have no tasks yet still get a header row (empty, with just
  // "+ Thêm việc") so a brand-new project can be built up manually stage by
  // stage. Categories with tasks but not (yet) part of the flow are appended
  // at the end in their original appearance order.
  const groupedEntries = useMemo(() => {
    if (!categoryOrder || categoryOrder.length === 0) return Object.entries(grouped);
    const seen = new Set<string>();
    const ordered: [string, CTask[]][] = categoryOrder.map(cat => {
      seen.add(cat);
      return [cat, grouped[cat] || []];
    });
    Object.entries(grouped).forEach(([cat, catTasks]) => {
      if (!seen.has(cat)) ordered.push([cat, catTasks]);
    });
    return ordered;
  }, [grouped, categoryOrder]);

  const orderedTasks = useMemo(() => groupedEntries.flatMap(([, t]) => t), [groupedEntries]);

  const handleStartChange = (task: CTask, val: string, isFirst: boolean = false) => {
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

  const handleEndChange = (task: CTask, val: string) => {
    if (readOnly) return;
    const ne = parseDate(val);
    if (!ne) return;
    const s = getTaskStart(task) || new Date();
    if (ne < s) return;
    const d = differenceInDays(ne, s) + 1;
    onUpdateTask(task.id, {
      duration: d, days: d,
      plannedEnd: format(ne, 'yyyy-MM-dd'), endDate: format(ne, 'yyyy-MM-dd'),
    });
  };

  const todayDate = startOfDay(new Date());
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  // Chỉ cho phép kéo-thả khi nhấn giữ đúng icon 6 chấm ở đầu dòng — nếu không, cả dòng sẽ
  // "draggable" và người dùng dễ vô tình kéo lệch thứ tự khi chỉ định bấm vào 1 ô để sửa.
  const [dragHandleId, setDragHandleId] = useState<string | null>(null);

  useEffect(() => {
    if (!readOnly && !projectStartDate && orderedTasks.length > 0) {
      const firstTask = orderedTasks[0];
      const ts = getTaskStart(firstTask);
      if (ts && onUpdateProjectDates) {
        onUpdateProjectDates(format(ts, 'yyyy-MM-dd'), projectEndDate || undefined);
      }
    }
  }, [projectStartDate, orderedTasks, readOnly, onUpdateProjectDates, projectEndDate]);

  // Auto-fill the project end date from the latest task end date — mirrors the
  // start-date effect above. Without this, "NGÀY KẾT THÚC" stays stuck on the
  // dd/mm/yyyy placeholder even once every task already has an end date.
  useEffect(() => {
    if (readOnly || projectEndDate || !onUpdateProjectDates || tasks.length === 0) return;
    const ends = tasks.map(getTaskEnd).filter((d): d is Date => !!d);
    if (!ends.length) return;
    const maxEnd = ends.reduce((a, b) => (a > b ? a : b));
    onUpdateProjectDates(projectStartDate || undefined, format(maxEnd, 'yyyy-MM-dd'));
  }, [readOnly, projectEndDate, tasks, projectStartDate, onUpdateProjectDates]);

  const handleDrop = (targetTaskId: string) => {
    if (!dragId || dragId === targetTaskId || !onReorderTasks) return;
    const from = orderedTasks.findIndex(t => t.id === dragId);
    const to = orderedTasks.findIndex(t => t.id === targetTaskId);
    if (from === -1 || to === -1) return;
    const reordered = [...orderedTasks];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    onReorderTasks(reordered);
    setDragId(null);
    setDragOverId(null);
  };

  // Column layout constants (px)
  const CW = { stt: 32, name: 244, start: 96, dur: 48, end: 96, prog: 80, action: readOnly ? 0 : 40 };
  const CL = {
    stt: 0,
    name: CW.stt,
    start: CW.stt + CW.name,
    dur: CW.stt + CW.name + CW.start,
    end: CW.stt + CW.name + CW.start + CW.dur,
    prog: CW.stt + CW.name + CW.start + CW.dur + CW.end,
    action: CW.stt + CW.name + CW.start + CW.dur + CW.end + CW.prog,
  };
  const TOTAL_LEFT = CL.action + CW.action;

  return (
    <div className="w-full border border-slate-200 rounded-xl overflow-auto bg-white shadow-sm text-[11px]" style={{ maxHeight: '70vh' }}>
      <table className="border-collapse" style={{ minWidth: `${TOTAL_LEFT + days.length * 30}px` }}>
        <thead className="sticky top-0 z-40">
          {/* Row 1: Left headers (rowSpan=2) + Week headers */}
          <tr className="h-8 bg-slate-700 text-white">
            <th rowSpan={2} className="sticky z-50 bg-slate-700 border-r border-slate-600 text-center font-bold" style={{ left: CL.stt, width: CW.stt, minWidth: CW.stt }}>STT</th>
            <th rowSpan={2} className="sticky z-50 bg-slate-700 border-r border-slate-600 text-left px-2 font-bold max-md:text-[10px] max-md:!w-[140px] max-md:!min-w-[140px] overflow-hidden" style={{ left: CL.name, width: CW.name, minWidth: CW.name }}>HẠNG MỤC / CÔNG VIỆC</th>
            <th rowSpan={2} className="sticky max-md:!static z-50 bg-slate-700 border-r border-slate-600 text-center font-bold" style={{ left: CL.start, width: CW.start, minWidth: CW.start }}>BẮT ĐẦU</th>
            <th rowSpan={2} className="sticky max-md:!static z-50 bg-slate-700 border-r border-slate-600 text-center font-bold" style={{ left: CL.dur, width: CW.dur, minWidth: CW.dur }}>NGÀY</th>
            <th rowSpan={2} className="sticky max-md:!static z-50 bg-slate-700 border-r border-slate-600 text-center font-bold" style={{ left: CL.end, width: CW.end, minWidth: CW.end }}>KẾT THÚC</th>
            <th rowSpan={2} className="sticky max-md:!static z-50 bg-slate-700 border-r border-slate-600 text-center font-bold print:hidden" style={{ left: CL.prog, width: CW.prog, minWidth: CW.prog, boxShadow: readOnly ? '3px 0 8px -2px rgba(0,0,0,0.15)' : 'none' }}>TIẾN ĐỘ</th>
            {!readOnly && <th rowSpan={2} className="sticky max-md:!static z-50 bg-slate-700 text-center font-bold print:hidden" style={{ left: CL.action, width: CW.action, minWidth: CW.action, boxShadow: '3px 0 8px -2px rgba(0,0,0,0.15)' }}></th>}
            {weeks.map((w, i) => (
              <th key={i} colSpan={w.count} className="border-r border-slate-600 text-center font-bold text-[9px] uppercase tracking-wide px-1">{w.label}</th>
            ))}
          </tr>
          {/* Row 2: Day numbers (left cols filled by rowSpan) */}
          <tr className="h-8 bg-slate-50 text-slate-600">
            {days.map((day, i) => {
              const isSun = day.getDay() === 0;
              const isSat = day.getDay() === 6;
              const isToday = startOfDay(day).getTime() === todayDate.getTime();
              return (
                <th key={i} className={`border-r text-center font-normal relative
                  ${isToday ? 'bg-red-500 text-white border-red-500' : isSun ? 'bg-red-50 text-red-400 border-slate-200' : isSat ? 'bg-orange-50 text-orange-400 border-slate-200' : 'border-slate-200'}`}
                  style={{ width: 30, minWidth: 30 }}>
                  <div className="text-[10px] font-bold">{day.getDate()}</div>
                  <div className="text-[8px] opacity-80">{['CN','T2','T3','T4','T5','T6','T7'][day.getDay()]}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr className="h-10 bg-[#e0f2fe] border-b-2 border-[#bae6fd]">
            <td className="sticky z-30 bg-[#e0f2fe] border-r border-slate-200 text-center text-sky-800 font-black text-xs" style={{ left: CL.stt }}>★</td>
            <td className="sticky z-30 bg-[#e0f2fe] border-r border-slate-200 px-2 text-sky-900 font-black text-xs tracking-wider" style={{ left: CL.name, width: CW.name, minWidth: CW.name, boxShadow: '3px 0 8px -2px rgba(0,0,0,0.05)' }}>
              TIẾN ĐỘ THI CÔNG
            </td>
            <td className="sticky max-md:!static z-30 bg-[#e0f2fe] border-r border-slate-200 p-0" style={{ left: CL.start }}>
              <input type="date" disabled={readOnly}
                className="w-full h-10 text-center bg-transparent outline-none cursor-pointer text-sky-900 font-bold disabled:opacity-80 hover:bg-sky-100 focus:bg-sky-100"
                value={projectStartDate ? format(parseISO(projectStartDate), 'yyyy-MM-dd') : ''}
                onChange={e => { 
                  const newStart = e.target.value;
                  if (onUpdateProjectDates) onUpdateProjectDates(newStart || undefined, projectEndDate || undefined);
                  if (newStart && !readOnly) {
                    if (orderedTasks.length > 0) {
                      const firstTask = orderedTasks[0];
                      const ns = parseISO(newStart);
                      const os = getTaskStart(firstTask);
                      const oe = getTaskEnd(firstTask);
                      const dur = os && oe ? differenceInDays(oe, os) : (firstTask.duration || firstTask.days || 7) - 1;
                      const ne = addDays(ns, dur);
                      onUpdateTask(firstTask.id, {
                        plannedStart: format(ns, 'yyyy-MM-dd'), startDate: format(ns, 'yyyy-MM-dd'),
                        plannedEnd: format(ne, 'yyyy-MM-dd'), endDate: format(ne, 'yyyy-MM-dd'),
                      });
                    }
                  }
                }} />
            </td>
            <td className="sticky max-md:!static z-30 bg-[#e0f2fe] border-r border-slate-200 p-0" style={{ left: CL.dur }}>
              <input type="number" min={1} disabled={readOnly}
                className="w-full h-10 text-center bg-transparent outline-none cursor-pointer text-sky-900 font-bold disabled:opacity-80 hover:bg-sky-100 focus:bg-sky-100"
                value={projectStartDate && projectEndDate ? differenceInDays(parseISO(projectEndDate), parseISO(projectStartDate)) + 1 : ''}
                onChange={e => {
                  if (readOnly || !onUpdateProjectDates) return;
                  const d = parseInt(e.target.value, 10);
                  if (isNaN(d) || d < 1) return;
                  const base = projectStartDate ? parseISO(projectStartDate) : (orderedTasks[0] && getTaskStart(orderedTasks[0])) || new Date();
                  const ne = addDays(base, d - 1);
                  onUpdateProjectDates(projectStartDate || format(base, 'yyyy-MM-dd'), format(ne, 'yyyy-MM-dd'));
                }} />
            </td>
            <td className="sticky max-md:!static z-30 bg-[#e0f2fe] border-r border-slate-200 p-0" style={{ left: CL.end }}>
              <input type="date" disabled={readOnly}
                className="w-full h-10 text-center bg-transparent outline-none cursor-pointer text-sky-900 font-bold disabled:opacity-80 hover:bg-sky-100 focus:bg-sky-100"
                value={projectEndDate ? format(parseISO(projectEndDate), 'yyyy-MM-dd') : ''}
                onChange={e => { if (onUpdateProjectDates) onUpdateProjectDates(projectStartDate || undefined, e.target.value || undefined) }} />
            </td>
            <td className="sticky max-md:!static z-30 bg-[#e0f2fe] text-center px-1 print:hidden" style={{ left: CL.prog, boxShadow: readOnly ? '3px 0 8px -2px rgba(0,0,0,0.05)' : 'none' }}>
              <div className="w-10 h-2 bg-sky-200 rounded-full overflow-hidden mx-auto">
                <div className="h-full rounded-full bg-sky-500" style={{ width: '100%' }} />
              </div>
            </td>
            {!readOnly && (
               <td className="sticky max-md:!static z-30 bg-[#e0f2fe] border-r border-slate-200" style={{ left: CL.action, boxShadow: '3px 0 8px -2px rgba(0,0,0,0.05)' }}></td>
            )}
            {days.map((day, i) => {
              const dayStart = startOfDay(day);
              const s = projectStartDate ? startOfDay(parseISO(projectStartDate)) : null;
              const e = projectEndDate ? startOfDay(parseISO(projectEndDate)) : null;
              const inRange = !!(s && e && dayStart >= s && dayStart <= e);
              const isFirst = !!(s && dayStart.getTime() === s.getTime());
              const isLast = !!(e && dayStart.getTime() === e.getTime());
              return (
                <td key={i} className="border-r border-[#bae6fd] bg-[#f0f9ff]/50 p-0 relative">
                  {inRange && (
                    <div className="mx-px my-2.5 h-5 bg-sky-500"
                      style={{ borderRadius: `${isFirst ? '10px' : '0'} ${isLast ? '10px' : '0'} ${isLast ? '10px' : '0'} ${isFirst ? '10px' : '0'}` }} />
                  )}
                </td>
              );
            })}
          </tr>
          {groupedEntries.map(([cat, catTasks], ci) => {
            const letter = categoryLetter(ci);
            return (
            <React.Fragment key={cat}>
              {/* Category header row */}
              <tr className="h-8 bg-slate-100">
                <td className="sticky z-30 bg-slate-100 border-r border-slate-200 text-center text-slate-600 font-bold" style={{ left: CL.stt }}>{letter}</td>
                <td className="sticky z-30 bg-slate-100 px-2 text-slate-700 font-bold text-xs uppercase tracking-wide max-md:!w-[140px] max-md:!min-w-[140px] overflow-hidden" colSpan={readOnly ? 4 : 5} style={{ left: CL.name, boxShadow: '3px 0 8px -2px rgba(0,0,0,0.08)' }}>
                  <div className="flex justify-between items-center pr-2">
                    <span>{cat}</span>
                    {!readOnly && onCreateTask && (
                      <button onClick={(e) => { e.stopPropagation(); onCreateTask(cat); }} className="print:hidden px-2 py-0.5 w-auto h-auto min-h-0 bg-white border border-slate-200 rounded text-[10px] text-slate-600 hover:bg-slate-50 flex items-center gap-1 shrink-0">
                        <Plus size={10} /> Thêm việc
                      </button>
                    )}
                  </div>
                </td>
                {days.map((day, i) => {
                  const isToday = startOfDay(day).getTime() === todayDate.getTime();
                  return <td key={i} className={`border-r relative ${isToday ? 'border-red-400 bg-red-100/40' : 'border-slate-200'}`}>
                    {isToday && <div className="absolute inset-0 border-x-2 border-red-400/60 pointer-events-none" />}
                  </td>;
                })}
              </tr>
              {/* Task rows */}
              {catTasks.map((task, ti) => {
                const ts = getTaskStart(task);
                const te = getTaskEnd(task);
                const dur = ts && te ? differenceInDays(te, ts) + 1 : task.duration || task.days || 0;
                const sel = selectedId === task.id;
                const justCreated = justCreatedId === task.id;
                const isOverdue = task.status !== 'DONE' && te && startOfDay(te) < todayDate;
                const barColor = isOverdue ? '#ef4444' : (STATUS_META[task.status]?.bar || '#94a3b8');
                const cellBg = sel ? 'bg-indigo-50' : 'bg-white';
                const stt = `${letter}${ti + 1}`;
                return (
                  <tr
                    key={task.id}
                    draggable={!readOnly && dragHandleId === task.id}
                    onDragStart={() => setDragId(task.id)}
                    onDragOver={e => { e.preventDefault(); setDragOverId(task.id); }}
                    onDragLeave={() => setDragOverId(null)}
                    onDrop={() => handleDrop(task.id)}
                    onDragEnd={() => { setDragId(null); setDragOverId(null); setDragHandleId(null); }}
                    className={`group h-9 border-b border-slate-100 transition-colors
                      ${dragOverId === task.id ? 'border-t-2 border-t-indigo-400 bg-indigo-50/60' : ''}
                      ${dragId === task.id ? 'opacity-40' : ''}
                      ${sel ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                  >
                    {/* STT */}
                    <td className={`sticky z-30 ${cellBg} group-hover:bg-slate-50 border-r border-slate-100 text-center text-slate-400`} style={{ left: CL.stt }}>{stt}</td>
                    {/* Name — only this column opens the checklist/progress popup */}
                    <td className={`sticky z-30 ${cellBg} group-hover:bg-slate-50 border-r border-slate-100 px-2 max-md:!w-[140px] max-md:!min-w-[140px] overflow-hidden cursor-pointer`} style={{ left: CL.name, width: CW.name, minWidth: CW.name }} onClick={() => onSelect(task.id)}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {!readOnly && (
                          <GripVertical
                            size={12}
                            className="text-slate-300 flex-none cursor-grab active:cursor-grabbing"
                            onMouseDown={() => setDragHandleId(task.id)}
                            onMouseUp={() => setDragHandleId(null)}
                            onClick={e => e.stopPropagation()}
                          />
                        )}
                        <span className={`w-2 h-2 rounded-full flex-none ${STATUS_META[task.status]?.dot || 'bg-slate-400'}`} />
                        {readOnly ? (
                          <span className="truncate text-slate-800" title={task.name}>{task.name}</span>
                        ) : (
                          <input type="text" autoFocus={justCreated} onFocus={e => e.target.select()} onBlur={() => justCreated && onClearJustCreated?.()} className="w-full h-8 text-slate-800 bg-transparent outline-none hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-indigo-300 rounded px-1 -ml-1" value={task.name} onChange={e => { e.stopPropagation(); onUpdateTask(task.id, { name: e.target.value }); }} onClick={e => e.stopPropagation()} />
                        )}
                      </div>
                    </td>
                    {/* Start date */}
                    <td className={`sticky max-md:!static z-30 ${cellBg} group-hover:bg-slate-50 border-r border-slate-100 p-0`} style={{ left: CL.start }}>
                      {readOnly ? (
                        <div className="w-full h-9 flex items-center justify-center text-slate-600">{ts ? format(ts, 'dd/MM/yy') : '--'}</div>
                      ) : (
                        <input type="date" className="w-full h-9 text-center bg-transparent outline-none hover:bg-indigo-50 focus:bg-indigo-50 cursor-pointer" value={ts ? format(ts, 'yyyy-MM-dd') : ''} onChange={e => { e.stopPropagation(); handleStartChange(task, e.target.value, ti === 0); }} onClick={e => e.stopPropagation()} />
                      )}
                    </td>
                    {/* Duration */}
                    <td className={`sticky max-md:!static z-30 ${cellBg} group-hover:bg-slate-50 border-r border-slate-100 p-0`} style={{ left: CL.dur }}>
                      {readOnly ? (
                        <div className="w-full h-9 flex items-center justify-center text-slate-600">{dur || '--'}</div>
                      ) : (
                        <input type="number" className="w-full h-9 text-center bg-transparent outline-none hover:bg-indigo-50 focus:bg-indigo-50 cursor-pointer" value={dur || ''} min={1} onChange={e => { e.stopPropagation(); handleDurChange(task, e.target.value); }} onClick={e => e.stopPropagation()} />
                      )}
                    </td>
                    {/* End date */}
                    <td className={`sticky max-md:!static z-30 ${cellBg} group-hover:bg-slate-50 border-r border-slate-100 p-0`} style={{ left: CL.end }}>
                      {readOnly ? (
                        <div className="w-full h-9 flex items-center justify-center text-slate-600">{te ? format(te, 'dd/MM/yy') : '--'}</div>
                      ) : (
                        <input type="date" className="w-full h-9 text-center bg-transparent outline-none hover:bg-indigo-50 focus:bg-indigo-50 cursor-pointer" value={te ? format(te, 'yyyy-MM-dd') : ''} onChange={e => { e.stopPropagation(); handleEndChange(task, e.target.value); }} onClick={e => e.stopPropagation()} />
                      )}
                    </td>
                    {/* Progress */}
                    <td className={`sticky max-md:!static z-30 ${cellBg} group-hover:bg-slate-50 text-center px-1 print:hidden ${readOnly ? '' : 'border-r border-slate-100'}`} style={{ left: CL.prog, boxShadow: readOnly ? '3px 0 8px -2px rgba(0,0,0,0.08)' : 'none' }}>
                      <div className="flex items-center gap-1 justify-center">
                        <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${task.progress || 0}%`, backgroundColor: barColor }} />
                        </div>
                        <span className="text-slate-400 w-6 text-right text-[9px]">{task.progress || 0}%</span>
                      </div>
                    </td>
                    {/* Delete Action (only if not readonly) */}
                    {!readOnly && (
                       <td className={`sticky max-md:!static z-30 ${cellBg} group-hover:bg-slate-50 text-center px-1 print:hidden`} style={{ left: CL.action, boxShadow: '3px 0 8px -2px rgba(0,0,0,0.08)' }}>
                          <button onClick={(e) => { e.stopPropagation(); if(onDeleteTask) onDeleteTask(task.id); }} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded mx-auto transition-colors" title="Xóa công tác">
                            <Trash2 size={12} />
                          </button>
                       </td>
                    )}
                    {/* Day columns — Gantt bars */}
                    {days.map((day, i) => {
                      const isSun = day.getDay() === 0;
                      const isSat = day.getDay() === 6;
                      const dayStart = startOfDay(day);
                      const isToday = dayStart.getTime() === todayDate.getTime();
                      let inRange = false, isFirst = false, isLast = false;
                      if (ts && te) {
                        const s = startOfDay(ts);
                        const e = startOfDay(te);
                        inRange = dayStart >= s && dayStart <= e;
                        isFirst = dayStart.getTime() === s.getTime();
                        isLast = dayStart.getTime() === e.getTime();
                      }
                      return (
                        <td key={i} className={`border-r p-0 relative
                          ${isToday ? 'border-red-400 bg-red-50/40' : 'border-slate-100'}
                          ${!inRange && !isToday && (isSun || isSat) ? 'bg-red-50/20' : ''}`}>
                          {isToday && (
                            <div className="absolute inset-0 border-x-2 border-red-400/60 pointer-events-none z-10" />
                          )}
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
            );
          })}
        </tbody>
      </table>
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
  const [newItem, setNewItem] = useState('');

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

  const addChecklistItem = () => {
    const label = newItem.trim();
    if (!label || readOnly) return;
    const updated = [...(task.checklist || []), { id: `c-${Date.now()}`, label, completed: false, required: false }];
    onUpdate({ checklist: updated });
    setNewItem('');
  };

  const removeChecklistItem = (itemId: string) => {
    if (readOnly) return;
    const updated = task.checklist.filter(c => c.id !== itemId);
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
          <div className="space-y-2">
            {totalCount > 0 ? (
              <>
                {task.checklist.map(item => (
                  <div key={item.id} className="flex items-start gap-2 group">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleChecklist(item.id)}
                      disabled={readOnly}
                      className="mt-0.5 w-4 h-4 accent-indigo-600 flex-none cursor-pointer"
                    />
                    <span className={`flex-1 text-xs leading-relaxed ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {item.label}
                      {item.required && <span className="text-red-400 ml-1">*</span>}
                    </span>
                    {!readOnly && (
                      <button onClick={() => removeChecklistItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all text-xs leading-none flex-none">✕</button>
                    )}
                  </div>
                ))}
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
              </>
            ) : (
              <p className="text-xs text-slate-400 italic">Chưa có checklist nghiệm thu.</p>
            )}
            {!readOnly && (
              <div className="flex gap-2 mt-2 pt-2 border-t border-dashed border-slate-200">
                <input
                  type="text"
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addChecklistItem()}
                  placeholder="+ Thêm mục nghiệm thu..."
                  className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 placeholder-slate-400"
                />
                {newItem.trim() && (
                  <button onClick={addChecklistItem}
                    className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    <Plus size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
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

async function exportGanttToPDF(ganttRef: React.RefObject<HTMLDivElement | null>, projectName?: string) {
  // Let the browser handle standard PDF print layout using `@media print`.
  document.title = `Tien-Do-Thi-Cong-${projectName || 'Du-An'}`;
  window.print();
}

// ── Main Module ────────────────────────────────────────────────────────────────

export function ProjectManagementAIModule({
  projectId,
  project,
  onUpdateProject,
  externalTasks,
  readOnly = false,
  onUpdateTask,
  onOpenImport,
  isWorkflowOpen,
  onCloseWorkflow,
}: {
  projectId?: string;
  project?: { startDate?: string; handoverDate?: string };
  onUpdateProject?: (id: string, updates: Record<string, any>) => void;
  externalTasks?: CTask[];
  readOnly?: boolean;
  onUpdateTask?: (id: string, updates: Partial<CTask>) => void;
  onOpenImport?: () => void;
  isWorkflowOpen?: boolean;
  onCloseWorkflow?: () => void;
}) {
  const [displayTasks, setDisplayTasks] = useState<CTask[]>([]);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Task vừa tạo qua "+ Thêm việc" — chỉ để autoFocus ô tên, KHÔNG mở popup chi tiết
  // (selectedId) như khi người dùng chủ động click chọn 1 task có sẵn.
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [exporting, setExporting] = useState(false);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  // Lets the empty-state's own "Tạo thủ công theo Flow đề xuất" button open the
  // Workflow modal even though the header's Workflow button (isWorkflowOpen prop)
  // is unreachable before any task exists.
  const [localWorkflowOpen, setLocalWorkflowOpen] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  // Giai đoạn (category) bị xóa hẳn khỏi Workflow (không phải đổi tên) mà vẫn còn việc bên
  // trong — chờ user chọn giai đoạn mới cho từng nhóm trước khi áp dụng, tránh việc rơi
  // âm thầm vào nhóm "KHÁC".
  const [pendingReassign, setPendingReassign] = useState<{ from: string; count: number }[] | null>(null);
  const [reassignTargets, setReassignTargets] = useState<Record<string, string>>({});
  const ganttRef = useRef<HTMLDivElement>(null);
  // Ref tracks pending local edits per task ID — always current, no stale closure issues
  const pendingEditsRef = useRef<Record<string, Partial<CTask>>>({});
  const tempTasksRef = useRef<CTask[]>([]);
  // IDs we've deleted locally but the parent's externalTasks (loaded via realtime, which lags
  // a beat behind our own supabase .delete() call) may still briefly include — filtered out of
  // every incoming externalTasks snapshot until the parent itself catches up, otherwise a stale
  // snapshot arriving right after a clear/delete silently resurrects the "deleted" tasks.
  const locallyDeletedIdsRef = useRef<Set<string>>(new Set());
  const workflowStorageKey = `dqh_workflow_stages_${projectId || 'default'}`;

  // Sync from externalTasks: merge external status/progress with local pending edits.
  // Using refs avoids stale closure bugs when externalTasks changes mid-edit.
  useEffect(() => {
    if (externalTasks === undefined) return;
    const deletedIds = locallyDeletedIdsRef.current;
    const filteredExternal = deletedIds.size > 0 ? externalTasks.filter(t => !deletedIds.has(t.id)) : externalTasks;
    if (deletedIds.size > 0) {
      // Once the parent's own data no longer contains an id, it's caught up — stop filtering it.
      locallyDeletedIdsRef.current = new Set([...deletedIds].filter(id => externalTasks.some(t => t.id === id)));
    }
    setDisplayTasks(prev => {
      if (prev.length === 0) {
        // Initial load
        return filteredExternal;
      }
      // Merge: apply pending local edits on top of fresh external data
      const merged = filteredExternal.map(ext => {
        const pending = pendingEditsRef.current[ext.id];
        if (!pending) return ext;
        return { ...ext, ...pending };
      });
      // Keep temp (new) tasks that haven't been saved yet
      return [...merged, ...tempTasksRef.current];
    });
    setLoading(false);
  }, [externalTasks]);

  // Load from Supabase only when no external tasks provided
  useEffect(() => {
    if (externalTasks !== undefined) return;
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from('construction_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDisplayTasks(data.map((t: any): CTask => ({
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
  }, [projectId]);

  const tasks = displayTasks;
  const selectedTask = tasks.find(t => t.id === selectedId) || null;

  // Load this project's saved Workflow flow (category order) once tasks are known.
  // Falls back to the order categories first appear in the loaded tasks.
  useEffect(() => {
    if (loading) return;
    const saved = localStorage.getItem(workflowStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as WorkflowStage[];
        setCategoryOrder([...parsed].sort((a, b) => a.order - b.order).map(s => s.name));
        return;
      } catch { /* fall through to derive from tasks */ }
    }
    const seen: string[] = [];
    tasks.forEach(t => { const c = t.category || 'KHÁC'; if (!seen.includes(c)) seen.push(c); });
    setCategoryOrder(seen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, workflowStorageKey]);

  // Stages to seed the Workflow modal with: saved flow if any, else the current
  // hạng mục lớn (categories) in their displayed order, else undefined so
  // WorkflowManager proposes its own default flow (used for brand-new projects).
  const workflowInitialStages = useMemo<WorkflowStage[] | undefined>(() => {
    const saved = localStorage.getItem(workflowStorageKey);
    if (saved) {
      try { return JSON.parse(saved) as WorkflowStage[]; } catch { /* ignore */ }
    }
    if (categoryOrder.length === 0) return undefined;
    const palette = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'];
    return categoryOrder.map((name, i) => ({ id: `cat_${i}`, name, color: palette[i % palette.length], order: i + 1 }));
  }, [categoryOrder, workflowStorageKey]);

  const handleWorkflowSave = (stages: WorkflowStage[], renames: { old: string; new: string }[], removed: string[] = []) => {
    if (!readOnly) {
      renames.forEach(({ old, new: next }) => {
        if (!next || old === next) return;
        tasks.filter(t => (t.category || 'KHÁC') === old).forEach(t => handleUpdateTask(t.id, { category: next }));
      });
    }
    setCategoryOrder(stages.map(s => s.name));
    if (!readOnly) {
      // Giai đoạn nào bị xóa hẳn (không phải đổi tên) mà vẫn còn việc — hỏi chuyển đi đâu
      // thay vì để rơi âm thầm vào nhóm "KHÁC" ở cuối bảng.
      const renamedFrom = new Set(renames.map(r => r.old));
      const affected = removed
        .filter(name => !renamedFrom.has(name))
        .map(from => ({ from, count: tasks.filter(t => (t.category || 'KHÁC') === from).length }))
        .filter(o => o.count > 0);
      if (affected.length > 0) {
        setReassignTargets(Object.fromEntries(affected.map(a => [a.from, stages[0]?.name || 'KHÁC'])));
        setPendingReassign(affected);
      }
    }
  };

  const confirmReassign = () => {
    if (!pendingReassign) return;
    pendingReassign.forEach(({ from }) => {
      const target = reassignTargets[from];
      if (!target) return;
      tasks.filter(t => (t.category || 'KHÁC') === from).forEach(t => handleUpdateTask(t.id, { category: target }));
    });
    setPendingReassign(null);
  };

  // "Tạo thủ công theo Flow đề xuất": nếu tiến độ đang trống thì mở Workflow luôn; nếu đã có
  // việc, đây là hành động TẠO MỚI TỪ ĐẦU nên phải xóa sạch việc cũ trước (xác nhận rõ ràng,
  // không hoàn tác được) rồi mới mở Workflow với flow đề xuất mặc định.
  const handleStartFreshWorkflow = async () => {
    setShowCreateMenu(false);
    if (tasks.length === 0) { setLocalWorkflowOpen(true); return; }
    const ok = window.confirm(
      `Thao tác này sẽ XÓA TOÀN BỘ ${tasks.length} công việc hiện tại của tiến độ này và tạo lại từ đầu theo flow mới. Không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?`
    );
    if (!ok) return;
    const idsToDelete = tasks.filter(t => !t.id.startsWith('temp-')).map(t => t.id);
    tempTasksRef.current = [];
    pendingEditsRef.current = {};
    idsToDelete.forEach(id => locallyDeletedIdsRef.current.add(id));
    setDisplayTasks([]);
    setHasUnsaved(false);
    if (idsToDelete.length > 0) {
      await supabase.from('construction_tasks').delete().in('id', idsToDelete);
    }
    localStorage.removeItem(workflowStorageKey);
    setCategoryOrder([]);
    setLocalWorkflowOpen(true);
  };

  // Defined once so it can render from the loading/empty early-returns below too
  // — a brand-new project with 0 tasks still needs to be able to open Workflow
  // and pick the suggested flow before any task exists.
  const workflowModal = !readOnly && (
    <WorkflowManager
      isOpen={!!isWorkflowOpen || localWorkflowOpen}
      onClose={() => { onCloseWorkflow?.(); setLocalWorkflowOpen(false); }}
      onSave={handleWorkflowSave}
      initialStages={workflowInitialStages}
      storageKey={workflowStorageKey}
    />
  );

  const handleUpdateTask = (id: string, updates: Partial<CTask>) => {
    // Record in ref first (ref is always current in closures/effects)
    if (!id.startsWith('temp-')) {
      pendingEditsRef.current[id] = { ...pendingEditsRef.current[id], ...updates };
    } else {
      // Update temp task in tempTasksRef
      tempTasksRef.current = tempTasksRef.current.map(t =>
        t.id === id ? { ...t, ...updates } : t
      );
    }
    setDisplayTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    setHasUnsaved(true);
    // Propagate status/progress/checklist to parent immediately (Kanban sync)
    // but NOT schedule/name edits (those save in bulk via Lưu Lịch Hình)
    const isScheduleEdit = 'plannedStart' in updates || 'plannedEnd' in updates ||
      'startDate' in updates || 'endDate' in updates || 'duration' in updates ||
      'days' in updates || 'name' in updates;
    if (!isScheduleEdit && onUpdateTask) onUpdateTask(id, updates);
  };

  const handleDeleteTask = async (id: string) => {
    if (readOnly || !projectId) return;
    const isTemp = id.startsWith('temp-');
    delete pendingEditsRef.current[id];
    tempTasksRef.current = tempTasksRef.current.filter(t => t.id !== id);
    if (!isTemp) locallyDeletedIdsRef.current.add(id);
    setDisplayTasks(prev => prev.filter(t => t.id !== id));
    setHasUnsaved(true);
    if (!isTemp) {
      await supabase.from('construction_tasks').delete().eq('id', id);
    }
  };

  const handleCreateTask = (category: string) => {
    if (readOnly || !projectId) return;
    const newId = `temp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
    // Ngày bắt đầu mặc định lấy theo ngày bắt đầu của DỰ ÁN (không phải ngày hôm nay ngoài đời)
    // — tránh việc thêm việc luôn rơi ra ngoài khoảng thời gian dự án khi tạo tiến độ thủ công
    // cho 1 dự án có ngày bắt đầu ở quá khứ/tương lai xa. Vẫn chỉnh sửa được ngay sau đó.
    const defaultStart = project?.startDate || format(new Date(), 'yyyy-MM-dd');
    const newTask: CTask = {
      id: newId,
      name: 'Công việc mới...',
      category,
      status: 'TODO',
      subcontractor: '',
      days: 1, duration: 1,
      budget: 0, spent: 0,
      approved: false, dependencies: [], tags: [], issues: [], checklist: [], progress: 0,
      startDate: defaultStart,
      plannedStart: defaultStart,
    };
    tempTasksRef.current = [...tempTasksRef.current, newTask];
    setDisplayTasks(prev => [...prev, newTask]);
    setHasUnsaved(true);
    setJustCreatedId(newId);
  };

  const handleSaveDates = async () => {
    if (!projectId || !tasks.length || readOnly) return;
    setSaving(true);
    // Separate new temp tasks from existing ones
    const existingTasks = tasks.filter(t => !t.id.startsWith('temp-'));
    const newTasks = tasks.filter(t => t.id.startsWith('temp-'));

    let saveError: string | null = null;

    // Upsert existing tasks — CHỈ dùng cột thật sự tồn tại trong construction_tasks.
    // "duration"/"planned_start"/"planned_end" KHÔNG phải cột thật (chỉ là field UI nội bộ,
    // luôn được suy từ start_date/end_date/days khi tải lại) — gửi lên sẽ bị PostgREST từ
    // chối cả request (400 "Could not find the 'duration' column..."), khiến MỌI lần lưu đều
    // lỗi âm thầm và tasks mới không bao giờ thực sự được ghi xuống Supabase.
    if (existingTasks.length > 0) {
      const upserts = existingTasks.map(t => ({
        id: t.id, project_id: projectId,
        name: t.name,
        start_date: t.startDate || t.plannedStart,
        end_date: t.endDate || t.plannedEnd,
        days: t.days || t.duration || 1,
      }));
      const { error } = await supabase.from('construction_tasks').upsert(upserts, { onConflict: 'id' });
      if (error) saveError = error.message;
    }

    // Insert new temp tasks — điền đủ các cột NOT NULL (dependencies/tags/issues/approved/
    // subcontractor/spent) giống hệt createTimelineTasks/createProjectStructure đang dùng,
    // tránh lỗi NOT NULL constraint khi thiếu cột.
    for (const t of newTasks) {
      const { data, error } = await supabase.from('construction_tasks').insert({
        project_id: projectId,
        name: t.name, category: t.category, status: t.status,
        start_date: t.startDate || t.plannedStart,
        end_date: t.endDate || t.plannedEnd,
        days: t.days || t.duration || 1,
        budget: t.budget || 0, spent: t.spent || 0, progress: t.progress || 0,
        checklist: t.checklist || [], dependencies: t.dependencies || [],
        tags: t.tags || [], issues: t.issues || [], approved: t.approved || false,
        subcontractor: t.subcontractor || '',
      }).select().single();
      if (error) { saveError = error.message; continue; }
      // Replace temp ID with real DB ID
      if (data) {
        setDisplayTasks(prev => prev.map(lt => lt.id === t.id ? { ...lt, id: data.id } : lt));
      }
    }

    setSaving(false);

    if (!saveError) {
      // Clear pending edit refs
      pendingEditsRef.current = {};
      tempTasksRef.current = [];
      // Sync all changes back to parent (for Kanban, Dashboard to reflect)
      if (onUpdateTask) {
        tasks.filter(t => !t.id.startsWith('temp-')).forEach(t => onUpdateTask(t.id, t));
      }
      setHasUnsaved(false);
      setSaveMsg(`✓ Đã lưu ${tasks.length} hạng mục`);
      setTimeout(() => setSaveMsg(''), 3000);
    } else {
      setSaveMsg('⚠ Lỗi lưu: ' + saveError);
      setTimeout(() => setSaveMsg(''), 4000);
    }
  };

  // Tự động lưu sau khi ngừng sửa ~1.2s — người dùng không còn phải nhớ bấm "Lưu Lịch Hình"
  // mỗi lần thêm/sửa; nút Lưu vẫn còn để ép lưu ngay nếu muốn (tự ẩn khi không còn gì chờ lưu).
  useEffect(() => {
    if (!hasUnsaved || readOnly || saving) return;
    const timer = setTimeout(() => { handleSaveDates(); }, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnsaved, tasks, readOnly, saving]);

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

  if (!tasks.length && categoryOrder.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="w-12 h-12 text-slate-200" />
      <div className="text-center">
        <p className="font-bold text-slate-600">Chưa có dữ liệu tiến độ</p>
        <p className="text-sm text-slate-500 mt-1">
          {readOnly
            ? 'Nhà thầu chưa nhập timeline thi công'
            : 'Nhập báo giá / PDF để AI tạo tiến độ tự động, hoặc tự tạo thủ công theo flow đề xuất'}
        </p>
      </div>
      {!readOnly && (
        <div className="relative">
          <button onClick={() => setShowCreateMenu(v => !v)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-colors shadow-md">
            <Plus className="w-4 h-4" />
            Tạo mới tiến độ
          </button>
          {showCreateMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowCreateMenu(false)} />
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 text-sm text-left">
                {onOpenImport && (
                  <button onClick={() => { setShowCreateMenu(false); onOpenImport(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 text-slate-700">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-500" /> Import AI (Excel / PDF)
                  </button>
                )}
                <button onClick={handleStartFreshWorkflow}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 text-slate-700">
                  🔄 Tạo thủ công theo Flow đề xuất
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {workflowModal}
    </div>
  );

  return (
    <div className="p-3 sm:p-5 space-y-4 print:p-0 print:m-0 print:absolute print:left-0 print:top-0 print:w-[130vw] print:bg-white print:z-[9999]" style={{"-webkit-print-color-adjust": "exact", "print-color-adjust": "exact"} as React.CSSProperties}>
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body * { visibility: hidden; }
          .print\\:absolute, .print\\:absolute * { visibility: visible; }
          /* Hide scrollbars during print */
          .overflow-auto { overflow: visible !important; }
          .max-h-[70vh] { max-height: none !important; }
        }
      `}</style>
      
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-3 print:mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 print:text-2xl print:text-center print:w-full">TIẾN ĐỘ THI CÔNG - DỰ ÁN</h2>
          <p className="text-xs text-slate-500 mt-0.5 print:mt-2 text-center">
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
          {/* Import / Create new */}
          {!readOnly && (
            <div className="relative">
              <button onClick={() => setShowCreateMenu(v => !v)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                + Tạo Mới Tiến Độ
              </button>
              {showCreateMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCreateMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 text-sm text-left">
                    {onOpenImport && (
                      <button onClick={() => { setShowCreateMenu(false); onOpenImport(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 text-slate-700">
                        <FileSpreadsheet className="w-4 h-4 text-indigo-500" /> Import AI (Excel / PDF)
                      </button>
                    )}
                    <button onClick={handleStartFreshWorkflow}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 text-slate-700">
                      🔄 Tạo thủ công theo Flow đề xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {/* Save button — shown whenever there are unsaved changes */}
          {!readOnly && hasUnsaved && (
            <button onClick={handleSaveDates} disabled={saving}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm">
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Đang lưu...' : 'Lưu Lịch Hình'}
            </button>
          )}
        </div>
      </div>

      {/* Overall progress */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-4 print:hidden">
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
      <div ref={ganttRef} className="overflow-x-auto rounded-xl print:overflow-visible print:border-none">
        <ConstructionGantt
          tasks={tasks}
          selectedId={selectedId}
          onSelect={id => setSelectedId(id)}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onCreateTask={handleCreateTask}          onReorderTasks={reordered => setDisplayTasks(reordered)}
          readOnly={readOnly}
          justCreatedId={justCreatedId}
          onClearJustCreated={() => setJustCreatedId(null)}
          categoryOrder={categoryOrder}
          projectStartDate={project?.startDate}
          projectEndDate={project?.handoverDate}
          onUpdateProjectDates={(start, end) => {
            if (projectId && onUpdateProject) {
              const updates: { start_date?: string; handover_date?: string } = {};
              if (start !== undefined) updates.start_date = start;
              if (end !== undefined) updates.handover_date = end;
              if (Object.keys(updates).length > 0) {
                onUpdateProject(projectId, updates);
              }
            }
          }}
        />
      </div>
      {!readOnly && (
        <p className="text-[10px] text-slate-400 text-center print:hidden">
          Click vào hàng để xem checklist nghiệm thu · Chỉnh trực tiếp ngày bắt đầu và số ngày trên bảng
        </p>
      )}

      {/* Detail popup — fixed overlay so the Gantt table underneath never moves or scrolls */}
      {selectedTask && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedId(null)} />
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            <TaskDetailPanel
              task={selectedTask}
              onUpdate={updates => handleUpdateTask(selectedTask.id, updates)}
              onClose={() => setSelectedId(null)}
              readOnly={readOnly}
            />
          </div>
        </div>
      )}

      {/* Workflow (flow of hạng mục lớn — A, B, C ...) editor */}
      {workflowModal}

      {/* Chuyển việc của giai đoạn vừa bị xóa khỏi Workflow sang giai đoạn khác */}
      {pendingReassign && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={() => setPendingReassign(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-800 mb-1">Chuyển công việc sang giai đoạn khác</h3>
            <p className="text-xs text-slate-500 mb-4">Các giai đoạn sau đã bị xóa khỏi Workflow nhưng vẫn còn công việc bên trong — chọn giai đoạn mới cho từng nhóm trước khi tiếp tục.</p>
            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto">
              {pendingReassign.map(({ from, count }) => (
                <div key={from} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{from}</p>
                    <p className="text-[11px] text-slate-400">{count} công việc</p>
                  </div>
                  <select value={reassignTargets[from] || ''} onChange={e => setReassignTargets(prev => ({ ...prev, [from]: e.target.value }))}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs shrink-0">
                    {categoryOrder.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setPendingReassign(null)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Để nguyên (giữ nhóm KHÁC)</button>
              <button onClick={confirmReassign} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg">Xác nhận chuyển</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
