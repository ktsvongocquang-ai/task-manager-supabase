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
  unexpected_costs: number; total_documents: number; days_off: number;
  total_diary_entries: number; created_at: string;
}

export interface SupabaseTask {
  id: string; project_id: string; name: string; category: string;
  status: string; budget: number; spent: number; progress: number;
  dependencies: string[]; checklist: any[]; issues: any[]; days: number;
  start_date: string; end_date: string; subcontractor: string;
  tags: string[]; approved: boolean;
  planned_start?: string; planned_end?: string; duration?: number;
}

export interface SupabaseDailyLog {
  id: string; project_id: string; date: string; content: string;
  notes: string; weather: string; temperature: number;
  main_workers: number; helper_workers: number;
  task_category: string; task_progress: number;
  photo_urls: string[]; contractor_photo_urls: string[];
  video_urls: string[]; voice_notes: string[];
  machines: string; materials: string;
  gps_lat: number; gps_lng: number; work_item: string;
  status: string; reporter_name: string;
  comments: any[]; issue_ids: string[];
  created_by: string; editable: boolean; created_at: string;
}

export interface SupabaseApproval {
  id: string; project_id: string; type: string; title: string;
  detail: string; status: string; approved_by: string | null;
  created_at: string;
}

export interface SupabaseMilestone {
  id: string; project_id: string; name: string; status: string;
  approved_date: string | null; payment_amount: number;
  payment_status: string; sort_order: number; sub_tasks: any[];
}

export interface SupabaseSubcontractor {
  id: string; name: string; trade: string; phone: string;
  rating: number; project_ids: string[];
  contract_amount: number; paid_amount: number; progress_percent: number;
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

export interface SupabasePaymentRecord {
  id: string; project_id: string; date: string;
  description: string; amount: number; bill_photos: string[];
  type: string; status: string; category: string; created_at: string;
}

export interface SupabasePhase {
  id: string; project_id: string; name: string;
  status: string; sort_order: number;
  start_date: string | null; end_date: string | null; note: string;
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
  const [paymentRecords, setPaymentRecords] = useState<SupabasePaymentRecord[]>([]);
  const [phases, setPhases] = useState<SupabasePhase[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // ── PROJECTS ──
  const loadProjects = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('construction_projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setProjects(data as SupabaseProject[]);
    setLoading(false);
  }, []);

  const createProject = async (project: Partial<SupabaseProject>): Promise<string | null> => {
    const { data, error } = await supabase
      .from('construction_projects')
      .insert([project])
      .select('id')
      .single();
    if (error) { console.error('Create Project error:', error); return null; }
    await loadProjects();
    return data?.id;
  };

  const updateProject = async (projectId: string, updates: Partial<SupabaseProject>) => {
    const { error } = await supabase
      .from('construction_projects')
      .update(updates)
      .eq('id', projectId);
    if (!error) {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
    }
    return !error;
  };

  // ── PROJECT DETAILS (tasks, logs, approvals, milestones, attendance, payments, phases) ──
  const loadProjectDetails = useCallback(async (projectId: string) => {
    setLoading(true);
    setCurrentProjectId(projectId);
    const [tRes, lRes, aRes, mRes, attRes, payRes, phRes] = await Promise.all([
      supabase.from('construction_tasks').select('*').eq('project_id', projectId).order('created_at'),
      supabase.from('daily_logs').select('*').eq('project_id', projectId).order('date', { ascending: false }).limit(30),
      supabase.from('construction_approvals').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('construction_milestones').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('construction_attendance').select('*').eq('project_id', projectId).order('date', { ascending: false }).limit(30),
      supabase.from('construction_payment_records').select('*').eq('project_id', projectId).order('date', { ascending: false }),
      supabase.from('construction_phases').select('*').eq('project_id', projectId).order('sort_order'),
    ]);
    if (tRes.data) setTasks(tRes.data as SupabaseTask[]);
    if (lRes.data) setLogs(lRes.data as SupabaseDailyLog[]);
    if (aRes.data) setApprovals(aRes.data as SupabaseApproval[]);
    if (mRes.data) setMilestones(mRes.data as SupabaseMilestone[]);
    if (attRes.data) setAttendance(attRes.data as SupabaseAttendance[]);
    if (payRes.data) setPaymentRecords(payRes.data as SupabasePaymentRecord[]);
    if (phRes.data) setPhases(phRes.data as SupabasePhase[]);
    setLoading(false);
  }, []);

