// Báo cáo: dữ liệu có cấu trúc + đoạn văn tiếng Việt để AI đọc lại cho người dùng.
import { db, check, CoreError } from './db.js';
import { todayVN, addDays, mondayOf, isIsoDate, vnDate } from './text.js';
import { normStatus } from './status.js';
import { listPeople, peopleById, resolvePerson, matchPeople } from './people.js';

async function openTasks() {
  return check(await db().from('v_tasks').select('*').in('status', ['todo', 'doing']).limit(5000), 'đọc việc') || [];
}
async function projectNames() {
  const rows = check(await db().from('v_projects').select('id, source, name, status').limit(1000), 'đọc dự án') || [];
  return new Map(rows.map(p => [`${p.source}:${p.id}`, p]));
}
function owners(t, people) {
  const n = (t.assignee_ids || []).map(id => people.get(id)?.full_name).filter(Boolean);
  if (t.assignee_name) {
    const m = matchPeople([...people.values()], t.assignee_name);
    n.push(m.length === 1 ? m[0].full_name : t.assignee_name);
  }
  return n.length ? [...new Set(n)] : ['Chưa giao'];
}
function line(t, projects) {
  const p = t.project_id ? projects.get(`${t.project_source}:${t.project_id}`)?.name : null;
  return `${t.title}${p ? ` [${p}]` : ''} — hạn ${vnDate(t.due_date)}`;
}
function byPerson(tasks, people) {
  const m = new Map();
  for (const t of tasks) for (const o of owners(t, people)) { if (!m.has(o)) m.set(o, []); m.get(o).push(t); }
  return m;
}
function filterAssignee(tasks, person) {
  if (!person) return tasks;
  const given = person.full_name.trim().split(/\s+/).pop().toLowerCase();
  return tasks.filter(t => (t.assignee_ids || []).includes(person.id) || (t.assignee_name || '').toLowerCase().includes(given));
}

