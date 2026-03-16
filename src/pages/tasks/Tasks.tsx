import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import { type Task, type Project } from '../../types'
import { Plus, Search, Edit3, Trash2, Copy, ChevronDown, ChevronRight, ExternalLink, GripVertical, List, CheckCircle2, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { AddEditTaskModal } from './AddEditTaskModal'
import { logActivity } from '../../services/activity'

export const Tasks = () => {
    const navigate = useNavigate();
    const { profile } = useAuthStore()
    const [tasks, setTasks] = useState<Task[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [profiles, setProfiles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [assigneeFilter, setAssigneeFilter] = useState('')
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
    const [showModal, setShowModal] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [initialTaskData, setInitialTaskData] = useState({ task_code: '', project_id: '' })
    const [expandedMobileGroups, setExpandedMobileGroups] = useState<Set<string>>(new Set(['Chưa bắt đầu', 'Đang thực hiện']))

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
            if (p) {
                // By default expand projects that have tasks
                const projectsWithTasks = new Set((t || []).map(x => x.project_id))
                setExpandedProjects(projectsWithTasks)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getProjectCode = (id: string) => {
        const p = projects.find(x => x.id === id)
        return p?.project_code || ''
    }

    const getAssigneeName = (id: string | null) => {
        if (!id) return 'Chưa gán'
        const p = profiles.find(x => x.id === id)
        return p?.full_name || 'N/A'
    }

    const baseFilteredTasks = tasks.filter(t => {
        const userRole = profile?.role;
        const isAssigned = t.assignee_id === profile?.id;
        const isSupporter = t.supporter_id === profile?.id;

        const isManagerOrAdmin = ['Admin', 'Quản lý', 'Giám đốc'].includes(userRole?.trim() || '');

        let isVisible = true;
        if (!isManagerOrAdmin) {
            isVisible = Boolean(isAssigned || isSupporter);
        }

        if (!isVisible) return false;

        const matchSearch = (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (t.task_code || '').toLowerCase().includes(search.toLowerCase())
        const matchAssignee = assigneeFilter ? t.assignee_id === assigneeFilter : true
        return matchSearch && matchAssignee
    })

    const statusCounts = {
        'Chưa bắt đầu': baseFilteredTasks.filter(t => !tasks.some(x => x.parent_id === t.id) && (t.status === 'Chưa bắt đầu' || t.status === 'Mới tạo' || t.status === 'Cần làm')).length,
        'Đang thực hiện': baseFilteredTasks.filter(t => !tasks.some(x => x.parent_id === t.id) && (t.status === 'Đang thực hiện')).length,
        'Chờ duyệt': baseFilteredTasks.filter(t => !tasks.some(x => x.parent_id === t.id) && (t.status === 'Chờ duyệt')).length,
        'Hoàn thành': baseFilteredTasks.filter(t => !tasks.some(x => x.parent_id === t.id) && t.status?.includes('Hoàn thành')).length,
        'Tạm dừng': baseFilteredTasks.filter(t => !tasks.some(x => x.parent_id === t.id) && (t.status?.includes('Tạm dừng') || t.status?.includes('Hủy'))).length,
    }

    const filteredTasks = baseFilteredTasks.filter(t => {
        if (!statusFilter) return true;
        if (statusFilter === 'Chưa bắt đầu') return t.status === 'Chưa bắt đầu' || t.status === 'Mới tạo' || t.status === 'Cần làm';
        if (statusFilter === 'Đang thực hiện') return t.status === 'Đang thực hiện';
        if (statusFilter === 'Chờ duyệt') return t.status === 'Chờ duyệt';
        if (statusFilter === 'Hoàn thành') return t.status?.includes('Hoàn thành');
        if (statusFilter === 'Tạm dừng') return t.status?.includes('Tạm dừng') || t.status?.includes('Hủy');
        return t.status === statusFilter;
    })

    const groupedTasks: Record<string, Task[]> = {}
    filteredTasks.forEach(t => {
        if (!groupedTasks[t.project_id]) groupedTasks[t.project_id] = []
        groupedTasks[t.project_id].push(t)
    })

    Object.keys(groupedTasks).forEach(projectId => {
        groupedTasks[projectId].sort((a, b) => {
            const aCode = a.task_code || '';
            const bCode = b.task_code || '';
            const aMatch = aCode.match(/(\d+)$/);
            const bMatch = bCode.match(/(\d+)$/);
            if (aMatch && bMatch) {
                return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
            }
            return aCode.localeCompare(bCode, undefined, { numeric: true, sensitivity: 'base' });
        });
    });

    const toggleProject = (id: string) => {
        const next = new Set(expandedProjects)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setExpandedProjects(next)
    }

    const toggleMobileGroup = (id: string) => {
        const next = new Set(expandedMobileGroups)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setExpandedMobileGroups(next)
    }

    const getStatusBadge = (status: string) => {
        if (status?.includes('Hoàn thành')) return 'bg-emerald-500 text-white'
        if (status === 'Đang thực hiện') return 'bg-blue-400 text-white'
        if (status === 'Chờ duyệt') return 'bg-indigo-400 text-white'
        if (status?.includes('Tạm dừng')) return 'bg-amber-400 text-white'
        if (status?.includes('Hủy')) return 'bg-red-400 text-white'
        return 'bg-slate-200 text-slate-600'
    }

    const getDueDateStyle = (dueDate: string | null | undefined, status: string | undefined): string => {
        if (!dueDate || status?.includes('Hoàn thành')) return 'text-slate-500';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = parseISO(dueDate);

        if (format(due, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
            return 'text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200';
        }

        if (due < today) {
            return 'text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200';
        }
        return 'text-slate-500';
    };

    const getPriorityBadge = (priority: string) => {
        if (priority === 'Khẩn cấp') return 'bg-red-50 text-red-600 border-red-100'
        if (priority === 'Cao') return 'bg-orange-50 text-orange-600 border-orange-100'
        if (priority === 'Trung bình') return 'bg-yellow-50 text-yellow-600 border-yellow-100'
        return 'bg-slate-50 text-slate-500 border-slate-100'
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
        const projCode = getProjectCode(projectId);
        return projCode ? `${projCode}-${String(maxId + 1).padStart(2, '0')}` : '';
    }

    const openAddModal = (projectId?: string) => {
        setEditingTask(null)
        const nextCode = projectId ? generateNextTaskCode(projectId) : ''
        setInitialTaskData({ task_code: nextCode, project_id: projectId || '' })
        setShowModal(true)
    }

    const openEditModal = (t: Task) => {
        setEditingTask(t)
        setInitialTaskData({ task_code: t.task_code, project_id: t.project_id })
        setShowModal(true)
    }



    const toggleComplete = async (task: Task) => {
        const isCompleted = task.status?.includes('Hoàn thành')
        const newStatus = isCompleted ? 'Đang thực hiện' : 'Hoàn thành'
        const newPct = isCompleted ? 50 : 100
        const newDate = !isCompleted ? new Date().toLocaleDateString('sv-SE') : null

        const { error } = await supabase.from('tasks').update({
            status: newStatus,
            completion_pct: newPct,
            completion_date: newDate
        }).eq('id', task.id)

        if (error) console.error(error)
        fetchAll()
    }

    const updateTaskField = async (taskId: string, field: string, value: any) => {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value } : t));

        try {
            const { error } = await supabase.from('tasks').update({ [field]: value }).eq('id', taskId);
            if (error) throw error;

            // Log activity if needed
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                await logActivity('Sửa nhanh', `Cập nhật ${field}: ${value} (Nhiệm vụ: ${task.name})`, task.project_id);
            }
        } catch (err) {
            console.error(`Error updating task ${field}:`, err);
            fetchAll(); // Revert on error
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa nhiệm vụ này?')) return
        await supabase.from('tasks').delete().eq('id', id)
        fetchAll()
    }

    const handleCopy = async (t: Task) => {
        try {
            const nextCode = generateNextTaskCode(t.project_id)
            const { id, created_at, ...rest } = t as any
            const payload = {
                ...rest,
                task_code: nextCode,
                name: `${t.name} (Bản sao)`,
                completion_pct: 0,
                result_links: null,
                output: null
            }

            const { error } = await supabase.from('tasks').insert(payload)
            if (error) {
                console.error('Task Copy Error:', error)
                alert(`Lỗi sao chép nhiệm vụ: ${error.message}`)
            } else {
                fetchAll()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Ensure we're dragging within the same parent
        if (source.droppableId !== destination.droppableId) {
            alert("Chỉ có thể sắp xếp nhiệm vụ trong cùng một Giai đoạn.");
            return;
        }

        const parentId = source.droppableId;
        const allChildTasks = tasks.filter(t => t.parent_id === parentId)
            // Need to sort them by current task_code to reflect visual order before moving
            .sort((a, b) => (a.task_code || '').localeCompare(b.task_code || '', undefined, { numeric: true }));

        const draggedTaskIndex = allChildTasks.findIndex(t => t.id === draggableId);
        if (draggedTaskIndex === -1) return;

        const draggedTask = allChildTasks[draggedTaskIndex];

        // Create a new array and move the item
        const newChildArray = Array.from(allChildTasks);
        newChildArray.splice(source.index, 1);
        newChildArray.splice(destination.index, 0, draggedTask);

        // Find parent to construct the new prefix
        const parentTask = tasks.find(t => t.id === parentId);
        if (!parentTask) return;

        const parentCode = parentTask.task_code; // e.g. (PR02)-INF-PHASE-1

        // 1. Optimistically update UI
        setTasks(prevTasks => {
            const nextTasks = [...prevTasks];
            newChildArray.forEach((child, idx) => {
                const newCode = `${parentCode.replace('-PHASE', '')}.${idx + 1}`;
                const tIndex = nextTasks.findIndex(t => t.id === child.id);
                if (tIndex > -1) {
                    nextTasks[tIndex] = { ...nextTasks[tIndex], task_code: newCode };
                }
            });
            return nextTasks;
        });

        // 2. Perform DB Updates sequentially
        try {
            for (let i = 0; i < newChildArray.length; i++) {
                const child = newChildArray[i];
                const newCode = `${parentCode.replace('-PHASE', '')}.${i + 1}`;
                await supabase.from('tasks').update({ task_code: newCode }).eq('id', child.id);
            }
        } catch (err) {
            console.error('Lỗi khi cập nhật vị trí:', err);
            fetchAll(); // revert on fail
        }
    }

    const mobileGroups = [
        { id: 'todo', label: 'Cần làm', items: filteredTasks.filter(t => !tasks.some(x => x.parent_id === t.id) && (t.status === 'Cần làm' || t.status === 'Chưa bắt đầu' || t.status === 'Mới tạo')) },
        { id: 'in_progress', label: 'Đang thực hiện', items: filteredTasks.filter(t => !tasks.some(x => x.parent_id === t.id) && (t.status === 'Đang thực hiện' || t.status === 'Tạm dừng')) },
        { id: 'review', label: 'Chờ duyệt', items: filteredTasks.filter(t => !tasks.some(x => x.parent_id === t.id) && t.status === 'Chờ duyệt') },
        { id: 'done', label: 'Hoàn thành', items: filteredTasks.filter(t => !tasks.some(x => x.parent_id === t.id) && t.status?.includes('Hoàn thành')) }
    ];

    if (loading) {
        return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
    }

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Mobile Header (Lark style) */}
            <div className="md:hidden flex items-center justify-between mt-[-10px] mb-2 px-1 gap-2">
                <button className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 transition-colors shrink-0">
                    <List size={22} />
                </button>
                <div className="flex bg-slate-100/80 rounded-full p-1 flex-1 max-w-[200px] justify-center text-sm shadow-inner overflow-hidden border border-slate-200/50">
                    <button 
                        className={`flex-1 min-w-0 px-2 py-1.5 rounded-full font-bold transition-all duration-300 truncate ${!assigneeFilter ? 'bg-white text-[#5B5FC7] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        onClick={() => setAssigneeFilter('')}
                    >
                        Tất cả
                    </button>
                    <button 
                        className={`flex-1 min-w-0 px-2 py-1.5 rounded-full font-bold transition-all duration-300 truncate ${assigneeFilter === profile?.id ? 'bg-white text-[#5B5FC7] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        onClick={() => setAssigneeFilter(profile?.id || '')}
                    >
                        Của tôi
                    </button>
                </div>
                <button 
                    onClick={() => navigate('/schedule')} 
                    className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-[#5B5FC7] rounded-full hover:bg-indigo-100 transition-colors shadow-sm shrink-0"
                    title="Xem lịch trình"
                >
                    <Calendar size={20} />
                </button>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-xl font-bold text-slate-800 shrink-0">Quản lý nhiệm vụ</h1>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {profile?.role !== 'Nhân viên' && (
                        <select
                            value={assigneeFilter}
                            onChange={(e) => setAssigneeFilter(e.target.value)}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[200px] truncate"
                        >
                            <option value="">Tất cả nhân sự</option>
                            {profiles.map(p => (
                                <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                            ))}
                        </select>
                    )}
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
                    <button
                        onClick={() => openAddModal()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm"
                    >
                        <Plus size={18} /> Tạo mới nhiệm vụ
                    </button>
                </div>
            </div>

            {/* Status Tabs - Desktop Only */}
            <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {Object.entries(statusCounts).map(([status, count]) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                        className={`bg-white border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all shadow-sm ${statusFilter === status ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-100 hover:border-slate-200'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${status === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-600' :
                            status === 'Đang thực hiện' ? 'bg-blue-50 text-blue-600' :
                                status === 'Chờ duyệt' ? 'bg-indigo-50 text-indigo-600' :
                                    status === 'Tạm dừng' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                            }`}>
                            {count}
                        </div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{status}</span>
                    </button>
                ))}
            </div>

            {/* Grouped Tasks Table - Desktop Only */}
            <div className="hidden md:block space-y-4">
                {Object.entries(groupedTasks).map(([projectId, projectTasks]) => {
                    const project = projects.find(p => p.id === projectId)
                    const isExpanded = expandedProjects.has(projectId)

                    return (
                        <div key={projectId} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            {/* Project Header Accordion */}
                            <div
                                onClick={() => toggleProject(projectId)}
                                className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-slate-400">
                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-3">
                                        {project?.name} ({project?.project_code})
                                        {project?.start_date && project?.end_date && (() => {
                                            const start = parseISO(project.start_date);
                                            const end = parseISO(project.end_date);
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);

                                            const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                                            const remainingDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                                            return (
                                                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                                    <span className="text-indigo-600 font-bold">{format(start, 'dd/MM/yyyy')}</span>
                                                    <span>→</span>
                                                    <span className="text-rose-600 font-bold">{format(end, 'dd/MM/yyyy')}</span>
                                                    <span className="mx-1 text-slate-300">|</span>
                                                    <span>Tổng: <strong className="text-slate-700">{totalDays} ngày</strong></span>
                                                    <span className="mx-1 text-slate-300">|</span>
                                                    <span>Còn lại: <strong className={remainingDays < 0 ? 'text-red-500' : remainingDays <= 3 ? 'text-orange-500' : 'text-emerald-500'}>{remainingDays} ngày</strong></span>
                                                </div>
                                            );
                                        })()}
                                    </h3>
                                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-100">
                                        {projectTasks.filter(t => !t.parent_id).length} NHIỆM VỤ
                                    </span>
                                </div>
                                {(profile?.role === 'Admin' || project?.manager_id === profile?.id) && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openAddModal(projectId); }}
                                        className="text-xs font-bold text-indigo-600 hover:underline"
                                    >
                                        + THÊM NHIỆM VỤ
                                    </button>
                                )}
                            </div>

                            {/* Tasks Table */}
                            {isExpanded && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-slate-50/30 border-b border-slate-100 text-slate-500 uppercase font-bold tracking-wider">
                                                <th className="px-5 py-3 text-left w-[40px] min-w-[40px]"></th>
                                                <th className="px-5 py-3 text-left w-[40px] min-w-[40px]">
                                                    <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                                </th>
                                                <th className="px-4 py-3 text-left min-w-[250px]">Nhiệm vụ</th>
                                                <th className="px-4 py-3 text-left w-[150px] min-w-[150px]">Chủ trì</th>
                                                <th className="px-4 py-3 text-left w-[140px] min-w-[140px]">Trạng thái</th>
                                                <th className="px-4 py-3 text-left w-[120px] min-w-[120px]">Ưu tiên</th>
                                                <th className="px-4 py-3 text-left w-[140px] min-w-[140px]">Tiến độ</th>
                                                <th className="px-4 py-3 text-left w-[100px] min-w-[100px]">Kết quả</th>
                                                <th className="px-4 py-3 text-left w-[120px] min-w-[120px]">Hạn chót</th>
                                                <th className="px-4 py-3 text-center w-[120px] min-w-[120px]">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <DragDropContext onDragEnd={onDragEnd}>
                                            {(() => {
                                                // 1. Identify all parent tasks that are either directly in projectTasks OR have a child in projectTasks
                                                const visibleParentIds = new Set<string>();

                                                projectTasks.forEach(t => {
                                                    if (!t.parent_id) {
                                                        visibleParentIds.add(t.id);
                                                    } else {
                                                        visibleParentIds.add(t.parent_id);
                                                    }
                                                });

                                                // We need to fetch the parent tasks that might not match the filter but are needed for child display
                                                const allProjectTasksDB = tasks.filter(t => t.project_id === projectId);
                                                const parentsToRender = allProjectTasksDB.filter(t => !t.parent_id && visibleParentIds.has(t.id));

                                                // Sort parent tasks visually by extracting trailing numbers first (works for Phase-1 vs P3)
                                                parentsToRender.sort((a, b) => {
                                                    const aCode = a.task_code || '';
                                                    const bCode = b.task_code || '';
                                                    const aMatch = aCode.match(/(\d+)$/);
                                                    const bMatch = bCode.match(/(\d+)$/);
                                                    if (aMatch && bMatch) {
                                                        return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
                                                    }
                                                    return aCode.localeCompare(bCode, undefined, { numeric: true, sensitivity: 'base' });
                                                });

                                                return parentsToRender.map((task) => {
                                                    const renderParentRow = (t: Task, overridePct?: number) => {
                                                        let subTasks: any[] = [];
                                                        try {
                                                            if (t.notes && t.notes.startsWith('[')) subTasks = JSON.parse(t.notes);
                                                        } catch (e) { subTasks = []; }

                                                        const totalSub = subTasks.length;
                                                        const completedSub = subTasks.filter(st => st.completed).length;

                                                        const displayPct = overridePct !== undefined
                                                            ? overridePct
                                                            : (totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : t.completion_pct);

                                                        return (
                                                            <tr key={t.id} onClick={() => openEditModal(t)} className={`hover:bg-slate-50/50 transition-colors cursor-pointer group bg-white border-b border-slate-50`}>
                                                                <td className="px-2 py-3 w-[40px] min-w-[40px]"></td>
                                                                <td className="px-5 py-3 w-[40px] min-w-[40px]" onClick={(e) => e.stopPropagation()}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={t.status?.includes('Hoàn thành')}
                                                                        onChange={() => toggleComplete(t)}
                                                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                                        disabled={!(profile?.role === 'Admin' || profile?.role === 'Quản lý' || project?.manager_id === profile?.id || t.assignee_id === profile?.id)}
                                                                    />
                                                                </td>
                                                                <td className={`px-4 py-3 min-w-[250px]`}>
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-0.5">
                                                                            <p className={`font-bold leading-tight ${t.status?.includes('Hoàn thành') ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{t.name}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-[10px] text-slate-400 font-medium">{t.task_code}</p>
                                                                            {totalSub > 0 && (
                                                                                <span className="text-[11px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                                                    {completedSub}/{totalSub}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-600 font-medium w-[150px] min-w-[150px]">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                                                                            {getAssigneeName(t.assignee_id).charAt(0)}
                                                                        </div>
                                                                        <select
                                                                            value={t.assignee_id || ''}
                                                                            onChange={(e) => updateTaskField(t.id, 'assignee_id', e.target.value || null)}
                                                                            className="bg-transparent border-none focus:ring-0 p-0 text-xs font-medium text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors w-full"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <option value="">Chưa gán</option>
                                                                            {profiles.map(p => (
                                                                                <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 w-[140px] min-w-[140px]">
                                                                    <select
                                                                        value={t.status}
                                                                        onChange={(e) => updateTaskField(t.id, 'status', e.target.value)}
                                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm border-none focus:ring-0 cursor-pointer ${getStatusBadge(t.status)}`}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                                                                        <option value="Cần làm">Cần làm</option>
                                                                        <option value="Đang thực hiện">Đang thực hiện</option>
                                                                        <option value="Chờ duyệt">Chờ duyệt</option>
                                                                        <option value="Hoàn thành">Hoàn thành</option>
                                                                        <option value="Tạm dừng">Tạm dừng</option>
                                                                    </select>
                                                                </td>
                                                                <td className="px-4 py-3 w-[120px] min-w-[120px]">
                                                                    <select
                                                                        value={t.priority}
                                                                        onChange={(e) => updateTaskField(t.id, 'priority', e.target.value)}
                                                                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-none focus:ring-0 cursor-pointer ${getPriorityBadge(t.priority)}`}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <option value="Thấp">Thấp</option>
                                                                        <option value="Trung bình">Trung bình</option>
                                                                        <option value="Cao">Cao</option>
                                                                        <option value="Khẩn cấp">Khẩn cấp</option>
                                                                    </select>
                                                                </td>
                                                                <td className="px-4 py-3 w-[140px] min-w-[140px]">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-16 bg-slate-100 rounded-full h-1.5 flex-1">
                                                                            <div
                                                                                className={`h-1.5 rounded-full ${displayPct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                                                style={{ width: `${displayPct}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <span className="font-bold text-slate-500 min-w-[3ch]">{displayPct}%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 w-[100px] min-w-[100px]">
                                                                    {t.result_links ? (
                                                                        <a href={t.result_links} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 font-bold">
                                                                            <ExternalLink size={12} /> LINK
                                                                        </a>
                                                                    ) : <span className="text-slate-400">---</span>}
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap w-[120px] min-w-[120px]">
                                                                    <div className="flex flex-col gap-1 items-start">
                                                                        {t.due_date ? <span className={getDueDateStyle(t.due_date, t.status)}>{format(parseISO(t.due_date), 'dd/MM/yyyy')}</span> : <span>---</span>}
                                                                        {t.start_date && t.due_date && (
                                                                            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100" title={`Từ ${format(parseISO(t.start_date), 'dd/MM/yyyy')}`}>
                                                                                {Math.max(0, Math.ceil((new Date(t.due_date).getTime() - new Date(t.start_date).getTime()) / (1000 * 60 * 60 * 24))) + 1} ngày
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 w-[120px] min-w-[120px]">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleCopy(t); }}
                                                                            className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center border border-blue-100 hover:bg-blue-100 transition-opacity"
                                                                        >
                                                                            <Copy size={13} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); openEditModal(t); }}
                                                                            className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center border border-amber-100 hover:bg-amber-100 transition-opacity"
                                                                        >
                                                                            <Edit3 size={13} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                                                                            className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-red-50 text-red-500 rounded-lg flex items-center justify-center border border-red-100 hover:bg-red-100 transition-opacity"
                                                                        >
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    };

                                                    // Find children to render inside Droppable (only those matching current filters)
                                                    const childTasks = projectTasks
                                                        .filter(child => child.parent_id === task.id)
                                                        .sort((a, b) => (a.task_code || '').localeCompare(b.task_code || '', undefined, { numeric: true }));

                                                    // We need ALL children for the parent % calculation, regardless of filters
                                                    const allChildTasksDB = allProjectTasksDB.filter(child => child.parent_id === task.id);

                                                    // Compute dynamic % for Parent phase based on children completion
                                                    let phaseDisplayPct = task.completion_pct;
                                                    if (allChildTasksDB.length > 0) {
                                                        const completedChildren = allChildTasksDB.filter(c => c.status?.includes('Hoàn thành')).length;
                                                        phaseDisplayPct = Math.round((completedChildren / allChildTasksDB.length) * 100);
                                                    }

                                                    return (
                                                        <Droppable droppableId={task.id} type="task" key={task.id}>
                                                            {(provided) => (
                                                                <tbody
                                                                    ref={provided.innerRef}
                                                                    {...provided.droppableProps}
                                                                    className="divide-y divide-slate-50"
                                                                >
                                                                    {/* Parent Row */}
                                                                    {renderParentRow(task, phaseDisplayPct)}

                                                                    {/* Child Rows */}
                                                                    {childTasks.map((child, index) => {
                                                                        const isCompleted = child.status?.includes('Hoàn thành');
                                                                        return (
                                                                            <Draggable key={child.id} draggableId={child.id} index={index}>
                                                                                {(provided, snapshot) => (
                                                                                    <tr
                                                                                        ref={provided.innerRef}
                                                                                        {...provided.draggableProps}
                                                                                        onClick={() => openEditModal(child)}
                                                                                        className={`group cursor-pointer hover:bg-slate-50/50 hover:shadow-sm transition-all duration-200 border-b border-slate-50 last:border-none relative
                                                                                        ${snapshot.isDragging ? 'bg-indigo-50 shadow-lg border-indigo-200 z-50 rounded-xl' : 'bg-slate-50/30'}
                                                                                    `}
                                                                                        style={{ ...provided.draggableProps.style }}
                                                                                    >
                                                                                        {/* 1. Drag Handle */}
                                                                                        <td className="px-2 py-3 relative z-10 w-[40px] min-w-[40px]">
                                                                                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 group-hover:bg-indigo-300 transition-colors z-0 pointer-events-none"></div>
                                                                                            <div className="flex justify-center relative z-10 w-full h-full">
                                                                                                <div {...provided.dragHandleProps} className="text-slate-300 group-hover:text-slate-500 cursor-grab px-1">
                                                                                                    <GripVertical size={14} />
                                                                                                </div>
                                                                                            </div>
                                                                                        </td>

                                                                                        {/* 2. Checkbox */}
                                                                                        <td className="px-5 py-3 relative z-10 w-[40px] min-w-[40px]" onClick={(e) => e.stopPropagation()}>
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={isCompleted}
                                                                                                onChange={(e) => { e.stopPropagation(); toggleComplete(child); }}
                                                                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                                                                disabled={!(profile?.role === 'Admin' || profile?.role === 'Quản lý' || project?.manager_id === profile?.id || child.assignee_id === profile?.id)}
                                                                                            />
                                                                                        </td>

                                                                                        {/* 3. Name */}
                                                                                        <td className="px-4 py-3 relative z-10 min-w-[250px]">
                                                                                            <div className="pl-6">
                                                                                                <div className="flex items-center gap-2 mb-0.5 relative">
                                                                                                    <div className="absolute -left-4 top-1/2 -mt-1 w-3 h-3 border-b-2 border-l-2 border-slate-300 rounded-bl shrink-0"></div>
                                                                                                    <p className={`font-bold leading-tight ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{child.name}</p>
                                                                                                </div>
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <p className="text-[10px] text-slate-400 font-medium">{child.task_code}</p>
                                                                                                </div>
                                                                                            </div>
                                                                                        </td>

                                                                                        {/* 4. Assignee */}
                                                                                        <td className="px-4 py-3 text-slate-600 font-medium relative z-10 w-[150px] min-w-[150px]">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                                                                                                    {getAssigneeName(child.assignee_id).charAt(0)}
                                                                                                </div>
                                                                                                <select
                                                                                                    value={child.assignee_id || ''}
                                                                                                    onChange={(e) => updateTaskField(child.id, 'assignee_id', e.target.value || null)}
                                                                                                    className="bg-transparent border-none focus:ring-0 p-0 text-xs font-medium text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors w-full"
                                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                                >
                                                                                                    <option value="">Chưa gán</option>
                                                                                                    {profiles.map(p => (
                                                                                                        <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                                                                                                    ))}
                                                                                                </select>
                                                                                            </div>
                                                                                        </td>

                                                                                        {/* 5. Status */}
                                                                                        <td className="px-4 py-3 relative z-10 w-[140px] min-w-[140px]">
                                                                                            <select
                                                                                                value={child.status}
                                                                                                onChange={(e) => updateTaskField(child.id, 'status', e.target.value)}
                                                                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm border-none focus:ring-0 cursor-pointer ${getStatusBadge(child.status)}`}
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                            >
                                                                                                <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                                                                                                <option value="Cần làm">Cần làm</option>
                                                                                                <option value="Đang thực hiện">Đang thực hiện</option>
                                                                                                <option value="Hoàn thành">Hoàn thành</option>
                                                                                                <option value="Tạm dừng">Tạm dừng</option>
                                                                                            </select>
                                                                                        </td>

                                                                                        {/* 6. Priority */}
                                                                                        <td className="px-4 py-3 relative z-10 w-[120px] min-w-[120px]">
                                                                                            <select
                                                                                                value={child.priority}
                                                                                                onChange={(e) => updateTaskField(child.id, 'priority', e.target.value)}
                                                                                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-none focus:ring-0 cursor-pointer ${getPriorityBadge(child.priority)}`}
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                            >
                                                                                                <option value="Thấp">Thấp</option>
                                                                                                <option value="Trung bình">Trung bình</option>
                                                                                                <option value="Cao">Cao</option>
                                                                                                <option value="Khẩn cấp">Khẩn cấp</option>
                                                                                            </select>
                                                                                        </td>

                                                                                        {/* 7. Progress */}
                                                                                        <td className="px-4 py-3 relative z-10 w-[140px] min-w-[140px]">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <div className="w-16 bg-slate-100 rounded-full h-1.5 flex-1 max-w-[80px]">
                                                                                                    <div
                                                                                                        className={`h-1.5 rounded-full ${child.completion_pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                                                                        style={{ width: `${child.completion_pct}%` }}
                                                                                                    ></div>
                                                                                                </div>
                                                                                                <span className="font-bold text-slate-500 min-w-[3ch]">{child.completion_pct}%</span>
                                                                                            </div>
                                                                                        </td>

                                                                                        {/* 8. Link */}
                                                                                        <td className="px-4 py-3 relative z-10 w-[100px] min-w-[100px]">
                                                                                            {child.result_links ? (
                                                                                                <a href={child.result_links} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 font-bold uppercase">
                                                                                                    <ExternalLink size={12} className="shrink-0" /> <span className="truncate max-w-[100px] inline-block">LINK</span>
                                                                                                </a>
                                                                                            ) : <span className="text-slate-400">---</span>}
                                                                                        </td>

                                                                                        <td className="px-4 py-3 text-slate-500 font-medium relative z-10 whitespace-nowrap w-[120px] min-w-[120px]">
                                                                                            <div className="flex flex-col gap-1 items-start">
                                                                                                {child.due_date ? <span className={getDueDateStyle(child.due_date, child.status)}>{format(parseISO(child.due_date), 'dd/MM/yyyy')}</span> : <span>---</span>}
                                                                                                {child.start_date && child.due_date && (
                                                                                                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100" title={`Từ ${format(parseISO(child.start_date), 'dd/MM/yyyy')}`}>
                                                                                                        {Math.max(0, Math.ceil((new Date(child.due_date).getTime() - new Date(child.start_date).getTime()) / (1000 * 60 * 60 * 24))) + 1} ngày
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        </td>

                                                                                        {/* 10. Actions */}
                                                                                        <td className="px-4 py-3 relative z-10 w-[120px] min-w-[120px]">
                                                                                            <div className="flex items-center justify-center gap-2">
                                                                                                <button
                                                                                                    onClick={(e) => { e.stopPropagation(); handleCopy(child); }}
                                                                                                    className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center border border-blue-100 hover:bg-blue-100 transition-opacity shrink-0"
                                                                                                >
                                                                                                    <Copy size={13} />
                                                                                                </button>
                                                                                                <button
                                                                                                    onClick={(e) => { e.stopPropagation(); openEditModal(child); }}
                                                                                                    className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center border border-amber-100 hover:bg-amber-100 transition-opacity shrink-0"
                                                                                                >
                                                                                                    <Edit3 size={13} />
                                                                                                </button>
                                                                                                <button
                                                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(child.id); }}
                                                                                                    className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-red-50 text-red-500 rounded-lg flex items-center justify-center border border-red-100 hover:bg-red-100 transition-opacity shrink-0"
                                                                                                >
                                                                                                    <Trash2 size={13} />
                                                                                                </button>
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                )}
                                                                            </Draggable>
                                                                        );
                                                                    })}
                                                                    {provided.placeholder}
                                                                </tbody>
                                                            )}
                                                        </Droppable>
                                                    )
                                                });
                                            })()}
                                            {/* End Task Table Rows */}
                                        </DragDropContext>
                                    </table>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* End Desktop UI */}

            {/* Mobile Accordion Task List (Lark style) */}
            <div className="md:hidden pb-24 border-y border-slate-200 mt-2 bg-white">
                {mobileGroups.map((group, index) => {
                    const isExpanded = expandedMobileGroups.has(group.id);
                    const isLast = index === mobileGroups.length - 1;
                    return (
                        <div key={group.id} className={`bg-white overflow-hidden flex flex-col ${!isLast ? 'border-b border-slate-100' : ''}`}>
                            {/* Accordion Header */}
                            <div 
                                onClick={() => toggleMobileGroup(group.id)}
                                className={`p-4 flex items-center justify-between bg-white cursor-pointer active:bg-slate-50 transition-colors ${isExpanded ? 'border-b border-slate-100' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-700">{group.label}</h3>
                                    {group.items.length > 0 && (
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{group.items.length}</span>
                                    )}
                                </div>
                                <span className="text-slate-400 shrink-0">
                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </span>
                            </div>
                            
                            {/* Accordion Content */}
                            {isExpanded && (
                                <div className="p-3 space-y-3 bg-[#f8fafc]">
                                    {group.items.length === 0 ? (
                                        <div className="p-4 text-center text-slate-400 text-sm italic font-medium bg-transparent">Chưa có bản ghi nào</div>
                                    ) : (
                                        group.items.map(task => {
                                            const isCompleted = task.status?.includes('Hoàn thành');
                                            
                                            return (
                                                <div 
                                                    key={task.id} 
                                                    onClick={() => openEditModal(task)}
                                                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 transition-all cursor-pointer group flex gap-3 hover:border-[#5B5FC7]/30 hover:shadow-md active:scale-[0.98]"
                                                >
                                                    {/* Quick Complete - iOS style radio */}
                                                    <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                        <div 
                                                            onClick={() => toggleComplete(task)}
                                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm ${isCompleted ? 'bg-[#5B5FC7] border-[#5B5FC7]' : 'border-slate-300 hover:border-[#5B5FC7] bg-slate-50'}`}
                                                        >
                                                            {isCompleted && <div className="w-5 h-5 rounded-full text-white flex items-center justify-center"><CheckCircle2 size={16} strokeWidth={3} /></div>}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Task Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`text-[14px] font-bold leading-tight line-clamp-2 ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800 flex-1 group-hover:text-[#5B5FC7] transition-colors'}`}>
                                                            {task.name}
                                                        </h4>
                                                        {(task.task_code || task.priority) && (
                                                            <div className="flex items-center justify-between mt-2.5">
                                                                <span className="text-[10px] font-medium text-slate-400 tracking-tight">{task.task_code}</span>
                                                                {task.priority && (
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap shrink-0 max-h-[22px] flex items-center ${task.priority === 'Khẩn cấp' ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20' :
                                                                    task.priority === 'Cao' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                                    task.priority === 'Trung bình' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                                    'bg-slate-50 text-slate-500 border-slate-100'
                                                                    }`}>
                                                                        {task.priority}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    
                                    {/* Add Task Button per group */}
                                    <div 
                                        onClick={() => openAddModal()}
                                        className="p-3 w-full border-2 border-dashed border-slate-200 rounded-xl text-center text-[14px] font-bold text-slate-400 hover:text-[#5B5FC7] hover:border-[#5B5FC7]/30 hover:bg-indigo-50/50 cursor-pointer transition-colors"
                                    >
                                        + Thêm nhiệm vụ
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Mobile FAB */}
            <button
                onClick={() => openAddModal()}
                className="md:hidden fixed bottom-[90px] right-4 w-[52px] h-[52px] bg-[#4A62D7] hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(74,98,215,0.4)] transition-transform active:scale-95 z-50 focus:outline-none"
            >
                <Plus size={24} strokeWidth={2.5} />
            </button>


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
