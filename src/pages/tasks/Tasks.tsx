import React, { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import { type Task, type Project } from '../../types'
import { Plus, Search, Edit3, Trash2, Copy, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { AddEditTaskModal } from './AddEditTaskModal'

export const Tasks = () => {
    const { profile } = useAuthStore()
    const [tasks, setTasks] = useState<Task[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [profiles, setProfiles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
    const [showModal, setShowModal] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [initialTaskData, setInitialTaskData] = useState({ task_code: '', project_id: '' })

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

    const statusCounts = {
        'Chưa bắt đầu': tasks.filter(t => t.status === 'Chưa bắt đầu').length,
        'Đang thực hiện': tasks.filter(t => t.status?.includes('Đang')).length,
        'Hoàn thành': tasks.filter(t => t.status?.includes('Hoàn thành')).length,
        'Tạm dừng': tasks.filter(t => t.status === 'Tạm dừng').length,
    }

    const filteredTasks = tasks.filter(t => {
        const userRole = profile?.role;
        const isAssigned = t.assignee_id === profile?.id;
        // Check if user is manager of the project this task belongs to
        const project = projects.find(p => p.id === t.project_id);
        const isProjectManager = project && project.manager_id === profile?.id;

        let isVisible = true;
        if (userRole === 'Nhân viên') {
            isVisible = Boolean(isAssigned || isProjectManager || t.supporter_id === profile?.id);
        } else if (userRole === 'Quản lý') {
            isVisible = true;
        }

        if (!isVisible) return false;

        const matchSearch = (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (t.task_code || '').toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter ? t.status === statusFilter : true
        return matchSearch && matchStatus
    })

    const groupedTasks: Record<string, Task[]> = {}
    filteredTasks.forEach(t => {
        if (!groupedTasks[t.project_id]) groupedTasks[t.project_id] = []
        groupedTasks[t.project_id].push(t)
    })

    const toggleProject = (id: string) => {
        const next = new Set(expandedProjects)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setExpandedProjects(next)
    }

    const getStatusBadge = (status: string) => {
        if (status?.includes('Hoàn thành')) return 'bg-emerald-500 text-white'
        if (status?.includes('Đang')) return 'bg-blue-400 text-white'
        if (status?.includes('Tạm dừng')) return 'bg-amber-400 text-white'
        if (status?.includes('Hủy')) return 'bg-red-400 text-white'
        return 'bg-slate-200 text-slate-600'
    }

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
        const newDate = !isCompleted ? new Date().toISOString().split('T')[0] : null

        const { error } = await supabase.from('tasks').update({
            status: newStatus,
            completion_pct: newPct,
            completion_date: newDate
        }).eq('id', task.id)

        if (error) console.error(error)
        fetchAll()
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

    if (loading) {
        return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
    }

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-xl font-bold text-slate-800">Quản lý nhiệm vụ</h1>
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
                    <button
                        onClick={() => openAddModal()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm"
                    >
                        <Plus size={18} /> Tạo mới nhiệm vụ
                    </button>
                </div>
            </div>

            {/* Status Tabs - Circular style like screenshot */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(statusCounts).map(([status, count]) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                        className={`bg-white border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all shadow-sm ${statusFilter === status ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-100 hover:border-slate-200'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${status === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-600' :
                            status === 'Đang thực hiện' ? 'bg-blue-50 text-blue-600' :
                                status === 'Tạm dừng' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                            }`}>
                            {count}
                        </div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{status}</span>
                    </button>
                ))}
            </div>

            {/* Grouped Tasks Table */}
            <div className="space-y-4">
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
                                    <h3 className="text-sm font-bold text-slate-800">{project?.name} ({project?.project_code})</h3>
                                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-100">
                                        {projectTasks.length} NHIỆM VỤ
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
                                                <th className="px-5 py-3 text-left w-10">
                                                    <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                                </th>
                                                <th className="px-4 py-3 text-left">Nhiệm vụ</th>
                                                <th className="px-4 py-3 text-left">Người thực hiện</th>
                                                <th className="px-4 py-3 text-left">Trạng thái</th>
                                                <th className="px-4 py-3 text-left">Ưu tiên</th>
                                                <th className="px-4 py-3 text-left">Tiến độ</th>
                                                <th className="px-4 py-3 text-left">Link kết quả</th>
                                                <th className="px-4 py-3 text-left">Hạn chót</th>
                                                <th className="px-4 py-3 text-center">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {projectTasks.filter(t => !t.parent_id).map((task) => {

                                                // Function to render a single row (used for both parent and child)
                                                const renderTaskRow = (t: Task, isChild: boolean = false, overridePct?: number) => {
                                                    let subTasks: any[] = [];
                                                    try {
                                                        if (t.notes && t.notes.startsWith('[')) {
                                                            subTasks = JSON.parse(t.notes);
                                                        }
                                                    } catch (e) {
                                                        subTasks = [];
                                                    }

                                                    const totalSub = subTasks.length;
                                                    const completedSub = subTasks.filter(st => st.completed).length;

                                                    // Dynamic completion mapping based on sub-tasks if they exist, or use overridePct for Parent Phases
                                                    const displayPct = overridePct !== undefined
                                                        ? overridePct
                                                        : (totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : t.completion_pct);

                                                    return (
                                                        <tr key={t.id} onClick={() => openEditModal(t)} className={`hover:bg-slate-50/50 transition-colors cursor-pointer group ${isChild ? 'bg-slate-50/20' : 'bg-white'}`}>
                                                            <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={t.status?.includes('Hoàn thành')}
                                                                    onChange={() => toggleComplete(t)}
                                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                                    disabled={!(profile?.role === 'Admin' || profile?.role === 'Quản lý' || project?.manager_id === profile?.id || t.assignee_id === profile?.id)}
                                                                />
                                                            </td>
                                                            <td className={`px-4 py-3 ${isChild ? 'pl-10' : ''}`}>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        {isChild && <div className="w-3 h-3 border-b-2 border-l-2 border-slate-300 rounded-bl shrink-0 -mt-2"></div>}
                                                                        <p className={`font-bold text-slate-800 leading-tight ${isChild ? 'text-[11px]' : ''}`}>{t.name}</p>
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
                                                            <td className="px-4 py-3 text-slate-600 font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                        {getAssigneeName(t.assignee_id).charAt(0)}
                                                                    </div>
                                                                    {getAssigneeName(t.assignee_id)}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm ${getStatusBadge(t.status)}`}>
                                                                    {t.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityBadge(t.priority)}`}>
                                                                    {t.priority}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
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
                                                            <td className="px-4 py-3">
                                                                {t.result_links ? (
                                                                    <a href={t.result_links} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 font-bold">
                                                                        <ExternalLink size={12} /> LINK
                                                                    </a>
                                                                ) : <span className="text-slate-400">---</span>}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-500 font-medium">
                                                                {t.due_date ? format(parseISO(t.due_date), 'dd/MM/yyyy') : '---'}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    {(profile?.role === 'Admin' || profile?.role === 'Quản lý' || project?.manager_id === profile?.id) && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleCopy(t); }}
                                                                            className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center border border-blue-100 hover:bg-blue-100 transition-opacity"
                                                                        >
                                                                            <Copy size={13} />
                                                                        </button>
                                                                    )}
                                                                    {(profile?.role === 'Admin' || profile?.role === 'Quản lý' || project?.manager_id === profile?.id || t.assignee_id === profile?.id) && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); openEditModal(t); }}
                                                                            className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center border border-amber-100 hover:bg-amber-100 transition-opacity"
                                                                        >
                                                                            <Edit3 size={13} />
                                                                        </button>
                                                                    )}
                                                                    {(profile?.role === 'Admin' || profile?.role === 'Quản lý' || project?.manager_id === profile?.id) && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                                                                            className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-red-50 text-red-500 rounded-lg flex items-center justify-center border border-red-100 hover:bg-red-100 transition-opacity"
                                                                        >
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                };

                                                // Find children of this parent task
                                                const childTasks = projectTasks.filter(child => child.parent_id === task.id);

                                                // Compute dynamic % for Parent phase based on children completion
                                                let phaseDisplayPct = task.completion_pct;
                                                if (childTasks.length > 0) {
                                                    const completedChildren = childTasks.filter(c => c.status?.includes('Hoàn thành')).length;
                                                    phaseDisplayPct = Math.round((completedChildren / childTasks.length) * 100);
                                                }

                                                return (
                                                    <React.Fragment key={task.id}>
                                                        {renderTaskRow(task, false, phaseDisplayPct)}
                                                        {childTasks.map(child => renderTaskRow(child, true))}
                                                    </React.Fragment>
                                                )
                                            }

                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

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
