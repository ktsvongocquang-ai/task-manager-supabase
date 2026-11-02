// Xác thực: khoá API cho trợ lý AI (bảng ai_api_keys), JWT cho người dùng app.
import crypto from 'node:crypto';
import { db, check, CoreError } from './db.js';

export function hashKey(key) {
  return crypto.createHash('sha256').update(String(key)).digest('hex');
}

export function newApiKey() {
  return 'dqh_' + crypto.randomBytes(24).toString('base64url');
}

function bearer(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(String(h));
  return m ? m[1].trim() : (req.headers?.['x-api-key'] ? String(req.headers['x-api-key']).trim() : null);
}

/** Trả về ngữ cảnh { key_id, name, scopes, actor } hoặc ném lỗi 401. */
export async function authenticateApiKey(req) {
  const key = bearer(req);
  if (!key || !key.startsWith('dqh_')) throw new CoreError(401, 'Thiếu hoặc sai khoá API (Authorization: Bearer dqh_...)');
  const rows = check(await db().from('ai_api_keys')
    .select('id, name, scopes, revoked_at, acts_as_user_id').eq('key_hash', hashKey(key)).limit(1), 'kiểm tra khoá');
  const k = rows?.[0];
  if (!k || k.revoked_at) throw new CoreError(401, 'Khoá API không hợp lệ hoặc đã bị thu hồi');
  let actor = null;
  if (k.acts_as_user_id) {
    const p = check(await db().from('profiles').select('id, full_name, role').eq('id', k.acts_as_user_id).limit(1), 'đọc người đứng tên khoá');
    actor = p?.[0] || null;
  }
  db().from('ai_api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', k.id).then(() => {}, () => {});
  return { key_id: k.id, name: k.name, scopes: k.scopes || [], actor };
}

export function requireScope(ctx, scope) {
  if (!ctx?.scopes?.includes(scope)) throw new CoreError(403, `Khoá "${ctx?.name}" không có quyền ${scope === 'write' ? 'ghi' : 'đọc'}`);
}

/** Người dùng app đang đăng nhập (JWT Supabase). */
export async function authenticateUser(req) {
  const token = bearer(req);
  if (!token) throw new CoreError(401, 'Chưa đăng nhập');
  const { data, error } = await db().auth.getUser(token);
  if (error || !data?.user) throw new CoreError(401, 'Phiên đăng nhập không hợp lệ');
  return data.user;
}

/** Ghi nhật ký thao tác của AI. Không bao giờ làm hỏng yêu cầu chính. */
export async function audit(ctx, tool, input, ok, summary) {
  try {
    await db().from('ai_audit_log').insert({
      key_id: ctx?.key_id || null, tool, input: input ?? null, ok,
      result_summary: summary ? String(summary).slice(0, 500) : null,
    });
  } catch { /* bỏ qua */ }
}
