import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import { type Task, type Project } from '../../types'
import { Plus, Search, Edit3, Trash2, Copy, ChevronDown, ChevronRight, X, ExternalLink } from 'lucide-react'
import { format, parseISO } from 'date-fns'

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
    const [form, setForm] = useState({
        task_code: '', project_id: '', name: '', description: '', assignee_id: '',
        status: 'Chưa bắt đầu', priority: 'Trung bình', start_date: '', due_date: '',
        completion_pct: 0, target: '', result_links: '', output: '', notes: ''
    })

    useEffect(() => {
        fetchAll()
    }, [profile])

    const fetchAll = async () => {
        try {
            setLoading(true)
            const [{ data: t }, { data: p }, { data: pr }] = await Promise.all([
                supabase.from('tasks').select('*').order('created_at', { ascending: true }),
                supabase.from('projects').select('*'),
                supabase.from('profiles').select('id, full_name, role')
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
        const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.task_code.toLowerCase().includes(search.toLowerCase())
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

    const openAddModal = (projectId?: string) => {
        setEditingTask(null)
        const count = tasks.filter(t => t.project_id === projectId).length
        const projCode = projectId ? getProjectCode(projectId) : ''
        const nextCode = projCode ? `${projCode}-${String(count + 1).padStart(2, '0')}` : ''
        setForm({
            task_code: nextCode, project_id: projectId || '', name: '', description: '',
            assignee_id: '', status: 'Chưa bắt đầu', priority: 'Trung bình',
            start_date: '', due_date: '', completion_pct: 0, target: '', result_links: '', output: '', notes: ''
        })
        setShowModal(true)
    }

    const openEditModal = (t: Task) => {
        setEditingTask(t)
        setForm({
            task_code: t.task_code, project_id: t.project_id, name: t.name, description: t.description || '',
            assignee_id: t.assignee_id || '', status: t.status, priority: t.priority,
            start_date: t.start_date || '', due_date: t.due_date || '', completion_pct: t.completion_pct,
            target: t.target || '', result_links: t.result_links || '', output: t.output || '', notes: t.notes || ''
        })
        setShowModal(true)
    }

    const handleSave = async () => {
        try {
            const payload = {
                name: form.name, description: form.description || null, assignee_id: form.assignee_id || null,
                status: form.status, priority: form.priority, start_date: form.start_date || null,
                due_date: form.due_date || null, completion_pct: Number(form.completion_pct),
                target: form.target || null, result_links: form.result_links || null,
                output: form.output || null, notes: form.notes || null
            }
            if (editingTask) {
                await supabase.from('tasks').update(payload).eq('id', editingTask.id)
            } else {
                await supabase.from('tasks').insert({ ...payload, task_code: form.task_code, project_id: form.project_id })
            }
            setShowModal(false)
            fetchAll()
        } catch (err) {
            console.error(err)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa nhiệm vụ này?')) return
        await supabase.from('tasks').delete().eq('id', id)
        fetchAll()
    }

    const handleCopy = async (t: Task) => {
        const count = tasks.filter(x => x.project_id === t.project_id).length
        const projCode = getProjectCode(t.project_id)
        const nextCode = `${projCode}-${String(count + 1).padStart(2, '0')}`
        await supabase.from('tasks').insert({
            task_code: nextCode, project_id: t.project_id, name: `${t.name} (Bản sao)`,
            description: t.description, assignee_id: t.assignee_id, status: 'Chưa bắt đầu',
            priority: t.priority, start_date: t.start_date, due_date: t.due_date,
            completion_pct: 0, target: t.target, result_links: null, output: null, notes: t.notes
        })
        fetchAll()
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
                                <button
                                    onClick={(e) => { e.stopPropagation(); openAddModal(projectId); }}
                                    className="text-xs font-bold text-indigo-600 hover:underline"
                                >
                                    + THÊM NHIỆM VỤ
                                </button>
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
                                            {projectTasks.map((task) => (
                                                <tr key={task.id} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="px-5 py-3">
                                                        <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="font-bold text-slate-800 leading-tight mb-0.5">{task.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">{task.task_code}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                {getAssigneeName(task.assignee_id).charAt(0)}
                                                            </div>
                                                            {getAssigneeName(task.assignee_id)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm ${getStatusBadge(task.status)}`}>
                                                            {task.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityBadge(task.priority)}`}>
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 bg-slate-100 rounded-full h-1.5 flex-1">
                                                                <div
                                                                    className={`h-1.5 rounded-full ${task.completion_pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                                    style={{ width: `${task.completion_pct}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="font-bold text-slate-500 min-w-[3ch]">{task.completion_pct}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {task.result_links ? (
                                                            <a href={task.result_links} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 font-bold">
                                                                <ExternalLink size={12} /> LINK
                                                            </a>
                                                        ) : <span className="text-slate-400">---</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-500 font-medium">
                                                        {task.due_date ? format(parseISO(task.due_date), 'dd/MM/yyyy') : '---'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleCopy(task); }}
                                                                className="w-7 h-7 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center border border-blue-100 hover:bg-blue-100"
                                                            >
                                                                <Copy size={13} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                                                className="w-7 h-7 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center border border-amber-100 hover:bg-amber-100"
                                                            >
                                                                <Edit3 size={13} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                                                                className="w-7 h-7 bg-red-50 text-red-500 rounded-lg flex items-center justify-center border border-red-100 hover:bg-red-100"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">{editingTask ? 'Sửa nhiệm vụ' : 'Thêm nhiệm vụ mới'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-white rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dự án</label>
                                    <select
                                        value={form.project_id}
                                        onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        disabled={!!editingTask}
                                    >
                                        <option value="">Chọn dự án</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mã nhiệm vụ</label>
                                    <input
                                        type="text"
                                        value={form.task_code}
                                        onChange={(e) => setForm({ ...form, task_code: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        disabled={!!editingTask}
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tên nhiệm vụ</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="Nhập tên nhiệm vụ..."
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Người thực hiện</label>
                                    <select
                                        value={form.assignee_id}
                                        onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="">Chọn người</option>
                                        {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Trạng thái</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                                        <option value="Đang thực hiện">Đang thực hiện</option>
                                        <option value="Hoàn thành">Hoàn thành</option>
                                        <option value="Tạm dừng">Tạm dừng</option>
                                        <option value="Hủy bỏ">Hủy bỏ</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ưu tiên</label>
                                    <select
                                        value={form.priority}
                                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="Thấp">Thấp</option>
                                        <option value="Trung bình">Trung bình</option>
                                        <option value="Cao">Cao</option>
                                        <option value="Khẩn cấp">Khẩn cấp</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        value={form.start_date}
                                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hạn chót</label>
                                    <input
                                        type="date"
                                        value={form.due_date}
                                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tiến độ (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={form.completion_pct}
                                        onChange={(e) => setForm({ ...form, completion_pct: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Link kết quả</label>
                                    <input
                                        type="text"
                                        value={form.result_links}
                                        onChange={(e) => setForm({ ...form, result_links: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all active:scale-95 uppercase tracking-wider"
                            >
                                {editingTask ? 'Cập nhật' : 'Tạo nhiệm vụ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
