// ═══════════════════════════════════════════════════════════
// CONSTRUCTION MODULE — SHARED TYPES & DATA
// ═══════════════════════════════════════════════════════════

export type UserRole = 'HOMEOWNER' | 'ENGINEER' | 'MANAGER';
export type TaskStatus = 'TODO' | 'DOING' | 'REVIEW' | 'DONE';
export type ViewTab = 'DASHBOARD' | 'KANBAN' | 'COST' | 'PROGRESS' | 'LOGS' | 'SUBS' | 'ATTENDANCE' | 'REPORTS' | 'DIARY' | 'PAYMENTS' | 'AI_GANTT';

export interface Project {
  id: string; name: string; startDate: string; handoverDate: string; status: string;
  progress: number; budget: number; spent: number; contractValue: number;
  address: string; ownerName: string; engineerName: string;
  budgetSpent: number; riskLevel: 'green' | 'yellow' | 'red';
  unexpectedCosts: number; totalDocuments: number; daysOff: number; totalDiaryEntries: number;
}

export interface CTask {
  id: string; name: string; category: string; status: TaskStatus;
  subcontractor: string; days: number; budget: number; spent: number;
  approved: boolean; dependencies: string[]; tags: string[];
  issues: Issue[]; checklist: ChecklistItem[]; progress: number;
  startDate?: string; endDate?: string;
  // --- New fields for Interactive Gantt & Real-time Kanban ---
  plannedStart?: string;
  plannedEnd?: string;
  duration?: number;
  actualStart?: string;
  actualEnd?: string;
  requiredWorkers?: number;
  taskLevel?: 'macro' | 'micro';
  isExtra?: boolean;
  isOverdue?: boolean;
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

// Sub-tasks within a milestone (e.g., "Làm lán", "Móc móng", "Đổ đá", "Đi sắt")
export interface SubTask {
  id: string; name: string; status: 'done' | 'doing' | 'upcoming';
  progress: number; photos: string[]; note?: string;
}

export interface Milestone {
  id: string; name: string; status: 'upcoming' | 'pending_internal' | 'passed';
  approvedDate: string | null; paymentAmount: number; paymentStatus: 'paid' | 'unpaid';
  subTasks: SubTask[];
}

export interface Subcontractor {
  id: string; name: string; trade: string; phone: string; rating: number; projectIds: string[];
  contractAmount?: number; paidAmount?: number; progressPercent?: number;
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

// Daily construction diary — the core feature for tracking
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'storm';
export interface DailyLog {
  id: string;
  date: string; // ISO date
  projectId: string;
  weatherAM: WeatherType;
  weatherPM: WeatherType;
  taskCategory: string; // e.g., "BTCT tầng lừng"
  taskProgress: number; // 0-100
  workerCount: { main: number; helper: number };
  sitePhotos: string[]; // photos by engineer on-site
  contractorPhotos: string[]; // photos reported by contractor
  videos: string[];
  voiceNotes: string[]; // transcribed voice notes
  notes: string;
  issues: string[]; // issue IDs linked
  createdBy: 'ENGINEER' | 'MANAGER';
  editable: boolean;
  // --- New fields for Phase H ---
  status: 'pending' | 'approved' | 'rejected';
  reporterName: string;
  temperature: number;
  machines: string;
  materials: string;
  comments: { id: string; author: string; text: string; time: string }[];
}

// Payment records with bill/receipt photos
export interface PaymentRecord {
  id: string;
  projectId: string;
  date: string;
  description: string;
  amount: number;
  billPhotos: string[]; // receipt/invoice photos
  type: 'payment_out' | 'payment_in';
  status: 'confirmed' | 'pending';
  category: string; // e.g., "Vật liệu", "Nhân công"
}

// Construction phases (pre-construction checklist)
export interface ConstructionPhase {
  id: string;
  name: string;
  status: 'done' | 'doing' | 'upcoming';
  order: number;
  startDate?: string;
  endDate?: string;
  note?: string;
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

export const weatherLabel: Record<WeatherType, { icon: string; label: string; color: string }> = {
  sunny: { icon: '☀️', label: 'Nắng', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  cloudy: { icon: '⛅', label: 'Mây', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  rainy: { icon: '🌧️', label: 'Mưa', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  storm: { icon: '⛈️', label: 'Bão', color: 'bg-rose-100 text-rose-700 border-rose-200' },
};

