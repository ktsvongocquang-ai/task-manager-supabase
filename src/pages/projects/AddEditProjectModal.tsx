import React from 'react';
import { type Project } from '../../types';
import { X, Sparkles } from 'lucide-react';
import { GenerateAIProjectModal } from './GenerateAIProjectModal';

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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        {editingProject ? 'Sửa dự án' : 'Tạo dự án mới'}
                        {!editingProject && (
                            <div className="flex bg-slate-200/50 p-1 rounded-lg ml-4">
                                <button
                                    onClick={() => setActiveTab('manual')}
                                    className="px-3 py-1 text-xs font-semibold rounded-md transition-all bg-white shadow-sm text-slate-800"
                                >
                                    Thủ công
                                </button>
                                <button
                                    onClick={() => setActiveTab('ai')}
                                    className="px-3 py-1 flex items-center gap-1.5 text-xs font-semibold rounded-md transition-all text-slate-500 hover:text-indigo-600"
                                >
                                    <Sparkles size={14} />
                                    Tạo bằng AI
                                </button>
                            </div>
                        )}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-white rounded-lg">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
            </div>
        </div>
    );
};
