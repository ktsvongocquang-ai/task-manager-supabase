// ═══════════════════════════════════════════════════════════
// TASK NOTIFICATION SERVICE — Zalo OA + Telegram
// ═══════════════════════════════════════════════════════════

interface NotificationSettings {
  telegram: { token: string; chatId: string };
  zalo: { token: string; chatId: string };
}

interface TaskNotification {
  taskName: string;
  projectName: string;
  assignee?: string;
  status?: string;
  deadline?: string;
  action: 'assigned' | 'status_changed' | 'completed' | 'comment';
  changedBy?: string;
}

function getSettings(): NotificationSettings | null {
  try {
    const saved = localStorage.getItem('dqh_notification_settings');
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

// ── TELEGRAM ──
async function sendTelegram(text: string): Promise<boolean> {
  const settings = getSettings();
  if (!settings?.telegram?.token || !settings?.telegram?.chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${settings.telegram.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: settings.telegram.chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch (e) {
    console.warn('[Notification] Telegram error:', e);
    return false;
  }
}

// ── ZALO OA (BOT SERVER) ──
async function sendZalo(text: string, recipientZaloId?: string): Promise<boolean> {
  const settings = getSettings();
  const targetId = recipientZaloId || settings?.zalo?.chatId;
  
  if (!targetId) {
    console.warn('[Notification] Zalo recipient ID missing');
    alert('Lỗi Zalo: Không tìm thấy ID/SĐT Zalo của người nhận.');
    return false;
  }

  try {
    const res = await fetch('https://zalo-bot-server.onrender.com/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: targetId,
        message: text,
      }),
    });
    
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      console.warn('[Notification] Zalo Bot error:', data);
      alert('Lỗi gửi Zalo Bot: ' + (data.error || 'Lỗi không xác định'));
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn('[Notification] Zalo Bot error:', e);
    alert('Lỗi hệ thống khi gọi Zalo Bot Server: ' + e?.message);
    return false;
  }
}

// ── FORMAT MESSAGES ──
function formatTaskMessage(notif: TaskNotification): string {
  const emoji = {
    assigned: '📋',
    status_changed: '🔄',
    completed: '✅',
    comment: '💬',
  };

  const statusMap: Record<string, string> = {
    'TODO': 'Cần làm',
    'DOING': 'Đang thi công',
    'REVIEW': 'Chờ nghiệm thu',
    'DONE': 'Hoàn thành',
  };

  let msg = `${emoji[notif.action]} <b>DQH App</b>\n\n`;

  switch (notif.action) {
    case 'assigned':
      msg += `📌 <b>Task mới được giao</b>\n`;
      msg += `📋 ${notif.taskName}\n`;
      msg += `🏗️ Dự án: ${notif.projectName}\n`;
      if (notif.assignee) msg += `👤 Giao cho: ${notif.assignee}\n`;
      if (notif.deadline) msg += `📅 Deadline: ${notif.deadline}\n`;
      if (notif.changedBy) msg += `\n👉 Được giao bởi: ${notif.changedBy}`;
      break;
    case 'status_changed':
      msg += `🔄 <b>Cập nhật trạng thái</b>\n`;
      msg += `📋 ${notif.taskName}\n`;
      msg += `🏗️ Dự án: ${notif.projectName}\n`;
      msg += `📊 Trạng thái: <b>${statusMap[notif.status || ''] || notif.status}</b>\n`;
      if (notif.changedBy) msg += `\n👉 Cập nhật bởi: ${notif.changedBy}`;
      break;
    case 'completed':
      msg += `✅ <b>Task hoàn thành!</b>\n`;
      msg += `📋 ${notif.taskName}\n`;
      msg += `🏗️ Dự án: ${notif.projectName}\n`;
      if (notif.changedBy) msg += `\n🎉 Hoàn thành bởi: ${notif.changedBy}`;
      break;
    case 'comment':
      msg += `💬 <b>Bình luận mới</b>\n`;
      msg += `📋 ${notif.taskName}\n`;
      msg += `🏗️ Dự án: ${notif.projectName}\n`;
      if (notif.changedBy) msg += `\n✍️ Từ: ${notif.changedBy}`;
      break;
  }

  return msg;
}

function formatZaloMessage(notif: TaskNotification): string {
  // Zalo doesn't support HTML, use plain text
  const statusMap: Record<string, string> = {
    'TODO': 'Cần làm', 'DOING': 'Đang thi công',
    'REVIEW': 'Chờ nghiệm thu', 'DONE': 'Hoàn thành',
  };

  let msg = '🔔 DQH App\n\n';
  switch (notif.action) {
    case 'assigned':
      msg += `📌 Task mới: ${notif.taskName}\n`;
      msg += `🏗️ Dự án: ${notif.projectName}\n`;
      if (notif.assignee) msg += `👤 Giao cho: ${notif.assignee}\n`;
      if (notif.deadline) msg += `📅 Deadline: ${notif.deadline}\n`;
      break;
    case 'status_changed':
      msg += `🔄 ${notif.taskName}\n`;
      msg += `📊 → ${statusMap[notif.status || ''] || notif.status}\n`;
      msg += `🏗️ ${notif.projectName}\n`;
      break;
    case 'completed':
      msg += `✅ Hoàn thành: ${notif.taskName}\n`;
      msg += `🏗️ ${notif.projectName}\n`;
      break;
    case 'comment':
      msg += `💬 Bình luận mới: ${notif.taskName}\n`;
      msg += `🏗️ ${notif.projectName}\n`;
      break;
  }
  return msg;
}

// ── PUBLIC API ──

export async function notifyTaskAssigned(taskName: string, projectName: string, assignee?: string, deadline?: string, changedBy?: string, zaloUserId?: string) {
  const notif: TaskNotification = { taskName, projectName, assignee, deadline, action: 'assigned', changedBy };
  const [tg, zl] = await Promise.allSettled([
    sendTelegram(formatTaskMessage(notif)),
    sendZalo(formatZaloMessage(notif), zaloUserId),
  ]);
  console.log('[Notification] Task assigned:', { telegram: tg, zalo: zl });
}

export async function notifyTaskStatusChanged(taskName: string, projectName: string, newStatus: string, changedBy?: string) {
  const notif: TaskNotification = {
    taskName, projectName, status: newStatus, changedBy,
    action: newStatus === 'DONE' ? 'completed' : 'status_changed',
  };
  const [tg, zl] = await Promise.allSettled([
    sendTelegram(formatTaskMessage(notif)),
    sendZalo(formatZaloMessage(notif)),
  ]);
  console.log('[Notification] Status changed:', { telegram: tg, zalo: zl });
}

export async function notifyNewComment(taskName: string, projectName: string, commenterName: string) {
  const notif: TaskNotification = { taskName, projectName, action: 'comment', changedBy: commenterName };
  const [tg, zl] = await Promise.allSettled([
    sendTelegram(formatTaskMessage(notif)),
    sendZalo(formatZaloMessage(notif)),
  ]);
  console.log('[Notification] Comment:', { telegram: tg, zalo: zl });
}

// Check if notifications are configured
export function isNotificationConfigured(): boolean {
  const settings = getSettings();
  return !!(settings?.telegram?.token || settings?.zalo?.token);
}
