// Gửi Telegram cho một nhân sự (chuyển từ api/send-telegram.js cũ).
import { db, check, CoreError } from './db.js';

/** Gửi chữ thường (không Markdown) tới 1 chat/nhóm. Telegram giới hạn 4096 ký tự/tin -> tự cắt nhiều tin. */
export async function sendTelegramText(chatId, text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new CoreError(500, 'Chưa cấu hình TELEGRAM_BOT_TOKEN');
  if (!chatId) throw new CoreError(400, 'Thiếu chat id');
  const chunks = [];
  let rest = String(text);
  while (rest.length > 3900) {
    const cut = rest.lastIndexOf('\n', 3900) > 1000 ? rest.lastIndexOf('\n', 3900) : 3900;
    chunks.push(rest.slice(0, cut)); rest = rest.slice(cut);
  }
  chunks.push(rest);
  for (const c of chunks) {
    const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: c, disable_web_page_preview: true }),
    });
    if (!r.ok) throw new CoreError(502, 'Telegram từ chối gửi tin', await r.text().catch(() => ''));
  }
  return { ok: true, messages: chunks.length };
}

let zaloCache = { at: 0, token: null };
async function zaloToken() {
  if (Date.now() - zaloCache.at < 300_000) return zaloCache.token;
  const { data } = await db().from('system_settings').select('value').eq('id', 'notification_settings').limit(1);
  zaloCache = { at: Date.now(), token: data?.[0]?.value?.zalo?.token || null };
  return zaloCache.token;
}

/**
 * Gửi Zalo cho 1 người.
 *  - Mặc định (ZALO_MODE=bot): qua máy chủ bot Zalo đang chạy trên Render (giữ phiên Zalo), target = số điện thoại / id lưu ở profiles.zalo_user_id.
 *  - ZALO_MODE=oa: qua Zalo Official Account (tin tư vấn 1:1, chỉ tới người đã nhắn OA trong khung thời gian Zalo cho phép).
 * Máy chủ bot chỉ còn làm "đường truyền"; mọi logic nằm trong app.
 */
export async function sendZaloText(zaloUserId, text, forceMode) {
  const mode = (forceMode || process.env.ZALO_MODE || 'bot').toLowerCase();
  const body = String(text).slice(0, 2000);
  if (mode === 'bot') {
    const base = (process.env.ZALO_BOT_URL || 'https://zalo-bot-server.onrender.com').replace(/\/$/, '');
    const r = await fetch(`${base}/api/send-message`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.ZALO_BOT_SECRET ? { 'x-bot-secret': process.env.ZALO_BOT_SECRET } : {}) },
      body: JSON.stringify({ phone: zaloUserId, message: body }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.success === false) throw new CoreError(502, 'Bot Zalo không gửi được', j.error || r.status);
    return { ok: true };
  }
  const token = await zaloToken();
  if (!token) throw new CoreError(500, 'Chưa cấu hình token Zalo OA (system_settings.notification_settings.zalo.token)');
  const r = await fetch('https://openapi.zalo.me/v3.0/oa/message/cs', {
    method: 'POST', headers: { 'Content-Type': 'application/json', access_token: token },
    body: JSON.stringify({ recipient: { user_id: zaloUserId }, message: { text: body } }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || (j.error && j.error !== 0)) throw new CoreError(502, 'Zalo từ chối gửi tin', j.message || j.error);
  return { ok: true };
}

/** Nhắn riêng 1 nhân sự: Telegram nếu đã liên kết, không thì Zalo. Không có kênh nào thì bỏ qua, không lỗi. */
export async function notifyPerson(userId, text) {
  if (!userId) return { skipped: true };
  const rows = check(await db().from('profiles').select('telegram_chat_id, zalo_user_id').eq('id', userId).limit(1), 'đọc hồ sơ');
  const p = rows?.[0] || {};
  if (p.telegram_chat_id && process.env.TELEGRAM_BOT_TOKEN) return { ...(await sendTelegramText(p.telegram_chat_id, text)), channel: 'telegram' };
  if (p.zalo_user_id) {
    try { return { ...(await sendZaloText(p.zalo_user_id, text)), channel: 'zalo' }; } catch { return { skipped: true, reason: 'zalo lỗi' }; }
  }
  return { skipped: true };
}

export async function sendTelegram({ userId, message, taskUrl }) {
  if (!userId || !message) throw new CoreError(400, 'Thiếu userId hoặc message');
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new CoreError(500, 'Chưa cấu hình TELEGRAM_BOT_TOKEN');
  const rows = check(await db().from('profiles').select('telegram_chat_id').eq('id', userId).limit(1), 'đọc hồ sơ');
  const chatId = rows?.[0]?.telegram_chat_id;
  if (!chatId) return { skipped: true, message: 'Người nhận chưa cấu hình Telegram' };
  let text = String(message).slice(0, 3500);
  if (taskUrl && /^https?:\/\//.test(taskUrl)) text += `\n\n🔗 [Xem chi tiết công việc](${taskUrl})`;
  const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
  if (!r.ok) throw new CoreError(502, 'Telegram từ chối gửi tin', await r.text().catch(() => ''));
  return { ok: true };
}
