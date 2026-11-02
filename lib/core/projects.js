// Dự án hợp nhất: core (thiết kế) / construction (thi công) / marketing.
import { db, check, CoreError } from './db.js';
import { fold, todayVN, addDays } from './text.js';
import { normStatus } from './status.js';
import { listPeople, peopleById } from './people.js';

const SOURCES = ['core', 'construction', 'marketing'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listProjects({ source, q, include_closed = false } = {}) {
  let query = db().from('v_projects').select('*').order('start_date', { ascending: false, nullsFirst: false }).limit(500);
  if (source) {
    if (!SOURCES.includes(source)) throw new CoreError(400, `source phải là: ${SOURCES.join(', ')}`);
    query = query.eq('source', source);
  }
  let rows = check(await query, 'đọc danh sách dự án') || [];
  if (!include_closed) rows = rows.filter(r => !['done', 'cancelled'].includes(normStatus(r.status)));
  if (q) {
    const f = fold(q);
    rows = rows.filter(r => fold(r.name).includes(f) || fold(r.project_code).includes(f) || fold(r.client_name).includes(f) || fold(r.address).includes(f));
  }
  return rows.map(r => ({
    id: r.id, source: r.source, name: r.name, code: r.project_code, status: r.status,
    start_date: r.start_date, end_date: r.end_date, client: r.client_name, address: r.address,
    progress_pct: r.progress_pct,
  }));
}

/** Tìm 1 dự án theo id hoặc tên/mã ("nhà Thảo Điền", "Q7"). */
export async function resolveProject(ref, source) {
  if (!ref) return null;
  if (typeof ref === 'object' && ref.id && ref.source) return ref;
  if (UUID.test(String(ref))) {
    let qy = db().from('v_projects').select('*').eq('id', ref);
    if (source) qy = qy.eq('source', source);
    const rows = check(await qy, 'tìm dự án') || [];
    if (!rows.length) throw new CoreError(404, `Không có dự án id ${ref}`);
    return { id: rows[0].id, source: rows[0].source, name: rows[0].name, code: rows[0].project_code };
  }
  const all = await listProjects({ source, include_closed: true });
  const f = fold(ref).replace(/^(du an|cong trinh|nha|can ho|ct)\s+/, '');
  const exact = all.filter(p => fold(p.code) === f || fold(p.name) === f);
  const partial = exact.length ? exact : all.filter(p => fold(p.name).includes(f) || fold(p.code).includes(f) || fold(p.address).includes(f));
  const open = partial.filter(p => !['done', 'cancelled'].includes(normStatus(p.status)));
  const pick = open.length ? open : partial;
  if (pick.length === 1) return pick[0];
  if (!pick.length) throw new CoreError(404, `Không tìm thấy dự án "${ref}"`);
  throw new CoreError(409, `Có ${pick.length} dự án khớp "${ref}", cần nói rõ hơn`, { ung_vien: pick.slice(0, 10).map(p => `${p.name} (${p.source}${p.code ? ', ' + p.code : ''})`) });
}

export async function projectStatus(ref, source) {
  const p = await resolveProject(ref, source);
  const today = todayVN();
  const tasks = check(await db().from('v_tasks').select('*').eq('project_id', p.id).eq('project_source', p.source), 'đọc việc của dự án') || [];
  const people = peopleById(await listPeople());
  const who = t => t.assignee_name || (t.assignee_ids || []).map(id => people.get(id)?.full_name).filter(Boolean).join(', ') || 'chưa giao';
  const active = tasks.filter(t => t.status !== 'cancelled');
  const count = s => active.filter(t => t.status === s).length;
  const overdue = active.filter(t => t.status !== 'done' && t.due_date && t.due_date < today);
  const soon = active.filter(t => t.status !== 'done' && t.due_date && t.due_date >= today && t.due_date <= addDays(today, 7));
  const withPct = active.filter(t => typeof t.progress_pct === 'number');
  const progress = active.length
    ? Math.round(withPct.length === active.length
        ? withPct.reduce((s, t) => s + (t.status === 'done' ? 100 : t.progress_pct), 0) / active.length
        : (count('done') / active.length) * 100)
    : null;
  const issues = check(await db().from('v_logs').select('log_date, content, kind').eq('project_id', p.id).eq('is_issue', true)
    .gte('log_date', addDays(today, -14)).order('log_date', { ascending: false }).limit(10), 'đọc vấn đề của dự án') || [];
  const brief = t => ({ id: t.id, source: t.source, title: t.title, assignee: who(t), due_date: t.due_date, status: t.status, progress_pct: t.progress_pct });
  return {
    project: p,
    progress_pct: progress,
    counts: { total: active.length, todo: count('todo'), doing: count('doing'), done: count('done'), overdue: overdue.length },
    overdue: overdue.sort((a, b) => a.due_date.localeCompare(b.due_date)).map(brief),
    due_next_7_days: soon.sort((a, b) => a.due_date.localeCompare(b.due_date)).map(brief),
    issues_last_14_days: issues,
  };
}
