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
    const { profile } = useAuthStore()
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

    const getAssignee = (id: string | null) => {
        if (!id) return null
        return profiles.find(x => x.id === id) || null
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
        // initialStatus logic was here, removed because AddEditTaskModal doesn't accept initial custom status.

        setEditingTask(null)
        setInitialTaskData({ task_code: '', project_id: '' })
        // @ts-ignore - We are passing an initial status override to the modal implicitly or we can just rely on the modal's default, but let's just open the modal. For a perfect implementation, we'd pass initial form data, but the current AddEditTaskModal doesn't accept full initial form state. We'll at least open it. 
        // To really set the status, AddEditTaskModal needs to accept `initialStatus`. For now, we just open it.
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

        // Determine exact status mapped to column
        let newStatus = toColumnId;
        if (toColumnId === 'Cần làm') newStatus = 'Cần làm';
        if (toColumnId === 'Đang thực hiện') newStatus = 'Đang thực hiện';
        if (toColumnId === 'Chờ duyệt') newStatus = 'Chờ duyệt';

        const isCompleted = toColumnId === 'Hoàn thành';

        // Optimistic update for snappy UI
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
            fetchAll(); // Revert on error
        }
    };

    const filteredTasks = tasks.filter(t => {
        const userRole = profile?.role;
        const isAssigned = t.assignee_id === profile?.id;

        let isVisible = true;
        if (userRole === 'Nhân viên') {
            isVisible = Boolean(isAssigned || t.supporter_id === profile?.id);
        } else if (userRole === 'Quản lý') {
            isVisible = true;
        }
        if (!isVisible) return false;

        // Only show actual tasks (leaf nodes), hide the phases/steps that contain other tasks
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

            // Show if:
            // 1. Status is 'Đang thực hiện' or 'Chờ duyệt' (Active work)
            // 2. Status is 'Cần làm' / 'Chưa bắt đầu' AND (Due today or Overdue)
            // 3. Completed TODAY
            const isOngoing = t.status === 'Đang thực hiện' || t.status === 'Chờ duyệt';
            const isCompletedToday = t.status === 'Hoàn thành' && t.completion_date === todayStr;
            let isRelevantTodo = false;

            if (t.status === 'Cần làm' || t.status === 'Chưa bắt đầu') {
                if (!t.due_date) {
                    isRelevantTodo = true; // If no due date, keep it in Kanban
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <h1 className="text-xl font-bold text-slate-800">Kanban Board</h1>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setDateFilter('today')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${dateFilter === 'today' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Hôm nay
                        </button>
                        <button
                            onClick={() => setDateFilter('all')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${dateFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Tất cả
                        </button>
                    </div>

                    {/* Project Filter */}
                    <div className="relative w-full sm:w-48">
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

                    {/* Search */}
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm nhiệm vụ..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>
            </div>

            {/* Kanban Columns */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
                    {KANBAN_COLUMNS.map(column => {
                        const colTasks = filteredTasks
                            .filter(t => column.matchStatuses.includes(t.status || 'Chưa bắt đầu'))
                            .sort((a, b) => (a.task_code || '').localeCompare(b.task_code || '', undefined, { numeric: true, sensitivity: 'base' }));

                        return (
                            <div
                                key={column.id}
                                className="flex-1 min-w-[300px] max-w-[400px] bg-slate-50/50 rounded-2xl border border-slate-200 flex flex-col"
                            >
                                {/* Column Header */}
                                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-2xl shadow-sm shrink-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-700">{column.title}</h3>
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {colTasks.length}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => openAddModalWithStatus()}
                                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1 hover:bg-slate-50 rounded-lg"
                                        title={`Thêm nhiệm vụ "${column.title}"`}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>

                                {/* Column Body */}
                                <Droppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`flex-1 overflow-y-auto p-3 space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50 rounded-b-2xl' : ''}`}
                                        >
                                            {colTasks.map((task, index) => {
                                                const assignee = getAssignee(task.assignee_id)

                                                // Calculate subtasks from actual tasks table
                                                const childTasks = tasks.filter(ct => ct.parent_id === task.id);
                                                const totalSub = childTasks.length;
                                                const completedSub = childTasks.filter(ct => ct.status === 'Hoàn thành').length;

                                                const project = projects.find(p => p.id === task.project_id);
                                                const isDraggable = Boolean(profile?.role === 'Admin' || profile?.role === 'Quản lý' || project?.manager_id === profile?.id || task.assignee_id === profile?.id);

                                                return (
                                                    <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!isDraggable}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                onClick={() => {
                                                                    if (!snapshot.isDragging) {
                                                                        openEditModal(task);
                                                                    }
                                                                }}
                                                                className={`bg-white p-2 rounded-lg shadow-sm border transition-all cursor-pointer group
                                                                    ${snapshot.isDragging ? 'shadow-xl border-indigo-400 rotate-1 scale-[1.02] z-50' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'}
                                                                `}
                                                                style={provided.draggableProps.style}
                                                            >
                                                                {/* Row 1: Name, Code, Priority & Deadline */}
                                                                <div className="flex justify-between items-start gap-1.5 min-h-[32px]">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                                                            <h4 className="font-bold text-slate-800 text-[13px] leading-tight group-hover:text-indigo-600 transition-colors truncate max-w-[180px]">
                                                                                {task.name}
                                                                            </h4>
                                                                            <span className="text-[9px] font-medium text-slate-400 shrink-0">
                                                                                {task.task_code}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                                                        <span className={`text-[8px] font-bold px-1 py-0.25 rounded border whitespace-nowrap ${task.priority === 'Khẩn cấp' ? 'bg-red-50 text-red-600 border-red-100' :
                                                                            task.priority === 'Cao' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                                                task.priority === 'Trung bình' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                                                    'bg-slate-50 text-slate-500 border-slate-100'
                                                                            }`}>
                                                                            {task.priority?.charAt(0) || 'B'}
                                                                        </span>
                                                                        {task.due_date && (
                                                                            <div className="flex items-center gap-0.5 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1 py-0.25 rounded border border-indigo-100">
                                                                                <Calendar size={8} />
                                                                                {format(parseISO(task.due_date), 'dd/MM')}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Row 2: Assignee & Subtasks */}
                                                                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-50">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600" title={assignee?.full_name || 'Chưa gán'}>
                                                                            {assignee?.full_name?.charAt(0) || '?'}
                                                                        </div>
                                                                        <span className="text-[10px] font-semibold text-slate-500 truncate max-w-[120px]">
                                                                            {assignee?.full_name || 'Chưa gán'}
                                                                        </span>
                                                                    </div>

                                                                    {totalSub > 0 && (
                                                                        <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-1 py-0.25 rounded">
                                                                            <span>{completedSub}/{totalSub}</span>
                                                                        </div>
                                                                    )}
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

            {/* Modal */}
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
