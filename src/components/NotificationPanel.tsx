import { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, X, Check, CheckCheck, Trash2, ChevronRight } from 'lucide-react';
import {
  DQHNotification,
  subscribeToNotifications,
  markAllRead,
  markRead,
  clearAll,
  requestNotificationPermission,
  getPermissionStatus,
  getUnreadCount,
} from '../lib/notifications';

interface NotificationPanelProps {
  currentProjectName?: string;
}

const TYPE_ICON: Record<DQHNotification['type'], string> = {
  defect_new:        '📍',
  defect_update:     '🔄',
  revision_pending:  '⏳',
  revision_approved: '✅',
  revision_rejected: '❌',
  diary_critical:    '🚨',
  gate_pending:      '🔔',
  gate_signed:       '🟢',
  info:              'ℹ️',
};

const TYPE_COLOR: Record<DQHNotification['type'], string> = {
  defect_new:        'border-l-rose-500',
  defect_update:     'border-l-amber-400',
  revision_pending:  'border-l-amber-400',
  revision_approved: 'border-l-emerald-500',
  revision_rejected: 'border-l-rose-500',
  diary_critical:    'border-l-red-600',
  gate_pending:      'border-l-sky-400',
  gate_signed:       'border-l-emerald-500',
  info:              'border-l-slate-500',
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export default function NotificationPanel({ currentProjectName }: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<DQHNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [permStatus, setPermStatus] = useState(getPermissionStatus());
  const panelRef = useRef<HTMLDivElement>(null);

  // Subscribe to notification store
  useEffect(() => {
    const unsub = subscribeToNotifications(ns => {
      setNotifs(ns);
      setUnread(ns.filter(n => !n.read).length);
    });
    return unsub;
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function handleRequestPermission() {
    const ok = await requestNotificationPermission();
    setPermStatus(ok ? 'granted' : 'denied');
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setOpen(v => !v);
          if (!open && unread > 0) setTimeout(markAllRead, 2000);
        }}
        className={`relative p-2 rounded-xl transition-all cursor-pointer ${
          open
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
        }`}
        title="Thông báo"
        id="notification-bell-btn"
      >
        {unread > 0
          ? <BellRing className="w-4 h-4 animate-pulse" />
          : <Bell className="w-4 h-4" />
        }
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl z-[9999] overflow-hidden flex flex-col"
          style={{ maxHeight: '480px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">Thông báo</span>
              {unread > 0 && (
                <span className="text-[9px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded-full">
                  {unread} mới
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifs.length > 0 && (
                <>
                  <button
                    onClick={markAllRead}
                    title="Đánh dấu tất cả đã đọc"
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={clearAll}
                    title="Xóa tất cả"
                    className="p-1.5 hover:bg-rose-500/20 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Permission prompt */}
          {permStatus !== 'granted' && permStatus !== 'unsupported' && (
            <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-3">
              <Bell className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-amber-300">Bật thông báo trình duyệt</p>
                <p className="text-[10px] text-amber-400/70">Nhận thông báo ngay cả khi không mở tab</p>
              </div>
              <button
                onClick={handleRequestPermission}
                className="shrink-0 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
              >
                Bật
              </button>
            </div>
          )}

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Bell className="w-8 h-8 mb-3 opacity-30" />
                <p className="text-xs font-bold">Chưa có thông báo</p>
                <p className="text-[11px] mt-1 opacity-70 text-center px-6">
                  Thông báo sẽ xuất hiện khi có cập nhật từ công trình, xưởng hoặc thiết kế
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {notifs.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-200 border-l-3 ${
                      n.read 
                        ? 'bg-slate-900/50 border-l-2 border-slate-700/30 opacity-50 hover:opacity-80 hover:bg-slate-800/30' 
                        : 'bg-amber-500/10 border-l-2 border-amber-400 hover:bg-amber-500/15'
                    }`}
                  >
                    <span className={`text-base shrink-0 mt-0.5 ${n.read ? 'grayscale opacity-50' : ''}`}>{TYPE_ICON[n.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-[11px] leading-tight ${n.read ? 'font-medium text-slate-500' : 'font-bold text-white'}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 bg-amber-400 rounded-full shrink-0 mt-1 animate-pulse shadow-sm shadow-amber-400/50" />
                        )}
                      </div>
                      <p className={`text-[10px] mt-0.5 leading-relaxed line-clamp-2 ${n.read ? 'text-slate-600' : 'text-slate-300'}`}>
                        {n.body}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[9px] font-mono ${n.read ? 'text-slate-600' : 'text-slate-400'}`}>{timeAgo(n.timestamp)}</span>
                        {n.projectName && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${n.read ? 'text-slate-600 bg-slate-800/50' : 'text-amber-300 bg-amber-500/15'}`}>
                            {n.projectName.length > 20 ? n.projectName.slice(0, 20) + '…' : n.projectName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="px-4 py-2.5 bg-slate-800/50 border-t border-slate-700/50 text-center">
              <span className="text-[10px] text-slate-500">
                {notifs.length} thông báo · {unread > 0 ? `${unread} chưa đọc` : 'Tất cả đã đọc ✓'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
