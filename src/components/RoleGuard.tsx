import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { canAccessRoute, getDefaultRoute } from '../utils/permissions'

interface RoleGuardProps {
    children: React.ReactNode
}

export const RoleGuard = ({ children }: RoleGuardProps) => {
    const { profile, loading } = useAuthStore()
    const location = useLocation()

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#1c1c1c]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
        )
    }

    if (!profile) return <Navigate to="/login" replace />

    const role = profile.role
    if (!canAccessRoute(role, location.pathname)) {
        return <Navigate to={getDefaultRoute(role)} replace />
    }

    return <>{children}</>
}
