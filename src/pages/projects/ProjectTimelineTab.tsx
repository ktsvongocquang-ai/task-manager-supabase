import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Project, type Task } from '../../types';
import { supabase } from '../../services/supabase';
import { format, parseISO } from 'date-fns';
import { DEFAULT_PHASES, detectPhase } from '../../utils/phaseUtils';
import { X, Plus, Minus, ChevronDown, ChevronRight, Play, PauseCircle, Clock, RefreshCw, BarChart2 } from 'lucide-react';

const formatCleanName = (name: string) => {
    if (!name) return '';
    const cleaned = name.replace(/^[-*•\d+.\/]+\s*/, '').trim();
    if (!cleaned) return name;
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const formatCleanTaskCode = (code: string) => {
    if (!code) return '';
    const parts = code.split('-');
    if (parts.length >= 2) return `${parts[0]}-${parts[1]}`;
    return code;
};

const getTaskDurationDays = (startDate?: string | null, dueDate?: string | null) => {
    if (!startDate || !dueDate) return null;
    try {
        const s = parseISO(startDate);
        const d = parseISO(dueDate);
        const diff = Math.ceil((d.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : 1;
    } catch {
        return null;
    }
};

// ── KPI State stored in other_info ─────────────────────────────────────────────
interface KPIPhaseState {
    days_used: number;
    days_estimated?: number;
}
interface KPIState {
    paused_days: number;
    is_paused: boolean;
    phases: Record<string, KPIPhaseState>;
    // Manual phase assignment overrides { taskId: phaseKey }
    taskPhaseMap: Record<string, string>;
}

const DEFAULT_KPI_STATE: KPIState = {
    paused_days: 0,
    is_paused: false,
    phases: {
        'concept': { days_used: 0, days_estimated: 0 },
        '3d': { days_used: 0, days_estimated: 0 },
        '2d': { days_used: 0, days_estimated: 0 },
        'construction': { days_used: 0, days_estimated: 0 },
    },
    taskPhaseMap: {},
};

// ── Component ──────────────────────────────────────────────────────────────────
interface ProjectTimelineTabProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    tasks: Task[];
    managerName?: string;
    onUpdateProject?: () => void;
    onEditTask?: (t: Task) => void;
}

export const ProjectTimelineTab: React.FC<ProjectTimelineTabProps> = ({
    isOpen, onClose, project, tasks, managerName, onUpdateProject, onEditTask
}) => {
    const navigate = useNavigate();
    const [kpiState, setKpiState] = useState<KPIState>(DEFAULT_KPI_STATE);
    const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({ concept: true });
    const [saving, setSaving] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [areaSqm, setAreaSqm] = useState<number | ''>('');
    const [projectType, setProjectType] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Load KPI state from project.other_info
    useEffect(() => {
        if (!project) return;
        try {
            if (project.other_info) {
                const parsed = JSON.parse(project.other_info);
                if (parsed?.kpiData) {
                    setKpiState({
                        ...DEFAULT_KPI_STATE,
                        ...parsed.kpiData,
                        phases: { ...DEFAULT_KPI_STATE.phases, ...(parsed.kpiData.phases || {}) },
                        taskPhaseMap: parsed.kpiData.taskPhaseMap || {},
                    });
                }
                setProjectType(parsed?.project_type || '');
            }
            setAreaSqm(project.area_sqm || '');
            setStartDate(project.start_date || '');
            setEndDate(project.end_date || '');
            if (project.other_info && JSON.parse(project.other_info)?.kpiData) return;
        } catch (e) {}
        setKpiState(DEFAULT_KPI_STATE);
    }, [project, isOpen]);

    // Ref for debounced save — MUST be before early return (hooks rule)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Get project tasks (only parent tasks, no subtasks) — MUST be before early return
    const projectTasks = (isOpen && project) ? tasks.filter(t => t.project_id === project.id && !t.parent_id && !(t.status || '').includes('Chờ kích hoạt') && !(t.status || '').includes('Dự thảo')) : [];

    // Group tasks by phase — MUST be before early return (hooks rule)
    const tasksByPhase = useMemo(() => {
        const grouped: Record<string, Task[]> = { concept: [], '3d': [], '2d': [], 'construction': [], '_unassigned': [] };
        if (!isOpen || !project) return grouped;
        projectTasks.forEach(t => {
            // Manual override > auto-detect
            const phaseKey = kpiState.taskPhaseMap[t.id] || detectPhase(t);
            if (grouped[phaseKey]) grouped[phaseKey].push(t);
            else grouped['_unassigned'].push(t);
        });
        return grouped;
    }, [projectTasks, kpiState.taskPhaseMap, isOpen, project]);

    const isRollupProject = project?.status === 'Thi công' || (project?.name || '').toLowerCase().includes('tổng hợp');

    const activePhases = useMemo(() => {
        if (!project) return [];
        return isRollupProject
            ? projectTasks.map(pt => ({
                key: pt.id,
                name: pt.name,
                isRollup: true
              }))
            : DEFAULT_PHASES.map(p => ({
                key: p.key,
                name: p.name,
                isRollup: false
              }));
    }, [project, isRollupProject, projectTasks]);

    if (!isOpen || !project) return null;

    // Save handler
    const triggerSave = (stateToSave: KPIState) => {
        if (!onUpdateProject) return;
        setSaving(true);
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(async () => {
            try {
                let currentOtherInfo: any = {};
                try { if (project.other_info) currentOtherInfo = JSON.parse(project.other_info); } catch (e) {}
                const newOtherInfo = { ...currentOtherInfo, kpiData: stateToSave };
                await supabase.from('projects').update({ other_info: JSON.stringify(newOtherInfo) }).eq('id', project.id);
                onUpdateProject();
            } finally {
                setSaving(false);
            }
        }, 1500);
    };

    const updateState = (updater: (prev: KPIState) => KPIState) => {
        setKpiState(prev => {
            const next = updater(prev);
            triggerSave(next);
            return next;
        });
    };

    // Assign a task to a phase
    const assignTaskToPhase = (taskId: string, phaseKey: string) => {
        updateState(s => ({
            ...s,
            taskPhaseMap: { ...s.taskPhaseMap, [taskId]: phaseKey }
        }));
    };

    const [showAiModal, setShowAiModal] = useState(false);
    const [aiDraftDays, setAiDraftDays] = useState<Record<string, number>>({
        concept: 13,
        '3d': 15,
        '2d': 20,
        construction: 18,
    });

    const handleUpdateProjectDates = async (field: 'start_date' | 'end_date', val: string) => {
        if (!project) return;
        await supabase.from('projects').update({ [field]: val }).eq('id', project.id);
        if (onUpdateProject) onUpdateProject();

        // Auto recalculate End Date if Start Date is updated manually
        if (field === 'start_date' && val && totalEstimatedDays > 0) {
            recalculateEndDateWithDays(val, totalEstimatedDays);
        }
    };

    const recalculateEndDateWithDays = (startStr: string, daysNeeded: number) => {
        if (!startStr || daysNeeded <= 0) return;
        let current = new Date(startStr);
        let counted = current.getDay() !== 0 ? 1 : 0;
        
        while (counted < daysNeeded) {
            current.setDate(current.getDate() + 1);
            if (current.getDay() !== 0) {
                counted++;
            }
        }
        
        const newEndDate = current.toISOString().split('T')[0];
        setEndDate(newEndDate);
        handleUpdateProjectDates('end_date', newEndDate);
    };

    const handleAIPredict = async () => {
        if (!areaSqm || !projectType) {
            alert('Vui lòng nhập Diện tích và Loại hình trước khi dự đoán bằng AI.');
            return;
        }
        setIsGeneratingAI(true);
        try {
            // Auto save Area and Type to project
            let currentOtherInfo: any = {};
            try { if (project?.other_info) currentOtherInfo = JSON.parse(project.other_info); } catch (e) {}
            if (project) {
                await supabase.from('projects').update({ 
                    area_sqm: areaSqm,
                    other_info: JSON.stringify({ ...currentOtherInfo, project_type: projectType })
                }).eq('id', project.id);
                if (onUpdateProject) onUpdateProject();
            }

            let aiMap: Record<string, number> = {
                concept: Math.max(7, Math.round(Number(areaSqm) * 0.04)),
                '3d': Math.max(10, Math.round(Number(areaSqm) * 0.06)),
                '2d': Math.max(12, Math.round(Number(areaSqm) * 0.08)),
                construction: Math.max(15, Math.round(Number(areaSqm) * 0.1))
            };

            const res = await fetch('/api/generate-timeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ area: areaSqm, projectType })
            }).catch(() => null);

            if (res && res.ok) {
                const data = await res.json().catch(() => null);
                if (Array.isArray(data)) {
                    data.forEach((item: any) => {
                        const phaseStr = (item.phase || '').toLowerCase();
                        if (phaseStr.includes('concept')) aiMap['concept'] = item.days;
                        else if (phaseStr.includes('3d')) aiMap['3d'] = item.days;
                        else if (phaseStr.includes('triển khai') || phaseStr.includes('2d')) aiMap['2d'] = item.days;
                        else if (phaseStr.includes('construction') || phaseStr.includes('thi công') || phaseStr.includes('hồ sơ')) aiMap['construction'] = item.days;
                    });
                }
            }

            setAiDraftDays(aiMap);
            setShowAiModal(true); // Open preview modal for user review & editing!
        } catch (error) {
            console.error('AI Predict error:', error);
            alert('Có lỗi xảy ra khi dự đoán bằng AI.');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleApplyAiTimeline = () => {
        const totalDays = Object.values(aiDraftDays).reduce((a, b) => a + Number(b || 0), 0);
        
        updateState(s => {
            const newPhases = { ...s.phases };
            ['concept', '3d', '2d', 'construction'].forEach(key => {
                if (aiDraftDays[key] !== undefined) {
                    newPhases[key] = { ...newPhases[key], days_estimated: Number(aiDraftDays[key] || 0) };
                }
            });
            return { ...s, phases: newPhases };
        });

        if (startDate) {
            recalculateEndDateWithDays(startDate, totalDays);
        }

        setShowAiModal(false);
    };    // ── Time metrics ────────────────────────────────────────────────────────────
    const totalPhaseDays = Object.values(kpiState.phases).reduce((a, p) => a + (p.days_used || 0), 0);
    const totalEstimatedDays = Object.values(kpiState.phases).reduce((a, p) => a + (p.days_estimated || 0), 0);
    const totalDaysUsed = totalPhaseDays + (kpiState.paused_days || 0);

    const handleAutoCalculateEndDate = () => {
        if (!startDate) {
            alert("Vui lòng chọn Ngày bắt đầu trước!");
            return;
        }
        if (totalEstimatedDays === 0) {
            alert("Vui lòng dự đoán AI để có Tổng tiến độ dự kiến trước!");
            return;
        }
        
        let daysNeeded = totalEstimatedDays + (kpiState.paused_days || 0);
        let current = new Date(startDate);
        let workingDaysCounted = 0;
        
        if (current.getDay() !== 0) {
            workingDaysCounted = 1;
        }
        
        while (workingDaysCounted < daysNeeded) {
            current.setDate(current.getDate() + 1);
            if (current.getDay() !== 0) {
                workingDaysCounted++;
            }
        }
        
        const newEndDate = current.toISOString().split('T')[0];
        setEndDate(newEndDate);
        handleUpdateProjectDates('end_date', newEndDate);
    };

    return (
        <div className="w-full flex flex-col h-full bg-white sm:rounded-b-3xl relative">
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 custom-scrollbar">
                
                {/* ── Minimal Streamlined Top Dashboard ── */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 mb-3 shadow-2xs space-y-2">
                    {/* Row 1: General Progress & Stats Summary */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Tiến độ:</span>
                            <div className="flex-1 h-2 bg-slate-200/70 rounded-full overflow-hidden max-w-[160px]">
                                <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: totalEstimatedDays > 0 ? `${Math.min(100, (totalPhaseDays / totalEstimatedDays) * 100)}%` : '0%' }}></div>
                            </div>
                            <span className="text-xs font-bold text-slate-800 shrink-0">{totalPhaseDays} <span className="text-[10px] text-slate-400 font-medium">/ {totalEstimatedDays} ng</span></span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-bold shrink-0 bg-white px-2 py-0.5 rounded-md border border-slate-200/60">
                            <span className="text-slate-500">Làm: <strong className="text-indigo-600">{totalPhaseDays}d</strong></span>
                            <span className="text-slate-300">|</span>
                            <div className="flex items-center gap-1">
                                <span className="text-slate-500">Dừng:</span>
                                <button type="button" onClick={() => updateState(s => ({ ...s, paused_days: Math.max(0, s.paused_days - 1) }))} className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"><Minus size={10} strokeWidth={3} /></button>
                                <span className="text-amber-600 font-extrabold px-0.5">{kpiState.paused_days}</span>
                                <button type="button" onClick={() => updateState(s => ({ ...s, paused_days: s.paused_days + 1 }))} className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"><Plus size={10} strokeWidth={3} /></button>
                            </div>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500">Dự kiến: <strong className="text-slate-700">{totalEstimatedDays}d</strong></span>
                        </div>
                    </div>

                    {/* Row 2: Inputs & AI Action in 1 compact line */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/50 text-[11px]">
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Bắt đầu:</span>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} onBlur={(e) => handleUpdateProjectDates('start_date', e.target.value)} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 h-6" />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Kết thúc:</span>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} onBlur={(e) => handleUpdateProjectDates('end_date', e.target.value)} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 h-6" />
                            <button type="button" onClick={handleAutoCalculateEndDate} className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold underline px-0.5" title="Tự tính (bỏ qua CN)">✨ Tự tính</button>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">m²:</span>
                            <input type="number" value={areaSqm} onChange={(e) => setAreaSqm(e.target.value ? Number(e.target.value) : '')} className="w-14 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 h-6" placeholder="100" />
                        </div>
                        <div className="flex items-center gap-1">
                            <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 h-6">
                                <option value="">Loại hình</option>
                                <option value="Chung cư">Chung cư</option>
                                <option value="Nhà ở">Nhà ở</option>
                                <option value="Dịch vụ">Dịch vụ</option>
                            </select>
                        </div>
                        <button type="button" onClick={handleAIPredict} disabled={isGeneratingAI} className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded shadow-2xs hover:bg-indigo-700 transition-colors flex items-center gap-1 disabled:opacity-50 h-6 ml-auto">
                            {isGeneratingAI ? <RefreshCw size={11} className="animate-spin" /> : <span>✨ AI Dự đoán</span>}
                        </button>
                        {project && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    navigate(`/gantt?search=${encodeURIComponent(project.project_code || project.name)}`);
                                }}
                                className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded shadow-2xs transition-colors flex items-center gap-1 h-6 cursor-pointer"
                                title="Mở sơ đồ Gantt đầy đủ của dự án"
                            >
                                <BarChart2 size={11} />
                                <span>Sơ đồ Gantt</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Minimal Phases List ── */}
                <div className="space-y-1.5">
                    {activePhases.map((phase) => {
                        const pState = kpiState.phases[phase.key] || { days_used: 0, days_estimated: 0 };
                        const phaseTasks = phase.isRollup
                            ? tasks.filter(t => t.parent_id === phase.key)
                            : (tasksByPhase[phase.key] || []);
                        const isExpanded = expandedPhases[phase.key] !== false;
                        
                        const isDone = pState.days_used >= (pState.days_estimated || 1) && pState.days_used > 0;
                        const isActive = pState.days_used > 0 && !isDone;
                        const isEmpty = phaseTasks.length === 0;

                        // Calculate phase start, end, and duration automatically from tasks
                        const validStarts = phaseTasks.map(t => t.start_date).filter(Boolean) as string[];
                        const validEnds = phaseTasks.map(t => t.due_date).filter(Boolean) as string[];
                        const pStart = validStarts.length > 0 ? [...validStarts].sort()[0] : null;
                        const pEnd = validEnds.length > 0 ? [...validEnds].sort().reverse()[0] : null;
                        const pDuration = getTaskDurationDays(pStart, pEnd);

                        return (
                            <div key={phase.key} className={`bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs transition-all duration-200 ${isEmpty && !phase.isRollup ? 'opacity-60 hover:opacity-100' : ''}`}>
                                {/* Single Row Minimal Header */}
                                <div className="px-3 py-2 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/80" onClick={() => setExpandedPhases(prev => ({ ...prev, [phase.key]: !(prev[phase.key] !== false) }))}>
                                    
                                    {/* Left: Dot + Title + Task Badge + Auto Dates */}
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${isDone ? 'bg-emerald-500' : isActive ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                                        <h4 className="font-bold text-slate-800 text-[13px]">{phase.name}</h4>
                                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-md">{phaseTasks.length} task</span>
                                        {pStart && pEnd && (
                                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded-md">
                                                {format(parseISO(pStart), 'dd/MM')} → {format(parseISO(pEnd), 'dd/MM')} ({pDuration}d)
                                            </span>
                                        )}
                                    </div>

                                    {/* Right: Days Used & Estimated Controls inline + Status */}
                                    <div className="flex items-center gap-2 sm:gap-3" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center gap-1 text-[11px]">
                                            <span className="text-slate-400 font-medium">Làm:</span>
                                            <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_used: Math.max(0, (s.phases[phase.key]?.days_used || 0) - 1) } } }))} className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"><Minus size={10} strokeWidth={2.5} /></button>
                                            <span className="font-bold text-xs text-indigo-600 w-3 text-center">{pState.days_used || 0}</span>
                                            <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_used: (s.phases[phase.key]?.days_used || 0) + 1 } } }))} className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"><Plus size={10} strokeWidth={2.5} /></button>
                                        </div>

                                        <span className="text-slate-300">/</span>

                                        <div className="flex items-center gap-1 text-[11px]">
                                            <span className="text-slate-400 font-medium">Dự kiến:</span>
                                            <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_estimated: Math.max(0, (s.phases[phase.key]?.days_estimated || 0) - 1) } } }))} className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"><Minus size={10} strokeWidth={2.5} /></button>
                                            <span className="font-bold text-xs text-slate-700 w-3 text-center">{pState.days_estimated || 0}</span>
                                            <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_estimated: (s.phases[phase.key]?.days_estimated || 0) + 1 } } }))} className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"><Plus size={10} strokeWidth={2.5} /></button>
                                            <span className="text-[10px] text-slate-400">ng</span>
                                        </div>

                                        <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] uppercase tracking-wide ${isDone ? 'bg-emerald-50 text-emerald-600' : isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {isDone ? 'XONG' : isActive ? 'ĐANG' : 'CHỜ'}
                                        </span>

                                        {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                                    </div>
                                </div>
                                    
                                {/* Expanded content: Only task list, no extra rows */}
                                {isExpanded && phaseTasks.length > 0 && (
                                    <div className="px-3 pb-2 pt-1 border-t border-slate-100">
                                        <div className="space-y-1">
                                            {phaseTasks.map(t => {
                                                const tDuration = getTaskDurationDays(t.start_date, t.due_date);
                                                return (
                                                    <div 
                                                        key={t.id} 
                                                        onClick={() => onEditTask?.(t)}
                                                        className="flex justify-between items-center bg-slate-50/70 hover:bg-slate-100 rounded-lg px-2.5 py-1 border border-slate-100 text-xs cursor-pointer transition-all"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.status?.includes('Hoàn thành') ? 'bg-emerald-500' : t.status?.includes('Đang') ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                                            <span className={`font-semibold truncate ${t.status?.includes('Hoàn thành') ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{formatCleanName(t.name)}</span>
                                                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">({formatCleanTaskCode(t.task_code)})</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {t.start_date && t.due_date && (
                                                                <span className="text-[10px] text-slate-400 font-medium">
                                                                    {format(parseISO(t.start_date), 'dd/MM')} - {format(parseISO(t.due_date), 'dd/MM')} {tDuration ? `(${tDuration}d)` : ''}
                                                                </span>
                                                            )}
                                                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${t.status?.includes('Hoàn thành') ? 'bg-emerald-100 text-emerald-600' : t.status?.includes('Đang') ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{t.status}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                    {/* Footer helper text */}
                    <p className="text-center text-[11px] font-medium text-slate-400 mt-6 mb-2">
                        Bấm số <span className="text-indigo-500 font-bold">/0 ng ✏️</span> để nhập dự kiến cho từng giai đoạn.
                    </p>

                    {/* Unassigned tasks */}
                    {!isRollupProject && (tasksByPhase['_unassigned'] || []).length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-[1.25rem] p-4 shadow-sm mt-4">
                            <h4 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                ⚠ Nhiệm vụ chưa gán giai đoạn ({tasksByPhase['_unassigned'].length})
                            </h4>
                            <div className="space-y-2">
                                {tasksByPhase['_unassigned'].map(t => (
                                    <div 
                                        key={t.id} 
                                        onClick={() => onEditTask?.(t)}
                                        className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-amber-100 shadow-sm cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></div>
                                            <span className="text-[13px] font-bold text-slate-700 truncate">{t.name}</span>
                                        </div>
                                        <select 
                                            value=""
                                            onChange={e => { if (e.target.value) assignTaskToPhase(t.id, e.target.value); }}
                                            className="text-[10px] font-bold bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer shrink-0 ml-2"
                                        >
                                            <option value="">Gán giai đoạn...</option>
                                            {DEFAULT_PHASES.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                {saving && (
                    <div className="absolute top-4 right-20 flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[10px] font-bold shadow-sm">
                        <div className="w-2 h-2 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
                        Đang lưu...
                    </div>
                )}
            </div>

            {/* ── AI TIMELINE PREVIEW & EDIT MODAL ── */}
            {showAiModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-base font-extrabold flex items-center gap-2">
                                    ✨ Kế hoạch Tiến độ AI Dự đoán
                                </h3>
                                <p className="text-[11px] text-indigo-100 font-medium">
                                    Diện tích: {areaSqm}m² | Loại hình: {projectType}
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowAiModal(false)}
                                className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-700">Tổng số ngày Thiết Kế dự kiến:</span>
                                <span className="text-sm font-extrabold text-indigo-700 bg-white px-2.5 py-0.5 rounded-md border border-indigo-200 shadow-2xs">
                                    {(aiDraftDays['concept'] || 0) + (aiDraftDays['3d'] || 0) + (aiDraftDays['2d'] || 0)} ngày
                                </span>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                    Tiến độ 3 giai đoạn Thiết Kế (Concept, 3D, 2D):
                                </label>

                                {[
                                    { key: 'concept', label: 'Concept (Khảo sát & Ý tưởng)', color: 'text-purple-600' },
                                    { key: '3d', label: '3D / Phối cảnh', color: 'text-indigo-600' },
                                    { key: '2d', label: '2D / Triển khai kỹ thuật', color: 'text-emerald-600' },
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs">
                                        <span className={`font-bold ${item.color}`}>{item.label}</span>
                                        <div className="flex items-center gap-1.5">
                                            <input 
                                                type="number"
                                                min="1"
                                                value={aiDraftDays[item.key] ?? 0}
                                                onChange={(e) => {
                                                    const val = Math.max(1, Number(e.target.value) || 0);
                                                    setAiDraftDays(prev => ({ ...prev, [item.key]: val }));
                                                }}
                                                className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <span className="text-slate-400 font-semibold">ngày</span>
                                        </div>
                                    </div>
                                ))}

                                <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-[11px] text-amber-800 font-medium">
                                    🔨 <strong>Giai đoạn Thi công / Tiền thi công:</strong> Được ẩn mặc định & kích hoạt riêng khi có lệnh triển khai thi công công trình.
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowAiModal(false)}
                                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleApplyAiTimeline}
                                className="px-4 py-1.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <span>✨ Áp dụng vào dự án (Oke)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
