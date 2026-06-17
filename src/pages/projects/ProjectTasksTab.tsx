import React, { useState } from 'react'
import { type Project, type Task } from '../../types'
import { openGoogleCalendar } from '../../utils/calendarUtils'
import { getAssignableProfiles } from '../../utils/profileUtils'
import { X, Copy, Edit3, Trash2, Plus, Check, ChevronDown, ChevronRight, Calendar } from 'lucide-react'
import { format, parseISO, isBefore, startOfDay } from 'date-fns'

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
    onAddTask: (projectId: string) => void;
    onUpdateAssignee: (taskId: string, assigneeId: string) => void;
}

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
    onUpdateAssignee
}) => {
    const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
        'concept': true,
        '3d': true,
        '2d': true,
        'construction': true,
        'unassigned': true,
    });

    const togglePhase = (phaseKey: string) => {
        setExpandedPhases(prev => ({ ...prev, [phaseKey]: !prev[phaseKey] }));
    }

    if (!isOpen || !project) return null;

    const projectTasks = tasks.filter(t => t.project_id === project.id && !t.parent_id);
    const today = startOfDay(new Date());

    const tasksWithProgress = projectTasks.map(t => {
        const subTasks = tasks.filter(ct => ct.parent_id === t.id);
        const totalSub = subTasks.length;
        const completedSub = subTasks.filter(st => st.status === 'Hoàn thành').length;
        const displayPct = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : (t.completion_pct || 0);
        return { ...t, subTasks, totalSub, completedSub, displayPct };
    }).sort((a, b) => {
        const aCode = a.task_code || '';
        const bCode = b.task_code || '';
        const aMatch = aCode.match(/(\d+)$/);
        const bMatch = bCode.match(/(\d+)$/);
        if (aMatch && bMatch) return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
        return aCode.localeCompare(bCode, undefined, { numeric: true, sensitivity: 'base' });
    });

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

    const phases = [
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

    return (
        <div className="w-full flex flex-col h-full bg-white sm:rounded-b-3xl pt-4">

            {/* Stats Bar */}
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

            {/* Task List Grouped by Phase */}
            <div className="px-4 sm:px-6 pb-24 space-y-4">
                {phases.map(phase => {
                    const phaseTasks = tasksWithProgress.filter(t => phase.matchTargets.includes((t.target || '').toLowerCase()));
                    const phaseCompleted = phaseTasks.filter(t => t.status?.includes('Hoàn thành')).length;
                    const phasePct = phaseTasks.length > 0 ? Math.round((phaseCompleted / phaseTasks.length) * 100) : 0;
                    const isExpanded = expandedPhases[phase.key];
                    const isEmpty = phaseTasks.length === 0;

                    return (
                        <div key={phase.key} className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${isEmpty ? 'opacity-50 hover:opacity-100' : ''}`}>
                            {/* Phase Header */}
                            <div className="flex items-center justify-between p-3 cursor-pointer select-none" onClick={() => togglePhase(phase.key)}>
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400 ml-1"></div>
                                    <span className="text-[15px] font-bold text-slate-800">{phase.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${phasePct}%` }}></div>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-500 min-w-[20px] text-center">{phaseCompleted}/{phaseTasks.length}</span>
                                    {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onAddTask(project.id); }} 
                                        className="w-8 h-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm ml-1 transition-colors"
                                    >
                                        <Plus size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>

                            {/* Phase Tasks */}
                            {isExpanded && (
                                <div className="border-t border-slate-50">
                                    {phaseTasks.map((task, idx) => {
                                        const isCompleted = task.status?.includes('Hoàn thành');
                                        const isOverdue = !isCompleted && task.due_date && isBefore(parseISO(task.due_date), today);
                                        const hasSubtasks = task.totalSub > 0;
                                        const displayProgress = hasSubtasks ? Math.round((task.completedSub / task.totalSub) * 100) : task.displayPct;

                                        let dotColor = isCompleted ? 'bg-emerald-500' : 'bg-blue-500';
                                        if (isOverdue) dotColor = 'bg-rose-500';

                                        return (
                                            <div 
                                                key={task.id} 
                                                onClick={() => onEditTask(task)}
                                                className={`flex items-start gap-3 p-3.5 hover:bg-slate-50 transition-colors cursor-pointer group ${idx !== phaseTasks.length - 1 ? 'border-b border-slate-50' : ''}`}
                                            >
                                                {/* Checkbox */}
                                                <div 
                                                    className="mt-0.5 shrink-0" 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        if (currentUserProfile?.role === 'Admin' || project.manager_id === currentUserProfile?.id || task.assignee_id === currentUserProfile?.id) {
                                                            onToggleComplete(task);
                                                        }
                                                    }}
                                                >
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
                                                        <h4 className={`text-[13px] font-bold truncate leading-tight ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                            {task.name}
                                                        </h4>
                                                        {task.status === 'Kiểm duyệt' && !isCompleted && (
                                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-600 shrink-0 uppercase">Duyệt</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                                                        <span>{task.task_code}</span>
                                                        <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                                        <span className={isOverdue ? 'text-rose-500 font-bold' : ''}>{task.due_date ? format(parseISO(task.due_date), 'dd/MM') : 'N/A'}</span>
                                                        <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                                        
                                                        {/* Task Progress Bar */}
                                                        <div className="flex items-center gap-1.5 w-24">
                                                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${displayProgress}%` }}></div>
                                                            </div>
                                                            <span>{displayProgress}%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Side Avatar / Actions */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {/* Hidden Action Buttons visible on hover */}
                                                    <div className="hidden group-hover:flex gap-1.5 animate-in fade-in mr-1">
                                                        {(currentUserProfile?.role === 'Admin' || project.manager_id === currentUserProfile?.id) && (
                                                            <>
                                                                <button onClick={(e) => { e.stopPropagation(); openGoogleCalendar(task); }} className="p-1 text-slate-400 hover:text-blue-500 bg-white rounded shadow-sm border border-slate-100" title="Thêm vào Google Calendar"><Calendar size={12} /></button>
                                                                <button onClick={(e) => { e.stopPropagation(); onCopyTask(task); }} className="p-1 text-slate-400 hover:text-indigo-600 bg-white rounded shadow-sm border border-slate-100" title="Sao chép"><Copy size={12} /></button>
                                                            </>
                                                        )}
                                                        {(currentUserProfile?.role === 'Admin' || project.manager_id === currentUserProfile?.id) && (
                                                            <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-1 text-slate-400 hover:text-rose-600 bg-white rounded shadow-sm border border-slate-100" title="Xóa"><Trash2 size={12} /></button>
                                                        )}
                                                    </div>
                                                    <div className="relative w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center shadow-sm border border-indigo-50" title="Nhấn để gán người phụ trách">
                                                        {getAssigneeInitials(task.assignee_id)}
                                                        <select 
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            value={Array.isArray(task.assignee_id) ? task.assignee_id[0] || '' : task.assignee_id || ''}
                                                            onChange={(e) => { e.stopPropagation(); onUpdateAssignee(task.id, e.target.value); }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <option value="">Chưa gán</option>
                                                            {getAssignableProfiles(profiles, phase.key, [Array.isArray(task.assignee_id) ? task.assignee_id[0] : task.assignee_id].filter(Boolean) as string[]).map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* Unassigned Tasks */}
                {(() => {
                    const unassigned = tasksWithProgress.filter(t => !['concept', '3d', '2d', 'construction'].includes((t.target || '').toLowerCase()));
                    if (unassigned.length === 0) return null;
                    const isExpanded = expandedPhases['unassigned'];
                    
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
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onAddTask(project.id); }} 
                                        className="w-8 h-8 bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center justify-center shadow-sm ml-1 transition-colors"
                                    >
                                        <Plus size={16} strokeWidth={3} />
                                    </button>
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
                                                        <span className={isOverdue ? 'text-rose-500 font-bold' : ''}>{task.due_date ? format(parseISO(task.due_date), 'dd/MM') : 'N/A'}</span>
                                                        <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                                        <div className="flex items-center gap-1.5 w-24">
                                                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${displayProgress}%` }}></div>
                                                            </div>
                                                            <span>{displayProgress}%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Avatar / Actions */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="hidden group-hover:flex gap-1.5 mr-1">
                                                        {(currentUserProfile?.role === 'Admin' || project.manager_id === currentUserProfile?.id) && <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-1 text-slate-400 hover:text-rose-600 bg-white rounded shadow-sm border border-slate-100" title="Xóa"><Trash2 size={12} /></button>}
                                                    </div>
                                                    <div className="relative w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center shadow-sm border border-amber-50" title="Nhấn để gán người phụ trách">
                                                        {getAssigneeInitials(task.assignee_id)}
                                                        <select 
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            value={Array.isArray(task.assignee_id) ? task.assignee_id[0] || '' : task.assignee_id || ''}
                                                            onChange={(e) => { e.stopPropagation(); onUpdateAssignee(task.id, e.target.value); }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <option value="">Chưa gán</option>
                                                            {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>

        </div>
    )
}
