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
import { handleChatMessage, toolDeclarations } from '../../lib/core/chat.js';
import { fakeDb, seed, P, PR } from './fake-db.mjs';

const TODAY = todayVN();
let F;
beforeEach(() => { F = fakeDb(seed(TODAY)); _setDbForTest(F); _resetPeopleCache(); });

const bot = () => ({ key_id: 'kb', name: 'bot Javis', scopes: ['read', 'write', 'delegate'], actor: null });
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

  const args2 = { content: 'Họp giao ban', request_id: 'r-1' };
  await handleMcp({ jsonrpc: '2.0', id: 41, method: 'tools/call', params: { name: 'add_log', arguments: args2 } }, writer());
  const dup = await handleMcp({ jsonrpc: '2.0', id: 42, method: 'tools/call', params: { name: 'add_log', arguments: args2 } }, writer());
  assert.match(dup.result.content[0].text, /da_ghi_truoc_do/);
  assert.equal(F.log.inserts.filter(i => i.table === 'ai_notes').length, 1, 'gọi lại cùng request_id không ghi trùng');
  assert.ok(ok.result.structuredContent);

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

test('cron: nhắc công trình chưa nộp nhật ký, cần CRON_SECRET', async () => {
  F.tables.v_logs = [];
  F.tables.v_projects[1].owner_id = P.thang;
  assert.equal((await call('GET', '/api/v1?__path=cron/diary-reminder')).status, 401);
  process.env.CRON_SECRET = 's3cret';
  const r = await call('GET', '/api/v1?__path=cron/diary-reminder', { headers: { authorization: 'Bearer s3cret' } });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.missing, ['Căn hộ Sunrise Q7']);
  const again = await call('GET', '/api/v1?__path=cron/diary-reminder', { headers: { authorization: 'Bearer s3cret' } });
  assert.equal(again.body.skipped, 'đã chạy hôm nay', 'cron chạy trùng không gửi lần 2');
  assert.equal((await call('GET', '/api/v1?__path=cron/diary-reminder', { headers: { authorization: 'Bearer sai' } })).status, 401);
  delete process.env.CRON_SECRET;
});

test('giao việc qua AI trả về trạng thái thông báo cho người nhận', async () => {
  const r = await createTask({ title: 'Đo hiện trạng', project: 'Q7', assignee: 'Thắng' }, writer().actor);
  assert.ok(['không gửi', 'người nhận chưa liên kết Telegram/Zalo'].includes(r.thong_bao));
});

test('bot chung: nhận diện người nhắn qua Telegram/Zalo id, "việc của tôi", đứng tên đúng người', async () => {
  F.tables.profiles.find(p => p.id === P.thang).telegram_chat_id = '777';
  F.tables.profiles.find(p => p.id === P.minh).zalo_user_id = 'z-minh';
  const mine = await handleMcp({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'list_tasks', arguments: { sender: 'zalo:z-minh', mine: true } } }, bot());
  assert.equal(mine.result.isError, false);
  assert.deepEqual(mine.result.structuredContent.data.map(t => t.id).sort(), ['t1', 't2']);
  await handleMcp({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'add_log', arguments: { sender: 'telegram:777', content: 'Bắn vách bếp 70%', kind: 'nhat_ky', project: 'Q7' } } }, bot());
  assert.equal(F.log.inserts.at(-2).table, 'daily_logs');
  assert.equal(F.log.inserts.at(-2).rows[0].engineer_id, P.thang, 'nhật ký đứng tên người nhắn');
  const unknown = await handleMcp({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'list_tasks', arguments: { sender: 'telegram:999' } } }, bot());
  assert.equal(unknown.result.isError, true);
  assert.match(unknown.result.content[0].text, /chưa liên kết/);
  const noDelegate = await handleMcp({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'list_tasks', arguments: { sender: 'telegram:777' } } }, writer());
  assert.equal(noDelegate.result.isError, true, 'khoá không có delegate không được đứng tên người khác');
  const list = await handleMcp({ jsonrpc: '2.0', id: 5, method: 'tools/list' }, bot());
  assert.ok(list.result.tools.every(t => t.inputSchema.properties.sender));
});

