import React, { useState, useRef } from 'react';
import { X, Sparkles, Loader2, ArrowRight, ArrowLeft, Calendar, User, Layout as LayoutIcon, Briefcase, FileText, MessageSquare, Image, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
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

const RESIDENTIAL_INVESTMENT_LEVELS = [
    '< 2 Tỷ',
    '3 - 5 Tỷ',
    '> 5 Tỷ'
];

const COMMERCIAL_INVESTMENT_LEVELS = [
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

    // --- State: Action Items ---
    const [projectCode, setProjectCode] = useState(`AI-${Math.floor(Math.random() * 10000)}`);
    const [projectName, setProjectName] = useState('');
    const [clientName, setClientName] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [leadId, setLeadId] = useState(currentUserProfile?.id || '');
    const [supportId, setSupportId] = useState('');

    // --- State: AI Chat & Image ---
    const [aiPrompt, setAiPrompt] = useState('');
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResponseText, setAiResponseText] = useState('');
    const [aiEstimatedDays, setAiEstimatedDays] = useState<number | null>(null); // New state to override timeline
    const [aiNote, setAiNote] = useState(''); // Context note to pass to WBS generator
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageBase64(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!aiPrompt && !imageBase64) {
            alert("Vui lòng nhập mô tả hoặc tải lên mặt bằng để phân tích.");
            return;
        }

        setIsAnalyzing(true);
        setAiResponseText('');
        try {
            const res = await fetch('/api/analyze-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt, imageBase64 })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Lỗi khi phân tích dự án');
            }

            const data = await res.json();

            // Auto-fill form based on AI interpretation
            if (data.projectName) setProjectName(data.projectName);
            if (data.clientName) setClientName(data.clientName);
            if (data.projectType && PROJECT_TYPES.includes(data.projectType)) setProjectType(data.projectType);
            if (data.style && STYLES.includes(data.style)) setStyle(data.style);
            if (data.area) setArea(data.area.toString());

            // Override Timeline logic if AI gives a hard number
            if (data.estimatedDays) setAiEstimatedDays(parseInt(data.estimatedDays, 10));

            // Store specific instructions/notes to pass along later
            if (data.contextNote) setAiNote(data.contextNote);

            // Show friendly message
            if (data.aiMessage) setAiResponseText(data.aiMessage);

        } catch (error: any) {
            console.error(error);
            alert(`Lỗi AI: ${error.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getInvestmentLevels = (type: string) => {
        if (type.includes('Nhà phố') || type.includes('Biệt thự')) {
            return RESIDENTIAL_INVESTMENT_LEVELS;
        }
        return COMMERCIAL_INVESTMENT_LEVELS;
    };

    const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
    const [style, setStyle] = useState(STYLES[0]);
    const [investment, setInvestment] = useState(getInvestmentLevels(PROJECT_TYPES[0])[2]);
    const [area, setArea] = useState('100');
    const [hasMepStruct, setHasMepStruct] = useState(false); // For Nhà Phố/Biệt thự

    // Auto-update investment selection when projectType changes to prevent invalid states
    React.useEffect(() => {
        const currentLevels = getInvestmentLevels(projectType);
        if (!currentLevels.includes(investment)) {
            setInvestment(currentLevels[0]); // fallback to first valid option
        }
    }, [projectType, investment]);

    // --- State: Processing & Preview ---
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPhases, setGeneratedPhases] = useState<any[]>([]);
    const [generatedTasks, setGeneratedTasks] = useState<any[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    // --- Timeline Calculator ---

    // Helper: Round strictly up to nearest 0.25
    const roundUp025 = (val: number) => Math.ceil(val * 4) / 4;

    const computeTimeline = () => {
        const numArea = parseFloat(area) || 100;

        // FIXED Moodboard (Duyệt Concept) Time: 3 ngày
        let curC = 3;

        // 3D Time: 7 to 15 days based on area (interpolate between 7 and 15)
        // Area 60 -> 7 days, Area 250 -> 15 days
        const d3Ratio = Math.min(Math.max((numArea - 60) / (250 - 60), 0), 1);
        let curD3 = roundUp025(7 + d3Ratio * (15 - 7)); // 7 to 15 days

        // Triển khai (S + KT) - 5-7 ngày cho chung cư, 10-15 ngày cho nhà ở
        let baseTrienKhai = 5;
        if (projectType.includes('Nhà phố') || projectType.includes('Biệt thự')) {
            baseTrienKhai = 10 + d3Ratio * (15 - 10); // 10 to 15
        } else {
            baseTrienKhai = 5 + d3Ratio * (7 - 5);    // 5 to 7
        }

        // Style Penalty (Tân cổ điển: +5 chung cư, +10 nhà ở)
        if (style.includes('Tân cổ điển') || style.includes('Neo-classic')) {
            if (projectType.includes('Nhà phố') || projectType.includes('Biệt thự')) {
                baseTrienKhai += 10;
            } else {
                baseTrienKhai += 5; // Cho chung cư và các loại khác
            }
        }

        // Split Triển khai into Shop Drawing (S) and Kỹ thuật (KT) roughly 40/60
        let curS = roundUp025(baseTrienKhai * 0.4);
        let curKT = roundUp025(baseTrienKhai * 0.6);

        // MEP/Struct Penalty
        if (hasMepStruct && !projectType.includes('Nhà phố') && !projectType.includes('Biệt thự')) {
            curKT += 2.0;
        }

        // QC Time
        let curQC = 2;

        // Buffer Time (Khách hàng suy nghĩ) - Chỉnh sửa 3D lần 2-3 = Mỗi lần 4-5 ngày -> Total ~9 days
        let curBuffer = roundUp025(8 + d3Ratio * (10 - 8));

        const internalWd = curC + curD3 + curS + curKT + curQC;

        let finalInternalWd = internalWd;
        let finalC = curC;
        let finalD3 = curD3;
        let finalS = curS;
        let finalKT = curKT;
        let finalQC = curQC;
        let finalBuffer = curBuffer;

        // --- AI OVERRIDE LOGIC ---
        // If AI gives an explicit duration (estimatedDays), we proportionately squash/stretch the phases 
        // to equal exactly what AI says.
        if (aiEstimatedDays && aiEstimatedDays > 0) {
            const ratio = aiEstimatedDays / internalWd;

            finalC = roundUp025(curC * ratio);
            finalD3 = roundUp025(curD3 * ratio);
            finalS = roundUp025(curS * ratio);
            finalQC = roundUp025(curQC * ratio);

            // Dump any rounding remainders into KT to make it exactly equal aiEstimatedDays
            const tempSum = finalC + finalD3 + finalS + finalQC;
            finalKT = aiEstimatedDays - tempSum;
            if (finalKT < 0) finalKT = 0; // Safeguard

            finalInternalWd = aiEstimatedDays;
            finalBuffer = roundUp025(curBuffer * ratio); // Squashing buffer too to respect rush speed
        }

        // Approximate calendar days: (WD / 5) * 7
        // Gối đầu: Triển khai chạy song song một phần với Sửa 3D (curBuffer).
        // Total WD is approximately internalWd + (curBuffer / 2) because of overlapping.
        const totalWd = finalInternalWd + (finalBuffer / 2);
        const totalCalendar = Math.round((totalWd / 5) * 7);

        return {
            internalWd: finalInternalWd,
            bufferKh: finalBuffer,
            totalCalendar,
            phases: { c: finalC, d3: finalD3, s: finalS, kt: finalKT, qc: finalQC }
        };
    };

    const timelineData = computeTimeline();

    // Calculate dynamic total days from tasks array for preview
    const calculateDynamicTotalDays = () => {
        if (!generatedTasks || generatedTasks.length === 0) return timelineData.totalCalendar;

        let minStart = new Date('2100-01-01').getTime();
        let maxEnd = new Date('1900-01-01').getTime();
        let hasValidDates = false;

        generatedTasks.forEach(t => {
            const s = new Date(t.start).getTime();
            const e = new Date(t.end).getTime();
            if (!isNaN(s) && !isNaN(e)) {
                if (s < minStart) minStart = s;
                if (e > maxEnd) maxEnd = e;
                hasValidDates = true;
            }
        });

        if (hasValidDates) {
            return Math.round((maxEnd - minStart) / 86400000) + 1;
        }
        return timelineData.totalCalendar;
    };

    const dynamicTotalDays = showPreview ? calculateDynamicTotalDays() : timelineData.totalCalendar;

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
                phasesWd: timelineData.phases, // Send the squashed WD per phase to backend
                bufferKh: timelineData.bufferKh,
                note: aiNote // Pass along context note
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

            const pCode = projectCode.trim() || `AI-${Math.floor(Math.random() * 10000)}`;

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

    const handleRemoveTask = (index: number) => {
        const newTasks = generatedTasks.filter((_, i) => i !== index);
        setGeneratedTasks(newTasks);
    };

    const handleInsertTask = (index: number) => {
        const currentTask = generatedTasks[index];
        const newTask = {
            code: `NEW-${Math.floor(Math.random() * 1000)}`,
            title: 'Tác vụ mới',
            phaseId: currentTask.phaseId,
            start: currentTask.end || currentTask.start || new Date().toISOString().split('T')[0],
            end: currentTask.end || currentTask.start || new Date().toISOString().split('T')[0],
            assignee: '', // Will default to lead
            duration: 1,
            note: ''
        };
        const newTasks = [...generatedTasks];
        newTasks.splice(index + 1, 0, newTask);
        setGeneratedTasks(newTasks);
    };

    const handleMoveTask = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === generatedTasks.length - 1) return;

        const newTasks = [...generatedTasks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const temp = newTasks[targetIndex];
        newTasks[targetIndex] = newTasks[index];
        newTasks[index] = temp;
        setGeneratedTasks(newTasks);
    };

    const handleAddTask = () => {
        // Find the last phase ID or use GD1
        const lastPhaseId = generatedTasks.length > 0 ? generatedTasks[generatedTasks.length - 1].phaseId : 'GD1';

        // Find a recent start/end date or use today
        let newStart = new Date().toISOString().split('T')[0];
        let newEnd = newStart;
        if (generatedTasks.length > 0) {
            const lastTask = generatedTasks[generatedTasks.length - 1];
            newStart = lastTask.end || lastTask.start || newStart;
            // Add 1 day to end
            const d = new Date(newStart);
            d.setDate(d.getDate() + 1);
            newEnd = d.toISOString().split('T')[0];
        }

        const newTask = {
            code: `NEW-${Math.floor(Math.random() * 1000)}`,
            title: 'Tác vụ mới',
            phaseId: lastPhaseId,
            start: newStart,
            end: newEnd,
            assignee: '', // Will default to lead
            duration: 1,
            note: ''
        };
        setGeneratedTasks([...generatedTasks, newTask]);
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
                                {/* Panel 0: Chat Input & Image Upload */}
                                <div className="bg-[#1e293b]/80 border border-indigo-500/30 rounded-2xl p-6 shadow-inner relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                    <h4 className="text-[13px] font-black font-mono text-indigo-300 mb-4 flex items-center gap-3 tracking-wider uppercase">
                                        <MessageSquare size={16} /> Nhập đề bài (Chat AI & Mặt bằng)
                                    </h4>

                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            {/* Image Upload Box */}
                                            <div
                                                className="w-32 h-32 shrink-0 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-500/5 transition-all overflow-hidden relative group"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                {imageBase64 ? (
                                                    <>
                                                        <img src={imageBase64} alt="Layout" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <span className="text-xs text-white font-bold">Thay ảnh đổi</span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setImageBase64(null); }}
                                                            className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-md hover:bg-red-500 transition-colors"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Image size={24} className="text-slate-400 mb-2 group-hover:text-indigo-400" />
                                                        <span className="text-[10px] text-slate-400 font-bold text-center px-2 group-hover:text-indigo-300">Tải Mặt Bằng (Tùy chọn)</span>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                />
                                            </div>

                                            {/* Chat Textarea */}
                                            <div className="flex-1 flex flex-col relative">
                                                <textarea
                                                    value={aiPrompt}
                                                    onChange={(e) => setAiPrompt(e.target.value)}
                                                    placeholder="VD: Anh Nam có căn hộ này, muốn thiết kế style Wabi Sabi, làm sao trong 25 ngày phải xong thiết kế để còn thi công..."
                                                    className="w-full h-32 px-4 py-3 bg-[#0f172a] border border-slate-700/80 rounded-xl text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none placeholder:text-slate-600 custom-scrollbar"
                                                />
                                                <button
                                                    onClick={handleAnalyze}
                                                    disabled={isAnalyzing}
                                                    className="absolute bottom-2 right-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {isAnalyzing ? <><Loader2 size={12} className="animate-spin" /> Đang đọc...</> : <><Sparkles size={12} /> Phân Tích</>}
                                                </button>
                                            </div>
                                        </div>

                                        {/* AI Response Area */}
                                        {aiResponseText && (
                                            <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2">
                                                <div className="mt-0.5"><Sparkles size={16} className="text-indigo-400" /></div>
                                                <p className="text-sm text-indigo-200 leading-relaxed font-medium">
                                                    {aiResponseText}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Panel 1: Info & Team */}
                                <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-6 shadow-inner opacity-60 hover:opacity-100 transition-opacity focus-within:opacity-100">
                                    <h4 className="text-[13px] font-black font-mono text-slate-300 mb-5 flex items-center gap-3 tracking-wider uppercase">
                                        <span className="bg-indigo-500/20 text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                        Xác nhận Thông Tin Hành Chính
                                    </h4>

                                    <div className="grid grid-cols-12 gap-5 mb-5">
                                        <div className="col-span-3">
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Mã Dự Án</label>
                                            <input
                                                type="text"
                                                value={projectCode}
                                                onChange={(e) => setProjectCode(e.target.value)}
                                                className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-slate-600 font-mono"
                                                placeholder="VD: AI-2655"
                                            />
                                        </div>
                                        <div className="col-span-5">
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
                                        <div className="col-span-4">
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
                                <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-6 shadow-inner opacity-60 hover:opacity-100 transition-opacity focus-within:opacity-100">
                                    <h4 className="text-[13px] font-black font-mono text-slate-300 mb-5 flex items-center gap-3 tracking-wider uppercase">
                                        <span className="bg-indigo-500/20 text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                        Xác nhận Kỹ thuật & Phân khúc
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
                                                className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-xl text-sm font-bold text-amber-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            >
                                                {getInvestmentLevels(projectType).map(lvl => (
                                                    <option key={lvl} value={lvl}>{lvl}</option>
                                                ))}
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
                                                value={aiNote}
                                                onChange={(e) => setAiNote(e.target.value)}
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
                                            <span className="text-xl font-mono font-black text-emerald-400">~{dynamicTotalDays}</span>
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
                                    <p className="text-sm text-slate-400">Bạn có thể tinh chỉnh Ngày tháng, Thêm/Xóa Task. Tổng ngày sẽ <span className="text-amber-400 font-bold">tự động tính toán lại</span>.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-slate-800 px-4 py-2 rounded-lg flex flex-col items-center justify-center border border-slate-700 min-w-[100px] shadow-inner">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1"><Calendar size={10} /> Tổng Ngày</div>
                                        <div className="text-xl font-black text-amber-400">~{dynamicTotalDays}</div>
                                    </div>
                                    <div className="bg-slate-800 px-4 py-2 rounded-lg flex flex-col items-center justify-center border border-slate-700 min-w-[100px] shadow-inner">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng Tasks</div>
                                        <div className="text-xl font-black text-indigo-400">{generatedTasks.length}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-[#1e293b] text-slate-400 text-[11px] uppercase font-black tracking-wider border-b border-slate-700">
                                        <tr>
                                            <th className="px-2 py-3 w-10 text-center"></th>
                                            <th className="px-4 py-3 w-16">Code</th>
                                            <th className="px-4 py-3 w-3/12">Tên Task</th>
                                            <th className="px-4 py-3 text-center w-20">Số ngày</th>
                                            <th className="px-4 py-3 w-32">Bắt đầu</th>
                                            <th className="px-4 py-3 w-32">Kết thúc</th>
                                            <th className="px-4 py-3 w-40">Phụ trách</th>
                                            <th className="px-4 py-3 w-12 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                                        {generatedTasks.map((task, idx) => {
                                            const s = new Date(task.start).getTime();
                                            const e = new Date(task.end).getTime();
                                            const days = !isNaN(s) && !isNaN(e) ? Math.round((e - s) / 86400000) + 1 : 0;
                                            return (
                                                <tr key={idx} className="hover:bg-slate-800/40 transition-colors group">
                                                    <td className="px-2 py-2 align-top pt-3">
                                                        <div className="flex flex-col gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleInsertTask(idx)} className="text-emerald-400 hover:bg-emerald-400/20 p-0.5 rounded" title="Thêm Task mới ngay bên dưới"><Plus size={14} /></button>
                                                            <div className="flex gap-1 flex-col mt-1 bg-slate-800 rounded p-0.5">
                                                                <button onClick={() => handleMoveTask(idx, 'up')} disabled={idx === 0} className="text-slate-400 hover:text-white disabled:opacity-20 p-0.5" title="Chuyển lên"><ArrowUp size={12} /></button>
                                                                <button onClick={() => handleMoveTask(idx, 'down')} disabled={idx === generatedTasks.length - 1} className="text-slate-400 hover:text-white disabled:opacity-20 p-0.5" title="Chuyển xuống"><ArrowDown size={12} /></button>
                                                            </div>
                                                        </div>
                                                    </td>
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
                                                    <td className="px-4 py-2 text-center">
                                                        <button
                                                            onClick={() => handleRemoveTask(idx)}
                                                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Xóa Task"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={handleAddTask}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg text-sm font-bold border border-slate-700/50 border-dashed transition-colors flex items-center gap-2"
                                >
                                    + Thêm Tác Vụ Mới
                                </button>
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