  // ── TASKS ──
  const createTimelineTasks = async (projectId: string, newTasks: any[], projectStartDate?: string) => {
    try {
      // Assign UUIDs first so dependencies can reference them
      const ids = newTasks.map(() => crypto.randomUUID());

      // Calculate planned dates using dependencies chain (topological — deps always earlier in array)
      const taskEndDates: Date[] = [];
      const baseStart = projectStartDate ? new Date(projectStartDate) : new Date();

      const addDaysLocal = (d: Date, n: number) => {
        const r = new Date(d); r.setDate(r.getDate() + n); return r;
      };
      const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

      const startDates: Date[] = [];
      newTasks.forEach((t, idx) => {
        // If task has its own startDate from AI extraction, use it
        if (t.startDate) {
          const parsedStart = new Date(t.startDate);
          if (!isNaN(parsedStart.getTime())) {
            startDates[idx] = parsedStart;
            taskEndDates[idx] = addDaysLocal(parsedStart, (t.days || 1) - 1);
            return;
          }
        }
        // Otherwise, calculate from dependencies
        const depEndDates = (t.dependencies || [])
          .map((depIdx: number) => taskEndDates[depIdx])
          .filter(Boolean);
        const taskStart = depEndDates.length > 0
          ? addDaysLocal(depEndDates.reduce((a: Date, b: Date) => a > b ? a : b), 1)
          : baseStart;
        startDates[idx] = taskStart;
        taskEndDates[idx] = addDaysLocal(taskStart, (t.days || 1) - 1);
      });

      const mapped = newTasks.map((t, idx) => ({
        id: ids[idx],
        project_id: projectId,
        name: t.name,
        category: t.category,
        budget: t.budget,
        days: t.days,
        status: 'TODO',
        subcontractor: t.subcontractor || '',
        checklist: (t.checklist || []).map((c: any) =>
          typeof c === 'string'
            ? { id: crypto.randomUUID(), label: c, completed: false, required: false }
            : c
        ),
        dependencies: (t.dependencies || []).map((depIdx: number) => ids[depIdx]).filter(Boolean),
        issues: [],
        tags: [],
        spent: 0,
        progress: 0,
        approved: false,
        start_date: fmtDate(startDates[idx]),
        end_date: fmtDate(taskEndDates[idx]),
      }));

      const { error } = await supabase.from('construction_tasks').insert(mapped);
      if (error) throw error;
      await loadProjectDetails(projectId);
      return true;
    } catch (e) {
      console.error('Bulk Insert Tasks Error:', e);
      return false;
    }
  };

