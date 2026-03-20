import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import { type Task, type Project } from '../../types'
import { Plus, Search, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { AddEditTaskModal } from '../tasks/AddEditTaskModal'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'

const KANBAN_COLUMNS = [
    { id: 'Cần làm', title: 'Cần làm', matchStatuses: ['Cần làm', 'Chưa bắt đầu'] },
    { id: 'Đang thực hiện', title: 'Đang thực hiện', matchStatuses: ['Đang thực hiện', 'Tạm dừng'] },
    { id: 'Chờ duyệt', title: 'Chờ duyệt', matchStatuses: ['Chờ duyệt'] },
    { id: 'Hoàn thành', title: 'Hoàn thành', matchStatuses: ['Hoàn thành'] }
]

export const Kanban = () => {
    const { profile, hasPermission } = useAuthStore()
    const canEdit = hasPermission(profile?.role?.trim(), 'Tab Công Việc (Sửa)')
    const [tasks, setTasks] = useState<Task[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [profiles, setProfiles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [initialTaskData, setInitialTaskData] = useState({ task_code: '', project_id: '' })

    // Filters
    const [search, setSearch] = useState('')
    const [dateFilter, setDateFilter] = useState<'today' | 'all'>('today')
    const [selectedProject, setSelectedProject] = useState('all')

    useEffect(() => {
        fetchAll()
    }, [profile])

    const fetchAll = async () => {
        try {
            setLoading(true)
            const [{ data: t }, { data: p }, { data: pr }] = await Promise.all([
                supabase.from('tasks').select('*').order('created_at', { ascending: true }),
                supabase.from('projects').select('*'),
                supabase.from('profiles').select('id, full_name, role, email')
            ])
            setTasks((t || []) as Task[])
            setProjects((p || []) as Project[])
            setProfiles(pr || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getAssignee = (id: string | string[] | null) => {
        if (!id || (Array.isArray(id) && id.length === 0)) return null
        const targetId = Array.isArray(id) ? id[0] : id;
        return profiles.find(x => x.id === targetId) || null
    }

    const generateNextTaskCode = (projectId: string) => {
        const projTasks = tasks.filter(t => t.project_id === projectId);
        let maxId = 0;
        projTasks.forEach(t => {
            const match = t.task_code.match(/-(\d+)$/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxId) maxId = num;
            }
        });
        const p = projects.find(x => x.id === projectId)
        const projCode = p?.project_code || ''
        return projCode ? `${projCode}-${String(maxId + 1).padStart(2, '0')}` : '';
    }

    const openEditModal = (t: Task) => {
        setEditingTask(t)
        setInitialTaskData({ task_code: t.task_code, project_id: t.project_id })
        setShowModal(true)
    }

    const openAddModalWithStatus = () => {
        setEditingTask(null)
        setInitialTaskData({ task_code: '', project_id: '' })
        setShowModal(true)
    }

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const taskId = draggableId;
        const toColumnId = destination.droppableId;
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        let newStatus = toColumnId;
        if (toColumnId === 'Cần làm') newStatus = 'Cần làm';
        if (toColumnId === 'Đang thực hiện') newStatus = 'Đang thực hiện';
        if (toColumnId === 'Chờ duyệt') newStatus = 'Chờ duyệt';

        const isCompleted = toColumnId === 'Hoàn thành';

        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                return { ...t, status: newStatus, completion_pct: isCompleted ? 100 : t.completion_pct };
            }
            return t;
        }));

        const { error } = await supabase.from('tasks').update({
            status: newStatus,
            completion_pct: isCompleted ? 100 : task.completion_pct,
            completion_date: isCompleted ? new Date().toLocaleDateString('sv-SE') : null
        }).eq('id', taskId);

        if (error) {
            console.error('Error updating task status:', error);
            fetchAll();
        }
    };

    const filteredTasks = tasks.filter(t => {
        const userRole = profile?.role;
        const isAssigned = t.assignee_id === profile?.id;
        const isSupporter = t.supporter_id === profile?.id;

        const isManagerOrAdmin = ['Admin', 'Quản lý', 'Giám đốc'].includes(userRole?.trim() || '');

        let isVisible = true;
        if (!isManagerOrAdmin) {
            isVisible = Boolean(isAssigned || isSupporter);
        }
        if (!isVisible) return false;

        const isPhase = tasks.some(other => other.parent_id === t.id);
        if (isPhase) return false;

        const matchSearch = (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (t.task_code || '').toLowerCase().includes(search.toLowerCase())

        if (!matchSearch) return false;

        if (selectedProject !== 'all' && t.project_id !== selectedProject) return false;

        if (dateFilter === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toLocaleDateString('sv-SE');

            const isOngoing = t.status === 'Đang thực hiện' || t.status === 'Chờ duyệt';
            const isCompletedToday = t.status === 'Hoàn thành' && t.completion_date === todayStr;
            let isRelevantTodo = false;

            if (t.status === 'Cần làm' || t.status === 'Chưa bắt đầu') {
                if (!t.due_date) {
                    isRelevantTodo = true;
                } else {
                    const dueDate = new Date(t.due_date);
                    dueDate.setHours(0, 0, 0, 0);
                    if (dueDate <= today) {
                        isRelevantTodo = true;
                    }
                }
            }

            if (!isOngoing && !isCompletedToday && !isRelevantTodo) return false;
        }

        return true;
    })

    if (loading) {
        return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
    }

    return (
        <div className="h-full flex flex-col space-y-6 max-w-[1600px] mx-auto min-h-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 px-1 md:px-0">
                <h1 className="text-xl font-bold text-slate-800 hidden md:block">Kanban Board</h1>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                        <button
                            onClick={() => setDateFilter('today')}
                            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${dateFilter === 'today' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Hôm nay
                        </button>
                        <button
                            onClick={() => setDateFilter('all')}
                            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${dateFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Tất cả
                        </button>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-48">
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none bg-white font-medium text-slate-700 h-[38px]"
                            >
                                <option value="all">Tất cả dự án</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>

                        <div className="relative flex-1 sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm kiếm nhiệm vụ..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 h-[38px]"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 md:min-h-[500px] hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    {KANBAN_COLUMNS.map(column => {
                        const colTasks = filteredTasks
                            .filter(t => column.matchStatuses.includes(t.status || 'Chưa bắt đầu'))
                            .sort((a, b) => (a.task_code || '').localeCompare(b.task_code || '', undefined, { numeric: true, sensitivity: 'base' }));

                        return (
                                <div
                                    key={column.id}
                                    className="w-[90vw] sm:w-[300px] md:flex-1 md:min-w-[300px] md:max-w-[400px] bg-[#f8fafc] rounded-2xl border border-slate-200 flex flex-col shrink-0 snap-center md:snap-align-none h-full max-h-full"
                                >
                                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-2xl shadow-sm shrink-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-700">{column.title}</h3>
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {colTasks.length}
                                        </span>
                                    </div>
                                    {canEdit && (
                                        <button
                                            onClick={() => openAddModalWithStatus()}
                                            className="text-slate-400 hover:text-indigo-600 transition-colors flex items-center justify-center w-11 h-11 md:w-8 md:h-8 hover:bg-slate-50 rounded-lg shrink-0"
                                            title={`Thêm nhiệm vụ "${column.title}"`}
                                        >
                                            <Plus size={20} className="md:w-[18px] md:h-[18px]" />
                                        </button>
                                    )}
                                </div>

                                <Droppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`flex-1 overflow-y-auto p-3 space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50 rounded-b-2xl' : ''}`}
                                        >
                                            {colTasks.map((task, index) => {
                                                const assignee = getAssignee(task.assignee_id)
                                                const childTasks = tasks.filter(ct => ct.parent_id === task.id);
                                                const totalSub = childTasks.length;
                                                const completedSub = childTasks.filter(ct => ct.status === 'Hoàn thành').length;
                                                const project = projects.find(p => p.id === task.project_id);
                                                const isDraggable = canEdit && Boolean(profile?.role === 'Admin' || profile?.role === 'Quản lý' || project?.manager_id === profile?.id || task.assignee_id === profile?.id);

                                                return (
                                                    <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!isDraggable}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                onClick={() => {
                                                                    if (!snapshot.isDragging && canEdit) {
                                                                        openEditModal(task);
                                                                    }
                                                                }}
                                                                className={`bg-white p-4 rounded-xl shadow-sm border transition-all cursor-pointer group flex flex-col
                                                                    ${snapshot.isDragging ? 'shadow-xl border-[#5B5FC7] rotate-1 scale-[1.02] z-50' : 'border-slate-200 hover:border-[#5B5FC7]/30 hover:shadow-md'}
                                                                `}
                                                                style={provided.draggableProps.style}
                                                            >
                                                                <div className="flex justify-between items-start mb-1.5 gap-2">
                                                                    <h4 className="font-bold text-slate-800 text-[14px] leading-tight group-hover:text-[#5B5FC7] transition-colors line-clamp-2 flex-1">
                                                                        {task.name}
                                                                    </h4>
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap shrink-0 max-h-[22px] flex items-center ${task.priority === 'Khẩn cấp' ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20' :
                                                                        task.priority === 'Cao' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                                            task.priority === 'Trung bình' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                                                'bg-slate-50 text-slate-500 border-slate-100'
                                                                        }`}>
                                                                        {task.priority || 'Trung bình'}
                                                                    </span>
                                                                </div>

                                                                <div className="text-[10px] font-medium text-slate-400 tracking-tight mb-3">
                                                                    {task.task_code}
                                                                </div>

                                                                <div className="w-full bg-slate-100 rounded-full h-2 mb-3.5 overflow-hidden">
                                                                    <div className="bg-[#5B5FC7] h-2 rounded-full transition-all" style={{ width: `${task.completion_pct || 0}%` }}></div>
                                                                </div>

                                                                <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-50">
                                                                    <div className="flex items-center gap-2">
                                                                        {task.due_date && (
                                                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                                                                                <Calendar size={10} className="text-slate-400" />
                                                                                {format(parseISO(task.due_date), 'dd/MM')}
                                                                            </div>
                                                                        )}
                                                                        {totalSub > 0 && (
                                                                            <div className="text-[9px] font-bold text-slate-400">
                                                                                {completedSub}/{totalSub}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center gap-1.5 min-h-[32px] bg-slate-50 px-2 py-1 rounded-lg shrink-0">
                                                                        <div className="w-5 h-5 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-[9px] font-bold text-indigo-700" title={assignee?.full_name || 'Chưa gán'}>
                                                                            {assignee?.full_name?.charAt(0) || '?'}
                                                                        </div>
                                                                        <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[80px]">
                                                                            {assignee?.full_name?.split(' ').pop() || 'Chưa gán'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                )
                                            })}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        )
                    })}
                </div>
            </DragDropContext>

            <AddEditTaskModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSaved={() => {
                    setShowModal(false);
                    fetchAll();
                }}
                editingTask={editingTask}
                initialData={initialTaskData}
                projects={projects}
                profiles={profiles}
                currentUserProfile={profile}
                generateNextTaskCode={generateNextTaskCode}
            />
        </div>
    )
}
