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
  client_password: string | null
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
        // Fetch project by client_token (public read — no auth needed)
        const { data: proj, error: projErr } = await supabase
          .from('construction_projects')
          .select('id,name,owner_name,address,handover_date,start_date,progress,status,client_password,risk_level,contract_value,budget,spent')
          .eq('client_token', token)
          .single()

        if (projErr || !proj) {
          setError('Không tìm thấy công trình. Vui lòng kiểm tra lại mã QR.')
          return
        }
        setProject(proj as ClientProject)

        // Fetch related data in parallel
        const [t, l, m, p] = await Promise.all([
          supabase.from('construction_tasks').select('*').eq('project_id', proj.id).order('created_at'),
          supabase.from('construction_daily_logs').select('*').eq('project_id', proj.id).order('date', { ascending: false }),
          supabase.from('construction_milestones').select('*').eq('project_id', proj.id).order('sort_order'),
          supabase.from('construction_payment_records').select('*').eq('project_id', proj.id).order('date', { ascending: false }),
        ])
        setTasks(t.data || [])
        setLogs(l.data || [])
        setMilestones(m.data || [])
        setPayments(p.data || [])
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
