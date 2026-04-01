import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut, HardHat, KeyRound, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../services/supabase'

/**
 * Layout gọn cho Quản lý thi công, Giám Sát, Khách hàng.
 * Không sidebar, không bottom bar, tối ưu mobile.
 */
export const ConstructionOnlyLayout = () => {
    const { profile, signOut } = useAuthStore()
    const navigate = useNavigate()
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert('Mật khẩu mới phải có ít nhất 6 ký tự.')
            return
        }
        setIsChangingPassword(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) {
                alert(`Lỗi: ${error.message}`)
            } else {
                alert('Đổi mật khẩu thành công!')
                setIsPasswordModalOpen(false)
                setNewPassword('')
            }
        } catch (err: any) {
            alert('Lỗi: ' + err.message)
        } finally {
            setIsChangingPassword(false)
        }
    }

    const handleRefresh = () => {
        setIsRefreshing(true)
        window.location.reload()
    }

    const getInitials = (name?: string) => {
        if (!name) return 'U'
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }

    const getRoleBadgeColor = (role?: string) => {
        if (role === 'Quản lý thi công') return 'bg-blue-600 text-white'
        if (role === 'Giám Sát')        return 'bg-emerald-600 text-white'
        if (role === 'Khách hàng')      return 'bg-amber-500 text-white'
        return 'bg-slate-600 text-white'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50 flex flex-col font-inter">
            {/* ── Sticky Header ── */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm"
                    style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                    {/* Left: Logo + role */}
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#7A1216] to-red-700 rounded-xl flex items-center justify-center shadow-md shrink-0">
                            <HardHat size={16} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-black text-[#7A1216] leading-none tracking-tight">DQH</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 inline-block ${getRoleBadgeColor(profile?.role)}`}>
                                {profile?.role}
                            </span>
                        </div>
                    </div>

                    {/* Right: User + actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Refresh */}
                        <button
                            onClick={handleRefresh}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                            title="Làm mới"
                        >
                            <RefreshCw size={16} />
                        </button>

                        {/* Avatar + dropdown */}
                        <div className="relative group">
                            <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 active:scale-95 transition-all">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm">
                                    {getInitials(profile?.full_name)}
                                </div>
                                <span className="text-xs font-bold text-slate-700 max-w-[80px] truncate hidden sm:block">
                                    {profile?.full_name?.split(' ').slice(-1)[0] || 'User'}
                                </span>
                            </button>

                            {/* Dropdown */}
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                                <div className="p-3 border-b border-slate-100">
                                    <p className="text-xs font-bold text-slate-800 truncate">{profile?.full_name}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{profile?.email}</p>
                                </div>
                                <div className="p-1.5 space-y-0.5">
                                    <button
                                        onClick={() => setIsPasswordModalOpen(true)}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        <KeyRound size={14} className="text-slate-400" /> Đổi mật khẩu
                                    </button>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <LogOut size={14} /> Đăng xuất
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Page Content ── */}
            <main
                className="flex-1 overflow-y-auto w-full"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
            >
                <Outlet />
            </main>

            {/* ── Password Modal ── */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-base font-bold text-slate-800">Đổi Mật Khẩu</h3>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                                <LogOut size={16} className="text-slate-400 rotate-180" />
                            </button>
                        </div>
                        <div className="p-5">
                            <label className="block text-xs font-bold text-slate-600 mb-2">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 mb-4"
                                placeholder="Nhập mật khẩu mới..."
                                autoFocus
                            />
                            <button
                                onClick={handleChangePassword}
                                disabled={isChangingPassword}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 active:scale-[0.98] transition-all"
                            >
                                {isChangingPassword ? 'Đang cập nhật...' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
