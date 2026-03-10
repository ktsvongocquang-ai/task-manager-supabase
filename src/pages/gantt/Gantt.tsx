import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../services/supabase'
import { type Task, type Project } from '../../types'
import { ChevronLeft, ChevronRight, Search, ZoomIn, ZoomOut, Calendar, ChevronDown, Folder, CheckCircle2, User } from 'lucide-react'
import { format } from 'date-fns'
import { AddEditTaskModal } from '../tasks/AddEditTaskModal'

const MONTHS_VI = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export const Gantt = () => {
    const [tasks, setTasks] = useState<Task[]>([])
    const [allTasks, setAllTasks] = useState<Task[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [search, setSearch] = useState('')
    const [zoom, setZoom] = useState(100)
    const [profiles, setProfiles] = useState<any[]>([])
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [draggingItem, setDraggingItem] = useState<{ id: string, type: 'task' | 'project', startX: number, deltaDays: number, action: 'move' | 'resize-left' | 'resize-right' } | null>(null)

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

            if (currentProfile?.role === 'Nhân viên') {
                fetchedTasks = fetchedTasks.filter(task =>
                    task.assignee_id === currentProfile?.id ||
                    task.supporter_id === currentProfile?.id
                );

                fetchedProjects = fetchedProjects.filter(proj =>
                    fetchedTasks.some(task => task.project_id === proj.id)
                );
            }

            setTasks(fetchedTasks);
            setAllTasks((t || []) as Task[]);
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

    const getSubtasksCount = (taskId: string, notes: string | undefined | null) => {
        const childTasks = allTasks.filter(t => t.parent_id === taskId);
        if (childTasks.length > 0) {
            return {
                completed: childTasks.filter(t => t.status?.includes('Hoàn thành')).length,
                total: childTasks.length
            };
        }

        if (!notes) return null;
        try {
            const parsed = JSON.parse(notes);
            if (Array.isArray(parsed) && parsed.length > 0) {
                const completed = parsed.filter(st => st.completed).length;
                return { completed, total: parsed.length };
            }
        } catch (e) {
            return null;
        }
        return null;
    }

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
    const resetMonth = () => setCurrentDate(new Date())

    // Calculate Project Dates and filter by selected project
    const filteredProjectsBase = selectedProjectId
        ? projects.filter(p => p.id === selectedProjectId)
        : projects;

    const updatedProjects = filteredProjectsBase.map((p): Project & { computed_start?: string, computed_end?: string } => {
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
    })

    const ganttItems = useMemo(() => {
        let items: any[] = []

        updatedProjects.forEach(p => {
            if (!p.computed_start && !p.start_date) return

            const startDate = p.computed_start || p.start_date
            const endDate = p.computed_end || p.end_date || p.start_date

            const start = new Date(startDate!)
            const end = new Date(endDate!)

            if (start.getFullYear() === year && start.getMonth() === month ||
                end.getFullYear() === year && end.getMonth() === month ||
                (start < new Date(year, month, 1) && end > new Date(year, month + 1, 0))) {

                const startDay = start.getMonth() === month ? start.getDate() : 1
                const endDay = end.getMonth() === month ? end.getDate() : daysInMonth
                const duration = Math.max(1, endDay - startDay + 1)

                items.push({
                    id: p.id,
                    name: p.name,
                    startDay,
                    duration,
                    color: 'bg-red-500',
                    isProject: true,
                    isExpanded: expandedProjects.has(p.id),
                    taskCount: tasks.filter(t => t.project_id === p.id && !t.parent_id).length,
                    startDate: startDate,
                    endDate: endDate,
                    type: 'project',
                    projectCode: p.project_code
                })
            }

            if (expandedProjects.has(p.id)) {
                const projectTasks = tasks.filter(t => t.project_id === p.id && !t.parent_id).sort((a, b) => (a.task_code || '').localeCompare(b.task_code || '', undefined, { numeric: true, sensitivity: 'base' }))
                projectTasks.forEach(t => {
                    const tStart = t.start_date ? new Date(t.start_date) : null
                    const tEnd = t.due_date ? new Date(t.due_date) : null

                    let renderStartDay = null
                    let renderEndDay = null

                    if (tStart && tStart.getFullYear() === year && tStart.getMonth() === month) {
                        renderStartDay = tStart.getDate()
                    } else if (tStart && tStart < new Date(year, month, 1)) {
                        renderStartDay = 1
                    }

                    if (tEnd && tEnd.getFullYear() === year && tEnd.getMonth() === month) {
                        renderEndDay = tEnd.getDate()
                    } else if (tEnd && tEnd > new Date(year, month + 1, 0)) {
                        renderEndDay = daysInMonth
                    }

                    if (renderStartDay === null && renderEndDay === null) {
                        return;
                    }

                    if (renderStartDay !== null && renderEndDay === null) {
                        renderEndDay = renderStartDay;
                    }
                    if (renderEndDay !== null && renderStartDay === null) {
                        renderStartDay = renderEndDay;
                    }

                    const duration = Math.max(1, renderEndDay! - renderStartDay! + 1)
                    const isCompleted = t.status?.includes('Hoàn thành')

                    items.push({
                        id: t.id,
                        name: t.name,
                        startDay: renderStartDay,
                        duration,
                        color: isCompleted ? 'bg-slate-400 opacity-60' : 'bg-emerald-500',
                        isProject: false,
                        task: t,
                        startDate: t.start_date || t.due_date,
                        endDate: t.due_date || t.start_date,
                        type: 'task',
                        projectCode: p.project_code
                    })
                })
            }
        })

        return items
    }, [updatedProjects, tasks, year, month, search, expandedProjects])

    useEffect(() => {
        if (!draggingItem) return;

        const handleMouseMove = (e: MouseEvent) => {
            const cellWidthNow = Math.max(24, Math.round(36 * zoom / 100));
            const deltaX = e.clientX - draggingItem.startX;
            const deltaDays = Math.round(deltaX / cellWidthNow);
            setDraggingItem(prev => prev ? { ...prev, deltaDays } : null);
        };

        const handleMouseUp = async () => {
            if (draggingItem && draggingItem.deltaDays !== 0) {
                const item = ganttItems.find(i => i.id === draggingItem.id && i.type === draggingItem.type);
                if (item) {
                    const updatePayload: any = {};

                    if (draggingItem.action === 'move') {
                        const newStart = new Date(item.startDate);
                        newStart.setDate(newStart.getDate() + draggingItem.deltaDays);
                        updatePayload.start_date = newStart.toISOString();

                        const newEnd = item.endDate ? new Date(item.endDate) : null;
                        if (newEnd) {
                            newEnd.setDate(newEnd.getDate() + draggingItem.deltaDays);
                            if (item.type === 'project') updatePayload.end_date = newEnd.toISOString();
                            else updatePayload.due_date = newEnd.toISOString();
                        }
                    } else if (draggingItem.action === 'resize-left') {
                        const newStart = new Date(item.startDate);
                        newStart.setDate(newStart.getDate() + draggingItem.deltaDays);

                        // Prevent left edge passing right edge
                        const currentEnd = item.endDate ? new Date(item.endDate) : new Date(item.startDate);
                        if (newStart <= currentEnd) {
                            updatePayload.start_date = newStart.toISOString();
                        }
                    } else if (draggingItem.action === 'resize-right') {
                        const newEnd = item.endDate ? new Date(item.endDate) : new Date(item.startDate);
                        newEnd.setDate(newEnd.getDate() + draggingItem.deltaDays);

                        // Prevent right edge passing left edge
                        const currentStart = new Date(item.startDate);
                        if (newEnd >= currentStart) {
                            if (item.type === 'project') updatePayload.end_date = newEnd.toISOString();
                            else updatePayload.due_date = newEnd.toISOString();
                        }
                    }

                    if (Object.keys(updatePayload).length > 0) {
                        const table = item.type === 'project' ? 'projects' : 'tasks';

                        if (item.type === 'task') {
                            setTasks(prev => prev.map(t => t.id === item.id ? { ...t, ...updatePayload } : t));
                        } else {
                            setProjects(prev => prev.map(p => p.id === item.id ? { ...p, ...updatePayload } : p));
                        }

                        await supabase.from(table).update(updatePayload).eq('id', item.id);
                    }
                }
            }
            setDraggingItem(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingItem, zoom, ganttItems]);

    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev)
            if (next.has(projectId)) next.delete(projectId)
            else next.add(projectId)
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

    const cellWidth = Math.max(24, Math.round(36 * zoom / 100))

    if (loading) {
        return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
    }

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Calendar size={20} className="text-blue-500" /> Sơ đồ Gantt
                </h1>

                <div className="flex items-center gap-2">
                    {/* Zoom Control Group - Dark rounded rectangle like screenshot */}
                    <div className="flex items-center gap-2 bg-slate-800 px-4 py-1.5 rounded-xl shadow-lg">
                        <span className="text-[10px] font-black text-white mr-2 uppercase tracking-tighter">Zoom: {zoom}%</span>
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
                    <h2 className="text-2xl font-black text-gray-900 min-w-[220px] text-center uppercase tracking-tighter bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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

            {/* Gantt Grid Container */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <div className="min-w-max">
                        {/* Day Headers - Themed background like screenshot */}
                        <div className="flex border-b border-slate-200">
                            <div className="w-64 min-w-[20rem] px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-50 border-r border-slate-200 sticky left-0 z-10">
                                Tên
                            </div>
                            {days.map(day => (
                                <div
                                    key={day}
                                    style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px` }}
                                    className={`text-center flex flex-col items-center justify-center py-2 border-r border-slate-100 transition-colors ${isToday(day) ? 'bg-orange-500' :
                                        isWeekend(day) ? 'bg-slate-100/50' : 'bg-blue-50/50'
                                        }`}
                                >
                                    <div className={`text-[11px] font-black ${isToday(day) ? 'text-white' : 'text-slate-700'}`}>{day}</div>
                                    <div className={`text-[8px] font-bold uppercase tracking-tighter ${isToday(day) ? 'text-white/80' :
                                        isWeekend(day) ? 'text-red-400' : 'text-blue-400'
                                        }`}>
                                        {getDayName(day)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Chart Rows */}
                        <div className="max-h-[600px] overflow-y-auto">
                            {ganttItems.length === 0 ? (
                                <div className="py-24 text-center bg-slate-50/30">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <Calendar size={32} className="text-slate-300" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400">Không có dữ liệu hiển thị</p>
                                </div>
                            ) : (
                                ganttItems.map((item) => {
                                    const barWidth = Math.max((item.endDay - item.startDay + 1) * cellWidth - 8, cellWidth - 8);
                                    const showText = barWidth > 150;
                                    const formattedStart = item.startDate ? format(new Date(item.startDate), 'dd/MM') : '';
                                    const formattedEnd = item.endDate ? format(new Date(item.endDate), 'dd/MM') : '';
                                    const dateRangeStr = formattedStart && formattedEnd ? `${formattedStart} - ${formattedEnd} (${item.duration} ngày)` : '';

                                    return (
                                        <div key={item.id} className="flex border-b border-slate-50 hover:bg-slate-50/80 transition-colors group/row">
                                            {/* Left Column Data */}
                                            <div className="w-64 min-w-[20rem] px-5 py-3 border-r border-slate-100 sticky left-0 bg-white z-20 group-hover/row:bg-slate-50 transition-colors flex items-center shrink-0">
                                                {item.type === 'project' ? (
                                                    <div
                                                        className="flex items-center gap-2 cursor-pointer w-full select-none"
                                                        onClick={() => toggleProject(item.id)}
                                                    >
                                                        {item.isExpanded ? <ChevronDown size={14} className="text-slate-400 shrink-0" /> : <ChevronRight size={14} className="text-slate-400 shrink-0" />}
                                                        <Folder size={14} className="text-blue-500 fill-blue-500 shrink-0" />
                                                        <span className="text-xs font-bold text-slate-700 truncate" title={item.name}>{item.name}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start gap-3 w-full pl-6">
                                                        <div className="pt-0.5 shrink-0 relative flex items-center justify-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={item.task.status?.includes('Hoàn thành')}
                                                                onChange={() => {
                                                                    if (!item.task.status?.includes('Hoàn thành')) {
                                                                        setTaskToComplete(item.task)
                                                                    }
                                                                }}
                                                                className="w-4 h-4 rounded text-blue-500 border-slate-300 focus:ring-blue-500 z-10 opacity-0 absolute cursor-pointer"
                                                            />
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${item.task.status?.includes('Hoàn thành') ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300'}`}>
                                                                {item.task.status?.includes('Hoàn thành') && <CheckCircle2 size={12} />}
                                                            </div>
                                                        </div>
                                                        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => { setEditingTask(item.task); setIsEditModalOpen(true); }}>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="text-[11px] font-semibold text-slate-700 truncate hover:text-blue-600 transition-colors" title={item.name}>
                                                                    {item.name}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[9px] text-slate-500 flex-wrap">
                                                                <span className="flex items-center gap-1">
                                                                    <User size={10} /> {getAssigneeName(item.task.assignee_id)}
                                                                </span>
                                                                <span>&bull;</span>
                                                                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                                                                    <Calendar size={10} /> {item.duration} ngày
                                                                </span>
                                                                <span>&bull;</span>
                                                                <span className="flex items-center gap-1">
                                                                    {item.task.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {(() => {
                                                            const stats = getSubtasksCount(item.task.id, item.task.notes);
                                                            if (!stats) return null;
                                                            return (
                                                                <span className="ml-auto text-blue-600 font-bold text-[11px] bg-blue-50 px-2.5 py-1 rounded-md shadow-sm border border-blue-200/60 inline-flex items-center gap-1.5 whitespace-nowrap">
                                                                    <span className={stats.completed === stats.total ? "text-emerald-600" : ""}>{stats.completed}</span>
                                                                    <span className="text-blue-300">/</span>
                                                                    <span>{stats.total}</span>
                                                                </span>
                                                            )
                                                        })()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Timeline Grid */}
                                            <div className="flex-1 flex relative items-center" style={{ minHeight: item.type === 'project' ? '44px' : '56px' }}>
                                                {/* Vertical Grid Lines - Full height */}
                                                {days.map(day => (
                                                    <div
                                                        key={day}
                                                        style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px`, left: `${(day - 1) * cellWidth}px` }}
                                                        className={`border-r border-slate-200/50 absolute h-full top-0 bottom-0 z-0 pointer-events-none ${isToday(day) ? 'bg-orange-50/20' : ''}`}
                                                    ></div>
                                                ))}

                                                {/* Bar component with tooltip */}
                                                {(() => {
                                                    // Calculate visual position and width based on drag state
                                                    let visualStartDay = item.startDay;
                                                    let visualDuration = item.duration;

                                                    if (draggingItem && draggingItem.id === item.id) {
                                                        if (draggingItem.action === 'move') {
                                                            visualStartDay += draggingItem.deltaDays;
                                                        } else if (draggingItem.action === 'resize-left') {
                                                            const maxDelta = item.duration - 1; // Prevent shrinking below 1 day
                                                            const delta = Math.min(draggingItem.deltaDays, maxDelta);
                                                            visualStartDay += delta;
                                                            visualDuration -= delta;
                                                        } else if (draggingItem.action === 'resize-right') {
                                                            const minDelta = -(item.duration - 1); // Prevent shrinking below 1 day
                                                            const delta = Math.max(draggingItem.deltaDays, minDelta);
                                                            visualDuration += delta;
                                                        }
                                                    }

                                                    // Calculate precise grid alignment
                                                    // Bar starts exactly at the left edge of its startDay cell
                                                    const visualLeft = (visualStartDay - 1) * cellWidth;
                                                    // Bar width exactly matches the number of duration days * cellWidth
                                                    // (Subtract a tiny fraction so it doesn't overlap the right border, improving visual separation)
                                                    const visualWidth = Math.max(cellWidth * 0.5, (visualDuration * cellWidth) - 4);

                                                    return (
                                                        <div
                                                            className={`absolute h-[22px] rounded-sm shadow-sm z-10 ${item.color} ${item.type === 'project' ? 'opacity-80 border-t border-b border-red-500 rounded-none' : 'opacity-90 border-t border-b border-emerald-500 rounded-none'} group/bar flex items-center justify-between overflow-hidden hover:opacity-100 hover:shadow-md ${draggingItem?.id === item.id && draggingItem?.action === 'move' ? 'opacity-100 z-50 cursor-grabbing shadow-lg' : 'hover:cursor-grab'}`}
                                                            style={{
                                                                left: `${visualLeft}px`,
                                                                width: `${visualWidth}px`,
                                                                transition: draggingItem?.id === item.id ? 'none' : 'left 0.3s, width 0.3s, opacity 0.3s',
                                                                marginLeft: '2px' // slight indent from the left grid line
                                                            }}
                                                            onMouseDown={(e) => {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                                setDraggingItem({ id: item.id, type: item.type, startX: e.clientX, deltaDays: 0, action: 'move' });
                                                            }}
                                                            onDoubleClick={() => {
                                                                if (item.type === 'task') {
                                                                    setEditingTask(item.task);
                                                                    setIsEditModalOpen(true);
                                                                }
                                                            }}
                                                        >
                                                            {/* Left Resize Handle */}
                                                            <div
                                                                className="h-full w-2 cursor-col-resize hover:bg-black/20 z-20 shrink-0"
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    setDraggingItem({ id: item.id, type: item.type, startX: e.clientX, deltaDays: 0, action: 'resize-left' });
                                                                }}
                                                            ></div>

                                                            {/* Stripe effect for project bars */}
                                                            {item.type === 'project' && (
                                                                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,1)_25%,rgba(255,255,255,1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,1)_75%,rgba(255,255,255,1)_100%)] bg-[length:10px_10px] pointer-events-none"></div>
                                                            )}

                                                            {/* Bar Text - Centered */}
                                                            <div className="overflow-hidden whitespace-nowrap text-[9px] font-bold text-white px-1 leading-none drop-shadow flex-1 text-center pointer-events-none z-10">
                                                                {item.startDate && item.endDate ? `${format(new Date(item.startDate), 'dd/MM')} - ${format(new Date(item.endDate), 'dd/MM')}: ` : ''}
                                                                {item.name}
                                                            </div>

                                                            {/* Right Resize Handle */}
                                                            <div
                                                                className="h-full w-2 cursor-col-resize hover:bg-black/20 z-20 shrink-0"
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    setDraggingItem({ id: item.id, type: item.type, startX: e.clientX, deltaDays: 0, action: 'resize-right' });
                                                                }}
                                                            ></div>
                                                        </div>
                                                    )
                                                })()}
                                                {showText && (
                                                    <span className="text-[10px] font-bold text-white whitespace-nowrap px-3 drop-shadow-sm z-10">
                                                        {dateRangeStr}: {item.name}
                                                    </span>
                                                )}

                                                {/* Hover Tooltip */}
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[130%] bg-gray-900 border border-gray-700 shadow-xl rounded-xl p-3 text-white text-xs z-[100] w-max max-w-xs opacity-0 invisible group-hover/bar:opacity-100 group-hover/bar:visible transition-all duration-200 pointer-events-none">
                                                    <div className="font-bold mb-1 line-clamp-2">{item.name}</div>
                                                    {item.task?.description && <div className="text-gray-400 mb-2 line-clamp-3">{item.task.description}</div>}
                                                    <div className="text-emerald-400 font-mono text-[10px] bg-gray-800 px-2 py-1 rounded inline-block">{dateRangeStr}</div>
                                                    {/* Triangle pointer */}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
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
            <AddEditTaskModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditingTask(null); }}
                onSaved={() => {
                    setIsEditModalOpen(false);
                    setEditingTask(null);
                    fetchData();
                }}
                editingTask={editingTask}
                initialData={{ task_code: '', project_id: '' }}
                profiles={profiles}
                currentUserProfile={currentUserProfile}
                projects={projects}
            />
        </div >
    )
}

export default Gantt;
