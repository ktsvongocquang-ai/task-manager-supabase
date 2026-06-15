import { useMemo, useRef, useEffect } from 'react'
import { format, isSameDay } from 'date-fns'
import type { Task } from '../../types'

interface Props {
    currentDate: Date
    tasks: Task[]
    onTaskClick: (t: Task) => void
    onEmptyClick: (dateStr: string, hourStr: string) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export const DayView = ({ currentDate, tasks, onTaskClick, onEmptyClick }: Props) => {
    const gridRef = useRef<HTMLDivElement>(null)

    // Scroll to current time on mount if looking at today
    useEffect(() => {
        if (isSameDay(currentDate, new Date()) && gridRef.current) {
            const currentHour = new Date().getHours()
            const scrollAmount = Math.max(0, (currentHour - 1) * 60) // 60px per hour
            gridRef.current.scrollTop = scrollAmount
        }
    }, [currentDate])

    const dateStr = format(currentDate, 'yyyy-MM-dd')

    // Filter tasks for this day
    const dayTasks = useMemo(() => {
        return tasks.filter(t => {
            // Include if due_date is today or starts today
            const startD = t.start_date || t.due_date
            const endD = t.due_date
            if (!startD || !endD) return false
            return startD <= dateStr && endD >= dateStr
        })
    }, [tasks, dateStr])

    // Separate all-day vs timed tasks
    const allDayTasks = useMemo(() => dayTasks.filter(t => !t.start_time && !t.due_time), [dayTasks])
    const timedTasks = useMemo(() => dayTasks.filter(t => t.start_time || t.due_time), [dayTasks])

    // Helper to calculate top and height for timed tasks
    const getTaskStyle = (task: Task) => {
        const start = task.start_time || '00:00'
        const end = task.due_time || '23:59'

        const [sH, sM] = start.split(':').map(Number)
        const [eH, eM] = end.split(':').map(Number)

        const startMinutes = sH * 60 + (sM || 0)
        let endMinutes = eH * 60 + (eM || 0)
        
        if (endMinutes < startMinutes) endMinutes = startMinutes

        const top = startMinutes
        let height = endMinutes - startMinutes
        
        // Ensure at least 45 mins height for visibility of the content
        if (height < 45) height = 45

        return { top: `${top}px`, height: `${height}px` }
    }

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* Header / All Day Section */}
            <div className="flex border-b border-slate-200 shrink-0">
                <div className="w-16 border-r border-slate-200 shrink-0 bg-slate-50 flex flex-col items-center py-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase">{format(currentDate, 'EE')}</span>
                    <span className="text-xl font-bold text-slate-800 leading-none mt-1">{format(currentDate, 'dd')}</span>
                </div>
                <div className="flex-1 p-2 bg-slate-50 overflow-y-auto max-h-[120px] flex flex-wrap gap-1 content-start">
                    {allDayTasks.map(t => (
                        <div 
                            key={t.id} 
                            onClick={() => onTaskClick(t)}
                            className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded truncate max-w-[200px] cursor-pointer hover:bg-indigo-200 transition-colors border border-indigo-200"
                        >
                            {t.name || t.task_code || 'Chưa có tên'}
                        </div>
                    ))}
                    {allDayTasks.length === 0 && (
                        <div className="text-xs text-slate-400 italic py-1 px-2">Không có việc cả ngày</div>
                    )}
                </div>
            </div>

            {/* Time Grid */}
            <div className="flex-1 overflow-y-auto relative" ref={gridRef}>
                <div className="flex min-h-[1440px] relative"> {/* 24h * 60px = 1440px */}
                    
                    {/* Time Labels */}
                    <div className="w-16 border-r border-slate-200 bg-white shrink-0 relative">
                        {HOURS.map(hour => (
                            <div key={hour} className="h-[60px] relative">
                                {hour > 0 && (
                                    <span className="absolute top-0 right-2 -mt-2 text-[10px] font-medium text-slate-400">
                                        {hour.toString().padStart(2, '0')}:00
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Grid Columns */}
                    <div className="flex-1 relative bg-white">
                        {/* Horizontal Lines */}
                        {HOURS.map(hour => (
                            <div 
                                key={hour} 
                                className="h-[60px] border-b border-slate-100 w-full relative group"
                                onDoubleClick={() => onEmptyClick(dateStr, `${hour.toString().padStart(2, '0')}:00`)}
                            >
                                <div className="hidden group-hover:block absolute top-0 left-0 text-[10px] text-slate-300 p-1">+ Tạo việc lúc {hour.toString().padStart(2, '0')}:00</div>
                            </div>
                        ))}

                        {/* Current Time Line */}
                        {isSameDay(currentDate, new Date()) && (
                            <div 
                                className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                                style={{ top: `${new Date().getHours() * 60 + new Date().getMinutes()}px` }}
                            >
                                <div className="absolute left-[-5px] top-[-5px] w-2 h-2 rounded-full bg-red-500"></div>
                            </div>
                        )}

                        {/* Tasks Absolute */}
                        {timedTasks.map(t => {
                            const style = getTaskStyle(t)
                            return (
                                <div
                                    key={t.id}
                                    onClick={() => onTaskClick(t)}
                                    className="absolute left-1 right-2 rounded border shadow-sm px-2 py-1 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group z-0 hover:z-20 border-blue-300 bg-blue-100 text-blue-800 flex flex-col justify-start"
                                    style={style}
                                    title={t.name || t.task_code || 'Chưa có tên'}
                                >
                                    <div className="text-[11px] font-bold truncate leading-tight">
                                        {t.start_time ? t.start_time.substring(0, 5) : ''} - {t.name || t.task_code || 'Chưa có tên'}
                                    </div>
                                    <div className="text-[9px] truncate opacity-80 leading-none mt-0.5">
                                        {t.status}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
