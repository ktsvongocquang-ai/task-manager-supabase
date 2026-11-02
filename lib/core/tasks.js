// Việc hợp nhất: đọc qua view v_tasks, ghi vào ĐÚNG bảng gốc để UI cũ vẫn thấy.
import { db, check, CoreError } from './db.js';
import { todayVN, isIsoDate } from './text.js';
import { STATUSES, SOURCE_TABLE, toSourceStatus, toSourcePriority } from './status.js';
import { listPeople, peopleById, resolvePerson } from './people.js';
import { resolveProject } from './projects.js';
import { notifyPerson } from './notify.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function shape(t, people, projects) {
  const names = (t.assignee_ids || []).map(id => people.get(id)?.full_name).filter(Boolean);
  if (t.assignee_name) names.push(t.assignee_name);
  const proj = t.project_id ? projects.get(`${t.project_source}:${t.project_id}`) : null;
  return {
    id: t.id, source: t.source, title: t.title, status: t.status, status_raw: t.status_raw,
    assignees: names, project: proj ? { id: proj.id, source: proj.source, name: proj.name } : null,
    start_date: t.start_date, due_date: t.due_date, progress_pct: t.progress_pct, priority: t.priority,
    overdue: !!(t.due_date && t.due_date < todayVN() && !['done', 'cancelled'].includes(t.status)),
  };
}

async function projectMap(rows) {
  const ids = [...new Set(rows.filter(r => r.project_id).map(r => r.project_id))];
  if (!ids.length) return new Map();
  const ps = check(await db().from('v_projects').select('id, source, name').in('id', ids), 'đọc tên dự án') || [];
  return new Map(ps.map(p => [`${p.source}:${p.id}`, p]));
}

/**
 * Lọc việc.
 * status: todo|doing|done|cancelled|open (open = todo+doing, mặc định)
 */
