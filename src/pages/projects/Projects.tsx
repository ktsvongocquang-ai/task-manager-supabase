import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import { type Project } from '../../types'
import { FolderKanban, Plus, MoreVertical, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

export const Projects = () => {
    const { profile } = useAuthStore()
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProjects()
    }, [profile])

    const fetchProjects = async () => {
        try {
            setLoading(true)
            let query = supabase.from('projects').select('*').order('created_at', { ascending: false })

            if (profile?.role === 'Quản lý') {
                query = query.eq('manager_id', profile.id)
            } else if (profile?.role === 'Nhân viên') {
                // Find projects where user has tasks (Simplified for now - show top 20 or we need a rpc/join)
                query = query.limit(20)
            }

            const { data, error } = await query
            if (error) throw error
            if (data) setProjects(data as Project[])
        } catch (error) {
            console.error('Error fetching projects:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Hoàn thành': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'Đang thực hiện': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'Tạm dừng': return 'bg-amber-100 text-amber-700 border-amber-200'
            default: return 'bg-slate-100 text-slate-700 border-slate-200'
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <FolderKanban className="mr-2 text-indigo-600" /> Quản lý Dự án
                    </h1>
                    <p className="text-slate-500 mt-1">Danh sách các dự án đang hoạt động trong hệ thống.</p>
                </div>

                {/* Only Admin/Manager can create projects in the original spec */}
                {profile?.role !== 'Nhân viên' && (
                    <Link
                        to="/projects/new"
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                    >
                        <Plus size={18} className="mr-1.5" /> Thêm dự án
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                        <div className="p-5 flex-1">
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusColor(project.status)}`}>
                                    {project.status}
                                </span>
                                <button className="text-slate-400 hover:text-slate-600 p-1 -mr-2"><MoreVertical size={18} /></button>
                            </div>

                            <Link to={`/projects/${project.id}`} className="block focus:outline-none">
                                <h3 className="text-lg font-bold text-slate-800 hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
                                    {project.name}
                                </h3>
                                <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                                    {project.description || 'Chưa có mô tả chi tiết cho dự án này.'}
                                </p>
                            </Link>
                        </div>

                        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-sm">
                            <div className="flex items-center text-slate-500" title="Thời hạn dự án">
                                <Calendar size={14} className="mr-1.5 text-slate-400" />
                                {project.end_date ? format(parseISO(project.end_date), 'dd/MM/yyyy', { locale: vi }) : 'Vô thời hạn'}
                            </div>

                            {/* Fake Avatar Group for styling */}
                            <div className="hidden sm:flex -space-x-2 overflow-hidden">
                                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">Q</div>
                                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-rose-500 flex items-center justify-center text-[10px] text-white font-bold">M</div>
                                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-medium">+3</div>
                            </div>
                        </div>
                    </div>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white border border-slate-200 border-dashed rounded-2xl">
                        <FolderKanban size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-1">Chưa có dự án nào</h3>
                        <p className="text-slate-500 mb-6">Bắt đầu quản lý công việc bằng cách tạo dự án đầu tiên của bạn.</p>
                        {profile?.role !== 'Nhân viên' && (
                            <Link to="/projects/new" className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-medium rounded-lg transition-colors">
                                <Plus size={18} className="mr-1.5" /> Tạo dự án ngay
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
