import React, { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { type Task, type Project } from '../../types'
import { X, Plus, Trash2, CheckCircle2 } from 'lucide-react'

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
        supporter_id: '', status: 'Chưa bắt đầu', priority: 'Trung bình', due_date: '',
        result_links: '', notes: ''
    });

    const [subTasks, setSubTasks] = useState<{ id: string, text: string, completed: boolean }[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (editingTask) {
                setForm({
                    task_code: editingTask.task_code, project_id: editingTask.project_id, name: editingTask.name, description: editingTask.description || '',
                    assignee_id: editingTask.assignee_id || '', supporter_id: editingTask.supporter_id || '', status: editingTask.status, priority: editingTask.priority,
                    due_date: editingTask.due_date || '', result_links: editingTask.result_links || '', notes: editingTask.notes || ''
                });

                // Parse subtasks from JSON in notes column if available
                try {
                    if (editingTask.notes && editingTask.notes.startsWith('[')) {
                        setSubTasks(JSON.parse(editingTask.notes));
                    } else {
                        setSubTasks([]);
                    }
                } catch (e) {
                    setSubTasks([]);
                }

            } else {
                setForm({
                    task_code: initialData.task_code, project_id: initialData.project_id, name: '', description: '',
                    assignee_id: '', supporter_id: '', status: 'Chưa bắt đầu', priority: 'Trung bình',
                    due_date: '', result_links: '', notes: ''
                });
                setSubTasks([]);
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
        // The modal logic no longer auto-calculates dates as heavily since fields were removed
    }, [form.status, isOpen]);

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
                supporter_id: form.supporter_id || null,
                status: form.status,
                priority: form.priority,
                due_date: form.due_date || null,
                result_links: form.result_links || null,
                notes: subTasks.length > 0 ? JSON.stringify(subTasks) : null
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

    const addSubTask = () => {
        setSubTasks([...subTasks, { id: crypto.randomUUID(), text: '', completed: false }]);
    };

    const updateSubTask = (id: string, text: string) => {
        setSubTasks(subTasks.map(st => st.id === id ? { ...st, text } : st));
    };

    const toggleSubTask = (id: string, completed: boolean) => {
        setSubTasks(subTasks.map(st => st.id === id ? { ...st, completed } : st));
    };

    const removeSubTask = (id: string) => {
        setSubTasks(subTasks.filter(st => st.id !== id));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        {editingTask ? 'Chi Tiết Công Việc' : 'Tạo mới Công Việc'}
                        {editingTask && <Trash2 size={18} className="text-red-500 hover:text-red-600 cursor-pointer ml-2" />}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5 bg-white">

                    {/* Tiêu đề */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Tiêu đề</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium ${shouldDisableTopFields() ? 'bg-slate-50 cursor-not-allowed text-slate-500' : ''}`}
                            placeholder="Nhập tiêu đề công việc..."
                            disabled={shouldDisableTopFields()}
                        />
                    </div>

                    {/* Trạng thái & Mức độ ưu tiên */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Trạng thái</label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                            >
                                <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                                <option value="Đang làm">Đang làm</option>
                                <option value="Đang thực hiện">Đang thực hiện</option>
                                <option value="Hoàn thành">Hoàn thành</option>
                                <option value="Tạm dừng">Tạm dừng</option>
                                <option value="Hủy bỏ">Hủy bỏ</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Mức độ ưu tiên</label>
                            <select
                                value={form.priority}
                                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium ${shouldDisableTopFields() ? 'bg-slate-50 cursor-not-allowed text-slate-500' : ''}`}
                                disabled={shouldDisableTopFields()}
                            >
                                <option value="Thấp">Thấp</option>
                                <option value="Trung bình">Trung bình</option>
                                <option value="Cao">Cao</option>
                                <option value="Khẩn cấp">Khẩn cấp</option>
                            </select>
                        </div>
                    </div>

                    {/* Phụ trách & Người hỗ trợ */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Phụ trách</label>
                            <select
                                value={form.assignee_id}
                                onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}
                                className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium ${shouldDisableTopFields() ? 'bg-slate-50 cursor-not-allowed text-slate-500' : ''}`}
                                disabled={shouldDisableTopFields()}
                            >
                                <option value="">Chọn người</option>
                                {profiles.filter(p => currentUserProfile?.role === 'Admin' || isCurrentUserManagerOfSelectedProject() || p.id === currentUserProfile?.id).map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Người hỗ trợ</label>
                            <select
                                value={form.supporter_id}
                                onChange={(e) => setForm({ ...form, supporter_id: e.target.value })}
                                className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium ${shouldDisableTopFields() ? 'bg-slate-50 cursor-not-allowed text-slate-500' : ''}`}
                                disabled={shouldDisableTopFields()}
                            >
                                <option value="">Chọn người hỗ trợ</option>
                                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Tên Dự Án & Hạn chót */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Tên Dự Án</label>
                            <select
                                value={form.project_id}
                                onChange={(e) => handleProjectChange(e.target.value)}
                                className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium ${shouldDisableTopFields() ? 'bg-slate-50 cursor-not-allowed text-slate-500' : ''}`}
                                disabled={shouldDisableTopFields()}
                            >
                                <option value="">Chọn dự án</option>
                                {projects.filter(p => currentUserProfile?.role === 'Admin' || p.manager_id === currentUserProfile?.id || editingTask !== null || p.id === initialData.project_id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Hạn chót</label>
                            <input
                                type="date"
                                value={form.due_date}
                                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                                max={form.project_id ? projects.find(p => p.id === form.project_id)?.end_date?.split('T')[0] : undefined}
                                className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${shouldDisableTopFields() ? 'bg-slate-50 cursor-not-allowed text-slate-500' : ''}`}
                                disabled={shouldDisableTopFields()}
                            />
                        </div>
                    </div>

                    {/* Công việc con / Ghi chú (Checklist) */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Công việc con / Ghi chú</label>
                        <div className="space-y-2 mb-3">
                            {subTasks.map((st) => (
                                <div key={st.id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 group">
                                    <div className="pt-0.5 shrink-0 relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={st.completed}
                                            onChange={(e) => toggleSubTask(st.id, e.target.checked)}
                                            className="w-5 h-5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 z-10 opacity-0 absolute cursor-pointer"
                                        />
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${st.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-transparent border-slate-300'}`}>
                                            {st.completed && <CheckCircle2 size={14} className="stroke-[3]" />}
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={st.text}
                                        onChange={(e) => updateSubTask(st.id, e.target.value)}
                                        placeholder="Mô tả công việc con..."
                                        className={`flex-1 bg-transparent border-none text-sm focus:outline-none text-slate-800 ${st.completed ? 'line-through text-slate-400' : ''}`}
                                    />
                                    <button onClick={() => removeSubTask(st.id)} className="text-red-500/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addSubTask}
                            className="w-full py-3 border border-dashed border-slate-300 rounded-lg text-sm font-medium text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Thêm mục
                        </button>
                    </div>

                    {/* Link kết quả */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Link kết quả</label>
                        <textarea
                            value={form.result_links}
                            onChange={(e) => setForm({ ...form, result_links: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[80px] resize-none"
                            placeholder="Nhập link kết quả..."
                        />
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-slate-300 bg-white rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        Đóng
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95"
                    >
                        Lưu Lại
                    </button>
                </div>
            </div>
        </div>
    )
}