export async function reportOverdue({ assignee, date } = {}) {
  const today = date || todayVN();
  if (!isIsoDate(today)) throw new CoreError(400, 'date phải dạng YYYY-MM-DD');
  const people = peopleById(await listPeople());
  const person = assignee ? await resolvePerson(assignee) : null;
  const projects = await projectNames();
  const tasks = filterAssignee(await openTasks(), person).filter(t => t.due_date && t.due_date < today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const groups = byPerson(tasks, people);
  const parts = [`TRỄ HẠN tính đến ${vnDate(today)}: ${tasks.length} việc.`];
  for (const [who, ts] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
    parts.push(`\n${who} (${ts.length}):`);
    for (const t of ts.slice(0, 15)) parts.push(`- ${line(t, projects)}`);
  }
  return {
    date: today, total: tasks.length,
    by_person: Object.fromEntries([...groups].map(([k, v]) => [k, v.length])),
    tasks: tasks.map(t => ({ id: t.id, source: t.source, title: t.title, due_date: t.due_date, assignees: owners(t, people) })),
    text: parts.join('\n'),
  };
}

export async function reportDaily({ date, assignee } = {}) {
  const day = date || todayVN();
  if (!isIsoDate(day)) throw new CoreError(400, 'date phải dạng YYYY-MM-DD');
  const people = peopleById(await listPeople());
  const person = assignee ? await resolvePerson(assignee) : null;
  const projects = await projectNames();
  const open = filterAssignee(await openTasks(), person);
  const dueToday = open.filter(t => t.due_date === day);
  const overdue = open.filter(t => t.due_date && t.due_date < day);
  const doing = open.filter(t => t.status === 'doing' && !(t.due_date && t.due_date <= day));
  const logs = check(await db().from('v_logs').select('*').eq('log_date', day).order('created_at'), 'đọc ghi chép trong ngày') || [];
  const issues = logs.filter(l => l.is_issue);
  const diaryDone = new Set(logs.filter(l => l.kind === 'nhat_ky').map(l => l.project_id));
  const missingDiary = person ? [] : [...projects.values()]
    .filter(p => p.source === 'construction' && !['done', 'cancelled', 'todo'].includes(normStatus(p.status)) && !diaryDone.has(p.id))
    .map(p => p.name);
  const parts = [`BÁO CÁO NGÀY ${vnDate(day)}${person ? ' — ' + person.full_name : ''}`,
    `Đến hạn hôm nay: ${dueToday.length} · Trễ hạn: ${overdue.length} · Đang làm: ${doing.length} · Ghi chép: ${logs.length} · Vấn đề: ${issues.length}`];
  if (missingDiary.length) parts.push(`\n⚠️ Chưa nộp nhật ký công trình: ${missingDiary.join(', ')}`);
  if (dueToday.length) { parts.push('\nĐến hạn hôm nay:'); for (const t of dueToday) parts.push(`- ${line(t, projects)} (${owners(t, people).join(', ')})`); }
  if (overdue.length) { parts.push('\nTrễ hạn:'); for (const t of overdue.slice(0, 20)) parts.push(`- ${line(t, projects)} (${owners(t, people).join(', ')})`); }
  if (issues.length) { parts.push('\nVấn đề ghi nhận hôm nay:'); for (const l of issues) parts.push(`- ${String(l.content).slice(0, 200)}`); }
  return {
    date: day, assignee: person?.full_name || null,
    counts: { due_today: dueToday.length, overdue: overdue.length, doing: doing.length, logs: logs.length, issues: issues.length, missing_diary: missingDiary.length },
    missing_diary: missingDiary,
    due_today: dueToday.map(t => ({ id: t.id, source: t.source, title: t.title, assignees: owners(t, people) })),
    overdue: overdue.map(t => ({ id: t.id, source: t.source, title: t.title, due_date: t.due_date, assignees: owners(t, people) })),
    logs: logs.map(l => ({ kind: l.kind, is_issue: l.is_issue, content: l.content })),
    text: parts.join('\n'),
  };
}

export async function reportWeekly({ week_of } = {}) {
  const ref = week_of || todayVN();
  if (!isIsoDate(ref)) throw new CoreError(400, 'week_of phải dạng YYYY-MM-DD');
  const start = mondayOf(ref), end = addDays(start, 6), nextEnd = addDays(start, 13);
  const people = peopleById(await listPeople());
  const projects = await projectNames();
  const all = check(await db().from('v_tasks').select('*').neq('status', 'cancelled').limit(10000), 'đọc việc') || [];
  const issues = check(await db().from('v_logs').select('project_id, log_date, content').eq('is_issue', true)
    .gte('log_date', start).lte('log_date', end), 'đọc vấn đề trong tuần') || [];
  const perProject = [];
  for (const [key, p] of projects) {
    if (['done', 'cancelled'].includes(normStatus(p.status))) continue;
    const ts = all.filter(t => t.project_id && `${t.project_source}:${t.project_id}` === key);
    if (!ts.length) continue;
    const done = ts.filter(t => t.status === 'done').length;
    const overdue = ts.filter(t => t.status !== 'done' && t.due_date && t.due_date <= end).length;
    const nextWeek = ts.filter(t => t.status !== 'done' && t.due_date > end && t.due_date <= nextEnd).length;
    const iss = issues.filter(i => i.project_id === p.id).length;
    perProject.push({ project: p.name, source: p.source, total: ts.length, done, progress_pct: Math.round(done / ts.length * 100), overdue, due_next_week: nextWeek, issues: iss });
  }
  perProject.sort((a, b) => b.overdue - a.overdue || b.issues - a.issues);
  const openAll = all.filter(t => t.status !== 'done');
  const overdueByPerson = Object.fromEntries([...byPerson(openAll.filter(t => t.due_date && t.due_date <= end), people)].map(([k, v]) => [k, v.length]));
  const parts = [`BÁO CÁO TUẦN ${vnDate(start)} – ${vnDate(end)}`, ''];
  for (const r of perProject) {
    const flag = r.overdue ? '🔴' : r.issues ? '🟡' : '🟢';
    parts.push(`${flag} ${r.project}: ${r.progress_pct}% (${r.done}/${r.total}) · trễ ${r.overdue} · tuần sau ${r.due_next_week} · vấn đề ${r.issues}`);
  }
  if (Object.keys(overdueByPerson).length) {
    parts.push('\nViệc trễ theo người:');
    for (const [k, v] of Object.entries(overdueByPerson).sort((a, b) => b[1] - a[1])) parts.push(`- ${k}: ${v}`);
  }
  return { week_start: start, week_end: end, projects: perProject, overdue_by_person: overdueByPerson, text: parts.join('\n') };
}
