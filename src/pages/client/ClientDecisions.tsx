// Trên link khách (/c/:mã): những việc chủ nhà cần quyết — duyệt phát sinh, chốt mẫu vật tư.
// Gọi RPC kiểm mã link + mật khẩu trong database; khách không cần tài khoản.
import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '../../services/supabase'

type CO = { id: string; code: string | null; title: string; description: string | null; cost: number; extra_days: number; status: string; client_note: string | null }
type Mat = { id: string; name: string; for_item: string | null; need_by: string | null; owner_choice: string | null }
const money = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' đ'
const ddmm = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '')

export function ClientDecisions({ token, password }: { token: string; password: string | null }) {
  const [cos, setCos] = useState<CO[]>([])
  const [mats, setMats] = useState<Mat[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [choice, setChoice] = useState<Record<string, string>>({})
  const [ready, setReady] = useState(false)

  const load = async () => {
    const { data, error } = await supabase.rpc('get_client_decisions', { p_token: token, p_password: password })
    setReady(true)
    if (error || !data) return
    setCos(data.change_orders || [])
    setMats(data.materials || [])
  }
  useEffect(() => { load() }, [token, password])

  const decide = async (c: CO, approve: boolean) => {
    const note = approve ? 'Đồng ý trên link xem tiến độ' : (prompt('Anh/chị cho DQH biết lý do (không bắt buộc):') ?? '')
    setBusy(c.id)
    const { data } = await supabase.rpc('client_decide_change_order', { p_token: token, p_password: password, p_id: c.id, p_approve: approve, p_note: note })
    setBusy(null)
    if (!data) alert('Không gửi được, anh/chị thử lại hoặc nhắn DQH.')
    load()
  }
  const choose = async (m: Mat) => {
    const v = (choice[m.id] || '').trim()
    if (!v) return
    setBusy(m.id)
    const { data } = await supabase.rpc('client_choose_material', { p_token: token, p_password: password, p_id: m.id, p_decision: v })
    setBusy(null)
    if (!data) alert('Không gửi được, anh/chị thử lại hoặc nhắn DQH.')
    load()
  }

  const pending = cos.filter(c => c.status === 'cho_khach')
  const decided = cos.filter(c => c.status !== 'cho_khach')
  if (!ready || (!pending.length && !mats.length && !decided.length)) return null

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">{pending.length + mats.length ? `${pending.length + mats.length} việc chờ anh/chị quyết định` : 'Phát sinh đã thống nhất'}</h2>
        <p className="text-xs text-slate-500">Mọi thay đổi chi phí chỉ được thi công sau khi anh/chị đồng ý tại đây.</p>
      </div>

      {pending.map(c => (
        <div key={c.id} className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 space-y-2">
          <p className="text-[11px] font-bold text-amber-800">PHÁT SINH {c.code}</p>
          <p className="font-semibold text-slate-900">{c.title}</p>
          {c.description && <p className="text-sm text-slate-600">{c.description}</p>}
          <p className="text-sm text-slate-800">Chi phí: <b>{c.cost >= 0 ? '+' : ''}{money(c.cost)}</b>{c.extra_days > 0 ? ` · thêm ${c.extra_days} ngày thi công` : ''}</p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button disabled={busy === c.id} onClick={() => decide(c, true)} className="py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60">{busy === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Đồng ý</button>
            <button disabled={busy === c.id} onClick={() => decide(c, false)} className="py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"><XCircle className="w-4 h-4" /> Không làm</button>
          </div>
        </div>
      ))}

      {mats.map(m => (
        <div key={m.id} className="border border-slate-200 rounded-xl p-4 space-y-2">
          <p className="text-[11px] font-bold text-slate-500">CHỐT VẬT TƯ{m.need_by ? ` · CẦN TRƯỚC ${ddmm(m.need_by)}` : ''}</p>
          <p className="font-semibold text-slate-900">{m.name}{m.for_item ? ` — ${m.for_item}` : ''}</p>
          {m.owner_choice && <p className="text-sm text-slate-600">{m.owner_choice}</p>}
          <div className="flex gap-2">
            <input value={choice[m.id] || ''} onChange={e => setChoice(s => ({ ...s, [m.id]: e.target.value }))} placeholder="Anh/chị chọn…" className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
            <button disabled={busy === m.id || !(choice[m.id] || '').trim()} onClick={() => choose(m)} className="px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-40">Gửi</button>
          </div>
        </div>
      ))}

      {decided.length > 0 && (
        <div className="pt-1 space-y-1">
          {decided.map(c => (
            <p key={c.id} className="text-xs text-slate-600">{c.code} · {c.title} — {c.status === 'khach_tu_choi' ? 'không làm' : 'đã đồng ý'} ({c.cost >= 0 ? '+' : ''}{money(c.cost)})</p>
          ))}
        </div>
      )}
    </div>
  )
}
