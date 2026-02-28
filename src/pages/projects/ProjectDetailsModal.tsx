import React from 'react'
import { type Project, type Task } from '../../types'
import { X, Copy, Edit3, Trash2, Plus } from 'lucide-react'
import { format, parseISO, isBefore, startOfDay } from 'date-fns'

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

    const projectTasks = tasks.filter(t => t.project_id === project.id);

    const today = startOfDay(new Date());

    const stats = {
        total: projectTasks.length,
        completed: projectTasks.filter(t => t.status?.includes('Hoàn thành')).length,
        inProgress: projectTasks.filter(t => t.status?.includes('Đang')).length,
        overdue: projectTasks.filter(t => {
            if (t.status?.includes('Hoàn thành')) return false;
            if (!t.due_date) return false;
            return isBefore(parseISO(t.due_date), today);
        }).length
    };

    const overallProgress = projectTasks.length > 0
        ? Math.round(projectTasks.reduce((acc, t) => acc + (t.completion_pct || 0), 0) / projectTasks.length)
        : 0;

    const getAssigneeName = (id: string | null) => {
        if (!id) return 'Chưa gán'
        const p = profiles.find(x => x.id === id)
        return p?.full_name || 'N/A'
    }

    const getPriorityBadge = (priority: string) => {
        if (priority === 'Khẩn cấp') return 'bg-red-50 text-red-600 border-red-100'
        if (priority === 'Cao') return 'bg-orange-50 text-orange-600 border-orange-100'
        if (priority === 'Trung bình') return 'bg-yellow-50 text-yellow-600 border-yellow-100'
        return 'bg-slate-50 text-slate-500 border-slate-100'
    }

    const getStatusStyle = (t: Task) => {
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

                    {/* Task List Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Danh sách nhiệm vụ ({stats.total})</h3>

                        <div className="space-y-4 pr-2">
                            {projectTasks.map(task => {
                                const statusStyle = getStatusStyle(task);
                                return (
                                    <div key={task.id} className={`bg-white rounded-2xl p-5 shadow-sm border-l-[6px] ${statusStyle.border} relative overflow-hidden group`}>

                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={task.status?.includes('Hoàn thành')}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        onToggleComplete(task);
                                                    }}
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
                                                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${getPriorityBadge(task.priority)}`}>
                                                            {task.priority}
                                                        </span>
                                                        {isBefore(parseISO(task.due_date || ''), today) && !task.status?.includes('Hoàn thành') && (
                                                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-red-50 text-red-500 border border-red-100`}>
                                                                Quá hạn
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right side actions and info */}
                                            <div className="flex flex-col items-end gap-3">
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {(currentUserProfile?.role === 'Admin' || project.manager_id === currentUserProfile?.id) && (
                                                        <button onClick={() => onCopyTask(task)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 shadow-sm border border-emerald-50">
                                                            <Copy size={14} />
                                                        </button>
                                                    )}
                                                    {(currentUserProfile?.role === 'Admin' || project.manager_id === currentUserProfile?.id || task.assignee_id === currentUserProfile?.id) && (
                                                        <button onClick={() => onEditTask(task)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 shadow-sm border border-blue-50">
                                                            <Edit3 size={14} />
                                                        </button>
                                                    )}
                                                    {(currentUserProfile?.role === 'Admin' || project.manager_id === currentUserProfile?.id) && (
                                                        <button onClick={() => onDeleteTask(task.id)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 shadow-sm border border-red-50">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1.5 justify-end text-sm font-bold text-slate-700 mb-1">
                                                        <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] text-slate-500">
                                                            {getAssigneeName(task.assignee_id).charAt(0)}
                                                        </div>
                                                        {getAssigneeName(task.assignee_id)}
                                                    </div>
                                                    <div className="text-xs font-semibold text-slate-500">
                                                        🗓 {task.due_date ? format(parseISO(task.due_date), 'dd/MM/yyyy') : '---'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Task Progress Bar */}
                                        <div className="flex items-center gap-3 mt-4">
                                            <span className="text-xs font-semibold text-slate-500">Tiến độ</span>
                                            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full ${task.completion_pct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${task.completion_pct}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-600">{task.completion_pct}%</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
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
