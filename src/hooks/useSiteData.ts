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
  client_password?: string | null;
  /** Loại hình công trình: Xây mới / Cải tạo / Sửa chữa / Căn hộ — dùng cho wizard Flow đề xuất. */
  project_type?: string | null;
  /** Thứ tự + màu Hạng mục lớn tuỳ chỉnh (Workflow Tuỳ biến) — [{ name, color }], NULL = dùng mặc định. */
  workflow_phases?: { name: string; color: string }[] | null;
  /** Mã dự án — do trigger DB tự sinh (VD "P00385"), chỉ đọc, không gửi lên khi insert/update. */
  project_code?: string | null;
}

export interface SupabaseTask {
  id: string; project_id: string; name: string; category: string;
  status: string; budget: number; spent: number; progress: number;
  dependencies: string[]; checklist: any[]; issues: any[]; days: number;
  start_date: string; end_date: string; subcontractor: string;
  tags: string[]; approved: boolean;
  planned_start?: string; planned_end?: string; duration?: number;
}

// Khớp đúng cột thật của bảng daily_logs trên Supabase (đã kiểm tra trực tiếp qua service-role) —
// KHÔNG có content/task_category/reporter_name/created_by/contractor_photo_urls/video_urls/voice_notes/comments/issue_ids/editable.
export interface SupabaseDailyLog {
  id: string; project_id: string; date: string;
  notes: string; weather: string; weather_morning: string; weather_afternoon: string; temperature: number;
  main_workers: number; sub_workers: number; helper_workers: number;
  progress: number; photo_urls: string[]; voice_transcript: string;
  gps_lat: number; gps_lng: number; work_item: string;
  status: string; engineer_id: string; created_at: string;
  // Thêm cho bản nâng cấp Nhật ký kiểu IKI (site_board_unify_schema / nhat_ky_nghiem_thu_nhac_viec_schema.sql)
  weather_periods?: Record<string, string> | null; // {sang, trua, chieu, toi, dem}
  quality_ratings?: Record<string, string> | null; // {an_toan, chat_luong, tien_do, ve_sinh}
  incident_photo_urls?: string[];
  checklist?: { id: string; label: string; completed: boolean }[] | null;
  /** Loại dòng nhật ký — set lúc tạo (form đầy đủ / chụp ảnh nhanh / ghi chú), dùng để gắn nhãn trong danh sách. */
  entry_mode?: 'full' | 'photo' | 'note' | null;
  /** Đánh dấu "lỗi cần sửa" — set từ luồng Chụp ảnh nhanh, hiện badge cảnh báo trong danh sách. */
  is_issue?: boolean | null;
  /** Tổ đội thi công phụ trách — hiện trong báo cáo chia sẻ (VD "Mr Tiến"). */
  team_name?: string | null;
  /** Mô tả tự do (viết tay) việc đã làm hôm nay / kế hoạch ngày mai — khác "Việc dự kiến ngày mai"
   * (lấy từ Bảng tiến độ), đây là câu chữ tự nhiên không gắn với task cụ thể nào. */
  today_summary?: string | null;
  tomorrow_plan?: string | null;
}

export interface DailyLogItem {
  id: string; daily_log_id: string; item_name: string;
  unit: string | null; quantity: number | null; note: string | null; created_at: string;
  /** Giờ công + thiết bị sử dụng cho hạng mục này — tuỳ chọn, khớp mẫu báo cáo tham khảo. */
  man_hours?: number | null; equipment?: string | null;
}

export interface ConstructionAcceptance {
  id: string; project_id: string; title: string;
  status: 'pending' | 'passed' | 'failed'; created_by: string | null;
  note: string | null; created_at: string;
  work_name?: string | null; address?: string | null; so_phieu?: string | null;
  ngay_nghiem_thu?: string | null; don_vi_thi_cong?: string | null;
  giam_sat?: string | null; dai_dien_khach_hang?: string | null;
  khac_phuc?: string | null; thoi_han?: string | null;
  sig_thi_cong_url?: string | null; sig_khach_hang_url?: string | null;
  name_thi_cong?: string | null; name_khach_hang?: string | null;
}

export interface ConstructionAcceptanceItem {
  id: string; acceptance_id: string; criterion_name: string;
  result: 'đạt' | 'không đạt' | null; photo_url: string | null;
  note: string | null; sort_order: number;
  photo_urls?: string[] | null;
}

