import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import { type Task, type Project } from '../../types'
import { CheckSquare, Plus, Search, Edit3, Trash2, Copy, ChevronDown, ChevronRight, X, ExternalLink } from 'lucide-react'
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
            // Expand all projects by default
            if (p) setExpandedProjects(new Set(p.map((x: any) => x.id)))
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

    const getManagerForProject = (projectId: string) => {
        const p = projects.find(x => x.id === projectId)
        if (!p?.manager_id) return ''
        const prof = profiles.find(x => x.id === p.manager_id)
        return prof?.full_name || ''
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

    // Group tasks by project
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
        if (status?.includes('Hoàn thành')) return 'bg-emerald-100 text-emerald-700'
        if (status?.includes('Đang')) return 'bg-blue-100 text-blue-700'
        if (status?.includes('Tạm dừng')) return 'bg-amber-100 text-amber-700'
        if (status?.includes('Hủy')) return 'bg-red-100 text-red-700'
        return 'bg-slate-100 text-slate-700'
    }

    const getPriorityBadge = (priority: string) => {
        if (priority === 'Khẩn cấp') return 'bg-red-500 text-white'
        if (priority === 'Cao') return 'bg-orange-100 text-orange-700'
        if (priority === 'Trung bình') return 'bg-yellow-100 text-yellow-700'
        return 'bg-slate-100 text-slate-600'
    }

    const getPriorityDot = (priority: string) => {
        if (priority === 'Khẩn cấp') return 'bg-red-500'
        if (priority === 'Cao') return 'bg-orange-500'
        if (priority === 'Trung bình') return 'bg-yellow-500'
        return 'bg-slate-400'
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
        <div className="space-y-5 max-w-[1400px] mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h1 className="text-xl font-bold text-slate-800">Quản lý nhiệm vụ</h1>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nhiệm vụ..."
                            className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none w-52" />
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none">
                        <option value="">Tất cả</option>
                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                        <option value="Đang thực hiện">Đang thực hiện</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                        <option value="Tạm dừng">Tạm dừng</option>
                    </select>
                    <button onClick={() => openAddModal()} className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
                        <Plus size={16} className="mr-1.5" /> Tạo nhiệm vụ mới
                    </button>
                </div>
            </div>

            {/* Status Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                    <button key={status} onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${statusFilter === status ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        <span className="font-bold text-lg">{count}</span>
                        <span className="text-xs">{status}</span>
                    </button>
                ))}
            </div>

            {/* Tasks grouped by project */}
            <div className="space-y-4">
                {Object.entries(groupedTasks).map(([projectId, projectTasks]) => {
                    const project = projects.find(p => p.id === projectId)
                    const isExpanded = expandedProjects.has(projectId)
                    const manager = getManagerForProject(projectId)

                    return (
                        <div key={projectId} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            {/* Project Header */}
                            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => toggleProject(projectId)}>
                                <div className="flex items-center gap-3">
                                    {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                    <h3 className="text-sm font-bold text-slate-800">{project?.name || projectId}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(project?.status || '')}`}>{project?.status}</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    {manager && <span>Quản lý: {manager}</span>}
                                    <span>{projectTasks.length} nhiệm vụ</span>
                                    <button onClick={(e) => { e.stopPropagation(); openAddModal(projectId) }}
                                        className="text-indigo-600 hover:text-indigo-700 font-medium">+ Thêm</button>
                                </div>
                            </div>

                            {/* Tasks Table */}
                            {isExpanded && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider">
                                                <th className="text-left py-3 px-4 font-medium">Nhiệm vụ</th>
                                                <th className="text-left py-3 px-3 font-medium">Người thực hiện</th>
                                                <th className="text-left py-3 px-3 font-medium">Trạng thái</th>
                                                <th className="text-left py-3 px-3 font-medium">Ưu tiên</th>
                                                <th className="text-left py-3 px-3 font-medium">Tiến độ</th>
                                                <th className="text-left py-3 px-3 font-medium">Link kết quả</th>
                                                <th className="text-left py-3 px-3 font-medium">Ngày bắt đầu</th>
                                                <th className="text-left py-3 px-3 font-medium">Hạn chót</th>
                                                <th className="text-center py-3 px-3 font-medium">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {projectTasks.map(task => (
                                                <tr key={task.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(task.priority)}`}></div>
                                                            <div>
                                                                <p className="font-medium text-slate-800 line-clamp-1">{task.name}</p>
                                                                <p className="text-[10px] text-slate-400">{task.task_code}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 text-xs text-slate-600">{getAssigneeName(task.assignee_id)}</td>
                                                    <td className="py-3 px-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusBadge(task.status)}`}>{task.status}</span>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getPriorityBadge(task.priority)}`}>{task.priority}</span>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                                                <div className={`h-1.5 rounded-full ${task.completion_pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${task.completion_pct}%` }}></div>
                                                            </div>
                                                            <span className="text-[10px] text-slate-500">{task.completion_pct}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 text-xs">
                                                        {task.result_links ? (
                                                            <a href={task.result_links} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                                                <ExternalLink size={10} /> Link
                                                            </a>
                                                        ) : <span className="text-slate-400">Chưa có</span>}
                                                    </td>
                                                    <td className="py-3 px-3 text-xs text-slate-500">{task.start_date ? format(parseISO(task.start_date), 'dd/MM/yyyy') : '-'}</td>
                                                    <td className="py-3 px-3 text-xs text-slate-500">{task.due_date ? format(parseISO(task.due_date), 'dd/MM/yyyy') : '-'}</td>
                                                    <td className="py-3 px-3">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button onClick={() => openEditModal(task)} className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"><Edit3 size={13} /></button>
                                                            <button onClick={() => handleCopy(task)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Copy size={13} /></button>
                                                            <button onClick={() => handleDelete(task.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={13} /></button>
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

            {filteredTasks.length === 0 && (
                <div className="py-12 text-center bg-white border border-slate-200 border-dashed rounded-2xl">
                    <CheckSquare size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Chưa có nhiệm vụ nào</h3>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-slate-800">{editingTask ? 'Sửa nhiệm vụ' : 'Thêm nhiệm vụ mới'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Mã nhiệm vụ</label>
                                    <input value={form.task_code} onChange={e => setForm({ ...form, task_code: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" disabled={!!editingTask} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Dự án</label>
                                    <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" disabled={!!editingTask}>
                                        <option value="">Chọn dự án</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Người thực hiện</label>
                                    <select value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                        <option value="">Chọn người</option>
                                        {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Tên nhiệm vụ</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Nhập tên nhiệm vụ" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Trạng thái</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                        <option>Chưa bắt đầu</option><option>Đang thực hiện</option><option>Hoàn thành</option><option>Tạm dừng</option><option>Hủy bỏ</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Ưu tiên</label>
                                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                        <option>Thấp</option><option>Trung bình</option><option>Cao</option><option>Khẩn cấp</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Tiến độ (%)</label>
                                    <input type="number" min="0" max="100" value={form.completion_pct}
                                        onChange={e => setForm({ ...form, completion_pct: Number(e.target.value) })}
                                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Ngày bắt đầu</label>
                                    <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Hạn chót</label>
                                    <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Link kết quả</label>
                                <input value={form.result_links} onChange={e => setForm({ ...form, result_links: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="https://..." />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Ghi chú</label>
                                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Hủy</button>
                            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                                {editingTask ? 'Cập nhật' : 'Tạo nhiệm vụ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
