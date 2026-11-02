// Việc chạy theo lịch (Vercel Cron): nhắc nhật ký, đẩy báo cáo ngày/tuần vào nhóm Telegram.
// Giờ trong vercel.json là UTC (giờ VN = UTC+7).
import { db, check } from './db.js';
import { todayVN, isIsoDate } from './text.js';
import { normStatus } from './status.js';
import { reportDaily, reportWeekly } from './reports.js';
import { listTasks } from './tasks.js';
import { sendTelegramText, notifyPerson } from './notify.js';
import { listPeople, peopleById, matchPeople } from './people.js';

/** Công trình thi công đang chạy nhưng chưa có nhật ký trong ngày. */
export async function missingDiaries(day = todayVN()) {
  const projects = check(await db().from('v_projects').select('id, source, name, status, owner_id, owner_name').eq('source', 'construction'), 'đọc công trình') || [];
  const active = projects.filter(p => !['done', 'cancelled', 'todo'].includes(normStatus(p.status)));
  if (!active.length) return [];
  const logs = check(await db().from('v_logs').select('project_id, kind').eq('log_date', day).eq('kind', 'nhat_ky'), 'đọc nhật ký') || [];
  const done = new Set(logs.map(l => l.project_id));
  return active.filter(p => !done.has(p.id));
}

const group = () => process.env.TELEGRAM_GROUP_CHAT_ID;

/** Giữ chỗ (job, ngày). Trả false nếu hôm nay job này đã chạy rồi. */
export async function claimRun(job, day, force) {
  if (force) return true;
  const { error } = await db().from('ai_cron_runs').insert({ job, run_date: day });
  if (!error) return true;
  if (error.code === '23505') return false; // đã có
  throw new Error('ai_cron_runs: ' + error.message);
}

export async function runDiaryReminder({ date, force } = {}) {
  const day = isIsoDate(date) ? date : todayVN();
  if (!(await claimRun('diary-reminder', day, force))) return { date: day, skipped: 'đã chạy hôm nay' };
  const all = await listPeople();
  const people = peopleById(all);
  const missing = (await missingDiaries(day)).map(p => {
    if (p.owner_id || !p.owner_name) return p;
    const m = matchPeople(all, p.owner_name);
    return m.length === 1 ? { ...p, owner_id: m[0].id } : p;
  });
  const sent = [];
  for (const p of missing) {
    if (!p.owner_id) continue;
    try {
      const r = await notifyPerson(p.owner_id, `⏰ Nhắc nộp nhật ký hôm nay: ${p.name}.\nChỉ cần nhắn trợ lý 1 câu: khu vực, đội/số công, hạng mục, % xong, vướng mắc, mai làm gì.`);
      if (!r.skipped) sent.push(people.get(p.owner_id)?.full_name || p.owner_id);
    } catch { /* bỏ qua từng người */ }
  }
  let groupSent = false;
  if (missing.length && group()) {
    const lines = missing.map(p => `- ${p.name}${p.owner_id && people.get(p.owner_id) ? ' (' + people.get(p.owner_id).full_name + ')' : ''}`);
    await sendTelegramText(group(), `⏰ ${missing.length} công trình chưa nộp nhật ký hôm nay:\n${lines.join('\n')}`);
    groupSent = true;
  }
  return { date: day, missing: missing.map(p => p.name), reminded: sent, group_sent: groupSent };
}

export async function runDailyReport({ date, force } = {}) {
  if (!(await claimRun('daily-report', isIsoDate(date) ? date : todayVN(), force))) return { skipped: 'đã chạy hôm nay' };
  const r = await reportDaily({ date: isIsoDate(date) ? date : undefined });
  if (group()) await sendTelegramText(group(), r.text);
  return { date: r.date, counts: r.counts, group_sent: !!group() };
}

export async function runWeeklyReport({ week_of, force } = {}) {
  if (!(await claimRun('weekly-report', isIsoDate(week_of) ? week_of : todayVN(), force))) return { skipped: 'đã chạy hôm nay' };
  const r = await reportWeekly({ week_of: isIsoDate(week_of) ? week_of : undefined });
  if (group()) await sendTelegramText(group(), r.text);
  return { week_start: r.week_start, projects: r.projects.length, group_sent: !!group() };
}

/** 07:00: nhắn riêng từng người việc đến hạn hôm nay + việc trễ (Telegram, không có thì Zalo). */
export async function runMorningBrief({ date, force } = {}) {
  const day = isIsoDate(date) ? date : todayVN();
  if (!(await claimRun('morning-brief', day, force))) return { skipped: 'đã chạy hôm nay' };
  const people = await listPeople();
  const sent = [];
  for (const p of people) {
    let tasks;
    try { tasks = await listTasks({ assignee: p.id, status: 'open', due_before: day, limit: 30 }); } catch { continue; }
    if (!tasks.length) continue;
    const overdue = tasks.filter(t => t.overdue), today = tasks.filter(t => !t.overdue);
    const line = t => `- ${t.title}${t.project ? ' [' + t.project.name + ']' : ''}${t.overdue ? ' (trễ từ ' + t.due_date.slice(8, 10) + '/' + t.due_date.slice(5, 7) + ')' : ''}`;
    const msg = [`☀️ Chào ${p.full_name.split(' ').pop()}, việc hôm nay:`, ...today.map(line), ...(overdue.length ? ['', `Trễ hạn (${overdue.length}):`, ...overdue.slice(0, 10).map(line)] : []),
      '', 'Xong việc nào thì nhắn: "xong <tên việc>".'].join('\n');
    try { const r = await notifyPerson(p.id, msg); if (!r.skipped) sent.push(p.full_name); } catch { /* từng người */ }
  }
  return { date: day, sent };
}
