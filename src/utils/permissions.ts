import type { UserRole } from '../pages/construction/types'

export type AppRole = 'Admin' | 'Quản lý thiết kế' | 'Quản lý thi công' | 'Giám Sát' | 'Sale' | 'Marketing' | 'Khách hàng' | 'Nhân viên'

const ROUTE_ACCESS: Record<string, AppRole[]> = {
    '/dashboard':    ['Admin', 'Quản lý thiết kế', 'Nhân viên', 'Sale', 'Marketing'],
    '/kanban':       ['Admin', 'Quản lý thiết kế', 'Nhân viên', 'Sale', 'Marketing'],
    '/tasks':        ['Admin', 'Quản lý thiết kế', 'Nhân viên', 'Sale', 'Marketing'],
    '/schedule':     ['Admin', 'Quản lý thiết kế', 'Nhân viên', 'Sale', 'Marketing'],
    '/gantt':        ['Admin', 'Quản lý thiết kế'],
    '/projects':     ['Admin', 'Quản lý thiết kế'],
    '/marketing':    ['Admin', 'Quản lý thiết kế', 'Marketing'],
    '/construction': ['Admin', 'Quản lý thiết kế', 'Quản lý thi công', 'Giám Sát', 'Khách hàng'],
    '/customers':    ['Admin', 'Quản lý thiết kế', 'Sale'],
    '/history':      ['Admin', 'Quản lý thiết kế'],
    '/users':        ['Admin'],
    '/profile':      ['Admin', 'Quản lý thiết kế', 'Quản lý thi công', 'Giám Sát', 'Sale', 'Marketing', 'Khách hàng', 'Nhân viên'],
    '/mytasks':      ['Admin', 'Quản lý thiết kế', 'Nhân viên', 'Sale', 'Marketing'],
}

export const getDefaultRoute = (role?: string | null): string => {
    switch (role) {
        case 'Admin':
        case 'Quản lý thiết kế':
        case 'Nhân viên':
        case 'Sale':
        case 'Marketing':
            return '/kanban'
        case 'Quản lý thi công':
        case 'Giám Sát':
        case 'Khách hàng':
            return '/construction'
        default:
            return '/kanban'
    }
}

export const canAccessRoute = (role?: string | null, path?: string | null): boolean => {
    if (!role || !path) return false
    if (role === 'Admin') return true
    const matchedKey = Object.keys(ROUTE_ACCESS).find(
        route => path === route || path.startsWith(route + '/')
    )
    if (!matchedKey) return true
    return ROUTE_ACCESS[matchedKey].includes(role as AppRole)
}

/** 3 role chỉ được vào module thi công */
export const isConstructionOnlyRole = (role?: string | null): boolean =>
    role === 'Quản lý thi công' || role === 'Giám Sát' || role === 'Khách hàng'

export const isAdminRole = (role?: string | null): boolean =>
    role === 'Admin'

export const isManagerRole = (role?: string | null): boolean =>
    role === 'Admin' || role === 'Quản lý thiết kế' || role === 'Quản lý thi công'

/** Map profile.role → UserRole nội bộ của Construction module */
export const getConstructionUserRole = (role?: string | null): UserRole => {
    if (role === 'Quản lý thi công') return 'MANAGER'
    if (role === 'Giám Sát')        return 'ENGINEER'
    if (role === 'Khách hàng')      return 'HOMEOWNER'
    return 'MANAGER'
}
