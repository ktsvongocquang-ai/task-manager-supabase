import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { addDays, subDays, format } from 'date-fns'
import { Plus, FileText, Camera, StickyNote, Bell, ClipboardCheck, BellRing, Home, LayoutGrid, LayoutDashboard, Search, Users, CalendarDays, X, HardHat, ChevronRight, ExternalLink } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useSiteData } from '../../hooks/useSiteData'
import { supabase } from '../../services/supabase'
import { ProjectManagementAIModule } from '../construction/ProjectManagement'
import { ImportQuotationModal } from '../construction/ImportQuotationModal'
import { SuggestedFlowWizard } from '../construction/SuggestedFlowWizard'
import { EditProjectMembersModal } from './EditProjectMembersModal'
import { DiaryTab } from './DiaryTab'
import { AcceptanceTab } from './AcceptanceTab'
import { RemindersTab } from './RemindersTab'
// Hồ sơ thiết kế (bản vẽ, ghim lỗi) vẫn ở app sdqh — mở bằng liên kết ngoài.
const SITE_DOCS_URL = 'https://sdqh.vercel.app/construction'

const CAN_MANAGE_ROLES = new Set(['Admin', 'Quản lý thi công', 'Quản lý thiết kế'])
// Các vai trò chỉ xem được dự án được giao (bảng construction_project_members) — Admin xem toàn bộ.
const RESTRICTED_ROLES = new Set(['Quản lý thi công', 'Giám Sát', 'Quản lý thiết kế'])

type Tab = 'progress' | 'diary' | 'acceptance' | 'reminders' | 'sitedocs'
type DiaryMode = 'full' | 'photo' | 'note'

/**
 * Màn Công trường cho giám sát (gộp nguyên từ app sdqh, không bỏ chức năng):
 * Trang chủ + 5 nút nhanh (Nhật ký, Kế hoạch, Ảnh & Ghi chú, Nhắc việc, Nghiệm thu), Tiến độ (Gantt +/− ngày,
 * Xuất PDF, Chia sẻ, Tạo từ file), Nhật ký có hạng mục/đánh dấu lỗi/gửi nội bộ/gửi khách.
 * Thêm: lối vào Trạm GS (hạn 17:00, vật tư, phát sinh, biểu mẫu GS-01…10) và thao tác nhanh qua ?do=.
 */
