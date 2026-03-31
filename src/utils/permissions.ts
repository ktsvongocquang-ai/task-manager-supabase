export type AppRole = 'Admin' | 'Quản lý thiết kế' | 'Quản lý thi công' | 'Kỹ sư' | 'Khách hàng' | 'Nhân viên'

const ROUTE_ACCESS: Record<string, AppRole[]> = {
    '/dashboard':   ['Admin', 'Quản lý thiết kế', 'Quản lý thi công', 'Nhân viên'],
    '/kanban':      ['Admin', 'Quản lý thiết kế', 'Quản lý thi công', 'Nhân viên'],
    '/tasks':       ['Admin', 'Quản lý thiết kế', 'Quản lý thi công', 'Nhân viên'],
    '/schedule':    ['Admin', 'Quản lý thiết kế', 'Quản lý thi công', 'Nhân viên'],
    '/gantt':       ['Admin', 'Quản lý thiết kế', 'Quản lý thi công', 'Nhân viên'],
    '/projects':    ['Admin', 'Quản lý thiết kế', 'Quản lý thi công', 'Nhân viên'],
    '/marketing':   ['Admin', 'Quản lý thiết kế'],
    '/construction':['Admin', 'Quản lý thiết kế', 'Quản lý thi công', 'Kỹ sư', 'Khách hàng'],
    '/customers':   ['Admin', 'Quản lý thiết kế'],
    '/history':     ['Admin', 'Quản lý thiết kế', 'Quản lý thi công'],
    '/users':       ['Admin'],
    '/profile':     ['Admin', 'Quản lý thiết kế', 'Quản lý thi công', 'Kỹ sư', 'Nhân viên'],
    '/mytasks':     ['Admin', 'Quản lý thiết kế', 'Quản lý thi công', 'Kỹ sư', 'Nhân viên'],
}

export const getDefaultRoute = (role: string): string => {
    switch (role) {
        case 'Admin':
        case 'Quản lý thiết kế':
        case 'Nhân viên':
            return '/kanban'
        case 'Quản lý thi công':
        case 'Kỹ sư':
        case 'Khách hàng':
            return '/construction'
        default:
            return '/mytasks'
    }
}

export const canAccessRoute = (role: string, path: string): boolean => {
    if (role === 'Admin') return true
    const matchedKey = Object.keys(ROUTE_ACCESS).find(
        route => path === route || path.startsWith(route + '/')
    )
    if (!matchedKey) return true
    return ROUTE_ACCESS[matchedKey].includes(role as AppRole)
}

export const isAdminRole = (role?: string): boolean =>
    role === 'Admin'

export const isManagerRole = (role?: string): boolean =>
    role === 'Admin' || role === 'Quản lý thiết kế' || role === 'Quản lý thi công'

export const isConstructionRole = (role?: string): boolean =>
    role === 'Quản lý thi công' || role === 'Kỹ sư' || role === 'Khách hàng'
