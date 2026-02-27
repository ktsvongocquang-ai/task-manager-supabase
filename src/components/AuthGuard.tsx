import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { user, loading, checkSession } = useAuthStore()
    const location = useLocation()

    useEffect(() => {
        checkSession()
    }, [checkSession])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return <>{children}</>
}
