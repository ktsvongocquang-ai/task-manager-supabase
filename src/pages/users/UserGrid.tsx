import { type Profile } from '../../types'
import { Edit3, Trash2 } from 'lucide-react'

interface UserGridProps {
    profiles: Profile[]
    currentUserRole?: string
    onEdit: (profile: Profile) => void
    onDelete: (id: string) => void
}

export const UserGrid = ({ profiles, currentUserRole, onEdit, onDelete }: UserGridProps) => {
    const getRoleBrand = (role: string) => {
        if (role === 'Admin') return { color: 'bg-admin', text: 'text-admin', badge: 'bg-orange-50 text-admin' }
        if (role === 'Quản lý') return { color: 'bg-manager', text: 'text-manager', badge: 'bg-blue-50 text-manager' }
        return { color: 'bg-employee', text: 'text-employee', badge: 'bg-green-50 text-employee' }
    }

    const getInitials = (name: string) => {
        if (!name) return '?'
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 pt-4">
            {profiles.map(p => {
                const brand = getRoleBrand(p.role)
                return (
                    <div key={p.id} className="bg-white border border-border-main rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-center flex flex-col group relative">
                        {/* Avatar */}
                        <div className={`w-14 h-14 mx-auto rounded-full ${brand.color} text-white flex items-center justify-center text-lg font-bold mb-4 shadow-sm`}>
                            {getInitials(p.full_name)}
                        </div>

                        {/* Info */}
                        <h4 className="text-[15px] font-semibold text-text-main mb-1 truncate">{p.full_name}</h4>
                        <p className="text-xs text-gray-500 mb-1 truncate">{p.position || 'Chức vụ'}</p>
                        <p className="text-xs text-gray-400 mb-5 truncate">{p.email}</p>

                        <div className="mt-auto flex flex-col items-center">
                            {/* Role Badge */}
                            <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${brand.badge}`}>
                                {p.role}
                            </span>

                            {/* Actions */}
                            {currentUserRole === 'Admin' && (
                                <div className="flex items-center justify-center gap-3 mt-6 border-t border-gray-100 pt-4 w-full">
                                    <button
                                        onClick={() => onEdit(p)}
                                        className="w-9 h-9 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-colors"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(p.id)}
                                        className="w-9 h-9 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
                                        title="Xóa"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
