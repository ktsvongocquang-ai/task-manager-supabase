import React, { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { type Task, type Project } from '../../types'
import { X, Plus, Trash2, CheckCircle2, Calendar, User, Folder, Flag, AlignLeft, Link as LinkIcon, ListTodo, MessageSquare, ExternalLink, GripVertical } from 'lucide-react'
import { logActivity } from '../../services/activity';
import { createNotification } from '../../services/notifications';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { CommentSection } from '../../components/chat/CommentSection';
import { format, parseISO } from 'date-fns';

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

    const [subTasks, setSubTasks] = useState<Task[]>([]);
    const [activeTab, setActiveTab] = useState<'subtasks' | 'comments' | 'links'>('subtasks');
    const [newSubtaskName, setNewSubtaskName] = useState('');
    const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);
    
    // Deep link state for subtasks
    const [drilledSubtask, setDrilledSubtask] = useState<Task | null>(null);

    const handleOpenDeepLink = async (subtaskId: string) => {
        const { data } = await supabase.from('tasks').select('*').eq('id', subtaskId).single();
        if (data) {
            setDrilledSubtask(data as Task);
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (editingTask) {
                setForm({
                    task_code: editingTask.task_code, project_id: editingTask.project_id, name: editingTask.name, description: editingTask.description || '',
                    assignee_id: editingTask.assignee_id || '', supporter_id: editingTask.supporter_id || '', status: editingTask.status, priority: editingTask.priority,
                    due_date: editingTask.due_date || '', result_links: editingTask.result_links || '', notes: editingTask.notes || ''
                });

                // Fetch actual subtasks from Supabase
                const fetchSubtasks = async () => {
                    setIsLoadingSubtasks(true);
                    try {
                        const { data, error } = await supabase
                            .from('tasks')
                            .select('*')
                            .eq('parent_id', editingTask.id)
                            .order('task_code', { ascending: true });
                        if (!error && data) {
                            setSubTasks(data as Task[]);
                        }
                    } catch (e) {
                        console.error('Error fetching subtasks:', e);
                    } finally {
                        setIsLoadingSubtasks(false);
                    }
                };
                fetchSubtasks();

            } else {
                setForm({
                    task_code: initialData.task_code, project_id: initialData.project_id, name: '', description: '',
                    assignee_id: '', supporter_id: '', status: 'Chưa bắt đầu', priority: 'Trung bình',
                    due_date: '', result_links: '', notes: ''
                });
                setSubTasks([]);
                setNewSubtaskName('');
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
        if (currentUserProfile?.role === 'Quản lý') return false;
        if (currentUserProfile?.role === 'Nhân viên' && isCurrentUserManagerOfSelectedProject()) return false;
        return editingTask !== null;
    }

    const handleSave = async () => {
        try {
            const payload = {
                name: form.name,
                task_code: form.task_code,
                description: form.description || null,
                assignee_id: form.assignee_id || null,
                supporter_id: form.supporter_id || null,
                status: form.status,
                priority: form.priority,
                due_date: form.due_date || null,
                result_links: form.result_links || null,
                notes: form.notes || null 
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
                }).select()
            }

            if (result.error) {
                console.error('Supabase Task Error:', result.error)
                alert(`Lỗi Supabase(Nhiệm vụ): ${result.error.message} `)
                return
            }

            // --- Notifications ---
            const newAssigneeId = form.assignee_id;
            if (newAssigneeId && newAssigneeId !== currentUserProfile?.id) {
                // Check if it's a new assignment
                const isNewAssignment = !editingTask || (editingTask.assignee_id !== newAssigneeId);
                if (isNewAssignment) {
                    await createNotification(
                        newAssigneeId,
                        `${currentUserProfile?.full_name || 'Admin'} đã giao cho bạn nhiệm vụ: "${form.name}"`,
                        'assignment',
                        currentUserProfile?.id,
                        editingTask ? editingTask.id : (result.data as any[])?.[0]?.id, // Ideally insert returns data if we do .select() but let's just use form project
                        form.project_id
                    );
                }
            }

            // --- Logging ---
            if (editingTask) {
                let changes = [];
                if (editingTask.name !== form.name) {
                    changes.push(`Tên: ${editingTask.name} -> ${form.name}`);
                }
                if (editingTask.status !== form.status) {
                    changes.push(`Trạng thái: ${editingTask.status || 'Trống'} -> ${form.status}`);
                }
                if ((editingTask.assignee_id || '') !== (form.assignee_id || '')) {
                    const oldAssignee = profiles.find(p => p.id === editingTask.assignee_id)?.full_name || 'Trống';
                    const newAssignee = profiles.find(p => p.id === form.assignee_id)?.full_name || 'Trống';
                    changes.push(`Phụ trách: ${oldAssignee} -> ${newAssignee}`);
                }
                if ((editingTask.supporter_id || '') !== (form.supporter_id || '')) {
                    const oldSup = profiles.find(p => p.id === editingTask.supporter_id)?.full_name || 'Trống';
                    const newSup = profiles.find(p => p.id === form.supporter_id)?.full_name || 'Trống';
                    changes.push(`Người hỗ trợ: ${oldSup} -> ${newSup}`);
                }
                if (editingTask.priority !== form.priority) {
                    changes.push(`Ưu tiên: ${editingTask.priority || 'Trống'} -> ${form.priority}`);
                }
                if ((editingTask.due_date || '') !== (form.due_date || '')) {
                    const oldDate = editingTask.due_date ? format(parseISO(editingTask.due_date), 'dd/MM/yyyy') : 'Trống';
                    const newDate = form.due_date ? format(parseISO(form.due_date), 'dd/MM/yyyy') : 'Trống';
                    changes.push(`Hạn chót: ${oldDate} -> ${newDate}`);
                }

                if (editingTask.notes !== form.notes) {
                    changes.push(`Ghi chú đã thay đổi`);
                }

                if (changes.length > 0) {
                    await logActivity('Sửa nhiệm vụ', `${changes.join('; ')} (Nhiệm vụ: ${form.name})`, editingTask.project_id);
                } else if (editingTask.description !== form.description || (editingTask.result_links || '') !== (form.result_links || '')) {
                    await logActivity('Sửa nhiệm vụ', `Cập nhật nội dung chi tiết (Nhiệm vụ: ${form.name})`, editingTask.project_id);
                }
            } else {
                await logActivity('Thêm nhiệm vụ', `Tạo mới: ${form.name}`, form.project_id);
            }
            // ---------------

            onSaved()
        } catch (err) {
            console.error('Task Catch Error:', err)
            alert('Lỗi hệ thống khi lưu nhiệm vụ.')
        }
    }; // <-- Missing this closing brace before handleAddSubtask

    const handleAddSubtask = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newSubtaskName.trim()) {
            if (!editingTask?.id) {
                alert('Vui lòng tạo (Lưu) công việc chính trước khi thêm nhiệm vụ con.');
                return;
            }

            const subTaskName = newSubtaskName.trim();
            setNewSubtaskName(''); // Clear immediately for snappy UX

            try {
                // Determine next code for subtask (e.g., AD-01-01)
                const currentCount = subTasks.length + 1;
                const newCode = `${editingTask.task_code}-${String(currentCount).padStart(2, '0')}`;

                const { data, error } = await supabase.from('tasks').insert({
                    name: subTaskName,
                    project_id: editingTask.project_id,
                    parent_id: editingTask.id,
                    task_code: newCode,
                    status: 'Chưa bắt đầu',
                    priority: 'Trung bình',
                    completion_pct: 0
                }).select().single();

                if (error) throw error;
                if (data) {
                    setSubTasks(prev => [...prev, data as Task]);
                }
            } catch (err) {
                console.error('Error adding subtask:', err);
                alert('Lỗi tạo nhiệm vụ con.');
            }
        }
    };

    const toggleSubTask = async (id: string, isCompleted: boolean) => {
        // Optimistic update
        const newStatus = isCompleted ? 'Hoàn thành' : 'Chưa bắt đầu';
        const newPct = isCompleted ? 100 : 0;
        
        setSubTasks(prev => prev.map(st => st.id === id ? { ...st, status: newStatus, completion_pct: newPct } : st));

        try {
            const { error } = await supabase.from('tasks').update({
                status: newStatus,
                completion_pct: newPct,
                completion_date: isCompleted ? new Date().toISOString().split('T')[0] : null
            }).eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating subtask:', err);
            // Revert on error could be implemented here
        }
    };

    const updateSubTaskCode = async (id: string, newCode: string) => {
        try {
            const { error } = await supabase.from('tasks').update({ task_code: newCode }).eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error('Error updating task_code:', err);
        }
    };

    const removeSubTask = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa nhiệm vụ con này?')) return;
        
        // Optimistic remove
        setSubTasks(prev => prev.filter(st => st.id !== id));

        try {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error('Error deleting subtask:', err);
        }
    };

    const onDragEndSubtasks = async (result: DropResult) => {
        if (!result.destination || !editingTask) return;

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        if (sourceIndex === destinationIndex) return;

        const newSubTasks = Array.from(subTasks);
        const [movedItem] = newSubTasks.splice(sourceIndex, 1);
        newSubTasks.splice(destinationIndex, 0, movedItem);

        // Optimistically update state
        setSubTasks(newSubTasks.map((st, index) => {
            const newCode = `${editingTask.task_code}-${String(index + 1).padStart(2, '0')}`;
            return { ...st, task_code: newCode };
        }));

        // Fire DB updates sequentially
        try {
            for (let i = 0; i < newSubTasks.length; i++) {
                const subTask = newSubTasks[i];
                const newCode = `${editingTask.task_code}-${String(i + 1).padStart(2, '0')}`;
                await supabase.from('tasks').update({ task_code: newCode }).eq('id', subTask.id);
            }
        } catch (err) {
            console.error('Error reordering subtasks:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <>
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-8 py-6 flex justify-between items-start bg-white shrink-0">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            {/* Nút delete nhỏ ở góc thay vì nằm cạnh title */}
                            <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500">
                                <AlignLeft size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">
                                {editingTask ? form.name || 'Chi Tiết Công Việc' : 'Tạo Công Việc Mới'}
                            </h2>
                            {editingTask && (
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ml-2 ${form.priority === 'Khẩn cấp' ? 'bg-red-50 text-red-600' :
                                    form.priority === 'Cao' ? 'bg-orange-50 text-orange-600' :
                                        form.priority === 'Trung bình' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'
                                    }`}>
                                    {form.priority}
                                </span>
                            )}
                        </div>
                        {editingTask && form.task_code && (
                            <div className="mt-1 ml-14 flex items-center">
                                <input
                                    type="text"
                                    value={form.task_code}
                                    onChange={(e) => setForm({ ...form, task_code: e.target.value })}
                                    className="text-sm font-medium text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-0 p-0 w-32 transition-colors"
                                    placeholder="Mã dự án (Ví dụ: UX/UI-A1)"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {editingTask && (
                            <button onClick={() => {/* TODO Delete Confirm */ }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body scrollable */}
                <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">

                    {!editingTask && (
                        <div className="mb-6 ml-14">
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full text-xl font-bold text-slate-800 placeholder:text-slate-300 border-none focus:ring-0 p-0"
                                placeholder="Nhập tiêu đề công việc..."
                                disabled={shouldDisableTopFields()}
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Form Grid Layout - SaaS Style */}
                    <div className="space-y-4 ml-14">

                        {/* Status */}
                        <div className="flex items-center min-h-[40px]">
                            <div className="w-36 flex items-center gap-2 text-sm font-medium text-slate-500 shrink-0">
                                <CheckCircle2 size={16} /> Trạng thái
                            </div>
                            <div className="flex-1">
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium cursor-pointer hover:bg-slate-50 transition-colors w-full max-w-[200px]"
                                >
                                    <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                                    <option value="Đang làm">Đang làm</option>
                                    <option value="Đang thực hiện">Đang thực hiện</option>
                                    <option value="Hoàn thành">Hoàn thành</option>
                                    <option value="Tạm dừng">Tạm dừng</option>
                                    <option value="Hủy bỏ">Hủy bỏ</option>
                                </select>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center min-h-[40px]">
                            <div className="w-36 flex items-center gap-2 text-sm font-medium text-slate-500 shrink-0">
                                <Calendar size={16} /> Hạn chót
                            </div>
                            <div className="flex-1">
                                <input
                                    type="date"
                                    value={form.due_date}
                                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                                    max={form.project_id ? projects.find(p => p.id === form.project_id)?.end_date?.split('T')[0] : undefined}
                                    className={`px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium cursor-pointer hover:bg-slate-50 transition-colors w-full max-w-[200px] ${shouldDisableTopFields() ? 'bg-slate-50 cursor-not-allowed text-slate-400' : ''}`}
                                    disabled={shouldDisableTopFields()}
                                />
                            </div>
                        </div>

                        {/* Assignee */}
                        <div className="flex items-center min-h-[40px]">
                            <div className="w-36 flex items-center gap-2 text-sm font-medium text-slate-500 shrink-0">
                                <User size={16} /> Phụ trách
                            </div>
                            <div className="flex-1 flex gap-2 items-center flex-wrap">
                                <select
                                    value={form.assignee_id}
                                    onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}
                                    className={`px-3 py-1.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold cursor-pointer hover:bg-indigo-50 transition-colors w-full max-w-[200px] ${shouldDisableTopFields() ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    disabled={shouldDisableTopFields()}
                                >
                                    <option value="" className="text-slate-400 font-normal">Chọn người phụ trách...</option>
                                    {profiles.filter(p => ['Admin', 'Quản lý'].includes(currentUserProfile?.role || '') || isCurrentUserManagerOfSelectedProject() || p.id === currentUserProfile?.id).map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                </select>

                                <select
                                    value={form.supporter_id}
                                    onChange={(e) => setForm({ ...form, supporter_id: e.target.value })}
                                    className={`px-3 py-1.5 bg-emerald-50/50 border border-emerald-100 rounded-lg text-sm text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold cursor-pointer hover:bg-emerald-50 transition-colors w-full max-w-[200px] ${shouldDisableTopFields() ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    disabled={shouldDisableTopFields()}
                                >
                                    <option value="" className="text-slate-400 font-normal">+ Hỗ trợ (Tùy chọn)</option>
                                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Project / Tags */}
                        <div className="flex items-center min-h-[40px]">
                            <div className="w-36 flex items-center gap-2 text-sm font-medium text-slate-500 shrink-0">
                                <Folder size={16} /> Dự án (Tags)
                            </div>
                            <div className="flex-1">
                                <select
                                    value={form.project_id}
                                    onChange={(e) => handleProjectChange(e.target.value)}
                                    className={`px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium cursor-pointer hover:bg-slate-100 transition-colors w-full max-w-[250px] ${shouldDisableTopFields() ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    disabled={shouldDisableTopFields()}
                                >
                                    <option value="">Chọn dự án...</option>
                                    {projects.filter(p => currentUserProfile?.role === 'Admin' || p.manager_id === currentUserProfile?.id || editingTask !== null || p.id === initialData.project_id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Priority */}
                        <div className="flex items-center min-h-[40px]">
                            <div className="w-36 flex items-center gap-2 text-sm font-medium text-slate-500 shrink-0">
                                <Flag size={16} /> Ưu tiên
                            </div>
                            <div className="flex-1">
                                <select
                                    value={form.priority}
                                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                    className={`px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-50 transition-colors w-full max-w-[200px] focus:outline-none ${form.priority === 'Khẩn cấp' ? 'text-red-600' :
                                        form.priority === 'Cao' ? 'text-orange-600' :
                                            form.priority === 'Trung bình' ? 'text-blue-600' : 'text-slate-600'
                                        } ${shouldDisableTopFields() ? 'bg-slate-50 cursor-not-allowed opacity-70' : ''}`}
                                    disabled={shouldDisableTopFields()}
                                >
                                    <option value="Thấp">Thấp</option>
                                    <option value="Trung bình">Trung bình</option>
                                    <option value="Cao">Cao</option>
                                    <option value="Khẩn cấp">Khẩn cấp</option>
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="flex items-start min-h-[40px] pt-2">
                            <div className="w-36 flex items-center gap-2 text-sm font-medium text-slate-500 shrink-0 mt-2">
                                <AlignLeft size={16} /> Mô tả
                            </div>
                            <div className="flex-1">
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all min-h-[80px] resize-none"
                                    placeholder="Thêm mô tả chi tiết cho nhiệm vụ này..."
                                />
                            </div>
                        </div>

                        <hr className="border-t border-slate-100 my-6" />

                        {/* Tabs Section */}
                        <div className="mt-8">
                            <div className="flex gap-6 border-b border-slate-200 mb-6">
                                <button
                                    onClick={() => setActiveTab('subtasks')}
                                    className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'subtasks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                >
                                    <ListTodo size={16} /> Subtasks <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs ml-1">{subTasks.length}</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('comments')}
                                    className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'comments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                >
                                    <MessageSquare size={16} /> Comments
                                </button>
                                <button
                                    onClick={() => setActiveTab('links')}
                                    className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'links' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                >
                                    <LinkIcon size={16} /> Đính kèm / Link
                                </button>
                            </div>

                            {/* Tab Content: Subtasks */}
                            {activeTab === 'subtasks' && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    {isLoadingSubtasks ? (
                                        <div className="text-center py-4 text-slate-400 text-sm">Đang tải nhiệm vụ con...</div>
                                    ) : subTasks.length === 0 && !editingTask?.id ? (
                                        <div className="text-center py-6 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-sm font-medium">
                                            Vui lòng lưu công việc chính trước khi thêm nhiệm vụ con.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <DragDropContext onDragEnd={onDragEndSubtasks}>
                                                <Droppable droppableId={`subtasks-${editingTask?.id || 'new'}`}>
                                                    {(provided) => (
                                                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                                            {subTasks.map((st, index) => {
                                                                const isCompleted = st.status === 'Hoàn thành';
                                                                return (
                                                                    <Draggable key={st.id} draggableId={st.id} index={index}>
                                                                        {(provided, snapshot) => (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                className={`flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm group hover:border-indigo-300 transition-colors
                                                                                    ${snapshot.isDragging ? 'shadow-lg border-indigo-400 rotate-1 z-50' : ''}
                                                                                `}
                                                                            >
                                                                                <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab px-1">
                                                                                    <GripVertical size={16} />
                                                                                </div>
                                                                                <div className="pt-0.5 shrink-0 relative flex items-center justify-center">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={isCompleted}
                                                                                        onChange={(e) => toggleSubTask(st.id, e.target.checked)}
                                                                                        className="w-5 h-5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 z-10 opacity-0 absolute cursor-pointer"
                                                                                    />
                                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isCompleted ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-transparent border-slate-300'}`}>
                                                                                        {isCompleted && <CheckCircle2 size={14} className="stroke-[3]" />}
                                                                                    </div>
                                                                                </div>
                                                                                <button 
                                                                                    onClick={() => handleOpenDeepLink(st.id)}
                                                                                    className={`flex-1 text-sm font-medium text-left transition-colors hover:text-indigo-600 focus:outline-none ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}
                                                                                >
                                                                                    {st.name}
                                                                                </button>
                                                                                <input
                                                                                    type="text"
                                                                                    value={st.task_code || ''}
                                                                                    onChange={(e) => setSubTasks(prev => prev.map(item => item.id === st.id ? { ...item, task_code: e.target.value } : item))}
                                                                                    onBlur={(e) => updateSubTaskCode(st.id, e.target.value)}
                                                                                    className="text-[10px] font-mono text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border-none focus:ring-1 focus:ring-indigo-300 w-24 transition-colors cursor-text"
                                                                                    placeholder="Mã..."
                                                                                />
                                                                                <button 
                                                                                    onClick={() => handleOpenDeepLink(st.id)} 
                                                                                    className="text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-50 hover:bg-white border border-transparent shadow-sm hover:border-slate-200 hover:shadow rounded-lg ml-2"
                                                                                    title="Mở chi tiết (Cửa sổ mới)"
                                                                                >
                                                                                    <ExternalLink size={16} />
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => removeSubTask(st.id)} 
                                                                                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 ml-1 bg-slate-50 hover:bg-red-50 rounded-lg"
                                                                                    title="Xóa Subtask"
                                                                                >
                                                                                    <Trash2 size={16} />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                );
                                                            })}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </DragDropContext>

                                            {editingTask?.id && (
                                                <div className="relative mt-4">
                                                    <input
                                                        type="text"
                                                        value={newSubtaskName}
                                                        onChange={(e) => setNewSubtaskName(e.target.value)}
                                                        onKeyDown={handleAddSubtask}
                                                        placeholder="Nhập nhiệm vụ con và nhấn Enter..."
                                                        className="w-full py-3 pl-12 pr-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all placeholder:text-slate-400"
                                                    />
                                                    <Plus size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab Content: Comments */}
                            {activeTab === 'comments' && (
                                <div className="animate-in fade-in duration-200 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                                    {editingTask?.id ? (
                                        <CommentSection
                                            taskId={editingTask.id}
                                            currentUserProfile={currentUserProfile}
                                            profiles={profiles}
                                            itemName={editingTask.name}
                                        />
                                    ) : (
                                        <div className="text-center py-8 text-slate-400 text-sm font-medium">
                                            Vui lòng lưu nhiệm vụ trước khi có thể trao đổi bình luận.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab Content: Links */}
                            {activeTab === 'links' && (
                                <div className="animate-in fade-in duration-200">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                            <LinkIcon size={16} /> Đường dẫn kết quả / File Google Drive
                                        </label>
                                        <textarea
                                            value={form.result_links}
                                            onChange={(e) => setForm({ ...form, result_links: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[100px] resize-none"
                                            placeholder="Paste link Figma, Google Drive, Docs vào đây..."
                                        />
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Footer fixed */}
                <div className="px-8 py-5 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0 rounded-b-3xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border-0 hover:bg-slate-100 bg-transparent rounded-xl text-sm font-bold text-slate-600 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2"
                    >
                        Lưu Lại
                    </button>
                </div>
            </div>
        </div>

            {/* Recursively render another AddEditTaskModal for deep-linking into subtasks */}
            {drilledSubtask && (
                <AddEditTaskModal
                    isOpen={!!drilledSubtask}
                    onClose={() => setDrilledSubtask(null)}
                    onSaved={() => {
                        setDrilledSubtask(null);
                        // Force subtasks refresh to get latest names/codes/statuses
                        if (editingTask?.id) {
                            supabase.from('tasks').select('*').eq('parent_id', editingTask.id).order('task_code', { ascending: true })
                                .then(({ data }) => setSubTasks((data || []) as Task[]));
                        }
                    }}
                    editingTask={drilledSubtask}
                    initialData={{ task_code: drilledSubtask.task_code, project_id: drilledSubtask.project_id }}
                    projects={projects}
                    profiles={profiles}
                    currentUserProfile={currentUserProfile}
                    generateNextTaskCode={generateNextTaskCode}
                />
            )}
        </>
    )
}
