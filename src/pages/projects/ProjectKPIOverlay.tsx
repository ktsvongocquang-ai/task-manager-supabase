import React, { useState, useEffect, useMemo, useRef } from 'react';
import { type Project, type Task } from '../../types';
import { supabase } from '../../services/supabase';
import { format, parseISO } from 'date-fns';
import { X, Plus, Minus, ChevronDown, Play, PauseCircle } from 'lucide-react';

// ── Phase definition ───────────────────────────────────────────────────────────
const DEFAULT_PHASES = [
    { key: 'concept', name: 'Concept', kpiPct: 15 },       // 15% of total KPI days
    { key: '3d', name: '3D / Phối cảnh', kpiPct: 35 },     // 35%
    { key: '2d', name: '2D / Triển khai', kpiPct: 27 },     // 27%
    { key: 'construction', name: 'Construction / Hồ sơ TC', kpiPct: 23 }, // 23%
];

// Auto-detect which phase a task belongs to from its target/name
function detectPhase(task: Task): string {
    // Direct target match (set from the task form dropdown)
    const tgt = (task.target || '').toLowerCase();
    if (['concept', '3d', '2d', 'construction'].includes(tgt)) return tgt;
    
    // Fallback: detect from name
    const str = (task.name || '').toLowerCase();
    if (str.includes('concept') || str.includes('moodboard') || str.includes('ý tưởng') || str.includes('phương án')) return 'concept';
    if (str.includes('3d') || str.includes('render') || str.includes('phối cảnh') || str.includes('nội thất 3d')) return '3d';
    if (str.includes('2d') || str.includes('triển khai') || str.includes('mep') || str.includes('bản vẽ') || str.includes('kỹ thuật') || str.includes('hồ sơ') || str.includes('tender')) return '2d';
    if (str.includes('giám sát') || str.includes('thi công') || str.includes('construction') || str.includes('nghiệm thu')) return 'construction';
    return ''; // unassigned
}

// ── KPI State stored in other_info ─────────────────────────────────────────────
interface KPIPhaseState {
    days_used: number;
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
        'concept': { days_used: 0 },
        '3d': { days_used: 0 },
        '2d': { days_used: 0 },
        'construction': { days_used: 0 },
    },
    taskPhaseMap: {},
};

// ── Component ──────────────────────────────────────────────────────────────────
interface ProjectKPIOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    tasks: Task[];
    managerName?: string;
    onUpdateProject?: () => void;
}

