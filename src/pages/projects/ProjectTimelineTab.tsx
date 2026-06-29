import React, { useState, useEffect, useMemo, useRef } from 'react';
import { type Project, type Task } from '../../types';
import { supabase } from '../../services/supabase';
import { format, parseISO } from 'date-fns';
import { X, Plus, Minus, ChevronDown, Play, PauseCircle, Clock, RefreshCw } from 'lucide-react';

import { DEFAULT_PHASES, detectPhase } from '../../utils/phaseUtils';

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
    const projectTasks = (isOpen && project) ? tasks.filter(t => t.project_id === project.id && !t.parent_id) : [];

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

    const handleUpdateProjectDates = async (field: 'start_date' | 'end_date', val: string) => {
        if (!project) return;
        await supabase.from('projects').update({ [field]: val }).eq('id', project.id);
        if (onUpdateProject) onUpdateProject();
    };

    const handleAIPredict = async () => {
        if (!areaSqm || !projectType) {
            alert('Vui lòng nhập Diện tích và Loại hình trước khi dự đoán.');
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

            const res = await fetch('/api/generate-timeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    area: areaSqm,
                    projectType: projectType
                })
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                const aiMap: Record<string, number> = {};
                data.forEach((item: any) => {
                    const phaseStr = (item.phase || '').toLowerCase();
                    if (phaseStr.includes('concept')) aiMap['concept'] = item.days;
                    else if (phaseStr.includes('3d')) aiMap['3d'] = item.days;
                    else if (phaseStr.includes('triển khai') || phaseStr.includes('2d')) aiMap['2d'] = item.days;
                    else if (phaseStr.includes('construction') || phaseStr.includes('thi công') || phaseStr.includes('hồ sơ')) aiMap['construction'] = item.days;
                });
                
                updateState(s => {
                    const newPhases = { ...s.phases };
                    ['concept', '3d', '2d', 'construction'].forEach(key => {
                        if (aiMap[key] !== undefined) {
                            newPhases[key] = { ...newPhases[key], days_estimated: aiMap[key] };
                        }
                    });
                    return { ...s, phases: newPhases };
                });
            }
        } catch (error) {
            console.error('AI Predict error:', error);
            alert('Có lỗi xảy ra khi dự đoán bằng AI.');
        } finally {
            setIsGeneratingAI(false);
        }
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
                
                {/* ── Compact Top Dashboard ── */}
                <div className="bg-white border border-slate-100 rounded-[1.25rem] p-4 shadow-sm mb-5">
                    
                    {/* Top Row: Progress & Stats */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex-1">
                            <div className="flex justify-between items-end mb-1.5">
                                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng tiến độ</h2>
                                <div className="text-base font-bold text-slate-800 leading-none">
                                    {totalPhaseDays} <span className="text-[11px] font-bold text-slate-400">/ {totalEstimatedDays} ng</span>
                                </div>
                            </div>
                            {/* Thin Progress Bar */}
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: totalEstimatedDays > 0 ? `${Math.min(100, (totalPhaseDays / totalEstimatedDays) * 100)}%` : '0%' }}></div>
                            </div>
                        </div>

                        {/* Inline Stats */}
                        <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-[0.85rem] border border-slate-100 shrink-0">
                            <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Làm:</span>
                                <span className="text-[13px] font-bold text-indigo-600">{totalPhaseDays}</span>
                            </div>
                            <div className="flex items-center gap-2 border-r border-slate-200 pr-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Dừng:</span>
                                <div className="flex items-center gap-1">
                                    <button type="button" onClick={() => updateState(s => ({ ...s, paused_days: Math.max(0, s.paused_days - 1) }))} className="w-5 h-5 rounded hover:bg-slate-200 flex items-center justify-center text-slate-500"><Minus size={12} strokeWidth={3} /></button>
                                    <span className="text-[13px] font-bold text-amber-500 w-3 text-center">{kpiState.paused_days}</span>
                                    <button type="button" onClick={() => updateState(s => ({ ...s, paused_days: s.paused_days + 1 }))} className="w-5 h-5 rounded hover:bg-slate-200 flex items-center justify-center text-slate-500"><Plus size={12} strokeWidth={3} /></button>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Dự kiến:</span>
                                <span className="text-[13px] font-bold text-slate-700">{totalEstimatedDays}</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 w-full mb-4"></div>

                    {/* Bottom Row: Inputs & AI */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày bắt đầu</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} onBlur={(e) => handleUpdateProjectDates('start_date', e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
                                <span>Ngày kết thúc</span>
                                <button type="button" onClick={handleAutoCalculateEndDate} className="text-indigo-500 hover:text-indigo-700 normal-case flex items-center" title="Tự tính (bỏ qua CN)">
                                    <span className="text-[9px]">✨ Tự tính</span>
                                </button>
                            </label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} onBlur={(e) => handleUpdateProjectDates('end_date', e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Diện tích (m²)</label>
                            <input type="number" value={areaSqm} onChange={(e) => setAreaSqm(e.target.value ? Number(e.target.value) : '')} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="100" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Loại hình</label>
                            <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                                <option value="">Chọn</option>
                                <option value="Chung cư">Chung cư</option>
                                <option value="Nhà ở">Nhà ở (Biệt thự/Nhố)</option>
                                <option value="Dịch vụ">Dịch vụ (Shop)</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <button type="button" onClick={handleAIPredict} disabled={isGeneratingAI} className="w-full px-2 py-1.5 bg-indigo-600 text-white text-[11px] font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 h-[30px]">
                                {isGeneratingAI ? <RefreshCw size={12} className="animate-spin" /> : <span>✨ AI Dự đoán</span>}
                            </button>
                        </div>
                    </div>
                </div>

                <h3 className="text-[13px] font-bold text-slate-800 mb-3 px-1">Giai đoạn</h3>

                {/* ── Phases with linked tasks ── */}
                <div className="space-y-3">
                    {activePhases.map((phase) => {
                        const pState = kpiState.phases[phase.key] || { days_used: 0, days_estimated: 0 };
                        const phaseTasks = phase.isRollup
                            ? tasks.filter(t => t.parent_id === phase.key)
                            : (tasksByPhase[phase.key] || []);
                        const isExpanded = expandedPhases[phase.key] !== false;
                        
                        const isDone = pState.days_used >= (pState.days_estimated || 1) && pState.days_used > 0;
                        const isActive = pState.days_used > 0 && !isDone;
                        const isEmpty = phaseTasks.length === 0;

                        return (
                            <div key={phase.key} className={`bg-white border border-slate-100 rounded-[1.25rem] overflow-hidden shadow-sm transition-all duration-300 ${isEmpty && !phase.isRollup ? 'opacity-50 hover:opacity-100' : ''}`}>
                                <div className="px-4 py-3 flex flex-col gap-2" onClick={() => setExpandedPhases(prev => ({ ...prev, [phase.key]: !(prev[phase.key] !== false) }))}>
                                    
                                    {/* Header Row */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${isDone ? 'bg-emerald-500' : isActive ? 'bg-indigo-500' : 'bg-slate-400'}`}></div>
                                            <h4 className="font-bold text-slate-800 text-[15px]">{phase.name}</h4>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] tracking-wide uppercase ${isDone ? 'bg-emerald-50 text-emerald-600' : isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {isDone ? 'XONG' : isActive ? 'ĐANG' : 'CHỜ'}
                                        </span>
                                    </div>
                                    
                                    {/* Row 2: Subtext and Actual Days Buttons */}
                                    <div className={`flex items-center justify-between ${isExpanded ? 'border-b border-dashed border-slate-200 pb-2' : ''}`}>
                                        <div className="text-[12px] font-semibold text-slate-500 flex items-center gap-1">
                                            Làm <span className="text-slate-800 font-bold">{pState.days_used || 0}</span><span className="text-indigo-500 font-bold">/{pState.days_estimated || 0} ng</span> 
                                            <span className="text-indigo-500 ml-0.5">✏️</span>
                                            <span className="text-slate-300 mx-0.5">•</span> 
                                            {phaseTasks.length} task
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                            <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_used: Math.max(0, (s.phases[phase.key]?.days_used || 0) - 1) } } }))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-indigo-500 bg-white hover:bg-slate-50 transition-colors"><Minus size={14} strokeWidth={3} /></button>
                                            <span className="font-bold text-sm text-slate-800 w-5 text-center">{pState.days_used || 0}</span>
                                            <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_used: (s.phases[phase.key]?.days_used || 0) + 1 } } }))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-indigo-500 bg-white hover:bg-slate-50 transition-colors"><Plus size={14} strokeWidth={3} /></button>
                                        </div>
                                    </div>
                                </div>
                                    
                                {/* Expanded content */}
                                {isExpanded && (
                                    <div className="px-4 pb-3 pt-2 flex flex-col gap-3">
                                            {/* Estimated days editor */}
                                            <div className="flex items-center justify-between">
                                                <div className="text-[13px] font-bold text-slate-800">Dự kiến giai đoạn này</div>
                                                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                                    <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_estimated: Math.max(0, (s.phases[phase.key]?.days_estimated || 0) - 1) } } }))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-indigo-500 bg-white hover:bg-slate-50 transition-colors"><Minus size={14} strokeWidth={3}/></button>
                                                    <span className="font-bold text-sm text-slate-800 w-5 text-center">{pState.days_estimated || 0}</span>
                                                    <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_estimated: (s.phases[phase.key]?.days_estimated || 0) + 1 } } }))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-indigo-500 bg-white hover:bg-slate-50 transition-colors"><Plus size={14} strokeWidth={3}/></button>
                                                    <span className="text-[11px] font-semibold text-slate-500 ml-1">ngày</span>
                                                </div>
                                            </div>

                                            {/* Linked Tasks List */}
                                            {phaseTasks.length > 0 && (
                                                <div className="space-y-1.5 mt-0">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nhiệm vụ thuộc giai đoạn này</div>
                                                    {phaseTasks.map(t => (
                                                        <div 
                                                            key={t.id} 
                                                            onClick={() => onEditTask?.(t)}
                                                            className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 shadow-sm cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all"
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className={`w-2 h-2 rounded-full shrink-0 ${t.status?.includes('Hoàn thành') ? 'bg-emerald-500' : t.status?.includes('Đang') ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                                                <span className={`text-[13px] font-bold truncate ${t.status?.includes('Hoàn thành') ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.name}</span>
                                                                <span className="text-[10px] text-slate-400 shrink-0">({t.task_code})</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${t.status?.includes('Hoàn thành') ? 'bg-emerald-100 text-emerald-600' : t.status?.includes('Đang') ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{t.status}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
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
        </div>
    );
}
