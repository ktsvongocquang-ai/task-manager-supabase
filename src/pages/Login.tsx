import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../store/authStore'

export const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const navigate = useNavigate()

    const { checkSession, user } = useAuthStore()

    useEffect(() => {
        if (user) navigate('/dashboard', { replace: true })
    }, [user, navigate])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg('')

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                // Show raw error for debugging "Failed to fetch"
                setErrorMsg(`Lỗi kết nối (Failed to fetch): ${error.message}. Kiểm tra URL Supabase và CORS!`)
                setLoading(false)
            } else {
                await checkSession()
                navigate('/dashboard', { replace: true })
            }
        } catch (err: any) {
            setErrorMsg('Lỗi mạng/CORS: ' + err.message)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h1 className="text-xl font-bold mb-6 text-center">Đăng nhập Quản lý</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-2 rounded" placeholder="Email" required />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-2 rounded" placeholder="Mật khẩu" required />
                    {errorMsg && <div className="text-red-500 text-xs p-2 bg-red-100 rounded">{errorMsg}</div>}
                    <button type="submit" className="w-full bg-red-800 text-white p-2 rounded" disabled={loading}>Đăng nhập</button>
                </form>
            </div>
        </div>
    )
}
