import { useEffect, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { trackUserLogin } from '../services/userTracking'

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { user, loading, checkSession, profile } = useAuthStore()
    const location = useLocation()
    const hasTrackedLogin = useRef(false)

    useEffect(() => {
        checkSession()
    }, [checkSession])

    // Track user login when authenticated
    useEffect(() => {
        if (user && profile?.id && !hasTrackedLogin.current) {
            hasTrackedLogin.current = true
            trackUserLogin(profile.id)
        }
    }, [user, profile?.id])

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

