// /api/v1/* — lớp API duy nhất cho trợ lý AI (+ /api/mcp và /api/send-telegram qua rewrites trong vercel.json).
// Logic nằm ở lib/core; file này chỉ định tuyến, xác thực, giới hạn tần suất.
//
//  GET   /api/v1/health
//  GET   /api/v1/projects                       ?q&source&include_closed
//  GET   /api/v1/projects/:source/:id/status
//  GET   /api/v1/tasks                          ?assignee&project&source&status&overdue&due_before&due_after&limit
//  POST  /api/v1/tasks                          {title, project, assignee, due_date, start_date, priority, description}
//  PATCH /api/v1/tasks/:source/:id              {status, progress_pct, assignee, due_date, title, note}
//  POST  /api/v1/logs                           {content, kind, project, title, log_date, is_issue}
//  GET   /api/v1/logs/search                    ?q&project&from&to&kind&issues_only&limit
//  GET   /api/v1/reports/daily|weekly|overdue   ?date&assignee | ?week_of
//  POST  /api/mcp                               MCP (JSON-RPC, Streamable HTTP, không trạng thái)
//  POST  /api/send-telegram                     (app nội bộ, cần đăng nhập)
//  GET   /api/v1/cron/morning-brief|diary-reminder|daily-report|weekly-report   (Vercel Cron, header Bearer CRON_SECRET)
//  POST  /api/v1/zalo/webhook        bot Zalo (Render) {sender_id,text} -> {reply_message}; Zalo OA event user_send_text
//  POST  /api/v1/telegram/webhook    Telegram Bot API (header X-Telegram-Bot-Api-Secret-Token)
//
// Xác thực AI: Authorization: Bearer dqh_...  (tạo bằng: node scripts/create-ai-key.mjs)
import { CoreError } from '../lib/core/db.js';
import { authenticateApiKey, authenticateUser, requireScope, audit } from '../lib/core/auth.js';
import { listProjects, projectStatus } from '../lib/core/projects.js';
import { listTasks, createTask, updateTask } from '../lib/core/tasks.js';
import { addLog, searchLogs } from '../lib/core/logs.js';
import { reportDaily, reportWeekly, reportOverdue } from '../lib/core/reports.js';
import { handleMcp } from '../lib/core/mcp.js';
import { sendTelegram } from '../lib/core/notify.js';
import crypto from 'node:crypto';
import { runDiaryReminder, runDailyReport, runWeeklyReport, runMorningBrief } from '../lib/core/cron.js';
import { handleChatMessage } from '../lib/core/chat.js';
import { sendZaloText, sendTelegramText } from '../lib/core/notify.js';

// ── Giới hạn tần suất cơ bản theo khoá/IP (bộ nhớ của từng instance) ──
const WINDOW_MS = 60_000;
const LIMIT = Number(process.env.AI_API_RATE_LIMIT || 120);
const hits = new Map();
function limited(id) {
  const now = Date.now();
  const r = hits.get(id);
  if (!r || now > r.reset) { hits.set(id, { n: 1, reset: now + WINDOW_MS }); return false; }
  r.n++;
  if (hits.size > 5000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
  return r.n > LIMIT;
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(obj === undefined ? '' : JSON.stringify(obj));
}

async function readJson(req) {
  if (req.body !== undefined && req.body !== null && req.body !== '') {
    if (typeof req.body === 'string') return JSON.parse(req.body);
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString('utf8'));
    return req.body;
  }
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 256 * 1024) throw new CoreError(413, 'Dữ liệu quá lớn'); chunks.push(c); }
  const t = Buffer.concat(chunks).toString('utf8');
  return t ? JSON.parse(t) : {};
}

