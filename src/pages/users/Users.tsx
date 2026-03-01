import { useEffect, useState } from 'react'
import { supabase, supabaseAdmin } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import { type Profile } from '../../types'
import { Search, UserPlus } from 'lucide-react'
import { PermissionMatrix } from './PermissionMatrix'
import { UserGrid } from './UserGrid'
import { AddEditUserModal } from './AddEditUserModal'

export const Users = () => {
    const { profile: _profile } = useAuthStore()
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
    const [form, setForm] = useState({
        staff_id: '', full_name: '', email: '', position: '', role: 'Nhân viên', password: ''
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

    const openAddModal = () => {
        setEditingProfile(null)
        const nextId = `NV${String(profiles.length + 1).padStart(3, '0')}`
        setForm({ staff_id: nextId, full_name: '', email: '', position: '', role: 'Nhân viên', password: '' })
        setShowModal(true)
    }

    const openEditModal = (p: Profile) => {
        setEditingProfile(p)
        setForm({
            staff_id: p.staff_id, full_name: p.full_name, email: p.email,
            position: p.position || '', role: p.role, password: ''
        })
        setShowModal(true)
    }

    const handleSave = async () => {
        try {
            if (editingProfile) {
                const { error: profileError } = await supabase.from('profiles').update({
                    full_name: form.full_name, position: form.position, role: form.role
                }).eq('id', editingProfile.id)

                if (profileError) {
                    console.error('Update profile error:', profileError)
                    alert(`Lỗi cập nhật: ${profileError.message}`)
                    return
                }

                if (form.password) {
                    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
                        editingProfile.id,
                        { password: form.password }
                    )
                    if (passwordError) {
                        console.error('Update password error:', passwordError)
                        alert(`Lỗi cập nhật mật khẩu: ${passwordError.message}. Lưu ý: Tính năng này yêu cầu thêm VITE_SUPABASE_SERVICE_ROLE_KEY trong file .env.`)
                        return
                    }
                }
            } else {
                if (!form.full_name || !form.email || !form.password) {
                    alert('Vui lòng nhập đầy đủ họ tên, email và mật khẩu.')
                    return
                }

                const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
                    email: form.email,
                    password: form.password,
                    options: {
                        data: {
                            full_name: form.full_name
                        }
                    }
                })

                if (authError) {
                    console.error('Sign up error:', authError)
                    alert(`Lỗi tạo tài khoản: ${authError.message}`)
                    return
                }

                const newUserId = authData?.user?.id
                if (!newUserId) {
                    alert('Không thể lấy ID người dùng mới.')
                    return
                }

                const { error } = await supabase.from('profiles').insert({
                    id: newUserId,
                    staff_id: form.staff_id,
                    full_name: form.full_name,
                    email: form.email,
                    position: form.position || null,
                    role: form.role
                })
                if (error) {
                    console.error('Insert profile error:', error)
                    alert(`Lỗi thêm nhân viên vào danh bạ: ${error.message}`)
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

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    return (
        <div className="space-y-6 max-w-[1450px] mx-auto pb-10">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-96">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm nhân viên..."
                        className="w-full bg-white border border-border-main pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    />
                </div>
                {_profile?.role === 'Admin' && (
                    <button
                        onClick={openAddModal}
                        className="w-full sm:w-auto bg-primary hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                        <UserPlus size={18} />
                        Thêm nhân viên
                    </button>
                )}
            </div>

            {/* Matrix */}
            <PermissionMatrix />

            {/* Grid */}
            <UserGrid
                profiles={filteredProfiles}
                currentUserRole={_profile?.role}
                onEdit={openEditModal}
                onDelete={handleDelete}
            />

            {/* Modal */}
            {showModal && (
                <AddEditUserModal
                    isEditing={!!editingProfile}
                    form={form}
                    setForm={setForm}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    )
}
