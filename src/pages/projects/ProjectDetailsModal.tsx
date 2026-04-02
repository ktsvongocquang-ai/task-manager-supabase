import React from 'react'
import { type Project, type Task } from '../../types'
import { X, Copy, Edit3, Trash2, Plus } from 'lucide-react'
import { format, parseISO, isBefore, startOfDay } from 'date-fns'
import { CommentSection } from '../../components/chat/CommentSection'

interface ProjectDetailsModalProps {
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
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
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
    onAddTask
}) => {
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

        // Extract numeric sequence after "PHASE-" or similar patterns if possible
        const aMatch = aCode.match(/(\d+)$/);
        const bMatch = bCode.match(/(\d+)$/);

        if (aMatch && bMatch) {
            return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
        }

        // Fallback to standard localeCompare with numeric sorting
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

    const overallProgress = tasksWithProgress.length > 0
        ? Math.round(tasksWithProgress.reduce((acc, t) => acc + t.displayPct, 0) / tasksWithProgress.length)
        : 0;

    const getAssigneeName = (id: string | string[] | null) => {
        if (!id || (Array.isArray(id) && id.length === 0)) return 'Chưa gán'
        if (Array.isArray(id)) {
            return id.map(i => profiles.find(x => x.id === i)?.full_name).filter(Boolean).join(', ') || 'N/A'
        }
        const p = profiles.find(x => x.id === id)
        return p?.full_name || 'N/A'
    }

    const getStatusStyle = (t: any) => {
        const isCompleted = t.status?.includes('Hoàn thành');
        let isOverdue = false;
        if (!isCompleted && t.due_date) {
            isOverdue = isBefore(parseISO(t.due_date), today);
        }

        if (isCompleted) return { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' };
        if (isOverdue) return { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-600' };
        if (t.status?.includes('Đang')) return { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' };
        if (t.status?.includes('Tạm dừng')) return { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' };
        return { border: 'border-slate-300', bg: 'bg-slate-50', text: 'text-slate-600' };
    }

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9998] flex items-center justify-center p-4">
            <div className="bg-[#EAEAEA] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-8 py-6 relative">
                    <h2 className="text-2xl font-bold text-slate-800">
                        Chi tiết dự án: {project.name} ({project.project_code})
                    </h2>
                    <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-200 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-8 pb-8 flex-1 overflow-y-auto space-y-8">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
                            <span className="text-3xl font-black text-slate-700 mb-1">{stats.total}</span>
                            <span className="text-sm font-medium text-slate-500">Tổng nhiệm vụ</span>
                        </div>
                        <div className="bg-emerald-50 rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
                            <span className="text-3xl font-black text-emerald-600 mb-1">{stats.completed}</span>
                            <span className="text-sm font-medium text-slate-500">Hoàn thành</span>
                        </div>
                        <div className="bg-blue-50 rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
                            <span className="text-3xl font-black text-blue-600 mb-1">{stats.inProgress}</span>
                            <span className="text-sm font-medium text-slate-500">Đang thực hiện</span>
                        </div>
                        <div className="bg-red-50 rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
                            <span className="text-3xl font-black text-red-600 mb-1">{stats.overdue}</span>
                            <span className="text-sm font-medium text-slate-500">Quá hạn</span>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <h3 className="text-base font-bold text-slate-700">Tiến độ dự án</h3>
                            <span className="text-lg font-black text-slate-800">{overallProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                            <div
                                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                                style={{ width: `${overallProgress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Task List Grouped by Phase */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-800">Danh sách nhiệm vụ ({stats.total})</h3>

                        {[
                            { key: 'concept', name: 'Concept', icon: '💡', color: 'indigo' },
                            { key: '3d', name: '3D / Phối cảnh', icon: '🎨', color: 'violet' },
                            { key: '2d', name: '2D / Triển khai', icon: '📐', color: 'blue' },
                            { key: 'construction', name: 'Construction / Hồ sơ TC', icon: '🏗️', color: 'emerald' },
                        ].map(phase => {
                            const phaseTasks = tasksWithProgress.filter(t => (t.target || '').toLowerCase() === phase.key);
                            const phaseCompleted = phaseTasks.filter(t => t.status?.includes('Hoàn thành')).length;
                            const phasePct = phaseTasks.length > 0 ? Math.round((phaseCompleted / phaseTasks.length) * 100) : 0;

                            return (
                                <div key={phase.key}>
                                    {/* Phase Header */}
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{phase.icon}</span>
                                            <span className="text-sm font-black text-slate-700 uppercase tracking-wider">{phase.name}</span>
                                            <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{phaseTasks.length} task</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-300 ${phasePct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${phasePct}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-500">{phaseCompleted}/{phaseTasks.length}</span>
                                        </div>
                                    </div>

                                    {phaseTasks.length === 0 ? (
                                        <div className="text-xs text-slate-400 italic bg-white/50 rounded-xl py-3 px-4 border border-dashed border-slate-200 mb-2">Chưa có nhiệm vụ nào trong giai đoạn này</div>
                                    ) : (
                                        <div className="space-y-3 mb-2">
                                            {phaseTasks.map(task => {
                                                const statusStyle = getStatusStyle(task);
                                                return (
                                                    <div
                                                        key={task.id}
                                                        onClick={() => onEditTask(task)}
                                                        className={`bg-white rounded-2xl p-5 shadow-sm border-l-[6px] ${statusStyle.border} relative overflow-hidden group flex flex-col cursor-pointer hover:ring-2 hover:ring-indigo-500/20 active:scale-[0.99] transition-all`}
                                                    >
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex gap-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={task.status?.includes('Hoàn thành')}
                                                                    onChange={(e) => { e.stopPropagation(); onToggleComplete(task); }}
                                                                    className="mt-1 w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                                    disabled={!(currentUserProfile?.role === 'Admin' || project.manager_id === currentUserProfile?.id || task.assignee_id === currentUserProfile?.id)}
                                                                />
                                                                <div>
                                                                    <h4 className="text-base font-bold text-slate-800 mb-2">
                                                                        {task.name} <span className="text-slate-400 font-medium text-sm">({task.task_code})</span>
                                                                    </h4>
                                                                    <div className="flex gap-2">
                                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyle.bg} ${statusStyle.text}`}>
                                                                            {task.status}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end justify-between self-stretch gap-2 shrink-0">
                                                                <div className="flex flex-col items-end gap-1.5">
                                                                    {task.totalSub > 0 && (
                                                                        <div className="text-2xl font-black text-indigo-600 leading-none shadow-sm px-2 py-1 rounded-lg bg-indigo-50/50">
                                                                            {task.completedSub}<span className="text-lg text-slate-400">/{task.totalSub}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex flex-col items-center border border-blue-600 rounded text-xs bg-white px-1.5 py-1 shadow-sm shrink-0 min-w-[90px]">
                                                                        <div className="flex items-center gap-1 font-bold text-slate-700">
                                                                            <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] text-slate-600">
                                                                                {getAssigneeName(task.assignee_id).charAt(0)}
                                                                            </div>
                                                                            <span className="truncate max-w-[80px] text-center">{getAssigneeName(task.assignee_id)}</span>
                                                                        </div>
                                                                        <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                                                                            🗓 {task.due_date ? format(parseISO(task.due_date), 'dd/MM/yyyy') : '---'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-auto pb-1">
                                                                    {(currentUserProfile?.role === 'Admin' || project.manager_id === currentUserProfile?.id) && (
                                                                        <button onClick={(e) => { e.stopPropagation(); onCopyTask(task); }} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 shadow-sm border border-emerald-50"><Copy size={14} /></button>
                                                                    )}
                                                                    {(currentUserProfile?.role === 'Admin' || project.manager_id === currentUserProfile?.id || task.assignee_id === currentUserProfile?.id) && (
                                                                        <button onClick={(e) => { e.stopPropagation(); onEditTask(task); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 shadow-sm border border-blue-50"><Edit3 size={14} /></button>
                                                                    )}
                                                                    {(currentUserProfile?.role === 'Admin' || project.manager_id === currentUserProfile?.id) && (
                                                                        <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 shadow-sm border border-red-50"><Trash2 size={14} /></button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-2 pt-4 border-t border-slate-50">
                                                            <span className="text-xs font-bold text-slate-400">Tiến độ</span>
                                                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                                                                <div className={`h-2 rounded-full ${task.displayPct >= 100 ? 'bg-emerald-500' : 'bg-emerald-400/80'}`} style={{ width: `${task.displayPct}%` }}></div>
                                                            </div>
                                                            <span className="text-sm font-black text-slate-700">{task.displayPct}%</span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Unassigned tasks */}
                        {(() => {
                            const unassigned = tasksWithProgress.filter(t => !['concept', '3d', '2d', 'construction'].includes((t.target || '').toLowerCase()));
                            if (unassigned.length === 0) return null;
                            return (
                                <div>
                                    <div className="flex items-center gap-2 mb-3 px-1">
                                        <span className="text-lg">📋</span>
                                        <span className="text-sm font-black text-amber-700 uppercase tracking-wider">Chưa gán giai đoạn</span>
                                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{unassigned.length} task</span>
                                    </div>
                                    <div className="space-y-3">
                                        {unassigned.map(task => {
                                            const statusStyle = getStatusStyle(task);
                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={() => onEditTask(task)}
                                                    className={`bg-white rounded-2xl p-5 shadow-sm border-l-[6px] ${statusStyle.border} relative overflow-hidden group flex flex-col cursor-pointer hover:ring-2 hover:ring-indigo-500/20 active:scale-[0.99] transition-all`}
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex gap-3">
                                                            <input type="checkbox" checked={task.status?.includes('Hoàn thành')} onChange={(e) => { e.stopPropagation(); onToggleComplete(task); }} className="mt-1 w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" disabled={!(currentUserProfile?.role === 'Admin' || project.manager_id === currentUserProfile?.id || task.assignee_id === currentUserProfile?.id)} />
                                                            <div>
                                                                <h4 className="text-base font-bold text-slate-800 mb-2">{task.name} <span className="text-slate-400 font-medium text-sm">({task.task_code})</span></h4>
                                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyle.bg} ${statusStyle.text}`}>{task.status}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-center border border-blue-600 rounded text-xs bg-white px-1.5 py-1 shadow-sm shrink-0 min-w-[90px]">
                                                            <div className="flex items-center gap-1 font-bold text-slate-700"><div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] text-slate-600">{getAssigneeName(task.assignee_id).charAt(0)}</div><span className="truncate max-w-[80px]">{getAssigneeName(task.assignee_id)}</span></div>
                                                            <div className="text-[10px] font-semibold text-slate-500 mt-0.5">🗓 {task.due_date ? format(parseISO(task.due_date), 'dd/MM/yyyy') : '---'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-2 pt-4 border-t border-slate-50">
                                                        <span className="text-xs font-bold text-slate-400">Tiến độ</span>
                                                        <div className="flex-1 bg-slate-100 rounded-full h-2"><div className={`h-2 rounded-full ${task.displayPct >= 100 ? 'bg-emerald-500' : 'bg-emerald-400/80'}`} style={{ width: `${task.displayPct}%` }}></div></div>
                                                        <span className="text-sm font-black text-slate-700">{task.displayPct}%</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Chat & Comment Section */}
                    {project?.id && (
                        <div className="mt-8 pt-8 border-t border-slate-300">
                            <CommentSection
                                projectId={project.id}
                                currentUserProfile={currentUserProfile}
                                profiles={profiles}
                                itemName={project.name}
                            />
                        </div>
                    )}
                </div>

                {/* Footer Add Task Button */}
                <div className="p-6 bg-[#EAEAEA] flex justify-between items-center px-8 border-t border-slate-300">
                    <button
                        onClick={() => onAddTask(project.id)}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} /> Thêm nhiệm vụ
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    )
}
