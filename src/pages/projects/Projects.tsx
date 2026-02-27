import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import { type Project } from '../../types'
import { Plus, Search, Edit3, Trash2, Copy, X, Calendar, Users } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export const Projects = () => {
    const { profile } = useAuthStore()
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [profiles, setProfiles] = useState<any[]>([])
    const [form, setForm] = useState({
        name: '', project_code: '', description: '', status: 'Mới',
        start_date: '', end_date: '', manager_id: '', budget: 0
    })

    useEffect(() => {
        fetchProjects()
        fetchProfiles()
    }, [])

    const fetchProjects = async () => {
        try {
            setLoading(true)
            const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
            if (data) setProjects(data as Project[])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchProfiles = async () => {
        const { data } = await supabase.from('profiles').select('id, full_name')
        if (data) setProfiles(data)
    }

    const filteredProjects = projects.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.project_code.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter ? p.status === statusFilter : true
        return matchSearch && matchStatus
    })

    const statusCounts = {
        'Chưa bắt đầu': projects.filter(p => p.status === 'Chưa bắt đầu' || p.status === 'Mới').length,
        'Đang thực hiện': projects.filter(p => p.status === 'Đang thực hiện').length,
        'Hoàn thành': projects.filter(p => p.status === 'Hoàn thành').length,
        'Tạm dừng': projects.filter(p => p.status === 'Tạm dừng').length,
        'Hủy bỏ': projects.filter(p => p.status === 'Hủy bỏ').length,
    }

    const openAddModal = () => {
        setEditingProject(null)
        const count = projects.length + 1
        setForm({
            name: '', project_code: `DA${String(count).padStart(3, '0')}`,
            description: '', status: 'Chưa bắt đầu', start_date: '', end_date: '',
            manager_id: profile?.id || '', budget: 0
        })
        setShowModal(true)
    }

    const openEditModal = (p: Project) => {
        setEditingProject(p)
        setForm({
            name: p.name, project_code: p.project_code, description: p.description || '',
            status: p.status, start_date: p.start_date || '', end_date: p.end_date || '',
            manager_id: p.manager_id || '', budget: p.budget || 0
        })
        setShowModal(true)
    }

    const handleSave = async () => {
        try {
            // Remove budget if it's potentially causing a "column does not exist" error
            // Also ensure we don't send empty strings for optional relation fields
            const { budget, ...formData } = form;
            const payload = {
                ...formData,
                manager_id: formData.manager_id || null,
                description: formData.description || null,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null
            }

            console.log('Sending project payload:', payload);

            let result;
            if (editingProject) {
                result = await supabase.from('projects').update(payload).eq('id', editingProject.id)
            } else {
                result = await supabase.from('projects').insert(payload)
            }

            if (result.error) {
                console.error('Supabase Error:', result.error)
                alert(`Lỗi Supabase: ${result.error.message} (Mã: ${result.error.code})`)
                return
            }

            setShowModal(false)
            fetchProjects()
        } catch (err) {
            console.error('Catch Error:', err)
            alert('Lỗi hệ thống khi lưu dự án. Vui lòng kiểm tra console.')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa dự án này?')) return
        await supabase.from('projects').delete().eq('id', id)
        fetchProjects()
    }

    const handleCopy = async (p: Project) => {
        const count = projects.length + 1
        const { id, created_at, ...rest } = p as any
        const payload = {
            ...rest,
            project_code: `DA${String(count).padStart(3, '0')}`,
            name: `${p.name} (Bản sao)`,
        }

        const { error } = await supabase.from('projects').insert(payload)
        if (error) {
            console.error('Copy Error:', error)
            alert(`Lỗi sao chép: ${error.message}`)
        } else {
            fetchProjects()
        }
    }

    const getStatusBadge = (status: string) => {
        if (status === 'Hoàn thành') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
        if (status === 'Đang thực hiện') return 'bg-blue-100 text-blue-700 border-blue-200'
        if (status === 'Tạm dừng') return 'bg-amber-100 text-amber-700 border-amber-200'
        if (status === 'Hủy bỏ') return 'bg-red-100 text-red-700 border-red-200'
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }

    const getManagerName = (id: string) => {
        return profiles.find(p => p.id === id)?.full_name || id
    }

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-xl font-bold text-slate-800">Quản lý dự án</h1>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm dự án..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm"
                    >
                        <Plus size={18} /> Tạo mới dự án
                    </button>
                </div>
            </div>

            {/* Status Tabs - Circular style matching screenshot */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(statusCounts).map(([status, count]) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                        className={`bg-white border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all shadow-sm ${statusFilter === status ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-100 hover:border-slate-200'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${status === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-600' :
                            status === 'Đang thực hiện' ? 'bg-blue-50 text-blue-600' :
                                status === 'Hủy bỏ' ? 'bg-red-50 text-red-600' :
                                    status === 'Tạm dừng' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                            }`}>
                            {count}
                        </div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{status}</span>
                    </button>
                ))}
            </div>

            {/* Project Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                    <div key={project.id} className="glass-card p-6 shadow-sm hover:shadow-xl transition-all relative group transform hover:-translate-y-1">
                        {/* Status badge in top left */}
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusBadge(project.status)}`}>
                                {project.status}
                            </span>
                            {/* Action overlap buttons - colored circles like screenshot */}
                            <div className="flex gap-1.5 translate-x-1 -translate-y-1">
                                <button onClick={() => handleCopy(project)} className="w-8 h-8 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100">
                                    <Copy size={14} />
                                </button>
                                <button onClick={() => openEditModal(project)} className="w-8 h-8 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all shadow-sm border border-amber-100">
                                    <Edit3 size={14} />
                                </button>
                                <button onClick={() => handleDelete(project.id)} className="w-8 h-8 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-lg font-black text-slate-800 mb-1 leading-tight group-hover:text-blue-600 transition-colors uppercase italic tracking-tighter">{project.name}</h3>
                        <div className="text-[10px] font-black text-slate-400 mb-3 tracking-widest">{project.project_code}</div>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8 font-medium">{project.description || 'Không có mô tả chi tiết cho dự án này.'}</p>

                        <div className="space-y-3 mb-6 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                <Calendar size={14} className="text-emerald-500" />
                                <span>Bắt đầu: {project.start_date ? format(parseISO(project.start_date), 'dd/MM/yyyy') : 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                <Calendar size={14} className="text-rose-500" />
                                <span>Kết thúc: {project.end_date ? format(parseISO(project.end_date), 'dd/MM/yyyy') : 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                <Users size={14} className="text-indigo-500" />
                                <span>Quản lý: {getManagerName(project.manager_id || '')}</span>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="pt-3 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tiến độ dự án</span>
                                <span className="text-[11px] font-black text-blue-600">{project.status === 'Hoàn thành' ? '100%' : '65%'}</span>
                            </div>
                            <div className="bg-slate-100 rounded-full h-2 ring-1 ring-black/5">
                                <div
                                    className={`h-2 rounded-full transition-all duration-700 shadow-sm ${project.status === 'Hoàn thành' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                                    style={{ width: project.status === 'Hoàn thành' ? '100%' : '65%' }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">{editingProject ? 'Sửa dự án' : 'Tạo dự án mới'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-white rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mã dự án</label>
                                    <input
                                        type="text"
                                        value={form.project_code}
                                        onChange={(e) => setForm({ ...form, project_code: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        disabled={!!editingProject}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Trạng thái</label>
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
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên dự án</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-300"
                                    placeholder="Nhập tên dự án..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        value={form.start_date}
                                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày kết thúc</label>
                                    <input
                                        type="date"
                                        value={form.end_date}
                                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quản lý dự án</label>
                                <select
                                    value={form.manager_id}
                                    onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="">Chọn quản lý</option>
                                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mô tả</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-300"
                                    placeholder="Mô tả tóm tắt dự án..."
                                />
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
                                {editingProject ? 'Cập nhật' : 'Tạo dự án'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
