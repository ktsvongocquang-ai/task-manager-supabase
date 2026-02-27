import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import { type Profile } from '../../types'
import { Plus, Edit3, Trash2, X, Shield, Check } from 'lucide-react'

const PERMISSIONS = {
    'QUẢN LÝ DỰ ÁN': [
        { name: 'Tạo dự án mới', admin: true, manager: true, staff: false, note: 'Chỉ tạo cho bản thân phụ trách' },
        { name: 'Xem tất cả dự án', admin: true, manager: false, staff: false, note: '' },
        { name: 'Sửa/xóa dự án được phân công', admin: true, manager: true, staff: false, note: 'Chỉ sửa được trong trạng thái dự án' },
        { name: 'Sao chép dự án', admin: true, manager: true, staff: false, note: '' },
    ],
    'QUẢN LÝ NHIỆM VỤ': [
        { name: 'Tạo nhiệm vụ mới', admin: true, manager: true, staff: false, note: 'Trong dự án được quản' },
        { name: 'Giao việc cho người khác', admin: true, manager: true, staff: false, note: 'Nội bộ người phụ trách dự án' },
        { name: 'Xem tất cả nhiệm vụ', admin: true, manager: false, staff: false, note: '' },
        { name: 'Sửa/xóa nhiệm vụ của mình', admin: true, manager: true, staff: true, note: '' },
        { name: 'Sao chép nhiệm vụ', admin: true, manager: true, staff: false, note: 'Nội bộ người phụ trách dự án' },
    ]
}

export const Users = () => {
    const { profile: currentProfile } = useAuthStore()
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
    const [form, setForm] = useState({
        staff_id: '', full_name: '', email: '', position: '', role: 'Nhân viên'
    })

    useEffect(() => {
        fetchProfiles()
    }, [])

    const fetchProfiles = async () => {
        try {
            setLoading(true)
            const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
            if (data) setProfiles(data as Profile[])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getRoleBadge = (role: string) => {
        if (role === 'Admin') return 'bg-orange-500'
        if (role === 'Quản lý') return 'bg-emerald-500'
        return 'bg-blue-500'
    }

    const getRoleBadgeText = (role: string) => {
        if (role === 'Admin') return 'bg-orange-100 text-orange-700'
        if (role === 'Quản lý') return 'bg-emerald-100 text-emerald-700'
        return 'bg-blue-100 text-blue-700'
    }

    const getInitials = (name: string) => {
        if (!name) return 'U'
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }

    const openAddModal = () => {
        setEditingProfile(null)
        const nextId = `NV${String(profiles.length + 1).padStart(3, '0')}`
        setForm({ staff_id: nextId, full_name: '', email: '', position: '', role: 'Nhân viên' })
        setShowModal(true)
    }

    const openEditModal = (p: Profile) => {
        setEditingProfile(p)
        setForm({
            staff_id: p.staff_id, full_name: p.full_name, email: p.email,
            position: p.position || '', role: p.role
        })
        setShowModal(true)
    }

    const handleSave = async () => {
        try {
            if (editingProfile) {
                await supabase.from('profiles').update({
                    full_name: form.full_name, position: form.position, role: form.role
                }).eq('id', editingProfile.id)
            }
            setShowModal(false)
            fetchProfiles()
        } catch (err) {
            console.error(err)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return
        await supabase.from('profiles').delete().eq('id', id)
        fetchProfiles()
    }

    if (loading) {
        return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
    }

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-slate-800">Quản lý nhân viên</h1>
                {currentProfile?.role === 'Admin' && (
                    <button onClick={openAddModal} className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
                        <Plus size={16} className="mr-1.5" /> Thêm nhân viên
                    </button>
                )}
            </div>

            {/* Permissions Matrix */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <Shield size={18} className="text-indigo-600" />
                    <h3 className="text-sm font-semibold text-slate-800">Phân quyền hệ thống</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="text-left py-3 px-6 font-semibold text-slate-700">Chức năng</th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">
                                    <span className="flex items-center justify-center gap-1">👑 ADMIN</span>
                                </th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">
                                    <span className="flex items-center justify-center gap-1">👔 QUẢN LÝ</span>
                                </th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">
                                    <span className="flex items-center justify-center gap-1">👤 NHÂN VIÊN</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(PERMISSIONS).map(([category, perms]) => (
                                <>
                                    <tr key={category} className="bg-indigo-50/50">
                                        <td colSpan={4} className="py-2 px-6 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                                            📁 {category}
                                        </td>
                                    </tr>
                                    {perms.map((p, i) => (
                                        <tr key={`${category}-${i}`} className={`border-b border-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                            <td className="py-2.5 px-6 text-sm text-slate-700">{p.name}</td>
                                            <td className="py-2.5 px-4 text-center">
                                                {p.admin ? <Check size={16} className="mx-auto text-emerald-500" /> : <X size={16} className="mx-auto text-red-400" />}
                                            </td>
                                            <td className="py-2.5 px-4 text-center">
                                                {p.manager ? <Check size={16} className="mx-auto text-emerald-500" /> : <X size={16} className="mx-auto text-red-400" />}
                                                {p.note && <span className="block text-[9px] text-slate-400 mt-0.5">{p.note}</span>}
                                            </td>
                                            <td className="py-2.5 px-4 text-center">
                                                {p.staff ? <Check size={16} className="mx-auto text-emerald-500" /> : <X size={16} className="mx-auto text-red-400" />}
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                {profiles.map(p => (
                    <div key={p.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 text-center hover:shadow-md transition-shadow flex flex-col">
                        <div className={`w-16 h-16 mx-auto rounded-full ${getRoleBadge(p.role)} text-white flex items-center justify-center text-xl font-bold mb-3 shadow-md`}>
                            {getInitials(p.full_name)}
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 mb-0.5">{p.full_name}</h4>
                        <p className="text-xs text-slate-500 mb-0.5">{p.position || 'Chưa có chức vụ'}</p>
                        <p className="text-[10px] text-slate-400 mb-3">{p.email}</p>
                        <span className={`mx-auto px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getRoleBadgeText(p.role)}`}>
                            {p.role}
                        </span>
                        <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-100">
                            <button onClick={() => openEditModal(p)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                <Edit3 size={14} />
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-slate-800">{editingProfile ? 'Sửa thông tin' : 'Thêm nhân viên'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-slate-600">Mã nhân viên</label>
                                <input value={form.staff_id} disabled className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Họ tên</label>
                                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Email</label>
                                <input value={form.email} disabled={!!editingProfile}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Chức vụ</label>
                                <input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Phân quyền</label>
                                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                    <option>Admin</option><option>Quản lý</option><option>Nhân viên</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Hủy</button>
                            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                                {editingProfile ? 'Cập nhật' : 'Thêm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
