// ═══════════════════════════════════════════════════════════
// CONSTRUCTION MODULE — SHARED TYPES & DATA
// ═══════════════════════════════════════════════════════════

export type UserRole = 'HOMEOWNER' | 'ENGINEER' | 'MANAGER';
export type TaskStatus = 'TODO' | 'DOING' | 'REVIEW' | 'DONE';
export type ViewTab = 'DASHBOARD' | 'KANBAN' | 'COST' | 'PROGRESS' | 'LOGS' | 'SUBS' | 'ATTENDANCE' | 'REPORTS';

export interface Project {
  id: string; name: string; startDate: string; handoverDate: string; status: string;
  progress: number; budget: number; spent: number; contractValue: number;
  address: string; ownerName: string; engineerName: string;
  budgetSpent: number; riskLevel: 'green' | 'yellow' | 'red';
}

export interface CTask {
  id: string; name: string; category: string; status: TaskStatus;
  subcontractor: string; days: number; budget: number; spent: number;
  approved: boolean; dependencies: string[]; tags: string[];
  issues: Issue[]; checklist: ChecklistItem[]; progress: number;
  startDate?: string; endDate?: string;
}

export interface ChecklistItem { id: string; label: string; completed: boolean; required: boolean; }
export interface Issue {
  id: string; title: string; description: string; status: 'OPEN' | 'FIXING' | 'RESOLVED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH'; photoBefore?: string; photoAfter?: string; createdAt: string;
}

export interface Approval {
  id: string; projectId: string; type: 'qc' | 'material' | 'variation' | 'budget_alert';
  title: string; detail: string; date: string; status: 'pending' | 'approved' | 'rejected';
}

export interface Milestone {
  id: string; name: string; status: 'upcoming' | 'pending_internal' | 'passed';
  approvedDate: string | null; paymentAmount: number; paymentStatus: 'paid' | 'unpaid';
}

export interface Subcontractor {
  id: string; name: string; trade: string; phone: string; rating: number; projectIds: string[];
}

export interface Notification {
  id: string; level: 'critical' | 'action' | 'good' | 'info'; msg: string; time: string; read: boolean;
}

export interface AttendanceData {
  thisWeek: { main: number; helper: number };
  thisMonth: { main: number; helper: number };
  dailyRate: { main: number; helper: number };
}

export interface FinanceData {
  monthlyInflow: number; monthlyOutflow: number; workingCapital: number;
  upcoming: { desc: string; amount: number; dueDate: string; type: 'in' | 'out' }[];
}

// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

export const fmt = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} Tỷ`;
  if (n >= 1e6) return `${Math.round(n / 1e6)} Tr`;
  return n.toLocaleString('vi-VN') + ' đ';
};

export const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string; border: string }> = {
  TODO: { label: 'Cần làm', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
  DOING: { label: 'Đang làm', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  REVIEW: { label: 'Nghiệm thu', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  DONE: { label: 'Hoàn thành', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

export const catColors: Record<string, string> = {
  'PHẦN THÔ': 'bg-orange-100 text-orange-700 border-orange-200',
  'MEP': 'bg-sky-100 text-sky-700 border-sky-200',
  'HOÀN THIỆN': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'NỘI THẤT': 'bg-purple-100 text-purple-700 border-purple-200',
  'KHÁC': 'bg-slate-100 text-slate-600 border-slate-200',
};
