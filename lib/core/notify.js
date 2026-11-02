// Gửi Telegram cho một nhân sự (chuyển từ api/send-telegram.js cũ).
import { db, check, CoreError } from './db.js';

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
