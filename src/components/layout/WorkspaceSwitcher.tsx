// Nút góc trên bên trái (điện thoại): bấm để xổ ra "Chọn khu làm việc" (Thiết kế / Thi công)
// và các nút thao tác nhanh theo vai trò. Giống kiểu "Chọn bộ não" của Javis.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Check, Menu } from 'lucide-react'
import {
    WORKSPACE_META, workspacesFor, workspaceOfPath, workspaceHome, quickActions, rememberWorkspace,
    type WorkspaceId, type QuickAction,
} from '../../utils/workspaces'

type Props = {
    role?: string | null
    /** Dòng phụ dưới mỗi khu, ví dụ "4 công trình" */
    subtitles?: Partial<Record<WorkspaceId, string>>
    onOpenFullMenu?: () => void
    onQuickEvent?: (e: NonNullable<QuickAction['event']>) => void
    className?: string
}

export function WorkspaceSwitcher({ role, subtitles, onOpenFullMenu, onQuickEvent, className = '' }: Props) {
    const [open, setOpen] = useState(false)
    const nav = useNavigate()
    const loc = useLocation()
    const list = workspacesFor(role)
    const ws = workspaceOfPath(loc.pathname, role)
    const meta = WORKSPACE_META[ws]
    const actions = quickActions(ws, role)

    useEffect(() => { rememberWorkspace(ws) }, [ws])
    useEffect(() => { setOpen(false) }, [loc.pathname, loc.search])

    if (!list.length) return null

    const go = (to: string) => { setOpen(false); nav(to) }
    const pickWs = (id: WorkspaceId) => { rememberWorkspace(id); go(workspaceHome(id, role)) }
    const runAction = (a: QuickAction) => { if (a.event) { setOpen(false); onQuickEvent?.(a.event) } else go(a.to) }

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-2xl border transition-all active:scale-[0.98] ${open ? 'border-[#7A1216] ring-2 ring-[#7A1216]/15 bg-white' : 'border-slate-200 bg-white'}`}
            >
                <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center shrink-0`}>
                    <meta.icon size={16} className="text-white" />
                </span>
                <span className="text-left leading-tight min-w-0">
                    <span className="block text-[15px] font-bold text-slate-900 truncate">{meta.label}</span>
                    <span className="block text-[10px] font-semibold text-slate-500 truncate max-w-[140px]">{role || ''}</span>
                </span>
                <ChevronDown size={16} className={`text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-[70] bg-slate-900/20" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 w-[min(88vw,340px)] max-h-[75vh] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-2xl z-[71] p-2 animate-in fade-in zoom-in-95 duration-150">
                        {list.length > 1 && (
                            <>
                                <p className="px-2 pt-1.5 pb-2 text-sm font-bold text-slate-900">Chọn khu làm việc</p>
                                <div className="space-y-1 mb-2">
                                    {list.map(id => {
                                        const m = WORKSPACE_META[id]
                                        const on = id === ws
                                        return (
                                            <button key={id} onClick={() => pickWs(id)} className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${on ? 'bg-red-50/70' : 'hover:bg-slate-50'}`}>
                                                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${on ? `bg-gradient-to-br ${m.color} text-white` : 'bg-slate-100 text-slate-600'}`}>
                                                    <m.icon size={18} />
                                                </span>
                                                <span className="flex-1 min-w-0">
                                                    <span className="block font-bold text-slate-900">{m.label}</span>
                                                    {subtitles?.[id] && <span className="block text-xs text-slate-500 truncate">{subtitles[id]}</span>}
                                                </span>
                                                {on && <Check size={18} className="text-[#7A1216] shrink-0" />}
                                            </button>
                                        )
                                    })}
                                </div>
                                <div className="border-t border-slate-100 mx-1 mb-2" />
                            </>
                        )}

                        <p className="px-2 pt-1 pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Thao tác nhanh · {meta.label}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {actions.map(a => (
                                <button key={a.label} onClick={() => runAction(a)} className="flex flex-col items-start gap-1.5 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 active:scale-[0.98] text-left">
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.tone || 'bg-slate-100 text-slate-700'}`}><a.icon size={16} /></span>
                                    <span className="text-[13px] font-semibold text-slate-800 leading-tight">{a.label}</span>
                                    {a.hint && <span className="text-[10px] text-slate-500 leading-tight -mt-1">{a.hint}</span>}
                                </button>
                            ))}
                        </div>

                        {onOpenFullMenu && (
                            <button onClick={() => { setOpen(false); onOpenFullMenu() }} className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 text-slate-700 text-sm font-semibold hover:bg-slate-100">
                                <Menu size={16} /> Menu đầy đủ
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
