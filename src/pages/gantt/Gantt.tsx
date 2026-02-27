import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../services/supabase'
import { type Task, type Project } from '../../types'
import { ChevronLeft, ChevronRight, Search, ZoomIn, ZoomOut, Calendar } from 'lucide-react'

const MONTHS_VI = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

const PROJECT_COLORS = [
    'bg-indigo-400', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-400',
    'bg-cyan-400', 'bg-purple-400', 'bg-orange-400', 'bg-teal-400'
]

export const Gantt = () => {
    const [tasks, setTasks] = useState<Task[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [search, setSearch] = useState('')
    const [zoom, setZoom] = useState(100)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [{ data: t }, { data: p }] = await Promise.all([
                supabase.from('tasks').select('*'),
                supabase.from('projects').select('*')
            ])
            setTasks((t || []) as Task[])
            setProjects((p || []) as Project[])
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
        const items: { id: string; name: string; startDay: number; endDay: number; color: string; type: 'project' | 'task'; projectCode?: string }[] = []

        projects.forEach((p, idx) => {
            if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.project_code.toLowerCase().includes(search.toLowerCase())) return

            const start = p.start_date ? new Date(p.start_date) : null
            const end = p.end_date ? new Date(p.end_date) : null

            if (!start && !end) return

            const monthStart = new Date(year, month, 1)
            const monthEnd = new Date(year, month + 1, 0)

            const effectiveStart = start && start >= monthStart ? start : monthStart
            const effectiveEnd = end && end <= monthEnd ? end : monthEnd

            if (effectiveStart > monthEnd || (end && end < monthStart)) return

            items.push({
                id: p.id,
                name: `${p.project_code}: ${p.name}`,
                startDay: effectiveStart.getDate(),
                endDay: effectiveEnd.getDate(),
                color: PROJECT_COLORS[idx % PROJECT_COLORS.length],
                type: 'project',
                projectCode: p.project_code
            })

            const projTasks = tasks.filter(t => t.project_id === p.id)
            projTasks.forEach(t => {
                const tStart = t.start_date ? new Date(t.start_date) : null
                const tEnd = t.due_date ? new Date(t.due_date) : null
                if (!tStart && !tEnd) return

                const tEffStart = tStart && tStart >= monthStart ? tStart : monthStart
                const tEffEnd = tEnd && tEnd <= monthEnd ? tEnd : monthEnd

                if (tEffStart > monthEnd || (tEnd && tEnd < monthStart)) return

                items.push({
                    id: t.id,
                    name: `  └ ${t.task_code}: ${t.name}`,
                    startDay: tEffStart.getDate(),
                    endDay: tEffEnd.getDate(),
                    color: PROJECT_COLORS[idx % PROJECT_COLORS.length].replace('400', '300'),
                    type: 'task',
                    projectCode: p.project_code
                })
            })
        })

        return items
    }, [projects, tasks, year, month, search])

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
            <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex items-center justify-center gap-8">
                <button
                    onClick={prevMonth}
                    className="w-10 h-10 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center transition-all active:scale-90"
                >
                    <ChevronLeft size={22} />
                </button>
                <h2 className="text-lg font-black text-slate-800 min-w-[180px] text-center uppercase tracking-tight">
                    {MONTHS_VI[month]} {year}
                </h2>
                <button
                    onClick={nextMonth}
                    className="w-10 h-10 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center transition-all active:scale-90"
                >
                    <ChevronRight size={22} />
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
                                ganttItems.map((item, idx) => (
                                    <div key={item.id + idx} className="flex border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                                        <div className={`w-64 min-w-[16rem] px-5 py-3 text-[11px] border-r border-slate-100 sticky left-0 bg-white z-10 truncate group-hover:bg-slate-50 transition-colors ${item.type === 'project' ? 'font-black text-slate-700' : 'text-slate-500 pl-8 font-medium italic'
                                            }`} title={item.name}>
                                            {item.name}
                                        </div>
                                        <div className="flex-1 flex relative" style={{ minHeight: '44px' }}>
                                            {days.map(day => (
                                                <div
                                                    key={day}
                                                    style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px` }}
                                                    className={`border-r border-slate-50/30 ${isToday(day) ? 'bg-orange-50' : ''}`}
                                                ></div>
                                            ))}
                                            {/* Bar component */}
                                            <div
                                                className={`absolute top-1/2 -translate-y-1/2 h-5 rounded-full shadow-md z-0 transition-all ${item.color} ${item.type === 'project' ? 'opacity-90' : 'opacity-60 scale-y-75'
                                                    }`}
                                                style={{
                                                    left: `${(item.startDay - 1) * cellWidth + 4}px`,
                                                    width: `${Math.max((item.endDay - item.startDay + 1) * cellWidth - 8, cellWidth - 8)}px`
                                                }}
                                            >
                                                {/* Optional: Add percentage label if bar is long enough */}
                                                {(item.endDay - item.startDay) * cellWidth > 60 && (
                                                    <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-white/90 truncate uppercase px-2">
                                                        {item.type === 'project' ? 'Project' : 'Task'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
