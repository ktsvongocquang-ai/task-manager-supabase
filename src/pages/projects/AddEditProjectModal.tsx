import React from 'react';
import { type Project } from '../../types';
import { X, Sparkles, Link } from 'lucide-react';
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
        budget?: number;
        scale?: string;
        project_type?: string;
        link_hien_trang?: string;
        link_du_an?: string;
        link_presentation?: string;
        area_sqm?: number | '';
        timelinePhases?: { phase: string, days: number }[];
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
    const [isEstimatingTimeline, setIsEstimatingTimeline] = React.useState(false);
    const [timelineError, setTimelineError] = React.useState('');

    const addDaysSkipSundays = (startDate: Date, days: number) => {
        let d = new Date(startDate);
        let added = 0;
        // Start from next day
        while (added < days) {
            d.setDate(d.getDate() + 1);
            if (d.getDay() !== 0) { // 0 is Sunday
                added++;
            }
        }
        return d;
    };

    const handleEstimateTimeline = async () => {
        if (!form.area_sqm || !form.project_type) {
            setTimelineError('Vui lòng nhập Diện tích và chọn Loại hình dự án trước.');
            return;
        }
        setTimelineError('');
        setIsEstimatingTimeline(true);
        try {
            const response = await fetch('/api/generate-timeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ area: form.area_sqm, projectType: form.project_type })
            });
            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            
            // Recalculate dates based on phases
            updateFormWithPhases(data);
        } catch (err) {
            console.error(err);
            setTimelineError('Lỗi khi gọi AI. Hãy thử lại.');
        } finally {
            setIsEstimatingTimeline(false);
        }
    };

    const updateFormWithPhases = (phases: {phase: string, days: number}[]) => {
        if (!form.start_date) {
            const today = new Date();
            form.start_date = today.toISOString().split('T')[0];
        }
        let currentDate = new Date(form.start_date);
        
        for (const p of phases) {
            currentDate = addDaysSkipSundays(currentDate, p.days);
        }
        
        setForm({
            ...form,
            timelinePhases: phases,
            end_date: currentDate.toISOString().split('T')[0]
        });
    };

    const handlePhaseDaysChange = (index: number, delta: number) => {
        if (!form.timelinePhases) return;
        const newPhases = [...form.timelinePhases];
        newPhases[index].days = Math.max(1, newPhases[index].days + delta);
        updateFormWithPhases(newPhases);
    };

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
        <div className="fixed inset-0 z-[9999]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"></div>
            <div className="fixed inset-0 z-10 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4 text-left">
                    <div className="relative transform bg-white sm:rounded-3xl sm:shadow-2xl transition-all w-full sm:max-w-lg">
                <div className="sticky top-0 z-20 px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/90 backdrop-blur-md sm:rounded-t-3xl shadow-[0_10px_20px_rgba(0,0,0,0.03)]">
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
                <div className="p-4 sm:p-6 space-y-4">
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
                            disabled={!['Admin', 'Quản lý', 'Giám đốc', 'Quản lý thiết kế', 'Quản lý thi công'].includes(currentUserProfile?.role || '')}
                        >
                            <option value="">Chọn quản lý</option>
                            {profiles
                                .filter(p => ['Admin', 'Quản lý', 'Giám đốc', 'Quản lý thiết kế', 'Quản lý thi công'].includes(currentUserProfile?.role || '') || p.id === currentUserProfile?.id)
                                .map(p => (
                                    <option key={p.id} value={p.id}>{p.full_name}</option>
                                ))}
                        </select>
                        {!['Admin', 'Quản lý', 'Giám đốc', 'Quản lý thiết kế', 'Quản lý thi công'].includes(currentUserProfile?.role?.trim() || '') && (
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

                    {/* Project Info Fields */}
                    <div className="pt-1 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            📐 Thông tin dự án
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Diện tích (m²)</label>
                                <input
                                    type="number"
                                    value={form.area_sqm || ''}
                                    onChange={(e) => setForm({ ...form, area_sqm: e.target.value ? Number(e.target.value) : '' })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-300"
                                    placeholder="100"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Loại hình</label>
                                <select
                                    value={form.project_type || ''}
                                    onChange={(e) => setForm({ ...form, project_type: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="">Chọn loại hình</option>
                                    <option value="Chung cư">Chung cư</option>
                                    <option value="Nhà ở">Nhà ở</option>
                                    <option value="Dịch vụ">Dịch vụ</option>
                                </select>
                            </div>
                        </div>

                        {/* AI Timeline Predictor */}
                        <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-xs font-bold text-indigo-800 uppercase flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-indigo-500" /> AI Dự kiến Tiến độ
                                </label>
                                <button
                                    type="button"
                                    onClick={handleEstimateTimeline}
                                    disabled={isEstimatingTimeline}
                                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isEstimatingTimeline ? 'Đang tính toán...' : 'Dự đoán Timeline'}
                                </button>
                            </div>
                            {timelineError && <p className="text-xs text-red-500 mb-2">{timelineError}</p>}
                            
                            {form.timelinePhases && form.timelinePhases.length > 0 && (
                                <div className="space-y-2 mt-3">
                                    {form.timelinePhases.map((phase, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-indigo-100 shadow-sm">
                                            <span className="text-sm font-medium text-slate-700">{idx + 1}. {phase.phase}</span>
                                            <div className="flex items-center gap-3">
                                                <button type="button" onClick={() => handlePhaseDaysChange(idx, -1)} className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors">-</button>
                                                <span className="text-sm font-bold w-12 text-center text-indigo-700">{phase.days} ngày</span>
                                                <button type="button" onClick={() => handlePhaseDaysChange(idx, 1)} className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors">+</button>
                                            </div>
                                        </div>
                                    ))}
                                    <p className="text-[10px] text-slate-500 text-right mt-1 italic">* Các mốc dự kiến sẽ tự động bỏ qua ngày Chủ Nhật.</p>
                                </div>
                            )}
                        </div>
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
                <div className="sticky bottom-0 z-20 px-6 py-4 bg-slate-50/90 backdrop-blur-md border-t border-slate-100 flex justify-end gap-3 shrink-0 sm:rounded-b-3xl shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-wider"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!form.name || !form.project_code}
                        className="px-6 py-2 bg-[#A78BFA] hover:bg-[#8B5CF6] text-white rounded-2xl text-sm font-bold shadow-sm transition-all active:scale-95 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {editingProject ? 'Cập nhật' : 'Lưu dự án'}
                    </button>
                </div>
            </div>
        </div>
        </div>
        </div>
    );
};
