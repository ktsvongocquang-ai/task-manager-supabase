// Ghi chép: nhật ký công trình -> daily_logs; ghi chú marketing -> marketing_daily_logs; còn lại -> ai_notes.
import { db, check, CoreError } from './db.js';
import { todayVN, isIsoDate, fold } from './text.js';
import { resolveProject } from './projects.js';
import { listPeople, peopleById } from './people.js';

export const LOG_KINDS = ['nhat_ky', 'bien_ban', 'ghi_chu', 'van_de'];

export async function planAddLog(input, actor) {
  const { project, content, title } = input || {};
  const kind = input?.kind || 'ghi_chu';
  if (!content || !String(content).trim()) throw new CoreError(400, 'Thiếu nội dung (content)');
  if (!LOG_KINDS.includes(kind)) throw new CoreError(400, `kind phải là: ${LOG_KINDS.join(', ')}`);
  const log_date = input?.log_date || todayVN();
  if (!isIsoDate(log_date)) throw new CoreError(400, 'log_date phải dạng YYYY-MM-DD');
  const is_issue = kind === 'van_de' || !!input?.is_issue;
  const proj = project ? await resolveProject(project, input.project_source) : null;
  const text = String(content).trim();

  let table, row;
  if (proj?.source === 'construction' && (kind === 'nhat_ky' || kind === 'van_de')) {
    // Các trường có cấu trúc giống phiếu nhật ký ngày (khu vực, đội, số công, hạng mục, %, vướng mắc, mai làm gì).
    const d = input;
    const extra = [
      d.area && `Khu vực: ${d.area}`,
      d.issue && `Vướng mắc${d.issue_type ? ' (' + d.issue_type + ')' : ''}: ${d.issue}`,
      d.need_support && `Cần hỗ trợ từ: ${d.need_support}`,
    ].filter(Boolean).join('\n');
    table = 'daily_logs';
    const notes = [title, text, extra, d.tomorrow_plan && `Kế hoạch mai: ${d.tomorrow_plan}`].filter(Boolean).join('\n');
    row = { project_id: proj.id, date: log_date, engineer_id: actor?.id || null, is_issue: is_issue || !!d.issue,
      notes, content: notes, today_summary: text,
      status: 'pending', created_by: 'ENGINEER', editable: true, weather: 'sunny/sunny',
      reporter_name: actor?.full_name || 'Trợ lý AI' };
    if (d.work_item) row.task_category = String(d.work_item);
    if (d.progress_pct != null && Number.isFinite(Number(d.progress_pct))) row.task_progress = Math.max(0, Math.min(100, Math.round(Number(d.progress_pct))));
    if (d.team) row.team_name = String(d.team);
    if (d.workers != null && Number.isFinite(Number(d.workers))) row.main_workers = Math.round(Number(d.workers));
    if (d.work_item) row.work_item = String(d.work_item);
    if (d.progress_pct != null && Number.isFinite(Number(d.progress_pct))) row.progress = Math.max(0, Math.min(100, Math.round(Number(d.progress_pct))));
    if (d.tomorrow_plan) row.tomorrow_plan = String(d.tomorrow_plan);
  } else if (proj?.source === 'marketing' && kind === 'ghi_chu') {
    table = 'marketing_daily_logs';
    row = { project_id: proj.id, log_date, content: title ? `${title}\n${text}` : text, user_id: actor?.id || null };
  } else {
    table = 'ai_notes';
    row = { project_id: proj?.id || null, project_source: proj?.source || null, author_id: actor?.id || null,
      kind, title: title || null, content: text, log_date, is_issue };
  }
  return {
    table, row,
    summary: { loai: kind, du_an: proj ? `${proj.name} (${proj.source})` : 'chung', ngay: log_date, van_de: is_issue, noi_dung: text.slice(0, 200) },
  };
}

export async function addLog(input, actor) {
  const plan = await planAddLog(input, actor);
  const rows = check(await db().from(plan.table).insert(plan.row).select('id'), 'ghi chép');
  return { id: rows?.[0]?.id, luu_vao: plan.table, ...plan.summary };
}

export async function searchLogs({ q, project, from, to, issues_only, kind, limit = 30 } = {}) {
  let qy = db().from('v_logs').select('*');
  if (project) {
    const p = await resolveProject(project);
    qy = qy.eq('project_id', p.id);
  }
  if (from) { if (!isIsoDate(from)) throw new CoreError(400, 'from phải dạng YYYY-MM-DD'); qy = qy.gte('log_date', from); }
  if (to) { if (!isIsoDate(to)) throw new CoreError(400, 'to phải dạng YYYY-MM-DD'); qy = qy.lte('log_date', to); }
  if (issues_only) qy = qy.eq('is_issue', true);
  if (kind) qy = qy.eq('kind', kind);
  const lim = Math.min(Math.max(Number(limit) || 30, 1), 100);
  // Tìm chữ: lấy rộng rồi lọc không dấu trong JS (để "thang may" vẫn khớp "thang máy").
  qy = qy.order('log_date', { ascending: false }).limit(q ? 500 : lim);
  let rows = check(await qy, 'tìm ghi chép') || [];
  if (q) {
    const f = fold(q);
    rows = rows.filter(r => fold(r.content).includes(f)).slice(0, lim);
  }
  const people = peopleById(await listPeople());
  const projIds = [...new Set(rows.filter(r => r.project_id).map(r => r.project_id))];
  const projs = projIds.length ? (check(await db().from('v_projects').select('id, name').in('id', projIds), 'đọc dự án') || []) : [];
  const pmap = new Map(projs.map(p => [p.id, p.name]));
  return rows.map(r => ({
    id: r.id, source: r.source, kind: r.kind, log_date: r.log_date, is_issue: r.is_issue,
    project: r.project_id ? pmap.get(r.project_id) || null : null,
    author: r.author_id ? people.get(r.author_id)?.full_name || null : null,
    content: r.content,
  }));
}
