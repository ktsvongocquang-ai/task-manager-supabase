import React, { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import { type Profile } from '../../types'
import { Edit3, Trash2, X, Check, Info, Search, UserPlus, FolderKanban, CheckSquare } from 'lucide-react'

// Specific permission data structure to match the snapshot
const PERMISSIONS = {
    'QUẢN LÝ DỰ ÁN': [
        {
            name: 'Tạo dự án mới',
            admin: { value: true, note: '' },
            manager: { value: true, note: 'Chỉ tạo cho bản thân phụ trách' },
            staff: { value: false, note: '' },
            headerColor: 'bg-indigo-50/50'
        },
        {
            name: 'Xem tất cả dự án',
            admin: { value: true, note: '' },
            manager: { value: false, note: '' },
            staff: { value: false, note: '' },
            headerColor: 'bg-indigo-50/50'
        },
        {
            name: 'Sửa/xóa dự án được phân công',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            staff: { value: false, note: 'Chỉ sửa được trạng thái dự án' },
            headerColor: 'bg-indigo-50/50'
        },
        {
            name: 'Sao chép dự án',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            staff: { value: false, note: '' },
            headerColor: 'bg-indigo-50/50'
        },
    ],
    'QUẢN LÝ NHIỆM VỤ': [
        {
            name: 'Tạo nhiệm vụ mới',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            staff: { value: false, note: 'Trong dự án được giao' },
            headerColor: 'bg-emerald-50/50'
        },
        {
            name: 'Giao việc cho người khác',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            staff: { value: false, note: 'Nếu là người phụ trách dự án' },
            headerColor: 'bg-emerald-50/50'
        },
        {
            name: 'Xem tất cả nhiệm vụ',
            admin: { value: true, note: '' },
            manager: { value: false, note: '' },
            staff: { value: false, note: '' },
            headerColor: 'bg-emerald-50/50'
        },
        {
            name: 'Sửa/xóa nhiệm vụ của mình',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            staff: { value: true, note: '' },
            headerColor: 'bg-emerald-50/50'
        },
        {
            name: 'Sao chép nhiệm vụ',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            staff: { value: false, note: 'Nếu là người phụ trách dự án' },
            headerColor: 'bg-emerald-50/50'
        },
    ]
}

export const Users = () => {
    const { profile: _profile } = useAuthStore()
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
    const [form, setForm] = useState({
        staff_id: '', full_name: '', email: '', position: '', role: 'Nhân viên'
    })

    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchProfiles()
    }, [])

    const filteredProfiles = profiles.filter(p =>
        p.full_name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        p.staff_id.toLowerCase().includes(search.toLowerCase())
    )

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

    const getRoleBrand = (role: string) => {
        if (role === 'Admin') return { color: 'bg-orange-500', text: 'text-orange-500', badge: 'bg-orange-500 text-white', hover: 'hover:shadow-orange-200' }
        if (role === 'Quản lý') return { color: 'bg-blue-600', text: 'text-blue-600', badge: 'bg-blue-600 text-white', hover: 'hover:shadow-blue-200' }
        return { color: 'bg-emerald-500', text: 'text-emerald-500', badge: 'bg-emerald-500 text-white', hover: 'hover:shadow-emerald-200' }
    }

    const getInitials = (name: string) => {
        if (!name) return '?'
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
                const { error } = await supabase.from('profiles').update({
                    full_name: form.full_name, position: form.position, role: form.role
                }).eq('id', editingProfile.id)
                if (error) {
                    console.error('Update profile error:', error)
                    alert(`Lỗi cập nhật: ${error.message}`)
                    return
                }
            } else {
                if (!form.full_name || !form.email) {
                    alert('Vui lòng nhập đầy đủ họ tên và email.')
                    return
                }
                const { error } = await supabase.from('profiles').insert({
                    staff_id: form.staff_id,
                    full_name: form.full_name,
                    email: form.email,
                    position: form.position || null,
                    role: form.role
                })
                if (error) {
                    console.error('Insert profile error:', error)
                    alert(`Lỗi thêm nhân viên: ${error.message}`)
                    return
                }
            }
            setShowModal(false)
            fetchProfiles()
        } catch (err) {
            console.error(err)
            alert('Lỗi hệ thống khi lưu thông tin nhân viên.')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return
        await supabase.from('profiles').delete().eq('id', id)
        fetchProfiles()
    }


    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>

    return (
        <div className="space-y-6 max-w-[1450px] mx-auto pb-10">
            {/* Action Section Below Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white/40 p-4 rounded-3xl border border-white/30 gap-4">
                <div className="relative w-full sm:w-80">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm nhân viên..."
                        className="w-full bg-white/80 border border-slate-200/50 pl-10 pr-4 py-3 rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                    />
                </div>
                <button
                    onClick={openAddModal}
                    className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-2xl text-[12px] font-black shadow-xl shadow-orange-200/50 transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-wider"
                >
                    <UserPlus size={18} strokeWidth={3} />
                    Thêm nhân viên
                </button>
            </div>

            {/* Permissions Matrix - High Fidelity */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100/50 flex items-center gap-3 bg-slate-50/50">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Info size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Phân quyền hệ thống</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">Quy định truy cập</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/30">
                                <th className="text-left py-6 px-10 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] w-1/3">Chức năng hệ thống</th>
                                <th className="text-center py-6 px-6 font-black text-orange-500 text-[10px] uppercase tracking-[0.2em]">👑 ADMIN</th>
                                <th className="text-center py-6 px-6 font-black text-blue-600 text-[10px] uppercase tracking-[0.2em]">👤 QUẢN LÝ</th>
                                <th className="text-center py-6 px-6 font-black text-emerald-500 text-[10px] uppercase tracking-[0.2em]">👥 NHÂN VIÊN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(PERMISSIONS).map(([category, perms]) => (
                                <React.Fragment key={category}>
                                    <tr className={category === 'QUẢN LÝ DỰ ÁN' ? 'bg-indigo-50/40' : 'bg-emerald-50/40'}>
                                        <td colSpan={4} className={`py-3 px-10 text-[11px] font-black uppercase tracking-[0.15em] ${category === 'QUẢN LÝ DỰ ÁN' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                                            <span className="flex items-center gap-2">
                                                {category === 'QUẢN LÝ DỰ ÁN' ? <FolderKanban size={14} /> : <CheckSquare size={14} />}
                                                {category}
                                            </span>
                                        </td>
                                    </tr>
                                    {perms.map((p, i) => (
                                        <tr key={i} className="border-b border-slate-50 hover:bg-white/90 transition-all group">
                                            <td className="py-4 px-10 text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                                                {p.name}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    {p.admin.value ? <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm shadow-emerald-100"><Check size={14} className="text-emerald-600" strokeWidth={4} /></div> : <X size={18} className="text-red-400" />}
                                                    {p.admin.note && <span className="text-[9px] text-slate-400 font-medium italic bg-slate-50 px-2 py-0.5 rounded-full">{p.admin.note}</span>}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    {p.manager.value ? <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm shadow-emerald-100"><Check size={14} className="text-emerald-600" strokeWidth={4} /></div> : <X size={18} className="text-red-400" />}
                                                    {p.manager.note && <span className="text-[9px] text-slate-400 font-medium italic bg-slate-50 px-2 py-0.5 rounded-full">{p.manager.note}</span>}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    {p.staff.value ? <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm shadow-emerald-100"><Check size={14} className="text-emerald-600" strokeWidth={4} /></div> : <X size={18} className="text-red-400" />}
                                                    {p.staff.note && <span className="text-[9px] text-slate-400 font-medium italic bg-slate-50 px-2 py-0.5 rounded-full">{p.staff.note}</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 pt-4">
                {filteredProfiles.map(p => {
                    const brand = getRoleBrand(p.role)
                    return (
                        <div key={p.id} className={`bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all duration-300 text-center flex flex-col group relative overflow-hidden ${brand.hover}`}>
                            {/* Background Accent */}
                            <div className={`absolute top-0 inset-x-0 h-1.5 ${brand.color} opacity-20`}></div>

                            {/* Role Icon/Initial Circle */}
                            <div className={`w-16 h-16 mx-auto rounded-full ${brand.color} text-white flex items-center justify-center text-sm font-black mb-5 shadow-xl shadow-slate-200 ring-8 ring-slate-50 relative group-hover:scale-110 transition-transform duration-500`}>
                                {getInitials(p.full_name)}
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                                    <div className={`w-3.5 h-3.5 rounded-full ${brand.color} animate-pulse`}></div>
                                </div>
                            </div>

                            <h4 className="text-sm font-black text-slate-800 mb-1 tracking-tight group-hover:text-blue-600 transition-colors uppercase">{p.full_name}</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{p.position || 'Chức vụ'}</p>
                            <p className="text-[10px] text-slate-400 mb-6 truncate italic font-medium">{p.email}</p>

                            <div className="mt-auto flex flex-col items-center">
                                <span className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${brand.badge} shadow-lg transition-all group-hover:px-6`}>
                                    {p.role}
                                </span>

                                <div className="flex items-center justify-center gap-3 mt-8">
                                    <button
                                        onClick={() => openEditModal(p)}
                                        className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-sm border border-blue-100 hover:bg-blue-600 hover:text-white transition-all transform hover:-translate-y-1"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit3 size={15} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(p.id)}
                                        className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-sm border border-red-100 hover:bg-red-500 hover:text-white transition-all transform hover:-translate-y-1"
                                        title="Xóa"
                                    >
                                        <Trash2 size={15} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Modal - Polished */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
                        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                                    {editingProfile ? 'Sửa thông tin' : 'Thêm nhân viên'}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Hồ sơ hệ thống</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-5">
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-widest pl-1">Mã nhân viên</label>
                                <input value={form.staff_id} disabled className="w-full px-5 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-[11px] font-black text-slate-400 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-widest pl-1">Họ tên đầy đủ <span className="text-red-500">*</span></label>
                                <input
                                    value={form.full_name}
                                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                    placeholder="Nhập họ tên..."
                                />
                            </div>
                            {!editingProfile && (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-widest pl-1">Email <span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                        placeholder="example@email.com"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-widest pl-1">Chức danh / Vị trí</label>
                                <input
                                    value={form.position}
                                    onChange={e => setForm({ ...form, position: e.target.value })}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-widest pl-1">Phân quyền vai trò</label>
                                <select
                                    value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value })}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                                >
                                    <option>Admin</option>
                                    <option>Quản lý</option>
                                    <option>Nhân viên</option>
                                </select>
                            </div>
                        </div>
                        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-6 py-2.5 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest">Hủy bỏ</button>
                            <button onClick={handleSave} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest">
                                {editingProfile ? 'Cập nhật' : 'Thêm mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