export interface ConstructionReminder {
  id: string; project_id: string; title: string;
  due_date: string | null; assignee_id: string | null;
  status: 'pending' | 'done'; created_by: string | null; created_at: string;
  category?: string | null;
  checklist?: { id: string; label: string; completed: boolean }[] | null;
  photo_urls?: string[] | null;
  /** Tên tổ đội/người ngoài hệ thống (không có tài khoản profiles) — dùng khi assignee_id trống. */
  assignee_name?: string | null;
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

/** Dữ liệu cho màn Công trường (gộp từ app sdqh): nhật ký có hạng mục, nghiệm thu, nhắc việc. */
export const useSiteData = () => {
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
  const [dailyLogItems, setDailyLogItems] = useState<DailyLogItem[]>([]);
  const [acceptances, setAcceptances] = useState<ConstructionAcceptance[]>([]);
  const [acceptanceItems, setAcceptanceItems] = useState<ConstructionAcceptanceItem[]>([]);
  const [reminders, setReminders] = useState<ConstructionReminder[]>([]);
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

  // construction_projects KHÔNG có unexpected_costs/total_documents/days_off/total_diary_entries
  // (những field này chỉ tồn tại trong SupabaseProject như số suy đoán cũ, không phải cột thật) —
  // và project_code do trigger DB tự sinh, không được gửi lên. Luôn lọc trước khi insert/update.
  const stripNonRealProjectFields = (input: Partial<SupabaseProject>) => {
    const { unexpected_costs, total_documents, days_off, total_diary_entries, project_code, ...rest } = input as any;
    return rest;
  };

  const createProject = async (project: Partial<SupabaseProject>): Promise<string | null> => {
    const { data, error } = await supabase
      .from('construction_projects')
      .insert([stripNonRealProjectFields(project)])
      .select('id')
      .single();
    if (error) { console.error('Create Project error:', error); return null; }
    await loadProjects();
    return data?.id;
  };

  const updateProject = async (projectId: string, updates: Partial<SupabaseProject>) => {
    const { error } = await supabase
      .from('construction_projects')
      .update(stripNonRealProjectFields(updates))
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
    const [tRes, lRes, aRes, mRes, attRes, payRes, phRes, accRes, remRes] = await Promise.all([
      supabase.from('construction_tasks').select('*').eq('project_id', projectId).order('created_at'),
      supabase.from('daily_logs').select('*').eq('project_id', projectId).order('date', { ascending: false }).limit(30),
      supabase.from('construction_approvals').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('construction_milestones').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('construction_attendance').select('*').eq('project_id', projectId).order('date', { ascending: false }).limit(30),
      supabase.from('construction_payment_records').select('*').eq('project_id', projectId).order('date', { ascending: false }),
      supabase.from('construction_phases').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('construction_acceptances').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('construction_reminders').select('*').eq('project_id', projectId).order('due_date', { ascending: true }),
    ]);
    if (tRes.data) setTasks(tRes.data as SupabaseTask[]);
    if (lRes.data) setLogs(lRes.data as SupabaseDailyLog[]);
    if (aRes.data) setApprovals(aRes.data as SupabaseApproval[]);
    if (mRes.data) setMilestones(mRes.data as SupabaseMilestone[]);
    if (attRes.data) setAttendance(attRes.data as SupabaseAttendance[]);
    if (payRes.data) setPaymentRecords(payRes.data as SupabasePaymentRecord[]);
    if (phRes.data) setPhases(phRes.data as SupabasePhase[]);
    if (accRes.data) setAcceptances(accRes.data as ConstructionAcceptance[]);
    if (remRes.data) setReminders(remRes.data as ConstructionReminder[]);

    // daily_log_items phụ thuộc log id — tải sau khi có danh sách logs ở trên
    if (lRes.data && lRes.data.length > 0) {
      const logIds = lRes.data.map((l: any) => l.id);
      const { data: itemsData } = await supabase.from('daily_log_items').select('*').in('daily_log_id', logIds);
      if (itemsData) setDailyLogItems(itemsData as DailyLogItem[]);
    } else {
      setDailyLogItems([]);
    }
    // acceptance_items phụ thuộc acceptance id
    if (accRes.data && accRes.data.length > 0) {
      const accIds = accRes.data.map((a: any) => a.id);
      const { data: accItemsData } = await supabase.from('construction_acceptance_items').select('*').in('acceptance_id', accIds).order('sort_order');
      if (accItemsData) setAcceptanceItems(accItemsData as ConstructionAcceptanceItem[]);
    } else {
      setAcceptanceItems([]);
    }
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
  // Lưu ý: construction_tasks KHÔNG có cột planned_start/planned_end/duration — chỉ gửi start_date/end_date/days thật.
  const updateTaskDates = async (taskId: string, dateUpdates: {
    planned_start?: string; planned_end?: string;
    start_date?: string; end_date?: string;
    duration?: number; days?: number;
  }) => {
    const { planned_start, planned_end, duration, ...realColumns } = dateUpdates;
    const { error } = await supabase
      .from('construction_tasks')
      .update(realColumns)
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
  // Trả về dòng vừa tạo (kèm id thật) để chỗ gọi có thể lưu tiếp daily_log_items liên kết.
  const submitDailyLog = async (logData: Partial<SupabaseDailyLog>): Promise<SupabaseDailyLog | null> => {
    const { data, error } = await supabase
      .from('daily_logs')
      .insert([logData])
      .select()
      .single();
    if (error || !data) { console.error('Submit daily log error:', error); return null; }
    setLogs(prev => [data as SupabaseDailyLog, ...prev]);
    return data as SupabaseDailyLog;
  };

  const updateDailyLog = async (logId: string, updates: Partial<SupabaseDailyLog>) => {
    const { error } = await supabase
      .from('daily_logs')
      .update(updates)
      .eq('id', logId);
    if (error) { console.error('Update daily log error:', error); }
    else {
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, ...updates } : l));
    }
    return { ok: !error, error: error?.message };
  };

