import React, { useState, useEffect } from 'react'
import { Check, X, Info, FolderKanban, CheckSquare, Crown, User, Palette, Video, HeartHandshake, HardHat, LayoutTemplate, Save, Loader2 } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'

import { DEFAULT_PERMISSIONS, generateFlatPermissions } from '../../constants/permissions'

const ROLE_KEYS = [
    { key: 'Admin', icon: Crown, color: 'text-admin' },
    { key: 'Quản lý', icon: User, color: 'text-manager' },
    { key: 'Thiết Kế', icon: Palette, color: 'text-indigo-500' },
    { key: 'Marketing', icon: Video, color: 'text-pink-500' },
    { key: 'Sale', icon: HeartHandshake, color: 'text-emerald-600' },
    { key: 'Giám Sát', icon: HardHat, color: 'text-amber-600' },
];

export const PermissionMatrix = () => {
    const { profile, fetchPermissions } = useAuthStore()
    const isAdmin = profile?.role === 'Admin' || profile?.role === 'Giám đốc'
    
    const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(generateFlatPermissions())
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const loadSettings = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('system_settings')
                    .select('value')
                    .eq('id', 'permissions')
                    .single()
                
                if (!error && data?.value && Object.keys(data.value).length > 0) {
                    setPermissions(prev => ({ ...prev, ...data.value }))
                }
            } catch (err) {
                console.error('Lỗi tải cài đặt phân quyền:', err)
            } finally {
                setIsLoading(false)
            }
        }
        loadSettings()
    }, [])

    const togglePermission = (rowName: string, roleKey: string) => {
        // Double check not admin
        if (roleKey === 'Admin') return;
        
        const currentVal = permissions[rowName]?.[roleKey] ?? false;
        setPermissions(prev => ({
            ...prev,
            [rowName]: {
                ...(prev[rowName] || {}),
                [roleKey]: !currentVal
            }
        }))
    }

    const saveChanges = async () => {
        if (!isAdmin) return;
        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('system_settings')
                .upsert({ id: 'permissions', value: permissions })
            
            if (error) throw error;
            alert('Lưu phân quyền thành công! Cài đặt đã được áp dụng.');
            // Update auth store with the new JSON
            if (fetchPermissions) {
               await fetchPermissions();
            }
        } catch (err: any) {
            console.error('Lỗi lưu phân quyền:', err);
            alert(`Lỗi lưu hệ thống: ${err.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    const getNote = (category: string, rowName: string, roleIndex: number) => {
        const rowData = DEFAULT_PERMISSIONS[category as keyof typeof DEFAULT_PERMISSIONS]?.find(r => r.name === rowName)
        if (!rowData) return '';
        const keys = ['admin', 'manager', 'design', 'marketing', 'sale', 'supervisor'];
        const key = keys[roleIndex] as keyof typeof rowData;
        return (rowData[key] as any)?.note || '';
    }

    return (
        <div className="bg-white border border-border-main rounded-xl shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-border-main flex items-center justify-between bg-gray-50/50 shrink-0 rounded-t-xl">
                <div className="text-gray-900 font-semibold flex items-center gap-2 text-sm">
                    <Info size={16} className="text-primary" />
                    Bảng Quản lý Phân Quyền Động
                </div>
                {isAdmin && (
                    <button
                        onClick={saveChanges}
                        disabled={isSaving || isLoading}
                        className={`flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 ${isSaving || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Lưu
                    </button>
                )}
            </div>

            {/* Scroll hint on mobile */}
            <div className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 border-b border-blue-100 sm:hidden">
                <span className="text-[11px] text-blue-500 font-medium">← Vuốt ngang để xem tất cả quyền →</span>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[60vh] rounded-b-xl">
                {isLoading ? (
                    <div className="p-12 flex justify-center text-gray-400">
                        <Loader2 size={32} className="animate-spin" />
                    </div>
                ) : (
                    <table className="text-sm" style={{ minWidth: '700px', width: '100%' }}>
                        <thead className="sticky top-0 z-20 shadow-sm">
                            <tr className="border-b border-border-main bg-gray-50">
                                <th className="text-left py-3 px-4 font-semibold text-gray-500 w-[160px] min-w-[140px] bg-gray-50 z-30 border-r border-slate-200 sticky left-0 shadow-[2px_0_4px_rgba(0,0,0,0.06)]">Chức năng</th>
                                {ROLE_KEYS.map((rk) => (
                                    <th key={rk.key} className={`text-center py-3 px-2 font-semibold ${rk.color} bg-gray-50 min-w-[80px] w-[90px]`}>
                                        <div className="flex flex-col items-center justify-center gap-1"><rk.icon size={16} /><span className="text-[11px]">{rk.key}</span></div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(DEFAULT_PERMISSIONS).map(([category, perms]) => (
                                <React.Fragment key={category}>
                                    <tr className="bg-gray-100">
                                        <td colSpan={7} className="py-2 px-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest bg-gray-100 z-10 border-y border-gray-200">
                                            <div className="flex items-center gap-2">
                                                {category.includes('DỰ ÁN') ? <FolderKanban size={16} /> : category.includes('TRUY CẬP') ? <LayoutTemplate size={16} /> : <CheckSquare size={16} />}
                                                {category}
                                            </div>
                                        </td>
                                    </tr>
                                    {perms.map((p, i) => (
                                        <tr key={i} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                                            <td className="py-2.5 px-4 text-xs font-semibold text-gray-700 sticky left-0 bg-white border-r border-slate-100 shadow-[2px_0_4px_rgba(0,0,0,0.06)] z-10 leading-snug">
                                                {p.name}
                                            </td>
                                            {ROLE_KEYS.map((rk, idx) => {
                                                const isAllowed = rk.key === 'Admin' ? true : (permissions[p.name]?.[rk.key] ?? false);
                                                const note = getNote(category, p.name, idx);
                                                const canEditThisCell = isAdmin && rk.key !== 'Admin';

                                                return (
                                                    <td key={idx} className="py-2 px-2 text-center">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <button
                                                                onClick={() => canEditThisCell && togglePermission(p.name, rk.key)}
                                                                disabled={!canEditThisCell}
                                                                className={`p-1 rounded-lg transition-all ${canEditThisCell ? 'hover:bg-slate-100 active:scale-90 cursor-pointer' : 'cursor-default'}`}
                                                                title={canEditThisCell ? 'Nhấn để thay đổi' : ''}
                                                            >
                                                                {isAllowed
                                                                    ? <Check size={18} className="text-emerald-500" strokeWidth={3} />
                                                                    : <X size={18} className="text-rose-400/70" strokeWidth={2.5} />}
                                                            </button>
                                                            {note && <span className="text-[9px] text-gray-400 leading-tight max-w-[70px]">{note}</span>}
                                                        </div>
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {!isAdmin && (
                <div className="p-3 text-center text-xs text-gray-500 bg-gray-50/50 border-t border-slate-100">
                    Chỉ Admin mới có quyền lưu thay đổi bảng phân quyền.
                </div>
            )}
        </div>
    )
}

