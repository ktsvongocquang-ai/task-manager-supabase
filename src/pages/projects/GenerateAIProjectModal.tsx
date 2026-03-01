import React, { useState } from 'react';
import { X, Sparkles, Loader2, ArrowRight, ArrowLeft, Calendar, User, Layout as LayoutIcon, Briefcase, FileText } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface GenerateAIProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    profiles: any[];
    currentUserProfile: any;
    onSuccess: () => void;
}

const PROJECT_TYPES = [
    'Chung cư - Hoàn thiện nội thất',
    'Nhà phố - Cải tạo',
    'Nhà phố - Xây mới',
    'Biệt thự',
    'Văn phòng'
];

const STYLES = [
    'Hiện đại (Modern)',
    'Tân cổ điển (Neo-classic)',
    'Wabi Sabi',
    'Indochine',
    'Minimalism',
    'Luxury'
];

const INVESTMENT_LEVELS = [
    'Tiêu chuẩn (< 1 Tỷ)',
    'Khá (1 - 3 Tỷ)',
    'Cao cấp (3 - 5 Tỷ)',
    'Siêu cao cấp (> 5 Tỷ)'
];

export const GenerateAIProjectModal: React.FC<GenerateAIProjectModalProps> = ({
    isOpen,
    onClose,
    profiles,
    currentUserProfile,
    onSuccess
}) => {
    if (!isOpen) return null;

    // --- State: Form Inputs ---
    const [projectName, setProjectName] = useState('');
    const [clientName, setClientName] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [leadId, setLeadId] = useState(currentUserProfile?.id || '');
    const [supportId, setSupportId] = useState('');

    const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
    const [style, setStyle] = useState(STYLES[0]);
    const [investment, setInvestment] = useState(INVESTMENT_LEVELS[1]);
    const [area, setArea] = useState('100');

    // --- State: Processing & Preview ---
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState<any[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    const handleGenerate = async () => {
        if (!projectName || !clientName) {
            alert("Vui lòng nhập Tên dự án và Khách hàng");
            return;
        }

        setIsGenerating(true);
        try {
            const leadName = profiles.find(p => p.id === leadId)?.full_name || 'Lead';
            const supportName = profiles.find(p => p.id === supportId)?.full_name || 'Support';

            const payload = {
                projectName,
                clientName,
                startDate,
                leadName,
                supportName,
                projectType,
                style,
                investment,
                area
            };

            const res = await fetch('/api/generate-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to generate project');
            }

            const data = await res.json();
            // Expected tasks format: [{code, title, phase, startDate, endDate, assignee, note}]
            setGeneratedTasks(data.tasks);
            setShowPreview(true);
        } catch (error: any) {
            console.error(error);
            alert(`Lỗi khi tạo bằng AI: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveToDatabase = async () => {
        if (generatedTasks.length === 0) return;
        setIsGenerating(true);

        try {
            // 1. Insert Project
            const descriptionStr = `Khách hàng: ${clientName}\nLoại hình: ${projectType}\nPhong cách: ${style}\nMức đầu tư: ${investment}\nDiện tích: ${area}m2`;

            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .insert([{
                    name: projectName,
                    description: descriptionStr,
                    project_code: `AI-${Math.floor(Math.random() * 10000)}`,
                    status: 'Chưa bắt đầu',
                    start_date: startDate,
                    manager_id: currentUserProfile?.id || leadId
                }])
                .select()
                .single();

            if (projectError) throw projectError;
            const projectId = projectData.id;

            // 2. Insert Tasks
            // Map the assignee string name back to an ID if possible, else default to lead
            const tasksToInsert = generatedTasks.map((t: any) => {
                let assignedUserId = leadId; // Default
                if (t.assignee) {
                    const matchedProfile = profiles.find(p => p.full_name.includes(t.assignee) || t.assignee.includes(p.full_name));
                    if (matchedProfile) assignedUserId = matchedProfile.id;
                    else if (t.assignee.includes('Hỗ trợ') || t.assignee.includes('Support')) assignedUserId = supportId || leadId;
                }

                return {
                    project_id: projectId,
                    title: `[${t.code}] ${t.title}`,
                    description: t.note || `Phase: ${t.phase}`,
                    priority: 'Trung bình',
                    status: 'Mới tạo',
                    start_date: t.startDate,
                    end_date: t.endDate,
                    assignee_id: assignedUserId
                };
            });

            const { error: tasksError } = await supabase.from('tasks').insert(tasksToInsert);
            if (tasksError) throw tasksError;

            alert('Tạo dự án bằng AI thành công!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(`Lỗi khi lưu vào CSDL: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleTaskChange = (index: number, field: string, value: string) => {
        const newTasks = [...generatedTasks];
        newTasks[index] = { ...newTasks[index], [field]: value };
        setGeneratedTasks(newTasks);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
                            <Sparkles size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Tạo Dự Án Mới (AI Assist)</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
                    {!showPreview ? (
                        <div className="max-w-3xl mx-auto space-y-8">
                            <p className="text-slate-400 text-sm">Điền thông tin dự án, AI sẽ tự động phân rã WBS và xếp lịch công việc chuẩn xác theo SOP, tự động bỏ qua Thứ 7 & Chủ Nhật.</p>

                            {/* Panel 1: Info & Team */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                                    <span className="bg-slate-800 text-slate-300 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                    Thông tin Hành chính & Đội ngũ
                                </h4>

                                <div className="grid grid-cols-2 gap-5 mb-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Tên Dự Án</label>
                                        <input
                                            type="text"
                                            value={projectName}
                                            onChange={(e) => setProjectName(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-slate-600"
                                            placeholder="VD: Căn hộ Vinhomes 3PN..."
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Tên Khách Hàng</label>
                                        <input
                                            type="text"
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-slate-600"
                                            placeholder="VD: Anh Tuấn, Chị Lan..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 flex items-center gap-1"><Calendar size={12} /> Ngày bắt đầu</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors [color-scheme:dark]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 flex items-center gap-1"><User size={12} /> Chủ trì thiết kế (Lead)</label>
                                        <select
                                            value={leadId}
                                            onChange={(e) => setLeadId(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none"
                                        >
                                            <option value="">Chọn Lead</option>
                                            {profiles.map(p => (
                                                <option key={p.id} value={p.id}>{p.role} - {p.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 flex items-center gap-1"><User size={12} /> Người hỗ trợ (Support)</label>
                                        <select
                                            value={supportId}
                                            onChange={(e) => setSupportId(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none"
                                        >
                                            <option value="">Chọn Support</option>
                                            {profiles.map(p => (
                                                <option key={p.id} value={p.id}>{p.role} - {p.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Panel 2: Specs */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                                    <span className="bg-slate-800 text-slate-300 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                    Thông số Kỹ thuật & Phân khúc
                                </h4>

                                <div className="mb-5">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 flex items-center gap-1"><Briefcase size={12} /> Loại hình dự án</label>
                                    <select
                                        value={projectType}
                                        onChange={(e) => setProjectType(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none"
                                    >
                                        {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-5 mb-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 flex items-center gap-1"><LayoutIcon size={12} /> Phong cách (Style)</label>
                                        <select
                                            value={style}
                                            onChange={(e) => setStyle(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none"
                                        >
                                            {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 flex items-center gap-1"><FileText size={12} /> Mức đầu tư</label>
                                        <select
                                            value={investment}
                                            onChange={(e) => setInvestment(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none"
                                        >
                                            {INVESTMENT_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Diện tích tổng (m²)</label>
                                        <input
                                            type="number"
                                            value={area}
                                            onChange={(e) => setArea(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Ghi chú thêm (Tùy chọn)</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-slate-600"
                                            placeholder="VD: Cần ưu tiên thiết kế phòng ngủ master trước..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // --- PREVIEW MODE ---
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">Preview Tiến Độ AI Đề Xuất</h3>
                                    <p className="text-sm text-slate-400">Bạn có thể tinh chỉnh lại Ngày tháng hoặc Phân đoạn thủ công trước khi lưu.</p>
                                </div>
                                <div className="bg-slate-800 px-4 py-2 rounded-lg flex items-center gap-4 border border-slate-700">
                                    <div className="text-center">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng Tasks</div>
                                        <div className="text-lg font-bold text-indigo-400">{generatedTasks.length}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-semibold">
                                        <tr>
                                            <th className="px-4 py-3">Code</th>
                                            <th className="px-4 py-3 w-1/3">Tên Task</th>
                                            <th className="px-4 py-3">Bắt đầu</th>
                                            <th className="px-4 py-3">Kết thúc</th>
                                            <th className="px-4 py-3">Phụ trách</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 text-slate-300">
                                        {generatedTasks.map((task, idx) => (
                                            <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-4 py-3 font-mono text-xs text-indigo-300">{task.code}</td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={task.title}
                                                        onChange={(e) => handleTaskChange(idx, 'title', e.target.value)}
                                                        className="w-full bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-2 py-1 text-sm text-white focus:outline-none focus:bg-slate-950"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="date"
                                                        value={task.startDate}
                                                        onChange={(e) => handleTaskChange(idx, 'startDate', e.target.value)}
                                                        className="bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-2 py-1 text-sm text-white focus:outline-none focus:bg-slate-950 [color-scheme:dark]"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="date"
                                                        value={task.endDate}
                                                        onChange={(e) => handleTaskChange(idx, 'endDate', e.target.value)}
                                                        className="bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-2 py-1 text-sm text-white focus:outline-none focus:bg-slate-950 [color-scheme:dark]"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={task.assignee}
                                                        onChange={(e) => handleTaskChange(idx, 'assignee', e.target.value)}
                                                        className="w-full bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-2 py-1 text-sm text-amber-300 focus:outline-none focus:bg-slate-950"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center shrink-0">
                    {showPreview ? (
                        <button
                            type="button"
                            onClick={() => setShowPreview(false)}
                            className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft size={16} /> Quay lại sửa thông tin
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                        >
                            Hủy bỏ
                        </button>
                    )}


                    {!showPreview ? (
                        <button
                            onClick={handleGenerate}
                            disabled={!projectName.trim() || !clientName.trim() || isGenerating}
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    AI Đang phân tích SOP...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Tạo Tiến Độ AI
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleSaveToDatabase}
                            disabled={isGenerating}
                            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Đang lưu dữ liệu...
                                </>
                            ) : (
                                <>
                                    Chốt Kế Hoạch & Lưu Server <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