  /** Xoá hẳn 1 nhật ký (Nhật ký/Ghi chú/Ảnh nhanh) — xoá luôn daily_log_items con trước để không để lại rác. */
  const deleteDailyLog = async (logId: string) => {
    await supabase.from('daily_log_items').delete().eq('daily_log_id', logId);
    const { error } = await supabase.from('daily_logs').delete().eq('id', logId);
    if (error) { console.error('Delete daily log error:', error); }
    else {
      setLogs(prev => prev.filter(l => l.id !== logId));
      setDailyLogItems(prev => prev.filter(it => it.daily_log_id !== logId));
    }
    return { ok: !error, error: error?.message };
  };

  // ── DAILY LOG ITEMS (khối lượng công việc theo từng nhật ký) ──
  const saveDailyLogItems = async (dailyLogId: string, items: { item_name: string; unit?: string; quantity?: number; note?: string; man_hours?: number; equipment?: string }[]) => {
    if (items.length === 0) return true;
    const payload = items.map(it => ({ daily_log_id: dailyLogId, ...it }));
    const { data, error } = await supabase.from('daily_log_items').insert(payload).select();
    if (!error && data) {
      setDailyLogItems(prev => [...prev, ...(data as DailyLogItem[])]);
    }
    return !error;
  };

  /** Xoá hết khối lượng công việc cũ của 1 nhật ký — dùng khi sửa (thay bằng danh sách mới qua saveDailyLogItems). */
  const deleteDailyLogItemsForLog = async (dailyLogId: string) => {
    const { error } = await supabase.from('daily_log_items').delete().eq('daily_log_id', dailyLogId);
    if (!error) {
      setDailyLogItems(prev => prev.filter(it => it.daily_log_id !== dailyLogId));
    }
    return !error;
  };

  // ── NGHIỆM THU (ACCEPTANCES) ──
  const createAcceptance = async (
    acceptance: Partial<ConstructionAcceptance> & { project_id: string; title: string },
    items: { criterion_name: string; result?: string | null; photo_urls?: string[]; note?: string }[]
  ): Promise<boolean> => {
    const { data, error } = await supabase.from('construction_acceptances').insert([acceptance]).select().single();
    if (error || !data) { console.error('Create acceptance error:', error); return false; }
    setAcceptances(prev => [data as ConstructionAcceptance, ...prev]);

    if (items.length > 0) {
      const itemsPayload = items.map((it, idx) => ({ acceptance_id: data.id, sort_order: idx, ...it }));
      const { data: itemsData, error: itemsError } = await supabase.from('construction_acceptance_items').insert(itemsPayload).select();
      if (itemsError) { console.error('Create acceptance items error:', itemsError); return false; }
      if (itemsData) setAcceptanceItems(prev => [...prev, ...(itemsData as ConstructionAcceptanceItem[])]);
    }
    return true;
  };

