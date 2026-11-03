// Hai "khu làm việc" trên điện thoại: THIẾT KẾ và THI CÔNG.
// Mỗi vai trò thấy khu nào, thanh dưới có nút gì, menu thao tác nhanh có gì — định nghĩa hết ở đây.
//
//   Thiết kế          → chỉ khu Thiết kế
//   Quản lý thiết kế  → Thiết kế (mặc định) + Thi công
//   Giám Sát          → chỉ khu Thi công (dùng điện thoại là chính)
//   Quản lý thi công  → chỉ khu Thi công
//   Admin             → cả hai
//   Sale / Marketing  → Thiết kế (thanh dưới riêng)
import type { ElementType } from 'react'
import {
    Briefcase, HardHat, ListTodo, Target, FolderKanban, CalendarDays, User, LayoutDashboard,
    ClipboardList, TrendingUp, FileText, AlertTriangle, Camera, Bell, Package, CheckCircle2, PlusCircle,
    Building2, Wallet, FolderPlus, GraduationCap, KanbanSquare,
} from 'lucide-react'

export type WorkspaceId = 'design' | 'construction'

export type NavItem = { label: string; to: string; icon: ElementType; hint?: string; tone?: string }
export type QuickAction = NavItem & { event?: 'add-task' | 'add-project' }

export const WORKSPACE_META: Record<WorkspaceId, { label: string; short: string; icon: ElementType; color: string }> = {
    design: { label: 'Thiết kế', short: 'TK', icon: Briefcase, color: 'from-indigo-500 to-violet-600' },
    construction: { label: 'Thi công', short: 'TC', icon: HardHat, color: 'from-[#7A1216] to-red-700' },
}

const STATION = '/construction?tab=STATION'
const SITE = '/cong-truong'
const ct = (tab: string, extra = '') => `/construction?tab=${tab}${extra}`

export function workspacesFor(role?: string | null): WorkspaceId[] {
    switch ((role || '').trim()) {
        case 'Admin':
        case 'Quản lý thiết kế':
            return ['design', 'construction']
        case 'Giám Sát':
        case 'Quản lý thi công':
            return ['construction']
        case 'Khách hàng':
            return []
        default:
            return ['design']
    }
}

/** Khu đang đứng, suy ra từ đường dẫn. */
export function workspaceOfPath(pathname: string, role?: string | null): WorkspaceId {
    const list = workspacesFor(role)
    const isCt = pathname.startsWith('/construction') || pathname.startsWith('/cong-truong') || pathname.startsWith('/finance') || pathname.startsWith('/in-tien-do')
    const ws: WorkspaceId = isCt ? 'construction' : 'design'
    return list.includes(ws) ? ws : (list[0] || 'design')
}

/** Trang mở ra khi chọn khu. */
export function workspaceHome(ws: WorkspaceId, role?: string | null): string {
    const r = (role || '').trim()
    if (ws === 'construction') return r === 'Giám Sát' || r === 'Quản lý thi công' ? SITE : ct('DASHBOARD')
    if (r === 'Admin' || r === 'Quản lý thiết kế') return '/dieu-hanh'
    if (r === 'Sale' || r === 'Marketing') return '/kanban'
    return '/mytasks'
}

/** Thanh dưới (tối đa 5 nút). */
export function bottomTabs(ws: WorkspaceId, role?: string | null): NavItem[] {
    const r = (role || '').trim()
    const account: NavItem = { label: 'Tài khoản', to: r === 'Admin' ? '/users' : '/profile', icon: User }
    if (ws === 'construction') {
        if (r === 'Giám Sát') return [
            { label: 'Công trường', to: SITE, icon: Building2 },
            { label: 'Trạm GS', to: STATION, icon: HardHat },
            { label: 'Việc', to: ct('KANBAN'), icon: KanbanSquare },
            { label: 'Tiến độ', to: ct('AI_GANTT'), icon: TrendingUp },
        ]
        return [
            { label: 'Tổng quan', to: ct('DASHBOARD'), icon: LayoutDashboard },
            { label: 'Công trường', to: SITE, icon: Building2 },
            { label: 'Trạm GS', to: STATION, icon: HardHat },
            { label: 'Việc', to: ct('KANBAN'), icon: KanbanSquare },
            { label: 'Tiến độ', to: ct('AI_GANTT'), icon: TrendingUp },
        ]
    }
    if (r === 'Admin' || r === 'Quản lý thiết kế') return [
        { label: 'Điều hành', to: '/dieu-hanh', icon: LayoutDashboard },
        { label: 'Việc', to: '/tasks', icon: Target },
        { label: 'Dự án', to: '/projects', icon: FolderKanban },
        { label: 'Lịch', to: '/schedule', icon: CalendarDays },
        account,
    ]
    if (r === 'Sale' || r === 'Marketing') return [
        { label: 'Kanban', to: '/kanban', icon: KanbanSquare },
        { label: 'Việc', to: '/mytasks', icon: ListTodo },
        { label: 'Dự án', to: '/projects', icon: FolderKanban },
        { label: 'Lịch', to: '/schedule', icon: CalendarDays },
        account,
    ]
    return [
        { label: 'Việc của tôi', to: '/mytasks', icon: ListTodo },
        { label: 'Mục tiêu', to: '/tasks', icon: Target },
        { label: 'Dự án', to: '/projects', icon: FolderKanban },
        { label: 'Lịch', to: '/schedule', icon: CalendarDays },
        account,
    ]
}

