import React, { useState } from 'react'
import { type Project, type Task } from '../../types'
import { openGoogleCalendar } from '../../utils/calendarUtils'
import { getAssignableProfiles } from '../../utils/profileUtils'
import { X, Copy, Edit3, Trash2, Plus, Check, ChevronDown, ChevronRight, Calendar, FileText, ListPlus, Zap, GripVertical } from 'lucide-react'
import { format, parseISO, isBefore, startOfDay } from 'date-fns'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'

interface ProjectTasksTabProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    tasks: Task[];
    profiles: any[];
    currentUserProfile: any;
    onToggleComplete: (task: Task) => void;
    onDeleteTask: (id: string) => void;
    onCopyTask: (task: Task) => void;
    onEditTask: (task: Task) => void;
    onAddTask: (projectId: string, parentId?: string, target?: string) => void;
    onUpdateAssignee: (taskId: string, assigneeId: string) => void;
    onBulkAddTasks?: (projectId: string, taskNames: string[], target?: string) => void;
    onUpdateTaskField?: (taskId: string, field: string, value: any) => Promise<void>;
    onUpdateProjectStats?: () => void;
    canEdit: boolean;
    hideStats?: boolean;
}

const getTaskDurationDays = (startDate?: string | null, dueDate?: string | null) => {
    if (!startDate || !dueDate) return null;
    try {
        const s = parseISO(startDate);
        const d = parseISO(dueDate);
        const diff = Math.ceil((d.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : 1;
    } catch {
        return null;
    }
};

import { formatCleanTaskTitle as formatCleanName } from '../../utils/taskUtils';
import { PRECONSTRUCTION_TEMPLATE_TASKS } from '../../utils/preconstructionTemplates';
import { supabase } from '../../services/supabase';

const formatCleanTaskCode = (code: string) => {
    if (!code) return '';
    const parts = code.split('-');
    if (parts.length >= 2) return `${parts[0]}-${parts[1]}`;
    return code;
};

const QuickAddTaskRow: React.FC<{
    onAdd: (name: string) => void;
    isRollupProject: boolean;
}> = ({ onAdd, isRollupProject }) => {
    const [name, setName] = useState('');
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && name.trim()) {
            onAdd(formatCleanName(name));
            setName('');
        }
    };

    return (
        <div className="flex items-center gap-3 p-2 bg-slate-50 border-t border-slate-100 hover:bg-slate-100 transition-colors">
            <div className="w-[16px] h-[16px] rounded border-2 border-slate-300 border-dashed ml-1 shrink-0"></div>
            <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRollupProject ? "Nhập tên hạng mục & nhấn Enter..." : "Nhập tên công việc & nhấn Enter..."}
                className="flex-1 bg-transparent border-none focus:outline-none text-xs font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-medium"
            />
        </div>
    );
}

const handleDatePaste = (e: React.ClipboardEvent<HTMLInputElement>, taskId: string, field: 'start_date' | 'due_date', onUpdateTaskField?: (id: string, field: string, value: any) => void) => {
    if (!onUpdateTaskField) return;
    const pastedText = e.clipboardData.getData('text/plain');
    if (!pastedText) return;
    const text = pastedText.trim();
    const parts = text.split(/[\/\-\.]/);
    if (parts.length === 3) {
        let [day, month, year] = parts;
        if (year.length === 2) year = `20${year}`;
        if (day.length === 1) day = `0${day}`;
        if (month.length === 1) month = `0${month}`;
        const isoDate = `${year}-${month}-${day}`;
        if (!isNaN(Date.parse(isoDate))) {
            e.preventDefault();
            onUpdateTaskField(taskId, field, isoDate);
        }
    }
};