  const updateTaskStatusChecklist = async (taskId: string, status: string, checklist: any[], issues: any[] = []) => {
    const { error } = await supabase
      .from('construction_tasks')
      .update({ status, checklist, issues })
      .eq('id', taskId);
    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status, checklist, issues } : t));
    }
    return !error;
  };

  const updateTaskProgress = async (taskId: string, progress: number, spent?: number) => {
    const updates: any = { progress };
    if (spent !== undefined) updates.spent = spent;
    const { error } = await supabase
      .from('construction_tasks')
      .update(updates)
      .eq('id', taskId);
    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    }
    return !error;
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('construction_tasks')
      .delete()
      .eq('id', taskId);
    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
    return !error;
  };

  // ── UPDATE TASK DATES (for Gantt inline editing) ──
  const updateTaskDates = async (taskId: string, dateUpdates: {
    planned_start?: string; planned_end?: string;
    start_date?: string; end_date?: string;
    duration?: number; days?: number;
  }) => {
    const { error } = await supabase
      .from('construction_tasks')
      .update(dateUpdates)
      .eq('id', taskId);
    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...dateUpdates } : t));
    }
    return !error;
  };

  // ── DELETE PROJECT (cascade delete all children) ──
  const deleteProject = async (projectId: string) => {
    try {
      // Delete children first (tasks, logs, milestones, approvals, attendance, payments, phases)
      await Promise.all([
        supabase.from('construction_tasks').delete().eq('project_id', projectId),
        supabase.from('daily_logs').delete().eq('project_id', projectId),
        supabase.from('construction_milestones').delete().eq('project_id', projectId),
        supabase.from('construction_approvals').delete().eq('project_id', projectId),
        supabase.from('construction_attendance').delete().eq('project_id', projectId),
        supabase.from('construction_payment_records').delete().eq('project_id', projectId),
        supabase.from('construction_phases').delete().eq('project_id', projectId),
      ]);
      // Then delete the project itself
      const { error } = await supabase.from('construction_projects').delete().eq('id', projectId);
      if (!error) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        // Clear current data if it was the active project
        if (currentProjectId === projectId) {
          setTasks([]); setLogs([]); setApprovals([]); setMilestones([]);
          setAttendance([]); setPaymentRecords([]); setPhases([]);
        }
      }
      return !error;
    } catch (e) {
      console.error('Delete Project Error:', e);
      return false;
    }
  };

  // ── REPLACE TIMELINE TASKS (delete old tasks, insert new, preserve daily logs) ──
  const replaceTimelineTasks = async (projectId: string, newTasks: any[], projectStartDate?: string) => {
    try {
      // Step 1: Delete all existing tasks for this project
      await supabase.from('construction_tasks').delete().eq('project_id', projectId);
      // Step 2: Create new timeline tasks (reuse existing logic)
      const result = await createTimelineTasks(projectId, newTasks, projectStartDate);
      return result;
    } catch (e) {
      console.error('Replace Timeline Error:', e);
      return false;
    }
  };

  // ── DAILY LOGS ──
  const submitDailyLog = async (logData: Partial<SupabaseDailyLog>) => {
    const { data, error } = await supabase
      .from('daily_logs')
      .insert([logData])
      .select()
      .single();
    if (!error && data) {
      setLogs(prev => [data as SupabaseDailyLog, ...prev]);
      // Update project diary count
      if (logData.project_id) {
        const proj = projects.find(p => p.id === logData.project_id);
        if (proj) {
          await updateProject(logData.project_id, { total_diary_entries: (proj.total_diary_entries || 0) + 1 });
        }
      }
    }
    return !error;
  };

  const updateDailyLog = async (logId: string, updates: Partial<SupabaseDailyLog>) => {
    const { error } = await supabase
      .from('daily_logs')
      .update(updates)
      .eq('id', logId);
    if (!error) {
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, ...updates } : l));
    }
    return !error;
  };

  // ── APPROVALS ──
  const loadApprovals = useCallback(async () => {
    const { data } = await supabase
      .from('construction_approvals')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) setApprovals(data as SupabaseApproval[]);
  }, []);

  const handleApproval = async (approvalId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('construction_approvals')
      .update({ status })
      .eq('id', approvalId);
    if (!error) {
      setApprovals(prev => prev.map(a => a.id === approvalId ? { ...a, status } : a));
    }
    return !error;
  };

  const createApproval = async (approval: Partial<SupabaseApproval>) => {
    const { error } = await supabase
      .from('construction_approvals')
      .insert([approval]);
    if (!error) await loadApprovals();
    return !error;
  };

  // ── MILESTONES ──
  const updateMilestoneStatus = async (milestoneId: string, status: string, paymentStatus?: string) => {
    const updates: any = { status };
    if (status === 'passed') updates.approved_date = new Date().toISOString().split('T')[0];
    if (paymentStatus) updates.payment_status = paymentStatus;
    const { error } = await supabase
      .from('construction_milestones')
      .update(updates)
      .eq('id', milestoneId);
    if (!error) {
      setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, ...updates } : m));
    }
    return !error;
  };

  const createMilestone = async (milestone: Partial<SupabaseMilestone>) => {
    const { error } = await supabase
      .from('construction_milestones')
      .insert([milestone]);
    return !error;
  };

  // ── SUBCONTRACTORS ──
  const loadSubcontractors = useCallback(async () => {
    const { data } = await supabase
      .from('construction_subcontractors')
      .select('*')
      .order('rating', { ascending: false });
    if (data) setSubcontractors(data as SupabaseSubcontractor[]);
  }, []);

  const createSubcontractor = async (sub: Partial<SupabaseSubcontractor>) => {
    const { error } = await supabase
      .from('construction_subcontractors')
      .insert([sub]);
    if (!error) await loadSubcontractors();
    return !error;
  };

  // ── ATTENDANCE ──
  const submitAttendance = async (record: Partial<SupabaseAttendance>) => {
    const { error } = await supabase
      .from('construction_attendance')
      .insert([record]);
    if (!error && record.project_id) {
      const { data } = await supabase
        .from('construction_attendance')
        .select('*')
        .eq('project_id', record.project_id)
        .order('date', { ascending: false })
        .limit(30);
      if (data) setAttendance(data as SupabaseAttendance[]);
    }
    return !error;
  };

  // ── NOTIFICATIONS ──
  const loadNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('construction_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data as SupabaseNotification[]);
  }, []);

  const markNotificationRead = async (notifId: string) => {
    const { error } = await supabase
      .from('construction_notifications')
      .update({ read: true })
      .eq('id', notifId);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    }
    return !error;
  };

  // ── PAYMENT RECORDS ──
  const createPaymentRecord = async (record: Partial<SupabasePaymentRecord>) => {
    const { data, error } = await supabase
      .from('construction_payment_records')
      .insert([record])
      .select()
      .single();
    if (!error && data) {
      setPaymentRecords(prev => [data as SupabasePaymentRecord, ...prev]);
    }
    return !error;
  };

  const updatePaymentRecord = async (recordId: string, updates: Partial<SupabasePaymentRecord>) => {
    const { error } = await supabase
      .from('construction_payment_records')
      .update(updates)
      .eq('id', recordId);
    if (!error) {
      setPaymentRecords(prev => prev.map(r => r.id === recordId ? { ...r, ...updates } : r));
    }
    return !error;
  };

  // ── PHASES ──
  const updatePhase = async (phaseId: string, updates: Partial<SupabasePhase>) => {
    const { error } = await supabase
      .from('construction_phases')
      .update(updates)
      .eq('id', phaseId);
    if (!error) {
      setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, ...updates } : p));
    }
    return !error;
  };

  const createPhase = async (phase: Partial<SupabasePhase>) => {
    const { data, error } = await supabase
      .from('construction_phases')
      .insert([phase])
      .select()
      .single();
    if (!error && data) {
      setPhases(prev => [...prev, data as SupabasePhase].sort((a, b) => a.sort_order - b.sort_order));
    }
    return !error;
  };

  // ── REAL-TIME SUBSCRIPTIONS ──
  useEffect(() => {
    if (!currentProjectId) return;

    const channel = supabase
      .channel(`construction:${currentProjectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'construction_tasks', filter: `project_id=eq.${currentProjectId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, payload.new as SupabaseTask]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as SupabaseTask : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'daily_logs', filter: `project_id=eq.${currentProjectId}` },
        (payload) => {
          setLogs(prev => [payload.new as SupabaseDailyLog, ...prev]);
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'construction_approvals', filter: `project_id=eq.${currentProjectId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setApprovals(prev => [payload.new as SupabaseApproval, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setApprovals(prev => prev.map(a => a.id === payload.new.id ? payload.new as SupabaseApproval : a));
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentProjectId]);

  // ── INIT ──
  useEffect(() => {
    loadProjects();
    loadSubcontractors();
    loadNotifications();
    loadApprovals();
  }, [loadProjects, loadSubcontractors, loadNotifications, loadApprovals]);

  // Computed: attendance summary for a project
  const getAttendanceSummary = (projectId: string) => {
    const projectAtt = attendance.filter(a => a.project_id === projectId);
    const last7 = projectAtt.slice(0, 7);
    const last30 = projectAtt.slice(0, 30);
    const dailyRate = { main: 450000, helper: 280000 };
    if (projectAtt.length > 0) {
      dailyRate.main = projectAtt[0].daily_rate_main;
      dailyRate.helper = projectAtt[0].daily_rate_helper;
    }
    return {
      thisWeek: {
        main: last7.reduce((s, a) => s + a.main_workers, 0),
        helper: last7.reduce((s, a) => s + a.helper_workers, 0),
      },
      thisMonth: {
        main: last30.reduce((s, a) => s + a.main_workers, 0),
        helper: last30.reduce((s, a) => s + a.helper_workers, 0),
      },
      dailyRate,
    };
  };

  // Computed: finance data from projects
  const getFinanceData = () => {
    const totalInflow = projects.reduce((s, p) => s + (p.spent || 0), 0);
    const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
    const totalSpent = projects.reduce((s, p) => s + (p.spent || 0), 0);
    return {
      monthlyInflow: Math.round(totalInflow * 0.3),
      monthlyOutflow: Math.round(totalSpent * 0.25),
      workingCapital: totalBudget - totalSpent,
      upcoming: [] as any[],
    };
  };

  return {
    // State
    projects, tasks, logs, approvals, milestones, subcontractors,
    attendance, notifications, paymentRecords, phases, loading,
    // Projects
    loadProjects, createProject, updateProject,
    // Tasks
    loadProjectDetails, createTimelineTasks, replaceTimelineTasks, updateTaskStatusChecklist,
    updateTaskProgress, updateTaskDates, deleteTask,
    // Projects
    deleteProject,
    // Daily Logs
    submitDailyLog, updateDailyLog,
    // Approvals
    loadApprovals, handleApproval, createApproval,
    // Milestones
    updateMilestoneStatus, createMilestone,
    // Subcontractors
    loadSubcontractors, createSubcontractor,
    // Attendance
    submitAttendance, getAttendanceSummary,
    // Notifications
    loadNotifications, markNotificationRead,
    // Payment Records
    createPaymentRecord, updatePaymentRecord,
    // Phases
    updatePhase, createPhase,
    // Computed
    getFinanceData,
  };
};
