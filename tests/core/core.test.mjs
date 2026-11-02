// Kiểm thử lớp API/MCP cho trợ lý AI (không cần mạng, dùng Supabase giả): node --test tests/core/
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { _setDbForTest } from '../../lib/core/db.js';
import { _resetPeopleCache, matchPeople, resolvePerson } from '../../lib/core/people.js';
import { normStatus, toSourceStatus } from '../../lib/core/status.js';
import { fold, nameQuery, mondayOf, todayVN } from '../../lib/core/text.js';
import { listTasks, planCreateTask, createTask, updateTask } from '../../lib/core/tasks.js';
import { projectStatus } from '../../lib/core/projects.js';
import { addLog, searchLogs } from '../../lib/core/logs.js';
import { reportOverdue, reportDaily } from '../../lib/core/reports.js';
import { handleMcp, TOOLS } from '../../lib/core/mcp.js';
import { hashKey } from '../../lib/core/auth.js';
import handler, { routeOf } from '../../api/v1.js';
import { fakeDb, seed, P, PR } from './fake-db.mjs';

const TODAY = todayVN();
let F;
beforeEach(() => { F = fakeDb(seed(TODAY)); _setDbForTest(F); _resetPeopleCache(); });

const writer = () => ({ key_id: 'k1', name: 'test', scopes: ['read', 'write'], actor: { id: P.quang, full_name: 'Võ Ngọc Quang' } });
const reader = () => ({ key_id: 'k2', name: 'chỉ đọc', scopes: ['read'], actor: null });

test('bỏ dấu và bỏ danh xưng', () => {
  assert.equal(fold('Nguyễn Văn Thắng'), 'nguyen van thang');
  assert.equal(nameQuery('anh Thắng'), 'thang');
  assert.equal(nameQuery('KTS Đức'), 'duc');
  assert.equal(mondayOf('2026-11-08'), '2026-11-02'); // CN -> Thứ Hai cùng tuần
});

test('trạng thái: JS khớp với hàm SQL dqh_norm_status', () => {
  const sql = fs.readFileSync(new URL('../../supabase/migrations/20261102_ai_api_mcp.sql', import.meta.url), 'utf8');
  const fn = sql.slice(sql.indexOf('dqh_norm_status(s text)'), sql.indexOf('$$;', sql.indexOf('dqh_norm_status(s text)')));
  for (const [norm, re] of [['done', /in \(([^)]*)\) then 'done'/], ['cancelled', /in \(([^)]*)\) then 'cancelled'/], ['todo', /in \(([^)]*)\) then 'todo'/]]) {
    const words = re.exec(fn)[1].match(/'([^']+)'/g).map(w => w.slice(1, -1));
    for (const w of words) assert.equal(normStatus(w), norm, w);
  }
  assert.equal(normStatus('Đang thực hiện'), 'doing');
  assert.equal(normStatus('REVIEW'), 'doing');
  assert.equal(toSourceStatus('core', 'done'), 'Hoàn thành');
  assert.equal(toSourceStatus('construction', 'doing'), 'DOING');
  assert.throws(() => toSourceStatus('construction', 'cancelled'));
  assert.throws(() => toSourceStatus('core', 'xong'));
});

test('tìm người: "anh Thắng", không dấu, và báo trùng tên', async () => {
  assert.equal((await resolvePerson('anh Thắng')).id, P.thang);
  assert.equal((await resolvePerson('thang')).id, P.thang);
  await assert.rejects(resolvePerson('Minh'), e => e.status === 409 && e.details.ung_vien.length === 2);
  await assert.rejects(resolvePerson('Hùng'), e => e.status === 404);
  assert.equal(matchPeople((await import('./fake-db.mjs')).seed(TODAY).profiles, 'Trần Minh').length, 1);
});

test('lọc việc theo người gom cả việc thi công (cột tên) lẫn việc có id', async () => {
  const ts = await listTasks({ assignee: 'Thắng' });
  assert.deepEqual(ts.map(t => t.id), ['c1']); // c2 đã xong nên không thuộc "open"
  assert.equal(ts[0].project.name, 'Căn hộ Sunrise Q7');
  assert.equal(ts[0].overdue, true);
  const over = await listTasks({ overdue: true });
  assert.deepEqual(over.map(t => t.id).sort(), ['c1', 't1']);
});

