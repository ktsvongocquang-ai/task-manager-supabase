// MCP server (Streamable HTTP, không trạng thái, trả JSON). Chỉ gọi lib/core — không có logic nghiệp vụ riêng.
import { CoreError } from './db.js';
import { requireScope, audit, findPrevious } from './auth.js';
import { resolveSender } from './people.js';
import { todayVN } from './text.js';
import { listProjects, projectStatus } from './projects.js';
import { listTasks, planCreateTask, createTask, planUpdateTask, updateTask } from './tasks.js';
import { planAddLog, addLog, searchLogs, LOG_KINDS } from './logs.js';
import { reportDaily, reportWeekly, reportOverdue } from './reports.js';

export const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const SERVER_INFO = { name: 'dqh-tro-ly', title: 'DQH — Trợ lý dự án', version: '1.0.0' };

const DATE = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'Ngày dạng YYYY-MM-DD' };
const SOURCE = { type: 'string', enum: ['core', 'construction', 'marketing', 'personal'],
  description: 'Nguồn việc: core = thiết kế/dự án chung, construction = thi công, marketing, personal = việc cá nhân' };
const REQ = { type: 'string', maxLength: 80, description: 'Mã yêu cầu tuỳ chọn (vd uuid). Gọi lại cùng mã sẽ không ghi trùng.' };
const CONFIRM = { type: 'boolean', default: false,
  description: 'false (mặc định) = chỉ xem trước, KHÔNG ghi. Đọc bản xem trước cho người dùng, khi họ đồng ý thì gọi lại với true.' };

const SENDER = { type: 'string', description: 'Người đang nhắn (khi trợ lý dùng chung cho cả đội qua Telegram/Zalo): "telegram:<chat id>", "zalo:<user id>", email hoặc họ tên. Việc giao, nhật ký sẽ đứng tên người này; "tôi" trong câu hỏi = người này.' };
const ME = /^(t[oô]i|tui|em|minh|m[iì]nh|me|my|toi)$/i;

