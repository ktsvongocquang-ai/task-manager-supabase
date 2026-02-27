import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { LogIn } from 'lucide-react'

export const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg('')

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                setErrorMsg('Sai email hoặc mật khẩu. Vui lòng thử lại.')
            } else {
                setErrorMsg(error.message)
            }
            setLoading(false)
        } else {
            navigate('/dashboard')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50">
                <div className="text-center mb-8">
                    <div className="bg-indigo-600 text-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <LogIn size={24} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">Task Manager</h1>
                    <p className="text-slate-500 text-sm mt-2">Hệ thống Quản lý Giao việc Nội bộ</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email đăng nhập</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border-slate-300 bg-white/50 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all shadow-sm"
                            placeholder="VD: admin@congty.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border-slate-300 bg-white/50 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all shadow-sm"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                            {errorMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng nhập vào hệ thống'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                    <p className="text-xs text-slate-500">
                        Nếu bạn là Quản trị viên chưa có tài khoản, hãy tạo User từ trang <strong>Authentication</strong> của Supabase.
                    </p>
                </div>
            </div>
        </div>
    )
}