test('giao việc cho dự án thi công -> ghi vào construction_tasks đúng từ vựng UI', async () => {
  const plan = await planCreateTask({ title: 'Kiểm tra điện', project: 'Q7', assignee: 'anh Thắng', due_date: '2026-11-06' }, writer().actor);
  assert.equal(plan.table, 'construction_tasks');
  assert.equal(plan.row.status, 'TODO');
  assert.equal(plan.row.assignee, 'Nguyễn Văn Thắng');
  assert.equal(plan.row.end_date, '2026-11-06');
  assert.equal(F.log.inserts.length, 0, 'xem trước không được ghi');
});

test('giao việc dự án thiết kế -> tasks, có task_code nối tiếp (UI cần task_code)', async () => {
  const r = await createTask({ title: 'Bản vẽ trần', project: 'Thảo Điền', assignee: 'Trần Minh' }, writer().actor);
  const ins = F.log.inserts[0];
  assert.equal(ins.table, 'tasks');
  assert.equal(ins.rows[0].task_code, 'TD01-03');
  assert.equal(ins.rows[0].status, 'Chưa bắt đầu');
  assert.equal(ins.rows[0].assignee_id, P.minh);
  assert.ok(r.id);
});

test('việc cá nhân không có dự án -> personal_tasks của người đứng tên khoá', async () => {
  await createTask({ title: 'Gọi khách' }, writer().actor);
  assert.equal(F.log.inserts[0].table, 'personal_tasks');
  assert.equal(F.log.inserts[0].rows[0].user_id, P.quang);
});

test('cập nhật xong việc thi công -> DONE + 100%', async () => {
  const r = await updateTask('construction', '00000000-0000-4000-8000-0000000000c1'.replace('00000000-0000-4000-8000-0000000000c1', 'c1'), { status: 'done' }).catch(e => e);
  assert.equal(r.status, 400); // id không phải uuid -> từ chối
  F.tables.v_tasks.push({ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', source: 'construction', title: 'Lắp đèn', status: 'doing', due_date: null, progress_pct: 20 });
  F.tables.construction_tasks = [{ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }];
  await updateTask('construction', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', { status: 'done' });
  const u = F.log.updates[0];
  assert.equal(u.table, 'construction_tasks');
  assert.equal(u.set.status, 'DONE');
  assert.equal(u.set.progress, 100);
  assert.equal(u.count, 1);
});

test('nhật ký công trình đi vào daily_logs; ghi chú chung đi vào ai_notes', async () => {
  await addLog({ content: 'Bắn vách bếp', kind: 'nhat_ky', project: 'Sunrise', team: 'A Cường', workers: 3, work_item: 'Vách bếp', progress_pct: 70, issue: 'Thiếu cây U nhôm', issue_type: 'vat_tu', tomorrow_plan: 'Gắn giường master' }, writer().actor);
  const d = F.log.inserts[0];
  assert.equal(d.table, 'daily_logs');
  assert.equal(d.rows[0].engineer_id, P.quang);
  assert.equal(d.rows[0].main_workers, 3);
  assert.equal(d.rows[0].progress, 70);
  assert.equal(d.rows[0].is_issue, true);
  assert.match(d.rows[0].notes, /Vướng mắc \(vat_tu\): Thiếu cây U nhôm/);
  await addLog({ content: 'Họp giao ban: dời lịch nghiệm thu' }, writer().actor);
  assert.equal(F.log.inserts[1].table, 'ai_notes');
});

test('tìm ghi chép không cần dấu', async () => {
  const r = await searchLogs({ q: 'thang may' });
  assert.equal(r.length, 1);
  assert.equal(r[0].project, 'Căn hộ Sunrise Q7');
  assert.equal(r[0].author, 'Nguyễn Văn Thắng');
});

test('tình trạng dự án và báo cáo', async () => {
  const s = await projectStatus('Q7');
  assert.equal(s.counts.total, 2);
  assert.equal(s.counts.overdue, 1);
  assert.equal(s.issues_last_14_days.length, 1);
  const o = await reportOverdue();
  assert.equal(o.total, 2);
  assert.match(o.text, /Nguyễn Văn Thắng \(1\)/);
  const d = await reportDaily({ assignee: 'Trần Minh' });
  assert.equal(d.counts.due_today, 1);
  assert.equal(d.counts.overdue, 1);
  F.tables.v_logs = [];
  const all = await reportDaily();
  assert.deepEqual(all.missing_diary, ['Căn hộ Sunrise Q7']);
  assert.match(all.text, /Chưa nộp nhật ký công trình: Căn hộ Sunrise Q7/);
});

test('MCP: initialize, 10 tool, xem trước rồi mới ghi, khoá chỉ đọc bị chặn ghi', async () => {
  const init = await handleMcp({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } }, writer());
  assert.equal(init.result.protocolVersion, '2025-06-18');
  assert.equal(await handleMcp({ jsonrpc: '2.0', method: 'notifications/initialized' }, writer()), null);
  const list = await handleMcp({ jsonrpc: '2.0', id: 2, method: 'tools/list' }, writer());
  assert.equal(list.result.tools.length, 10);
  assert.equal(TOOLS.length, 10);

  const args = { title: 'Kiểm tra điện', project: 'Q7', assignee: 'Thắng', due_date: '2026-11-06' };
  const pv = await handleMcp({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'create_task', arguments: args } }, writer());
  assert.equal(pv.result.isError, false);
  assert.match(pv.result.content[0].text, /xem_truoc/);
  assert.equal(F.log.inserts.length, 0);

  const ok = await handleMcp({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'create_task', arguments: { ...args, confirm: true } } }, writer());
  assert.equal(ok.result.isError, false);
  assert.deepEqual(F.log.inserts.map(i => i.table), ['construction_tasks', 'ai_audit_log']);

  const denied = await handleMcp({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'create_task', arguments: { ...args, confirm: true } } }, reader());
  assert.equal(denied.result.isError, true);
  assert.match(denied.result.content[0].text, /không có quyền ghi/);

  const amb = await handleMcp({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'list_tasks', arguments: { assignee: 'Minh' } } }, reader());
  assert.equal(amb.result.isError, true);
  assert.match(amb.result.content[0].text, /Lê Văn Minh/);

  const bad = await handleMcp({ jsonrpc: '2.0', id: 7, method: 'nope' }, reader());
  assert.equal(bad.error.code, -32601);
});

