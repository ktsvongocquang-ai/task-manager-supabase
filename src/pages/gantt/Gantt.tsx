import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../services/supabase'
import { type Task, type Project } from '../../types'
import { ChevronLeft, ChevronRight, Search, ZoomIn, ZoomOut, Calendar, ChevronDown, Folder, CheckCircle2, User } from 'lucide-react'
import { format } from 'date-fns'

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
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [{ data: t }, { data: p }, { data: pr }] = await Promise.all([
                supabase.from('tasks').select('*'),
                supabase.from('projects').select('*'),
                supabase.from('profiles').select('id, full_name')
            ])
            setTasks((t || []) as Task[])
            setProjects((p || []) as Project[])
            setProfiles((pr || []) as any[])
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

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
    const resetMonth = () => setCurrentDate(new Date())

    const ganttItems = useMemo(() => {
        const items: any[] = []

        projects.forEach((p) => {
            if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.project_code.toLowerCase().includes(search.toLowerCase())) return

            const start = p.start_date ? new Date(p.start_date) : null
            const end = p.end_date ? new Date(p.end_date) : null

            if (!start && !end) return

            const monthStart = new Date(year, month, 1)
            const monthEnd = new Date(year, month + 1, 0)

            const effectiveStart = start && start >= monthStart ? start : monthStart
            const effectiveEnd = end && end <= monthEnd ? end : monthEnd

            if (effectiveStart > monthEnd || (end && end < monthStart)) return

            const projTasks = tasks.filter(t => t.project_id === p.id)

            items.push({
                id: p.id,
                name: p.name,
                taskCount: projTasks.length,
                startDate: p.start_date,
                endDate: p.end_date,
                startDay: effectiveStart.getDate(),
                endDay: effectiveEnd.getDate(),
                color: 'bg-red-500', // Projects use red in the screenshot
                type: 'project',
                projectCode: p.project_code,
                isExpanded: expandedProjects.has(p.id)
            })

            if (expandedProjects.has(p.id)) {
                projTasks.forEach(t => {
                    const tStart = t.start_date ? new Date(t.start_date) : null
                    const tEnd = t.due_date ? new Date(t.due_date) : null
                    if (!tStart && !tEnd) return

                    const tEffStart = tStart && tStart >= monthStart ? tStart : monthStart
                    const tEffEnd = tEnd && tEnd <= monthEnd ? tEnd : monthEnd

                    if (tEffStart > monthEnd || (tEnd && tEnd < monthStart)) return

                    items.push({
                        id: t.id,
                        name: t.name,
                        task: t, // Keep full task object for details
                        startDate: t.start_date,
                        endDate: t.due_date,
                        startDay: tEffStart.getDate(),
                        endDay: tEffEnd.getDate(),
                        color: t.status?.includes('Hoàn thành') ? 'bg-emerald-500' : 'bg-emerald-500', // Tasks use green in screenshot
                        type: 'task',
                        projectCode: p.project_code
                    })
                })
            }
        })

        return items
    }, [projects, tasks, year, month, search, expandedProjects])

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
                            <div className="w-64 min-w-[16rem] px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-50 border-r border-slate-200 sticky left-0 z-10">
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
                                    const dateRangeStr = formattedStart && formattedEnd ? `${formattedStart} - ${formattedEnd}` : '';

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
                                                        {item.taskCount > 0 && (
                                                            <span className="ml-auto bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm ring-1 ring-blue-100">
                                                                {item.taskCount}
                                                            </span>
                                                        )}
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
                                                        <div className="min-w-0">
                                                            <div className="text-[11px] font-semibold text-slate-700 truncate mb-1" title={item.name}>
                                                                {item.name}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[9px] text-slate-500 flex-wrap">
                                                                <span className="flex items-center gap-1">
                                                                    <User size={10} /> {getAssigneeName(item.task.assignee_id)}
                                                                </span>
                                                                <span>&bull;</span>
                                                                <span className="flex items-center gap-1">
                                                                    {item.task.status}
                                                                </span>
                                                                {item.task.priority && (
                                                                    <>
                                                                        <span>&bull;</span>
                                                                        <span className="flex items-center gap-1">
                                                                            {item.task.priority}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Timeline Grid */}
                                            <div className="flex-1 flex relative items-center" style={{ minHeight: item.type === 'project' ? '44px' : '56px' }}>
                                                {days.map(day => (
                                                    <div
                                                        key={day}
                                                        style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px`, left: `${(day - 1) * cellWidth}px` }}
                                                        className={`border-r border-slate-50/50 absolute h-full ${isToday(day) ? 'bg-orange-50/30' : ''}`}
                                                    ></div>
                                                ))}

                                                {/* Bar component with tooltip */}
                                                <div
                                                    className={`absolute h-[22px] rounded-lg shadow-sm z-10 transition-all ${item.color} ${item.type === 'project' ? 'opacity-80 border border-red-400' : 'opacity-90 border border-emerald-400'} group/bar flex items-center overflow-hidden hover:opacity-100 hover:shadow-md cursor-pointer`}
                                                    style={{
                                                        left: `${(item.startDay - 1) * cellWidth + 4}px`,
                                                        width: `${barWidth}px`
                                                    }}
                                                >
                                                    {/* Stripe effect for project bars */}
                                                    {item.type === 'project' && (
                                                        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,1)_25%,rgba(255,255,255,1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,1)_75%,rgba(255,255,255,1)_100%)] bg-[length:10px_10px]"></div>
                                                    )}

                                                    {/* Bar Text */}
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
                                                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 border-b border-r border-gray-700 rotate-45"></div>
                                                    </div>
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
            {taskToComplete && (
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
            )}
        </div>
    )
}
