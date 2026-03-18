import React, { useState, useEffect } from 'react';
import { type Project } from '../../types';
import { X, Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';

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
        project_code: editingProject?.project_code || `PRJ-${Math.floor(Date.now() / 1000)}`,
        description: editingProject?.description || '',
        status: editingProject?.status || 'Chưa bắt đầu',
        start_date: editingProject?.start_date || new Date().toISOString().split('T')[0],
        end_date: editingProject?.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        manager_id: editingProject?.manager_id || currentUserProfile?.id || '',
        department: editingProject?.department || 'Marketing',
        project_type: editingProject?.project_type || '',
        update_status: editingProject?.update_status || '',
        scale: editingProject?.scale || '',
        effect_type: editingProject?.effect_type || '',
        effect_description: editingProject?.effect_description || '',
        address: editingProject?.address || '',
        image_folder_link: editingProject?.image_folder_link || '',
        video_folder_link: editingProject?.video_folder_link || '',
        can_shoot_video: editingProject?.can_shoot_video || 'Có thể',
        customer_problem: editingProject?.customer_problem || '',
        dqh_solution: editingProject?.dqh_solution || '',
        other_info: editingProject?.other_info || '',
        content_link: editingProject?.content_link || ''
    });

    const [isListening, setIsListening] = useState<'description' | 'customer_problem' | 'dqh_solution' | null>(null);
    const [isRefining, setIsRefining] = useState<'description' | 'customer_problem' | 'dqh_solution' | null>(null);

    const handleSpeechToText = (field: 'description' | 'customer_problem' | 'dqh_solution') => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Hãy thử dùng Chrome hoặc Safari mới nhất.");
            return;
        }

        if (isListening) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        let silenceTimer: any;

        const stopRecognition = () => {
            clearTimeout(silenceTimer);
            try { recognition.stop(); } catch (e) { }
            setIsListening(null);
        };

        recognition.onstart = () => {
            setIsListening(field);
            silenceTimer = setTimeout(() => {
                stopRecognition();
            }, 10000);
        };

        recognition.onresult = (event: any) => {
            clearTimeout(silenceTimer);
            const transcript = event.results[0][0].transcript;
            
            setForm(prev => ({
                ...prev,
                [field]: prev[field as keyof typeof prev] ? `${prev[field as keyof typeof prev]} ${transcript}` : transcript
            }));
            
            stopRecognition();
        };

        recognition.onerror = (event: any) => {
            clearTimeout(silenceTimer);
            if (event.error === 'not-allowed') {
                alert("Không có quyền truy cập Micro. Vui lòng cấp quyền trong cài đặt trình duyệt của bạn.");
            } else {
                console.warn('Speech recognition error:', event.error);
                // We ignore 'no-speech' and others to avoid annoying popups
            }
            setIsListening(null);
        };

        recognition.onend = () => {
            setIsListening(null);
            clearTimeout(silenceTimer);
        };

        try { recognition.start(); } catch (err) { setIsListening(null); }
    };

    const handleAIRefine = async (field: 'description' | 'customer_problem' | 'dqh_solution') => {
        const textToRefine = form[field as keyof typeof form];
        if (!textToRefine) {
            alert("Vui lòng nhập nội dung trước khi tinh chỉnh.");
            return;
        }

        setIsRefining(field);
        try {
            const res = await fetch('/api/refine-task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textToRefine, field })
            });

            if (!res.ok) throw new Error('Failed to refine text');

            const data = await res.json();
            if (data.refinedText) {
                setForm(prev => ({ ...prev, [field]: data.refinedText }));
            }
        } catch (error) {
            console.error('AI Refine error:', error);
            alert("Lỗi khi kết nối AI. Vui lòng thử lại sau.");
        } finally {
            setIsRefining(null);
        }
    };

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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">Tên công trình <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 font-bold text-slate-900"
                                    placeholder="VD: Chung cư Palm Height"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1 uppercase tracking-tight">Mã công trình <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.project_code}
                                    onChange={(e) => setForm({ ...form, project_code: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all font-mono font-bold text-indigo-600"
                                    placeholder="DA001"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                             <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">Tình trạng thi công <span className="text-red-500">*</span></label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700"
                                    required
                                >
                                    <option value="">Chọn tình trạng</option>
                                    <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                                    <option value="Đang thực hiện">Đang thực hiện</option>
                                    <option value="Đã bàn giao">Đã bàn giao</option>
                                    <option value="Tạm dừng">Tạm dừng</option>
                                    <option value="Hủy bỏ">Hủy bỏ</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between items-center">
                                    <span>Có thể đến quay video không?</span>
                                </label>
                                <select
                                    value={form.can_shoot_video || 'Có thể'}
                                    onChange={(e) => setForm({ ...form, can_shoot_video: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700"
                                >
                                    <option value="Có thể">Có thể</option>
                                    <option value="Không thể">Không thể</option>
                                    <option value="Cần xin phép thêm">Cần xin phép thêm</option>
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                             <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phong cách</label>
                                <select
                                    value={form.effect_type}
                                    onChange={(e) => setForm({ ...form, effect_type: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700"
                                >
                                    <option value="">Chọn phong cách</option>
                                    {EFFECT_TYPES.map(effect => (
                                        <option key={effect} value={effect}>{effect}</option>
                                    ))}
                                </select>
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
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between items-center">
                                <span>Mô tả về công trình</span>
                            </label>
                            <p className="text-xs text-slate-500 mb-2">Công trình này có đặc điểm gì đặc biệt, tệp khách hàng là ai, phân khúc như thế nào...</p>
                            <div className="relative group">
                                <textarea
                                    value={form.description || ''}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={6}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-y placeholder:text-slate-400 min-h-[120px] pb-12"
                                    placeholder="Nhập mô tả chi tiết..."
                                />
                                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={() => handleSpeechToText('description')}
                                        className={`p-2 rounded-lg border transition-all flex items-center justify-center ${isListening === 'description' ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200'}`}
                                        title={isListening === 'description' ? "Đang nghe..." : "Nhập bằng giọng nói"}
                                    >
                                        {isListening === 'description' ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAIRefine('description')}
                                        disabled={isRefining === 'description'}
                                        className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center disabled:opacity-50"
                                        title="Làm mượt bằng AI"
                                    >
                                        {isRefining === 'description' ? <Loader2 size={16} className="animate-spin text-indigo-600" /> : <Sparkles size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between items-center">
                                <span>Nội dung khai thác</span>
                            </label>
                            <p className="text-xs text-slate-500 mb-2">Chủ đề muốn tập trung khai thác trong bài viết/video</p>
                            <div className="relative group">
                                <textarea
                                    value={form.customer_problem || ''}
                                    onChange={(e) => setForm({ ...form, customer_problem: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-y placeholder:text-slate-400 min-h-[90px] pb-12"
                                    placeholder="Nhập nội dung khai thác..."
                                />
                                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={() => handleSpeechToText('customer_problem')}
                                        className={`p-2 rounded-lg border transition-all flex items-center justify-center ${isListening === 'customer_problem' ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200'}`}
                                        title={isListening === 'customer_problem' ? "Đang nghe..." : "Nhập bằng giọng nói"}
                                    >
                                        {isListening === 'customer_problem' ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAIRefine('customer_problem')}
                                        disabled={isRefining === 'customer_problem'}
                                        className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center disabled:opacity-50"
                                        title="Làm mượt bằng AI"
                                    >
                                        {isRefining === 'customer_problem' ? <Loader2 size={16} className="animate-spin text-indigo-600" /> : <Sparkles size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between items-center">
                                <span>Giải pháp mà DQH mang lại</span>
                            </label>
                            <p className="text-xs text-slate-500 mb-2">Càng chi tiết càng tốt</p>
                            <div className="relative group">
                                <textarea
                                    value={form.dqh_solution || ''}
                                    onChange={(e) => setForm({ ...form, dqh_solution: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-y placeholder:text-slate-400 min-h-[90px] pb-12"
                                    placeholder="Nhập giải pháp..."
                                />
                                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={() => handleSpeechToText('dqh_solution')}
                                        className={`p-2 rounded-lg border transition-all flex items-center justify-center ${isListening === 'dqh_solution' ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200'}`}
                                        title={isListening === 'dqh_solution' ? "Đang nghe..." : "Nhập bằng giọng nói"}
                                    >
                                        {isListening === 'dqh_solution' ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAIRefine('dqh_solution')}
                                        disabled={isRefining === 'dqh_solution'}
                                        className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center disabled:opacity-50"
                                        title="Làm mượt bằng AI"
                                    >
                                        {isRefining === 'dqh_solution' ? <Loader2 size={16} className="animate-spin text-indigo-600" /> : <Sparkles size={16} />}
                                    </button>
                                </div>
                            </div>
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
                        <div className="pt-6 border-t border-slate-200 mt-6 bg-slate-100/30 p-4 rounded-xl">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quản lý dự án (Admin view)</label>
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
