import { X } from 'lucide-react'

interface AddEditUserModalProps {
    isEditing: boolean
    form: {
        staff_id: string
        full_name: string
        email: string
        position: string
        role: string
        password?: string
    }
    setForm: (form: any) => void
    onClose: () => void
    onSave: () => void
}

export const AddEditUserModal = ({ isEditing, form, setForm, onClose, onSave }: AddEditUserModalProps) => {
    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-border-main">
                <div className="px-6 py-4 border-b border-border-main flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-base font-semibold text-text-main">
                            {isEditing ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    {!isEditing && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mã nhân viên</label>
                            <input value={form.staff_id} disabled className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed" />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ tên <span className="text-red-500">*</span></label>
                        <input
                            value={form.full_name}
                            onChange={e => setForm({ ...form, full_name: e.target.value })}
                            className="w-full px-4 py-2 bg-white border border-border-main rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="Nhập họ tên..."
                        />
                    </div>
                    {!isEditing && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full px-4 py-2 bg-white border border-border-main rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                placeholder="example@email.com"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Chức vụ</label>
                        <input
                            value={form.position}
                            onChange={e => setForm({ ...form, position: e.target.value })}
                            className="w-full px-4 py-2 bg-white border border-border-main rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="Vị trí công việc..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phân quyền</label>
                        <select
                            value={form.role}
                            onChange={e => setForm({ ...form, role: e.target.value })}
                            className="w-full px-4 py-2 bg-white border border-border-main rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        >
                            <option value="Admin">Admin</option>
                            <option value="Quản lý">Quản lý</option>
                            <option value="Nhân viên">Nhân viên</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu {!isEditing && <span className="text-red-500">*</span>}</label>
                        <input
                            type="password"
                            value={form.password || ''}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            className="w-full px-4 py-2 bg-white border border-border-main rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50/50 border-t border-border-main flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-transparent">Hủy</button>
                    <button onClick={onSave} className="px-5 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                        {isEditing ? 'Cập nhật' : 'Thêm nhân viên'}
                    </button>
                </div>
            </div>
        </div>
    )
}
