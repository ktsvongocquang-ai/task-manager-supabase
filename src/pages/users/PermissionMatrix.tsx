import React from 'react'
import { Check, X, Info, FolderKanban, CheckSquare, Crown, User } from 'lucide-react'

const PERMISSIONS = {
    'QUẢN LÝ DỰ ÁN': [
        {
            name: 'Tạo dự án mới',
            admin: { value: true, note: '' },
            manager: { value: true, note: 'Chỉ tạo cho bản thân phụ trách' },
            staff: { value: false, note: '' }
        },
        {
            name: 'Xem tất cả dự án',
            admin: { value: true, note: '' },
            manager: { value: false, note: '' },
            staff: { value: false, note: '' }
        },
        {
            name: 'Sửa/xóa dự án được phân công',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            staff: { value: false, note: 'Chỉ sửa được trạng thái dự án' }
        },
        {
            name: 'Sao chép dự án',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            staff: { value: false, note: '' }
        },
    ],
    'QUẢN LÝ NHIỆM VỤ': [
        {
            name: 'Tạo nhiệm vụ mới',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            staff: { value: false, note: 'Trong dự án được giao' }
        },
        {
            name: 'Giao việc cho người khác',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            staff: { value: false, note: 'Nếu là người phụ trách dự án' }
        },
        {
            name: 'Xem tất cả nhiệm vụ',
            admin: { value: true, note: '' },
            manager: { value: false, note: '' },
            staff: { value: false, note: '' }
        },
        {
            name: 'Sửa/xóa nhiệm vụ của mình',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            staff: { value: true, note: '' }
        },
        {
            name: 'Sao chép nhiệm vụ',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            staff: { value: false, note: 'Nếu là người phụ trách dự án' }
        },
    ]
}

export const PermissionMatrix = () => {
    return (
        <div className="bg-white border border-border-main rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border-main flex items-center gap-3 bg-gray-50/50">
                <div className="text-gray-900 font-semibold flex items-center gap-2">
                    <Info size={18} className="text-primary" />
                    Phân quyền hệ thống
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border-main bg-gray-50">
                            <th className="text-left py-4 px-6 font-semibold text-gray-500 w-1/3">Chức năng</th>
                            <th className="text-center py-4 px-6 font-semibold text-admin"><div className="flex items-center justify-center gap-1.5"><Crown size={18} /> Admin</div></th>
                            <th className="text-center py-4 px-6 font-semibold text-manager"><div className="flex items-center justify-center gap-1.5"><User size={18} /> Quản lý</div></th>
                            <th className="text-center py-4 px-6 font-semibold text-employee"><div className="flex items-center justify-center gap-1.5"><User size={18} /> Nhân viên</div></th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(PERMISSIONS).map(([category, perms]) => (
                            <React.Fragment key={category}>
                                <tr className="bg-gray-50/80">
                                    <td colSpan={4} className="py-2.5 px-6 text-xs font-bold text-gray-600 uppercase tracking-widest bg-gray-100/50">
                                        <div className="flex items-center gap-2">
                                            {category === 'QUẢN LÝ DỰ ÁN' ? <FolderKanban size={16} /> : <CheckSquare size={16} />}
                                            {category}
                                        </div>
                                    </td>
                                </tr>
                                {perms.map((p, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6 font-medium text-gray-700">
                                            {p.name}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {p.admin.value ? <Check size={20} className="text-green-500" strokeWidth={3} /> : <X size={20} className="text-red-500" strokeWidth={3} />}
                                                {p.admin.note && <span className="text-[10px] text-gray-500 font-medium">{p.admin.note}</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {p.manager.value ? <Check size={20} className="text-green-500" strokeWidth={3} /> : <X size={20} className="text-red-500" strokeWidth={3} />}
                                                {p.manager.note && <span className="text-[10px] text-gray-500 font-medium">{p.manager.note}</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {p.staff.value ? <Check size={20} className="text-green-500" strokeWidth={3} /> : <X size={20} className="text-red-500" strokeWidth={3} />}
                                                {p.staff.note && <span className="text-[10px] text-gray-500 font-medium">{p.staff.note}</span>}
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
    )
}
