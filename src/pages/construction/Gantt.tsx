import React, { useState, useMemo, useEffect, useRef, forwardRef, memo } from 'react';
import { parseISO, format, addDays, differenceInDays, startOfDay, min, max } from 'date-fns';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import type { CTask, TaskStatus } from './types';
import { getTaskStart, getTaskEnd, getDateRange, getDaysBetween, parseDate, STATUS_META } from './ProjectManagement';

const TaskNameInput = ({ task, onUpdate, onEnter, onArrowDown, onArrowUp }: { 
  task: CTask; 
  onUpdate: (val: string) => void;
  onEnter: () => void;
  onArrowDown: () => void;
  onArrowUp: () => void;
}) => {
  const [val, setVal] = useState(task.name);
  useEffect(() => setVal(task.name), [task.name]);
  
  return (
    <input 
      id={`task-name-${task.id}`}
      type="text" 
      className="w-full h-8 text-slate-800 bg-transparent outline-none hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-indigo-300 rounded px-1 -ml-1" 
      value={val} 
      onChange={e => setVal(e.target.value)} 
      onBlur={() => onUpdate(val)}
      onClick={e => e.stopPropagation()}
      onDoubleClick={e => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onUpdate(val);
          onEnter();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          onUpdate(val);
          onArrowDown();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          onUpdate(val);
          onArrowUp();
        }
      }}
    />
  );
};

const TaskDateInput = ({ task, isSlipped, handleStartChange }: {
  task: CTask;
  isSlipped: boolean | null;
  handleStartChange: (task: CTask, val: string) => void;
}) => {
  const ts = getTaskStart(task);
  const [val, setVal] = useState(ts ? format(ts, 'dd/MM/yy') : '');

  useEffect(() => {
    setVal(ts ? format(ts, 'dd/MM/yy') : '');
  }, [ts?.getTime()]);

  const update = () => {
    const parsed = parseDate(val);
    if (parsed) {
      const formatted = format(parsed, 'yyyy-MM-dd');
      handleStartChange(task, formatted);
      setVal(format(parsed, 'dd/MM/yy'));
    } else {
      setVal(ts ? format(ts, 'dd/MM/yy') : ''); // revert if invalid
    }
  };

  return (
    <input 
      type="text" 
      placeholder="dd/MM/yy"
      className={`w-full h-9 text-center bg-transparent outline-none ${isSlipped ? 'text-red-600 font-bold hover:bg-red-100 focus:bg-red-100' : 'text-slate-700 hover:bg-indigo-50 focus:bg-indigo-50'}`} 
      value={val} 
      onChange={e => setVal(e.target.value)} 
      onBlur={update}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onClick={e => e.stopPropagation()} 
      onPaste={e => {
        const text = e.clipboardData.getData('text');
        const parsed = parseDate(text);
        if (parsed) {
          e.preventDefault();
          handleStartChange(task, format(parsed, 'yyyy-MM-dd'));
        }
      }}
    />
  );
};

const TaskEndDateInput = ({ task, isSlipped, handleEndChange }: {
  task: CTask;
  isSlipped: boolean | null;
  handleEndChange: (task: CTask, val: string) => void;
}) => {
  const te = getTaskEnd(task);
  const [val, setVal] = useState(te ? format(te, 'dd/MM/yy') : '');

  useEffect(() => {
    setVal(te ? format(te, 'dd/MM/yy') : '');
  }, [te?.getTime()]);

  const update = () => {
    const parsed = parseDate(val);
    if (parsed) {
      const formatted = format(parsed, 'yyyy-MM-dd');
      handleEndChange(task, formatted);
      setVal(format(parsed, 'dd/MM/yy'));
    } else {
      setVal(te ? format(te, 'dd/MM/yy') : ''); // revert if invalid
    }
  };

  return (
    <input 
      type="text" 
      placeholder="dd/MM/yy"
      className={`w-full h-9 text-center bg-transparent outline-none ${isSlipped ? 'text-red-600 font-bold hover:bg-red-100 focus:bg-red-100' : 'text-slate-700 hover:bg-indigo-50 focus:bg-indigo-50'}`} 
      value={val} 
      onChange={e => setVal(e.target.value)} 
      onBlur={update}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onClick={e => e.stopPropagation()} 
      onPaste={e => {
        const text = e.clipboardData.getData('text');
        const parsed = parseDate(text);
        if (parsed) {
          e.preventDefault();
          handleEndChange(task, format(parsed, 'yyyy-MM-dd'));
        }
      }}
    />
  );
};

const TaskDurationInput = ({ task, dur, isSlipped, handleDurChange }: {
  task: CTask;
  dur: number;
  isSlipped: boolean | null;
  handleDurChange: (task: CTask, val: string) => void;
}) => {
  const [val, setVal] = useState(dur ? dur.toString() : '');

  useEffect(() => {
    setVal(dur ? dur.toString() : '');
  }, [dur]);

  const update = (newVal: string) => {
    setVal(newVal);
    if (newVal !== dur.toString()) {
      handleDurChange(task, newVal);
    }
  };

  return (
    <input 
      type="number" 
      className={`w-full h-9 text-center bg-transparent outline-none cursor-pointer ${isSlipped ? 'text-red-600 font-bold hover:bg-red-100 focus:bg-red-100' : 'text-slate-700 hover:bg-indigo-50 focus:bg-indigo-50'}`} 
      value={val} min={1} 
      onChange={e => update(e.target.value)} 
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onClick={e => e.stopPropagation()} 
    />
  );
};

