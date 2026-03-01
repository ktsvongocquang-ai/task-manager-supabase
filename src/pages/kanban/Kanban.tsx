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
    { id: 'Cần làm', title: 'Cần làm', matchStatuses: ['Chưa bắt đầu', 'Cần làm'] },
    { id: 'Đang làm', title: 'Đang làm', matchStatuses: ['Đang thực hiện', 'Đang làm', 'Tạm dừng'] },
    { id: 'Chờ duyệt', title: 'Chờ duyệt', matchStatuses: ['Chờ duyệt'] },
    { id: 'Hoàn thành', title: 'Hoàn thành', matchStatuses: ['Hoàn thành', 'Hủy'] }
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

    useEffect(() => {
        fetchAll()
    }, [profile])

    const fetchAll = async () => {
        try {
            setLoading(true)
            const [{ data: t }, { data: p }, { data: pr }] = await Promise.all([
                supabase.from('tasks').select('*').order('created_at', { ascending: true }),
                supabase.from('projects').select('*'),
                supabase.from('profiles').select('id, full_name, role, email, avatar_url')
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
        if (toColumnId === 'Cần làm') newStatus = 'Chưa bắt đầu';
        if (toColumnId === 'Đang làm') newStatus = 'Đang thực hiện';

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
            completion_date: isCompleted ? new Date().toISOString().split('T')[0] : null
        }).eq('id', taskId);

        if (error) {
            console.error('Error updating task status:', error);
            fetchAll(); // Revert on error
        }
    };

    const filteredTasks = tasks.filter(t => {
        const userRole = profile?.role;
        const isAssigned = t.assignee_id === profile?.id;
        const project = projects.find(p => p.id === t.project_id);
        const isProjectManager = project && project.manager_id === profile?.id;

        let isVisible = true;
        if (userRole === 'Nhân viên') {
            isVisible = Boolean(isAssigned || isProjectManager || t.supporter_id === profile?.id);
        } else if (userRole === 'Quản lý') {
            isVisible = true;
        }
        if (!isVisible) return false;
        
        // ONLY SHOW TOP-LEVEL TASKS IN KANBAN
        if (t.parent_id) return false;

        const matchSearch = (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (t.task_code || '').toLowerCase().includes(search.toLowerCase())

        return matchSearch
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
                                    <button className="text-slate-400 hover:text-indigo-600 transition-colors">
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
                                                                    // Only open edit modal if we didn't just drag it
                                                                    if (provided.dragHandleProps && !snapshot.isDragging) {
                                                                        openEditModal(task);
                                                                    }
                                                                }}
                                                                className={`bg-white p-4 rounded-xl shadow-sm border transition-all cursor-pointer group
                                                                    ${snapshot.isDragging ? 'shadow-xl border-indigo-400 rotate-2 scale-105 z-50' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'}
                                                                    ${!isDraggable && !snapshot.isDragging ? 'opacity-80 cursor-not-allowed' : ''}
                                                                `}
                                                                style={provided.draggableProps.style}
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-sm font-black text-slate-800 tracking-tight">
                                                                            {task.task_code}
                                                                        </span>
                                                                        <h4 className="font-semibold text-slate-500 text-xs leading-tight group-hover:text-indigo-600 transition-colors">
                                                                            {task.name}
                                                                        </h4>
                                                                    </div>
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ml-2 ${task.priority === 'Khẩn cấp' ? 'bg-red-50 text-red-600 border-red-100' :
                                                                        task.priority === 'Cao' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                                            task.priority === 'Trung bình' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                                                'bg-slate-50 text-slate-500 border-slate-100'
                                                                        }`}>
                                                                        {task.priority || 'Bình thường'}
                                                                    </span>
                                                                </div>

                                                                <div className="flex flex-wrap items-center justify-between gap-y-2 mt-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600" title={assignee?.full_name || 'Chưa gán'}>
                                                                            {assignee?.full_name?.charAt(0) || '?'}
                                                                        </div>
                                                                        <span className="text-[11px] font-bold text-slate-600 truncate max-w-[80px]">
                                                                            {assignee?.full_name || 'Chưa gán'}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center gap-3">
                                                                        {task.due_date && (
                                                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                                                                <Calendar size={10} className="text-slate-400" />
                                                                                {format(parseISO(task.due_date), 'dd/MM')}
                                                                            </div>
                                                                        )}

                                                                        {totalSub > 0 && (
                                                                            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                                                                                <span>{completedSub}/{totalSub}</span>
                                                                            </div>
                                                                        )}
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
