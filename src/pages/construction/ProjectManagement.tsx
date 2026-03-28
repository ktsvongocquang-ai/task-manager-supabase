import React, { useState, useEffect } from 'react';
import { useProjectStore } from './store';
import { Bot, Clock, Activity, AlertTriangle, Users, Copy, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { motion } from 'motion/react';
import type { TaskStatus } from './types';

// ═══════════════════════════════════════════════════════════
// MODULE 2: INTERACTIVE GANTT CHART
// ═══════════════════════════════════════════════════════════
function DraggableGanttBar({ t, minDate, totalDays, onMove }: { t: any, minDate: Date, totalDays: number, onMove: (id: string, shiftDays: number) => void }) {
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  
  const startOffset = differenceInDays(parseISO(t.plannedStart!), minDate);
  const dur = t.duration || 1;
  const isExtra = t.isExtra;
  
  const baseLeft = (startOffset / totalDays) * 100;
  const currLeft = dragOffset !== null ? baseLeft + dragOffset : baseLeft;
  const width = (dur / totalDays) * 100;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const parentWidth = e.currentTarget.parentElement?.parentElement?.offsetWidth || 1; // get width of grid relative container
    const dayWidthPx = parentWidth / totalDays;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diffX = moveEvent.clientX - startX;
      setDragOffset((diffX / parentWidth) * 100);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      const diffX = upEvent.clientX - startX;
      const shiftDays = Math.round(diffX / dayWidthPx);
      setDragOffset(null);
      if (shiftDays !== 0) onMove(t.id, shiftDays);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-full shadow-sm flex items-center px-3 cursor-grab active:cursor-grabbing transition-colors ${
          isExtra ? 'bg-amber-500 text-white' : 'bg-[#1c3a8e] text-white hover:bg-indigo-900'
      }`}
      style={{ left: `${Math.max(0, currLeft)}%`, width: `${width}%`, zIndex: dragOffset !== null ? 50 : 10 }}
      onMouseDown={handleMouseDown}
    >
      <span className="text-xs font-bold truncate select-none drop-shadow-sm">{dur}d</span>
    </div>
  );
}

function InteractiveGantt() {
  const { tasks, updateTask } = useProjectStore();
  const macroTasks = tasks.filter(t => t.taskLevel === 'macro');

  if (macroTasks.length === 0) return <div className="p-8 text-center text-slate-500 bg-slate-50 border-y border-slate-200">Chưa tải dữ liệu PDF - Vui lòng Bóc tách dữ liệu AI</div>;

  const minDate = macroTasks.reduce((min, t) => {
    if (!t.plannedStart) return min;
    const d = parseISO(t.plannedStart);
    return d < min ? d : min;
  }, parseISO(macroTasks[0].plannedStart || new Date().toISOString()));
  
  const totalDays = 30; // Custom scaling can go here
  const daysGrid = Array.from({ length: totalDays }, (_, i) => addDays(minDate, i));

  const handleMove = (id: string, shiftDays: number) => {
    const t = macroTasks.find(x => x.id === id);
    if (!t || !t.plannedStart || !t.plannedEnd) return;
    updateTask(id, { 
      plannedStart: format(addDays(parseISO(t.plannedStart), shiftDays), 'yyyy-MM-dd'), 
      plannedEnd: format(addDays(parseISO(t.plannedEnd), shiftDays), 'yyyy-MM-dd') 
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-8">
      {/* Header Popup Bar matching Screenshot 3 */}
      <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-start pt-5">
        <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Điều Chỉnh Tiến Độ (Gantt)</h3>
            <p className="text-sm text-slate-500 mt-0.5 tracking-tight">Nhấn giữ 0.5s để di chuyển. Chạm để chỉnh sửa.</p>
        </div>
        <div className="bg-slate-100 text-slate-800 font-bold px-4 py-2 rounded-xl text-sm border border-slate-200 shadow-sm">
            Tổng: {macroTasks.reduce((acc, curr) => acc + (curr.duration || 0), 0)} Ngày
        </div>
      </div>
      
      <div className="flex bg-white overflow-x-auto min-h-[400px]">
        {/* Left Panel matching Screenshot 2 */}
        <div className="w-[450px] shrink-0 border-r border-slate-200 flex flex-col bg-white">
          <div className="h-14 border-b border-slate-100 flex items-center px-5 font-bold text-slate-800 tracking-tight text-sm">
            <div className="flex-1 uppercase tracking-widest text-xs font-black text-slate-700">Hạng Mục</div>
            <div className="w-12 text-right text-slate-400 text-xs">30/1</div>
          </div>
          {macroTasks.map(t => (
            <div key={t.id} className="h-[90px] border-b border-slate-50 flex items-center px-5 relative group">
              {/* Task info block */}
              <div className="flex-1 min-w-0 pr-12">
                <p className="text-[15px] font-bold text-slate-900 truncate mt-1">
                    {t.isExtra && <span className="mr-2 text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-sm align-middle tracking-wider shadow-sm">Phát sinh</span>}
                    {t.name}
                </p>
                <p className="text-sm text-slate-500 mt-1 truncate">{t.subcontractor || 'Chưa giao phó'}</p>
              </div>
              {/* Badge near the edge */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#1c3a8e] text-white font-bold rounded-l-full flex items-center justify-center text-sm shadow-md">
                 {t.duration}d
              </div>
            </div>
          ))}
        </div>
        
        {/* Interactive Grid Panel matching Screenshot 1 */}
        <div className="flex-1 min-w-[800px] relative flex flex-col">
          {/* Header Dates */}
          <div className="h-14 border-b border-slate-100 flex shadow-sm relative z-10 bg-white/80 backdrop-blur-sm">
            {daysGrid.map((d, i) => (
              <div key={i} className="flex-1 border-r border-slate-100 flex items-center justify-center font-bold text-slate-400 text-[15px] tracking-tight">
                {i % 5 === 0 ? format(d, 'd/M') : ''}
              </div>
            ))}
          </div>
          
          {/* Main Grid Area */}
          <div className="relative flex-1 bg-white">
            {/* Vertical Lines */}
            <div className="absolute inset-0 flex pointer-events-none">
                {daysGrid.map((_, i) => (
                    <div key={i} className="flex-1 border-r border-slate-100/60 h-full" />
                ))}
            </div>

            {/* Horizontal Rows */}
            <div className="absolute inset-0 flex flex-col pointer-events-none">
                {macroTasks.map((t) => (
                    <div key={t.id} className="h-[90px] border-b border-slate-50 w-full" />
                ))}
            </div>

            {/* Gantt Bars */}
            <div className="absolute inset-0 flex flex-col">
                {macroTasks.map((t, index) => {
                    if (!t.plannedStart || !t.plannedEnd) return <div key={t.id} className="h-[90px] w-full" />;
                    return (
                        <div key={t.id} className="h-[90px] relative w-full px-2">
                            <DraggableGanttBar t={t} minDate={minDate} totalDays={totalDays} onMove={handleMove} />
                        </div>
                    );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MODULE 3: REAL-TIME KANBAN
// ═══════════════════════════════════════════════════════════
const KANBAN_COLS: { id: TaskStatus; title: string }[] = [
  { id: 'TODO', title: 'Cần làm' },
  { id: 'DOING', title: 'Đang làm' },
  { id: 'REVIEW', title: 'Chờ duyệt' },
  { id: 'DONE', title: 'Hoàn thành' },
];

function RealtimeKanban() {
  const { tasks, moveTaskStatus, setSelectedTask, addTask } = useProjectStore();

  const mockNewMicroTask = () => {
    addTask({
        name: 'Dọn dẹp xà bần tầng 1',
        category: 'Lặt vặt',
        status: 'TODO',
        taskLevel: 'micro',
        isExtra: false,
        plannedStart: new Date().toISOString(),
        plannedEnd: addDays(new Date(), 1).toISOString(),
    });
  };

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" /> Thực tế Hiện trường (Kanban)
        </h3>
        <button onClick={mockNewMicroTask} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors">+ Thêm việc hàng ngày</button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="w-72 shrink-0 flex flex-col bg-slate-100 rounded-xl max-h-[600px] border border-slate-200">
              <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-xl">
                <span className="text-xs font-bold text-slate-700">{col.title}</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{colTasks.length}</span>
              </div>
              <div className="p-2 flex-1 overflow-y-auto space-y-2">
                {colTasks.map(t => {
                  const isRed = t.isOverdue;
                  return (
                    <div 
                        key={t.id} 
                        onClick={() => isRed ? setSelectedTask(t.id) : null}
                        className={`p-3 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing bg-white relative transition-all ${
                            isRed 
                            ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-100' 
                            : 'border-slate-200 hover:border-indigo-300'
                        }`}
                        draggable
                        onDragStart={(e) => {
                            if (isRed && col.id !== 'DONE') {
                              e.preventDefault(); // Lock dragging if overdue!
                              setSelectedTask(t.id);
                            } else {
                              e.dataTransfer.setData('taskId', t.id);
                            }
                        }}
                    >
                        {isRed && <AlertTriangle className="absolute -top-2 -right-2 text-rose-500 w-5 h-5 bg-white rounded-full p-0.5 animate-pulse" />}
                        
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold text-white ${t.taskLevel === 'macro' ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                                {t.taskLevel}
                            </span>
                            {t.isExtra && <span className="text-[8px] px-1.5 py-0.5 rounded uppercase font-bold bg-amber-500 text-white">Phát sinh</span>}
                        </div>
                        <h4 className={`text-xs font-bold ${isRed ? 'text-rose-900' : 'text-slate-800'}`}>{t.name}</h4>
                        <div className="flex items-center gap-3 mt-2">
                           {t.requiredWorkers && (
                               <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                                   <Users className="w-3 h-3" /> {t.requiredWorkers} thợ
                               </div>
                           )}
                           {t.duration && (
                               <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                                   <Clock className="w-3 h-3" /> {t.duration}d
                               </div>
                           )}
                        </div>
                    </div>
                  );
                })}
              </div>
              {/* Drop Zone */}
              <div 
                className="h-8 w-full bg-transparent"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData('taskId');
                  if (id) moveTaskStatus(id, col.id);
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MODULE 4: AI ACTION MODAL
// ═══════════════════════════════════════════════════════════
function AiActionModal() {
  const { selectedTaskId, setSelectedTask, tasks, applyAiAction } = useProjectStore();
  
  if (!selectedTaskId) return null;
  const task = tasks.find(t => t.id === selectedTaskId);
  if (!task || !task.isOverdue) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl border border-rose-200 shadow-2xl overflow-hidden max-w-lg w-full relative">
        <button onClick={() => setSelectedTask(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
        
        <div className="p-6 pb-0">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center border-2 border-rose-200">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-rose-700">Can thiệp trễ hạn</h3>
                    <p className="text-xs text-slate-500">{task.name} • Quá hạn 2 ngày</p>
                </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                <h4 className="text-xs font-bold text-indigo-700 flex items-center gap-2 mb-2"><Bot className="w-4 h-4"/> AI Đề xuất Giải pháp</h4>
                <p className="text-sm text-slate-600 mb-4">Vì công việc đang nằm trên đường găng (Critical Path), việc chậm trễ sẽ đẩy lùi toàn bộ dự án. Vui lòng chọn 1 trong 3 hành động bên dưới để AI tự động cấu trúc lại Kanban & Gantt.</p>
                
                <div className="flex flex-col gap-2">
                    <button onClick={() => { applyAiAction(task.id, 'WORKERS'); setSelectedTask(null); }} className="w-full bg-white border border-slate-200 p-3 rounded-lg text-left hover:border-indigo-400 hover:shadow-md transition-all group flex items-start gap-3">
                        <Users className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600">💪 Tăng ca / Bổ sung nhân sự</p>
                            <p className="text-xs text-slate-500 mt-0.5">Giữ nguyên deadline. X2 số lượng thợ ({task.requiredWorkers} → {Math.ceil((task.requiredWorkers||1)*1.5)} thợ) từ dự phòng.</p>
                        </div>
                    </button>
                    
                    <button onClick={() => { applyAiAction(task.id, 'SPLIT'); setSelectedTask(null); }} className="w-full bg-white border border-slate-200 p-3 rounded-lg text-left hover:border-indigo-400 hover:shadow-md transition-all group flex items-start gap-3">
                        <Copy className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-slate-800 group-hover:text-amber-600">✂️ Tách việc song song</p>
                            <p className="text-xs text-slate-500 mt-0.5">Chưa hoàn thành? Tách phần việc thừa ra một thẻ mới để giao cho phân đội khác thi công song song.</p>
                        </div>
                    </button>

                    <button onClick={() => { applyAiAction(task.id, 'DELAY'); setSelectedTask(null); }} className="w-full bg-white border border-slate-200 p-3 rounded-lg text-left hover:border-indigo-400 hover:shadow-md transition-all group flex items-start gap-3">
                        <ArrowRight className="w-5 h-5 text-rose-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-slate-800 group-hover:text-rose-600">⚠️ Dời lịch (Chấp nhận trễ)</p>
                            <p className="text-xs text-slate-500 mt-0.5">Tự động cộng thêm +3 ngày vào timeline. Toàn bộ các mốc phía sau trên Gantt (Dependencies) sẽ bị đẩy lùi theo.</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MODULE 5: DAILY BRIEFING
// ═══════════════════════════════════════════════════════════
function DailyBriefing() {
  const { dailyBriefingMode, tasks, setDailyBriefingMode, approveAllEveningTasks } = useProjectStore();
  if (!dailyBriefingMode) return null;

  const isMorning = dailyBriefingMode === 'morning';
  const reviewTasks = tasks.filter(t => t.status === 'REVIEW');
  const doingTasks = tasks.filter(t => t.status === 'DOING' || t.status === 'TODO');

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-w-lg w-full relative">
        <button onClick={() => setDailyBriefingMode(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
        
        <div className="p-6">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                {isMorning ? <span className="text-amber-500 text-2xl">🌅 Morning Report</span> : <span className="text-indigo-500 text-2xl">🌆 Evening Wrap-up</span>}
            </h3>
            <p className="text-sm text-slate-600 mb-6">
                {isMorning ? 'Tóm tắt tình hình các nhóm tác vụ trong ngày:' : 'Các hạng mục chờ nghiệm thu chốt ngày hôm nay:'}
            </p>

            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
                {isMorning ? (
                    <>
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                            <h4 className="font-bold text-amber-800 text-sm">Giao việc hôm nay ({doingTasks.length} tác vụ)</h4>
                            <p className="text-xs text-amber-700 mt-1">Tổng nhân công cần thiết: <strong>{doingTasks.reduce((acc, curr) => acc + (curr.requiredWorkers||1), 0)} người</strong></p>
                        </div>
                        {tasks.filter(t => t.isOverdue).length > 0 && (
                            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 mt-3 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-rose-800 text-sm">Sự cố tồn đọng ({tasks.filter(t => t.isOverdue).length})</h4>
                                    <p className="text-xs text-rose-700 mt-1">Bạn có thẻ đỏ trên Kanban chưa xử lý xong.</p>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {reviewTasks.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-sm">Chưa có hạng mục nào chờ duyệt chiều nay</div>
                        ) : (
                            reviewTasks.map(t => (
                                <div key={t.id} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{t.name}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{t.duration} days • {t.subcontractor}</p>
                                    </div>
                                    <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-full">{t.status}</span>
                                </div>
                            ))
                        )}
                    </>
                )}
            </div>

            <div className="flex gap-3 mt-6">
                {isMorning ? (
                    <button onClick={() => setDailyBriefingMode(null)} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition">Bắt đầu ngày mới</button>
                ) : (
                    <button onClick={() => { approveAllEveningTasks(); }} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition flex justify-center items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Nghiệm Thu Toàn Bộ
                    </button>
                )}
            </div>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN CONTAINER
// ═══════════════════════════════════════════════════════════
export function ProjectManagementAIModule({ projectId }: { projectId?: string }) {
  const { uploadPDFMock, tickTime, currentTime, setDailyBriefingMode, tasks, setTasks } = useProjectStore();
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Load Supabase tasks into store on mount
  useEffect(() => {
    if (!projectId) return;
    supabase.from('construction_tasks').select('*').eq('project_id', projectId)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTasks(data.map((t: any) => ({
            id: t.id, name: t.name, category: t.category,
            status: t.status as TaskStatus,
            subcontractor: t.subcontractor || '', days: t.days,
            budget: t.budget, spent: t.spent, approved: t.approved,
            dependencies: t.dependencies || [], tags: t.tags || [],
            issues: t.issues || [], checklist: t.checklist || [],
            progress: t.progress,
            startDate: t.start_date, endDate: t.end_date,
            plannedStart: t.planned_start || t.start_date,
            plannedEnd: t.planned_end || t.end_date,
            duration: t.duration || t.days || 1,
            requiredWorkers: t.required_workers || 0,
            taskLevel: (t.task_level as 'macro' | 'micro') || 'macro',
            isExtra: t.is_extra || false,
            isOverdue: false,
          })));
        }
      });
  }, [projectId]);

  // Save current store tasks back to Supabase
  const handleSave = async () => {
    if (!projectId || tasks.length === 0) return;
    setSaving(true); setSaveMsg('');
    const updates = tasks.map(t => ({
      id: t.id, project_id: projectId,
      name: t.name, category: t.category, status: t.status,
      subcontractor: t.subcontractor, days: t.days, budget: t.budget,
      spent: t.spent, approved: t.approved, dependencies: t.dependencies,
      tags: t.tags, issues: t.issues, checklist: t.checklist,
      progress: t.progress, start_date: t.startDate, end_date: t.endDate,
      planned_start: t.plannedStart, planned_end: t.plannedEnd,
      duration: t.duration, required_workers: t.requiredWorkers,
      task_level: t.taskLevel, is_extra: t.isExtra,
    }));
    const { error } = await supabase.from('construction_tasks').upsert(updates, { onConflict: 'id' });
    setSaving(false);
    setSaveMsg(error ? 'Lỗi khi lưu' : `Đã lưu ${tasks.length} tasks`);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  return (
    <div className="p-6">
        <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                   🏢 Quản Lý Thi Công AI
                   <span className="text-[10px] uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold ml-2">Master Architect</span>
                </h1>
                <p className="text-sm text-slate-500 mt-1">Current Game Time: <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded ml-1">{format(currentTime, 'PPpp')}</span></p>
            </div>
            
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => setDailyBriefingMode('morning')} 
                  className="px-3 py-2 bg-gradient-to-br from-amber-400 to-amber-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 hover:opacity-90 transition">
                  🌅 Morning
                </button>
                <button 
                  onClick={() => setDailyBriefingMode('evening')} 
                  className="px-3 py-2 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 hover:opacity-90 transition">
                  🌆 Evening
                </button>

                {/* MODULE 1: UPLOAD AI */}
                {tasks.length === 0 && (
                    <button onClick={uploadPDFMock} className="px-4 py-2 ml-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 shrink-0">
                        <Bot className="w-5 h-5"/> 🤖 Tải PDF Timeline
                    </button>
                )}

                {/* Simulated Time Engine Trigger */}
                <button onClick={() => tickTime(24)} className="px-4 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0">
                    <Clock className="w-5 h-5"/> Tua nhanh +24h
                </button>
                {tasks.length > 0 && (
                  <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-all flex items-center gap-2 shrink-0 disabled:opacity-60">
                    {saving ? '...' : '💾'} {saveMsg || 'Lưu DB'}
                  </button>
                )}
            </div>
        </div>

        <InteractiveGantt />
        <RealtimeKanban />
        
        <AiActionModal />
        <DailyBriefing />
    </div>
  );
}