export async function listTasks({ assignee, project, source, status = 'open', overdue, due_before, due_after, limit = 50 } = {}) {
  const today = todayVN();
  let q = db().from('v_tasks').select('*');
  if (source) {
    if (!SOURCE_TABLE[source]) throw new CoreError(400, `source phải là: ${Object.keys(SOURCE_TABLE).join(', ')}`);
    q = q.eq('source', source);
  }
  if (status === 'open') q = q.in('status', ['todo', 'doing']);
  else if (status && status !== 'all') {
    if (!STATUSES.includes(status)) throw new CoreError(400, `status phải là: open, all, ${STATUSES.join(', ')}`);
    q = q.eq('status', status);
  }
  if (overdue) q = q.lt('due_date', today).in('status', ['todo', 'doing']);
  if (due_before) { if (!isIsoDate(due_before)) throw new CoreError(400, 'due_before phải dạng YYYY-MM-DD'); q = q.lte('due_date', due_before); }
  if (due_after) { if (!isIsoDate(due_after)) throw new CoreError(400, 'due_after phải dạng YYYY-MM-DD'); q = q.gte('due_date', due_after); }
  if (project) {
    const p = await resolveProject(project);
    q = q.eq('project_id', p.id).eq('project_source', p.source);
  }
  if (assignee) {
    const person = await resolvePerson(assignee);
    const given = person.full_name.trim().split(/\s+/).pop().replace(/[,()"*]/g, '');
    q = q.or(`assignee_ids.cs.{${person.id}},assignee_name.ilike.*${given}*`);
  }
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
  q = q.order('due_date', { ascending: true, nullsFirst: false }).limit(lim);
  const rows = check(await q, 'đọc danh sách việc') || [];
  const people = peopleById(await listPeople());
  const projects = await projectMap(rows);
  return rows.map(r => shape(r, people, projects));
}

async function nextCoreTaskCode(projectId, projectCode) {
  if (!projectCode) return '';
  const rows = check(await db().from('tasks').select('task_code').eq('project_id', projectId), 'đọc mã việc') || [];
  let max = 0;
  for (const r of rows) {
    const m = String(r.task_code || '').match(/-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${projectCode}-${String(max + 1).padStart(2, '0')}`;
}

/**
 * Chuẩn bị (chưa ghi) một việc mới: tra người, dự án, bảng đích. Dùng cho bản xem trước.
 * actor: profile người đứng tên khoá API (dùng khi không nêu người nhận ở việc cá nhân).
 */
export async function planCreateTask(input, actor) {
  const { title, project, assignee, due_date, start_date, priority, description } = input || {};
  if (!title || !String(title).trim()) throw new CoreError(400, 'Thiếu tên việc (title)');
  for (const [k, v] of Object.entries({ due_date, start_date })) if (v && !isIsoDate(v)) throw new CoreError(400, `${k} phải dạng YYYY-MM-DD`);
  const proj = project ? await resolveProject(project, input.project_source) : null;
  const source = proj ? proj.source : 'personal';
  const person = assignee ? await resolvePerson(assignee) : (source === 'personal' ? actor : null);
  if (source === 'personal' && !person) throw new CoreError(400, 'Việc không thuộc dự án nào thì phải có người nhận (assignee)');
  const pr = toSourcePriority(source, priority);
  let row;
  if (source === 'core') {
    row = { name: title.trim(), description: description || null, project_id: proj.id, assignee_id: person?.id || null,
      status: toSourceStatus('core', 'todo'), priority: pr, start_date: start_date || todayVN(), due_date: due_date || null,
      completion_pct: 0, task_code: await nextCoreTaskCode(proj.id, proj.code) };
  } else if (source === 'construction') {
    row = { project_id: proj.id, name: title.trim(), category: 'Giao qua trợ lý AI', status: toSourceStatus('construction', 'todo'),
      start_date: start_date || todayVN(), end_date: due_date || null, days: 1, progress: 0, note: description || '',
      assignee: person?.full_name || '', priority: pr, budget: 0, spent: 0, checklist: [], issues: [], tags: [],
      dependencies: [], approved: false, subcontractor: '' };
  } else if (source === 'marketing') {
    row = { name: title.trim(), project_id: proj.id, status: toSourceStatus('marketing', 'todo'),
      assignee_id: person ? [person.id] : null, due_date: due_date || null, start_date: start_date || todayVN(),
      priority: pr, description: description || null, completion_pct: 0 };
  } else {
    row = { user_id: person.id, title: title.trim(), status: toSourceStatus('personal', 'todo'), due_date: due_date || null,
      priority: pr, description: description || null };
  }
  return {
    table: SOURCE_TABLE[source], source, row, assignee_id: person?.id || null,
    summary: {
      viec: title.trim(),
      du_an: proj ? `${proj.name} (${source})` : 'việc cá nhân',
      nguoi_nhan: person?.full_name || 'chưa giao',
      han: due_date || 'chưa có',
      uu_tien: pr,
    },
  };
}

export async function createTask(input, actor) {
  const plan = await planCreateTask(input, actor);
  const rows = check(await db().from(plan.table).insert(plan.row).select('id'), 'tạo việc');
  let thong_bao = 'không gửi';
  if (plan.assignee_id && plan.assignee_id !== actor?.id) {
    const s = plan.summary;
    const msg = `📌 Việc mới từ ${actor?.full_name || 'quản lý'}:\n${s.viec}\nDự án: ${s.du_an}\nHạn: ${s.han}`;
    try { const r = await notifyPerson(plan.assignee_id, msg); thong_bao = r.skipped ? 'người nhận chưa liên kết Telegram' : 'đã nhắn Telegram'; }
    catch { thong_bao = 'gửi Telegram lỗi'; }
  }
  return { id: rows?.[0]?.id, source: plan.source, ...plan.summary, thong_bao };
}

/** Chuẩn bị cập nhật: đọc việc hiện tại + tính các cột sẽ đổi. */
export async function planUpdateTask(source, id, changes = {}) {
  const table = SOURCE_TABLE[source];
  if (!table) throw new CoreError(400, `source phải là: ${Object.keys(SOURCE_TABLE).join(', ')}`);
  if (!UUID.test(String(id))) throw new CoreError(400, 'id việc không hợp lệ');
  const cur = check(await db().from('v_tasks').select('*').eq('source', source).eq('id', id), 'đọc việc') || [];
  if (!cur.length) throw new CoreError(404, 'Không tìm thấy việc');
  const { status, progress_pct, assignee, due_date, title, note } = changes;
  const set = {};
  const diff = {};
  if (status !== undefined) { set.status = toSourceStatus(source, status); diff.trang_thai = `${cur[0].status} → ${status}`; }
  if (progress_pct !== undefined) {
    const n = Number(progress_pct);
    if (!Number.isFinite(n) || n < 0 || n > 100) throw new CoreError(400, 'progress_pct phải từ 0 đến 100');
    if (source === 'personal') throw new CoreError(400, 'Việc cá nhân không có % tiến độ');
    set[source === 'construction' ? 'progress' : 'completion_pct'] = Math.round(n);
    diff.tien_do = `${cur[0].progress_pct ?? 0}% → ${Math.round(n)}%`;
  }
  if (status === 'done' && progress_pct === undefined && source !== 'personal') {
    set[source === 'construction' ? 'progress' : 'completion_pct'] = 100;
  }
  if (status === 'done' && source === 'core') set.completion_date = todayVN();
  if (assignee !== undefined) {
    const p = await resolvePerson(assignee);
    if (source === 'core') set.assignee_id = p.id;
    else if (source === 'construction') set.assignee = p.full_name;
    else if (source === 'marketing') set.assignee_id = [p.id];
    else set.user_id = p.id;
    diff.nguoi_nhan = p.full_name;
  }
  if (due_date !== undefined) {
    if (due_date !== null && !isIsoDate(due_date)) throw new CoreError(400, 'due_date phải dạng YYYY-MM-DD');
    set[source === 'construction' ? 'end_date' : 'due_date'] = due_date;
    diff.han = `${cur[0].due_date ?? 'chưa có'} → ${due_date ?? 'bỏ hạn'}`;
  }
  if (title !== undefined) { set[source === 'personal' ? 'title' : 'name'] = String(title).trim(); diff.ten = title; }
  if (note !== undefined) {
    const col = source === 'construction' ? 'note' : source === 'personal' ? 'description' : 'notes';
    set[col] = note;
    diff.ghi_chu = note;
  }
  if (!Object.keys(set).length) throw new CoreError(400, 'Không có gì để cập nhật');
  if (source === 'construction' || source === 'marketing') set.updated_at = new Date().toISOString();
  return { table, source, id, set, current: cur[0], summary: { viec: cur[0].title, thay_doi: diff } };
}

export async function updateTask(source, id, changes) {
  const plan = await planUpdateTask(source, id, changes);
  check(await db().from(plan.table).update(plan.set).eq('id', id), 'cập nhật việc');
  return { id, source, ...plan.summary };
}