export const ProjectTasksTab: React.FC<ProjectTasksTabProps> = ({
    isOpen,
    onClose,
    project,
    tasks,
    profiles,
    currentUserProfile,
    onToggleComplete,
    onDeleteTask,
    onCopyTask,
    onEditTask,
    onAddTask,
    onUpdateAssignee,
    onBulkAddTasks,
    onUpdateTaskField,
    onUpdateProjectStats,
    canEdit,
    hideStats
}) => {
    const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});
    const [bulkAddTarget, setBulkAddTarget] = useState<string | null>(null);
    const [bulkAddText, setBulkAddText] = useState('');
    const [loadingTemplate, setLoadingTemplate] = useState(false);
    const [showStandbyPool, setShowStandbyPool] = useState(true);
    const [recentlyActivatedId, setRecentlyActivatedId] = useState<string | null>(null);

    const togglePhase = (phaseKey: string) => {
        setExpandedPhases(prev => {
            const currentVal = prev[phaseKey] !== false; // default to true if undefined
            return { ...prev, [phaseKey]: !currentVal };
        });
    }

    if (!isOpen || !project) return null;

    const sortAscendingByCode = (a: Task, b: Task) => {
        const aDone = a.status === 'Hoàn thành' ? 1 : 0;
        const bDone = b.status === 'Hoàn thành' ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;

        const aOrder = a.sort_order;
        const bOrder = b.sort_order;
        if (aOrder != null && bOrder != null && aOrder !== bOrder) return aOrder - bOrder;
        if (aOrder != null && bOrder == null) return -1;
        if (aOrder == null && bOrder != null) return 1;

        const aCode = a.task_code || '';
        const bCode = b.task_code || '';
        const aMatch = aCode.match(/(\d+)$/);
        const bMatch = bCode.match(/(\d+)$/);
        if (aMatch && bMatch) {
            const numA = parseInt(aMatch[1], 10);
            const numB = parseInt(bMatch[1], 10);
            if (numA !== numB) return numA - numB; // Ascending order 01 -> 02 -> 03 ... 29
        }
        return aCode.localeCompare(bCode, undefined, { numeric: true, sensitivity: 'base' });
    };

    const allProjectTasks = tasks.filter(t => t.project_id === project.id && !t.parent_id);
    const standbyTasks = allProjectTasks
        .filter(t => (t.status || '').includes('Chờ kích hoạt') || (t.status || '').includes('Dự thảo'))
        .sort(sortAscendingByCode);

    const projectTasks = allProjectTasks.filter(t => !(t.status || '').includes('Chờ kích hoạt') && !(t.status || '').includes('Dự thảo'));
    const today = startOfDay(new Date());

    const tasksWithProgress = projectTasks.map(t => {
        const subTasks = tasks.filter(ct => ct.parent_id === t.id);
        const totalSub = subTasks.length;
        const completedSub = subTasks.filter(st => st.status === 'Hoàn thành').length;
        const displayPct = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : (t.completion_pct || 0);
        return { ...t, subTasks, totalSub, completedSub, displayPct };
    }).sort(sortAscendingByCode);

    const stats = {
        total: tasksWithProgress.length,
        completed: tasksWithProgress.filter(t => t.status?.includes('Hoàn thành')).length,
        inProgress: tasksWithProgress.filter(t => t.status?.includes('Đang')).length,
        overdue: tasksWithProgress.filter(t => {
            if (t.status?.includes('Hoàn thành')) return false;
            if (!t.due_date) return false;
            return isBefore(parseISO(t.due_date), today);
        }).length
    };

    const getAssigneeInitials = (id: string | string[] | null) => {
        if (!id || (Array.isArray(id) && id.length === 0)) return '?'
        let targetId = Array.isArray(id) ? id[0] : id;
        const p = profiles.find(x => x.id === targetId)
        if (!p?.full_name) return '?';
        const parts = p.full_name.trim().split(' ');
        return parts[parts.length - 1].charAt(0).toUpperCase();
    }

    const getAssigneeName = (id: string | string[] | null) => {
        if (!id || (Array.isArray(id) && id.length === 0)) return '';
        let targetId = Array.isArray(id) ? id[0] : id;
        const p = profiles.find(x => x.id === targetId);
        if (!p?.full_name) return '';
        const parts = p.full_name.trim().split(/\s+/);
        return parts[parts.length - 1];
    };

    const isRollupProject = project?.status === 'Thi công' || (project?.name || '').toLowerCase().includes('tổng hợp');

    const rollupPhases = isRollupProject 
        ? projectTasks.map(pt => ({
            key: pt.id,
            name: pt.name,
            matchTargets: [pt.id],
            isRollup: true
        }))
        : [];

    const activePhases = isRollupProject ? rollupPhases : [
        {
            key: 'concept',
            name: 'Concept',
            matchTargets: ['concept'],
        },
        {
            key: '3d',
            name: '3D / Phối cảnh',
            matchTargets: ['3d'],
        },
        {
            key: '2d',
            name: '2D / Triển khai',
            matchTargets: ['2d'],
        },
        {
            key: 'construction',
            name: 'Construction / Hồ sơ TC',
            matchTargets: ['construction'],
        }
    ];

    const handleLoadPreconstructionTemplate = async () => {
        if (!project) return;
        const totalCount = PRECONSTRUCTION_TEMPLATE_TASKS.length;
        if (!confirm(`Nạp ${totalCount} mục công việc chuẩn Tiền thi công & Hồ sơ thi công vào dự án? Các mục này sẽ ở dạng Chờ kích hoạt (Ẩn cho tới khi bạn gán ngày).`)) return;
        
        setLoadingTemplate(true);
        try {
            const projCode = project.project_code || 'TASK';
            const prefix = `${projCode}-TC`;

            // Query DB to find max index for this prefix globally to avoid unique constraint errors
            const { data: existingTasks } = await supabase
                .from('tasks')
                .select('task_code')
                .like('task_code', `${prefix}-%`);

            let currentMax = 0;
            if (existingTasks) {
                existingTasks.forEach(t => {
                    if (t.task_code) {
                        const match = t.task_code.match(/-(\d+)$/);
                        if (match) {
                            const num = parseInt(match[1], 10);
                            if (num > currentMax) currentMax = num;
                        }
                    }
                });
            }

            const tasksToInsert = PRECONSTRUCTION_TEMPLATE_TASKS.map((t, idx) => {
                const taskCode = `${prefix}-${String(currentMax + idx + 1).padStart(2, '0')}`;
                return {
                    project_id: project.id,
                    name: t.name,
                    target: 'construction',
                    task_code: taskCode,
                    status: 'Chờ kích hoạt',
                    start_date: null,
                    due_date: null,
                };
            });

            const { error } = await supabase.from('tasks').insert(tasksToInsert);
            if (error) throw error;
            
            alert(`Đã nạp thành công ${totalCount} công việc mẫu Tiền thi công vào dự án ở dạng Chờ kích hoạt!`);
            setShowStandbyPool(true);
            if (onUpdateProjectStats) onUpdateProjectStats();
        } catch (e: any) {
            console.error(e);
            alert('Lỗi nạp danh mục mẫu: ' + (e.message || 'Không rõ nguyên nhân'));
        } finally {
            setLoadingTemplate(false);
        }
    };

    const handleActivateTemplateTask = async (taskId: string, startDate?: string, dueDate?: string) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const sDate = startDate || todayStr;
        const dDate = dueDate || startDate || todayStr;

        setRecentlyActivatedId(taskId);
        setTimeout(() => setRecentlyActivatedId(null), 1000);

        if (onUpdateTaskField) {
            onUpdateTaskField(taskId, 'start_date', sDate);
            onUpdateTaskField(taskId, 'due_date', dDate);
            onUpdateTaskField(taskId, 'target', 'construction');
            onUpdateTaskField(taskId, 'status', 'Cần làm');
        } else {
            await supabase.from('tasks').update({
                status: 'Cần làm',
                target: 'construction',
                start_date: sDate,
                due_date: dDate
            }).eq('id', taskId);
        }
        if (onUpdateProjectStats) onUpdateProjectStats();

        requestAnimationFrame(() => {
            const el = document.getElementById(`task-row-${taskId}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    };

    const getPhaseTasks = (phase: { key: string; matchTargets: string[]; isRollup?: boolean }) => {
        const phaseTasksRaw = isRollupProject
            ? tasks.filter(t => t.parent_id === phase.key && !(t.status || '').includes('Chờ kích hoạt') && !(t.status || '').includes('Dự thảo'))
            : tasksWithProgress.filter(t => phase.matchTargets.includes((t.target || '').toLowerCase()));

        return isRollupProject
            ? phaseTasksRaw.map(t => ({
                ...t,
                subTasks: [],
                totalSub: 0,
                completedSub: 0,
                displayPct: t.completion_pct || 0
              })).sort(sortAscendingByCode)
            : phaseTasksRaw;
    };

    const handleDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination || !onUpdateTaskField) return;
        if (source.droppableId !== destination.droppableId || source.index === destination.index) return;

        const phase = activePhases.find(p => p.key === source.droppableId);
        if (!phase) return;

        const list = getPhaseTasks(phase);
        const reordered = Array.from(list);
        const [moved] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, moved);

        reordered.forEach((t, idx) => {
            if ((t.sort_order ?? null) !== idx) {
                onUpdateTaskField(t.id, 'sort_order', idx);
            }
        });
    };

    return (
        <div className="w-full flex flex-col h-full bg-white sm:rounded-b-3xl pt-4">

            {/* Stats Bar */}
            {!hideStats && (
                <div className="px-6 pb-4">
                <div className="bg-white rounded-[1.25rem] p-3 flex justify-between items-center shadow-sm">
                    <div className="flex flex-col items-center flex-1 border-r border-slate-100">
                        <span className="text-lg font-bold text-slate-800 leading-none mb-1">{stats.total}</span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">Tổng</span>
                    </div>
                    <div className="flex flex-col items-center flex-1 border-r border-slate-100">
                        <span className="text-lg font-bold text-emerald-500 leading-none mb-1">{stats.completed}</span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">Xong</span>
                    </div>
                    <div className="flex flex-col items-center flex-1 border-r border-slate-100">
                        <span className="text-lg font-bold text-blue-500 leading-none mb-1">{stats.inProgress}</span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">Đang làm</span>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-lg font-bold text-rose-500 leading-none mb-1">{stats.overdue}</span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">Quá hạn</span>
                    </div>
                </div>
                </div>
            )}

            {/* Action Bar */}
            {canEdit && (
                <div className="px-6 pb-2 flex flex-wrap justify-end gap-2">
                    {onBulkAddTasks && (
                        <button
                            onClick={() => setBulkAddTarget(isRollupProject ? '' : 'concept')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-[11px] font-bold transition-all border border-blue-200 cursor-pointer"
                        >
                            <FileText size={14} strokeWidth={2.5} /> Nhập từ Excel
                        </button>
                    )}
                    <button
                        onClick={() => onAddTask(project.id, undefined, isRollupProject ? undefined : 'concept')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-bold shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                    >
                        <Plus size={14} strokeWidth={3} /> {isRollupProject ? 'Thêm công trình thi công' : 'Thêm công việc'}
                    </button>
                </div>
            )}

            {/* Task List Grouped by Phase */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-24 space-y-4 custom-scrollbar">
                <DragDropContext onDragEnd={handleDragEnd}>
                {activePhases.map(phase => {
                    const phaseTasks = getPhaseTasks(phase);

                    const phaseCompleted = phaseTasks.filter(t => t.status?.includes('Hoàn thành')).length;
                    const phasePct = phaseTasks.length > 0 ? Math.round((phaseCompleted / phaseTasks.length) * 100) : 0;
                    const isEmpty = phaseTasks.length === 0;
                    const isExpanded = expandedPhases[phase.key] !== undefined ? expandedPhases[phase.key] : !isEmpty;

                    // Calculate phase start, end, and duration automatically
                    const validStarts = phaseTasks.map(t => t.start_date).filter(Boolean) as string[];
                    const validEnds = phaseTasks.map(t => t.due_date).filter(Boolean) as string[];
                    const pStart = validStarts.length > 0 ? [...validStarts].sort()[0] : null;
                    const pEnd = validEnds.length > 0 ? [...validEnds].sort().reverse()[0] : null;
                    const pDuration = getTaskDurationDays(pStart, pEnd);

                    return (
                        <div key={phase.key} className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
                            {/* Phase Header */}
                            <div className="flex items-center justify-between p-3 cursor-pointer select-none" onClick={() => togglePhase(phase.key)}>
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400 ml-1"></div>
                                    <span className="text-[15px] font-bold text-slate-800">{formatCleanName(phase.name)}</span>
                                    {pStart && pEnd && (
                                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                            {format(parseISO(pStart), 'dd/MM')} → {format(parseISO(pEnd), 'dd/MM')} ({pDuration}d)
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${phasePct}%` }}></div>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-500 min-w-[20px] text-center">{phaseCompleted}/{phaseTasks.length}</span>
                                    {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                                    {canEdit && (
                                        <div className="flex gap-1 items-center ml-1">
                                            {phase.key === 'construction' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleLoadPreconstructionTemplate(); }}
                                                    disabled={loadingTemplate}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-[11px] font-bold transition-all border border-purple-200 cursor-pointer shadow-2xs disabled:opacity-50"
                                                    title={`Nạp sẵn ${PRECONSTRUCTION_TEMPLATE_TASKS.length} mục Tiền thi công dạng Ẩn/Chờ kích hoạt`}
                                                >
                                                    <Zap size={13} className="text-purple-600 fill-purple-600" />
                                                    <span>{loadingTemplate ? 'Đang nạp...' : `📋 Nạp Mẫu Tiền Thi Công (${PRECONSTRUCTION_TEMPLATE_TASKS.length} mục)`}</span>
                                                </button>
                                            )}
                                            {onBulkAddTasks && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setBulkAddTarget(phase.isRollup ? undefined : phase.key); }} 
                                                    className="w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center transition-colors border border-blue-100 cursor-pointer"
                                                    title="Nhập hàng loạt từ Excel"
                                                >
                                                    <ListPlus size={16} strokeWidth={2.5} />
                                                </button>
                                            )}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onAddTask(project.id, phase.isRollup ? phase.key : undefined, phase.isRollup ? undefined : phase.key); }} 
                                                className="w-8 h-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm transition-colors cursor-pointer"
                                            >
                                                <Plus size={16} strokeWidth={3} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Standby Template Pool Panel inside Construction section */}
                            {phase.key === 'construction' && standbyTasks.length > 0 && (
                                <div className="p-3 bg-gradient-to-r from-purple-50/70 via-indigo-50/70 to-slate-50 border-t border-purple-200/60">
                                    <div 
                                        className="flex items-center justify-between cursor-pointer select-none"
                                        onClick={() => setShowStandbyPool(!showStandbyPool)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                                            <h4 className="text-xs font-extrabold text-purple-900 flex items-center gap-1.5">
                                                📋 Danh Mục Mẫu Tiền Thi Công & Hồ Sơ TC
                                            </h4>
                                            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                                                {standbyTasks.length} mục chờ kích hoạt (Đang Ẩn)
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-purple-600 font-semibold hidden sm:inline">
                                                {showStandbyPool ? 'Thu gọn' : 'Xem danh mục & Gán ngày kích hoạt'}
                                            </span>
                                            {showStandbyPool ? <ChevronDown size={16} className="text-purple-600" /> : <ChevronRight size={16} className="text-purple-600" />}
                                        </div>
                                    </div>

                                    {showStandbyPool && (
                                        <div className="mt-3 pt-3 border-t border-purple-200/60 space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                                            <p className="text-[11px] text-purple-700 font-medium mb-2 bg-white/80 p-2 rounded-lg border border-purple-100">
                                                💡 Các công việc dưới đây đang ở dạng Ẩn. Khi bạn <strong>chọn Ngày thực hiện</strong> hoặc bấm <strong>"Kích hoạt"</strong>, công việc sẽ tự động nhảy lên Bảng Gantt & Bảng Kanban!
                                            </p>
                                             {standbyTasks.map(t => (
                                                <div key={t.id} className="flex flex-wrap sm:flex-nowrap items-center justify-between bg-white rounded-xl p-2 border border-purple-100 shadow-2xs hover:border-purple-300 transition-all gap-2 text-xs">
                                                    <div 
                                                        className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer hover:opacity-80"
                                                        onClick={() => onEditTask(t)}
                                                        title="Bấm để xem/sửa chi tiết công việc này"
                                                    >
                                                        <span className="text-[10px] font-mono font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 shrink-0">
                                                            {formatCleanTaskCode(t.task_code)}
                                                        </span>
                                                        <span className="font-bold text-slate-800 truncate">{t.name}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] font-bold text-slate-400">Bắt đầu:</span>
                                                            <input 
                                                                type="date"
                                                                value={t.start_date || ''}
                                                                onClick={e => e.stopPropagation()}
                                                                onChange={e => {
                                                                    e.stopPropagation();
                                                                    handleActivateTemplateTask(t.id, e.target.value, t.due_date || undefined);
                                                                }}
                                                                className="px-1.5 py-0.5 bg-purple-50/50 border border-purple-200 rounded text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 h-6 cursor-pointer"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] font-bold text-slate-400">Kết thúc:</span>
                                                            <input 
                                                                type="date"
                                                                value={t.due_date || ''}
                                                                onClick={e => e.stopPropagation()}
                                                                onChange={e => {
                                                                    e.stopPropagation();
                                                                    handleActivateTemplateTask(t.id, t.start_date || undefined, e.target.value);
                                                                }}
                                                                className="px-1.5 py-0.5 bg-purple-50/50 border border-purple-200 rounded text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 h-6 cursor-pointer"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleActivateTemplateTask(t.id, new Date().toISOString().split('T')[0], undefined);
                                                            }}
                                                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                                                            title="Kích hoạt ngay lên Bảng Gantt & Kanban"
                                                        >
                                                            <Zap size={11} className="fill-white" />
                                                            <span>Kích hoạt</span>
                                                        </button>
                                                        {canEdit && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm(`Bạn có chắc chắn muốn xóa công việc "${t.name}"?`)) {
                                                                        onDeleteTask(t.id);
                                                                    }
                                                                }}
                                                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                                title="Xóa công việc này"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Phase Tasks */}
                            {isExpanded && (
                                <div className="border-t border-slate-50">
                                    <Droppable droppableId={phase.key} isDropDisabled={!canEdit || !onUpdateTaskField}>
                                    {(droppableProvided) => (
                                    <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                                    {isEmpty && (
                                        <div className="p-4 text-center text-[11px] font-semibold text-slate-400">
                                            Chưa có công việc nào
                                        </div>
                                    )}
                                    {phaseTasks.map((task, idx) => {
                                        const isCompleted = task.status?.includes('Hoàn thành');
                                        const isOverdue = !isCompleted && task.due_date && isBefore(parseISO(task.due_date), today);
                                        const hasSubtasks = task.totalSub > 0;
                                        const displayProgress = hasSubtasks ? Math.round((task.completedSub / task.totalSub) * 100) : task.displayPct;
                                        const taskDuration = getTaskDurationDays(task.start_date, task.due_date);

                                        let dotColor = isCompleted ? 'bg-emerald-500' : 'bg-blue-500';
                                        if (isOverdue) dotColor = 'bg-rose-500';

                                        return (
                                            <Draggable key={task.id} draggableId={task.id} index={idx} isDragDisabled={!canEdit || !onUpdateTaskField}>
                                            {(dragProvided, dragSnapshot) => (
                                            <div
                                                id={`task-row-${task.id}`}
                                                ref={dragProvided.innerRef}
                                                {...dragProvided.draggableProps}
                                                style={dragProvided.draggableProps.style}
                                                onClick={() => onEditTask(task)}
                                                className={`grid grid-cols-[76px_minmax(0,1fr)_70px_212px_200px] items-center gap-2 px-3 py-1.5 transition-all cursor-pointer group text-xs ${
                                                    dragSnapshot.isDragging ? 'bg-white shadow-lg rounded-lg ring-1 ring-indigo-200' :
                                                    recentlyActivatedId === task.id ? 'bg-purple-100/90 border-l-4 border-l-purple-600 shadow-sm animate-pulse' : 'hover:bg-slate-50'
                                                } ${idx !== phaseTasks.length - 1 ? 'border-b border-slate-100' : ''}`}
                                            >
                                                {/* Col 1: drag handle + sequence number + checkbox + status dot (fixed width, always aligned) */}
                                                <div className="flex items-center gap-2">
                                                    {canEdit && onUpdateTaskField && (
                                                        <div
                                                            {...dragProvided.dragHandleProps}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="shrink-0 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing"
                                                            title="Kéo để đổi vị trí"
                                                        >
                                                            <GripVertical size={13} />
                                                        </div>
                                                    )}
                                                    <span className="text-[9px] font-bold text-slate-300 w-4 text-center shrink-0" title="Số thứ tự">{idx + 1}</span>

                                                    <div
                                                        className="shrink-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (currentUserProfile?.role === 'Admin' || project.manager_id === currentUserProfile?.id || task.assignee_id === currentUserProfile?.id) {
                                                                onToggleComplete(task);
                                                            }
                                                        }}
                                                    >
                                                        {isCompleted ? (
                                                            <div className="w-[16px] h-[16px] rounded bg-emerald-500 flex items-center justify-center shadow-2xs">
                                                                <Check size={11} strokeWidth={4} className="text-white" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-[16px] h-[16px] rounded border-2 border-slate-300 hover:border-emerald-400 transition-colors bg-white"></div>
                                                        )}
                                                    </div>

                                                    {!isCompleted && <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}></div>}
                                                </div>

                                                {/* Col 2: title (flexible width, truncates - never shifts columns after it) */}
                                                <div className="flex items-center gap-1.5 min-w-0 group/title">
                                                    <h4 className={`text-xs font-semibold truncate min-w-0 ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                        {formatCleanName(task.name)}
                                                    </h4>
                                                    {task.status === 'Kiểm duyệt' && !isCompleted && (
                                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-600 shrink-0 uppercase">Duyệt</span>
                                                    )}
                                                </div>

                                                {/* Col 3: task code (fixed width - own column, aligned) */}
                                                <span className="text-[10px] text-slate-400 hidden md:inline font-mono truncate">{formatCleanTaskCode(task.task_code)}</span>

                                                {/* Col 4: date range + duration (fixed width) */}
                                                {canEdit && onUpdateTaskField ? (
                                                    <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                                                        <input
                                                            type="date"
                                                            value={task.start_date || ''}
                                                            onChange={(e) => onUpdateTaskField(task.id, 'start_date', e.target.value)}
                                                            onPaste={(e) => handleDatePaste(e, task.id, 'start_date', onUpdateTaskField)}
                                                            className="bg-white hover:bg-slate-50 border border-slate-200 rounded px-1 text-[9px] font-semibold text-slate-500 cursor-pointer focus:ring-1 focus:ring-blue-500 h-5 w-[80px]"
                                                            title="Ngày bắt đầu"
                                                        />
                                                        <span className="text-slate-300 text-[10px]">-</span>
                                                        <input
                                                            type="date"
                                                            value={task.due_date || ''}
                                                            onChange={(e) => onUpdateTaskField(task.id, 'due_date', e.target.value)}
                                                            onPaste={(e) => handleDatePaste(e, task.id, 'due_date', onUpdateTaskField)}
                                                            className={`bg-white hover:bg-slate-50 border border-slate-200 rounded px-1 text-[9px] font-semibold cursor-pointer focus:ring-1 focus:ring-blue-500 h-5 w-[80px] ${isOverdue ? 'text-rose-500 font-bold border-rose-200' : 'text-slate-500'}`}
                                                            title="Hạn chót"
                                                        />
                                                        {taskDuration !== null && (
                                                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1 py-0.2 rounded shrink-0 min-w-[24px] text-center" title="Thời lượng công việc">
                                                                {taskDuration}d
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className={`text-[10px] font-medium ${isOverdue ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                                                        {task.start_date ? format(parseISO(task.start_date), 'dd/MM') : ''} - {task.due_date ? format(parseISO(task.due_date), 'dd/MM') : 'N/A'} {taskDuration ? `(${taskDuration}d)` : ''}
                                                    </span>
                                                )}

                                                {/* Col 5: action icons + assignee pill (fixed width, right-aligned) */}
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={(e) => { e.stopPropagation(); openGoogleCalendar(task); }} className="p-0.5 text-slate-400 hover:text-blue-500 bg-white rounded shadow-2xs border border-slate-100" title="Thêm vào Google Calendar"><Calendar size={12} /></button>
                                                        {canEdit && (
                                                            <button onClick={(e) => { e.stopPropagation(); onCopyTask(task); }} className="p-0.5 text-slate-400 hover:text-indigo-600 bg-white rounded shadow-2xs border border-slate-100" title="Sao chép"><Copy size={12} /></button>
                                                        )}
                                                        {canEdit && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm(`Bạn có chắc chắn muốn xóa công việc "${task.name}"?`)) {
                                                                        onDeleteTask(task.id);
                                                                    }
                                                                }}
                                                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                                title="Xóa công việc"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="relative flex items-center gap-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200/70 rounded-full px-2 py-0.5 text-[10px] font-semibold text-slate-600 cursor-pointer shrink-0 transition-colors" title={`Người phụ trách: ${getAssigneeName(task.assignee_id)}`}>
                                                        <div className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[8px] font-bold flex items-center justify-center shrink-0">
                                                            {getAssigneeInitials(task.assignee_id)}
                                                        </div>
                                                        <span className="truncate max-w-[65px] text-[10px] font-semibold">{getAssigneeName(task.assignee_id) || 'Chưa gán'}</span>
                                                        {canEdit && (
                                                            <select
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                value={Array.isArray(task.assignee_id) ? task.assignee_id[0] || '' : task.assignee_id || ''}
                                                                onChange={(e) => { e.stopPropagation(); onUpdateAssignee(task.id, e.target.value); }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <option value="">Chưa gán</option>
                                                                {getAssignableProfiles(profiles, phase.isRollup ? 'construction' : phase.key, [Array.isArray(task.assignee_id) ? task.assignee_id[0] : task.assignee_id].filter(Boolean) as string[], currentUserProfile?.role).map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                                                            </select>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            )}
                                            </Draggable>
                                        )
                                    })}
                                    {droppableProvided.placeholder}
                                    </div>
                                    )}
                                    </Droppable>
                                    {canEdit && (
                                        <QuickAddTaskRow
                                            onAdd={(name) => onBulkAddTasks?.(project.id, [name], phase.isRollup ? undefined : phase.key)}
                                            isRollupProject={!!phase.isRollup}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
                </DragDropContext>

                {/* Unassigned Tasks */}
                {(() => {
                    if (isRollupProject) return null;
                    const unassigned = tasksWithProgress.filter(t => !['concept', '3d', '2d', 'construction'].includes((t.target || '').toLowerCase()));
                    if (unassigned.length === 0) return null;
                    const isExpanded = expandedPhases['unassigned'] !== false;
                    
                    return (
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-amber-100">
                            <div className="flex items-center justify-between p-3 cursor-pointer select-none bg-amber-50/50" onClick={() => togglePhase('unassigned')}>
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ml-1"></div>
                                    <span className="text-[15px] font-bold text-amber-800">Chưa gán</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[11px] font-bold text-amber-600 min-w-[20px] text-center">{unassigned.length}</span>
                                    {isExpanded ? <ChevronDown size={14} className="text-amber-500" /> : <ChevronRight size={14} className="text-amber-500" />}
                                    {canEdit && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onAddTask(project.id); }} 
                                            className="w-8 h-8 bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center justify-center shadow-sm ml-1 transition-colors"
                                        >
                                            <Plus size={16} strokeWidth={3} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div className="border-t border-amber-100/50">
                                    {unassigned.map((task, idx) => {
                                        const isCompleted = task.status?.includes('Hoàn thành');
                                        const isOverdue = !isCompleted && task.due_date && isBefore(parseISO(task.due_date), today);
                                        const displayProgress = task.totalSub > 0 ? Math.round((task.completedSub / task.totalSub) * 100) : task.displayPct;
                                        let dotColor = isCompleted ? 'bg-emerald-500' : 'bg-amber-500';
                                        if (isOverdue) dotColor = 'bg-rose-500';

                                        return (
                                            <div key={task.id} onClick={() => onEditTask(task)} className={`flex items-start gap-3 p-3.5 hover:bg-slate-50 transition-colors cursor-pointer group ${idx !== unassigned.length - 1 ? 'border-b border-slate-50' : ''}`}>
                                                {/* Checkbox */}
                                                <div className="mt-0.5 shrink-0" onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (currentUserProfile?.role === 'Admin' || project.manager_id === currentUserProfile?.id || task.assignee_id === currentUserProfile?.id) { onToggleComplete(task); }
                                                }}>
                                                    {isCompleted ? (
                                                        <div className="w-[18px] h-[18px] rounded-[5px] bg-emerald-500 flex items-center justify-center shadow-sm">
                                                            <Check size={12} strokeWidth={4} className="text-white" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-[18px] h-[18px] rounded-[5px] border-2 border-slate-300 hover:border-emerald-400 transition-colors bg-white"></div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        {!isCompleted && <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}></div>}
                                                        <h4 className={`text-[13px] font-bold truncate leading-tight ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.name}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                                                        <span>{task.task_code}</span><span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                                        {canEdit && onUpdateTaskField ? (
                                                            <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                                                                <input 
                                                                    type="date"
                                                                    value={task.start_date || ''}
                                                                    onChange={(e) => onUpdateTaskField(task.id, 'start_date', e.target.value)}
                                                                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-1 text-[9px] font-semibold text-slate-500 cursor-pointer focus:ring-1 focus:ring-blue-500 h-5 min-w-[90px]"
                                                                />
                                                                <span className="text-slate-300">-</span>
                                                                <input 
                                                                    type="date"
                                                                    value={task.due_date || ''}
                                                                    onChange={(e) => onUpdateTaskField(task.id, 'due_date', e.target.value)}
                                                                    className={`bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-1 text-[9px] font-semibold cursor-pointer focus:ring-1 focus:ring-blue-500 h-5 min-w-[90px] ${isOverdue ? 'text-rose-500 font-bold' : 'text-slate-500'}`}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span className={isOverdue ? 'text-rose-500 font-bold' : ''}>{task.due_date ? format(parseISO(task.due_date), 'dd/MM') : 'N/A'}</span>
                                                        )}
                                                     </div>
                                                </div>

                                                {/* Avatar / Actions / Staff Name */}
                                                <div className="flex items-center justify-end gap-1.5 shrink-0 min-w-[70px]">
                                                    {/* Staff Name (Visible when idle) */}
                                                    <span className="text-[10px] font-semibold text-slate-600 group-hover:hidden transition-all text-right truncate max-w-[65px]" title="Người phụ trách">
                                                        {getAssigneeName(task.assignee_id) || <span className="text-slate-300 font-normal italic">Chưa gán</span>}
                                                    </span>

                                                    {/* Action Buttons (Visible on hover) */}
                                                    <div className="hidden group-hover:flex gap-1 animate-in fade-in">
                                                        <button onClick={(e) => { e.stopPropagation(); openGoogleCalendar(task); }} className="p-1 text-slate-400 hover:text-blue-500 bg-white rounded shadow-sm border border-slate-100" title="Thêm vào Google Calendar"><Calendar size={12} /></button>
                                                        {(currentUserProfile?.role === 'Admin' || project.manager_id === currentUserProfile?.id) && <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-1 text-slate-400 hover:text-rose-600 bg-white rounded shadow-sm border border-slate-100" title="Xóa"><Trash2 size={12} /></button>}
                                                    </div>

                                                    {/* Avatar Circle */}
                                                    <div className="relative w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center shadow-sm border border-amber-50 shrink-0" title="Người phụ trách">
                                                        {getAssigneeInitials(task.assignee_id)}
                                                        {canEdit && (
                                                            <select 
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                value={Array.isArray(task.assignee_id) ? task.assignee_id[0] || '' : task.assignee_id || ''}
                                                                onChange={(e) => { e.stopPropagation(); onUpdateAssignee(task.id, e.target.value); }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <option value="">Chưa gán</option>
                                                                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                                                            </select>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {canEdit && (
                                        <QuickAddTaskRow 
                                            onAdd={(name) => onBulkAddTasks?.(project.id, [name], undefined)} 
                                            isRollupProject={false} 
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* Bulk Add Modal */}
            {bulkAddTarget !== null && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setBulkAddTarget(null)}></div>
                    <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Nhập nhanh từ Excel</h3>
                                <p className="text-[12px] text-slate-500 font-medium mt-0.5">Copy cột tên công việc và dán vào bên dưới (mỗi dòng 1 công việc)</p>
                            </div>
                            <button onClick={() => setBulkAddTarget(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={18} strokeWidth={2.5} /></button>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={bulkAddText}
                                onChange={(e) => setBulkAddText(e.target.value)}
                                placeholder="Khảo sát hiện trạng&#10;Lập bản vẽ 2D&#10;Kiểm tra khối lượng..."
                                className="w-full h-48 border border-slate-200 rounded-xl p-4 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium custom-scrollbar"
                            />
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                            <button onClick={() => setBulkAddTarget(null)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 transition-colors text-sm">Hủy</button>
                            <button 
                                onClick={() => {
                                    if (!onBulkAddTasks) return;
                                    const lines = bulkAddText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                                    if (lines.length > 0) {
                                        onBulkAddTasks(project.id, lines, bulkAddTarget || undefined);
                                    }
                                    setBulkAddTarget(null);
                                    setBulkAddText('');
                                }}
                                disabled={!bulkAddText.trim()}
                                className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm shadow-sm"
                            >
                                Xác nhận tạo {bulkAddText.split('\n').filter(l => l.trim().length > 0).length || ''} công việc
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
