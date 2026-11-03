import { useEffect, useState } from 'react'
import { X, Users } from 'lucide-react'
import { supabase } from '../../services/supabase'

interface EditProjectMembersModalProps {
    isOpen: boolean
    onClose: () => void
    projectId: string
    projectName?: string
    staffOptions: { id: string; full_name: string; role?: string }[]
}

/** Nhóm nhân sự theo mảng: Thiết kế (Quản lý thiết kế) trước, Thi công (Quản lý thi công / Giám Sát) sau. */
const groupStaffByCategory = (staffOptions: { id: string; full_name: string; role?: string }[]) => [
    { label: 'Thiết kế', items: staffOptions.filter(s => s.role === 'Quản lý thiết kế') },
    { label: 'Thi công', items: staffOptions.filter(s => s.role !== 'Quản lý thiết kế') },
].filter(g => g.items.length > 0)

export const EditProjectMembersModal = ({ isOpen, onClose, projectId, projectName, staffOptions }: EditProjectMembersModalProps) => {
    const [memberIds, setMemberIds] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        setLoading(true)
        supabase.from('construction_project_members').select('user_id').eq('project_id', projectId).then(({ data }) => {
            setMemberIds((data || []).map((r: any) => r.user_id))
            setLoading(false)
        })
    }, [isOpen, projectId])

    if (!isOpen) return null

    const handleSave = async () => {
        setSaving(true)
        try {
            await supabase.from('construction_project_members').delete().eq('project_id', projectId)
            if (memberIds.length > 0) {
                const { error } = await supabase.from('construction_project_members').insert(
                    memberIds.map(user_id => ({ project_id: projectId, user_id }))
                )
                if (error) {
                    alert(`Lỗi lưu thành viên: ${error.message}`)
                    return
                }
            }
            onClose()
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white border border-slate-200 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90dvh] overflow-y-auto">
                <div className="sticky top-0 z-10 px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-500" />
                        <h3 className="text-base font-bold text-slate-800">Thành viên dự án{projectName ? ` — ${projectName}` : ''}</h3>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 p-1">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-5">
                    <p className="text-xs text-slate-500 mb-3">Chỉ Quản lý thi công / Giám Sát / Quản lý thiết kế được tick ở đây mới thấy dự án này trong danh sách của họ.</p>
                    {loading ? (
                        <p className="text-sm text-slate-500 text-center py-6">Đang tải...</p>
                    ) : staffOptions.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-6">Chưa có Quản lý thi công / Giám Sát nào trong Nhân sự.</p>
                    ) : (
                        <div className="max-h-64 overflow-y-auto border border-slate-300 rounded-xl divide-y divide-slate-200">
                            {groupStaffByCategory(staffOptions).map(group => (
                                <div key={group.label}>
                                    <p className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-50">{group.label}</p>
                                    {group.items.map(s => {
                                        const checked = memberIds.includes(s.id)
                                        return (
                                            <label key={s.id} className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer border-t border-slate-200">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={e => {
                                                        setMemberIds(prev => e.target.checked ? [...prev, s.id] : prev.filter(id => id !== s.id))
                                                    }}
                                                    className="accent-[#7A1216]"
                                                />
                                                <span className="truncate">{s.full_name}{s.role ? ` (${s.role})` : ''}</span>
                                            </label>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="sticky bottom-0 px-5 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-800">
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="px-6 py-2 bg-[#7A1216] hover:bg-[#5C0E11] text-white rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                        {saving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                </div>
            </div>
        </div>
    )
}
