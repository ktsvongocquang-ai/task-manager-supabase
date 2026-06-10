// ── DQH Site Board — Push Notification Service ───────────────────────────────
// Hỗ trợ: Browser Notification API + Supabase Realtime listener
// Không cần server riêng — hoạt động khi tab đang mở

export type NotifRole = 'TK' | 'GS' | 'XU' | 'QL' | 'ALL';

export interface DQHNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  tag?: string;          // Dedup: cùng tag → replace notification cũ
  timestamp: number;
  projectName?: string;
  role: NotifRole;       // Ai nên nhận
  type: 'defect_new' | 'defect_update' | 'revision_pending' | 'revision_approved'
      | 'revision_rejected' | 'diary_critical' | 'gate_pending' | 'gate_signed' | 'info';
  read: boolean;
  actionUrl?: string;
}

const STORAGE_KEY = 'dqh_notifications_v1';
const MAX_STORED = 50;

// ── In-memory notification store ─────────────────────────────────────────────
let _listeners: Array<(notifs: DQHNotification[]) => void> = [];

function getStored(): DQHNotification[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setStored(notifs: DQHNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(0, MAX_STORED)));
  _listeners.forEach(fn => fn(notifs.slice(0, MAX_STORED)));
}

// ── Permission ────────────────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function getPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// ── Fire a notification ───────────────────────────────────────────────────────
export function pushNotification(payload: Omit<DQHNotification, 'id' | 'timestamp' | 'read'>) {
  const notif: DQHNotification = {
    ...payload,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    read: false,
  };

  // 1. Store in-app
  const current = getStored();
  const filtered = payload.tag
    ? current.filter(n => n.tag !== payload.tag)
    : current;
  setStored([notif, ...filtered]);

  // 2. Browser Notification (nếu được cấp quyền)
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const browserNotif = new Notification(notif.title, {
        body: notif.body,
        icon: notif.icon || '/favicon.ico',
        tag: notif.tag,
        badge: '/favicon.ico',
      });
      browserNotif.onclick = () => {
        window.focus();
        browserNotif.close();
      };
      // Auto-close after 6s
      setTimeout(() => browserNotif.close(), 6000);
    } catch (e) {
      console.warn('Browser notification failed:', e);
    }
  }
}

// ── Subscribe to in-app notification changes ─────────────────────────────────
export function subscribeToNotifications(fn: (notifs: DQHNotification[]) => void): () => void {
  _listeners.push(fn);
  fn(getStored()); // emit current state immediately
  return () => {
    _listeners = _listeners.filter(l => l !== fn);
  };
}

export function markAllRead() {
  const updated = getStored().map(n => ({ ...n, read: true }));
  setStored(updated);
}

export function markRead(id: string) {
  const updated = getStored().map(n => n.id === id ? { ...n, read: true } : n);
  setStored(updated);
}

export function clearAll() {
  setStored([]);
}

export function getUnreadCount(): number {
  return getStored().filter(n => !n.read).length;
}

// ── Preset notification helpers ───────────────────────────────────────────────
export const notify = {
  defectNew: (projectName: string, defectTitle: string) =>
    pushNotification({
      title: `📍 Lỗi mới — ${projectName}`,
      body: defectTitle,
      tag: `defect-new-${projectName}`,
      role: 'ALL',
      type: 'defect_new',
      projectName,
    }),

  defectUpdated: (projectName: string, defectTitle: string, newStatus: string) =>
    pushNotification({
      title: `🔄 Cập nhật lỗi — ${projectName}`,
      body: `"${defectTitle}" → ${newStatus}`,
      tag: `defect-upd-${defectTitle}`,
      role: 'ALL',
      type: 'defect_update',
      projectName,
    }),

  revisionPending: (projectName: string, drawingType: string, version: string) =>
    pushNotification({
      title: `⏳ Bản vẽ chờ duyệt — ${projectName}`,
      body: `${drawingType} phiên bản ${version} — GS cần duyệt`,
      tag: `rev-pending-${projectName}-${drawingType}`,
      role: 'GS',
      type: 'revision_pending',
      projectName,
    }),

  revisionApproved: (projectName: string, drawingType: string, version: string) =>
    pushNotification({
      title: `✅ Bản vẽ đã duyệt — ${projectName}`,
      body: `${drawingType} ${version} được duyệt. Xưởng có thể bắt đầu.`,
      tag: `rev-approved-${projectName}-${drawingType}`,
      role: 'XU',
      type: 'revision_approved',
      projectName,
    }),

  revisionRejected: (projectName: string, drawingType: string, reason: string) =>
    pushNotification({
      title: `❌ Bản vẽ bị từ chối — ${projectName}`,
      body: `${drawingType}: ${reason}`,
      tag: `rev-rejected-${projectName}-${drawingType}`,
      role: 'TK',
      type: 'revision_rejected',
      projectName,
    }),

  diaryCritical: (projectName: string, note: string) =>
    pushNotification({
      title: `🚨 Sự cố công trình — ${projectName}`,
      body: note,
      tag: `diary-critical-${projectName}`,
      role: 'QL',
      type: 'diary_critical',
      projectName,
    }),

  gatePending: (projectName: string, gateName: string, waitingRole: string) =>
    pushNotification({
      title: `🔔 Cổng chờ ký — ${projectName}`,
      body: `"${gateName}" đang chờ ${waitingRole} ký xác nhận`,
      tag: `gate-pending-${projectName}-${gateName}`,
      role: 'ALL',
      type: 'gate_pending',
      projectName,
    }),
};