  const updateAcceptance = async (acceptanceId: string, updates: Partial<ConstructionAcceptance>) => {
    const { error } = await supabase.from('construction_acceptances').update(updates).eq('id', acceptanceId);
    if (!error) {
      setAcceptances(prev => prev.map(a => a.id === acceptanceId ? { ...a, ...updates } : a));
    }
    return !error;
  };

  const updateAcceptanceItem = async (itemId: string, updates: Partial<ConstructionAcceptanceItem>) => {
    const { error } = await supabase.from('construction_acceptance_items').update(updates).eq('id', itemId);
    if (!error) {
      setAcceptanceItems(prev => prev.map(it => it.id === itemId ? { ...it, ...updates } : it));
    }
    return !error;
  };

  const updateAcceptanceItemResult = async (itemId: string, result: 'đạt' | 'không đạt' | null) => {
    return updateAcceptanceItem(itemId, { result });
  };

  const updateAcceptanceStatus = async (acceptanceId: string, status: ConstructionAcceptance['status']) => {
    return updateAcceptance(acceptanceId, { status });
  };

  /** Xoá hẳn 1 phiếu nghiệm thu — xoá luôn construction_acceptance_items con trước để không để lại rác. */
  const deleteAcceptance = async (acceptanceId: string) => {
    await supabase.from('construction_acceptance_items').delete().eq('acceptance_id', acceptanceId);
    const { error } = await supabase.from('construction_acceptances').delete().eq('id', acceptanceId);
    if (error) { console.error('Delete acceptance error:', error); }
    else {
      setAcceptances(prev => prev.filter(a => a.id !== acceptanceId));
      setAcceptanceItems(prev => prev.filter(it => it.acceptance_id !== acceptanceId));
    }
    return { ok: !error, error: error?.message };
  };

  // ── NHẮC VIỆC (REMINDERS) ──
  const createReminder = async (reminder: {
    project_id: string; title: string; due_date?: string | null; assignee_id?: string | null; created_by?: string;
    category?: string | null; checklist?: { id: string; label: string; completed: boolean }[]; photo_urls?: string[];
    assignee_name?: string | null;
  }) => {
    const { data, error } = await supabase.from('construction_reminders').insert([reminder]).select().single();
    if (!error && data) {
      setReminders(prev => [data as ConstructionReminder, ...prev]);
    }
    return !error;
  };

  const toggleReminderStatus = async (reminderId: string, status: 'pending' | 'done') => {
    const { error } = await supabase.from('construction_reminders').update({ status }).eq('id', reminderId);
    if (!error) {
      setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, status } : r));
    }
    return !error;
  };

  const updateReminder = async (reminderId: string, updates: Partial<ConstructionReminder>) => {
    const { error } = await supabase.from('construction_reminders').update(updates).eq('id', reminderId);
    if (!error) {
      setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, ...updates } : r));
    }
    return !error;
  };

  const deleteReminder = async (reminderId: string) => {
    const { error } = await supabase.from('construction_reminders').delete().eq('id', reminderId);
    if (!error) {
      setReminders(prev => prev.filter(r => r.id !== reminderId));
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
    dailyLogItems, acceptances, acceptanceItems, reminders,
    // Projects
    loadProjects, createProject, updateProject,
    // Tasks
    loadProjectDetails, createTimelineTasks, replaceTimelineTasks, updateTaskStatusChecklist,
    updateTaskProgress, updateTaskDates, deleteTask,
    // Projects
    deleteProject,
    // Daily Logs
    submitDailyLog, updateDailyLog, deleteDailyLog, saveDailyLogItems, deleteDailyLogItemsForLog,
    // Nghiệm thu
    createAcceptance, updateAcceptance, updateAcceptanceItem, updateAcceptanceItemResult, updateAcceptanceStatus, deleteAcceptance,
    // Nhắc việc
    createReminder, toggleReminderStatus, updateReminder, deleteReminder,
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
