import React from 'react';
import { type Project } from '../../types';
import { X, Sparkles, Link } from 'lucide-react';
import { GenerateAIProjectModal } from './GenerateAIProjectModal';

interface ProjectInfoTabProps {
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
        budget?: number;
        scale?: string;
        project_type?: string;
        area_sqm?: number | string;
        timelinePhases?: any[];
        link_hien_trang?: string;
        link_du_an?: string;
        link_presentation?: string;
    };
    setForm: (form: any) => void;
    profiles: any[];
    currentUserProfile: any;
}

export const ProjectInfoTab: React.FC<ProjectInfoTabProps> = ({
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
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(form);
    };

    if (activeTab === 'ai') {
        return (
            <GenerateAIProjectModal
                isOpen={true}
                onClose={() => setActiveTab('manual')}
                profiles={profiles}
                currentUserProfile={currentUserProfile}
                onSuccess={onClose}
            />
        );
    }

    return (
        <div className="w-full flex flex-col h-full bg-white sm:rounded-b-3xl">
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 custom-scrollbar">
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                {/* Removed Header */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mã dự án</label>
                            <input
                                type="text"
                                value={form.project_code}
                                onChange={(e) => setForm({ ...form, project_code: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                                <option value="Thi công">Thi công</option>
                                <option value="Hoàn thành">Hoàn thành</option>
                                <option value="Tạm dừng">Tạm dừng</option>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        {!['Admin', 'Quản lý', 'Giám đốc'].includes(currentUserProfile?.role?.trim() || '') && (
                            <p className="text-[10px] text-slate-400 mt-1.5 italic">* Nhân sự này tạo dự án sẽ mặc định được gán làm quản lý dự án đó.</p>
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

                    {/* Link fields */}
                    <div className="pt-1 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Link size={11} /> Liên kết dự án
                        </p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link hiện trạng / Mirror</label>
                                <input
                                    type="url"
                                    value={form.link_hien_trang || ''}
                                    onChange={(e) => setForm({ ...form, link_hien_trang: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-300"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link dự án làm việc</label>
                                <input
                                    type="url"
                                    value={form.link_du_an || ''}
                                    onChange={(e) => setForm({ ...form, link_du_an: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-300"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link Present PDF / Canvas</label>
                                <input
                                    type="url"
                                    value={form.link_presentation || ''}
                                    onChange={(e) => setForm({ ...form, link_presentation: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-300"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-4 bg-gradient-to-t from-[#F3F4F6] via-[#F3F4F6] to-transparent mt-4">
                <button
                    onClick={handleSubmit}
                    disabled={!form.name || !form.project_code}
                    className="w-full bg-[#C4B5FD] hover:bg-[#A78BFA] text-white py-3.5 rounded-2xl text-[15px] font-bold uppercase tracking-widest shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {editingProject ? 'Cập nhật dự án' : 'Lưu dự án mới'}
                </button>
            </div>
        </div>
    );
};