/** Nút thao tác nhanh trong menu xổ xuống — khác nhau theo vai trò. */
export function quickActions(ws: WorkspaceId, role?: string | null): QuickAction[] {
    const r = (role || '').trim()
    if (ws === 'construction') {
        const site: QuickAction[] = [
            { label: 'Ghi nhật ký', to: SITE + '?do=diary', icon: ClipboardList, hint: 'Hạng mục, ảnh, gửi khách', tone: 'text-[#7A1216] bg-red-50' },
            { label: 'Chụp ảnh nhanh', to: SITE + '?do=photo', icon: Camera, tone: 'text-sky-700 bg-sky-50' },
            { label: 'Kế hoạch hôm nay', to: SITE + '?do=plan', icon: CalendarDays, hint: 'Mọi công trình', tone: 'text-rose-700 bg-rose-50' },
            { label: 'Nhắc việc', to: SITE + '?do=reminders', icon: Bell, tone: 'text-violet-700 bg-violet-50' },
            { label: 'Nghiệm thu', to: SITE + '?do=acceptance', icon: CheckCircle2, hint: 'Tiêu chí, chữ ký, PDF', tone: 'text-emerald-700 bg-emerald-50' },
            { label: 'Báo sự cố', to: ct('STATION', '&do=GS-06'), icon: AlertTriangle, hint: 'GS-06', tone: 'text-amber-700 bg-amber-50' },
            { label: 'Báo thiếu vật tư', to: ct('STATION', '&do=materials'), icon: Package, tone: 'text-orange-700 bg-orange-50' },
            { label: 'Giao việc cho tổ', to: ct('STATION', '&do=task'), icon: PlusCircle, hint: 'GS-04', tone: 'text-indigo-700 bg-indigo-50' },
        ]
        if (r === 'Giám Sát') return site
        const mgr: QuickAction[] = [
            { label: 'Danh sách công trình', to: ct('PROJECTS_LIST'), icon: Building2, tone: 'text-slate-700 bg-slate-100' },
        ]
        if (r === 'Admin' || r === 'Quản lý thiết kế') mgr.push({ label: 'Tài chính', to: '/finance', icon: Wallet, tone: 'text-slate-700 bg-slate-100' })
        return [site[0], site[2], site[4], site[5], ...mgr]
    }
    if (r === 'Admin' || r === 'Quản lý thiết kế') return [
        { label: 'Giao việc mới', to: '', event: 'add-task', icon: PlusCircle, hint: 'Cho nhân viên thiết kế', tone: 'text-indigo-700 bg-indigo-50' },
        { label: 'Thêm dự án', to: '', event: 'add-project', icon: FolderPlus, tone: 'text-violet-700 bg-violet-50' },
        { label: 'Việc của tôi', to: '/mytasks', icon: ListTodo, tone: 'text-slate-700 bg-slate-100' },
        { label: 'Gantt tổng', to: '/gantt', icon: TrendingUp, tone: 'text-slate-700 bg-slate-100' },
    ]
    return [
        { label: 'Việc được giao', to: '/mytasks', icon: ListTodo, hint: 'Bấm Làm → Gửi duyệt', tone: 'text-indigo-700 bg-indigo-50' },
        { label: 'Lịch tuần này', to: '/schedule', icon: CalendarDays, tone: 'text-slate-700 bg-slate-100' },
        { label: 'Đào tạo & thư viện', to: '/training', icon: GraduationCap, tone: 'text-slate-700 bg-slate-100' },
    ]
}

/** Nút thanh dưới có đang được chọn không (so cả ?tab=). */
export function isNavActive(item: NavItem, pathname: string, search: string): boolean {
    const [path, query] = item.to.split('?')
    if (!(pathname === path || pathname.startsWith(path + '/'))) return false
    if (!query) return true
    const want = new URLSearchParams(query).get('tab')
    const cur = new URLSearchParams(search).get('tab')
    return want === cur
}

const KEY = 'dqh_workspace'
export const rememberWorkspace = (ws: WorkspaceId) => { try { localStorage.setItem(KEY, ws) } catch { /* ignore */ } }
export const lastWorkspace = (): WorkspaceId | null => { try { return localStorage.getItem(KEY) as WorkspaceId | null } catch { return null } }