export const ConstructionGantt = forwardRef(function ConstructionGantt(props: {
  tasks: CTask[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDoubleClick?: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<CTask>) => void;
  onDeleteTask?: (id: string) => void;
  onCreateTask?: (category: string, insertAfterId?: string) => string | void;
  onReorderTasks?: (reordered: CTask[]) => void;
  readOnly?: boolean;
  workflowStages?: { name: string }[];
  projectStartDate?: string;
  projectEndDate?: string;
  onUpdateProjectDates?: (start: string, end: string) => void;
}, ref: React.Ref<HTMLDivElement>) {
  const {
    tasks, selectedId, onSelect, onDoubleClick, onUpdateTask, onDeleteTask, onCreateTask, onReorderTasks, readOnly, workflowStages, projectStartDate, projectEndDate, onUpdateProjectDates
  } = props;
  const { min: tasksMin, max: tasksMax } = useMemo(() => getDateRange(tasks), [tasks]);
  
  const min = useMemo(() => {
    let m = tasksMin;
    if (projectStartDate) {
      const ps = parseDate(projectStartDate);
      if (ps && ps < m) m = ps;
    }
    return m;
  }, [tasksMin, projectStartDate]);

  const max = useMemo(() => {
    let m = tasksMax;
    if (projectEndDate) {
      const pe = parseDate(projectEndDate);
      if (pe && pe > m) m = pe;
    }
    return m;
  }, [tasksMax, projectEndDate]);
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

  const grouped = useMemo(() => {
    const acc: Record<string, CTask[]> = {};
    if (workflowStages && workflowStages.length > 0) {
      workflowStages.forEach(s => {
        acc[s.name.toUpperCase()] = [];
      });
    }
    
    tasks.forEach(t => {
      const cat = (t.category || 'KHÁC').toUpperCase();
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(t);
    });
    return acc;
  }, [tasks, workflowStages]);

  const handleStartChange = (task: CTask, val: string) => {
    if (readOnly) return;
    const ns = parseDate(val);
    if (!ns) return;
    const os = getTaskStart(task);
    const oe = getTaskEnd(task);
    const dur = os && oe ? differenceInDays(oe, os) : (task.duration || task.days || 7) - 1;
    const ne = addDays(ns, dur);
    onUpdateTask(task.id, {
      startDate: format(ns, 'yyyy-MM-dd'),
      plannedStart: format(ns, 'yyyy-MM-dd'),
      endDate: format(ne, 'yyyy-MM-dd'),
      plannedEnd: format(ne, 'yyyy-MM-dd'),
    });
  };

  const handleEndChange = (task: CTask, val: string) => {
    if (readOnly) return;
    const ne = parseDate(val);
    if (!ne) return;
    const s = getTaskStart(task) || new Date();
    
    let finalS = s;
    let finalE = ne;
    if (ne < s) {
      finalS = ne; 
    }
    const d = differenceInDays(finalE, finalS) + 1;
    
    onUpdateTask(task.id, {
      duration: d, days: d,
      startDate: format(finalS, 'yyyy-MM-dd'),
      plannedStart: format(finalS, 'yyyy-MM-dd'),
      endDate: format(finalE, 'yyyy-MM-dd'),
      plannedEnd: format(finalE, 'yyyy-MM-dd'),
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
      endDate: format(ne, 'yyyy-MM-dd'),
      plannedEnd: format(ne, 'yyyy-MM-dd'),
    });
  };

  const masterTask: CTask = useMemo(() => {
    const s = projectStartDate ? parseDate(projectStartDate) || new Date() : new Date();
    let e = projectEndDate ? parseDate(projectEndDate) || addDays(s, 44) : addDays(s, 44);
    if (e < s) e = s;
    return {
      id: 'master-project-timeline',
      name: 'TIẾN ĐỘ THI CÔNG',
      category: '',
      startDate: format(s, 'yyyy-MM-dd'),
      plannedStart: format(s, 'yyyy-MM-dd'),
      endDate: format(e, 'yyyy-MM-dd'),
      plannedEnd: format(e, 'yyyy-MM-dd'),
      status: 'pending',
      progress: 0,
      projectId: '',
      createdAt: '',
      updatedAt: '',
      dependsOn: [],
      days: differenceInDays(e, s) + 1,
      duration: differenceInDays(e, s) + 1
    };
  }, [projectStartDate, projectEndDate]);

  const handleMasterStartChange = (task: CTask, val: string) => {
    if (onUpdateProjectDates) {
      onUpdateProjectDates(val, task.endDate || val);
    }
  };
  const handleMasterEndChange = (task: CTask, val: string) => {
    if (onUpdateProjectDates) {
      onUpdateProjectDates(task.startDate || val, val);
    }
  };
  const handleMasterDurChange = (task: CTask, val: string) => {
    if (onUpdateProjectDates) {
      const dur = parseInt(val, 10);
      if (!isNaN(dur) && dur >= 1) {
         const s = parseDate(task.startDate) || new Date();
         const newEnd = addDays(s, dur - 1);
         onUpdateProjectDates(task.startDate || '', format(newEnd, 'yyyy-MM-dd'));
      }
    }
  };


  const todayDate = startOfDay(new Date());
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  
  // States for dragging Gantt bars to change dates
  const [dragTaskForDate, setDragTaskForDate] = useState<CTask | null>(null);
  const [dragStartDay, setDragStartDay] = useState<Date | null>(null);
  
  // States for resizing duration
  const [resizeTaskForDur, setResizeTaskForDur] = useState<CTask | null>(null);
  const [resizeStartDay, setResizeStartDay] = useState<Date | null>(null);

  // Auto focus new tasks
  const [focusNewId, setFocusNewId] = useState<string | null>(null);

  useEffect(() => {
    if (focusNewId) {
      const el = document.getElementById(`task-name-${focusNewId}`);
      if (el) {
        el.focus();
        setFocusNewId(null);
      }
    }
  }, [focusNewId, tasks]);

  const handleDrop = (targetTaskId: string) => {
    if (!dragId || dragId === targetTaskId || !onReorderTasks) return;
    const flatTasks = Object.values(grouped).flat();
    const from = flatTasks.findIndex(t => t.id === dragId);
    const to = flatTasks.findIndex(t => t.id === targetTaskId);
    if (from === -1 || to === -1) return;
    const reordered = [...flatTasks];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    onReorderTasks(reordered);
    setDragId(null);
    setDragOverId(null);
  };

  const handleDropDate = (day: Date) => {
    if (dragTaskForDate && dragStartDay) {
      const diff = differenceInDays(day, dragStartDay);
      if (diff !== 0) {
        const oldStart = getTaskStart(dragTaskForDate);
        if (oldStart) {
          const newStart = addDays(oldStart, diff);
          handleStartChange(dragTaskForDate, format(newStart, 'yyyy-MM-dd'));
        }
      }
      setDragTaskForDate(null);
      setDragStartDay(null);
    } else if (resizeTaskForDur && resizeStartDay) {
      const diff = differenceInDays(day, resizeStartDay);
      if (diff !== 0) {
        const oldDur = resizeTaskForDur.duration || resizeTaskForDur.days || 1;
        const newDur = Math.max(1, oldDur + diff);
        handleDurChange(resizeTaskForDur, newDur.toString());
      }
      setResizeTaskForDur(null);
      setResizeStartDay(null);
    }
  };

  let stt = 0;

  // Column layout constants (px)
  const CW = { stt: 32, name: 244, start: 76, dur: 40, end: 76, prog: 44, action: readOnly ? 0 : 30 };
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

  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ─── Mobile Card List View ───────────────────────────────────────────────
  if (isMobile) {
    let mobileStt = 0;
    return (
      <div className="w-full space-y-3">
        {/* Master timeline summary card */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Tiến độ tổng thể</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              {masterTask.startDate ? format(parseDate(masterTask.startDate) || new Date(), 'dd/MM/yyyy') : '--'}
              {' → '}
              {masterTask.endDate ? format(parseDate(masterTask.endDate) || new Date(), 'dd/MM/yyyy') : '--'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-emerald-700">{masterTask.duration} ngày</p>
          </div>
        </div>

        {/* Category groups */}
        {Object.keys(grouped).map((cat, ci) => {
          const catTasks = grouped[cat];
          return (
            <div key={cat} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {/* Category header */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-700 text-white">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0">
                    {String.fromCharCode(65 + ci)}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wide">{cat}</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{catTasks.length}</span>
                </div>
                {!readOnly && onCreateTask && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onCreateTask(cat); }}
                    className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-lg text-[10px] font-bold transition-colors"
                  >
                    <Plus size={11} /> Thêm
                  </button>
                )}
              </div>

              {/* Task cards */}
              <div className="divide-y divide-slate-100">
                {catTasks.map((task: CTask) => {
                  mobileStt++;
                  const ts = getTaskStart(task);
                  const te = getTaskEnd(task);
                  const dur = ts && te ? differenceInDays(te, ts) + 1 : task.duration || task.days || 0;
                  const plannedEnd = task.plannedEnd ? parseISO(task.plannedEnd) : null;
                  const isSlipped = !!(te && plannedEnd && startOfDay(te) > startOfDay(plannedEnd));
                  const isOverdue = task.status !== 'DONE' && te && startOfDay(te) < todayDate;
                  const barColor = isOverdue ? 'bg-red-400' : isSlipped ? 'bg-orange-400' : STATUS_META[task.status]?.bar ? '' : 'bg-slate-300';
                  const statusMeta = STATUS_META[task.status];
                  const isSelected = selectedId === task.id;

                  // Calculate progress toward today
                  const totalDays = ts && te ? differenceInDays(te, ts) : 0;
                  const daysElapsed = ts ? Math.max(0, Math.min(totalDays, differenceInDays(todayDate, ts))) : 0;
                  const autoProgress = totalDays > 0 ? Math.round((daysElapsed / totalDays) * 100) : 0;
                  const displayProgress = task.progress ?? autoProgress;

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelect(task.id)}
                      onDoubleClick={() => onDoubleClick && onDoubleClick(task.id)}
                      className={`px-3 py-2.5 cursor-pointer transition-colors active:bg-slate-50 ${isSelected ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}
                    >
                      {/* Row 1: STT + Status dot + Name + Status badge */}
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] text-slate-400 font-bold w-5 shrink-0 pt-0.5 text-right">{mobileStt}</span>
                        <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${statusMeta?.dot || 'bg-slate-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium leading-snug ${isSlipped ? 'text-red-700' : isOverdue ? 'text-red-600' : 'text-slate-800'}`}>
                              {task.name || 'Công việc mới...'}
                            </p>
                            {statusMeta && (
                              <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${statusMeta.dot?.replace('bg-', 'bg-').replace('500', '100')} text-slate-600`}>
                                {statusMeta.label || task.status}
                              </span>
                            )}
                          </div>

                          {/* Row 2: Dates + duration */}
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            {ts ? (
                              <span className={isSlipped ? 'text-red-500 font-bold' : ''}>
                                {format(ts, 'dd/MM')} → {te ? format(te, 'dd/MM/yy') : '--'}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Chưa đặt ngày</span>
                            )}
                            {dur > 0 && (
                              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                {dur}d
                              </span>
                            )}
                            {isOverdue && (
                              <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">Trễ</span>
                            )}
                            {isSlipped && !isOverdue && (
                              <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">Lệch kế hoạch</span>
                            )}
                          </div>

                          {/* Row 3: Progress bar */}
                          {ts && te && (
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    task.status === 'DONE' ? 'bg-emerald-500' :
                                    isOverdue ? 'bg-red-400' :
                                    isSlipped ? 'bg-orange-400' : 'bg-indigo-500'
                                  }`}
                                  style={{ width: `${task.status === 'DONE' ? 100 : displayProgress}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold shrink-0">
                                {task.status === 'DONE' ? '100%' : `${displayProgress}%`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {catTasks.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4 italic">Chưa có công việc</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Mobile: compact column widths (hide BĐ, NGÀY, KT, %, Action)
  const DAY_W = isMobile ? 22 : 30;
  const MCW = isMobile
    ? { stt: 28, name: 100, start: 0, dur: 0, end: 0, prog: 0, action: 0 }
    : CW;
  const MCL = isMobile
    ? { stt: 0, name: 28, start: 128, dur: 128, end: 128, prog: 128, action: 128 }
    : CL;
  const MOBILE_TOTAL_LEFT = isMobile ? 128 : TOTAL_LEFT;

  // ─── Gantt Table (both mobile compact + desktop full) ───────────────────
  return (
    <div className="w-full border border-slate-200 rounded-xl overflow-auto bg-white shadow-sm text-[11px]" style={{ maxHeight: isMobile ? '65vh' : '70vh' }}>
      <table className="border-collapse table-fixed" style={{ minWidth: `${MOBILE_TOTAL_LEFT + days.length * DAY_W}px` }}>
        <thead className="sticky top-0 z-40">
          {/* Row 1: Left headers (rowSpan=2) + Week headers */}
          <tr className="h-8 bg-slate-700 text-white">
            <th rowSpan={2} className="sticky z-50 bg-slate-700 border-r border-slate-600 text-center font-bold" style={{ left: MCL.stt, width: MCW.stt, minWidth: MCW.stt }}>STT</th>
            <th rowSpan={2} className="sticky z-50 bg-slate-700 border-r border-slate-600 text-left px-1.5 font-bold overflow-hidden" style={{ left: MCL.name, width: MCW.name, minWidth: MCW.name, boxShadow: isMobile ? '3px 0 6px -2px rgba(0,0,0,0.2)' : 'none' }}>{isMobile ? 'CÔNG VIỆC' : 'HẠNG MỤC / CÔNG VIỆC'}</th>
            {!isMobile && <th rowSpan={2} className="sticky z-50 bg-slate-700 border-r border-slate-600 text-center font-bold" style={{ left: MCL.start, width: MCW.start, minWidth: MCW.start }}>BẮT ĐẦU</th>}
            {!isMobile && <th rowSpan={2} className="sticky z-50 bg-slate-700 border-r border-slate-600 text-center font-bold" style={{ left: MCL.dur, width: MCW.dur, minWidth: MCW.dur }}>NGÀY</th>}
            {!isMobile && <th rowSpan={2} className="sticky z-50 bg-slate-700 border-r border-slate-600 text-center font-bold print:hidden" style={{ left: MCL.end, width: MCW.end, minWidth: MCW.end }}>KẾT THÚC</th>}
            {!isMobile && <th rowSpan={2} className="sticky z-50 bg-slate-700 border-r border-slate-600 text-center font-bold print:hidden" style={{ left: MCL.prog, width: MCW.prog, minWidth: MCW.prog, boxShadow: readOnly ? '3px 0 8px -2px rgba(0,0,0,0.15)' : 'none' }}>%</th>}
            {!isMobile && !readOnly && <th rowSpan={2} className="sticky z-50 bg-slate-700 text-center font-bold print:hidden" style={{ left: MCL.action, width: MCW.action, minWidth: MCW.action, boxShadow: '3px 0 8px -2px rgba(0,0,0,0.15)' }}></th>}
            {weeks.map((w, i) => (
              <th key={i} colSpan={w.count} className="border-r border-slate-600 text-center font-bold text-[9px] uppercase tracking-wide px-1">{isMobile ? w.label.replace(/Tuần \d+ /, '') : w.label}</th>
            ))}
          </tr>
          {/* Row 2: Day numbers (left cols filled by rowSpan) */}
          <tr className="h-7 bg-slate-50 text-slate-600">
            {days.map((day, i) => {
              const isSun = day.getDay() === 0;
              const isSat = day.getDay() === 6;
              const isToday = startOfDay(day).getTime() === todayDate.getTime();
              return (
                <th key={i} className={`border-r text-center font-normal relative
                  ${isToday ? 'bg-red-500 text-white border-red-500' : isSun ? 'bg-red-50 text-red-400 border-slate-200' : isSat ? 'bg-orange-50 text-orange-400 border-slate-200' : 'border-slate-200'}`}
                  style={{ width: DAY_W, minWidth: DAY_W }}>
                  <div className={isMobile ? 'text-[9px] font-bold' : 'text-[10px] font-bold'}>{day.getDate()}</div>
                  {!isMobile && <div className="text-[8px] opacity-80">{['CN','T2','T3','T4','T5','T6','T7'][day.getDay()]}</div>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {/* Master Project Timeline */}
          <tr className="h-9 bg-emerald-100/50 border-b border-emerald-200">
            <td className="sticky z-30 bg-emerald-100/50 border-r border-emerald-200 text-center" style={{ left: MCL.stt, width: MCW.stt, minWidth: MCW.stt }}></td>
            <td className="sticky z-30 bg-emerald-100/50 border-r border-emerald-200 px-1.5 font-bold text-emerald-800 text-xs tracking-wide" style={{ left: MCL.name, width: MCW.name, minWidth: MCW.name, boxShadow: isMobile ? '3px 0 6px -2px rgba(0,0,0,0.15)' : 'none' }}>
              <span className="truncate block">{isMobile ? 'TỄỀN ĐỘ' : masterTask.name}</span>
              {isMobile && (
                <span className="text-[9px] text-emerald-600 font-normal">
                  {masterTask.startDate ? format(parseDate(masterTask.startDate) || new Date(), 'dd/MM') : '--'}
                  {' → '}
                  {masterTask.endDate ? format(parseDate(masterTask.endDate) || new Date(), 'dd/MM/yy') : '--'}
                </span>
              )}
            </td>
            {!isMobile && (
              <td className="sticky z-30 bg-emerald-100/50 border-r border-emerald-200 print:hidden" style={{ left: MCL.start, width: MCW.start, minWidth: MCW.start }}>
                {readOnly ? (
                   <div className="w-full h-9 flex items-center justify-center text-emerald-800">{masterTask.startDate ? format(parseDate(masterTask.startDate) || new Date(), 'dd/MM/yy') : ''}</div>
                ) : (
                   <TaskDateInput task={masterTask} isSlipped={false} handleStartChange={handleMasterStartChange} />
                )}
              </td>
            )}
            {!isMobile && (
              <td className="sticky z-30 bg-emerald-100/50 border-r border-emerald-200 print:hidden" style={{ left: MCL.dur, width: MCW.dur, minWidth: MCW.dur }}>
                {readOnly ? (
                   <div className="w-full h-9 flex items-center justify-center text-emerald-800">{masterTask.duration}</div>
                ) : (
                   <TaskDurationInput task={masterTask} dur={masterTask.duration} isSlipped={false} handleDurChange={handleMasterDurChange} />
                )}
              </td>
            )}
            {!isMobile && (
              <td className="sticky z-30 bg-emerald-100/50 border-r border-emerald-200 print:hidden" style={{ left: MCL.end, width: MCW.end, minWidth: MCW.end }}>
                {readOnly ? (
                   <div className="w-full h-9 flex items-center justify-center text-emerald-800">{masterTask.endDate ? format(parseDate(masterTask.endDate) || new Date(), 'dd/MM/yy') : ''}</div>
                ) : (
                   <TaskEndDateInput task={masterTask} isSlipped={false} handleEndChange={handleMasterEndChange} />
                )}
              </td>
            )}
            {!isMobile && (
              <td className="sticky z-30 bg-emerald-100/50 border-r border-emerald-200 text-center text-emerald-700 font-bold print:hidden" style={{ left: MCL.prog, width: MCW.prog, minWidth: MCW.prog, boxShadow: readOnly ? '3px 0 8px -2px rgba(0,0,0,0.15)' : 'none' }}>
                0%
              </td>
            )}
            {!isMobile && !readOnly && <td className="sticky z-30 bg-emerald-100/50 border-r border-emerald-200 print:hidden" style={{ left: MCL.action, width: MCW.action, minWidth: MCW.action, boxShadow: '3px 0 8px -2px rgba(0,0,0,0.15)' }}></td>}
            
            {days.map((day, i) => {
              const isToday = startOfDay(day).getTime() === todayDate.getTime();
              
              const mStart = getTaskStart(masterTask);
              const mEnd = getTaskEnd(masterTask);
              const isStart = mStart && startOfDay(day).getTime() === startOfDay(mStart).getTime();
              const isEnd = mEnd && startOfDay(day).getTime() === startOfDay(mEnd).getTime();
              const isBetween = mStart && mEnd && startOfDay(day) > startOfDay(mStart) && startOfDay(day) < startOfDay(mEnd);
              
              return (
                <td key={i} className={`border-r relative ${isToday ? 'border-red-400 bg-red-100/40' : 'border-emerald-200'} p-0 m-0`}>
                  {isToday && <div className="absolute inset-0 border-x-2 border-red-400/60 pointer-events-none z-10" />}
                  <div className="w-full h-full min-h-[36px] relative flex items-center py-2">
                    {(isStart || isBetween || isEnd) && (
                      <div 
                        className={`${isMobile ? 'h-2.5' : 'h-3'} bg-[#0284c7] absolute`}
                        style={{
                          left: isStart ? '3px' : '0',
                          right: isEnd ? '3px' : '0',
                          borderRadius: isStart && isEnd ? '4px' : isStart ? '4px 0 0 4px' : isEnd ? '0 4px 4px 0' : '0'
                        }}
                      />
                    )}
                  </div>
                </td>
              );
            })}
          </tr>
          {Object.keys(grouped).map((cat, ci) => {
            const catTasks = grouped[cat];
            return (
            <React.Fragment key={cat}>
              {/* Category header row */}
              <tr className="h-8 bg-slate-100">
                <td className="sticky z-30 bg-slate-100 border-r border-slate-200 text-center text-slate-600 font-bold" style={{ left: MCL.stt, width: MCW.stt, minWidth: MCW.stt }}>{String.fromCharCode(65 + ci)}</td>
                <td className="sticky z-30 bg-slate-100 px-1.5 text-slate-700 font-bold text-xs uppercase tracking-wide overflow-hidden" colSpan={1} style={{ left: MCL.name, width: MCW.name, minWidth: MCW.name, boxShadow: isMobile ? '3px 0 6px -2px rgba(0,0,0,0.08)' : '3px 0 8px -2px rgba(0,0,0,0.08)' }}>
                  <div className="flex justify-between items-center">
                    <span className="truncate">{cat}</span>
                    {!readOnly && onCreateTask && (
                      <button onClick={(e) => { e.stopPropagation(); onCreateTask(cat); }} className="print:hidden px-1.5 py-0.5 ml-1 bg-white border border-slate-200 rounded text-[9px] text-slate-600 hover:bg-slate-50 flex items-center gap-0.5 shrink-0">
                        <Plus size={9} /> Thêm
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
                stt++;
                return (
                  <TaskRow 
                    key={task.id}
                    task={task}
                    cat={cat}
                    stt={stt}
                    catTasks={catTasks}
                    days={days}
                    todayDate={todayDate}
                    dragId={dragId}
                    dragOverId={dragOverId}
                    selectedId={selectedId}
                    readOnly={readOnly}
                    onSelect={onSelect}
                    onDoubleClick={onDoubleClick}
                    handleDrop={handleDrop}
                    setDragId={setDragId}
                    setDragOverId={setDragOverId}
                    onUpdateTask={onUpdateTask}
                    onCreateTask={onCreateTask}
                    onDeleteTask={onDeleteTask}
                    setFocusNewId={setFocusNewId}
                    handleStartChange={handleStartChange}
                    handleEndChange={handleEndChange}
                    handleDurChange={handleDurChange}
                    setDragTaskForDate={setDragTaskForDate}
                    setDragStartDay={setDragStartDay}
                    setResizeTaskForDur={setResizeTaskForDur}
                    setResizeStartDay={setResizeStartDay}
                    dragTaskForDate={dragTaskForDate}
                    resizeTaskForDur={resizeTaskForDur}
                    handleDropDate={handleDropDate}
                    CL={MCL}
                    CW={MCW}
                    DAY_W={DAY_W}
                    isMobile={isMobile}
                  />
                );
              })}
            </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

const TaskRow = memo(({ 
  task, cat, stt, catTasks, days, todayDate,
  dragId, dragOverId, selectedId, readOnly,
  onSelect, onDoubleClick, handleDrop, setDragId, setDragOverId,
  onUpdateTask, onCreateTask, onDeleteTask, setFocusNewId,
  handleStartChange, handleEndChange, handleDurChange,
  setDragTaskForDate, setDragStartDay, setResizeTaskForDur, setResizeStartDay,
  dragTaskForDate, resizeTaskForDur, handleDropDate,
  CL, CW, DAY_W, isMobile
}: any) => {
  const ts = getTaskStart(task);
  const te = getTaskEnd(task);
  const plannedEnd = task.plannedEnd ? parseISO(task.plannedEnd) : null;
  const isSlipped = te && plannedEnd && startOfDay(te) > startOfDay(plannedEnd);
  const dur = ts && te ? differenceInDays(te, ts) + 1 : task.duration || task.days || 0;
  const sel = selectedId === task.id;
  const isOverdue = task.status !== 'DONE' && te && startOfDay(te) < todayDate;
  const barColor = isOverdue ? '#ef4444' : isSlipped ? '#f97316' : (STATUS_META[task.status]?.bar || '#94a3b8');
  const cellBg = sel ? 'bg-indigo-50' : isSlipped ? 'bg-red-50/70' : 'bg-white';

  return (
    <tr
      onDragOver={e => { e.preventDefault(); setDragOverId(task.id); }}
      onDragLeave={() => setDragOverId(null)}
      onDrop={() => handleDrop(task.id)}
      className={`group h-9 border-b border-slate-100 cursor-pointer transition-colors
        ${dragOverId === task.id ? 'border-t-2 border-t-indigo-400 bg-indigo-50/60' : ''}
        ${dragId === task.id ? 'opacity-40' : ''}
        ${sel ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
      onClick={() => onSelect(task.id)}
    >
      {/* STT */}
      <td 
        className={`sticky z-30 ${cellBg} group-hover:bg-slate-50 border-r border-slate-100 text-center text-slate-400`} 
        style={{ left: CL.stt }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick && onDoubleClick(task.id); }}
      >
        {stt}
      </td>
      {/* Name */}
      <td 
        className={`sticky z-30 ${cellBg} group-hover:bg-slate-50 border-r border-slate-100 px-1.5 overflow-hidden`} 
        style={{ left: CL.name, width: CW.name, minWidth: CW.name, boxShadow: isMobile ? '3px 0 6px -2px rgba(0,0,0,0.12)' : 'none' }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick && onDoubleClick(task.id); }}
      >
        <div className="flex items-center gap-1 min-w-0">
          {!readOnly && !isMobile && (
            <div 
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                setDragId(task.id);
              }}
              onDragEnd={() => { setDragId(null); setDragOverId(null); }}
              className="cursor-grab active:cursor-grabbing shrink-0"
            >
              <GripVertical size={12} className="text-slate-300 block" />
            </div>
          )}
          <span className={`w-1.5 h-1.5 rounded-full flex-none ${STATUS_META[task.status]?.dot || 'bg-slate-400'}`} />
          {readOnly || isMobile ? (
            <span className="truncate text-slate-800 text-[11px]" title={task.name}>{task.name || 'Công việc mới...'}</span>
          ) : (
            <TaskNameInput 
              task={task}
              onUpdate={(name) => {
                if (name !== task.name) onUpdateTask(task.id, { name });
              }}
              onEnter={() => {
                if (onCreateTask) {
                  const newId = onCreateTask(cat, task.id);
                  if (newId) setFocusNewId(newId);
                }
              }}
              onArrowDown={() => {
                const idx = catTasks.findIndex((t: CTask) => t.id === task.id);
                if (idx < catTasks.length - 1) document.getElementById(`task-name-${catTasks[idx+1].id}`)?.focus();
              }}
              onArrowUp={() => {
                const idx = catTasks.findIndex((t: CTask) => t.id === task.id);
                if (idx > 0) document.getElementById(`task-name-${catTasks[idx-1].id}`)?.focus();
              }}
            />
          )}
        </div>
      </td>
      {/* Start date - hidden on mobile */}
      {!isMobile && (
      <td className={`sticky z-30 ${cellBg} group-hover:bg-slate-50 border-r border-slate-100 p-0`} style={{ left: CL.start }}>
        {readOnly ? (
          <div className="w-full h-9 flex flex-col items-center justify-center">
            <div className={`text-[11px] ${isSlipped ? 'text-red-500 font-bold' : 'text-slate-600'}`}>{ts ? format(ts, 'dd/MM/yy') : '--'}</div>
            {task.category === 'MASTER' && task.plannedStart && task.plannedStart !== (ts ? format(ts, 'yyyy-MM-dd') : '') && (
              <div className="text-[8px] text-slate-400 line-through">{format(parseISO(task.plannedStart), 'dd/MM/yy')}</div>
            )}
          </div>
        ) : (
          <TaskDateInput 
            task={task} 
            isSlipped={isSlipped} 
            handleStartChange={handleStartChange} 
          />
        )}
      </td>
      )}
      {/* Duration - hidden on mobile */}
      {!isMobile && (
      <td className={`sticky z-30 ${cellBg} group-hover:bg-slate-50 border-r border-slate-100 p-0`} style={{ left: CL.dur }}>
        {readOnly ? (
          <div className="w-full h-9 flex flex-col items-center justify-center">
            <div className={`font-bold ${isSlipped ? 'text-red-500' : task.category === 'MASTER' ? 'text-emerald-600' : 'text-slate-600'}`}>{dur || '--'}</div>
            {task.category === 'MASTER' && (task as any)._plannedDur && (task as any)._plannedDur !== dur && (
              <div className="text-[8px] text-slate-400 line-through">{(task as any)._plannedDur}</div>
            )}
          </div>
        ) : (
          <TaskDurationInput 
            task={task}
            dur={dur}
            isSlipped={isSlipped}
            handleDurChange={handleDurChange}
          />
        )}
      </td>
      )}
      {/* End Date - hidden on mobile */}
      {!isMobile && (
      <td className={`sticky z-30 ${cellBg} group-hover:bg-slate-50 border-r border-slate-100 p-0 print:hidden`} style={{ left: CL.end }}>
        {readOnly ? (
          <div className="w-full h-9 flex flex-col items-center justify-center">
            <div className={`text-[11px] ${isSlipped ? 'text-red-500 font-bold' : 'text-slate-600'}`}>{te ? format(te, 'dd/MM/yy') : '--'}</div>
            {task.category === 'MASTER' && task.plannedEnd && task.plannedEnd !== (te ? format(te, 'yyyy-MM-dd') : '') && (
              <div className="text-[8px] text-slate-400 line-through">{format(parseISO(task.plannedEnd), 'dd/MM/yy')}</div>
            )}
          </div>
        ) : (
          <TaskEndDateInput 
            task={task} 
            isSlipped={isSlipped} 
            handleEndChange={handleEndChange} 
          />
        )}
      </td>
      )}
      {/* Progress % - hidden on mobile */}
      {!isMobile && (
      <td className={`sticky z-30 ${cellBg} group-hover:bg-slate-50 text-center border-r border-slate-100 p-0 print:hidden`} style={{ left: CL.prog, boxShadow: readOnly ? '3px 0 8px -2px rgba(0,0,0,0.08)' : 'none' }}>
        <div className={`font-bold flex items-center justify-center h-full text-[10px] ${task.progress === 100 ? 'text-emerald-600' : 'text-slate-600'}`}>{task.progress || 0}%</div>
      </td>
      )}
      {/* Delete Action - hidden on mobile */}
      {!isMobile && !readOnly && (
         <td className={`sticky z-30 ${cellBg} group-hover:bg-slate-50 text-center px-1 print:hidden`} style={{ left: CL.action, boxShadow: '3px 0 8px -2px rgba(0,0,0,0.08)' }}>
            <button onClick={(e) => { e.stopPropagation(); if(onDeleteTask) onDeleteTask(task.id); }} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded mx-auto transition-colors" title="Xóa công tác">
              <Trash2 size={12} />
            </button>
         </td>
      )}
      {/* Day columns */}
      {days.map((day: Date, i: number) => {
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
        const dw = DAY_W || 30;
        return (
          <td key={i} className={`border-r p-0 relative
            ${isToday ? 'border-red-400 bg-red-50/40' : 'border-slate-100'}
            ${!inRange && !isToday && (isSun || isSat) ? 'bg-red-50/20' : ''}`}
            style={{ minWidth: dw, width: dw }}
            onDragOver={(e) => {
              if (dragTaskForDate || resizeTaskForDur) e.preventDefault();
            }}
            onDrop={(e) => {
              if (dragTaskForDate || resizeTaskForDur) {
                e.preventDefault();
                e.stopPropagation();
                handleDropDate(day);
              }
            }}>
            {isToday && (
              <div className="absolute inset-0 border-x-2 border-red-400/60 pointer-events-none z-10" />
            )}
            {inRange && (
              <div className={`relative mx-px my-1.5 h-6 overflow-hidden ${!readOnly ? 'cursor-grab active:cursor-grabbing' : ''}`}
                draggable={!readOnly}
                onDragStart={(e) => {
                  if (!readOnly) {
                    e.stopPropagation();
                    setDragTaskForDate(task);
                    setDragStartDay(day);
                  }
                }}
                style={{
                  borderRadius: `${isFirst ? '12px' : '0'} ${isLast ? '12px' : '0'} ${isLast ? '12px' : '0'} ${isFirst ? '12px' : '0'}`,
                  backgroundColor: barColor,
                }}
              >
                {(task.progress || 0) > 0 && (
                  <div className="absolute left-0 top-0 h-full bg-white/25" style={{ width: `${task.progress}%` }} />
                )}
                {isLast && !readOnly && (
                  <div 
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.effectAllowed = 'move';
                      setResizeTaskForDur(task);
                      setResizeStartDay(dayStart);
                    }}
                    className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-black/20 z-20"
                  />
                )}
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
}, (prev, next) => {
  return prev.task === next.task &&
         prev.stt === next.stt &&
         prev.dragId === next.dragId &&
         prev.dragOverId === next.dragOverId &&
         prev.selectedId === next.selectedId &&
         prev.days === next.days;
});

export default ConstructionGantt;