export const TOOLS = [
  {
    name: 'list_projects', scope: 'read',
    description: 'Liệt kê dự án/công trình đang chạy (thiết kế, thi công, marketing). Dùng để tìm đúng tên dự án trước khi giao việc hoặc ghi chép. VD: "đang có những công trình nào?"',
    inputSchema: { type: 'object', properties: {
      q: { type: 'string', description: 'Lọc theo tên, mã, khách hàng, địa chỉ' },
      source: { type: 'string', enum: ['core', 'construction', 'marketing'] },
      include_closed: { type: 'boolean', description: 'Gồm cả dự án đã xong/huỷ' },
    } },
    run: a => listProjects(a),
  },
  {
    name: 'get_project_status', scope: 'read',
    description: 'Tình trạng 1 dự án: % tiến độ, số việc theo trạng thái, việc trễ, việc đến hạn 7 ngày tới, vấn đề 14 ngày qua. VD: "nhà Thảo Điền đang tới đâu rồi?"',
    inputSchema: { type: 'object', required: ['project'], properties: {
      project: { type: 'string', description: 'Tên, mã hoặc id dự án' },
      source: { type: 'string', enum: ['core', 'construction', 'marketing'] },
    } },
    run: a => projectStatus(a.project, a.source),
  },
  {
    name: 'list_tasks', scope: 'read',
    description: 'Lọc công việc theo người, dự án, trạng thái, hạn. VD: "Minh đang có việc gì?", "việc trễ của công trình Q7".',
    inputSchema: { type: 'object', properties: {
      assignee: { type: 'string', description: 'Tên người (có/không dấu, "anh Thắng" cũng được) hoặc id' },
      project: { type: 'string', description: 'Tên, mã hoặc id dự án' },
      source: SOURCE,
      status: { type: 'string', enum: ['open', 'all', 'todo', 'doing', 'done', 'cancelled'], default: 'open', description: 'open = chưa xong (mặc định)' },
      overdue: { type: 'boolean', description: 'Chỉ việc đã quá hạn' },
      mine: { type: 'boolean', description: 'Chỉ việc của người đang nhắn (cần sender)' },
      due_before: DATE, due_after: DATE,
      limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
    } },
    run: a => listTasks(a),
  },
  {
    name: 'create_task', scope: 'write', confirm: true,
    description: 'Giao việc mới. Việc được ghi vào đúng bảng của dự án (thi công/thiết kế/marketing) nên hiện ngay trong app. Không có dự án = việc cá nhân. VD: "giao anh Thắng kiểm tra điện nhà Thảo Điền trước thứ 6". Luôn gọi với confirm=false trước để xem trước.',
    inputSchema: { type: 'object', required: ['title'], properties: {
      title: { type: 'string', description: 'Tên việc ngắn gọn' },
      project: { type: 'string', description: 'Tên, mã hoặc id dự án' },
      assignee: { type: 'string', description: 'Người nhận việc' },
      due_date: DATE, start_date: DATE,
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
      description: { type: 'string' },
      request_id: REQ,
      confirm: CONFIRM,
    } },
    preview: (a, ctx) => planCreateTask(a, ctx.actor).then(p => p.summary),
    run: (a, ctx) => createTask(a, ctx.actor),
  },
  {
    name: 'update_task', scope: 'write', confirm: true,
    description: 'Cập nhật 1 việc: trạng thái, % tiến độ, người nhận, hạn, tên, ghi chú. Lấy id + source từ list_tasks. VD: "việc đi ống điện tầng 2 xong rồi".',
    inputSchema: { type: 'object', required: ['source', 'id'], properties: {
      source: SOURCE,
      id: { type: 'string', description: 'id việc (từ list_tasks)' },
      status: { type: 'string', enum: ['todo', 'doing', 'done', 'cancelled'] },
      progress_pct: { type: 'integer', minimum: 0, maximum: 100 },
      assignee: { type: 'string' },
      due_date: { ...DATE, type: ['string', 'null'] },
      title: { type: 'string' },
      note: { type: 'string' },
      confirm: CONFIRM,
    } },
    preview: a => planUpdateTask(a.source, a.id, pick(a)).then(p => p.summary),
    run: a => updateTask(a.source, a.id, pick(a)),
  },
  {
    name: 'add_log', scope: 'write',
    description: 'Ghi chép: nhật ký công trình, biên bản, ghi chú, vấn đề phát sinh. Nhật ký của công trình thi công đi thẳng vào Nhật ký công trường trong app. VD: "ghi nhật ký Q7: đội anh Cường 3 người, bắn vách bếp xong 70%, thiếu cây U nhôm, mai gắn giường master". Tách lời người dùng ra các trường area/team/workers/work_item/progress_pct/issue/tomorrow_plan khi có.',
    inputSchema: { type: 'object', required: ['content'], properties: {
      content: { type: 'string', description: 'Nội dung, giữ nguyên lời người dùng' },
      kind: { type: 'string', enum: LOG_KINDS, default: 'ghi_chu', description: 'nhat_ky = nhật ký công trình, bien_ban, ghi_chu, van_de = vấn đề/sự cố' },
      project: { type: 'string', description: 'Tên, mã hoặc id dự án (bỏ trống = ghi chú chung)' },
      title: { type: 'string', description: 'Tiêu đề. Biểu mẫu giám sát thì bắt đầu bằng mã: "GS-06 · Sự cố / phát sinh", "GS-08 · Nghiệm thu nội bộ", "GS-05 · Nhận vật tư", "GS-10 · Đánh giá tổ đội"' },
      log_date: DATE,
      is_issue: { type: 'boolean' },
      area: { type: 'string', description: 'Nhật ký: khu vực thi công trong ngày' },
      team: { type: 'string', description: 'Nhật ký: đội thi công / tên thợ' },
      workers: { type: 'integer', minimum: 0, description: 'Nhật ký: số nhân công có mặt' },
      work_item: { type: 'string', description: 'Nhật ký: hạng mục thực hiện' },
      progress_pct: { type: 'integer', minimum: 0, maximum: 100, description: 'Nhật ký: % hoàn thành hạng mục' },
      issue: { type: 'string', description: 'Nhật ký: vướng mắc / phát sinh' },
      issue_type: { type: 'string', enum: ['vat_tu', 'ban_ve', 'nhan_luc', 'khach_hang', 'mat_bang', 'khac'] },
      need_support: { type: 'string', description: 'Nhật ký: cần hỗ trợ từ bộ phận nào (thiết kế, xưởng, mua hàng...)' },
      tomorrow_plan: { type: 'string', description: 'Nhật ký: kế hoạch ngày mai' },
      request_id: REQ,
    } },
    run: (a, ctx) => addLog(a, ctx.actor),
  },
  {
    name: 'search_logs', scope: 'read',
    description: 'Tìm trong nhật ký / biên bản / ghi chú (không cần gõ dấu). VD: "tuần trước nhà Q7 có vấn đề gì?", "tìm biên bản về thang máy".',
    inputSchema: { type: 'object', properties: {
      q: { type: 'string' }, project: { type: 'string' }, from: DATE, to: DATE,
      kind: { type: 'string', enum: LOG_KINDS }, issues_only: { type: 'boolean' },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
    } },
    run: a => searchLogs(a),
  },
  {
    name: 'report_daily', scope: 'read',
    description: 'Báo cáo ngày: việc đến hạn, trễ hạn, đang làm, ghi chép và vấn đề trong ngày. Có thể lọc theo 1 người. VD: "báo cáo hôm nay", "hôm nay Toàn có gì?"',
    inputSchema: { type: 'object', properties: { date: DATE, assignee: { type: 'string' }, mine: { type: 'boolean', description: 'Chỉ của người đang nhắn' } } },
    run: a => reportDaily(a),
  },
  {
    name: 'report_weekly', scope: 'read',
    description: 'Báo cáo tuần: từng dự án (% tiến độ, việc trễ, việc tuần sau, vấn đề) và việc trễ theo người. VD: "báo cáo tuần này".',
    inputSchema: { type: 'object', properties: { week_of: { ...DATE, description: 'Một ngày bất kỳ trong tuần cần xem (mặc định tuần này)' } } },
    run: a => reportWeekly(a),
  },
  {
    name: 'report_overdue', scope: 'read',
    description: 'Danh sách việc trễ hạn, gom theo người. VD: "ai đang trễ việc?"',
    inputSchema: { type: 'object', properties: { assignee: { type: 'string' }, date: DATE } },
    run: a => reportOverdue(a),
  },
];

