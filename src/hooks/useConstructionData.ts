import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabase';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface SupabaseProject {
  id: string; name: string; address: string; status: string;
  progress: number; budget: number; spent: number; start_date: string;
  contract_value: number; budget_spent: number; risk_level: string;
  owner_name: string; engineer_name: string; handover_date: string;
  created_at: string;
}

export interface SupabaseTask {
  id: string; project_id: string; name: string; category: string;
  status: string; budget: number; spent: number; progress: number;
  dependencies: string[]; checklist: any[]; issues: any[]; days: number;
  start_date: string; end_date: string; subcontractor: string;
  tags: string[]; approved: boolean;
}

export interface SupabaseDailyLog {
  id: string; project_id: string; date: string; content: string;
  weather: string; temperature: number; main_workers: number;
  helper_workers: number; photo_urls: string[]; gps_lat: number;
  gps_lng: number; work_item: string; status: string; created_at: string;
}

export interface SupabaseApproval {
  id: string; project_id: string; type: string; title: string;
  detail: string; status: string; approved_by: string | null;
  created_at: string;
}

export interface SupabaseMilestone {
  id: string; project_id: string; name: string; status: string;
  approved_date: string | null; payment_amount: number;
  payment_status: string; sort_order: number;
}

export interface SupabaseSubcontractor {
  id: string; name: string; trade: string; phone: string;
  rating: number; project_ids: string[];
}

export interface SupabaseAttendance {
  id: string; project_id: string; date: string;
  main_workers: number; helper_workers: number;
  daily_rate_main: number; daily_rate_helper: number;
}

export interface SupabaseNotification {
  id: string; project_id: string; level: string;
  msg: string; read: boolean; created_at: string;
}

// ═══════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════

