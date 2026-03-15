import React from 'react'
import { Check, X, Info, FolderKanban, CheckSquare, Crown, User, Palette, Video, HeartHandshake, HardHat, LayoutTemplate } from 'lucide-react'

const PERMISSIONS = {
    'QUYỀN TRUY CẬP (TAB)': [
        {
            name: 'Tab Công Việc (Kanban, Danh sách)',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: true, note: '' },
            marketing: { value: true, note: '' },
            sale: { value: true, note: '' },
            supervisor: { value: true, note: '' }
        },
        {
            name: 'Tab Marketing',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: false, note: '' },
            marketing: { value: true, note: '' },
            sale: { value: false, note: '' },
            supervisor: { value: false, note: '' }
        },
        {
            name: 'Tab Thi Công',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: true, note: '' },
            marketing: { value: true, note: '' },
            sale: { value: true, note: '' },
            supervisor: { value: true, note: '' }
        },
        {
            name: 'Tab Chăm Sóc Khách Hàng',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: false, note: '' },
            marketing: { value: false, note: '' },
            sale: { value: true, note: '' },
            supervisor: { value: false, note: '' }
        },
        {
            name: 'Moodboard',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: true, note: '' },
            marketing: { value: false, note: '' },
            sale: { value: false, note: '' },
            supervisor: { value: false, note: '' }
        },
    ],
    'QUẢN LÝ DỰ ÁN': [
        {
            name: 'Tạo dự án mới',
            admin: { value: true, note: '' },
            manager: { value: true, note: 'Chỉ tạo dự án phụ trách' },
            design: { value: false, note: '' },
            marketing: { value: false, note: '' },
            sale: { value: false, note: '' },
            supervisor: { value: false, note: '' }
        },
        {
            name: 'Xem tất cả dự án',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: false, note: '' },
            marketing: { value: false, note: '' },
            sale: { value: false, note: '' },
            supervisor: { value: false, note: '' }
        },
        {
            name: 'Sửa/xóa dự án',
            admin: { value: true, note: '' },
            manager: { value: true, note: 'Chỉ dự án của mình' },
            design: { value: false, note: '' },
            marketing: { value: false, note: '' },
            sale: { value: false, note: '' },
            supervisor: { value: false, note: '' }
        },
    ],
    'QUẢN LÝ NHIỆM VỤ': [
        {
            name: 'Tạo nhiệm vụ mới',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: true, note: '' },
            marketing: { value: true, note: '' },
            sale: { value: true, note: '' },
            supervisor: { value: true, note: '' }
        },
        {
            name: 'Giao việc cho người khác',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: false, note: '' },
            marketing: { value: false, note: '' },
            sale: { value: false, note: '' },
            supervisor: { value: true, note: '' }
        },
        {
            name: 'Xem tất cả nhiệm vụ',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: false, note: '' },
            marketing: { value: false, note: '' },
            sale: { value: false, note: '' },
            supervisor: { value: false, note: '' }
        },
        {
            name: 'Cập nhật tiến độ CV',
            admin: { value: true, note: '' },
            manager: { value: true, note: '' },
            design: { value: true, note: '' },
            marketing: { value: true, note: '' },
            sale: { value: true, note: '' },
            supervisor: { value: true, note: '' }
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
                            <th className="text-left py-4 px-6 font-semibold text-gray-500 min-w-[200px] sticky left-0 bg-gray-50 z-10 border-r border-slate-200">Chức năng / Các Tab</th>
                            <th className="text-center py-4 px-4 font-semibold text-admin"><div className="flex flex-col items-center justify-center gap-1.5"><Crown size={18} /> Admin</div></th>
                            <th className="text-center py-4 px-4 font-semibold text-manager"><div className="flex flex-col items-center justify-center gap-1.5"><User size={18} /> Quản lý</div></th>
                            <th className="text-center py-4 px-4 font-semibold text-indigo-500"><div className="flex flex-col items-center justify-center gap-1.5"><Palette size={18} /> Thiết Kế</div></th>
                            <th className="text-center py-4 px-4 font-semibold text-pink-500"><div className="flex flex-col items-center justify-center gap-1.5"><Video size={18} /> Marketing</div></th>
                            <th className="text-center py-4 px-4 font-semibold text-emerald-600"><div className="flex flex-col items-center justify-center gap-1.5"><HeartHandshake size={18} /> Sale</div></th>
                            <th className="text-center py-4 px-4 font-semibold text-amber-600"><div className="flex flex-col items-center justify-center gap-1.5"><HardHat size={18} /> Giám Sát</div></th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(PERMISSIONS).map(([category, perms]) => (
                            <React.Fragment key={category}>
                                <tr className="bg-gray-50/80">
                                    <td colSpan={7} className="py-2.5 px-6 text-xs font-bold text-gray-600 uppercase tracking-widest bg-gray-100/50">
                                        <div className="flex items-center gap-2 sticky left-0">
                                            {category === 'QUẢN LÝ DỰ ÁN' ? <FolderKanban size={16} /> : category === 'QUYỀN TRUY CẬP (TAB)' ? <LayoutTemplate size={16} /> : <CheckSquare size={16} />}
                                            {category}
                                        </div>
                                    </td>
                                </tr>
                                {perms.map((p, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6 font-medium text-gray-700 sticky left-0 bg-white border-r border-slate-100">
                                            {p.name}
                                        </td>
                                        {[p.admin, p.manager, p.design, p.marketing, p.sale, p.supervisor].map((role, idx) => (
                                            <td key={idx} className="py-4 px-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    {role.value ? <Check size={20} className="text-emerald-500" strokeWidth={3} /> : <X size={20} className="text-rose-500" strokeWidth={3} />}
                                                    {role.note && <span className="text-[9px] text-gray-500 font-medium leading-tight max-w-[100px]">{role.note}</span>}
                                                </div>
                                            </td>
                                        ))}
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
