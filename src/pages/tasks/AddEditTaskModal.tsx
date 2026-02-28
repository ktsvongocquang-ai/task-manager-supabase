import React, { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { type Task, type Project } from '../../types'
import { X } from 'lucide-react'

interface AddEditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editingTask: Task | null;
    initialData: {
        task_code: string;
        project_id: string;
    };
    projects: Project[];
    profiles: any[];
    currentUserProfile: any;
    generateNextTaskCode?: (projectId: string) => string;
}

export const AddEditTaskModal: React.FC<AddEditTaskModalProps> = ({
    isOpen,
    onClose,
    onSaved,
    editingTask,
    initialData,
    projects,
    profiles,
    currentUserProfile,
    generateNextTaskCode
}) => {
    const [form, setForm] = useState({
        task_code: '', project_id: '', name: '', description: '', assignee_id: '',
        status: 'Chưa bắt đầu', priority: 'Trung bình', start_date: '', due_date: '',
        completion_pct: 0, target: '', result_links: '', output: '', notes: '',
        completion_date: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (editingTask) {
                setForm({
                    task_code: editingTask.task_code, project_id: editingTask.project_id, name: editingTask.name, description: editingTask.description || '',
                    assignee_id: editingTask.assignee_id || '', status: editingTask.status, priority: editingTask.priority,
                    start_date: editingTask.start_date || '', due_date: editingTask.due_date || '', completion_pct: editingTask.completion_pct,
                    target: editingTask.target || '', result_links: editingTask.result_links || '', output: editingTask.output || '', notes: editingTask.notes || '',
                    completion_date: editingTask.completion_date || ''
                })
            } else {
                setForm({
                    task_code: initialData.task_code, project_id: initialData.project_id, name: '', description: '',
                    assignee_id: '', status: 'Chưa bắt đầu', priority: 'Trung bình',
                    start_date: '', due_date: '', completion_pct: 0, target: '', result_links: '', output: '', notes: '',
                    completion_date: ''
                })
            }
        }
    }, [isOpen, editingTask, initialData]);

    const handleProjectChange = (projectId: string) => {
        setForm(prev => {
            const nextCode = generateNextTaskCode ? generateNextTaskCode(projectId) : prev.task_code;
            return {
                ...prev,
                project_id: projectId,
                task_code: nextCode
            }
        });
    }

    useEffect(() => {
        if (!isOpen) return;

        // Auto-complete
        if (form.status === 'Hoàn thành' && form.completion_pct !== 100) {
            setForm(prev => ({
                ...prev,
                completion_pct: 100,
                completion_date: prev.completion_date || new Date().toISOString().split('T')[0]
            }));
        } else if (form.completion_pct === 100 && form.status !== 'Hoàn thành') {
            setForm(prev => ({
                ...prev,
                status: 'Hoàn thành',
                completion_date: prev.completion_date || new Date().toISOString().split('T')[0]
            }));
        } else if (form.status !== 'Hoàn thành' && form.completion_date) {
            setForm(prev => ({
                ...prev,
                completion_date: ''
            }));
        }

        // Auto-enforce date minimums
        if (form.start_date && form.due_date && form.due_date < form.start_date) {
            setForm(prev => ({ ...prev, due_date: prev.start_date }));
        }

    }, [form.status, form.completion_pct, form.start_date, form.due_date, isOpen]);

    const isCurrentUserManagerOfSelectedProject = () => {
        if (!form.project_id) return false;
        const p = projects.find(x => x.id === form.project_id);
        return p?.manager_id === currentUserProfile?.id;
    }

    const shouldDisableTopFields = () => {
        if (currentUserProfile?.role === 'Admin') return false;
        if (currentUserProfile?.role === 'Quản lý' && isCurrentUserManagerOfSelectedProject()) return false;
        if (currentUserProfile?.role === 'Nhân viên' && isCurrentUserManagerOfSelectedProject()) return false;
        return editingTask !== null;
    }

    const handleSave = async () => {
        try {
            const payload = {
                name: form.name,
                description: form.description || null,
                assignee_id: form.assignee_id || null,
                status: form.status,
                priority: form.priority,
                start_date: form.start_date || null,
                due_date: form.due_date || null,
                completion_pct: Number(form.completion_pct) || 0,
                target: form.target || null,
                result_links: form.result_links || null,
                output: form.output || null,
                notes: form.notes || null,
                completion_date: form.completion_date || null
            }

            let result;
            if (editingTask) {
                result = await supabase.from('tasks').update(payload).eq('id', editingTask.id)
            } else {
                if (!form.project_id) {
                    alert('Vui lòng chọn dự án cho nhiệm vụ này.')
                    return
                }
                result = await supabase.from('tasks').insert({
                    ...payload,
                    task_code: form.task_code,
                    project_id: form.project_id
                })
            }

            if (result.error) {
                console.error('Supabase Task Error:', result.error)
                alert(`Lỗi Supabase (Nhiệm vụ): ${result.error.message}`)
                return
            }

            onSaved()
        } catch (err) {
            console.error('Task Catch Error:', err)
            alert('Lỗi hệ thống khi lưu nhiệm vụ.')
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">{editingTask ? 'Chỉnh sửa nhiệm vụ' : 'Thêm nhiệm vụ mới'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-50 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-8 overflow-y-auto max-h-[75vh] space-y-6">
                    {/* Tên nhiệm vụ */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Tên nhiệm vụ <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium ${shouldDisableTopFields() ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                            placeholder="Ví dụ: Thiết kế giao diện chính..."
                            disabled={shouldDisableTopFields()}
                        />
                    </div>

                    {/* Dự án */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Thuộc dự án <span className="text-red-500">*</span></label>
                        <select
                            value={form.project_id}
                            onChange={(e) => handleProjectChange(e.target.value)}
                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium appearance-none ${shouldDisableTopFields() ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                            disabled={shouldDisableTopFields()}
                        >
                            <option value="">Chọn dự án</option>
                            {projects.filter(p => currentUserProfile?.role === 'Admin' || p.manager_id === currentUserProfile?.id || editingTask !== null || p.id === initialData.project_id).map(p => <option key={p.id} value={p.id}>{p.name} ({p.project_code})</option>)}
                        </select>
                    </div>

                    {/* Mô tả */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Mô tả</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[100px] resize-none ${shouldDisableTopFields() ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                            placeholder="Nội dung mô tả nhiệm vụ..."
                            disabled={shouldDisableTopFields()}
                        />
                    </div>

                    {/* Người thực hiện & Ưu tiên */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Người thực hiện</label>
                            <select
                                value={form.assignee_id}
                                onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}
                                className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium appearance-none ${shouldDisableTopFields() ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                                disabled={shouldDisableTopFields()}
                            >
                                <option value="">Chọn người</option>
                                {profiles.filter(p => currentUserProfile?.role === 'Admin' || isCurrentUserManagerOfSelectedProject() || p.id === currentUserProfile?.id).map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Ưu tiên</label>
                            <select
                                value={form.priority}
                                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium appearance-none ${shouldDisableTopFields() ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                                disabled={shouldDisableTopFields()}
                            >
                                <option value="Thấp">Thấp</option>
                                <option value="Trung bình">Trung bình</option>
                                <option value="Cao">Cao</option>
                                <option value="Khẩn cấp">Khẩn cấp</option>
                            </select>
                        </div>
                    </div>

                    {/* Ngày bắt đầu & Hạn chót */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Ngày bắt đầu <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={form.start_date}
                                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                min={form.project_id ? projects.find(p => p.id === form.project_id)?.start_date?.split('T')[0] : undefined}
                                max={form.project_id ? projects.find(p => p.id === form.project_id)?.end_date?.split('T')[0] : undefined}
                                className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${shouldDisableTopFields() ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                                disabled={shouldDisableTopFields()}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Hạn chót <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={form.due_date}
                                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                                min={form.start_date || (form.project_id ? projects.find(p => p.id === form.project_id)?.start_date?.split('T')[0] : undefined)}
                                max={form.project_id ? projects.find(p => p.id === form.project_id)?.end_date?.split('T')[0] : undefined}
                                className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${shouldDisableTopFields() ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                                disabled={shouldDisableTopFields()}
                            />
                        </div>
                    </div>

                    {/* Trạng thái, Tiến độ, Ngày hoàn thành */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Trạng thái</label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium appearance-none"
                            >
                                <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                                <option value="Đang thực hiện">Đang thực hiện</option>
                                <option value="Hoàn thành">Hoàn thành</option>
                                <option value="Tạm dừng">Tạm dừng</option>
                                <option value="Hủy bỏ">Hủy bỏ</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Tiến độ (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={form.completion_pct}
                                onChange={(e) => setForm({ ...form, completion_pct: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Ngày hoàn thành</label>
                            <input
                                type="date"
                                value={form.completion_date}
                                onChange={(e) => setForm({ ...form, completion_date: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Mục tiêu */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Mục tiêu</label>
                        <textarea
                            value={form.target}
                            onChange={(e) => setForm({ ...form, target: e.target.value })}
                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[80px] resize-none ${shouldDisableTopFields() ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                            placeholder="Mô tả mục tiêu của nhiệm vụ..."
                            disabled={shouldDisableTopFields()}
                        />
                    </div>

                    {/* Link kết quả */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Link kết quả</label>
                        <textarea
                            value={form.result_links}
                            onChange={(e) => setForm({ ...form, result_links: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[80px] resize-none"
                            placeholder="Nhập mỗi link trên một dòng"
                        />
                    </div>

                    {/* Kết quả đầu ra */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Kết quả đầu ra</label>
                        <textarea
                            value={form.output}
                            onChange={(e) => setForm({ ...form, output: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[80px] resize-none"
                            placeholder="Mô tả kết quả đầu ra mong muốn..."
                        />
                    </div>

                    {/* Ghi chú */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Ghi chú</label>
                        <textarea
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[80px] resize-none"
                            placeholder="Ghi chú thêm..."
                        />
                    </div>
                </div>
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-10 py-2.5 bg-[#3a31d8] hover:bg-[#2e26b1] text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 uppercase tracking-wider"
                    >
                        {editingTask ? 'Cập nhật' : 'Tạo nhiệm vụ'}
                    </button>
                </div>
            </div>
        </div>
    )
}
