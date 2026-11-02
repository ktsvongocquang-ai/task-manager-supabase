// Tạo khoá API cho trợ lý AI. Khoá chỉ hiện MỘT lần — lưu ngay vào nơi an toàn.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/create-ai-key.mjs \
//     --name "Claude của Quang" --scopes read,write --as "Võ Ngọc Quang"
//
//   --as   : tên hoặc email nhân sự đứng tên các thao tác (người tạo việc / tác giả ghi chép)
//   delegate: cho bot dùng chung (Javis/Telegram/Zalo) đứng tên người đang nhắn qua tham số sender
//   --revoke <key_prefix> : thu hồi khoá
import { db } from '../lib/core/db.js';
import { newApiKey, hashKey } from '../lib/core/auth.js';
import { resolvePerson } from '../lib/core/people.js';

const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : undefined; };

if (opt('revoke')) {
  const { data, error } = await db().from('ai_api_keys').update({ revoked_at: new Date().toISOString() })
    .eq('key_prefix', opt('revoke')).is('revoked_at', null).select('name');
  if (error) throw error;
  console.log(data?.length ? `Đã thu hồi: ${data.map(d => d.name).join(', ')}` : 'Không tìm thấy khoá đang hoạt động với prefix đó');
  process.exit(0);
}

const name = opt('name');
if (!name) { console.error('Thiếu --name'); process.exit(1); }
const scopes = (opt('scopes') || 'read').split(',').map(s => s.trim()).filter(s => ['read', 'write', 'delegate'].includes(s));
const person = opt('as') ? await resolvePerson(opt('as')) : null;
const key = newApiKey();
const { error } = await db().from('ai_api_keys').insert({
  name, key_prefix: key.slice(0, 12), key_hash: hashKey(key), scopes, acts_as_user_id: person?.id || null,
});
if (error) throw error;
console.log('\nKhoá API (chỉ hiện 1 lần):\n\n  ' + key + '\n');
console.log(`Tên: ${name} · Quyền: ${scopes.join(', ')} · Đứng tên: ${person?.full_name || '(không)'}`);
console.log(`Thu hồi: node scripts/create-ai-key.mjs --revoke ${key.slice(0, 12)}\n`);
