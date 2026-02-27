import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../store/authStore'
import { type Project, type Task, type ActivityLog } from '../types'
import {
    FolderKanban,
    CheckSquare,
    Clock,
    AlertCircle,
    Activity,
    ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

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
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [profile])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            // 1. Fetch Projects (dependent on Role)
            let projectsQuery = supabase.from('projects').select('*')
            if (profile?.role === 'Quản lý') {
                projectsQuery = projectsQuery.eq('manager_id', profile.id)
            } else if (profile?.role === 'Nhân viên') {
                // This is simplified. Real logic requires fetching tasks where assignee_id = profile.id then getting those project_ids
                projectsQuery = projectsQuery.limit(10) // Fallback for simple display mode
            }
            const { data: projects } = await projectsQuery

            // 2. Fetch Tasks
            let tasksQuery = supabase.from('tasks').select('*')
            if (profile?.role === 'Nhân viên') {
                tasksQuery = tasksQuery.eq('assignee_id', profile.id)
            } else if (profile?.role === 'Quản lý') {
                // Should fetch manager's own tasks OR tasks in their projects. (Simplified for dashboard stats)
                const projIds = projects?.map(p => p.id) || []
                if (projIds.length > 0) {
                    tasksQuery = tasksQuery.in('project_id', projIds)
                }
            }
            const { data: tasks } = await tasksQuery

            // Calculate Stats
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            let completed = 0
            let ongoing = 0
            let overdue = 0

            tasks?.forEach((t: Task) => {
                const status = t.status.toLowerCase()
                if (status.includes('hoàn thành')) completed++
                else if (status.includes('đang')) ongoing++

                if (!status.includes('hoàn thành') && t.due_date) {
                    const due = new Date(t.due_date)
                    if (due < today) overdue++
                }
            })

            setStats({
                totalProjects: projects?.length || 0,
                totalTasks: tasks?.length || 0,
                completedTasks: completed,
                ongoingTasks: ongoing,
                overdueTasks: overdue
            })

            // 3. Fetch Recent Activities
            let logQuery = supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(6)

            // Filter logs by user role logic (Skipped for brevity on Admin dashboard)
            if (profile?.role === 'Nhân viên') {
                logQuery = logQuery.eq('user_id', profile.id)
            }

            const { data: logs } = await logQuery
            if (logs) setRecentActivities(logs as ActivityLog[])

        } catch (error) {
            console.error('Error fetching dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    const StatCard = ({ title, value, icon: Icon, colorClass, link }: any) => (
        <Link to={link || "#"} className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group`}>
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${colorClass.bg}`}></div>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <h3 className={`text-3xl font-bold ${colorClass.text}`}>{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${colorClass.bg} ${colorClass.text} bg-opacity-10`}>
                    <Icon size={24} />
                </div>
            </div>
        </Link>
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Tổng quan</h1>
                <p className="text-slate-500 mt-1">Xin chào {profile?.full_name}, chúc bạn một ngày làm việc hiệu quả.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng Dự Án"
                    value={stats.totalProjects}
                    icon={FolderKanban}
                    link="/projects"
                    colorClass={{ text: 'text-indigo-600', bg: 'bg-indigo-600' }}
                />
                <StatCard
                    title="Tổng Nhiệm Vụ"
                    value={stats.totalTasks}
                    icon={CheckSquare}
                    link="/tasks"
                    colorClass={{ text: 'text-blue-600', bg: 'bg-blue-600' }}
                />
                <StatCard
                    title="Đang Thực Hiện"
                    value={stats.ongoingTasks}
                    icon={Clock}
                    link="/tasks"
                    colorClass={{ text: 'text-amber-500', bg: 'bg-amber-500' }}
                />
                <StatCard
                    title="Quá Hạn"
                    value={stats.overdueTasks}
                    icon={AlertCircle}
                    link="/tasks"
                    colorClass={stats.overdueTasks > 0 ? { text: 'text-rose-500', bg: 'bg-rose-500' } : { text: 'text-emerald-500', bg: 'bg-emerald-500' }}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Activity Feed */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <Activity size={20} className="text-indigo-600" />
                            <h3 className="text-lg font-semibold text-slate-800">Hoạt động gần đây</h3>
                        </div>
                        <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center">
                            Xem tất cả <ArrowRight size={16} className="ml-1" />
                        </button>
                    </div>
                    <div className="p-6">
                        {recentActivities.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">Chưa có hoạt động nào được ghi nhận.</div>
                        ) : (
                            <div className="space-y-6">
                                {recentActivities.map((activity) => (
                                    <div key={activity.id} className="flex space-x-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mb-1 z-10 ring-4 ring-white"></div>
                                            <div className="w-px h-full bg-slate-200 -mt-1"></div>
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className="text-sm font-medium text-slate-800">{activity.action}</p>
                                            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{activity.details}</p>
                                            <p className="text-xs text-slate-400 mt-2">
                                                {format(parseISO(activity.created_at), "HH:mm, dd/MM/yyyy", { locale: vi })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions / Getting Started */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-md">
                        <h3 className="font-semibold text-lg mb-2">Thao tác nhanh</h3>
                        <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                            Tạo mới và quản lý luồng công việc của bạn một cách nhanh chóng.
                        </p>
                        <div className="space-y-3">
                            {profile?.role !== 'Nhân viên' && (
                                <Link to="/projects/new" className="block w-full text-center bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors py-2.5 rounded-lg text-sm font-medium text-white border border-white/10">
                                    + Tạo Dự Án Mới
                                </Link>
                            )}
                            <Link to="/tasks/new" className="block w-full text-center bg-white text-indigo-700 hover:bg-indigo-50 transition-colors py-2.5 rounded-lg text-sm font-bold shadow-sm">
                                + Giao Việc Mới
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