test('kênh chat Zalo/Telegram: liên kết bằng email, hỏi việc, giao việc phải trả lời OK mới ghi', async () => {
  // LLM giả: lần lượt trả các lời gọi tool đã định sẵn
  const script = (steps) => { let i = 0; return async () => steps[i++] || { text: 'xong', calls: [] }; };
  const r0 = await handleChatMessage({ channel: 'zalo', senderId: '0901', text: 'xin chao', llm: script([]) });
  assert.match(r0, /chưa liên kết/);
  const r1 = await handleChatMessage({ channel: 'zalo', senderId: '0901', text: 'thang@dqh.vn', llm: script([]) });
  assert.match(r1, /Đã liên kết Zalo với tài khoản Nguyễn Văn Thắng/);
  _resetPeopleCache();

  const r2 = await handleChatMessage({ channel: 'zalo', senderId: '0901', text: 'việc của tôi?', llm: script([
    { text: '', calls: [{ name: 'list_tasks', args: { mine: true } }] },
    { text: 'Anh có 1 việc: Đi ống điện tầng 2.', calls: [] },
  ]) });
  assert.equal(r2, 'Anh có 1 việc: Đi ống điện tầng 2.');

  const before = F.log.inserts.length;
  const r3 = await handleChatMessage({ channel: 'zalo', senderId: '0901', text: 'giao Trần Minh đo hiện trạng Q7 trước 2026-11-06', llm: script([
    { text: '', calls: [{ name: 'create_task', args: { title: 'Đo hiện trạng', project: 'Q7', assignee: 'Trần Minh', due_date: '2026-11-06', confirm: true } }] },
  ]) });
  assert.match(r3, /Trả lời OK để ghi/);
  assert.equal(F.log.inserts.filter((x, i) => i >= before && x.table === 'construction_tasks').length, 0, 'AI tự đặt confirm=true cũng không được ghi');
  const r4 = await handleChatMessage({ channel: 'zalo', senderId: '0901', text: 'ok', llm: script([]) });
  assert.match(r4, /Đã giao: Đo hiện trạng → Trần Minh/);
  assert.equal(F.log.inserts.filter((x, i) => i >= before && x.table === 'construction_tasks').length, 1);
  assert.equal(F.tables.ai_chat_pending.length, 0);

  await handleChatMessage({ channel: 'zalo', senderId: '0901', text: 'giao tiếp', llm: script([
    { text: '', calls: [{ name: 'create_task', args: { title: 'Việc 2', project: 'Q7', assignee: 'Trần Minh' } }] },
  ]) });
  assert.equal(await handleChatMessage({ channel: 'zalo', senderId: '0901', text: 'không', llm: script([]) }), 'Đã huỷ, không ghi gì.');

  const decl = toolDeclarations();
  assert.equal(decl.length, 10);
  assert.ok(decl.every(d => !d.parametersJsonSchema.properties.sender && !d.parametersJsonSchema.properties.confirm));
});

test('webhook Zalo (bot Render) và Telegram: kiểm khoá bí mật', async () => {
  process.env.ZALO_BOT_SECRET = 'zs';
  assert.equal((await call('POST', '/api/generate-grok-news?job=zalo_webhook'.replace('/api/generate-grok-news', '/api/v1?__path=zalo/webhook&x=1'), { body: { sender_id: '1', text: 'a@b.c' } })).status, 401);
  const ok = await call('POST', '/api/v1?__path=zalo/webhook', { headers: { 'x-bot-secret': 'zs' }, body: { sender_id: '0999', text: 'khongco@dqh.vn' } });
  assert.equal(ok.status, 200);
  assert.match(ok.body.reply_message, /Không tìm thấy email/);
  delete process.env.ZALO_BOT_SECRET;
  assert.equal((await call('POST', '/api/v1?__path=telegram/webhook', { body: {} })).status, 401);
});
