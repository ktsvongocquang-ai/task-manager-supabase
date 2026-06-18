import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '../../services/supabase'
import { DEFAULT_PHASES, detectPhase, addWorkingDays, getNextWorkingDay } from '../../utils/phaseUtils'
import { type Task, type Project } from '../../types'
import { ChevronLeft, ChevronRight, Search, ZoomIn, ZoomOut, Calendar, ChevronDown, Folder, CheckCircle2, User, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { QuickTaskModal } from './QuickTaskModal'
import { Plus, Trash2 } from 'lucide-react'

const MONTHS_VI = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']


export const Gantt = () => {
    const [tasks, setTasks] = useState<Task[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [search, setSearch] = useState('')
    const [zoom, setZoom] = useState(100)
    const [profiles, setProfiles] = useState<any[]>([])
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
    const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [draggingItem, setDraggingItem] = useState<{ id: string, type: 'task' | 'project' | 'phase', startX: number, deltaDays: number, action: 'move' | 'resize-left' | 'resize-right' } | null>(null)
    const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null)
    const [editValue, setEditValue] = useState<string>('')

    const leftPaneRef = useRef<HTMLDivElement>(null)
    const rightPaneRef = useRef<HTMLDivElement>(null)
    const isSyncingLeftScroll = useRef(false)
    const isSyncingRightScroll = useRef(false)

    const handleLeftScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!isSyncingLeftScroll.current) {
            isSyncingRightScroll.current = true;
            if (rightPaneRef.current) {
                rightPaneRef.current.scrollTop = e.currentTarget.scrollTop;
            }
        }
        isSyncingLeftScroll.current = false;
    };
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [{ data: t }, { data: p }, { data: pr }, { data: authData }] = await Promise.all([
                supabase.from('tasks').select('*'),
                supabase.from('projects').select('*'),
                supabase.from('profiles').select('id, full_name'),
                supabase.auth.getUser()
            ])
            setProjects((p || []) as Project[])
            setProfiles((pr || []) as any[])

            let currentProfile = null;
            if (authData?.user) {
                const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single()
                setCurrentUserProfile(userProfile)
                currentProfile = userProfile;
            }

            let fetchedTasks = (t || []) as Task[];
            let fetchedProjects = (p || []) as Project[];

            if (currentProfile?.role === 'Thiết kế') {
                const employeeTasks = fetchedTasks.filter(task =>
                    task.assignee_id === currentProfile?.id ||
                    task.supporter_id === currentProfile?.id
                );
                
                const parentIds = new Set(employeeTasks.map(t => t.parent_id).filter(Boolean));
                
                fetchedTasks = fetchedTasks.filter(task => 
                    task.assignee_id === currentProfile?.id ||
                    task.supporter_id === currentProfile?.id ||
                    parentIds.has(task.id)
                );

                fetchedProjects = fetchedProjects.filter(proj =>
                    fetchedTasks.some(task => task.project_id === proj.id)
                );
            }

            setTasks(fetchedTasks);
            setProjects(fetchedProjects);
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    const isToday = (day: number) => {
        const now = new Date()
        return day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
    }

    const isWeekend = (day: number) => {
        const d = new Date(year, month, day)
        return d.getDay() === 0 || d.getDay() === 6
    }

    const getDayName = (day: number) => {
        const d = new Date(year, month, day)
        return DAY_NAMES[d.getDay()]
    }

    const prevMonthDate = new Date(year, month - 1, 1);
    const currentMonthDate = new Date(year, month, 1);
    const nextMonthDate = new Date(year, month + 1, 1);

    const monthsData = useMemo(() => [prevMonthDate, currentMonthDate, nextMonthDate].map(d => ({
        year: d.getFullYear(),
        month: d.getMonth(),
        days: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
        name: `Tháng ${d.getMonth() + 1} ${d.getFullYear()}`
    })), [year, month]);

    const totalDays = monthsData.reduce((sum, m) => sum + m.days, 0);

    const flatDays = useMemo(() => {
        const arr: any[] = [];
        monthsData.forEach(m => {
            for (let i = 1; i <= m.days; i++) {
                arr.push({ day: i, month: m.month, year: m.year });
            }
        });
        return arr;
    }, [monthsData]);

    const timelineStart = new Date(year, month - 1, 1);
    const timelineEnd = new Date(year, month + 2, 0, 23, 59, 59);

    const getDayIndex = (date: Date) => {
        let index = 0;
        for (let i = 0; i < monthsData.length; i++) {
            const m = monthsData[i];
            if (date.getFullYear() === m.year && date.getMonth() === m.month) {
                return index + date.getDate() - 1;
            }
            if (date > new Date(m.year, m.month, m.days, 23, 59, 59)) {
                index += m.days;
            }
        }
        return index;
    };

    const getTimelineRange = (start: Date | null, end: Date | null) => {
        if (!start || !end) return null;
        if (end < timelineStart || start > timelineEnd) return null;

        let startIndex = 0;
        if (start >= timelineStart) {
            startIndex = getDayIndex(start);
        }

        let endIndex = totalDays - 1;
        if (end <= timelineEnd) {
            endIndex = getDayIndex(end);
        }

        return { startIndex, duration: Math.max(1, endIndex - startIndex + 1) };
    };

    const getDayOfWeek = (y: number, m: number, d: number) => {
        return DAY_NAMES[new Date(y, m, d).getDay()]
    }

    // Overload isToday and isWeekend for the new 3-month logic
    const isToday3M = (day: number, m: number, y: number) => {
        const now = new Date()
        return day === now.getDate() && m === now.getMonth() && y === now.getFullYear()
    }

    const isWeekend3M = (day: number, m: number, y: number) => {
        const d = new Date(y, m, day)
        return d.getDay() === 0 || d.getDay() === 6
    }




    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
    const resetMonth = () => setCurrentDate(new Date())

    // Calculate Project Dates and filter by selected project
    const filteredProjectsBase = selectedProjectId
        ? projects.filter(p => p.id === selectedProjectId)
        : projects;

    const updatedProjects = useMemo(() => filteredProjectsBase.map((p): Project & { computed_start?: string, computed_end?: string } => {
        const pTasks = tasks.filter(t => t.project_id === p.id)
        if (pTasks.length === 0) return p

        let validTasks = pTasks.filter(t => t.start_date || t.due_date);
        if (validTasks.length === 0) return p;

        const startDates = validTasks.map(t => t.start_date ? new Date(t.start_date).getTime() : new Date(t.due_date!).getTime())
        const endDates = validTasks.map(t => t.due_date ? new Date(t.due_date).getTime() : new Date(t.start_date!).getTime())

        const minDate = new Date(Math.min(...startDates))
        const maxDate = new Date(Math.max(...endDates))

        return {
            ...p,
            computed_start: minDate.toISOString(),
            computed_end: maxDate.toISOString()
        }
    }), [filteredProjectsBase, tasks])

    const ganttItems = useMemo(() => {
        let items: any[] = []

        updatedProjects.forEach(p => {
            const startDate = p.start_date || p.computed_start
            const endDate = p.end_date || p.computed_end || p.start_date

            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            const range = getTimelineRange(start, end);

            const pTasksForPct = tasks.filter(t => t.project_id === p.id);
            let projectPct = 0;
            if (pTasksForPct.length > 0) {
                const totalPct = pTasksForPct.reduce((sum, t) => sum + (t.completion_pct || 0), 0);
                projectPct = Math.round(totalPct / pTasksForPct.length);
            }

            items.push({
                id: p.id,
                name: p.name,
                startIndex: range?.startIndex ?? null,
                duration: range?.duration ?? 0,
                color: 'bg-red-500',
                isProject: true,
                isExpanded: expandedProjects.has(p.id),
                taskCount: tasks.filter(t => t.project_id === p.id && !t.parent_id).length,
                startDate: startDate,
                endDate: endDate,
                type: 'project',
                projectCode: p.project_code,
                projectPct: projectPct
            })

            if (expandedProjects.has(p.id)) {
                let kpiState: any = null;
                try {
                    if (p.other_info) {
                        const info = JSON.parse(p.other_info);
                        if (info.kpiData) kpiState = info.kpiData;
                    }
                } catch(e) {}

                let currentPhaseStartDate = p.start_date ? new Date(p.start_date) : new Date();
                const phasesToRender = [...DEFAULT_PHASES];

                phasesToRender.forEach((phaseDef) => {
                    const phaseKey = phaseDef.key;
                    let phaseTasks = tasks.filter(t => t.project_id === p.id && (kpiState?.taskPhaseMap?.[t.id] || detectPhase(t)) === phaseKey);

                    if (phaseKey === '_unassigned' && phaseTasks.length === 0) return;

                    const phaseState = kpiState?.phases?.[phaseKey] || { days_used: 0, days_estimated: 0 };
                    const expectedDays = phaseKey === '_unassigned' ? 0 : (phaseState.days_estimated || 0);
                    const hasExpectedTimeline = expectedDays > 0;
                    
                    if (!hasExpectedTimeline && phaseTasks.length === 0) return;

                    const phaseEndDate = hasExpectedTimeline ? addWorkingDays(currentPhaseStartDate, expectedDays) : currentPhaseStartDate;
                    const pRange = hasExpectedTimeline ? getTimelineRange(currentPhaseStartDate, phaseEndDate) : null;

                    let phasePct = 0;
                    if (phaseTasks.length > 0) {
                        const totalPct = phaseTasks.reduce((sum, t) => sum + (t.completion_pct || 0), 0);
                        phasePct = Math.round(totalPct / phaseTasks.length);
                    }

                    const fakePhaseId = `phase_${p.id}_${phaseKey}`;
                    
                    items.push({
                        id: fakePhaseId,
                        phaseKey: phaseKey,
                        name: phaseDef.name,
                        startIndex: pRange?.startIndex ?? null,
                        duration: pRange?.duration ?? 0,
                        color: phasePct === 100 ? 'bg-orange-300' : 'bg-orange-500',
                        isProject: false,
                        isPhase: true,
                        isExpanded: expandedPhases.has(fakePhaseId),
                        task: { completion_pct: phasePct, id: fakePhaseId, project_id: p.id },
                        startDate: hasExpectedTimeline ? currentPhaseStartDate.toISOString() : null,
                        endDate: hasExpectedTimeline ? phaseEndDate.toISOString() : null,
                        type: 'phase',
                        projectCode: p.project_code
                    });

                    if (hasExpectedTimeline) {
                        currentPhaseStartDate = getNextWorkingDay(phaseEndDate);
                    }

                    if (expandedPhases.has(fakePhaseId)) {
                        phaseTasks.sort((a, b) => (a.task_code || '').localeCompare(b.task_code || '', undefined, { numeric: true, sensitivity: 'base' }));
                        
                        phaseTasks.forEach(t => {
                            const tStart = t.start_date ? new Date(t.start_date) : null;
                            const tEnd = t.due_date ? new Date(t.due_date) : null;
                            const tRange = getTimelineRange(tStart, tEnd);
                            const tIsCompleted = t.status?.includes('Hoàn thành');

                            items.push({
                                id: t.id,
                                name: t.name || t.task_code,
                                startIndex: tRange?.startIndex ?? null,
                                duration: tRange?.duration ?? 0,
                                color: tIsCompleted ? 'bg-slate-300' : 'bg-blue-500',
                                isProject: false,
                                isPhase: false,
                                task: t,
                                startDate: t.start_date || t.due_date,
                                endDate: t.due_date || t.start_date,
                                type: 'task',
                            });
                        });
                    }
                });
            }
        });

        return items
    }, [updatedProjects, expandedProjects, expandedPhases, tasks, flatDays]);

    

    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev)
            if (next.has(projectId)) next.delete(projectId)
            else next.add(projectId)
            return next
        })
    }

    const togglePhase = (phaseId: string) => {
        setExpandedPhases(prev => {
            const next = new Set(prev)
            if (next.has(phaseId)) next.delete(phaseId)
            else next.add(phaseId)
            return next
        })
    }

    const handleConfirmComplete = async () => {
        if (!taskToComplete) return;
        const { error } = await supabase.from('tasks').update({
            status: 'Hoàn thành',
            completion_pct: 100,
            completion_date: new Date().toISOString().split('T')[0]
        }).eq('id', taskToComplete.id);

        if (!error) {
            setTaskToComplete(null);
            fetchData();
        }
    }

    const getAssigneeName = (id: string | null) => {
        if (!id) return 'Chưa gán'
        const p = profiles.find(x => x.id === id)
        return p?.full_name || 'N/A'
    }

    const handleCellClick = (item: any, field: string, currentValue: string, e: React.MouseEvent) => {
        if (item.type === 'project') return; // Don't allow inline edits for projects
        e.stopPropagation();
        setEditingCell({ id: item.id, field });
        setEditValue(currentValue || '');
    };

    const saveCellEdit = async (item: any) => {
        if (!editingCell) return;
        const { id, field } = editingCell;
        
        let updatePayload: any = {};
        
        if (field === 'assignee_id') {
            updatePayload.assignee_id = editValue;
        } else if (field === 'start_date') {
            updatePayload.start_date = editValue ? new Date(editValue).toISOString() : null;
        } else if (field === 'end_date') {
            updatePayload.due_date = editValue ? new Date(editValue).toISOString() : null;
        } else if (field === 'duration') {
            if (!item.startDate) return; // Cannot calc duration without start
            const daysCount = parseInt(editValue, 10);
            if (isNaN(daysCount) || daysCount < 1) return;
            const newEnd = new Date(item.startDate);
            newEnd.setDate(newEnd.getDate() + (daysCount - 1));
            updatePayload.due_date = newEnd.toISOString();
        }

        if (Object.keys(updatePayload).length > 0) {
            const table = 'tasks';
            setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updatePayload } : t));
            await supabase.from(table).update(updatePayload).eq('id', id);
        }

        setEditingCell(null);
    };

    const handleQuickAdd = async (parentId: string | null, projectId: string, targetPhase: string | null, e: React.MouseEvent) => {
        e.stopPropagation();
        
        const newTask: any = {
            name: 'Nhiệm vụ mới',
            project_id: projectId,
            parent_id: parentId,
            status: 'Chưa bắt đầu',
            priority: 'Bình thường',
            task_code: `T${Date.now()}`
        };

        if (targetPhase) {
            newTask.target = targetPhase;
        }

        const { data, error } = await supabase.from('tasks').insert([newTask]).select();
        
        if (!error && data) {
            setTasks(prev => [...prev, data[0] as Task]);
            // Automatically expand the phase so the user can see it
            setExpandedPhases(prev => new Set(prev).add(parentId));
        }
    };

    const cellWidth = Math.max(20, Math.round(28 * zoom / 100))


    useEffect(() => {
        if (rightPaneRef.current && monthsData[0]) {
            // setTimeout to ensure layout has updated before scrolling
            setTimeout(() => {
                if (rightPaneRef.current) {
                    rightPaneRef.current.scrollLeft = monthsData[0].days * cellWidth;
                }
            }, 100);
        }
    }, [year, month, cellWidth]);

    const handleRightScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!isSyncingRightScroll.current) {
            isSyncingLeftScroll.current = true;
            if (leftPaneRef.current) {
                leftPaneRef.current.scrollTop = e.currentTarget.scrollTop;
            }
        }
        isSyncingRightScroll.current = false;
    };



    if (loading) {
        return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
    }
    return (
        <div className="w-full h-[calc(100vh-140px)] flex flex-col space-y-4 pb-4">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Calendar size={20} className="text-blue-500" /> Sơ đồ Gantt
                </h1>

                <div className="flex items-center gap-2">
                    {/* Zoom Control Group - Dark rounded rectangle like screenshot */}
                    <div className="flex items-center gap-2 bg-slate-800 px-4 py-1.5 rounded-xl shadow-lg">
                        <span className="text-[10px] font-bold text-white mr-2 uppercase tracking-tighter">Zoom: {zoom}%</span>
                        <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="text-slate-400 hover:text-white transition-colors">
                            <ZoomOut size={16} />
                        </button>
                        <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="text-slate-400 hover:text-white transition-colors">
                            <ZoomIn size={16} />
                        </button>
                        <div className="w-px h-4 bg-slate-600 mx-1"></div>
                        <button onClick={resetMonth} className="text-[10px] font-bold text-blue-300 hover:text-blue-100 hover:underline px-2 py-0.5 rounded transition-all uppercase whitespace-nowrap">
                            Đặt lại
                        </button>
                    </div>

                    {/* Project Filter - New Styled Dropdown */}
                    <div className="relative">
                        <Folder size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={selectedProjectId || ''}
                            onChange={(e) => setSelectedProjectId(e.target.value || null)}
                            className="bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-48 appearance-none cursor-pointer hover:bg-slate-50 transition-colors font-medium text-slate-700"
                        >
                            <option value="">Tất cả dự án</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm..."
                            className="bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-40"
                        />
                    </div>
                </div>
            </div>

            {/* Navigation Header */}
            <div className="bg-white/70 backdrop-blur-md border border-white/20 p-4 rounded-[2rem] shadow-xl flex items-center justify-center gap-12 group">
                <button
                    onClick={prevMonth}
                    className="w-12 h-12 bg-white text-gray-700 hover:text-blue-600 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group-hover:shadow-blue-100"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-bold text-gray-900 min-w-[220px] text-center uppercase tracking-tighter bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {MONTHS_VI[month]} {year}
                    </h2>
                    <div className="w-12 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-1 opacity-20"></div>
                </div>
                <button
                    onClick={nextMonth}
                    className="w-12 h-12 bg-white text-gray-700 hover:text-blue-600 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group-hover:shadow-blue-100"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            
            {/* Desktop Gantt Grid Container (Dual-Pane) */}
            <div className="hidden md:flex flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden relative">
                {/* Left Pane - Fixed Width, Vertical Scroll (hidden scrollbar but synced) */}
                <div 
                    className="w-[420px] flex-shrink-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] flex flex-col overflow-y-auto overflow-x-scroll" 
                    style={{ height: '100%', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    ref={leftPaneRef}
                    onScroll={handleLeftScroll}
                >
                    {/* CSS to hide scrollbar for webkit */}
                    <style>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>
                    <div className="no-scrollbar"></div>
                    
                    {/* Left Header */}
                    <div className="flex sticky top-0 z-30 bg-slate-50 border-b border-r border-slate-200 shadow-sm h-[66px] box-border">
                        <div className="w-[200px] px-3 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center bg-slate-50">
                            MÔ TẢ
                        </div>
                        <div className="w-[70px] px-1 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center text-center bg-slate-50">
                            BẮT ĐẦU
                        </div>
                        <div className="w-[70px] px-1 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center text-center bg-slate-50">
                            KẾT THÚC
                        </div>
                        <div className="w-[40px] px-1 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center bg-slate-50">
                            NGÀY
                        </div>
                        <div className="w-[40px] px-1 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 flex items-center justify-center bg-slate-50">
                            TIẾN %
                        </div>
                    </div>

                    {/* Left Chart Rows */}
                    <div className="">
                        {ganttItems.length === 0 ? (
                            <div className="py-24 text-center bg-slate-50/30">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <Calendar size={32} className="text-slate-300" />
                                </div>
                                <p className="text-sm font-bold text-slate-400">Không có dữ liệu hiển thị</p>
                            </div>
                        ) : (
                            ganttItems.map((item) => {
                                const formattedStart = item.startDate ? format(new Date(item.startDate), 'dd/MM/yyyy') : '';
                                const formattedEnd = item.endDate ? format(new Date(item.endDate), 'dd/MM/yyyy') : '';
                                const totalDays = (item.startDate && item.endDate) ? Math.max(1, Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;
                                const progressAmount = item.task?.completion_pct || 0;

                                return (
                                    <div key={item.id} className={`flex border-b border-slate-200 hover:bg-slate-50 transition-colors group/row h-9 ${item.type === 'project' ? 'bg-[#e0e4db] hover:bg-[#d4d9ce]' : item.type === 'phase' ? 'bg-slate-100 hover:bg-slate-200' : 'bg-white'}`}>
                                        {/* Tên Mô Tả */}
                                        <div className="w-[200px] px-3 py-2 border-r border-slate-200 flex-shrink-0 flex flex-col justify-center relative">
                                            {item.type === 'project' ? (
                                                <div
                                                    className="flex items-center gap-2 cursor-pointer w-full select-none"
                                                    onClick={() => toggleProject(item.id)}
                                                >
                                                    {item.isExpanded ? <ChevronDown size={14} className="text-slate-800 shrink-0" /> : <ChevronRight size={14} className="text-slate-800 shrink-0" />}
                                                    <span className="text-xs font-bold text-slate-800 truncate uppercase">{item.name}</span>
                                                </div>
                                            ) : item.type === 'phase' ? (
                                                <div
                                                    className="flex items-center justify-between cursor-pointer w-full select-none pl-4 pr-2"
                                                >
                                                    <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => togglePhase(item.id)}>
                                                        {item.isExpanded ? <ChevronDown size={14} className="text-slate-700 shrink-0" /> : <ChevronRight size={14} className="text-slate-700 shrink-0" />}
                                                        <span className="text-xs font-bold text-slate-800 truncate uppercase">{item.name}</span>
                                                    </div>
                                                    <button 
                                                        onClick={(e) => handleQuickAdd(null, item.task.project_id, item.phaseKey, e)}
                                                        className="opacity-0 group-hover/row:opacity-100 hover:bg-slate-200 p-1 rounded-md transition-all text-slate-500 hover:text-blue-600"
                                                        title="Thêm nhiệm vụ mới vào giai đoạn này"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-3 w-full pl-10 pr-6 relative group/task h-full flex-col justify-center">
                                                    <div className="min-w-0 flex-1 w-full flex flex-col justify-center">
                                                        <div className="text-[11px] text-slate-700 cursor-pointer hover:text-blue-600 transition-colors truncate w-full" title={item.name} onClick={() => { setEditingTask(item.task); setIsEditModalOpen(true); }}>
                                                            {item.name}
                                                        </div>
                                                        {/* Assignee if any */}
                                                        <div 
                                                            className="text-[9px] text-slate-500 mt-0.5 flex items-center gap-1 cursor-pointer hover:bg-slate-100 px-1 -ml-1 rounded transition-colors"
                                                            onDoubleClick={(e) => handleCellClick(item, 'assignee_id', item.task.assignee_id || '', e)}
                                                        >
                                                            <User size={10} /> 
                                                            {editingCell?.id === item.id && editingCell?.field === 'assignee_id' ? (
                                                                <select
                                                                    value={editValue}
                                                                    onChange={(e) => setEditValue(e.target.value)}
                                                                    onBlur={() => saveCellEdit(item)}
                                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveCellEdit(item); if (e.key === 'Escape') setEditingCell(null); }}
                                                                    autoFocus
                                                                    className="text-[9px] py-0 px-1 h-5 bg-white border border-blue-400 rounded outline-none"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <option value="">Chọn người gán</option>
                                                                    {profiles.map(p => (
                                                                        <option key={p.id} value={p.id}>{p.full_name}</option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <span className="truncate max-w-[150px]">{getAssigneeName(item.task.assignee_id)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={(e) => handleQuickAdd(item.task.parent_id, item.task.project_id, item.task.target || null, e)}
                                                            className="hover:bg-blue-100 p-1 rounded-md transition-all text-blue-500 hover:text-blue-600 bg-white shadow-sm"
                                                            title="Chèn nhiệm vụ mới"
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                        <button 
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (confirm('Bạn có chắc chắn muốn xóa tác vụ này?')) {
                                                                    await supabase.from('tasks').delete().eq('id', item.id);
                                                                    setTasks(prev => prev.filter(t => t.id !== item.id));
                                                                }
                                                            }}
                                                            className="hover:bg-red-100 p-1 rounded-md transition-all text-red-500 hover:text-red-600 bg-white shadow-sm"
                                                            title="Xóa nhiệm vụ"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>                                                    
                                            )}
                                        </div>

                                        {/* Bắt Đầu */}
                                        <div 
                                            className={`w-[70px] px-1 py-2 border-r border-slate-200 flex-shrink-0 flex items-center justify-center text-center text-[10px] ${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-100/50 cursor-pointer'}`}
                                            onDoubleClick={(e) => handleCellClick(item, 'start_date', item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '', e)}
                                        >
                                            {editingCell?.id === item.id && editingCell?.field === 'start_date' ? (
                                                <input 
                                                    type="date"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => saveCellEdit(item)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveCellEdit(item); if (e.key === 'Escape') setEditingCell(null); }}
                                                    autoFocus
                                                    className="w-full text-[10px] bg-white border border-blue-400 rounded px-1 outline-none text-center"
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span className={item.type !== 'project' && !formattedStart ? 'text-slate-300 italic' : ''}>
                                                    {formattedStart || '—'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Kết Thúc */}
                                        <div 
                                            className={`w-[70px] px-1 py-2 border-r border-slate-200 flex-shrink-0 flex items-center justify-center text-center text-[10px] ${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-100/50 cursor-pointer'}`}
                                            onDoubleClick={(e) => handleCellClick(item, 'end_date', item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '', e)}
                                        >
                                            {editingCell?.id === item.id && editingCell?.field === 'end_date' ? (
                                                <input 
                                                    type="date"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => saveCellEdit(item)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveCellEdit(item); if (e.key === 'Escape') setEditingCell(null); }}
                                                    autoFocus
                                                    className="w-full text-[10px] bg-white border border-blue-400 rounded px-1 outline-none text-center"
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span className={item.type !== 'project' && !formattedEnd ? 'text-slate-300 italic' : ''}>
                                                    {formattedEnd || '—'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Số Lượng Ngày */}
                                        <div 
                                            className={`w-[40px] px-1 py-2 border-r border-slate-200 flex-shrink-0 flex items-center justify-center text-[10px] ${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-100/50 cursor-pointer'}`}
                                            onDoubleClick={(e) => handleCellClick(item, 'duration', totalDays.toString(), e)}
                                        >
                                            {editingCell?.id === item.id && editingCell?.field === 'duration' ? (
                                                <input 
                                                    type="number"
                                                    min="1"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => saveCellEdit(item)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveCellEdit(item); if (e.key === 'Escape') setEditingCell(null); }}
                                                    autoFocus
                                                    className="w-full text-[10px] bg-white border border-blue-400 rounded px-1 outline-none text-center"
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            ) : (
                                                totalDays > 0 ? totalDays : '-'
                                            )}
                                        </div>

                                        {/* Tiến Độ % */}
                                        <div className={`w-[40px] px-1 py-2 flex-shrink-0 flex items-center justify-center text-[10px] ${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                            {item.type !== 'project' ? `${progressAmount}%` : `${item.projectPct || 0}%`}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Right Pane - Horizontal and Vertical Scroll */}
                <div 
                    className="flex-1 overflow-auto min-w-0" 
                    style={{ height: '100%' }}
                    ref={rightPaneRef}
                    onScroll={handleRightScroll}
                >
                    <div className="min-w-max relative">
                        {/* Right Header */}
                        <div className="flex flex-col sticky top-0 z-30 shadow-sm h-[66px] bg-white border-b border-slate-200 box-border">
                            {/* Month Level Header */}
                            <div className="relative border-b border-slate-200" style={{ height: '25px', width: `${totalDays * cellWidth}px` }}>
                                {monthsData.map((m, idx) => {
                                    const prevDays = monthsData.slice(0, idx).reduce((sum, prev) => sum + prev.days, 0);
                                    return (
                                        <div 
                                            key={`m-${m.year}-${m.month}`}
                                            className="absolute top-0 bottom-0 flex items-center justify-center font-bold text-slate-700 text-xs border-r border-slate-200 bg-slate-100"
                                            style={{ left: `${prevDays * cellWidth}px`, width: `${m.days * cellWidth}px` }}
                                        >
                                            {m.name}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Days Level Header */}
                            <div className="relative border-b border-slate-200 flex-1" style={{ width: `${totalDays * cellWidth}px` }}>
                                {flatDays.map((d, idx) => (
                                    <div
                                        key={`h-${idx}`}
                                        style={{ left: `${idx * cellWidth}px`, width: `${cellWidth}px` }}
                                        className={`absolute top-0 bottom-0 text-center flex flex-col items-center justify-center border-r border-slate-100 transition-colors ${isToday3M(d.day, d.month, d.year) ? 'bg-orange-500' :
                                            isWeekend3M(d.day, d.month, d.year) ? 'bg-slate-100/50' : 'bg-blue-50/50'
                                            }`}
                                    >
                                        <div className={`text-[11px] font-bold ${isToday3M(d.day, d.month, d.year) ? 'text-white' : 'text-slate-700'}`}>{d.day}</div>
                                        <div className={`text-[8px] font-bold uppercase tracking-tighter ${isToday3M(d.day, d.month, d.year) ? 'text-white/80' :
                                            isWeekend3M(d.day, d.month, d.year) ? 'text-red-400' : 'text-blue-400'
                                            }`}>
                                            {getDayOfWeek(d.year, d.month, d.day)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Chart Rows */}
                        <div className="pb-24">
                            {ganttItems.length === 0 ? (
                                <div className="h-[200px]"></div> // Empty placeholder to align with left pane's 24 padding
                            ) : (
                                ganttItems.map((item) => {
                                    const progressAmount = item.task?.completion_pct || 0;

                                    return (
                                        <div key={item.id} className={`flex border-b border-slate-200 hover:bg-slate-50 transition-colors h-9 group/row ${item.type === 'project' ? 'bg-[#e0e4db] hover:bg-[#d4d9ce]' : item.type === 'phase' ? 'bg-slate-100 hover:bg-slate-200' : 'bg-white'}`}>
                                            
                                            {/* Timeline Grid (Right Side) */}
                                            <div className="flex-1 flex relative w-full h-full">
                                                {/* Background Grid Cells */}
                                                {flatDays.map((d, idx) => (
                                                    <div 
                                                        key={`bg-${idx}`}
                                                        style={{ 
                                                            left: `${idx * cellWidth}px`,
                                                            width: `${cellWidth}px` 
                                                        }}
                                                        className={`absolute top-0 bottom-0 border-r border-slate-200 ${isToday3M(d.day, d.month, d.year) ? 'bg-orange-500/10' : isWeekend3M(d.day, d.month, d.year) ? 'bg-slate-100/50' : ''}`}
                                                    ></div>
                                                ))}

                                                {/* Colored Timeline Bar */}
                                                {item.startIndex !== null && item.duration > 0 && (
                                                    <div
                                                        style={{
                                                            left: `${item.startIndex * cellWidth}px`,
                                                            width: `${item.duration * cellWidth}px`
                                                        }}
                                                        className={`absolute top-1 bottom-1 rounded-sm shadow-sm opacity-90 flex items-center transition-colors group/cell ${
                                                            item.type === 'project' ? 'bg-[#4a80bc]' : 
                                                            item.type === 'phase' ? 'bg-[#4a80bc]' : 
                                                            item.color // Usually bg-blue-500 or bg-slate-300
                                                        } ${item.type !== 'project' ? 'hover:brightness-95 cursor-grab active:cursor-grabbing' : ''}`}
                                                        onMouseDown={(e) => {
                                                            if (item.type !== 'project') {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                                
                                                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                                const clickX = e.clientX - rect.left;
                                                                let action: 'move' | 'resize-left' | 'resize-right' = 'move';
                                                                
                                                                if (clickX < 10) action = 'resize-left';
                                                                else if (clickX > rect.width - 10) action = 'resize-right';
                                                                
                                                                setDraggingItem({ id: item.id, type: item.type, startX: e.clientX, deltaDays: 0, action });
                                                            }
                                                        }}
                                                        onDoubleClick={() => {
                                                            if (item.type === 'task') {
                                                                setEditingTask(item.task);
                                                                setIsEditModalOpen(true);
                                                            }
                                                        }}
                                                    >
                                                        {item.type !== 'project' && progressAmount > 0 && (
                                                            <span className="text-[8px] font-bold text-white/90 whitespace-nowrap z-10 select-none px-1 block truncate w-full text-center drop-shadow-md">
                                                                {progressAmount}%
                                                            </span>
                                                        )}
                                                        
                                                        {/* Resize handles */}
                                                        {item.type !== 'project' && (
                                                            <>
                                                                <div className="absolute left-0 top-0 bottom-0 w-1.5 hover:cursor-col-resize z-20"></div>
                                                                <div className="absolute right-0 top-0 bottom-0 w-1.5 hover:cursor-col-resize z-20"></div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile List Timeline View */}
            <div className="md:hidden space-y-4 px-1">
                {ganttItems.filter(item => item.type === 'project').length === 0 ? (
                    <div className="py-24 text-center bg-slate-50/30 rounded-3xl border border-slate-200">
                        <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Calendar size={32} className="text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">Không có dữ liệu hiển thị</p>
                    </div>
                ) : (
                    ganttItems.filter(item => item.type === 'project').map(item => {
                        const projectPhases = ganttItems.filter(p => p.type === 'phase' && p.projectCode === item.projectCode);
                        const formattedStart = item.startDate ? format(new Date(item.startDate), 'dd/MM/yyyy') : '';
                        const formattedEnd = item.endDate ? format(new Date(item.endDate), 'dd/MM/yyyy') : '';
                        const totalDays = (item.startDate && item.endDate) ? Math.max(1, Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;
                        
                        return (
                            <div key={item.id} className="bg-white rounded-[24px] shadow-sm border border-[#e0e4db] p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 min-w-0 pr-3">
                                        <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight uppercase truncate">{item.name}</h3>
                                        <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">Mã DA: {item.projectCode}</div>
                                    </div>
                                    <div className="bg-[#4a80bc]/10 text-[#4a80bc] px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 shadow-sm">
                                        {totalDays} ngày
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-500 mb-4">
                                    <div className="flex flex-col">
                                        <span className="text-slate-400 text-[8px] mb-0.5">BẮT ĐẦU</span>
                                        <span className="text-slate-700">{formattedStart || '—'}</span>
                                    </div>
                                    <ArrowRight size={14} className="text-slate-300" />    
                                    <div className="flex flex-col items-end">
                                        <span className="text-slate-400 text-[8px] mb-0.5">KẾT THÚC</span>
                                        <span className="text-slate-700">{formattedEnd || '—'}</span>
                                    </div>
                                </div>
                                
                                {/* Phased/Tasks summary */}
                                {projectPhases.length > 0 && (
                                    <div className="space-y-2 mt-2 pt-4 border-t border-slate-100">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Các giai đoạn</h4>
                                        {projectPhases.map(phase => {
                                            const phaseStart = phase.startDate ? format(new Date(phase.startDate), 'dd/MM') : '';
                                            const phaseEnd = phase.endDate ? format(new Date(phase.endDate), 'dd/MM') : '';
                                            const isDone = phase.task?.status?.includes('Hoàn thành');
                                            return (
                                                <div key={phase.id} className={`rounded-xl p-3 border transition-colors ${isDone ? 'bg-slate-50 border-slate-100' : 'bg-white border-blue-100 shadow-sm ring-1 ring-blue-50'}`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className={`text-xs font-bold line-clamp-2 pr-2 ${isDone ? 'text-slate-500' : 'text-slate-700'}`}>{phase.name}</h4>
                                                        <span className={`shrink-0 text-[9px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded flex items-center gap-1 ${isDone ? 'text-slate-400 bg-white border border-slate-200' : 'text-slate-600 bg-slate-50 border border-slate-200'}`}>
                                                            {isDone && <CheckCircle2 size={10} className="text-emerald-500" />}
                                                            {phaseStart} - {phaseEnd}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* Completion Confirmation Modal */}
            {
                taskToComplete && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-8 pb-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                                    <CheckCircle2 size={32} className="text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Hoàn thành nhiệm vụ?</h3>
                                <p className="text-sm text-slate-500 mb-6">
                                    Bạn có chắc chắn muốn đánh dấu "{taskToComplete.name}" là đã hoàn thành không?
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setTaskToComplete(null)}
                                        className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        onClick={handleConfirmComplete}
                                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-md shadow-emerald-200 transition-all"
                                    >
                                        Xác nhận
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Task Modal */}
            <QuickTaskModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditingTask(null); }}
                onSaved={() => {
                    setIsEditModalOpen(false);
                    setEditingTask(null);
                    fetchData();
                }}
                editingTask={editingTask}
                profiles={profiles}
                currentUserProfile={currentUserProfile}
                projects={projects}
            />
        </div >
    )
}

export default Gantt;