export const useConstructionData = () => {
  const [projects, setProjects] = useState<SupabaseProject[]>([]);
  const [tasks, setTasks] = useState<SupabaseTask[]>([]);
  const [logs, setLogs] = useState<SupabaseDailyLog[]>([]);
  const [approvals, setApprovals] = useState<SupabaseApproval[]>([]);
  const [milestones, setMilestones] = useState<SupabaseMilestone[]>([]);
  const [subcontractors, setSubcontractors] = useState<SupabaseSubcontractor[]>([]);
  const [attendance, setAttendance] = useState<SupabaseAttendance[]>([]);
  const [notifications, setNotifications] = useState<SupabaseNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // ── PROJECTS ──
  const loadProjects = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('construction_projects').select('*').order('created_at', { ascending: false });
    if (data) setProjects(data as any);
    setLoading(false);
  }, []);

  const createProject = async (project: Partial<SupabaseProject>): Promise<string | null> => {
    const { data, error } = await supabase.from('construction_projects').insert([project]).select('id').single();
    if (error) { console.error("Create Project error:", error); return null; }
    await loadProjects();
    return data?.id;
  };

  // ── TASKS ──
  const loadProjectDetails = useCallback(async (projectId: string) => {
    setLoading(true);
    const [tRes, lRes, aRes, mRes, attRes] = await Promise.all([
      supabase.from('construction_tasks').select('*').eq('project_id', projectId),
      supabase.from('daily_logs').select('*').eq('project_id', projectId).order('log_date', { ascending: false }).limit(20),
      supabase.from('construction_approvals').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('construction_milestones').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('construction_attendance').select('*').eq('project_id', projectId).order('date', { ascending: false }).limit(30),
    ]);
    if (tRes.data) setTasks(tRes.data as any);
    if (lRes.data) setLogs(lRes.data as any);
    if (aRes.data) setApprovals(aRes.data as any);
    if (mRes.data) setMilestones(mRes.data as any);
    if (attRes.data) setAttendance(attRes.data as any);
    setLoading(false);
  }, []);

  const createTimelineTasks = async (projectId: string, newTasks: any[]) => {
    try {
      const mapped = newTasks.map(t => ({
        id: crypto.randomUUID(),
        project_id: projectId,
        name: t.name,
        category: t.category,
        budget: t.budget,
        days: t.days,
        status: 'TODO',
        checklist: t.checklist.map((c: string) => ({ text: c, completed: false })),
        dependencies: [],
      }));
      newTasks.forEach((original, idx) => {
        mapped[idx].dependencies = original.dependencies.map((depIndex: number) => mapped[depIndex]?.id).filter(Boolean);
      });
      const { error } = await supabase.from('construction_tasks').insert(mapped);
      if (error) throw error;
      await loadProjectDetails(projectId);
      return true;
    } catch(e) {
      console.error("Bulk Insert Tasks Error:", e);
      return false;
    }
  };

  const updateTaskStatusChecklist = async (taskId: string, status: string, checklist: any[], issues: any[] = []) => {
    const { error } = await supabase.from('construction_tasks')
      .update({ status, checklist, issues })
      .eq('id', taskId);
    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status, checklist, issues } : t));
    }
    return !error;
  };

  // ── DAILY LOGS ──
  const submitDailyLog = async (logData: Partial<SupabaseDailyLog>) => {
    const { error } = await supabase.from('daily_logs').insert([logData]);
    if (!error && logData.project_id) {
      await loadProjectDetails(logData.project_id);
    }
    return !error;
  };

  // ── APPROVALS ──
  const loadApprovals = useCallback(async () => {
    const { data } = await supabase.from('construction_approvals').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    if (data) setApprovals(data as any);
  }, []);

  const handleApproval = async (approvalId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('construction_approvals')
      .update({ status })
      .eq('id', approvalId);
    if (!error) {
      setApprovals(prev => prev.map(a => a.id === approvalId ? { ...a, status } : a));
    }
    return !error;
  };

  const createApproval = async (approval: Partial<SupabaseApproval>) => {
    const { error } = await supabase.from('construction_approvals').insert([approval]);
    if (!error) await loadApprovals();
    return !error;
  };

  // ── MILESTONES ──
  const updateMilestoneStatus = async (milestoneId: string, status: string, paymentStatus?: string) => {
    const updates: any = { status };
    if (status === 'passed') updates.approved_date = new Date().toISOString().split('T')[0];
    if (paymentStatus) updates.payment_status = paymentStatus;
    const { error } = await supabase.from('construction_milestones')
      .update(updates)
      .eq('id', milestoneId);
    if (!error) {
      setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, ...updates } : m));
    }
    return !error;
  };

  const createMilestone = async (milestone: Partial<SupabaseMilestone>) => {
    const { error } = await supabase.from('construction_milestones').insert([milestone]);
    return !error;
  };

  // ── SUBCONTRACTORS ──
  const loadSubcontractors = useCallback(async () => {
    const { data } = await supabase.from('construction_subcontractors').select('*').order('rating', { ascending: false });
    if (data) setSubcontractors(data as any);
  }, []);

  const createSubcontractor = async (sub: Partial<SupabaseSubcontractor>) => {
    const { error } = await supabase.from('construction_subcontractors').insert([sub]);
    if (!error) await loadSubcontractors();
    return !error;
  };

  // ── ATTENDANCE ──
  const submitAttendance = async (record: Partial<SupabaseAttendance>) => {
    const { error } = await supabase.from('construction_attendance').insert([record]);
    return !error;
  };

  // ── NOTIFICATIONS ──
  const loadNotifications = useCallback(async () => {
    const { data } = await supabase.from('construction_notifications').select('*').order('created_at', { ascending: false }).limit(20);
    if (data) setNotifications(data as any);
  }, []);

  const markNotificationRead = async (notifId: string) => {
    const { error } = await supabase.from('construction_notifications')
      .update({ read: true })
      .eq('id', notifId);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    }
    return !error;
  };

  // ── INIT ──
  useEffect(() => {
    loadProjects();
    loadSubcontractors();
    loadNotifications();
    loadApprovals();
  }, [loadProjects, loadSubcontractors, loadNotifications, loadApprovals]);

  return {
    // State
    projects, tasks, logs, approvals, milestones, subcontractors, attendance, notifications, loading,
    // Projects
    loadProjects, createProject,
    // Tasks
    loadProjectDetails, createTimelineTasks, updateTaskStatusChecklist,
    // Daily Logs
    submitDailyLog,
    // Approvals
    loadApprovals, handleApproval, createApproval,
    // Milestones
    updateMilestoneStatus, createMilestone,
    // Subcontractors
    loadSubcontractors, createSubcontractor,
    // Attendance
    submitAttendance,
    // Notifications
    loadNotifications, markNotificationRead,
  };
};
