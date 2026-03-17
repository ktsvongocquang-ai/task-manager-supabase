import React, { useState, useEffect } from 'react';
import { type Project } from '../../types';
import { X } from 'lucide-react';

interface MarketingProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: any) => Promise<void>;
    editingProject?: Project | null;
    profiles: any[];
    currentUserProfile: any;
}

const PROJECT_TYPES = [
    'Chung cư', 'F&B - Nhà hàng', 'F&B - Cafe', 'Biệt thự - Villa', 'Spa - Clinic - Salon', 'Nhà phố', 'Showroom', 'Khác'
];

const UPDATE_STATUSES = [
    'Đầy đủ hình ảnh', 'Hình nhật ký', 'Hình hoàn thiện', 'Chưa có hình'
];

const EFFECT_TYPES = [
    'Minimal', 'Rustic', 'Industrial', 'Tropical', 'Wabi Sabi', 'Modern', 'Neo Classic', 'Indochine', 'Classic'
    // or whatever standard styles
];

export const MarketingProjectModal: React.FC<MarketingProjectModalProps> = ({
    isOpen,
    onClose,
    onSave,
    editingProject,
    profiles,
    currentUserProfile
}) => {
    const [form, setForm] = useState({
        name: '',
        project_code: '',
        description: '',
        status: 'Chưa bắt đầu',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        manager_id: currentUserProfile?.id || '',
        department: 'Marketing',
        project_type: '',
        update_status: '',
        scale: '',
        effect_type: '',
        effect_description: '',
        address: '',
        image_folder_link: '',
        video_folder_link: '',
        can_shoot_video: 'Có thể',
        customer_problem: '',
        dqh_solution: '',
        other_info: '',
        content_link: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (editingProject) {
                setForm({
                    name: editingProject.name || '',
                    project_code: editingProject.project_code || '',
                    description: editingProject.description || '',
                    status: editingProject.status || 'Chưa bắt đầu',
                    start_date: editingProject.start_date || new Date().toISOString().split('T')[0],
                    end_date: editingProject.end_date || '',
                    manager_id: editingProject.manager_id || currentUserProfile?.id || '',
                    department: editingProject.department || 'Marketing',
                    project_type: editingProject.project_type || '',
                    update_status: editingProject.update_status || '',
                    scale: editingProject.scale || '',
                    effect_type: editingProject.effect_type || '',
                    effect_description: editingProject.effect_description || '',
                    address: editingProject.address || '',
                    image_folder_link: editingProject.image_folder_link || '',
                    video_folder_link: editingProject.video_folder_link || '',
                    can_shoot_video: editingProject.can_shoot_video || 'Có thể',
                    customer_problem: editingProject.customer_problem || '',
                    dqh_solution: editingProject.dqh_solution || '',
                    other_info: editingProject.other_info || '',
                    content_link: editingProject.content_link || ''
                });
            } else {
                setForm({
                    name: '',
                    project_code: `PRJ-${Math.floor(Date.now() / 1000)}`,
                    description: '',
                    status: 'Chưa bắt đầu',
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    manager_id: currentUserProfile?.id || '',
                    department: 'Marketing',
                    project_type: '',
                    update_status: '',
                    scale: '',
                    effect_type: '',
                    effect_description: '',
                    address: '',
                    image_folder_link: '',
                    video_folder_link: '',
                    can_shoot_video: 'Có thể',
                    customer_problem: '',
                    dqh_solution: '',
                    other_info: '',
                    content_link: ''
                });
            }
        }
    }, [isOpen, editingProject, currentUserProfile]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const saveForm = { ...form };
        if (!saveForm.project_code) {
            saveForm.project_code = `PRJ-${Math.floor(Date.now() / 1000)}`;
        }
        await onSave(saveForm);
    };

    const toggleEffectType = (effect: string) => {
        const currentEffects = form.effect_type ? form.effect_type.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (currentEffects.includes(effect)) {
            const next = currentEffects.filter(e => e !== effect).join(', ');
            setForm({ ...form, effect_type: next });
        } else {
            currentEffects.push(effect);
            setForm({ ...form, effect_type: currentEffects.join(', ') });
        }
    };

    const isEffectSelected = (effect: string) => {
        const currentEffects = form.effect_type ? form.effect_type.split(',').map(s => s.trim()) : [];
        return currentEffects.includes(effect);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                    <div className="flex flex-col">
                        <h3 className="text-xl font-bold text-slate-900">
                            Form Cung Cấp Thông Tin Marketing
                        </h3>
                        <p className="text-sm font-normal text-slate-500 mt-1">
                            Điền đầy đủ thông tin để team Marketing có chất liệu lên nội dung
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-lg self-start">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar bg-slate-50/30">
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">Tên công trình <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                                    placeholder="VD: Chung cư Palm Height"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">Loại công trình <span className="text-red-500">*</span></label>
                                <select
                                    value={form.project_type}
                                    onChange={(e) => setForm({ ...form, project_type: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700"
                                    required
                                >
                                    <option value="">Chọn loại công trình</option>
                                    {PROJECT_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">Tình trạng <span className="text-red-500">*</span></label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700"
                                    required
                                >
                                    <option value="">Chọn tình trạng</option>
                                    <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                                    <option value="Đang thực hiện">Đang thực hiện</option>
                                    <option value="Hoàn thành">Hoàn thành</option>
                                    <option value="Tạm dừng">Tạm dừng</option>
                                    <option value="Hủy bỏ">Hủy bỏ</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trạng thái cập nhật hình ảnh</label>
                                <select
                                    value={form.update_status}
                                    onChange={(e) => setForm({ ...form, update_status: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700"
                                >
                                    <option value="">Chọn trạng thái</option>
                                    {UPDATE_STATUSES.map(us => <option key={us} value={us}>{us}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngày thi công</label>
                                <input
                                    type="date"
                                    value={form.start_date}
                                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngày hoàn thiện (dự kiến)</label>
                                <input
                                    type="date"
                                    value={form.end_date}
                                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Địa chỉ</label>
                            <input
                                type="text"
                                value={form.address || ''}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                                placeholder="Nhập địa chỉ công trình"
                            />
                        </div>

                        <div className="pt-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-3 border-t border-slate-100 pt-4">Có thể đến quay video không?</label>
                            <div className="flex flex-wrap gap-8 items-center">
                                {['Có thể', 'Không thể', 'Cần xin phép thêm'].map(option => (
                                    <label key={option} className="flex items-center gap-2.5 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${form.can_shoot_video === option ? 'border-indigo-600' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                                            {form.can_shoot_video === option && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                                        </div>
                                        <input
                                            type="radio"
                                            name="can_shoot_video"
                                            value={option}
                                            checked={form.can_shoot_video === option}
                                            onChange={(e) => setForm({ ...form, can_shoot_video: e.target.value })}
                                            className="hidden"
                                        />
                                        <span className={`text-sm ${form.can_shoot_video === option ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <label className="block text-sm font-semibold text-slate-700 mb-3">Phong cách (Có thể chọn nhiều)</label>
                            <div className="flex flex-wrap gap-3">
                                {EFFECT_TYPES.map(effect => (
                                    <label key={effect} className={`flex items-center gap-2.5 cursor-pointer border px-4 py-2 rounded-xl transition-all ${isEffectSelected(effect) ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}>
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isEffectSelected(effect) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                            {isEffectSelected(effect) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={isEffectSelected(effect)}
                                            onChange={() => toggleEffectType(effect)}
                                            className="hidden"
                                        />
                                        <span className={`text-sm ${isEffectSelected(effect) ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>{effect}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Điểm nhấn</label>
                            <input
                                type="text"
                                value={form.effect_description || ''}
                                onChange={(e) => setForm({ ...form, effect_description: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                                placeholder="VD: Điểm nhấn không gian xanh, vật liệu mộc..."
                            />
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả về công trình</label>
                            <p className="text-xs text-slate-500 mb-2">Công trình này có đặc điểm gì đặc biệt, tệp khách hàng là ai, phân khúc như thế nào...</p>
                            <textarea
                                value={form.description || ''}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-y placeholder:text-slate-400"
                                placeholder="Nhập mô tả chi tiết..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nội dung khai thác</label>
                            <p className="text-xs text-slate-500 mb-2">Chủ đề muốn tập trung khai thác trong bài viết/video</p>
                            <textarea
                                value={form.customer_problem || ''}
                                onChange={(e) => setForm({ ...form, customer_problem: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-y placeholder:text-slate-400"
                                placeholder="Nhập nội dung khai thác..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giải pháp mà DQH mang lại</label>
                            <p className="text-xs text-slate-500 mb-2">Càng chi tiết càng tốt</p>
                            <textarea
                                value={form.dqh_solution || ''}
                                onChange={(e) => setForm({ ...form, dqh_solution: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-y placeholder:text-slate-400"
                                placeholder="Nhập giải pháp..."
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Hình ảnh / Videos của công trình</label>
                            <p className="text-xs text-slate-500 mb-2">Link bản thiết kế, video từng giai đoạn, tài liệu muốn truyền tải (Google Drive, Notion...)</p>
                            <input
                                type="url"
                                value={form.image_folder_link || ''}
                                onChange={(e) => setForm({ ...form, image_folder_link: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                                placeholder="https://drive.google.com/..."
                            />
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Brief / Doc Nội dung</label>
                            <p className="text-xs text-slate-500 mb-2">Đường link tới tài liệu nội dung, kịch bản hoặc brief của dự án</p>
                            <input
                                type="url"
                                value={form.content_link || ''}
                                onChange={(e) => setForm({ ...form, content_link: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                                placeholder="https://docs.google.com/..."
                            />
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ghi chú</label>
                            <textarea
                                value={form.other_info || ''}
                                onChange={(e) => setForm({ ...form, other_info: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-y placeholder:text-slate-400"
                                placeholder="Nhập thêm thông tin..."
                            />
                        </div>
                        
                        {/* Hidden Manager ID & Project Code to keep the data model consistent */}
                        <div className="pt-6 border-t border-slate-200 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5 opacity-80 bg-slate-100/50 p-4 rounded-xl">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Mã dự án (Hệ thống)</label>
                                <input
                                    type="text"
                                    value={form.project_code}
                                    onChange={(e) => setForm({ ...form, project_code: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Quản lý dự án (Admin view)</label>
                                <select
                                    value={form.manager_id}
                                    onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none"
                                    disabled={currentUserProfile?.role !== 'Admin' && currentUserProfile?.role !== 'Quản lý'}
                                >
                                    <option value="">Chọn quản lý</option>
                                    {profiles.map(p => (
                                        <option key={p.id} value={p.id}>{p.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!form.name}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all active:scale-95 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {editingProject ? 'Cập nhật' : 'Lưu công trình'}
                    </button>
                </div>
            </div>
        </div>
    );
};
