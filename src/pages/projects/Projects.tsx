import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import { type Project, type Task } from '../../types'
import { Plus, Search, Edit3, Trash2, Copy, Calendar, Users, Eye, List, Link, FileText, ExternalLink, LayoutGrid, ChevronDown, Star, AlertCircle, Check, CheckCircle2, MoreVertical, Folder, BookOpen, RefreshCw, X, Bell, HardHat, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { AddEditProjectModal } from './AddEditProjectModal'
import { AddEditTaskModal } from '../tasks/AddEditTaskModal'
import { UnifiedProjectModal } from './UnifiedProjectModal'
import { DEFAULT_PHASES, detectPhase } from '../../utils/phaseUtils'
import { ChevronRight } from 'lucide-react'

export const Projects = () => {
    const { profile } = useAuthStore()
    const navigate = useNavigate()
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [profiles, setProfiles] = useState<any[]>([])
    const [allTasks, setAllTasks] = useState<Task[]>([])
    const [form, setForm] = useState({
        name: '', project_code: '', description: '', status: 'Mới',
        start_date: '', end_date: '', manager_id: '', budget: 0,
        scale: '', project_type: '',
        link_hien_trang: '', link_du_an: '', link_presentation: '',
    })

    const [unifiedProjectData, setUnifiedProjectData] = useState<{ project: Project, tab: 'tasks' | 'info' | 'timeline' } | null>(null)
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [taskModalInitialData, setTaskModalInitialData] = useState({ task_code: '', project_id: '' })
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [projectViewMode, setProjectViewMode] = useState<'cards' | 'list'>('cards')
    const [expandedDoneProjects, setExpandedDoneProjects] = useState<Set<string>>(new Set())
    const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())

    const toggleDoneProject = (projectId: string) => {
        setExpandedDoneProjects(prev => {
            const next = new Set(prev)
            if (next.has(projectId)) next.delete(projectId)
            else next.add(projectId)
            return next
        })
    }

    useEffect(() => {
        fetchProjects()
        fetchProfiles()
        fetchTasks()

        const channel = supabase.channel('projects_tasks_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'projects' },
                () => fetchProjects(true)
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                () => fetchTasks()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchProjects = async (silent = false) => {
        try {
            if (!silent) setLoading(true)
            const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
            if (data) setProjects(data as Project[])
        } catch (err) {
            console.error(err)
        } finally {
            if (!silent) setLoading(false)
        }
    }

    const fetchProfiles = async () => {
        const { data } = await supabase.from('profiles').select('id, full_name')
        if (data) setProfiles(data)
    }

    const fetchTasks = async () => {
        const { data } = await supabase.from('tasks').select('*')
        if (data) setAllTasks(data as Task[])
    }

    const filteredAllTasks = allTasks.filter(t => {
        const userRole = profile?.role;
        const isAssigned = t.assignee_id === profile?.id;
        const isSupporter = t.supporter_id === profile?.id;

        const isManagerOrAdmin = ['Admin', 'Quản lý', 'Giám đốc', 'Quản lý thiết kế', 'Quản lý thi công'].includes(userRole?.trim() || '');

        let isVisible = true;
        if (!isManagerOrAdmin) {
            isVisible = Boolean(isAssigned || isSupporter);
        }
        return isVisible;
    });

    const getProjectProgress = (projectId: string) => {
        const projTasks = allTasks.filter(t => t.project_id === projectId && !t.parent_id);
        if (projTasks.length === 0) return 0;

        let totalPct = 0;
        projTasks.forEach(t => {
            const subTasks = allTasks.filter(ct => ct.parent_id === t.id);
            const completedSub = subTasks.filter(st => st.status?.includes('Hoàn thành')).length;
            const displayPct = subTasks.length > 0 ? Math.round((completedSub / subTasks.length) * 100) : (t.completion_pct || 0);
            totalPct += displayPct;
        });

        return Math.round(totalPct / projTasks.length);
    }

    const [viewScope, setViewScope] = useState<'all' | 'mine'>('all')

    const baseFilteredProjects = projects.filter(p => {
        const userRole = profile?.role;
        const isManagerOrAdmin = ['Admin', 'Quản lý', 'Giám đốc', 'Quản lý thiết kế', 'Quản lý thi công'].includes(userRole?.trim() || '');
        
        let isVisible = true;
        if (!isManagerOrAdmin && viewScope === 'mine') {
            isVisible = p.manager_id === profile?.id || filteredAllTasks.some(t => t.project_id === p.id);
        } else if (isManagerOrAdmin && viewScope === 'mine') {
            isVisible = p.manager_id === profile?.id || filteredAllTasks.some(t => t.project_id === p.id);
        }
        return isVisible;
    });

    const statusCounts = {
        'Chưa bắt đầu': baseFilteredProjects.filter(p => p.status === 'Chưa bắt đầu' || p.status === 'Mới').length,
        'Đang thực hiện': baseFilteredProjects.filter(p => p.status === 'Đang thực hiện').length,
        'Hoàn thành': baseFilteredProjects.filter(p => p.status === 'Hoàn thành').length,
        'Tạm dừng': baseFilteredProjects.filter(p => p.status === 'Tạm dừng').length,
    }

    const filteredProjects = baseFilteredProjects.filter(p => {
        const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.project_code || '').toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter ? p.status === statusFilter : true
        return matchSearch && matchStatus
    })

    const generateNextProjectCode = () => {
        let maxId = 0;
        projects.forEach(p => {
            const match = p.project_code.match(/^DA(\d+)$/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxId) maxId = num;
            }
        });
        return `DA${String(maxId + 1).padStart(3, '0')}`;
    }

    const openAddModal = () => {
        setEditingProject(null)
        setForm({
            name: '', project_code: generateNextProjectCode(),
            description: '', status: 'Chưa bắt đầu', start_date: '', end_date: '',
            manager_id: profile?.id || '', budget: 0,
            scale: '', project_type: '',
            link_hien_trang: '', link_du_an: '', link_presentation: '',
        })
        setShowModal(true)
    }

    const openUnifiedModal = (p: Project, tab: 'tasks' | 'info' | 'timeline') => {
        setEditingProject(p)
        // Parse KPI fields from other_info
        let kpiBudget = 0, kpiScale = '', kpiProjectType = '';
        if (p.other_info) {
            try {
                const parsed = JSON.parse(p.other_info);
                kpiBudget = parsed.budget || 0;
                kpiScale = parsed.scale || '';
                kpiProjectType = parsed.project_type || '';
            } catch(e) {}
        }
        setForm({
            name: p.name, project_code: p.project_code, description: p.description || '',
            status: p.status, start_date: p.start_date || '', end_date: p.end_date || '',
            manager_id: p.manager_id || '', budget: kpiBudget,
            scale: kpiScale, project_type: kpiProjectType,
            link_hien_trang: (p as any).link_hien_trang || '',
            link_du_an: (p as any).link_du_an || '',
            link_presentation: (p as any).link_presentation || '',
        })
        setUnifiedProjectData({ project: p, tab })
    }

    const openEditModal = (p: Project) => {
        openUnifiedModal(p, 'info')
    }

    const handleSave = async () => {
        try {
            // budget, scale, project_type may not exist as DB columns
            // Store them inside other_info JSON to avoid schema errors
            const { budget: _b, scale: _s, project_type: _pt, ...cleanForm } = form;

            // Merge KPI fields into other_info
            let existingOtherInfo: any = {};
            if (editingProject?.other_info) {
                try { existingOtherInfo = JSON.parse(editingProject.other_info); } catch(e) {}
            }

            let kpiData = existingOtherInfo.kpiData;
            if (form.timelinePhases && form.timelinePhases.length > 0) {
                const aiMap: Record<string, number> = {};
                form.timelinePhases.forEach((p: any) => {
                    const phaseStr = (p.phase || '').toLowerCase();
                    if (phaseStr.includes('concept')) aiMap['concept'] = p.days;
                    else if (phaseStr.includes('3d')) aiMap['3d'] = p.days;
                    else if (phaseStr.includes('triển khai') || phaseStr.includes('2d')) aiMap['2d'] = p.days;
                    else if (phaseStr.includes('construction') || phaseStr.includes('thi công') || phaseStr.includes('hồ sơ')) aiMap['construction'] = p.days;
                });
                
                kpiData = {
                    ...kpiData,
                    paused_days: kpiData?.paused_days || 0,
                    is_paused: kpiData?.is_paused || false,
                    taskPhaseMap: kpiData?.taskPhaseMap || {},
                    phases: {
                        'concept': { ...(kpiData?.phases?.['concept'] || {}), days_used: kpiData?.phases?.['concept']?.days_used || 0, days_estimated: aiMap['concept'] || kpiData?.phases?.['concept']?.days_estimated || 0 },
                        '3d': { ...(kpiData?.phases?.['3d'] || {}), days_used: kpiData?.phases?.['3d']?.days_used || 0, days_estimated: aiMap['3d'] || kpiData?.phases?.['3d']?.days_estimated || 0 },
                        '2d': { ...(kpiData?.phases?.['2d'] || {}), days_used: kpiData?.phases?.['2d']?.days_used || 0, days_estimated: aiMap['2d'] || kpiData?.phases?.['2d']?.days_estimated || 0 },
                        'construction': { ...(kpiData?.phases?.['construction'] || {}), days_used: kpiData?.phases?.['construction']?.days_used || 0, days_estimated: aiMap['construction'] || kpiData?.phases?.['construction']?.days_estimated || 0 },
                    }
                };
            }

            const mergedOtherInfo = {
                ...existingOtherInfo,
                budget: form.budget || 0,
                scale: form.scale || '',
                project_type: form.project_type || '',
                ...(kpiData ? { kpiData } : {})
            };

            const payload = {
                ...cleanForm,
                manager_id: cleanForm.manager_id || null,
                description: cleanForm.description || null,
                start_date: cleanForm.start_date || null,
                end_date: cleanForm.end_date || null,
                other_info: JSON.stringify(mergedOtherInfo),
                link_hien_trang: cleanForm.link_hien_trang || null,
                link_du_an: cleanForm.link_du_an || null,
                link_presentation: cleanForm.link_presentation || null,
            }

            let result;
            if (editingProject) {
                // IF project_code changed, we must cascade the prefix update to all child tasks
                if (form.project_code !== editingProject.project_code && editingProject.project_code) {
                    const oldPrefix = editingProject.project_code;
                    const newPrefix = form.project_code;

                    const { data: tasksToUpdate } = await supabase
                        .from('tasks')
                        .select('id, task_code')
                        .eq('project_id', editingProject.id);

                    if (tasksToUpdate && tasksToUpdate.length > 0) {
                        const updates = tasksToUpdate.map(t => {
                            let newCode = t.task_code || '';
                            if (newCode.startsWith(oldPrefix)) {
                                newCode = newCode.replace(oldPrefix, newPrefix);
                            }
                            return { id: t.id, task_code: newCode };
                        });

                        // Bulk update safely
                        await Promise.all(updates.map(u =>
                            supabase.from('tasks').update({ task_code: u.task_code }).eq('id', u.id)
                        ));
                    }
                }

                result = await supabase.from('projects').update(payload).eq('id', editingProject.id).select().single()
                if (unifiedProjectData?.project.id === editingProject.id) {
                    setUnifiedProjectData({ ...unifiedProjectData, project: { ...editingProject, ...payload } as Project })
                }
            } else {
                result = await supabase.from('projects').insert(payload).select().single()
                
                // If it's a new project and we have timeline phases, insert them as parent tasks
                if (result.data && form.timelinePhases && form.timelinePhases.length > 0) {
                    const projectId = result.data.id;
                    let currentStartDate = new Date(payload.start_date || new Date().toISOString().split('T')[0]);
                    
                    const addDaysSkipSundays = (startDate: Date, days: number) => {
                        let d = new Date(startDate);
                        let added = 0;
                        while (added < days) {
                            d.setDate(d.getDate() + 1);
                            if (d.getDay() !== 0) added++;
                        }
                        return d;
                    };

                    const phaseTasks = form.timelinePhases.map((p: any, idx: number) => {
                        const sDate = new Date(currentStartDate);
                        const eDate = addDaysSkipSundays(currentStartDate, p.days);
                        currentStartDate = eDate; // Next phase starts when this ends

                        return {
                            task_code: `${payload.project_code || 'PRJ'}-PHASE-${idx + 1}`,
                            name: `Giai đoạn ${idx + 1}: ${p.phase}`,
                            description: `Mốc thời gian dự kiến cho ${p.phase} (${p.days} ngày làm việc)`,
                            project_id: projectId,
                            status: 'Chưa bắt đầu',
                            priority: 'Trung bình',
                            completion_pct: 0,
                            is_planned_phase: true,
                            start_date: sDate.toISOString().split('T')[0],
                            due_date: eDate.toISOString().split('T')[0],
                        };
                    });

                    await supabase.from('tasks').insert(phaseTasks);
                }
            }

            if (result.error) {
                console.error('Supabase Error:', result.error)
                alert(`Lỗi Supabase: ${result.error.message} (Mã: ${result.error.code})`)
                return
            }

            setShowModal(false)
            fetchProjects()
        } catch (err) {
            console.error('Catch Error:', err)
            alert('Lỗi hệ thống khi lưu dự án. Vui lòng kiểm tra console.')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa dự án này?')) return
        await supabase.from('tasks').delete().eq('project_id', id)
        await supabase.from('projects').delete().eq('id', id)
        fetchProjects()
    }

    const handleCopy = async (p: Project) => {
        const { id, created_at, ...rest } = p as any
        const payload = {
            ...rest,
            project_code: generateNextProjectCode(),
            name: `${p.name} (Bản sao)`,
        }

        const { error } = await supabase.from('projects').insert(payload)
        if (error) {
            console.error('Copy Error:', error)
            alert(`Lỗi sao chép: ${error.message}`)
        } else {
            fetchProjects()
        }
    }

    const handleUpdateAssignee = async (taskId: string, assigneeId: string) => {
        // Optimistic UI update
        setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignee_id: assigneeId || null } : t));

        const { error } = await supabase.from('tasks').update({
            assignee_id: assigneeId || null
        }).eq('id', taskId)
        if (!error) {
            fetchTasks()
        } else {
            console.error('Update Assignee Error:', error)
            alert('Lỗi khi gán người phụ trách: ' + error.message)
            fetchTasks() // Revert on error
        }
    }

    const handleToggleTaskComplete = async (task: Task) => {
        const isCompleted = task.status?.includes('Hoàn thành')
        const newStatus = isCompleted ? 'Đang thực hiện' : 'Hoàn thành'
        const newPct = isCompleted ? 50 : 100
        const newDate = !isCompleted ? new Date().toISOString().split('T')[0] : null

        // Optimistic UI update
        setAllTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus, completion_pct: newPct, completion_date: newDate } : t));

        const { error } = await supabase.from('tasks').update({
            status: newStatus,
            completion_pct: newPct,
            completion_date: newDate
        }).eq('id', task.id)

        if (!error) fetchTasks()
    }

    const handleDeleteTask = async (id: string) => {
        if (!confirm('Xóa nhiệm vụ này?')) return
        // Optimistic UI update
        setAllTasks(prev => prev.filter(t => t.id !== id));
        
        const { error } = await supabase.from('tasks').delete().eq('id', id)
        if (!error) {
            fetchTasks()
        } else {
            console.error('Delete Task Error:', error)
            fetchTasks() // Revert on error
        }
    }

    const generateNextTaskCode = (projectId: string) => {
        const projTasks = allTasks.filter(t => t.project_id === projectId);
        let maxId = 0;
        projTasks.forEach(t => {
            const match = t.task_code.match(/-(\d+)$/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxId) maxId = num;
            }
        });
        const proj = projects.find(p => p.id === projectId);
        const projCode = proj?.project_code || '';
        return projCode ? `${projCode}-${String(maxId + 1).padStart(2, '0')}` : '';
    }

    const handleCopyTask = async (t: Task) => {
        try {
            const nextCode = generateNextTaskCode(t.project_id)
            const { id, created_at, ...rest } = t as any
            const payload = {
                ...rest,
                task_code: nextCode,
                name: `${t.name} (Bản sao)`,
                completion_pct: 0,
                result_links: null,
                output: null
            }
            const { error } = await supabase.from('tasks').insert(payload)
            if (!error) fetchTasks()
        } catch (err) {
            console.error(err)
        }
    }

    const openAddTaskModal = (projectId: string) => {
        setEditingTask(null);
        setTaskModalInitialData({ task_code: generateNextTaskCode(projectId), project_id: projectId });
        setShowTaskModal(true);
    }

    const openEditTaskModal = (t: Task) => {
        setEditingTask(t);
        setTaskModalInitialData({ task_code: t.task_code, project_id: t.project_id });
        setShowTaskModal(true);
    }

    const getStatusBadge = (status: string) => {
        if (status === 'Hoàn thành') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
        if (status === 'Đang thực hiện') return 'bg-blue-100 text-blue-700 border-blue-200'
        if (status === 'Tạm dừng') return 'bg-amber-100 text-amber-700 border-amber-200'
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }

    const getTrafficLight = (project: Project) => {
        const progress = getProjectProgress(project.id);
        
        let remainingDays = 0;
        let totalDays = 1;
        if (project.start_date && project.end_date) {
            const start = new Date(project.start_date);
            const end = new Date(project.end_date);
            const today = new Date();
            totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            remainingDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }

        const expectedProgress = Math.max(0, Math.min(100, 100 - (remainingDays / totalDays) * 100));
        
        if (project.status === 'Hoàn thành' || project.status === 'Hủy bỏ') return 'gray';
        if (project.status === 'Chưa bắt đầu' || project.status === 'Mới') return 'blue';

        // Mocking actual cost since it isn't strictly tracked in the `projects` table for this demo
        const mockActualCost = project.budget ? project.budget * (progress / 100) * 1.05 : 0; 
        
        const delay = expectedProgress - progress;
        const overBudget = project.budget ? (mockActualCost / project.budget) > 1 : false;

        if (delay > 15) return 'red'; // Chậm > 15% -> Nguy hiểm đỏ
        if (delay > 5 || overBudget) return 'yellow'; // Chậm > 5% hoặc vượt tiền -> Vàng
        return 'green'; // Mọi thứ Ổn -> Xanh
    }

    const renderTrafficLight = (project: Project) => {
        const light = getTrafficLight(project);
        return (
            <div className="flex gap-1 bg-slate-100 border border-slate-200 p-1.5 rounded-full shadow-inner items-center ml-2" title={light === 'green' ? 'Ổn định' : light === 'yellow' ? 'Cảnh báo chậm/vượt ngân sách' : light === 'red' ? 'Rủi ro cao' : ''}>
                <div className={`w-2.5 h-2.5 rounded-full shadow-sm transition-all ${light === 'red' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse' : 'bg-slate-300'}`}></div>
                <div className={`w-2.5 h-2.5 rounded-full shadow-sm transition-all ${light === 'yellow' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse' : 'bg-slate-300'}`}></div>
                <div className={`w-2.5 h-2.5 rounded-full shadow-sm transition-all ${light === 'green' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-slate-300'}`}></div>
            </div>
        );
    }

    const getManagerName = (id: string) => {
        return profiles.find(p => p.id === id)?.full_name || id
    }

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quản lý dự án</h1>
                    <div className="flex bg-slate-50/80 rounded-xl p-1 gap-1 border border-slate-100">
                        <button
                            onClick={() => setProjectViewMode('cards')}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all ${projectViewMode === 'cards' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <LayoutGrid size={16} /> Dự án
                        </button>
                        <button
                            onClick={() => setProjectViewMode('list')}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all ${projectViewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <List size={16} /> Danh sách
                        </button>
                    </div>
                    {/* Scope Filter */}
                    <div className="flex bg-slate-50/80 rounded-xl p-1 gap-1 border border-slate-100 ml-0 sm:ml-4 mt-2 sm:mt-0">
                        <button
                            onClick={() => setViewScope('mine')}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all ${viewScope === 'mine' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Của tôi
                        </button>
                        <button
                            onClick={() => setViewScope('all')}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all ${viewScope === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Tất cả
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm dự án..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-[#5534FA]/20 focus:border-[#5534FA] transition-all font-medium placeholder:text-slate-400 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-[#5534FA] hover:bg-[#462ae0] text-white px-5 py-2.5 rounded-[14px] text-[15px] font-bold transition-colors flex items-center gap-2 whitespace-nowrap shadow-[0_4px_12px_rgba(85,52,250,0.25)]"
                    >
                        <Plus size={18} strokeWidth={2.5} /> Tạo mới dự án
                    </button>
                </div>
            </div>

            {/* Status Tabs - Circular style matching screenshot */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {Object.entries(statusCounts).map(([status, count]) => {
                    const isCompleted = status === 'Hoàn thành';
                    const isDoing = status === 'Đang thực hiện';
                    const isPause = status === 'Tạm dừng';
                    
                    return (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                            className={`bg-white border p-5 rounded-[20px] flex flex-col items-center justify-center gap-3 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] ${statusFilter === status ? 'border-[#5534FA] ring-2 ring-[#5534FA]/10' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                            <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center font-bold text-[22px] ${
                                isCompleted ? 'bg-emerald-50 text-emerald-600' :
                                isDoing ? 'bg-blue-50 text-blue-600' :
                                isPause ? 'bg-orange-50 text-orange-500' : 
                                'bg-slate-50 text-slate-700'
                                }`}>
                                {count}
                            </div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{status}</span>
                        </button>
                    );
                })}
            </div>

            {/* Project Cards */}
            {projectViewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => {
                    const progress = getProjectProgress(project.id);
                    const isManagerOrAdmin = ['Admin', 'Quản lý', 'Giám đốc', 'Quản lý thiết kế', 'Quản lý thi công'].includes(profile?.role?.trim() || '');
                    return (
                        <div key={project.id} onClick={() => openUnifiedModal(project, 'tasks')} className="glass-card p-6 shadow-sm hover:shadow-xl transition-all relative group transform hover:-translate-y-1 cursor-pointer">
                            {/* Progress Bar Top */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 rounded-t-2xl overflow-hidden">
                                <div className={`h-full transition-all duration-500 ease-out ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }}></div>
                            </div>
                            
                            {/* Top Actions */}
                            <div className="flex justify-between items-start mb-4 mt-2">
                                <div className="flex items-center">
                                    <span className={`px-2.5 py-1 z-10 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap ${getStatusBadge(project.status)}`}>
                                        {project.status}
                                    </span>
                                    {renderTrafficLight(project)}
                                </div>
                                {(() => {
                                    const isMine = project.manager_id === profile?.id || filteredAllTasks.some(t => t.project_id === project.id);
                                    const canEdit = isManagerOrAdmin || isMine;
                                    if (!canEdit) return null;
                                    return (
                                        <div className="flex gap-1.5 translate-x-1 -translate-y-1">
                                            <button onClick={(e) => { e.stopPropagation(); openAddTaskModal(project.id); }} className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-all shadow-sm border border-blue-100" title="Tạo nhiệm vụ"><Plus size={14} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleCopy(project) }} className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition-all shadow-sm border border-emerald-100" title="Sao chép"><Copy size={14} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); openEditModal(project) }} className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-all shadow-sm border border-blue-100" title="Sửa"><Edit3 size={14} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(project.id) }} className="w-8 h-8 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all shadow-sm border border-red-100" title="Xóa"><Trash2 size={14} /></button>
                                        </div>
                                    );
                                })()}
                            </div>
                            
                            <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight group-hover:text-blue-600 transition-colors uppercase italic tracking-tighter">{project.name}</h3>
                            <div className="text-[10px] font-bold text-slate-400 mb-3 tracking-widest">{project.project_code}</div>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8 font-medium">{project.description || 'Không có mô tả chi tiết cho dự án này.'}</p>
                            
                            <div className="space-y-3 mb-6 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600"><Calendar size={14} className="text-emerald-500" /><span>Bắt đầu: {project.start_date ? format(parseISO(project.start_date), 'dd/MM/yyyy') : 'N/A'}</span></div>
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600"><Calendar size={14} className="text-rose-500" /><span>Kết thúc: {project.end_date ? format(parseISO(project.end_date), 'dd/MM/yyyy') : 'N/A'}</span></div>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 pt-1"><Users size={14} className="text-indigo-500" /><span>Quản lý: {getManagerName(project.manager_id || '')}</span></div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button onClick={(e) => { e.stopPropagation(); openUnifiedModal(project, 'tasks'); }} className="w-full md:w-auto px-5 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 text-sm font-bold transition-all shadow-sm hover:shadow">
                                    <List size={16} /> {(() => {
                                        const pTasks = allTasks.filter(t => t.project_id === project.id);
                                        const doneCount = pTasks.filter(t => t.status === 'Hoàn thành').length;
                                        return `Nhiệm vụ (${doneCount}/${pTasks.length})`;
                                    })()}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            )}

            {/* List View - Tasks grouped by project → phase → task */}
            {projectViewMode === 'list' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {filteredProjects.map(project => {
                    const projTasks = allTasks.filter(t => t.project_id === project.id && !t.parent_id);
                    
                    // Group tasks by phase
                    const phaseGroups: Record<string, typeof projTasks> = {};
                    DEFAULT_PHASES.forEach(p => { phaseGroups[p.key] = []; });
                    projTasks.forEach(t => {
                        const pk = detectPhase(t);
                        if (!phaseGroups[pk]) phaseGroups[pk] = [];
                        phaseGroups[pk].push(t);
                    });

                    const togglePhase = (phaseId: string) => {
                        setExpandedPhases(prev => {
                            const next = new Set(prev);
                            if (next.has(phaseId)) next.delete(phaseId);
                            else next.add(phaseId);
                            return next;
                        });
                    };

                    const activeTasks = projTasks.filter(t => t.status !== 'Hoàn thành');

                    const TaskRow = ({ t }: { t: typeof projTasks[0] }) => {
                        const isDone = t.status === 'Hoàn thành'
                        const isLate = t.due_date && new Date(t.due_date) < new Date() && !isDone
                        const assignee = profiles.find(p => p.id === (Array.isArray(t.assignee_id) ? t.assignee_id[0] : t.assignee_id))?.full_name || 'Chưa gán'
                        return (
                            <div className={`border-b border-slate-50 hover:bg-slate-50/50 ${isDone ? 'opacity-60' : ''}`}>
                                <div className="hidden md:grid grid-cols-[1fr_1fr_80px_80px_100px_100px] gap-2 px-5 pl-12 py-2 items-center">
                                    <div className={`text-xs font-semibold truncate cursor-pointer ${isDone ? 'line-through text-slate-400' : 'text-slate-800 hover:text-indigo-600'}`} onClick={() => openEditTaskModal(t)}>{t.name || 'N/A'}</div>
                                    <div className="text-[11px] text-slate-500 truncate">{(t as any).description || '—'}</div>
                                    <span className={`text-[11px] font-semibold ${isLate ? 'text-red-600' : 'text-slate-600'}`}>{t.due_date ? format(parseISO(t.due_date), 'dd/MM') : '—'}</span>
                                    <span className="text-[11px] font-semibold text-slate-600">{t.completion_pct || 0}%</span>
                                    <span className="text-[11px] text-slate-600 truncate">{assignee}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md text-center ${isDone ? 'bg-emerald-100 text-emerald-700' : t.status === 'Đang thực hiện' ? 'bg-blue-100 text-blue-700' : t.status === 'Cần làm' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{t.status}</span>
                                </div>
                                <div className="md:hidden flex flex-col gap-1.5 px-4 py-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className={`text-sm font-semibold truncate cursor-pointer flex-1 ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`} onClick={() => openEditTaskModal(t)}>{t.name || 'N/A'}</div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${isDone ? 'bg-emerald-100 text-emerald-700' : t.status === 'Đang thực hiện' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{t.status}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                                        <span className="truncate max-w-[150px]">👤 {assignee}</span>
                                        <div className="flex items-center gap-3 font-semibold">
                                            <span className={isLate ? 'text-red-600' : ''}>🗓 {t.due_date ? format(parseISO(t.due_date), 'dd/MM') : '—'}</span>
                                            <span className="text-indigo-600 bg-indigo-50 px-1.5 rounded">{t.completion_pct || 0}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    return (
                        <div key={project.id} className="border-b border-slate-100 last:border-0">
                            {/* Project Header (Cấp 1) */}
                            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusBadge(project.status)}`}>{project.status}</span>
                                    <span className="text-sm font-bold text-slate-800">{project.name}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">{project.project_code}</span>
                                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">{activeTasks.length}</span>
                                </div>
                                {(() => {
                                    const isMine = project.manager_id === profile?.id || filteredAllTasks.some(t => t.project_id === project.id);
                                    const canEdit = isManagerOrAdmin || isMine;
                                    if (!canEdit) return null;
                                    return (
                                        <button onClick={() => openAddTaskModal(project.id)} className="text-[11px] font-bold text-emerald-600 hover:bg-emerald-100 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">+ Thêm</button>
                                    );
                                })()}
                            </div>

                            {projTasks.length === 0 ? (
                                <div className="px-5 py-3 text-xs text-slate-400 italic">Chưa có nhiệm vụ</div>
                            ) : (
                                <div>
                                    {/* Table Header */}
                                    <div className="hidden md:grid grid-cols-[1fr_1fr_80px_80px_100px_100px] gap-2 px-5 pl-12 py-1.5 bg-slate-50/50 border-b border-slate-100">
                                        {['Nhiệm vụ','Mô tả','Hạn chót','Tiến độ','Phụ trách','Trạng thái'].map(h => <span key={h} className="text-[9px] font-semibold text-slate-400 uppercase">{h}</span>)}
                                    </div>

                                    {/* Phase Groups (Cấp 2) */}
                                    {DEFAULT_PHASES.map(phase => {
                                        const phaseTasks = phaseGroups[phase.key] || [];
                                        if (phaseTasks.length === 0) return null;
                                        const phaseId = `${project.id}_${phase.key}`;
                                        const isPhaseExpanded = expandedPhases.has(phaseId);
                                        const phaseActiveTasks = phaseTasks.filter(t => t.status !== 'Hoàn thành');
                                        const phaseDoneTasks = phaseTasks.filter(t => t.status === 'Hoàn thành');

                                        return (
                                            <div key={phase.key}>
                                                {/* Phase Header */}
                                                <button
                                                    onClick={() => togglePhase(phaseId)}
                                                    className="flex items-center gap-2 w-full px-5 pl-7 py-2 bg-blue-50/50 hover:bg-blue-50 border-b border-slate-100 transition-colors text-left"
                                                >
                                                    {isPhaseExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                                                    <span className="text-[11px] font-bold text-slate-700">{phase.name}</span>
                                                    <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">{phaseActiveTasks.length}</span>
                                                    {phaseDoneTasks.length > 0 && (
                                                        <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold">✓ {phaseDoneTasks.length}</span>
                                                    )}
                                                </button>

                                                {/* Tasks inside phase (Cấp 3) */}
                                                {isPhaseExpanded && (
                                                    <div>
                                                        {phaseActiveTasks.map(t => <TaskRow key={t.id} t={t} />)}
                                                        {phaseDoneTasks.length > 0 && (
                                                            <>
                                                                <button
                                                                    onClick={() => toggleDoneProject(phaseId)}
                                                                    className="flex items-center gap-2 px-5 pl-12 py-2 w-full text-left hover:bg-slate-50 transition-colors border-t border-slate-50"
                                                                >
                                                                    <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${expandedDoneProjects.has(phaseId) ? '' : '-rotate-90'}`} />
                                                                    <span className="text-[10px] text-slate-400">Hoàn tất {phaseDoneTasks.length} mục</span>
                                                                </button>
                                                                {expandedDoneProjects.has(phaseId) && phaseDoneTasks.map(t => <TaskRow key={t.id} t={t} />)}
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            )}

            {/* Modal */}
            <AddEditProjectModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                editingProject={editingProject}
                form={form}
                setForm={setForm}
                profiles={profiles}
                currentUserProfile={profile}
            />

            {/* Unified Project Modal (Tasks, Info, Timeline) */}
            <UnifiedProjectModal
                isOpen={!!unifiedProjectData}
                onClose={() => { setUnifiedProjectData(null); fetchProjects(); }}
                project={unifiedProjectData?.project || null}
                initialTab={unifiedProjectData?.tab}
                // Tasks props
                tasks={allTasks}
                profiles={profiles}
                currentUserProfile={profile}
                onToggleComplete={handleToggleTaskComplete}
                onAddTask={(projectId) => {
                    const p = projects.find(p => p.id === projectId);
                    if (p) {
                        setTaskModalInitialData({ project_id: projectId, task_code: `${p.project_code}-` });
                        setEditingTask(null);
                        setShowTaskModal(true);
                    }
                }}
                onEditTask={(task) => {
                    setEditingTask(task);
                    setTaskModalInitialData({ project_id: task.project_id || '', task_code: task.task_code || '' });
                    setShowTaskModal(true);
                }}
                onDeleteTask={handleDeleteTask}
                onCopyTask={handleCopyTask}
                onUpdateAssignee={handleUpdateAssignee}
                
                // Info props
                onSaveProject={handleSave}
                form={form}
                setForm={setForm}

                // Timeline props
                managerName={unifiedProjectData?.project?.manager_id ? profiles.find(p => p.id === unifiedProjectData.project.manager_id)?.full_name : undefined}
                onUpdateProjectStats={() => fetchProjects(true)}
                canEdit={(() => {
                    if (!unifiedProjectData?.project) return false;
                    const p = unifiedProjectData.project;
                    const isManagerOrAdmin = ['Admin', 'Quản lý', 'Giám đốc', 'Quản lý thiết kế', 'Quản lý thi công'].includes(profile?.role?.trim() || '');
                    const isMine = p.manager_id === profile?.id || allTasks.some(t => t.project_id === p.id && (t.assignee_id === profile?.id || t.supporter_id === profile?.id));
                    return isManagerOrAdmin || isMine;
                })()}
            />

            {/* Add/Edit Task Modal */}
            <AddEditTaskModal
                isOpen={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                onSaved={() => {
                    setShowTaskModal(false);
                    fetchTasks();
                }}
                editingTask={editingTask}
                initialData={taskModalInitialData}
                projects={projects}
                profiles={profiles}
                currentUserProfile={profile}
                generateNextTaskCode={generateNextTaskCode}
            />
        </div>
    )
}