test('định tuyến: URL gốc và URL sau rewrite của Vercel', () => {
  assert.deepEqual(routeOf({ url: '/api/v1/tasks?overdue=true' }), { parts: ['tasks'], query: { overdue: 'true' } });
  assert.deepEqual(routeOf({ url: '/api/v1?__path=reports/daily&date=2026-11-02' }), { parts: ['reports', 'daily'], query: { date: '2026-11-02' } });
  assert.deepEqual(routeOf({ url: '/api/mcp' }).parts, ['mcp']);
  assert.deepEqual(routeOf({ url: '/api/send-telegram' }).parts, ['notify', 'telegram']);
});

function call(method, url, { headers = {}, body } = {}) {
  return new Promise(resolve => {
    const res = { statusCode: 0, headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(s) { resolve({ status: this.statusCode, body: s ? JSON.parse(s) : null }); } };
    handler({ method, url, headers, body }, res);
  });
}

test('HTTP: không khoá -> 401; khoá đúng -> đọc được; khoá thu hồi -> 401; telegram cần đăng nhập', async () => {
  assert.equal((await call('GET', '/api/v1/health')).status, 200);
  assert.equal((await call('GET', '/api/v1/tasks')).status, 401);
  const key = 'dqh_testkey123';
  F.tables.ai_api_keys.push({ id: 'k9', name: 'test', key_hash: hashKey(key), scopes: ['read'], revoked_at: null, acts_as_user_id: null });
  const ok = await call('GET', '/api/v1?__path=tasks&overdue=true', { headers: { authorization: 'Bearer ' + key } });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.length, 2);
  const noWrite = await call('POST', '/api/v1/tasks', { headers: { authorization: 'Bearer ' + key }, body: { title: 'x' } });
  assert.equal(noWrite.status, 403);
  const mcp = await call('POST', '/api/mcp', { headers: { authorization: 'Bearer ' + key }, body: { jsonrpc: '2.0', id: 1, method: 'tools/list' } });
  assert.equal(mcp.body.result.tools.length, 10);
  F.tables.ai_api_keys[0].revoked_at = '2026-01-01';
  assert.equal((await call('GET', '/api/v1/tasks', { headers: { authorization: 'Bearer ' + key } })).status, 401);
  assert.equal((await call('POST', '/api/send-telegram', { body: { userId: P.thang, message: 'x' } })).status, 401);
});