function pick(a) {
  const out = {};
  for (const k of ['status', 'progress_pct', 'assignee', 'due_date', 'title', 'note']) if (a[k] !== undefined) out[k] = a[k];
  return out;
}

function toolList() {
  return TOOLS.map(({ name, description, inputSchema, scope }) => ({
    name, description, inputSchema: { ...inputSchema, properties: { ...inputSchema.properties, sender: SENDER } },
    annotations: { readOnlyHint: scope === 'read', destructiveHint: false, idempotentHint: scope === 'read', openWorldHint: false },
  }));
}

function textOf(result) {
  if (result && typeof result.text === 'string') return result.text + '\n\n' + JSON.stringify({ ...result, text: undefined }, null, 1);
  return JSON.stringify(result, null, 1);
}

export async function callTool(name, args, ctx) {
  const tool = TOOLS.find(t => t.name === name);
  if (!tool) throw new CoreError(404, `Không có tool ${name}`);
  requireScope(ctx, tool.scope);
  const a = { ...(args || {}) };
  if (a.sender) {
    requireScope(ctx, 'delegate');
    const who = await resolveSender(a.sender);
    ctx = { ...ctx, actor: who, sender: who };
    delete a.sender;
    if (typeof a.assignee === 'string' && ME.test(a.assignee.trim()) ) a.assignee = who.id;
    if (['list_tasks', 'report_daily'].includes(name) && a.mine) a.assignee = who.id;
  }
  delete a.mine;
  if (tool.confirm && a.confirm !== true) {
    const preview = await tool.preview(a, ctx);
    return { xem_truoc: true, chua_ghi: true, ...preview, huong_dan: 'Đọc lại cho người dùng. Nếu họ đồng ý, gọi lại đúng tool này với confirm=true.' };
  }
  if (tool.scope === 'write' && a.request_id) {
    const prev = await findPrevious(ctx, name, String(a.request_id));
    if (prev) return { da_ghi_truoc_do: true, ket_qua: prev };
  }
  const result = await tool.run(a, ctx);
  if (tool.scope === 'write') await audit(ctx, name, a, true, JSON.stringify(result).slice(0, 300), a.request_id);
  return result;
}

