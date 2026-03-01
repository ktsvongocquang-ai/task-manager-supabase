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
    'Chung cư',
    'Nhà phố - Cải tạo',
    'Nhà phố - Xây mới',
    'Biệt thự',
    'Thương mại - Dịch vụ (Shop/F&B)',
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
    'Tiết kiệm (< 300Tr)',
    'Tiêu chuẩn (300 - 500Tr)',
    'Khá (500 - 800Tr)',
    'Cao cấp (800Tr - 1 Tỷ)',
    'Luxury (> 1 Tỷ)'
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
    const [investment, setInvestment] = useState(INVESTMENT_LEVELS[2]);
    const [area, setArea] = useState('100');
    const [hasMepStruct, setHasMepStruct] = useState(false); // For Nhà Phố/Biệt thự

    // --- State: Processing & Preview ---
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPhases, setGeneratedPhases] = useState<any[]>([]);
    const [generatedTasks, setGeneratedTasks] = useState<any[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    // --- Linear Interpolation Calculator ---
    const areaAnchors = [60, 100, 150, 250];

    // Baseline internal WD for each Phase at those exact area anchors
    const wdAnchors = {
        C: [1.5, 2.0, 3.0, 4.0],
        D3: [3.0, 4.25, 6.0, 8.0],
        S: [2.5, 3.5, 5.0, 7.0],
        KT: [2.0, 3.0, 4.5, 6.0],
        QC: [1.0, 1.75, 2.5, 3.5],
        BUFFER: [3.0, 4.25, 6.0, 8.0]
    };

    // Helper: Round strictly up to nearest 0.25
    const roundUp025 = (val: number) => Math.ceil(val * 4) / 4;

    const interpolate = (areaInput: number, values: number[]) => {
        // Find segment
        let i = 0;
        while (i < areaAnchors.length - 1 && areaInput > areaAnchors[i + 1]) {
            i++;
        }

        // Handle edge cases (smaller than min or larger than max)
        if (areaInput <= areaAnchors[0]) return values[0];
        if (i >= areaAnchors.length - 1) {
            // For sizes > 250, we extrapolate slightly based on the last segment slope
            const slope = (values[i] - values[i - 1]) / (areaAnchors[i] - areaAnchors[i - 1]);
            const extraArea = areaInput - areaAnchors[i];
            return roundUp025(values[i] + (slope * extraArea));
        }

        const areaStart = areaAnchors[i];
        const areaEnd = areaAnchors[i + 1];
        const valStart = values[i];
        const valEnd = values[i + 1];

        const ratio = (areaInput - areaStart) / (areaEnd - areaStart);
        const exactWd = valStart + ratio * (valEnd - valStart);

        return roundUp025(exactWd);
    };

    const computeTimeline = () => {
        const numArea = parseFloat(area) || 100;

        let curC = interpolate(numArea, wdAnchors.C);
        let curD3 = interpolate(numArea, wdAnchors.D3);
        let curS = interpolate(numArea, wdAnchors.S);
        let curKT = interpolate(numArea, wdAnchors.KT);
        let curQC = interpolate(numArea, wdAnchors.QC);
        let curBuffer = interpolate(numArea, wdAnchors.BUFFER);

        // MEP/Struct Penalty
        if (hasMepStruct) {
            curKT += 2.0;
            curQC += 1.0;
        }

        // Commercial / Office Penalty (Usually faster Concept, but more Shop Drawing / M&E)
        let typeMultiplier = 1.0;
        if (projectType.includes('Thương mại') || projectType.includes('Shop') || projectType.includes('F&B')) {
            curC = Math.max(1.0, curC - 0.5); // Concept is usually quicker for commercial
            curS += 1.0; // Shop drawing needs to be tight
            typeMultiplier = 0.9;
        } else if (projectType.includes('Văn phòng')) {
            curC = Math.max(1.0, curC - 0.5);
            typeMultiplier = 0.85;
        }

        // Style / Investment Penalty
        let styleInvMultiplier = 1.0;
        if (investment.includes('> 1 Tỷ') || investment.includes('Cao cấp') || style.includes('Luxury')) styleInvMultiplier = 1.2;
        else if (investment.includes('< 300Tr')) styleInvMultiplier = 0.9;

        // Apply global multipliers
        const finalMultiplier = typeMultiplier * styleInvMultiplier;

        curC = roundUp025(curC * finalMultiplier);
        curD3 = roundUp025(curD3 * finalMultiplier);
        curS = roundUp025(curS * finalMultiplier);

        const internalWd = curC + curD3 + curS + curKT + curQC;
        const bufferKh = roundUp025(curBuffer * styleInvMultiplier);

        // Approximate calendar days: (WD / 5) * 7
        const totalWd = internalWd + bufferKh;
        const totalCalendar = Math.round((totalWd / 5) * 7);

        return {
            internalWd,
            bufferKh,
            totalCalendar,
            phases: { c: curC, d3: curD3, s: curS, kt: curKT, qc: curQC }
        };
    };

    const timelineData = computeTimeline();

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
                area,
                phasesWd: timelineData.phases, // Send the exact calculated WD per phase to the backend
                bufferKh: timelineData.bufferKh
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
            // Expected tasks format: { phases: [], tasks: [] }
            setGeneratedPhases(data.phases || []);
            setGeneratedTasks(data.tasks || []);
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

            const pCode = `AI-${Math.floor(Math.random() * 10000)}`;

            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .insert([{
                    name: projectName,
                    description: descriptionStr,
                    project_code: pCode,
                    status: 'Chưa bắt đầu',
                    start_date: startDate,
                    manager_id: currentUserProfile?.id || leadId
                }])
                .select()
                .single();

            if (projectError) throw projectError;
            const projectId = projectData.id;

            // 2. Insert Phases (Parent Tasks)
            let phaseIdMap: Record<string, string> = {}; // Maps GD1 -> UUID
            if (generatedPhases && generatedPhases.length > 0) {
                const phasesToInsert = generatedPhases.map((p: any, idx: number) => ({
                    project_id: projectId,
                    task_code: `${pCode}-PHASE-${idx + 1}`,
                    name: p.name,
                    description: `Giai đoạn Hệ thống - ID: ${p.id}`,
                    priority: 'Trung bình',
                    status: 'Chưa bắt đầu',
                    start_date: p.start,
                    due_date: p.end,
                    assignee_id: leadId,
                    completion_pct: 0
                }));

                const { data: insertedPhases, error: phasesError } = await supabase
                    .from('tasks')
                    .insert(phasesToInsert)
                    .select();

                if (phasesError) throw phasesError;

                // Create Mapping dictionary
                insertedPhases.forEach(dbPhase => {
                    // Extract original ID from description (e.g., "Giai đoạn Hệ thống - ID: GD1" -> "GD1")
                    const match = dbPhase.description?.match(/ID: (GD\d+)/);
                    if (match && match[1]) {
                        phaseIdMap[match[1]] = dbPhase.id;
                    }
                });
            }

            // 3. Insert Child Tasks
            // Map the assignee string name back to an ID if possible, else default to lead
            const tasksToInsert = generatedTasks.map((t: any) => {
                let assignedUserId = leadId; // Default
                if (t.assignee) {
                    const matchedProfile = profiles.find(p => p.full_name.includes(t.assignee) || t.assignee.includes(p.full_name));
                    if (matchedProfile) assignedUserId = matchedProfile.id;
                    else if (t.assignee.includes('Hỗ trợ') || t.assignee.includes('Support') || t.assignee.includes('Designer')) assignedUserId = supportId || leadId;
                }

                return {
                    project_id: projectId,
                    parent_id: phaseIdMap[t.phaseId] || null, // Link to Parent Task
                    task_code: `${pCode}-${t.code}`,
                    name: t.title,
                    description: t.note || `Child Task của Phase: ${t.phaseId}`,
                    priority: 'Trung bình',
                    status: 'Mới tạo',
                    start_date: t.start,
                    due_date: t.end,
                    assignee_id: assignedUserId,
                    completion_pct: 0
                };
            });

            const { error: tasksError } = await supabase.from('tasks').insert(tasksToInsert);
            if (tasksError) throw tasksError;

            alert('Tạo dự án bằng AI (Phân cấp) thành công!');
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
            <div className="bg-[#0f172a] border border-slate-700/50 rounded-2xl shadow-2xl shadow-slate-900/50 w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-[#0f172a] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 text-indigo-400">
                            <Sparkles size={20} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-black text-white tracking-wide">Tạo Dự Án Mới <span className="text-indigo-400 font-bold">(AI Assist)</span></h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 bg-[#151c2f] custom-scrollbar">
                    {!showPreview ? (
                        <div className="max-w-4xl mx-auto space-y-8 flex gap-8">

                            {/* Left Column: Form Inputs */}
                            <div className="flex-1 space-y-6">
                                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                    Điền thông tin dự án, AI sẽ tự động phân rã WBS và xếp lịch công việc chuẩn xác theo SOP, tự động bỏ qua Thứ 7 & Chủ Nhật.
                                </p>

                                {/* Panel 1: Info & Team */}
                                <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-6 shadow-inner">
                                    <h4 className="text-[13px] font-black font-mono text-slate-300 mb-5 flex items-center gap-3 tracking-wider uppercase">
                                        <span className="bg-indigo-500/20 text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                        Hành chính & Đội ngũ
                                    </h4>

                                    <div className="grid grid-cols-2 gap-5 mb-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tên Dự Án</label>
                                            <input
                                                type="text"
                                                value={projectName}
                                                onChange={(e) => setProjectName(e.target.value)}
                                                className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-slate-600 font-medium"
                                                placeholder="VD: Căn hộ Vinhomes 3PN..."
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tên Khách Hàng</label>
                                            <input
                                                type="text"
                                                value={clientName}
                                                onChange={(e) => setClientName(e.target.value)}
                                                className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-slate-600 font-medium"
                                                placeholder="VD: Anh Tuấn, Chị Lan..."
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Calendar size={14} /> Bắt đầu</label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors [color-scheme:dark] font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><User size={14} /> Chủ trì (Lead)</label>
                                            <select
                                                value={leadId}
                                                onChange={(e) => setLeadId(e.target.value)}
                                                className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-medium"
                                            >
                                                <option value="">Chọn Lead</option>
                                                {profiles.map(p => (
                                                    <option key={p.id} value={p.id}>{p.full_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><User size={14} className="text-slate-500" /> Hỗ trợ (Support)</label>
                                            <select
                                                value={supportId}
                                                onChange={(e) => setSupportId(e.target.value)}
                                                className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-medium"
                                            >
                                                <option value="">(Tùy chọn)</option>
                                                {profiles.map(p => (
                                                    <option key={p.id} value={p.id}>{p.full_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Panel 2: Specs */}
                                <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-6 shadow-inner">
                                    <h4 className="text-[13px] font-black font-mono text-slate-300 mb-5 flex items-center gap-3 tracking-wider uppercase">
                                        <span className="bg-indigo-500/20 text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                        Kỹ thuật & Phân khúc
                                    </h4>

                                    <div className="grid grid-cols-2 gap-5 mb-5">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Briefcase size={14} /> Loại hình</label>
                                            <select
                                                value={projectType}
                                                onChange={(e) => setProjectType(e.target.value)}
                                                className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-medium"
                                            >
                                                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        {/* Optional Checkbox for MEP/Struct if Townhouse/Villa */}
                                        {(projectType.includes('Nhà phố') || projectType.includes('Biệt thự') || projectType.includes('Cải tạo')) && (
                                            <div className="col-span-2 sm:col-span-1 flex items-center pt-6">
                                                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-700 bg-[#0f172a] hover:bg-slate-800 transition-colors w-full">
                                                    <input
                                                        type="checkbox"
                                                        checked={hasMepStruct}
                                                        onChange={(e) => setHasMepStruct(e.target.checked)}
                                                        className="w-5 h-5 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500/50 bg-slate-900"
                                                    />
                                                    <div className="text-sm font-bold text-slate-300">
                                                        Phải ra <span className="text-indigo-400">Kết Cấu / MEP</span>
                                                    </div>
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-5 mb-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><LayoutIcon size={14} /> Phong cách (Style)</label>
                                            <select
                                                value={style}
                                                onChange={(e) => setStyle(e.target.value)}
                                                className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-medium"
                                            >
                                                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><FileText size={14} /> Mức đầu tư</label>
                                            <select
                                                value={investment}
                                                onChange={(e) => setInvestment(e.target.value)}
                                                className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-amber-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-bold"
                                            >
                                                {INVESTMENT_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Diện tích (m²)</label>
                                            <input
                                                type="number"
                                                value={area}
                                                onChange={(e) => setArea(e.target.value)}
                                                className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-xl text-sm font-mono text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Ghi chú (Tùy chọn)</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-slate-600"
                                                placeholder="VD: Cần ưu tiên thiết kế..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: AI TIMELINE PREVIEW BLOCK */}
                            <div className="w-80 shrink-0 mt-[1.5rem]">
                                <div className="bg-[#1e293b]/70 border border-[#334155] rounded-3xl p-6 shadow-2xl sticky top-0 relative overflow-hidden">
                                    {/* Background glow */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>

                                    <h4 className="text-sm font-black text-indigo-400 mb-6 flex items-center gap-2 uppercase tracking-wide">
                                        <Sparkles size={16} /> AI TIMELINE PREVIEW
                                    </h4>

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-baseline border-b border-slate-700/50 pb-4">
                                            <span className="text-sm text-slate-300 font-medium">Tổng ngày làm (Nội bộ):</span>
                                            <div className="text-right">
                                                <span className="text-3xl font-black text-white">{timelineData.internalWd}</span>
                                                <span className="text-sm text-slate-500 ml-1 font-mono">WD</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center border-b border-slate-700/50 pb-4">
                                            <span className="text-sm text-slate-400">Chờ KH duyệt (Buffer):</span>
                                            <span className="text-sm font-bold text-amber-500">+{timelineData.bufferKh} ngày</span>
                                        </div>

                                        <div className="pt-2">
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tỉ trọng Giai đoạn</div>
                                            {/* Horizontal stacked bar representing phases */}
                                            <div className="h-3 w-full bg-slate-800 rounded-full flex overflow-hidden mb-2 shadow-inner">
                                                <div style={{ width: `${(timelineData.phases.c / timelineData.internalWd) * 100}%` }} className="bg-blue-500 hover:opacity-80 transition-opacity" title={`Concept: ${timelineData.phases.c} WD`}></div>
                                                <div style={{ width: `${(timelineData.phases.d3 / timelineData.internalWd) * 100}%` }} className="bg-amber-500 hover:opacity-80 transition-opacity" title={`3D: ${timelineData.phases.d3} WD`}></div>
                                                <div style={{ width: `${(timelineData.phases.s / timelineData.internalWd) * 100}%` }} className="bg-rose-500 hover:opacity-80 transition-opacity" title={`Shop Drawing: ${timelineData.phases.s} WD`}></div>
                                                <div style={{ width: `${(timelineData.phases.kt / timelineData.internalWd) * 100}%` }} className="bg-emerald-500 hover:opacity-80 transition-opacity" title={`Kỹ thuật: ${timelineData.phases.kt} WD`}></div>
                                                <div style={{ width: `${(timelineData.phases.qc / timelineData.internalWd) * 100}%` }} className="bg-purple-500 hover:opacity-80 transition-opacity" title={`QC: ${timelineData.phases.qc} WD`}></div>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-mono text-slate-500 font-bold px-1">
                                                <span>C</span>
                                                <span>3D</span>
                                                <span>S</span>
                                                <span>KT</span>
                                                <span>QC</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mt-8 flex flex-col items-center justify-center">
                                            <span className="text-xs text-slate-500 font-bold uppercase mb-1">Dự kiến hoàn thiện nộp File</span>
                                            <span className="text-xl font-mono font-black text-emerald-400">~{timelineData.totalCalendar}</span>
                                            <span className="text-xs text-slate-400">Ngày lịch (Bao gồm T7/CN)</span>
                                        </div>
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
                                <div className="flex gap-4">
                                    <div className="bg-slate-800 px-4 py-2 rounded-lg flex flex-col items-center justify-center border border-slate-700 min-w-[100px]">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng Ngày</div>
                                        <div className="text-lg font-bold text-amber-400">~{timelineData.totalCalendar}</div>
                                    </div>
                                    <div className="bg-slate-800 px-4 py-2 rounded-lg flex flex-col items-center justify-center border border-slate-700 min-w-[100px]">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng Tasks</div>
                                        <div className="text-lg font-bold text-indigo-400">{generatedTasks.length}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-[#1e293b] text-slate-400 text-[11px] uppercase font-black tracking-wider border-b border-slate-700">
                                        <tr>
                                            <th className="px-4 py-3 w-16">Code</th>
                                            <th className="px-4 py-3 w-3/12">Tên Task</th>
                                            <th className="px-4 py-3 text-center w-20">Số ngày</th>
                                            <th className="px-4 py-3 w-32">Bắt đầu</th>
                                            <th className="px-4 py-3 w-32">Kết thúc</th>
                                            <th className="px-4 py-3 w-40">Phụ trách</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                                        {generatedTasks.map((task, idx) => {
                                            const s = new Date(task.start).getTime();
                                            const e = new Date(task.end).getTime();
                                            const days = !isNaN(s) && !isNaN(e) ? Math.round((e - s) / 86400000) + 1 : 0;
                                            return (
                                                <tr key={idx} className="hover:bg-slate-800/40 transition-colors group">
                                                    <td className="px-4 py-2 font-mono text-xs text-indigo-400 font-bold">{task.code}</td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="text"
                                                            value={task.title}
                                                            onChange={(e) => handleTaskChange(idx, 'title', e.target.value)}
                                                            className="w-full bg-transparent border border-transparent group-hover:border-slate-700 focus:border-indigo-500 rounded px-2 py-1 text-sm text-white focus:outline-none focus:bg-slate-950 font-medium transition-colors"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span className="inline-flex items-center justify-center bg-slate-800 text-slate-300 text-xs font-bold px-2 py-1 rounded w-10">
                                                            {days > 0 ? days : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="date"
                                                            value={task.start}
                                                            onChange={(e) => handleTaskChange(idx, 'start', e.target.value)}
                                                            className="w-full bg-transparent border border-transparent group-hover:border-slate-700 focus:border-indigo-500 rounded px-2 py-1 text-sm text-slate-300 focus:text-white focus:outline-none focus:bg-slate-950 [color-scheme:dark] transition-colors"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="date"
                                                            value={task.end}
                                                            onChange={(e) => handleTaskChange(idx, 'end', e.target.value)}
                                                            className="w-full bg-transparent border border-transparent group-hover:border-slate-700 focus:border-indigo-500 rounded px-2 py-1 text-sm text-slate-300 focus:text-white focus:outline-none focus:bg-slate-950 [color-scheme:dark] transition-colors"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <select
                                                            value={task.assignee}
                                                            onChange={(e) => handleTaskChange(idx, 'assignee', e.target.value)}
                                                            className="w-full bg-transparent border border-transparent group-hover:border-slate-700 focus:border-indigo-500 rounded px-2 py-1 text-sm text-amber-300 focus:text-amber-400 focus:outline-none focus:bg-slate-950 font-medium transition-colors cursor-pointer"
                                                        >
                                                            <option value="" className="text-slate-500">Chưa chọn (AI đề xuất)</option>
                                                            {profiles.map(p => (
                                                                <option key={p.id} value={p.full_name} className="bg-slate-900 text-white">{p.full_name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
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
                        <>
                            {!projectName.trim() || !clientName.trim() ? (
                                <button
                                    disabled
                                    className="px-6 py-3 bg-slate-800 text-slate-500 rounded-xl text-sm font-bold transition-all w-full md:w-auto uppercase tracking-wide cursor-not-allowed border border-slate-700"
                                >
                                    Nhập Tên Dự Án & Khách Hàng
                                </button>
                            ) : isGenerating ? (
                                <button
                                    disabled
                                    className="px-8 py-3 bg-indigo-600/50 text-indigo-300 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-3 w-full md:w-auto cursor-not-allowed border border-indigo-500/30"
                                >
                                    <Loader2 size={18} className="animate-spin" />
                                    AI Đang phân tích SOP...
                                </button>
                            ) : (
                                <button
                                    onClick={handleGenerate}
                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all flex items-center justify-center gap-3 w-full md:w-auto uppercase tracking-wide border border-indigo-500 active:scale-95"
                                >
                                    Khởi tạo Dự Án & Sinh Timeline <ArrowRight size={16} />
                                </button>
                            )}
                        </>
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