export const ProjectKPIOverlay: React.FC<ProjectKPIOverlayProps> = ({
    isOpen, onClose, project, tasks, managerName, onUpdateProject
}) => {
    const [kpiState, setKpiState] = useState<KPIState>(DEFAULT_KPI_STATE);
    const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({ concept: true });
    const [saving, setSaving] = useState(false);

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
                    return;
                }
            }
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
        projectTasks.forEach(t => {
            // Manual override > auto-detect
            const phase = kpiState.taskPhaseMap[t.id] || detectPhase(t);
            if (phase && grouped[phase]) grouped[phase].push(t);
            else grouped['_unassigned'].push(t);
        });
        return grouped;
    }, [projectTasks.length, kpiState.taskPhaseMap, isOpen, project?.id]);

    if (!isOpen || !project) return null;

    // Save handler - silently persist without triggering parent re-render
    const handleSave = async (newState: KPIState) => {
        setSaving(true);
        try {
            let currentOtherInfo: any = {};
            try { if (project.other_info) currentOtherInfo = JSON.parse(project.other_info); } catch (e) {}
            const merged = { ...currentOtherInfo, kpiData: newState };
            await supabase.from('projects').update({ other_info: JSON.stringify(merged) }).eq('id', project.id);
            // DO NOT call onUpdateProject here — it re-fetches projects and kills the overlay
        } catch (err) {
            console.error('Error saving KPI:', err);
        } finally {
            setSaving(false);
        }
    };

    const updateState = (updater: (prev: KPIState) => KPIState) => {
        setKpiState(prev => {
            const next = updater(prev);
            // Debounce save: wait 500ms after last change before persisting
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => handleSave(next), 500);
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

    // ── Metrics from other_info ────────────────────────────────────────────────
    let parsedInfo: any = {};
    try { if (project.other_info) parsedInfo = JSON.parse(project.other_info); } catch(e) {}
    
    const revenue = parsedInfo.budget || 0;
    const scaleStr = parsedInfo.scale || '';
    const typeLabel = parsedInfo.project_type || '';
    const projectNameStr = project.name.toLowerCase();

    let coefficient = 1.0;
    if (typeLabel.includes('Chung cư') || (!typeLabel && projectNameStr.includes('chung cư'))) coefficient = 1.0;
    else if (typeLabel.includes('Dịch vụ') || (!typeLabel && (projectNameStr.includes('dịch vụ') || projectNameStr.includes('nhà hàng') || projectNameStr.includes('cafe')))) coefficient = 0.8;
    else if (typeLabel.includes('Nhà ở') || (!typeLabel && (projectNameStr.includes('nhà ở') || projectNameStr.includes('biệt thự')))) coefficient = 1.3;

    let area = 0;
    if (scaleStr) { const m = String(scaleStr).match(/[\d.]+/); if (m) area = parseFloat(m[0]); }
    const pricePerM2 = area > 0 ? (revenue / area) : 0;
    const kpiBreakEven = revenue > 0 ? Math.round((revenue / 30000000) * 26 * coefficient) : 0;

    const totalPhaseDays = Object.values(kpiState.phases).reduce((a, p) => a + (p.days_used || 0), 0);
    const totalDaysUsed = totalPhaseDays + (kpiState.paused_days || 0);
    const remainingDays = kpiBreakEven - totalDaysUsed;

    // Calculate KPI days allocated per phase
    const getPhaseKpiDays = (pct: number) => kpiBreakEven > 0 ? Math.round(kpiBreakEven * pct / 100) : 0;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-slate-50 border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-8 py-6 pb-2 relative flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{project.name}</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            {project.project_code} • Quản lý: {managerName || 'Chưa gán'} • Bắt đầu: {project.start_date ? format(parseISO(project.start_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-[13px] font-bold text-slate-600">
                            <span>Diện tích: <strong className="text-slate-800">{area > 0 ? `${area} m²` : 'N/A'}</strong></span>
                            <span>Đơn giá: <strong className="text-slate-800">{pricePerM2 > 0 ? `${(pricePerM2/1000).toLocaleString('vi-VN')}k/m²` : 'N/A'}</strong></span>
                            <span>Doanh thu: <strong className="text-indigo-600">{revenue > 0 ? `${(revenue/1000000).toLocaleString('vi-VN')}tr` : 'N/A'}</strong></span>
                            <span className="bg-slate-200 px-2 py-0.5 rounded-full text-[10px] uppercase text-slate-500">HỆ SỐ {coefficient}</span>
                        </div>
                    </div>
                    <div className="text-right pr-10">
                        <div className={`text-5xl font-black leading-none ${remainingDays >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{kpiBreakEven > 0 ? Math.abs(remainingDays) : '—'}</div>
                        <div className="text-xs uppercase font-bold text-slate-400 mt-1">ngày KPI {remainingDays >= 0 ? 'còn lại' : 'vượt lố'}</div>
                        <div className="text-[10px] text-slate-400">đến mốc hòa vốn</div>
                    </div>
                    <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-200 rounded-full"><X size={24} /></button>
                </div>

                {/* Progress Bar */}
                <div className="px-8 pb-4">
                    <div className={`${totalDaysUsed > kpiBreakEven && kpiBreakEven > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'} border rounded-2xl p-4 mt-4 shadow-sm`}>
                        <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 animate-pulse bg-emerald-500 rounded-full inline-block"></span>
                            {kpiBreakEven > 0 ? `${totalPhaseDays} ngày làm + ${kpiState.paused_days} ngày dừng = ${totalDaysUsed}/${kpiBreakEven} ngày KPI.` : 'Chưa nhập thông tin KPI (Doanh thu, Diện tích). Hãy sửa dự án để bắt đầu.'}
                        </h3>
                        {kpiBreakEven > 0 && (
                            <>
                                <div className="h-4 bg-emerald-200/50 rounded-full overflow-hidden flex shadow-inner">
                                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(100, (totalPhaseDays / kpiBreakEven) * 100)}%` }}></div>
                                    <div className="h-full bg-amber-400 opacity-60 flex-none" style={{ width: `${Math.min(100, (kpiState.paused_days / kpiBreakEven) * 100)}%` }}></div>
                                </div>
                                <div className="flex gap-4 mt-2 text-[10px] font-bold text-slate-500 uppercase">
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500"></div> Ngày làm: {totalPhaseDays}</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-amber-400"></div> Tạm dừng: {kpiState.paused_days}</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-slate-300"></div> Còn lại: {remainingDays}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-4 custom-scrollbar">
                    {/* Value Metrics Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm">
                            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">KPI hòa vốn</div>
                            <div className="text-3xl font-black text-indigo-600">{kpiBreakEven > 0 ? `${kpiBreakEven} ng` : '—'}</div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm">
                            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Đã dùng (làm+dừng)</div>
                            <div className="text-3xl font-black text-slate-800">{totalDaysUsed} ng</div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm relative overflow-hidden">
                            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1 relative z-10">Ngày làm thực tế</div>
                            <div className={`text-3xl font-black relative z-10 ${totalPhaseDays > kpiBreakEven && kpiBreakEven > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{totalPhaseDays} ng</div>
                        </div>
                    </div>

                    {/* Paused Config */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex justify-between items-center">
                        <div className="flex-1">
                            <h4 className="text-base font-bold text-slate-800 mb-0.5">Tạm dừng / Chờ khách phản hồi</h4>
                            <p className="text-xs text-slate-500">Gộp cả chờ khách + chuyển dự án — thời gian dự án không thể tiếp tục.</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => updateState(s => ({ ...s, paused_days: Math.max(0, s.paused_days - 1) }))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:text-rose-500 transition-colors text-slate-400"><Minus size={14} /></button>
                                <span className="font-bold text-lg text-slate-700 w-6 text-center">{kpiState.paused_days}</span>
                                <button type="button" onClick={() => updateState(s => ({ ...s, paused_days: s.paused_days + 1 }))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:text-emerald-500 transition-colors text-slate-400"><Plus size={14} /></button>
                                <span className="text-xs text-slate-500 font-bold ml-1">ngày</span>
                            </div>
                            <button type="button"
                                onClick={() => updateState(s => ({ ...s, is_paused: !s.is_paused }))}
                                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 ${kpiState.is_paused ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}
                            >
                                {kpiState.is_paused ? <PauseCircle size={14} /> : <Play size={14} />}
                                {kpiState.is_paused ? 'ĐANG DỪNG' : 'BÌNH THƯỜNG'}
                            </button>
                        </div>
                    </div>

                    {/* ── Phases with linked tasks ── */}
                    <div className="space-y-3">
                        {DEFAULT_PHASES.map((phase) => {
                            const pState = kpiState.phases[phase.key] || { days_used: 0 };
                            const phaseTasks = tasksByPhase[phase.key] || [];
                            const phaseKpiDays = getPhaseKpiDays(phase.kpiPct);
                            const isOver = pState.days_used > phaseKpiDays;
                            const isActive = pState.days_used > 0 || phaseTasks.length > 0;
                            const isExpanded = expandedPhases[phase.key];

                            return (
                                <div key={phase.key} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-4 flex justify-between items-center cursor-pointer select-none" onClick={() => setExpandedPhases(prev => ({ ...prev, [phase.key]: !prev[phase.key] }))}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded ${isActive ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{phase.name}</h4>
                                                <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">
                                                    KPI: {phaseKpiDays} ngày • Task: {phaseTasks.length}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-300 ${isOver ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${phaseKpiDays > 0 ? Math.min(100, (pState.days_used / phaseKpiDays) * 100) : 0}%` }}></div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-black w-10 text-right ${isOver ? 'text-rose-500' : 'text-indigo-600'}`}>{pState.days_used} ng</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase w-12 text-center border ${pState.days_used === 0 ? 'bg-slate-50 text-slate-400 border-slate-200' : isOver ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                                                    {pState.days_used === 0 ? 'Chờ' : isOver ? 'Vượt' : 'Đang'}
                                                </span>
                                            </div>
                                            <div className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}><ChevronDown size={18} /></div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="bg-slate-50 border-t border-slate-100 p-4 space-y-3">
                                            {/* Days +/- */}
                                            <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                                                <span className="text-xs font-bold text-slate-600">Ngày đã dùng cho giai đoạn này</span>
                                                <div className="flex items-center gap-2">
                                                    <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_used: Math.max(0, (s.phases[phase.key]?.days_used || 0) - 1) } } }))} className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 text-slate-500 bg-white transition-colors"><Minus size={14}/></button>
                                                    <span className="font-bold text-slate-800 w-6 text-center">{pState.days_used}</span>
                                                    <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_used: (s.phases[phase.key]?.days_used || 0) + 1 } } }))} className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-500 text-slate-500 bg-white transition-colors"><Plus size={14}/></button>
                                                    <span className="text-xs text-slate-500">ngày</span>
                                                </div>
                                            </div>

                                            {/* Linked Tasks from project */}
                                            {phaseTasks.length > 0 ? (
                                                <div className="space-y-2">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nhiệm vụ thuộc giai đoạn này</div>
                                                    {phaseTasks.map(t => (
                                                        <div key={t.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className={`w-2 h-2 rounded-full shrink-0 ${t.status?.includes('Hoàn thành') ? 'bg-emerald-500' : t.status?.includes('Đang') ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                                                <span className={`text-sm font-bold truncate ${t.status?.includes('Hoàn thành') ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.name}</span>
                                                                <span className="text-[10px] text-slate-400 shrink-0">({t.task_code})</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${t.status?.includes('Hoàn thành') ? 'bg-emerald-50 text-emerald-600' : t.status?.includes('Đang') ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>{t.status}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">Chưa có nhiệm vụ nào được gán vào giai đoạn này.</p>
                                            )}

                                            {/* Footer */}
                                            <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-200/60 pt-3 font-bold">
                                                <span>Tổng: {phaseTasks.length} task</span>
                                                <span className={isOver ? 'text-rose-500' : 'text-indigo-400'}>
                                                    KPI giai đoạn: {phaseKpiDays} ng (còn {Math.max(0, phaseKpiDays - pState.days_used)} ng)
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Unassigned tasks */}
                    {(tasksByPhase['_unassigned'] || []).length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
                            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                ⚠ Nhiệm vụ chưa gán giai đoạn ({tasksByPhase['_unassigned'].length})
                            </h4>
                            <div className="space-y-2">
                                {tasksByPhase['_unassigned'].map(t => (
                                    <div key={t.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-amber-100 shadow-sm">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></div>
                                            <span className="text-sm font-bold text-slate-700 truncate">{t.name}</span>
                                            <span className="text-[10px] text-slate-400 shrink-0">({t.task_code})</span>
                                        </div>
                                        <select 
                                            value=""
                                            onChange={e => { if (e.target.value) assignTaskToPhase(t.id, e.target.value); }}
                                            className="text-[11px] font-bold bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer"
                                        >
                                            <option value="">Gán giai đoạn...</option>
                                            {DEFAULT_PHASES.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

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
