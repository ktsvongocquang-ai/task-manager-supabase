import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import { type Project } from '../../types'
import { FolderKanban, Plus, Search, Calendar, Copy, Edit3, Trash2, Users, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'


export const Projects = () => {
    const { profile } = useAuthStore()
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [form, setForm] = useState({
        project_code: '', name: '', description: '', status: 'Chưa bắt đầu',
        start_date: '', end_date: '', manager_id: ''
    })
    const [profiles, setProfiles] = useState<any[]>([])

    useEffect(() => {
        fetchProjects()
        fetchProfiles()
    }, [profile])

    const fetchProfiles = async () => {
        const { data } = await supabase.from('profiles').select('id, full_name, role')
        if (data) setProfiles(data)
    }

    const fetchProjects = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
            if (error) throw error
            if (data) setProjects(data as Project[])
        } catch (error) {
            console.error('Error fetching projects:', error)
        } finally {
            setLoading(false)
        }
    }

    const statusCounts = {
        'Chưa bắt đầu': projects.filter(p => p.status === 'Chưa bắt đầu').length,
        'Đang thực hiện': projects.filter(p => p.status === 'Đang thực hiện').length,
        'Hoàn thành': projects.filter(p => p.status === 'Hoàn thành').length,
        'Tạm dừng': projects.filter(p => p.status === 'Tạm dừng').length,
        'Hủy bỏ': projects.filter(p => p.status?.includes('Hủy')).length,
    }

    const filteredProjects = projects.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.project_code.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter ? p.status === statusFilter : true
        return matchSearch && matchStatus
    })

    const getStatusColor = (status: string) => {
        if (status?.includes('Hoàn thành')) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
        if (status?.includes('Đang')) return 'bg-blue-100 text-blue-700 border-blue-200'
        if (status?.includes('Tạm dừng')) return 'bg-amber-100 text-amber-700 border-amber-200'
        if (status?.includes('Hủy')) return 'bg-red-100 text-red-700 border-red-200'
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }

    const getStatusDotColor = (status: string) => {
        if (status?.includes('Hoàn thành')) return 'text-emerald-500'
        if (status?.includes('Đang')) return 'text-blue-500'
        if (status?.includes('Tạm dừng')) return 'text-amber-500'
        if (status?.includes('Hủy')) return 'text-red-500'
        return 'text-slate-400'
    }

    const openAddModal = () => {
        setEditingProject(null)
        const nextCode = `DA${String(projects.length + 1).padStart(3, '0')}`
        setForm({ project_code: nextCode, name: '', description: '', status: 'Chưa bắt đầu', start_date: '', end_date: '', manager_id: '' })
        setShowModal(true)
    }

    const openEditModal = (p: Project) => {
        setEditingProject(p)
        setForm({
            project_code: p.project_code, name: p.name, description: p.description || '',
            status: p.status, start_date: p.start_date || '', end_date: p.end_date || '', manager_id: p.manager_id || ''
        })
        setShowModal(true)
    }

    const handleSave = async () => {
        try {
            if (editingProject) {
                await supabase.from('projects').update({
                    name: form.name, description: form.description, status: form.status,
                    start_date: form.start_date || null, end_date: form.end_date || null, manager_id: form.manager_id || null
                }).eq('id', editingProject.id)
            } else {
                await supabase.from('projects').insert({
                    project_code: form.project_code, name: form.name, description: form.description,
                    status: form.status, start_date: form.start_date || null, end_date: form.end_date || null,
                    manager_id: form.manager_id || null
                })
            }
            setShowModal(false)
            fetchProjects()
        } catch (err) {
            console.error(err)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa dự án này?')) return
        await supabase.from('projects').delete().eq('id', id)
        fetchProjects()
    }

    const handleCopy = async (p: Project) => {
        const nextCode = `DA${String(projects.length + 1).padStart(3, '0')}`
        await supabase.from('projects').insert({
            project_code: nextCode, name: `${p.name} (Bản sao)`, description: p.description,
            status: 'Chưa bắt đầu', start_date: p.start_date, end_date: p.end_date, manager_id: p.manager_id
        })
        fetchProjects()
    }

    const getManagerName = (id: string | null) => {
        if (!id) return 'Chưa gán'
        const p = profiles.find(x => x.id === id)
        return p?.full_name || 'N/A'
    }

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Quản lý dự án</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm dự án..."
                            className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none w-52" />
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none">
                        <option value="">Tất cả</option>
                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                        <option value="Đang thực hiện">Đang thực hiện</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                        <option value="Tạm dừng">Tạm dừng</option>
                    </select>
                    {profile?.role !== 'Nhân viên' && (
                        <button onClick={openAddModal} className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
                            <Plus size={16} className="mr-1.5" /> Tạo dự án mới
                        </button>
                    )}
                </div>
            </div>

            {/* Status Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                    <button key={status} onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${statusFilter === status ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        <span className={`w-2 h-2 rounded-full ${getStatusDotColor(status)} bg-current`}></span>
                        <span className="font-bold">{count}</span>
                        <span className="text-xs">{status}</span>
                    </button>
                ))}
            </div>

            {/* Project Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((project) => (
                    <div key={project.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group relative">
                        <div className="p-5 flex-1">
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusColor(project.status)}`}>
                                    {project.status}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleCopy(project)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md" title="Sao chép">
                                        <Copy size={14} />
                                    </button>
                                    <button onClick={() => openEditModal(project)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md" title="Sửa">
                                        <Edit3 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(project.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Xóa">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-base font-bold text-slate-800 line-clamp-2 mb-1.5">
                                {project.name} <span className="text-xs font-normal text-slate-400">({project.project_code})</span>
                            </h3>
                            <p className="text-slate-500 text-sm line-clamp-2 mb-3">
                                {project.description || 'Không có mô tả'}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                                <div className="flex items-center gap-1">
                                    <Calendar size={12} className="text-slate-400" />
                                    <span>Bắt đầu: {project.start_date ? format(parseISO(project.start_date), 'dd/MM/yyyy') : 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar size={12} className="text-red-400" />
                                    <span>Kết thúc: {project.end_date ? format(parseISO(project.end_date), 'dd/MM/yyyy') : 'N/A'}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <Users size={12} /> <span>Quản lý: {getManagerName(project.manager_id)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-500">Tiến độ</span>
                                <span className="font-semibold text-slate-700">0%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                                <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: '0%' }}></div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredProjects.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white border border-slate-200 border-dashed rounded-2xl">
                        <FolderKanban size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-1">Chưa có dự án nào</h3>
                        <p className="text-slate-500 mb-6">Bắt đầu quản lý bằng cách tạo dự án đầu tiên.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-slate-800">{editingProject ? 'Sửa dự án' : 'Thêm dự án mới'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Mã dự án</label>
                                    <input value={form.project_code} onChange={e => setForm({ ...form, project_code: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" disabled={!!editingProject} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Trạng thái</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                        <option>Chưa bắt đầu</option>
                                        <option>Đang thực hiện</option>
                                        <option>Hoàn thành</option>
                                        <option>Tạm dừng</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Tên dự án</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Nhập tên dự án" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Mô tả</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} placeholder="Mô tả dự án" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Ngày bắt đầu</label>
                                    <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600">Ngày kết thúc</label>
                                    <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Quản lý</label>
                                <select value={form.manager_id} onChange={e => setForm({ ...form, manager_id: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                    <option value="">Chọn quản lý</option>
                                    {profiles.filter(p => p.role === 'Admin' || p.role === 'Quản lý').map(p => (
                                        <option key={p.id} value={p.id}>{p.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Hủy</button>
                            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                                {editingProject ? 'Cập nhật' : 'Tạo dự án'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
