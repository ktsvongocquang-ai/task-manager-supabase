import { useState } from 'react'
import { type Profile } from '../../types'
import { Edit3, Trash2, QrCode, X, Copy, Check, ExternalLink } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface UserGridProps {
    profiles: Profile[]
    currentUserRole?: string
    onEdit: (profile: Profile) => void
    onDelete: (id: string) => void
}

function CustomerQRModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
    const [copied, setCopied] = useState(false)
    // URL dẫn thẳng vào trang login, sau khi login → RoleGuard tự redirect về /construction
    const loginUrl = `${window.location.origin}/login`
    const projectId = (profile as any).construction_project_id

    const copyLink = () => {
        navigator.clipboard.writeText(loginUrl).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <QrCode size={16} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">QR Khách Hàng</p>
                            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{profile.full_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100">
                        <X size={16} className="text-slate-400" />
                    </button>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-4 px-5 py-6">
                    <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
                        <QRCodeSVG
                            value={loginUrl}
                            size={180}
                            level="M"
                            includeMargin={false}
                            imageSettings={{
                                src: '/pwa-192x192.png',
                                x: undefined, y: undefined,
                                height: 32, width: 32, excavate: true
                            }}
                        />
                    </div>

                    {/* Info card */}
                    <div className="w-full bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">KHÁCH HÀNG</span>
                            {projectId && <span className="text-[10px] text-teal-600 font-medium">Đã gắn công trình</span>}
                        </div>
                        <p className="text-xs font-bold text-slate-700">{profile.full_name}</p>
                        <p className="text-[11px] text-slate-500">{profile.email}</p>
                        {!projectId && (
                            <p className="text-[10px] text-amber-600 font-medium mt-1">
                                ⚠️ Chưa gắn công trình — vào Sửa để chọn
                            </p>
                        )}
                    </div>

                    {/* Instructions */}
                    <div className="w-full bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-[11px] font-bold text-slate-600 mb-1.5">Hướng dẫn khách hàng:</p>
                        <ol className="text-[11px] text-slate-500 space-y-1 list-decimal list-inside">
                            <li>Quét QR Code hoặc truy cập link</li>
                            <li>Đăng nhập bằng email: <strong className="text-slate-700">{profile.email}</strong></li>
                            <li>Nhập mật khẩu đã được cấp</li>
                            <li>Sẽ tự vào giao diện Thi công của công trình</li>
                        </ol>
                    </div>

                    {/* Link + actions */}
                    <div className="w-full flex gap-2">
                        <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 truncate font-mono">
                            {loginUrl.replace('https://', '')}
                        </div>
                        <button
                            onClick={copyLink}
                            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                        >
                            {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                        </button>
                    </div>

                    <button
                        onClick={() => window.open(loginUrl, '_blank')}
                        className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all"
                    >
                        <ExternalLink size={13} /> Mở thử trang đăng nhập
                    </button>
                </div>
            </div>
        </div>
    )
}

export const UserGrid = ({ profiles, currentUserRole, onEdit, onDelete }: UserGridProps) => {
    const [qrProfile, setQrProfile] = useState<Profile | null>(null)

    const getRoleBrand = (role: string) => {
        if (role === 'Admin') return { color: 'bg-orange-500', text: 'text-orange-500', badge: 'bg-orange-50 text-orange-600 border border-orange-200' }
        if (role === 'Quản lý thiết kế') return { color: 'bg-blue-500', text: 'text-blue-500', badge: 'bg-blue-50 text-blue-600 border border-blue-200' }
        if (role === 'Quản lý thi công') return { color: 'bg-indigo-500', text: 'text-indigo-500', badge: 'bg-indigo-50 text-indigo-600 border border-indigo-200' }
        if (role === 'Kỹ sư') return { color: 'bg-amber-500', text: 'text-amber-500', badge: 'bg-amber-50 text-amber-600 border border-amber-200' }
        if (role === 'Khách hàng') return { color: 'bg-emerald-500', text: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-600 border border-emerald-200' }
        if (role === 'Nhân viên') return { color: 'bg-slate-500', text: 'text-slate-500', badge: 'bg-slate-50 text-slate-600 border border-slate-200' }
        return { color: 'bg-slate-500', text: 'text-slate-500', badge: 'bg-slate-50 text-slate-600 border border-slate-200' }
    }

    const getInitials = (name: string) => {
        if (!name) return '?'
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 pt-4">
                {profiles.map(p => {
                    const brand = getRoleBrand(p.role)
                    const hasProject = !!(p as any).construction_project_id
                    return (
                        <div key={p.id} className="bg-white border border-border-main rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-center flex flex-col group relative">
                            {/* Avatar */}
                            <div className={`w-14 h-14 mx-auto rounded-full ${brand.color} text-white flex items-center justify-center text-lg font-bold mb-4 shadow-sm`}>
                                {getInitials(p.full_name)}
                            </div>

                            {/* Info */}
                            <h4 className="text-[15px] font-semibold text-text-main mb-1 truncate">{p.full_name}</h4>
                            <p className="text-xs text-gray-500 mb-1 truncate">{p.position || 'Chức vụ'}</p>
                            <p className="text-xs text-gray-400 mb-3 truncate">{p.email}</p>

                            {/* Construction project badge for Khách hàng */}
                            {p.role === 'Khách hàng' && (
                                <p className={`text-[10px] font-bold mb-3 px-2 py-0.5 rounded-full inline-block mx-auto ${hasProject ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {hasProject ? '🏗️ Đã gắn công trình' : '⚠️ Chưa gắn công trình'}
                                </p>
                            )}

                            <div className="mt-auto flex flex-col items-center">
                                {/* Role Badge */}
                                <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${brand.badge}`}>
                                    {p.role}
                                </span>

                                {/* Actions */}
                                {currentUserRole === 'Admin' && (
                                    <div className="flex items-center justify-center gap-2 mt-5 border-t border-gray-100 pt-4 w-full">
                                        {/* QR button — only for Khách hàng */}
                                        {p.role === 'Khách hàng' && (
                                            <button
                                                onClick={() => setQrProfile(p)}
                                                className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-100 transition-colors"
                                                title="Xuất QR đăng nhập"
                                            >
                                                <QrCode size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onEdit(p)}
                                            className="w-9 h-9 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-colors"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(p.id)}
                                            className="w-9 h-9 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
                                            title="Xóa"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* QR Modal */}
            {qrProfile && (
                <CustomerQRModal profile={qrProfile} onClose={() => setQrProfile(null)} />
            )}
        </>
    )
}
