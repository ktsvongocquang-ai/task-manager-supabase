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

/** Nhắn riêng 1 nhân sự (theo profiles.telegram_chat_id). Không có chat id thì bỏ qua, không lỗi. */
export async function notifyPerson(userId, text) {
  if (!userId || !process.env.TELEGRAM_BOT_TOKEN) return { skipped: true };
  const rows = check(await db().from('profiles').select('telegram_chat_id').eq('id', userId).limit(1), 'đọc hồ sơ');
  const chatId = rows?.[0]?.telegram_chat_id;
  if (!chatId) return { skipped: true };
  return sendTelegramText(chatId, text);
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
