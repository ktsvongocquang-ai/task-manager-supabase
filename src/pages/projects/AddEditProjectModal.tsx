import React from 'react';
import { type Project } from '../../types';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { calculateWorkingDays } from '../../utils/dateUtils';

interface AddEditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: any) => Promise<void>;
    editingProject: Project | null;
    form: {
        name: string;
        project_code: string;
        description: string;
        status: string;
        start_date: string;
        end_date: string;
        manager_id: string;
    };
    setForm: (form: any) => void;
    profiles: any[];
    currentUserProfile: any;
}

export const AddEditProjectModal: React.FC<AddEditProjectModalProps> = ({
    isOpen,
    onClose,
    onSave,
    editingProject,
    form,
    setForm,
    profiles,
    currentUserProfile
}) => {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = React.useState<'manual' | 'ai'>('manual');
    const [aiPrompt, setAiPrompt] = React.useState('');
    const [aiStartDate, setAiStartDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [isGenerating, setIsGenerating] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(form);
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        try {
            // 1. Ask Serverless API to generate project JSON via Gemini
            const res = await fetch('/api/generate-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt, startDate: aiStartDate })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to generate project');
            }

            const data = await res.json();
            const { project_name, project_description, tasks } = data.project;

            // 2. Insert Project
            const finalProjectId = await insertGeneratedProject(project_name, project_description);
            if (!finalProjectId) throw new Error("Could not insert generated project");

            // 3. Bulk Insert Tasks with calculated dates
            await insertGeneratedTasks(finalProjectId, tasks);

            alert('Tạo dự án bằng AI thành công!');
            onClose(); // Close modal, parent should refresh automatically
        } catch (error: any) {
            console.error(error);
            alert(`Lỗi khi tạo bằng AI: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const insertGeneratedProject = async (name: string, description: string) => {
        // Assume manager_id defaults to currentUserProfile.id
        const managerId = currentUserProfile?.id;
        const { data, error } = await supabase
            .from('projects')
            .insert([{
                name,
                description,
                project_code: `AI-${Math.floor(Math.random() * 10000)}`,
                status: 'Chưa bắt đầu',
                start_date: aiStartDate,
                manager_id: managerId
            }])
            .select()
            .single();

        if (error) throw error;
        return data.id;
    };

    const insertGeneratedTasks = async (projectId: string, tasks: any[]) => {
        let currentDateStart = new Date(aiStartDate);

        const tasksToInsert = tasks.map((t: any) => {
            const startDateStr = currentDateStart.toISOString().split('T')[0];
            const endDate = calculateWorkingDays(currentDateStart, parseInt(t.duration_days) || 1);
            const endDateStr = endDate.toISOString().split('T')[0];

            // For simplicity, shift the start date of the NEXT task to be the day after
            // the previous task ends, or the same day. Real Gantt logic would be more complex.
            // Let's make them purely sequential for this MVP demo
            currentDateStart = endDate;

            return {
                project_id: projectId,
                title: t.task_name,
                description: t.description,
                priority: t.priority,
                status: 'Mới tạo',
                start_date: startDateStr,
                end_date: endDateStr,
                // Assign to the manager by default, they can re-assign later
                assignee_id: currentUserProfile?.id
            };
        });

        const { error } = await supabase.from('tasks').insert(tasksToInsert);
        if (error) throw error;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        {editingProject ? 'Sửa dự án' : 'Tạo dự án mới'}
                        {!editingProject && (
                            <div className="flex bg-slate-200/50 p-1 rounded-lg ml-4">
                                <button
                                    onClick={() => setActiveTab('manual')}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeTab === 'manual' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Thủ công
                                </button>
                                <button
                                    onClick={() => setActiveTab('ai')}
                                    className={`px-3 py-1 flex items-center gap-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'ai' ? 'bg-indigo-600 shadow-sm text-white' : 'text-slate-500 hover:text-indigo-600'}`}
                                >
                                    <Sparkles size={14} className={activeTab === 'ai' ? 'text-indigo-200' : ''} />
                                    Tạo bằng AI
                                </button>
                            </div>
                        )}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-white rounded-lg">
                        <X size={20} />
                    </button>
                </div>
                {activeTab === 'manual' ? (
                    <>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mã dự án</label>
                                    <input
                                        type="text"
                                        value={form.project_code}
                                        onChange={(e) => setForm({ ...form, project_code: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        disabled={!!editingProject}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Trạng thái</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                                        <option value="Đang thực hiện">Đang thực hiện</option>
                                        <option value="Hoàn thành">Hoàn thành</option>
                                        <option value="Tạm dừng">Tạm dừng</option>
                                        <option value="Hủy bỏ">Hủy bỏ</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên dự án</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-300"
                                    placeholder="Nhập tên dự án..."
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        value={form.start_date}
                                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày kết thúc</label>
                                    <input
                                        type="date"
                                        value={form.end_date}
                                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quản lý dự án</label>
                                <select
                                    value={form.manager_id}
                                    onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-75 disabled:cursor-not-allowed"
                                    disabled={currentUserProfile?.role !== 'Admin' && currentUserProfile?.role !== 'Quản lý'}
                                >
                                    <option value="">Chọn quản lý</option>
                                    {profiles
                                        .filter(p => currentUserProfile?.role === 'Admin' || currentUserProfile?.role === 'Quản lý' || p.id === currentUserProfile?.id)
                                        .map(p => (
                                            <option key={p.id} value={p.id}>{p.full_name}</option>
                                        ))}
                                </select>
                                {currentUserProfile?.role === 'Nhân viên' && (
                                    <p className="text-[10px] text-slate-400 mt-1.5 italic">* Nhân viên tạo dự án sẽ mặc định được gán làm quản lý dự án đó.</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mô tả</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-300"
                                    placeholder="Mô tả tóm tắt dự án..."
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!form.name || !form.project_code}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all active:scale-95 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editingProject ? 'Cập nhật' : 'Lưu dự án'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="p-6 space-y-5">
                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 shrink-0">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-indigo-900 mb-1">Mô tả dự án bạn muốn tạo</h4>
                                    <p className="text-xs text-indigo-600/80 leading-relaxed">
                                        AI sẽ tự động phân tích yêu cầu của bạn để tạo ra tên dự án, mô tả chi tiết, và danh sách các nhiệm vụ cụ thể. Thời hạn của từng nhiệm vụ sẽ được tự động tính toán (bỏ qua Thứ 7, Chủ Nhật).
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Yêu cầu của bạn</label>
                                <textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    rows={5}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-slate-400 shadow-inner"
                                    placeholder="Ví dụ: Tạo dự án thiết kế và code một Website bán quần áo. Thời gian bắt đầu từ tuần tới. Cần có các task thiết kế Figma, code fontend React, làm backend Nodejs, và Test. Tổng cộng khoảng 2 tuần..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày bắt đầu dự án</label>
                                <input
                                    type="date"
                                    value={aiStartDate}
                                    onChange={(e) => setAiStartDate(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isGenerating}
                                className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleAiGenerate}
                                disabled={!aiPrompt.trim() || isGenerating}
                                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-300 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        AI Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        Phân tích & Tạo
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
