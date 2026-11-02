// Tìm người theo tên tiếng Việt (có/không dấu, có "anh/chị") hoặc theo id.
import { db, check, CoreError } from './db.js';
import { fold, nameQuery } from './text.js';

let cache = { at: 0, rows: [] };
export async function listPeople() {
  if (Date.now() - cache.at < 60_000 && cache.rows.length) return cache.rows;
  const rows = check(await db().from('profiles').select('id, full_name, role, position, email'), 'đọc danh sách nhân sự');
  cache = { at: Date.now(), rows: rows || [] };
  return cache.rows;
}
export function _resetPeopleCache() { cache = { at: 0, rows: [] }; }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Trả về danh sách người khớp, khớp tốt nhất trước. */
export function matchPeople(people, query) {
  const q = nameQuery(query);
  if (!q) return [];
  const scored = [];
  for (const p of people) {
    const full = fold(p.full_name);
    const words = full.split(' ');
    const given = words[words.length - 1];
    let score = 0;
    if (full === q) score = 100;
    else if (given === q) score = 80;                                   // "Thắng" -> "Nguyễn Văn Thắng"
    else if (full.endsWith(' ' + q)) score = 70;                        // "Văn Thắng"
    else if (q.split(' ').every(w => words.includes(w))) score = 50;
    else if (fold(p.email).startsWith(q)) score = 40;
    if (score) scored.push({ p, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0]?.score;
  return scored.filter(s => s.score === top).map(s => s.p);
}

/** Một người duy nhất, hoặc lỗi kèm danh sách gợi ý để AI hỏi lại. */
export async function resolvePerson(ref) {
  if (!ref) return null;
  const people = await listPeople();
  if (UUID.test(String(ref))) {
    const p = people.find(x => x.id === ref);
    if (!p) throw new CoreError(404, `Không có nhân sự id ${ref}`);
    return p;
  }
  const found = matchPeople(people, ref);
  if (found.length === 1) return found[0];
  if (found.length === 0) throw new CoreError(404, `Không tìm thấy nhân sự "${ref}"`, { goi_y: people.map(p => p.full_name) });
  throw new CoreError(409, `Có ${found.length} người khớp "${ref}", cần nói rõ hơn`, { ung_vien: found.map(p => p.full_name) });
}

export function peopleById(people) {
  return new Map(people.map(p => [p.id, p]));
}