/** Lấy đường dẫn con: hỗ trợ cả URL gốc (/api/v1/tasks) lẫn rewrite (?__path=tasks). */
export function routeOf(req) {
  const u = new URL(req.url || '/', 'http://x');
  const viaQuery = u.searchParams.get('__path');
  let p = viaQuery != null ? viaQuery : u.pathname;
  if (viaQuery == null) {
    if (p.startsWith('/api/v1')) p = p.slice('/api/v1'.length);
    else if (p === '/api/mcp') p = 'mcp';
    else if (p === '/api/send-telegram') p = 'notify/telegram';
  }
  u.searchParams.delete('__path');
  return { parts: p.split('/').filter(Boolean), query: Object.fromEntries(u.searchParams) };
}

const bool = v => v === true || v === 'true' || v === '1';

export default async function handler(req, res) {
  const method = req.method || 'GET';
  const { parts, query } = routeOf(req);
  const route = parts.join('/');
  try {
    if (method === 'OPTIONS') return send(res, 204);
    if (route === 'health' || route === '') return send(res, 200, { ok: true, service: 'dqh-ai-api', version: 1 });

    // App nội bộ: gửi Telegram (cần người dùng đăng nhập).
    if (route === 'notify/telegram') {
      if (method !== 'POST') return send(res, 405, { error: 'Chỉ nhận POST' });
      const user = await authenticateUser(req);
      if (limited('u:' + user.id)) return send(res, 429, { error: 'Gửi quá nhiều, thử lại sau 1 phút' });
      const b = await readJson(req);
      return send(res, 200, await sendTelegram({ userId: b.userId, message: b.message, taskUrl: b.taskUrl }));
    }

    // Kênh chat: Zalo (bot Render hoặc OA) và Telegram -> cùng một "bộ não" lib/core/chat.js
    if (route === 'zalo/webhook') {
      if (method === 'GET') return send(res, 200, { ok: true });
      if (method !== 'POST') return send(res, 405, { error: 'Chỉ nhận POST' });
      const b = await readJson(req);
      if (b?.event_name) { // Zalo OA
        if (b.event_name !== 'user_send_text') return send(res, 200, { ok: true });
        const uid = b.sender?.id, text = b.message?.text;
        if (uid && text) {
          const reply = await handleChatMessage({ channel: 'zalo', senderId: uid, text }).catch(e => 'Lỗi: ' + e.message);
          await sendZaloText(uid, reply, 'oa').catch(e => console.error('[zalo oa reply]', e.message));
        }
        return send(res, 200, { error: 0, message: 'Success' });
      }
      const secret = process.env.ZALO_BOT_SECRET;
      if (secret && req.headers?.['x-bot-secret'] !== secret) return send(res, 401, { error: 'Sai ZALO_BOT_SECRET' });
      const senderId = b?.sender_id ?? b?.senderId ?? b?.phone, text = b?.text ?? b?.message;
      if (!senderId || !text) return send(res, 400, { error: 'Thiếu sender_id hoặc text' });
      const reply = await handleChatMessage({ channel: 'zalo', senderId: String(senderId), text: String(text) });
      return send(res, 200, { reply_message: reply });
    }
    if (route === 'telegram/webhook') {
      const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
      if (!secret || req.headers?.['x-telegram-bot-api-secret-token'] !== secret) return send(res, 401, { error: 'Sai TELEGRAM_WEBHOOK_SECRET' });
      const b = await readJson(req);
      const m = b?.message;
      if (m?.chat?.type === 'private' && m.text) {
        const reply = await handleChatMessage({ channel: 'telegram', senderId: String(m.chat.id), text: m.text }).catch(e => 'Lỗi: ' + e.message);
        await sendTelegramText(m.chat.id, reply).catch(e => console.error('[tg reply]', e.message));
      }
      return send(res, 200, { ok: true });
    }

    // Vercel Cron: Authorization: Bearer <CRON_SECRET>
    if (parts[0] === 'cron') {
      const secret = process.env.CRON_SECRET;
      const got = String(req.headers?.authorization || '');
      const ok = secret && got.length === `Bearer ${secret}`.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(`Bearer ${secret}`));
      if (!ok) return send(res, 401, { error: 'Sai CRON_SECRET' });
      const q = { ...query, force: bool(query.force) };
      if (parts[1] === 'morning-brief') return send(res, 200, await runMorningBrief(q));
      if (parts[1] === 'diary-reminder') return send(res, 200, await runDiaryReminder(q));
      if (parts[1] === 'daily-report') return send(res, 200, await runDailyReport(q));
      if (parts[1] === 'weekly-report') return send(res, 200, await runWeeklyReport(q));
      return send(res, 404, { error: 'Không có job này' });
    }

    // Từ đây trở đi: khoá API của trợ lý AI.
    const ctx = await authenticateApiKey(req);
    if (limited('k:' + ctx.key_id)) return send(res, 429, { error: 'Quá nhiều yêu cầu, thử lại sau 1 phút' });

    if (route === 'mcp') {
      if (method === 'GET') { res.setHeader('Allow', 'POST'); return send(res, 405, { error: 'Máy chủ MCP này không mở luồng SSE; dùng POST' }); }
      if (method === 'DELETE') return send(res, 405, { error: 'Không có phiên để xoá' });
      if (method !== 'POST') return send(res, 405, { error: 'Chỉ nhận POST' });
      let body;
      try { body = await readJson(req); } catch { return send(res, 400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); }
      const out = await handleMcp(body, ctx);
      if (out === null) return send(res, 202);
      return send(res, 200, out);
    }

    const [a, b, c, d] = parts;
    if (a === 'projects' && !b && method === 'GET') {
      requireScope(ctx, 'read');
      return send(res, 200, { data: await listProjects({ q: query.q, source: query.source, include_closed: bool(query.include_closed) }) });
    }
    if (a === 'projects' && b && c && d === 'status' && method === 'GET') {
      requireScope(ctx, 'read');
      return send(res, 200, { data: await projectStatus(c, b) });
    }
    if (a === 'tasks' && !b && method === 'GET') {
      requireScope(ctx, 'read');
      return send(res, 200, { data: await listTasks({ ...query, overdue: bool(query.overdue) }) });
    }
    if (a === 'tasks' && !b && method === 'POST') {
      requireScope(ctx, 'write');
      const body = await readJson(req);
      const r = await createTask(body, ctx.actor);
      await audit(ctx, 'POST /v1/tasks', body, true, r.id);
      return send(res, 201, { data: r });
    }
    if (a === 'tasks' && b && c && method === 'PATCH') {
      requireScope(ctx, 'write');
      const body = await readJson(req);
      const r = await updateTask(b, c, body);
      await audit(ctx, 'PATCH /v1/tasks', { source: b, id: c, ...body }, true, JSON.stringify(r.thay_doi));
      return send(res, 200, { data: r });
    }
    if (a === 'logs' && !b && method === 'POST') {
      requireScope(ctx, 'write');
      const body = await readJson(req);
      const r = await addLog(body, ctx.actor);
      await audit(ctx, 'POST /v1/logs', body, true, r.id);
      return send(res, 201, { data: r });
    }
    if (a === 'logs' && b === 'search' && method === 'GET') {
      requireScope(ctx, 'read');
      return send(res, 200, { data: await searchLogs({ ...query, issues_only: bool(query.issues_only) }) });
    }
    if (a === 'reports' && method === 'GET') {
      requireScope(ctx, 'read');
      if (b === 'daily') return send(res, 200, { data: await reportDaily(query) });
      if (b === 'weekly') return send(res, 200, { data: await reportWeekly(query) });
      if (b === 'overdue') return send(res, 200, { data: await reportOverdue(query) });
    }
    return send(res, 404, { error: `Không có đường dẫn ${method} /api/v1/${route}` });
  } catch (e) {
    if (e instanceof CoreError) return send(res, e.status, { error: e.message, ...(e.details ? { details: e.details } : {}) });
    if (e instanceof SyntaxError) return send(res, 400, { error: 'JSON không hợp lệ' });
    console.error('[api/v1]', route, e);
    return send(res, 500, { error: 'Lỗi máy chủ' });
  }
}