export const SiteHome = () => {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { profile } = useAuthStore()
    const {
        projects, loading: projectsLoading, tasks,
        logs, dailyLogItems, loadProjectDetails, submitDailyLog, updateDailyLog, deleteDailyLog, saveDailyLogItems, deleteDailyLogItemsForLog,
        acceptances, acceptanceItems, createAcceptance, updateAcceptanceItemResult, updateAcceptanceStatus, deleteAcceptance,
        reminders, createReminder, toggleReminderStatus, updateReminder, deleteReminder,
        replaceTimelineTasks, createTimelineTasks,
    } = useSiteData()

    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [tab, setTab] = useState<Tab | null>(null)
    // undefined = vào tab Nhật ký chỉ xem danh sách (form đóng) — chỉ set thành 'full'/'photo'/'note'
    // khi bấm 1 trong các nút tạo nhanh (quick action / nút + nổi), để form tự mở ngay.
    const [diaryInitialMode, setDiaryInitialMode] = useState<DiaryMode | undefined>(undefined)
    const [diaryFormKey, setDiaryFormKey] = useState(0)
    // Bấm 1 dòng nhật ký cụ thể ở "Hoạt động gần đây" -> mở thẳng form sửa đúng dòng đó.
    const [diaryEditLogId, setDiaryEditLogId] = useState<string | undefined>(undefined)
    // Nhật ký: xem theo dự án đang chọn (mặc định, như cũ) hoặc gộp tất cả dự án đang xem được —
    // chỉ để lướt nhanh, bấm vào 1 dòng sẽ chuyển sang đúng dự án đó rồi mở danh sách Nhật ký.
    const [diaryScope, setDiaryScope] = useState<'project' | 'all'>('project')
    const [loadingAllDiary, setLoadingAllDiary] = useState(false)
    const [allDiaryLogs, setAllDiaryLogs] = useState<{ id: string; projectId: string; projectName: string; date: string; workItem: string | null; isIssue: boolean }[]>([])
    // Nhắc việc: cùng kiểu toggle như Nhật ký — "Tất cả dự án" gộp nhắc việc của mọi dự án đang xem
    // được, hiện rõ ai được gán (nhân sự hệ thống hoặc tổ đội ngoài gõ tay) để biết việc đó của ai.
    const [remindersScope, setRemindersScope] = useState<'project' | 'all'>('project')
    const [loadingAllReminders, setLoadingAllReminders] = useState(false)
    const [allReminders, setAllReminders] = useState<{ id: string; projectId: string; projectName: string; title: string; dueDate: string | null; assigneeName: string | null; status: 'pending' | 'done' }[]>([])
    const [profileOptions, setProfileOptions] = useState<{ id: string; full_name: string; role?: string }[]>([])
    const [showOverview, setShowOverview] = useState(false)
    const [overviewSearch, setOverviewSearch] = useState('')
    const [assignedProjectIds, setAssignedProjectIds] = useState<string[] | null>(null)
    const [showMemberModal, setShowMemberModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [showSuggestedFlow, setShowSuggestedFlow] = useState(false)
    // Ép ProjectManagementAIModule remount (tự tải lại task) sau khi Import AI ghi đè timeline —
    // module tự fetch construction_tasks theo projectId, không có cách refetch thủ công từ ngoài.
    const [ganttRefreshKey, setGanttRefreshKey] = useState(0)
    // Tab "Hồ sơ thiết kế" nhúng nguyên cả App con (tự tải toàn bộ projects/floor_plans/doc_links
    // riêng) — trước đây unmount/remount mỗi lần chuyển tab qua lại nên bị lag rõ rệt mỗi lần bấm
    // vào. Giữ App mounted (chỉ ẩn bằng CSS) khi chuyển sang tab khác trong CÙNG 1 dự án; chỉ thật
    // sự remount khi đổi sang dự án khác (key đổi), vì App chỉ đọc embedProjectId đúng 1 lần lúc mount.
    // "Chụp ảnh" + "Ghi chú" gộp lại 1 nút quick-action, bấm ra hiện 2 lựa chọn nhỏ thay vì
    // chiếm 2 icon riêng — nhường chỗ cho nút "Kế hoạch" mới.
    const [showPhotoNoteMenu, setShowPhotoNoteMenu] = useState(false)
    // "Kế hoạch" — tổng hợp Công việc hôm nay/Kế hoạch ngày mai của TẤT CẢ dự án đang xem được,
    // lấy từ nhật ký mới nhất mỗi dự án, để giám sát không phải mở từng dự án một mới biết hôm
    // nay/mai cần lo gì ở công trình nào.
    const [showPlanModal, setShowPlanModal] = useState(false)
    const [loadingPlan, setLoadingPlan] = useState(false)
    type PlanTask = { name: string; checklistCount: number }
    const [planData, setPlanData] = useState<{
        projectId: string; projectName: string; logDate: string | null;
        todaySummary: string | null; tomorrowPlan: string | null;
        todayTasks: PlanTask[]; tomorrowTasks: PlanTask[];
        checklistToday: { label: string; completed: boolean }[];
        checklistTomorrow: { label: string; completed: boolean }[];
    }[]>([])

    // Danh sách nhân sự thuộc vai trò bị giới hạn — dùng cho ô chọn "thành viên dự án" (Tạo dự án + sửa sau).
    const managerStaff = profileOptions.filter(p => RESTRICTED_ROLES.has(p.role || ''))
    // Danh sách rút gọn cho ô "Người phụ trách" ở Nhắc việc — chỉ người thật sự xử lý việc công trường,
    // không hiện Sale/Marketing/Khách hàng/Thiết kế... như danh sách nhân sự đầy đủ.
    const reminderAssignees = profileOptions.filter(p => ['Quản lý thi công', 'Giám Sát', 'Admin'].includes(p.role || ''))

    const canManage = CAN_MANAGE_ROLES.has(profile?.role || '')
    // Chỉ Admin được gán/bỏ thành viên dự án — Quản lý thi công/Giám Sát/Quản lý thiết kế dù canManage
    // nội dung dự án (Gantt, nhật ký, nghiệm thu...) vẫn không được tự cấp quyền xem cho người khác.
    const isAdmin = profile?.role === 'Admin'
    // Admin và các vai trò không nằm trong RESTRICTED_ROLES không bị giới hạn, giữ nguyên hành vi cũ (xem toàn bộ).
    const isRestrictedRole = RESTRICTED_ROLES.has(profile?.role || '')
    // Vai trò bị giới hạn: trong lúc chưa tải xong assignedProjectIds (null), coi như CHƯA có gì
    // được phép xem (mảng rỗng) — tuyệt đối không fallback về "toàn bộ projects", nếu không sẽ có
    // 1 khoảng hở (trước khi fetch xong) hiện lộ hết dự án và có thể bị auto-select nhầm.
    // Chưa được gán dự án nào (bảng thành viên trống) -> tạm thấy mọi công trình, kèm nhắc Admin gán.
    const noAssignment = isRestrictedRole && !!assignedProjectIds && assignedProjectIds.length === 0
    const visibleProjects = useMemo(() => isRestrictedRole
        ? (assignedProjectIds ? (assignedProjectIds.length ? projects.filter(p => assignedProjectIds.includes(p.id)) : projects) : [])
        : projects, [isRestrictedRole, assignedProjectIds, projects])
    const selectedProject = visibleProjects.find(p => p.id === selectedProjectId)

    useEffect(() => {
        if (!isRestrictedRole || !profile?.id) { setAssignedProjectIds(null); return }
        supabase.from('construction_project_members').select('project_id').eq('user_id', profile.id).then(({ data }) => {
            setAssignedProjectIds((data || []).map((r: any) => r.project_id))
        })
    }, [isRestrictedRole, profile?.id])

    useEffect(() => {
        if (visibleProjects.length === 0) {
            if (selectedProjectId) setSelectedProjectId(null)
            return
        }
        if (!selectedProjectId || !visibleProjects.some(p => p.id === selectedProjectId)) {
            setSelectedProjectId(visibleProjects[0].id)
        }
    }, [visibleProjects, selectedProjectId])

    useEffect(() => {
        if (selectedProjectId) loadProjectDetails(selectedProjectId)
    }, [selectedProjectId, loadProjectDetails])

    useEffect(() => {
        supabase.from('profiles').select('id, full_name, role').order('full_name').then(({ data }) => {
            if (data) setProfileOptions(data as any)
        })
    }, [])

    const openQuickAction = (mode: DiaryMode) => {
        setDiaryScope('project')
        setDiaryInitialMode(mode)
        setTab('diary')
        setDiaryFormKey(k => k + 1) // buộc DiaryTab mở lại form với initialMode mới
    }

    /** Vào tab Nhật ký để XEM danh sách — không tự mở form tạo mới. */
    const openDiaryList = () => {
        setDiaryScope('project')
        setDiaryInitialMode(undefined)
        setDiaryEditLogId(undefined)
        setDiaryFormKey(k => k + 1)
        setTab('diary')
    }

    /** Bấm 1 dòng cụ thể ở "Hoạt động gần đây" -> vào tab Nhật ký và mở thẳng form sửa đúng dòng đó. */
    const openDiaryEditLog = (logId: string) => {
        setDiaryScope('project')
        setDiaryInitialMode(undefined)
        setDiaryEditLogId(logId)
        setDiaryFormKey(k => k + 1)
        setTab('diary')
    }

    /** Tách từng dòng ghi tay (today_summary/tomorrow_plan) thành bullet "- " đồng nhất — tự bỏ ký
     * hiệu gạch đầu dòng cũ, viết hoa chữ cái đầu (cùng quy tắc với toBullets bên Nhật ký). */
    const toPlanBullets = (text?: string | null): string[] =>
        (text || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
            const clean = l.replace(/^[-•✔️❗📅]\s*/, '')
            return `- ${clean.charAt(0).toUpperCase() + clean.slice(1)}`
        })

    /** Tổng hợp Kế hoạch hôm nay/ngày mai của mọi dự án đang xem được, gộp 2 nguồn:
     * 1. Bảng tiến độ (construction_tasks) — việc chưa xong, theo lịch đang chạy đúng hôm nay/ngày
     *    mai (cùng logic "Gợi ý việc ngày mai" bên Nhật ký) — nguồn chính, luôn có sẵn vì Gantt
     *    hầu như dự án nào cũng đã lên lịch. Kèm số mục checklist nghiệm thu (kể cả mục do AI đề
     *    xuất) của từng việc để giám sát biết việc đó có tiêu chí cần kiểm tra hay không.
     * 2. Dòng nhật ký mới nhất mỗi dự án (today_summary/tomorrow_plan/checklist) — bổ sung thêm,
     *    NHƯNG phải dịch ngày cho đúng logic thực tế: giám sát mở app mỗi SÁNG, lúc đó nhật ký hôm
     *    nay THƯỜNG CHƯA được ghi (chỉ ghi cuối ngày) — nên dòng nhật ký gần nhất thường là của HÔM
     *    QUA. "Kế hoạch ngày mai" ghi trong đó chính là kế hoạch cho HÔM NAY (từ góc nhìn hôm qua),
     *    không phải cho ngày mai nữa. Vì vậy:
     *    - Nếu dòng nhật ký gần nhất là CỦA HÔM NAY (đã lỡ ghi trong ngày) -> giữ nguyên: today_summary
     *      thuộc về Hôm nay, tomorrow_plan/checklist thuộc về Ngày mai.
     *    - Nếu dòng gần nhất là CỦA HÔM QUA -> tomorrow_plan/checklist hôm qua ghi thật ra là cho
     *      HÔM NAY, dồn hết sang khối Hôm nay; không có nguồn ghi tay đáng tin cho Ngày mai (chỉ còn
     *      dựa vào Bảng tiến độ).
     *    - Nếu dòng gần nhất cũ hơn hôm qua -> bỏ qua nội dung ghi tay (đã lỗi thời), chỉ dùng Bảng tiến độ. */
    const openPlanOverview = async () => {
        setShowPlanModal(true)
        setLoadingPlan(true)
        try {
            const ids = visibleProjects.map(p => p.id)
            if (ids.length === 0) { setPlanData([]); return }

            const todayStr = format(new Date(), 'yyyy-MM-dd')
            const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd')
            const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd')
            const computeEnd = (t: any): string | null => {
                if (t.end_date) return t.end_date
                if (!t.start_date) return null
                return format(addDays(new Date(t.start_date), Math.max(1, t.days || 1) - 1), 'yyyy-MM-dd')
            }
            const toPlanTask = (t: any): PlanTask => ({
                name: t.name,
                checklistCount: Array.isArray(t.checklist) ? t.checklist.length : 0,
            })

            const [logsRes, tasksRes] = await Promise.all([
                supabase.from('daily_logs').select('project_id, date, today_summary, tomorrow_plan, checklist').in('project_id', ids).order('date', { ascending: false }),
                supabase.from('construction_tasks').select('project_id, name, status, start_date, end_date, days, checklist').in('project_id', ids),
            ])

            const notesByProject = new Map<string, { date: string; todaySummary: string | null; tomorrowPlan: string | null; checklist: { label: string; completed: boolean }[] }>()
            ;(logsRes.data || []).forEach((row: any) => {
                if (notesByProject.has(row.project_id)) return
                notesByProject.set(row.project_id, {
                    date: row.date, todaySummary: row.today_summary, tomorrowPlan: row.tomorrow_plan,
                    checklist: Array.isArray(row.checklist) ? row.checklist : [],
                })
            })

            const tasksByProject = new Map<string, any[]>()
            ;(tasksRes.data || []).forEach((t: any) => {
                const arr = tasksByProject.get(t.project_id) || []
                arr.push(t)
                tasksByProject.set(t.project_id, arr)
            })

            const result = ids.map(pid => {
                const proj = visibleProjects.find(p => p.id === pid)
                const tasks = tasksByProject.get(pid) || []
                const activeTasks = tasks.filter(t => t.status !== 'DONE' && t.start_date)
                const todayTasks = activeTasks
                    .filter(t => t.start_date <= todayStr && (computeEnd(t) === null || (computeEnd(t) as string) >= todayStr))
                    .map(toPlanTask)
                const tomorrowTasks = activeTasks
                    .filter(t => t.start_date <= tomorrowStr && (computeEnd(t) === null || (computeEnd(t) as string) >= tomorrowStr))
                    .map(toPlanTask)
                const note = notesByProject.get(pid)

                let todaySummary: string | null = null
                let tomorrowPlan: string | null = null
                let checklistToday: { label: string; completed: boolean }[] = []
                let checklistTomorrow: { label: string; completed: boolean }[] = []
                if (note) {
                    if (note.date === todayStr) {
                        // Đã ghi trong ngày hôm nay — giữ nguyên ý nghĩa gốc.
                        todaySummary = note.todaySummary
                        tomorrowPlan = note.tomorrowPlan
                        checklistTomorrow = note.checklist
                    } else if (note.date === yesterdayStr) {
                        // Ghi hôm qua — "kế hoạch ngày mai" của hôm qua chính là kế hoạch cho HÔM NAY.
                        todaySummary = note.tomorrowPlan
                        checklistToday = note.checklist
                    }
                    // Cũ hơn hôm qua: bỏ qua nội dung ghi tay, coi như không có.
                }

                return {
                    projectId: pid,
                    projectName: proj?.name || 'Dự án',
                    logDate: note?.date || null,
                    todaySummary,
                    tomorrowPlan,
                    todayTasks,
                    tomorrowTasks,
                    checklistToday,
                    checklistTomorrow,
                }
            }).filter(p => p.todayTasks.length > 0 || p.tomorrowTasks.length > 0 || p.todaySummary || p.tomorrowPlan || p.checklistToday.length > 0 || p.checklistTomorrow.length > 0)

            setPlanData(result)
        } finally {
            setLoadingPlan(false)
        }
    }

    /** Nhật ký gộp tất cả dự án đang xem được — chỉ để lướt nhanh xem dự án nào vừa ghi gì, không
     * hiện đủ chi tiết (ảnh/checklist) như danh sách Nhật ký của 1 dự án. Bấm vào 1 dòng sẽ chuyển
     * sang đúng dự án đó rồi mở danh sách Nhật ký (an toàn hơn nhảy thẳng vào sửa vì dữ liệu dự án
     * mới chọn cần thời gian tải xong). */
    const loadAllDiaryLogs = async () => {
        setLoadingAllDiary(true)
        try {
            const ids = visibleProjects.map(p => p.id)
            if (ids.length === 0) { setAllDiaryLogs([]); return }
            const { data } = await supabase
                .from('daily_logs')
                .select('id, project_id, date, work_item, is_issue')
                .in('project_id', ids)
                .order('date', { ascending: false })
                .limit(40)
            setAllDiaryLogs((data || []).map((row: any) => ({
                id: row.id,
                projectId: row.project_id,
                projectName: visibleProjects.find(p => p.id === row.project_id)?.name || 'Dự án',
                date: row.date,
                workItem: row.work_item,
                isIssue: !!row.is_issue,
            })))
        } finally {
            setLoadingAllDiary(false)
        }
    }

    /** Nhắc việc gộp tất cả dự án đang xem được — hiện rõ ai được gán (nhân sự hệ thống hoặc tổ đội
     * ngoài) để biết việc đó của ai, không cần vào từng dự án kiểm tra tay. Chưa xong xếp trước,
     * theo hạn gần nhất trước. Bấm vào 1 dòng sẽ chuyển sang đúng dự án đó rồi mở tab Nhắc việc. */
    const loadAllReminders = async () => {
        setLoadingAllReminders(true)
        try {
            const ids = visibleProjects.map(p => p.id)
            if (ids.length === 0) { setAllReminders([]); return }
            const { data } = await supabase
                .from('construction_reminders')
                .select('id, project_id, title, due_date, assignee_id, assignee_name, status')
                .in('project_id', ids)
                .order('due_date', { ascending: true })
            const rows = (data || []).map((row: any) => ({
                id: row.id,
                projectId: row.project_id,
                projectName: visibleProjects.find(p => p.id === row.project_id)?.name || 'Dự án',
                title: row.title,
                dueDate: row.due_date,
                assigneeName: (row.assignee_id && profileOptions.find(p => p.id === row.assignee_id)?.full_name) || row.assignee_name || null,
                status: row.status as 'pending' | 'done',
            }))
            rows.sort((a, b) => {
                if (a.status !== b.status) return a.status === 'pending' ? -1 : 1
                return (a.dueDate || '9999').localeCompare(b.dueDate || '9999')
            })
            setAllReminders(rows)
        } finally {
            setLoadingAllReminders(false)
        }
    }

    // Thao tác nhanh từ menu góc trên / Trạm GS: /cong-truong?do=diary|photo|note|plan|reminders|acceptance|progress
    const doAction = searchParams.get('do')
    useEffect(() => {
        if (!doAction || !selectedProjectId) return
        if (doAction === 'diary' || doAction === 'photo' || doAction === 'note') openQuickAction(doAction === 'diary' ? 'full' : doAction)
        else if (doAction === 'plan') openPlanOverview()
        else if (doAction === 'reminders') { setRemindersScope('project'); setTab('reminders') }
        else if (doAction === 'acceptance') setTab('acceptance')
        else if (doAction === 'progress') setTab('progress')
        const next = new URLSearchParams(searchParams); next.delete('do'); setSearchParams(next, { replace: true })
    }, [doAction, selectedProjectId]) // eslint-disable-line react-hooks/exhaustive-deps

    const totalRecords = logs.length + acceptances.length + reminders.length

    // Nhãn + màu theo loại — khớp với danh sách trộn chung trong DiaryTab, để không đổi ý nghĩa
    // giữa Trang chủ và tab Nhật ký (Ghi chú/Ảnh nhanh/Nhật ký thi công/Nghiệm thu/Nhắc việc).
    const LOG_MODE_META: Record<string, { label: string; icon: any; color: string }> = {
        full: { label: 'Nhật ký thi công', icon: FileText, color: 'bg-indigo-500/15 text-indigo-400' },
        photo: { label: 'Ảnh nhanh', icon: Camera, color: 'bg-sky-500/15 text-sky-400' },
        note: { label: 'Ghi chú', icon: StickyNote, color: 'bg-amber-500/15 text-amber-400' },
    }
    const recentActivity = [
        ...logs.map(l => {
            const meta = LOG_MODE_META[l.entry_mode || 'full'] || LOG_MODE_META.full
            return { id: 'log-' + l.id, type: meta.label, title: l.work_item || l.date, date: l.created_at, icon: meta.icon, color: meta.color, thumb: l.photo_urls?.[0] || null, onClick: () => openDiaryEditLog(l.id) }
        }),
        ...acceptances.map(a => ({ id: 'acc-' + a.id, type: 'Nghiệm thu', title: a.title, date: a.created_at, icon: ClipboardCheck, color: 'bg-emerald-500/15 text-emerald-400', thumb: null, onClick: () => setTab('acceptance') })),
        ...reminders.map(r => ({ id: 'rem-' + r.id, type: 'Nhắc việc', title: r.title, date: r.created_at, icon: BellRing, color: 'bg-violet-500/15 text-violet-400', thumb: null, onClick: () => { setRemindersScope('project'); setTab('reminders') } })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)

    const quickActions: { key: string; label: string; icon: any; action: () => void; color: string }[] = [
        { key: 'diary', label: 'Nhật ký', icon: FileText, action: openDiaryList, color: 'bg-indigo-500/15 text-indigo-400' },
        { key: 'plan', label: 'Kế hoạch', icon: CalendarDays, action: openPlanOverview, color: 'bg-rose-500/15 text-rose-400' },
        { key: 'photonote', label: 'Ảnh & Ghi chú', icon: Camera, action: () => setShowPhotoNoteMenu(true), color: 'bg-sky-500/15 text-sky-400' },
        { key: 'reminders', label: 'Nhắc việc', icon: Bell, action: () => { setRemindersScope('project'); setTab('reminders') }, color: 'bg-violet-500/15 text-violet-400' },
        { key: 'acceptance', label: 'Nghiệm thu', icon: ClipboardCheck, action: () => setTab('acceptance'), color: 'bg-emerald-500/15 text-emerald-400' },
    ]

    const avgProgress = visibleProjects.length > 0 ? Math.round(visibleProjects.reduce((s, p) => s + (p.progress || 0), 0) / visibleProjects.length) : 0
    const overviewProjects = useMemo(() => {
        const q = overviewSearch.trim().toLowerCase()
        if (!q) return visibleProjects
        return visibleProjects.filter(p => p.name.toLowerCase().includes(q))
    }, [visibleProjects, overviewSearch])

    return (
        <div className="space-y-5 pb-24 lg:pb-0 px-3 sm:px-4 pt-3 max-w-3xl mx-auto w-full">
            {/* Trang chủ kiểu IKI */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                    <select
                        value={showOverview ? '__overview__' : (selectedProjectId || '')}
                        onChange={e => {
                            const v = e.target.value
                            if (v === '__overview__') {
                                setShowOverview(true)
                            } else {
                                setSelectedProjectId(v || null)
                                setTab(null)
                                setShowOverview(false)
                            }
                        }}
                        className="flex-1 min-w-0 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                        <option value="">-- Chọn dự án --</option>
                        <option value="__overview__">📊 Tất cả dự án (Tổng quan)</option>
                        {visibleProjects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    {isAdmin && !showOverview && selectedProjectId && (
                        <button
                            onClick={() => setShowMemberModal(true)}
                            title="Thành viên dự án"
                            className="flex items-center justify-center w-10 h-10 bg-white border border-slate-300 hover:border-slate-400 text-slate-600 rounded-xl shrink-0"
                        >
                            <Users size={16} />
                        </button>
                    )}
                </div>

                {noAssignment && (
                    <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2 mb-3">Bạn chưa được gán công trình nào — tạm hiện tất cả. Nhờ Admin gán (nút 👥) để chỉ thấy công trình của mình.</p>
                )}
                {!showOverview && selectedProjectId && (
                    <>
                        <p className="text-xs text-slate-500 mb-3">{totalRecords} bản ghi</p>
                        <div className="grid grid-cols-5 gap-2">
                            {quickActions.map(qa => (
                                <button key={qa.key} onClick={qa.action}
                                    className="flex flex-col items-center gap-1.5 py-1 min-h-[64px]">
                                    <span className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-90 ${qa.color}`}>
                                        <qa.icon size={20} />
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-600 leading-tight text-center">{qa.label}</span>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => navigate('/construction?tab=STATION')}
                            className="mt-3 w-full flex items-center gap-3 p-3 rounded-xl bg-[#7A1216]/5 border border-[#7A1216]/15 text-left active:scale-[0.99]">
                            <span className="w-10 h-10 rounded-xl bg-[#7A1216] text-white flex items-center justify-center shrink-0"><HardHat size={18} /></span>
                            <span className="flex-1 min-w-0">
                                <span className="block text-sm font-bold text-slate-900">Trạm GS</span>
                                <span className="block text-xs text-slate-600 truncate">Hạn nộp 17:00 · Vật tư · Phát sinh · Biểu mẫu GS-01…10</span>
                            </span>
                            <ChevronRight size={18} className="text-slate-400 shrink-0" />
                        </button>
                    </>
                )}
            </div>

            {showOverview ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4">
                            <p className="text-xs text-slate-500 mb-1">Tổng số dự án</p>
                            <p className="text-2xl font-black text-slate-800">{visibleProjects.length}</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-4">
                            <p className="text-xs text-slate-500 mb-1">Tiến độ trung bình</p>
                            <p className="text-2xl font-black text-slate-800">{avgProgress}%</p>
                        </div>
                    </div>

                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            value={overviewSearch}
                            onChange={e => setOverviewSearch(e.target.value)}
                            placeholder="Lọc theo tên dự án..."
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div className="space-y-2">
                        {overviewProjects.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-6">Không tìm thấy dự án phù hợp.</p>
                        )}
                        {overviewProjects.map(p => (
                            <button
                                key={p.id}
                                onClick={() => { setSelectedProjectId(p.id); setTab(null); setShowOverview(false) }}
                                className="w-full text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 transition-colors"
                            >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-sm font-bold text-slate-800 truncate">{p.name}</span>
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full shrink-0">{p.status || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#7A1216] rounded-full" style={{ width: `${p.progress || 0}%` }} />
                                    </div>
                                    <span className="text-xs text-slate-500 shrink-0">{p.progress || 0}%</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : !selectedProjectId ? (
                <p className="text-sm text-slate-500 text-center py-12">
                    {projectsLoading || (isRestrictedRole && assignedProjectIds === null)
                        ? 'Đang tải danh sách dự án...'
                        : visibleProjects.length === 0
                            ? (isRestrictedRole
                                ? 'Bạn chưa được gán dự án nào — liên hệ Admin để được gán.'
                                : 'Chưa có dự án nào — tạo dự án mới ở app DQH.')
                            : 'Chọn 1 dự án ở trên để xem chi tiết.'}
                </p>
            ) : (
                <>
                    {/* Thanh tab ngang — chỉ hiện desktop (sm+). Trên mobile phải trượt ngang mới thấy
                        hết, dùng thanh nút cố định phía dưới (Trang chủ/Nhật ký/Tiến độ/Hồ sơ thiết kế)
                        thay thế; Nghiệm thu/Nhắc việc vẫn vào được qua ô quick-action ở Trang chủ. */}
                    <div className="hidden lg:flex gap-2 border-b border-slate-200 overflow-x-auto">
                        <button onClick={() => setTab(null)}
                            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors shrink-0 ${tab === null ? 'border-[#7A1216] text-[#7A1216]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                            Trang chủ
                        </button>
                        <button onClick={() => setTab('progress')}
                            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors shrink-0 ${tab === 'progress' ? 'border-[#7A1216] text-[#7A1216]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                            Tiến độ
                        </button>
                        <button onClick={openDiaryList}
                            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors shrink-0 ${tab === 'diary' ? 'border-[#7A1216] text-[#7A1216]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                            Nhật ký thi công
                        </button>
                        <button onClick={() => setTab('acceptance')}
                            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors shrink-0 ${tab === 'acceptance' ? 'border-[#7A1216] text-[#7A1216]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                            Nghiệm thu
                        </button>
                        <button onClick={() => { setRemindersScope('project'); setTab('reminders') }}
                            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors shrink-0 ${tab === 'reminders' ? 'border-[#7A1216] text-[#7A1216]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                            Nhắc việc
                        </button>
                        <button onClick={() => navigate('/construction?tab=STATION')}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-700 shrink-0">
                            <HardHat size={14} /> Trạm GS
                        </button>
                        <a href={SITE_DOCS_URL} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-700 shrink-0">
                            <LayoutGrid size={14} /> Hồ sơ thiết kế <ExternalLink size={12} />
                        </a>
                    </div>

                    {tab === null && (
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2 mt-4">Hoạt động gần đây</p>
                            <div className="space-y-2">
                                {recentActivity.length === 0 && <p className="text-sm text-slate-500 text-center py-6">Chưa có hoạt động nào.</p>}
                                {recentActivity.map(item => (
                                    <button key={item.id} type="button" onClick={item.onClick}
                                        className="w-full flex items-center gap-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 text-left transition-colors">
                                        {item.thumb ? (
                                            <img src={item.thumb} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                                        ) : (
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                                                <item.icon size={16} />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-slate-800 truncate">{item.title}</p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {item.type} · {new Date(item.date).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {tab === 'progress' && (
                        <div className="bg-white rounded-2xl overflow-hidden">
                            {canManage && (
                                <div className="flex justify-end px-3 pt-3">
                                    <button onClick={() => setShowSuggestedFlow(true)} className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg">
                                        Tạo tiến độ theo flow đề xuất
                                    </button>
                                </div>
                            )}
                            <ProjectManagementAIModule
                                key={ganttRefreshKey}
                                projectId={selectedProjectId}
                                readOnly={!canManage}
                                onOpenImport={() => setShowImportModal(true)}
                            />
                        </div>
                    )}
                    {tab === 'diary' && (
                        <div>
                            <div className="flex p-1 bg-slate-100 rounded-full mb-3">
                                <button onClick={() => setDiaryScope('project')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${diaryScope === 'project' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                                    Dự án này
                                </button>
                                <button onClick={() => { setDiaryScope('all'); loadAllDiaryLogs() }}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${diaryScope === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                                    Tất cả dự án
                                </button>
                            </div>

                            {diaryScope === 'all' ? (
                                <div className="space-y-2">
                                    {loadingAllDiary && <p className="text-sm text-slate-500 text-center py-6">Đang tải...</p>}
                                    {!loadingAllDiary && allDiaryLogs.length === 0 && (
                                        <p className="text-sm text-slate-500 text-center py-6">Chưa có nhật ký nào.</p>
                                    )}
                                    {!loadingAllDiary && allDiaryLogs.map(l => (
                                        <button key={l.id} onClick={() => {
                                            setSelectedProjectId(l.projectId)
                                            setDiaryScope('project')
                                            openDiaryList()
                                        }}
                                            className="w-full text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 transition-colors">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-bold text-slate-800 truncate">{l.projectName}</span>
                                                <span className="text-[11px] text-slate-400 shrink-0">{new Date(l.date).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {l.isIssue && <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full shrink-0">Sự cố</span>}
                                                <span className="text-xs text-slate-600 truncate">{l.workItem || '—'}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <DiaryTab
                                    key={diaryFormKey}
                                    projectId={selectedProjectId}
                                    logs={logs}
                                    dailyLogItems={dailyLogItems}
                                    tasks={tasks}
                                    acceptances={acceptances}
                                    onOpenAcceptance={() => setTab('acceptance')}
                                    projectName={selectedProject?.name}
                                    projectCode={selectedProject?.project_code}
                                    engineerId={profile?.id}
                                    engineerName={profile?.full_name}
                                    canWrite={!!profile}
                                    onSubmit={submitDailyLog}
                                    onUpdate={updateDailyLog}
                                    onDelete={deleteDailyLog}
                                    onSaveItems={saveDailyLogItems}
                                    onDeleteItems={deleteDailyLogItemsForLog}
                                    initialMode={diaryInitialMode}
                                    initialEditLogId={diaryEditLogId}
                                />
                            )}
                        </div>
                    )}
                    {tab === 'acceptance' && (
                        <AcceptanceTab
                            projectId={selectedProjectId}
                            projectName={selectedProject?.name}
                            acceptances={acceptances}
                            acceptanceItems={acceptanceItems}
                            canWrite={canManage}
                            createdBy={profile?.id}
                            onCreate={createAcceptance}
                            onSetItemResult={updateAcceptanceItemResult}
                            onUpdateStatus={updateAcceptanceStatus}
                            onDelete={deleteAcceptance}
                        />
                    )}
                    {tab === 'reminders' && (
                        <div>
                            <div className="flex p-1 bg-slate-100 rounded-full mb-3">
                                <button onClick={() => setRemindersScope('project')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${remindersScope === 'project' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                                    Dự án này
                                </button>
                                <button onClick={() => { setRemindersScope('all'); loadAllReminders() }}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${remindersScope === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                                    Tất cả dự án
                                </button>
                            </div>

                            {remindersScope === 'all' ? (
                                <div className="space-y-2">
                                    {loadingAllReminders && <p className="text-sm text-slate-500 text-center py-6">Đang tải...</p>}
                                    {!loadingAllReminders && allReminders.length === 0 && (
                                        <p className="text-sm text-slate-500 text-center py-6">Chưa có nhắc việc nào.</p>
                                    )}
                                    {!loadingAllReminders && allReminders.map(r => (
                                        <button key={r.id} onClick={() => {
                                            setSelectedProjectId(r.projectId)
                                            setRemindersScope('project')
                                            setTab('reminders')
                                        }}
                                            className="w-full text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 transition-colors">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-bold text-slate-800 truncate">{r.projectName}</span>
                                                {r.dueDate && <span className="text-[11px] text-slate-400 shrink-0">Hạn: {new Date(r.dueDate).toLocaleDateString('vi-VN')}</span>}
                                            </div>
                                            <p className={`text-xs mt-0.5 ${r.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{r.title}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                {r.status === 'done' && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0">Đã xong</span>}
                                                {r.assigneeName && <span className="text-[11px] text-slate-500">👤 {r.assigneeName}</span>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <RemindersTab
                                    projectId={selectedProjectId}
                                    reminders={reminders}
                                    profiles={reminderAssignees}
                                    canWrite={!!profile}
                                    createdBy={profile?.id}
                                    onCreate={createReminder}
                                    onToggleStatus={toggleReminderStatus}
                                    onUpdate={updateReminder}
                                    onDelete={deleteReminder}
                                />
                            )}
                        </div>
                    )}
                </>
            )}

            {showMemberModal && selectedProjectId && isAdmin && (
                <EditProjectMembersModal
                    isOpen={showMemberModal}
                    onClose={() => {
                        setShowMemberModal(false)
                        // Nếu chính mình bị bỏ tick khỏi dự án đang xem, cần tải lại danh sách được
                        // gán để dropdown/tổng quan phản ánh đúng ngay, không đợi tải lại trang.
                        if (isRestrictedRole && profile?.id) {
                            supabase.from('construction_project_members').select('project_id').eq('user_id', profile.id).then(({ data }) => {
                                setAssignedProjectIds((data || []).map((r: any) => r.project_id))
                            })
                        }
                    }}
                    projectId={selectedProjectId}
                    projectName={selectedProject?.name}
                    staffOptions={managerStaff}
                />
            )}

            {selectedProjectId && (
                <ImportQuotationModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onGenerate={async (generatedTasks) => {
                        const ok = await replaceTimelineTasks(selectedProjectId, generatedTasks, selectedProject?.start_date)
                        if (ok) {
                            setGanttRefreshKey(k => k + 1)
                        } else {
                            alert('Lỗi khi lưu timeline vào CSDL.')
                        }
                    }}
                />
            )}

            {selectedProjectId && (
                <SuggestedFlowWizard
                    isOpen={showSuggestedFlow}
                    onClose={() => setShowSuggestedFlow(false)}
                    projectType={selectedProject?.project_type}
                    onGenerate={async (generatedTasks, startDate) => {
                        const ok = await createTimelineTasks(selectedProjectId, generatedTasks, startDate)
                        if (ok) {
                            setGanttRefreshKey(k => k + 1)
                        } else {
                            alert('Lỗi khi lưu timeline vào CSDL.')
                        }
                    }}
                />
            )}

            {/* Chọn "Chụp ảnh" hoặc "Ghi chú" — gộp chung 1 nút quick-action */}
            {showPhotoNoteMenu && (
                <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowPhotoNoteMenu(false)}>
                    <div className="w-full sm:max-w-xs bg-white rounded-2xl shadow-2xl p-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setShowPhotoNoteMenu(false); openQuickAction('photo') }}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors text-left">
                            <span className="w-10 h-10 rounded-full bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0">
                                <Camera size={18} />
                            </span>
                            <span className="text-sm font-bold text-slate-800">Chụp ảnh</span>
                        </button>
                        <button onClick={() => { setShowPhotoNoteMenu(false); openQuickAction('note') }}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors text-left">
                            <span className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                                <StickyNote size={18} />
                            </span>
                            <span className="text-sm font-bold text-slate-800">Ghi chú</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Kế hoạch — Công việc hôm nay / Kế hoạch ngày mai gộp theo mọi dự án đang xem được */}
            {showPlanModal && (
                <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowPlanModal(false)}>
                    <div className="w-full sm:max-w-lg bg-white rounded-2xl shadow-2xl max-h-[85dvh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
                            <div className="flex items-center gap-2">
                                <CalendarDays size={18} className="text-rose-500" />
                                <h3 className="text-sm font-bold text-slate-800">Kế hoạch — Hôm nay &amp; Ngày mai</h3>
                            </div>
                            <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loadingPlan && (
                                <p className="text-sm text-slate-500 text-center py-6">Đang tải...</p>
                            )}
                            {!loadingPlan && planData.length === 0 && (
                                <p className="text-sm text-slate-500 text-center py-6">Chưa có dự án nào có việc lên lịch hôm nay/ngày mai.</p>
                            )}
                            {!loadingPlan && planData.map(p => (
                                <button key={p.projectId} onClick={() => {
                                    setShowPlanModal(false)
                                    setSelectedProjectId(p.projectId)
                                    openDiaryList()
                                }}
                                    className="w-full text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 transition-colors space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-800">{p.projectName}</span>
                                        {p.logDate && <span className="text-[11px] text-slate-400">NK: {new Date(p.logDate).toLocaleDateString('vi-VN')}</span>}
                                    </div>

                                    {(p.todayTasks.length > 0 || p.todaySummary || p.checklistToday.length > 0) && (
                                        <div>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Hôm nay</p>
                                            {p.todayTasks.map((t, i) => (
                                                <p key={i} className="text-xs text-slate-700 flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                                                    {t.name}
                                                    {t.checklistCount > 0 && <span className="text-[10px] text-slate-400">· ☑ {t.checklistCount}</span>}
                                                </p>
                                            ))}
                                            {toPlanBullets(p.todaySummary).map((line, i) => (
                                                <p key={i} className="text-xs text-slate-500 italic mt-0.5">{line}</p>
                                            ))}
                                            {p.checklistToday.length > 0 && (
                                                <div className="mt-1 pl-2 border-l-2 border-emerald-100 space-y-0.5">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Checklist nghiệm thu (từ nhật ký)</p>
                                                    {p.checklistToday.map((c, i) => (
                                                        <p key={i} className={`text-xs flex items-center gap-1 ${c.completed ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                                                            <span>{c.completed ? '☑' : '☐'}</span>{c.label}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {(p.tomorrowTasks.length > 0 || p.tomorrowPlan || p.checklistTomorrow.length > 0) && (
                                        <div>
                                            <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Ngày mai</p>
                                            {p.tomorrowTasks.map((t, i) => (
                                                <p key={i} className="text-xs text-slate-700 flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                                                    {t.name}
                                                    {t.checklistCount > 0 && <span className="text-[10px] text-slate-400">· ☑ {t.checklistCount}</span>}
                                                </p>
                                            ))}
                                            {toPlanBullets(p.tomorrowPlan).map((line, i) => (
                                                <p key={i} className="text-xs text-slate-500 italic mt-0.5">{line}</p>
                                            ))}
                                            {p.checklistTomorrow.length > 0 && (
                                                <div className="mt-1 pl-2 border-l-2 border-indigo-100 space-y-0.5">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Checklist nghiệm thu (từ nhật ký)</p>
                                                    {p.checklistTomorrow.map((c, i) => (
                                                        <p key={i} className={`text-xs flex items-center gap-1 ${c.completed ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                                                            <span>{c.completed ? '☑' : '☐'}</span>{c.label}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Thanh dưới — chỉ hiện trên điện thoại (máy tính dùng thanh tab ngang). */}
            {(
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[61] bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 pb-[max(env(safe-area-inset-bottom,0px),8px)] pt-2 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between max-w-md mx-auto">
                        <button onClick={() => setTab(null)} className={`flex flex-col items-center gap-0.5 px-3 py-1 ${tab === null ? 'text-[#7A1216]' : 'text-slate-500'}`}>
                            <Home size={20} />
                            <span className="text-[11px] font-medium">Trang chủ</span>
                        </button>
                        <button onClick={openDiaryList} className={`flex flex-col items-center gap-0.5 px-3 py-1 ${tab === 'diary' ? 'text-[#7A1216]' : 'text-slate-500'}`}>
                            <FileText size={20} />
                            <span className="text-[11px] font-medium">Nhật ký</span>
                        </button>
                        <button aria-label="Ghi nhật ký mới" onClick={() => { setDiaryInitialMode('full'); setTab('diary'); setDiaryFormKey(k => k + 1) }}
                            className="w-12 h-12 -mt-4 rounded-full bg-[#7A1216] flex items-center justify-center shadow-lg shadow-black/30 active:scale-90 transition-transform">
                            <Plus size={22} className="text-white" />
                        </button>
                        <button onClick={() => setTab('progress')} className={`flex flex-col items-center gap-0.5 px-3 py-1 ${tab === 'progress' ? 'text-[#7A1216]' : 'text-slate-500'}`}>
                            <LayoutDashboard size={20} />
                            <span className="text-[11px] font-medium">Tiến độ</span>
                        </button>
                        <button onClick={() => navigate('/construction?tab=STATION')} className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-500">
                            <HardHat size={20} />
                            <span className="text-[11px] font-medium">Trạm GS</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