function rpcError(id, code, message, data) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message, ...(data !== undefined ? { data } : {}) } };
}

async function handleOne(msg, ctx) {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return rpcError(msg?.id, -32600, 'Invalid Request');
  const isNotification = msg.id === undefined || msg.id === null;
  const { id, method, params } = msg;
  if (isNotification) return null; // notifications/initialized, notifications/cancelled...
  switch (method) {
    case 'initialize': {
      const asked = params?.protocolVersion;
      return { jsonrpc: '2.0', id, result: {
        protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: `Trợ lý quản lý dự án DQH Architects. Hôm nay là ${todayVN()} (giờ Việt Nam). `
          + 'Trả lời bằng tiếng Việt. Khi người dùng nói "thứ 6", "tuần sau"… hãy đổi ra ngày YYYY-MM-DD. '
          + 'Giao việc / sửa việc: luôn xem trước (confirm=false), đọc lại cho người dùng, chỉ ghi khi họ đồng ý. '
          + 'Nếu tool báo nhiều người hoặc nhiều dự án khớp, hỏi lại người dùng chọn ai/cái nào.',
      } };
    }
    case 'ping': return { jsonrpc: '2.0', id, result: {} };
    case 'tools/list': return { jsonrpc: '2.0', id, result: { tools: toolList() } };
    case 'tools/call': {
      const name = params?.name;
      if (!TOOLS.some(t => t.name === name)) return rpcError(id, -32602, `Không có tool ${name}`);
      try {
        const result = await callTool(name, params?.arguments, ctx);
        const structured = result && typeof result === 'object' && !Array.isArray(result) ? result : { data: result };
        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: textOf(result) }], structuredContent: structured, isError: false } };
      } catch (e) {
        const detail = e instanceof CoreError && e.details ? '\n' + JSON.stringify(e.details) : '';
        if (!(e instanceof CoreError)) console.error('[mcp]', name, e);
        const tool = TOOLS.find(t => t.name === name);
        if (tool?.scope === 'write') await audit(ctx, name, params?.arguments, false, e.message);
        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: `Lỗi: ${e instanceof CoreError ? e.message : 'lỗi máy chủ'}${detail}` }], isError: true } };
      }
    }
    case 'resources/list': return { jsonrpc: '2.0', id, result: { resources: [] } };
    case 'prompts/list': return { jsonrpc: '2.0', id, result: { prompts: [] } };
    default: return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

/** Xử lý 1 thân POST MCP (1 message hoặc mảng). Trả null nếu chỉ toàn notification (HTTP 202). */
export async function handleMcp(body, ctx) {
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map(m => handleOne(m, ctx)))).filter(Boolean);
    return out.length ? out : null;
  }
  return handleOne(body, ctx);
}
