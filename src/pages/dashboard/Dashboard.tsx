import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import { type Task, type ActivityLog } from '../../types'
import {
    FolderKanban,
    CheckSquare,
    Clock,
    AlertCircle,
    Activity,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts'

const COLORS_STATUS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
const COLORS_PRIORITY = ['#3b82f6', '#f59e0b', '#ef4444']

export const Dashboard = () => {
    const { profile } = useAuthStore()
    const [stats, setStats] = useState({
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        ongoingTasks: 0,
        overdueTasks: 0
    })
    const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([])
    const [urgentTasks, setUrgentTasks] = useState<any[]>([])
    const [taskStatusData, setTaskStatusData] = useState<any[]>([])
    const [projectProgressData, setProjectProgressData] = useState<any[]>([])
    const [taskPriorityData, setTaskPriorityData] = useState<any[]>([])
    const [employeeData, setEmployeeData] = useState<any[]>([])
    const [trendData, setTrendData] = useState<any[]>([])
    const [projectCompareData, setProjectCompareData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [profile])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            // Fetch Projects
            const { data: projects } = await supabase.from('projects').select('*')
            // Fetch Tasks
            const { data: tasks } = await supabase.from('tasks').select('*')
            // Fetch Profiles
            const { data: profiles } = await supabase.from('profiles').select('*')

            const allTasks = (tasks || []) as Task[]
            const allProjects = projects || []

            // Stats
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            let completed = 0, ongoing = 0, overdue = 0
            const statusMap: Record<string, number> = {}
            const priorityMap: Record<string, number> = {}

            allTasks.forEach((t: Task) => {
                const status = t.status || ''
                statusMap[status] = (statusMap[status] || 0) + 1

                if (t.priority) {
                    priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1
                }

                if (status.includes('Hoàn thành')) completed++
                else if (status.includes('Đang')) ongoing++

                if (!status.includes('Hoàn thành') && t.due_date) {
                    const due = new Date(t.due_date)
                    if (due < today) overdue++
                }
            })

            setStats({
                totalProjects: allProjects.length,
                totalTasks: allTasks.length,
                completedTasks: completed,
                ongoingTasks: ongoing,
                overdueTasks: overdue
            })

            // Task Status Donut
            setTaskStatusData(Object.entries(statusMap).map(([name, value]) => ({ name, value })))

            // Task Priority Donut
            setTaskPriorityData(Object.entries(priorityMap).map(([name, value]) => ({ name, value })))

            // Project Progress Bar
            const projProgress = allProjects.map((p: any) => {
                const projTasks = allTasks.filter(t => t.project_id === p.id)
                const total = projTasks.length
                const done = projTasks.filter(t => t.status?.includes('Hoàn thành')).length
                const pct = total > 0 ? Math.round((done / total) * 100) : 0
                return { name: p.project_code || p.name?.substring(0, 10), 'Khối lượng': pct }
            }).slice(0, 8)
            setProjectProgressData(projProgress)

            // Employee Performance
            const empMap: Record<string, { total: number, done: number }> = {}
            allTasks.forEach((t: any) => {
                const assignee = t.assignee_id
                if (!assignee) return
                if (!empMap[assignee]) empMap[assignee] = { total: 0, done: 0 }
                empMap[assignee].total++
                if (t.status?.includes('Hoàn thành')) empMap[assignee].done++
            })
            const empData = Object.entries(empMap).map(([id, data]) => {
                const prof = profiles?.find((p: any) => p.id === id)
                return {
                    name: prof?.full_name?.split(' ').pop() || id.substring(0, 6),
                    'Tổng số nhiệm vụ': data.total,
                    'Việc hoàn thành (%)': data.total > 0 ? Math.round((data.done / data.total) * 100) : 0
                }
            }).slice(0, 6)
            setEmployeeData(empData)

            // Trend data (monthly)
            const monthMap: Record<string, number> = {}
            allTasks.forEach((t: any) => {
                if (t.status?.includes('Hoàn thành') && t.report_date) {
                    const month = t.report_date.substring(0, 7)
                    monthMap[month] = (monthMap[month] || 0) + 1
                }
            })
            const sortedMonths = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0])).slice(-6)
            setTrendData(sortedMonths.map(([month, count]) => ({ name: month, 'Hoàn thành': count })))

            // Project comparison
            const projCompare = allProjects.map((p: any) => {
                const projTasks = allTasks.filter(t => t.project_id === p.id)
                const doing = projTasks.filter(t => t.status?.includes('Đang')).length
                const done = projTasks.filter(t => t.status?.includes('Hoàn thành')).length
                return {
                    name: p.project_code || p.name?.substring(0, 8),
                    'Đang thực hiện': doing,
                    'Hoàn thành': done
                }
            }).slice(0, 6)
            setProjectCompareData(projCompare)

            // Urgent tasks (high priority or overdue)
            const urgent = allTasks.filter(t => {
                if (t.status?.includes('Hoàn thành')) return false
                const isHighPriority = t.priority === 'Cao' || t.priority === 'Khẩn cấp'
                let isOverdue = false
                if (t.due_date) {
                    const due = new Date(t.due_date)
                    if (due < today) isOverdue = true
                }
                return isHighPriority || isOverdue
            }).slice(0, 6)
            setUrgentTasks(urgent)

            // Recent Activities
            const { data: logs } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(6)
            if (logs) setRecentActivities(logs as ActivityLog[])

        } catch (error) {
            console.error('Error fetching dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatTimeAgo = (isoString: string) => {
        if (!isoString) return ''
        const date = new Date(isoString)
        const now = new Date()
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
        if (seconds < 60) return 'Vừa xong'
        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) return `${minutes} phút trước`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours} giờ trước`
        const days = Math.floor(hours / 24)
        return `${days} ngày trước`
    }

    const getStatusBadgeColor = (status: string) => {
        if (status?.includes('Hoàn thành')) return 'bg-emerald-100 text-emerald-700'
        if (status?.includes('Đang')) return 'bg-blue-100 text-blue-700'
        if (status?.includes('Tạm dừng')) return 'bg-amber-100 text-amber-700'
        return 'bg-slate-100 text-slate-700'
    }

    const getPriorityBadge = (priority: string) => {
        if (priority === 'Khẩn cấp') return 'bg-red-500 text-white'
        if (priority === 'Cao') return 'bg-orange-100 text-orange-700'
        if (priority === 'Trung bình') return 'bg-yellow-100 text-yellow-700'
        return 'bg-slate-100 text-slate-600'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    const statCards = [
        { title: 'Tổng Dự Án', value: stats.totalProjects, icon: FolderKanban, bg: 'bg-blue-500', extra: `● Hoàn thành: ${stats.completedTasks}`, extraPct: stats.totalTasks > 0 ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0, pctLabel: 'Tỷ lệ' },
        { title: 'Tổng Nhiệm Vụ', value: stats.totalTasks, icon: CheckSquare, bg: 'bg-emerald-500', extra: `● Hoàn thành: ${stats.completedTasks}`, extraPct: stats.totalTasks > 0 ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0, pctLabel: 'Tỷ lệ' },
        { title: 'Nhiệm vụ Đang Làm', value: stats.ongoingTasks, icon: Clock, bg: 'bg-amber-500', extra: `● Chưa bắt đầu: ${stats.totalTasks - stats.completedTasks - stats.ongoingTasks - stats.overdueTasks}`, extraPct: undefined, pctLabel: undefined },
        { title: 'Nhiệm vụ Quá Hạn', value: stats.overdueTasks, icon: AlertCircle, bg: stats.overdueTasks > 0 ? 'bg-red-500' : 'bg-emerald-500', extra: stats.overdueTasks > 0 ? `● Tổng nhiệm vụ: ${stats.totalTasks}` : '● Tạm dừng: 0', extraPct: stats.totalTasks > 0 ? Math.round(stats.overdueTasks / stats.totalTasks * 100) : 0, pctLabel: 'Tỷ lệ' },
    ]

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <div key={i} className={`${card.bg} text-white rounded-2xl p-5 shadow-lg relative overflow-hidden`}>
                        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10"></div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-white/20 p-2.5 rounded-xl">
                                <card.icon size={22} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold">{card.value}</div>
                        <div className="text-sm text-white/80 mt-1">{card.title}</div>
                        <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/70 flex items-center justify-between">
                            <span>{card.extra}</span>
                            {card.extraPct !== undefined && (
                                <span>▲ Tỷ lệ: {card.extraPct}%</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Row 2: Activity + Urgent Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Activity Feed */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <Activity size={18} className="text-indigo-600" />
                            <h3 className="text-base font-semibold text-slate-800">Hoạt động gần đây</h3>
                        </div>
                    </div>
                    <div className="p-5 max-h-[400px] overflow-y-auto">
                        {recentActivities.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">Chưa có hoạt động nào.</div>
                        ) : (
                            <div className="space-y-5">
                                {recentActivities.map((a) => (
                                    <div key={a.id} className="flex space-x-3">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 z-10 ring-4 ring-white"></div>
                                            <div className="w-px h-full bg-slate-200 -mt-0.5"></div>
                                        </div>
                                        <div className="flex-1 pb-3">
                                            <p className="text-sm font-medium text-slate-800">{a.action}</p>
                                            <p className="text-xs text-slate-500 mt-1 bg-slate-50 p-2 rounded border border-slate-100 line-clamp-2">{a.details}</p>
                                            <p className="text-xs text-slate-400 mt-1.5">{formatTimeAgo(a.created_at)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Urgent Tasks */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-base font-semibold text-slate-800">Nhiệm vụ ưu tiên cao</h3>
                    </div>
                    <div className="p-3 max-h-[400px] overflow-y-auto">
                        {urgentTasks.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">🎉 Không có việc quá hạn!</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {urgentTasks.map((task: any) => (
                                    <div key={task.id} className="border border-slate-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-slate-500">{task.task_code}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getPriorityBadge(task.priority)}`}>{task.priority}</span>
                                        </div>
                                        <h4 className="text-sm font-semibold text-slate-800 line-clamp-1 mb-2">{task.name}</h4>
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStatusBadgeColor(task.status)}`}>{task.status}</span>
                                            <span>{task.due_date ? format(parseISO(task.due_date), 'dd/MM/yyyy') : 'N/A'}</span>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="mt-3">
                                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${task.completion_pct || 0}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 3: Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Task Status Donut */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Trạng thái nhiệm vụ</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                {taskStatusData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Project Progress Bar */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Phân bổ tiến độ dự án</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={projectProgressData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="Khối lượng" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Task Priority Donut */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Phân bổ ưu tiên nhiệm vụ</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={taskPriorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                {taskPriorityData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_PRIORITY[index % COLORS_PRIORITY.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 4: Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Employee Performance */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Hiệu quả nhân viên</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={employeeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Bar dataKey="Tổng số nhiệm vụ" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Việc hoàn thành (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Completion Trend */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Xu hướng hoàn thành</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="Hoàn thành" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Project Comparison */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">So sánh dự án</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={projectCompareData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Bar dataKey="Đang thực hiện" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Hoàn thành" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-400 py-4 border-t border-slate-100">
                <p>Hỗ trợ kỹ thuật: <span className="text-indigo-500">Phiên bản 4.0</span></p>
                <p className="mt-1">© 2025 chaolongqua.com</p>
            </div>
        </div>
    )
}
