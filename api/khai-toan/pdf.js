// POST /api/khai-toan/pdf : nhận cấu hình khái toán (JSON), trả file PDF (application/pdf).
// Bảo vệ: header Authorization: Bearer <KHAI_TOAN_API_KEY>, giới hạn tần suất cơ bản theo IP.
// Không ghi log tên / số điện thoại khách. Không lưu PDF ở đâu cả (trả thẳng trong response).
import crypto from 'node:crypto';
import { calc, renderEstimatePdf } from '../../lib/khai-toan/pdf.js';

// maxDuration / memory / includeFiles: xem vercel.json (mục "functions").

// ── Giới hạn tần suất (bộ nhớ trong của từng instance, mức cơ bản) ──
const WINDOW_MS = 60_000;
const LIMIT_PER_IP = Number(process.env.KHAI_TOAN_RATE_LIMIT || 20); // số yêu cầu / phút / IP
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) { hits.set(ip, { count: 1, reset: now + WINDOW_MS }); return false; }
  rec.count++;
  if (hits.size > 5000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
  return rec.count > LIMIT_PER_IP;
}

function send(res, status, obj, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(obj));
}

// So khớp khoá an toàn thời gian (tránh dò khoá theo thời gian phản hồi).
function keyMatches(given, expected) {
  const a = crypto.createHash('sha256').update(String(given)).digest();
  const b = crypto.createHash('sha256').update(String(expected)).digest();
  return crypto.timingSafeEqual(a, b);
}

async function readJson(req) {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') return JSON.parse(req.body);
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString('utf8'));
    return req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const c of req) { size += c.length; if (size > 64 * 1024) throw new Error('too large'); chunks.push(c); }
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : undefined;
}

// Tên file an toàn ASCII (bỏ dấu), không chứa thông tin cá nhân.
function fileName(v) {
  return `khai-toan-dqh-${v.area}m2-${v.beds}pn-${v.baths}wc-${Date.now().toString(36)}.pdf`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Chỉ hỗ trợ POST.' }, { Allow: 'POST' });

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (rateLimited(ip)) return send(res, 429, { error: 'Quá nhiều yêu cầu, thử lại sau 1 phút.' }, { 'Retry-After': '60' });

  const expected = process.env.KHAI_TOAN_API_KEY;
  if (!expected) return send(res, 503, { error: 'Máy chủ chưa cấu hình KHAI_TOAN_API_KEY.' });
  const m = /^Bearer\s+(.+)$/i.exec(String(req.headers.authorization || ''));
  if (!m || !keyMatches(m[1].trim(), expected)) {
    return send(res, 401, { error: 'Thiếu hoặc sai khoá API (Authorization: Bearer <KHAI_TOAN_API_KEY>).' }, { 'WWW-Authenticate': 'Bearer' });
  }

  let body;
  try { body = await readJson(req); } catch { return send(res, 400, { error: 'Body không phải JSON hợp lệ (tối đa 64KB).' }); }
  const v = calc.validateRequest(body);
  if (!v.ok) return send(res, 400, { error: 'Dữ liệu không hợp lệ.', details: v.errors });

  const t0 = Date.now();
  try {
    const { pdf, result } = await renderEstimatePdf(v.value);
    const base = (process.env.KHAI_TOAN_PUBLIC_BASE_URL || 'https://dqh.vercel.app').replace(/\/$/, '');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName(v.value)}"`);
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-store');
    // Thông tin phụ cho trợ lý (không chứa dữ liệu cá nhân)
    res.setHeader('X-Khai-Toan-Total', String(result.total));
    res.setHeader('X-Khai-Toan-Work-Days', String(result.schedule.workDays));
    res.setHeader('X-Khai-Toan-Link', `${base}/khai-toan/index.html?cfg=${calc.encodeCfg(v.value)}`);
    res.end(pdf);
    // Log chỉ số kỹ thuật, KHÔNG log tên / SĐT.
    console.log(`[khai-toan/pdf] ok area=${v.value.area} bytes=${pdf.length} ms=${Date.now() - t0}`);
  } catch (err) {
    console.error('[khai-toan/pdf] lỗi tạo PDF:', err && err.message);
    send(res, 500, { error: 'Không tạo được PDF, vui lòng thử lại.' });
  }
}
