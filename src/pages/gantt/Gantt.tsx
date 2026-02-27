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

    // Get all items (projects + tasks) that have dates within this month
    const ganttItems = useMemo(() => {
        const items: { id: string; name: string; startDay: number; endDay: number; color: string; type: 'project' | 'task'; projectCode?: string }[] = []

        projects.forEach((p, idx) => {
            if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.project_code.toLowerCase().includes(search.toLowerCase())) return

            const start = p.start_date ? new Date(p.start_date) : null
            const end = p.end_date ? new Date(p.end_date) : null

            if (!start && !end) return

            const monthStart = new Date(year, month, 1)
            const monthEnd = new Date(year, month + 1, 0)

            // Check if project overlaps with this month
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

            // Add tasks for this project
            const projTasks = tasks.filter(t => t.project_id === p.id)
            projTasks.forEach(t => {
                if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.task_code.toLowerCase().includes(search.toLowerCase())) return

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
        <div className="space-y-4 max-w-[1400px] mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Calendar size={20} className="text-indigo-600" /> Sơ đồ Gantt
                </h1>
                <div className="flex items-center gap-3">
                    {/* Zoom */}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                        <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="text-slate-400 hover:text-slate-600"><ZoomOut size={14} /></button>
                        <span className="text-xs font-medium text-slate-600 w-10 text-center">{zoom}%</span>
                        <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="text-slate-400 hover:text-slate-600"><ZoomIn size={14} /></button>
                    </div>
                    <button onClick={resetMonth} className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                        Đặt lại
                    </button>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm..."
                            className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none w-44" />
                    </div>
                </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-center gap-4">
                <button onClick={prevMonth} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-md transition-colors">
                    <ChevronLeft size={18} />
                </button>
                <h2 className="text-lg font-bold text-slate-800">{MONTHS_VI[month]} {year}</h2>
                <button onClick={nextMonth} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-md transition-colors">
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Gantt Chart */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <div className="min-w-max">
                        {/* Day Headers */}
                        <div className="flex border-b border-slate-200">
                            <div className="w-56 min-w-[14rem] px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-50 border-r border-slate-200 sticky left-0 z-10">
                                Tên
                            </div>
                            {days.map(day => (
                                <div key={day} className={`text-center border-r border-slate-100 ${isToday(day) ? 'bg-indigo-50' : isWeekend(day) ? 'bg-red-50/50' : 'bg-slate-50'}`}
                                    style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px` }}>
                                    <div className={`text-[10px] font-bold py-1 ${isToday(day) ? 'text-indigo-600' : isWeekend(day) ? 'text-red-400' : 'text-slate-700'}`}>{day}</div>
                                    <div className={`text-[9px] pb-1 ${isToday(day) ? 'text-indigo-400' : isWeekend(day) ? 'text-red-300' : 'text-slate-400'}`}>{getDayName(day)}</div>
                                </div>
                            ))}
                        </div>

                        {/* Gantt Rows */}
                        {ganttItems.length === 0 ? (
                            <div className="py-16 text-center text-slate-500">
                                <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-sm">Không có dự án hoặc nhiệm vụ nào trong {MONTHS_VI[month]} {year}</p>
                            </div>
                        ) : (
                            ganttItems.map((item, idx) => (
                                <div key={item.id + idx} className="flex border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <div className={`w-56 min-w-[14rem] px-4 py-2.5 text-xs border-r border-slate-100 sticky left-0 bg-white z-10 truncate ${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600 pl-6'}`}
                                        title={item.name}>
                                        {item.name}
                                    </div>
                                    <div className="flex-1 flex relative" style={{ minHeight: '36px' }}>
                                        {days.map(day => (
                                            <div key={day} className={`border-r border-slate-50 ${isToday(day) ? 'bg-indigo-50/30' : isWeekend(day) ? 'bg-red-50/20' : ''}`}
                                                style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px` }}>
                                            </div>
                                        ))}
                                        {/* Bar */}
                                        <div className={`absolute top-1/2 -translate-y-1/2 h-5 ${item.color} rounded-md shadow-sm opacity-80`}
                                            style={{
                                                left: `${(item.startDay - 1) * cellWidth + 2}px`,
                                                width: `${Math.max((item.endDay - item.startDay + 1) * cellWidth - 4, cellWidth - 4)}px`
                                            }}>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
