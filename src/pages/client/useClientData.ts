import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'

export interface ClientProject {
  id: string
  name: string
  owner_name: string | null
  address: string | null
  handover_date: string | null
  start_date: string | null
  progress: number
  status: string
  has_password: boolean
  risk_level: string | null
  contract_value: number | null
  budget: number | null
  spent: number | null
}

export const useClientData = (token: string) => {
  const [project, setProject] = useState<ClientProject | null>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const fetchAll = async () => {
      setLoading(true)
      setError(null)
      try {
        // Server-side RPC resolves exactly one project by token — the
        // underlying tables are locked to authenticated users only, this
        // is the sole anon-reachable read path. Never returns the raw
        // client_password (see verify_client_password for that).
        const { data, error: rpcErr } = await supabase.rpc('get_client_view_data', { p_token: token })

        if (rpcErr || !data) {
          setError('Không tìm thấy công trình. Vui lòng kiểm tra lại mã QR.')
          return
        }
        setProject(data.project as ClientProject)
        setTasks(data.tasks || [])
        setLogs(data.logs || [])
        setMilestones(data.milestones || [])
        setPayments(data.payments || [])
      } catch (e: any) {
        setError(e.message || 'Đã xảy ra lỗi khi tải dữ liệu.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [token])

  return { project, tasks, logs, milestones, payments, loading, error }
}
