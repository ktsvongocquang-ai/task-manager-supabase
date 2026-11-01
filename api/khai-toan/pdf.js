// /api/khai-toan/pdf : tạo PDF khái toán DQH.
//
//  POST (có khoá): body JSON, header Authorization: Bearer <KHAI_TOAN_API_KEY>. Trả PDF dạng tải về.
//  GET  (công khai): tham số trên URL, trả PDF "inline" để bấm link là mở ngay trên điện thoại.
//       Ví dụ: /api/khai-toan/pdf?area=60&beds=2&baths=2&tier=standard&style=modern&ac=ducted
//       Cũng nhận đuôi .pdf: /api/khai-toan/khai-toan-60m2.pdf?... (rewrite trong vercel.json)
//       Luôn ẩn tiến độ. Chống lạm dụng: giới hạn tần suất theo IP + cache theo cấu hình
//       (CDN của Vercel và bộ nhớ của instance), cache hết hạn lúc 0 giờ (giờ VN), tối đa 24 giờ.
//
// Không ghi log tên / số điện thoại khách.
import crypto from 'node:crypto';
import { calc, renderEstimatePdf } from '../../lib/khai-toan/pdf.js';

// maxDuration / includeFiles: xem vercel.json (mục "functions").

// ── Giới hạn tần suất (bộ nhớ trong của từng instance, mức cơ bản) ──
const WINDOW_MS = 60_000;
const LIMIT_POST = Number(process.env.KHAI_TOAN_RATE_LIMIT || 20);          // POST: yêu cầu / phút / IP
const LIMIT_GET = Number(process.env.KHAI_TOAN_PUBLIC_RATE_LIMIT || 10);    // GET công khai: yêu cầu / phút / IP
const buckets = { POST: new Map(), GET: new Map() };
function rateLimited(kind, ip, limit) {
  const hits = buckets[kind];
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) { hits.set(ip, { count: 1, reset: now + WINDOW_MS }); return false; }
  rec.count++;
  if (hits.size > 5000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
  return rec.count > limit;
}
function clientIp(req) {
  const h = req.headers;
  return String(h['x-real-ip'] || h['x-vercel-forwarded-for'] || h['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
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

// ── GET công khai: đọc tham số phẳng trên URL ──
const GET_TOP = ['area', 'beds', 'baths', 'tier', 'style', 'name'];
const GET_SCOPE = ['ac', 'smarthome', 'speaker', 'freshAir'];
// Tham số theo dõi do Zalo / Messenger / quảng cáo tự gắn thêm vào link: bỏ qua, không báo lỗi.
const TRACKING = /^(fbclid|gclid|zarsrc|zalo_?.*|utm_.*|ref|igshid|mibextid)$/i;

function parseGetQuery(url) {
  const details = [];
  const params = new URL(url, 'http://localhost').searchParams;
  const seen = new Set();
  const body = {}, scope = {};
  for (const [k, raw] of params) {
    if (TRACKING.test(k)) continue;
    if (seen.has(k)) { details.push('Tham số ' + k + ' bị lặp.'); continue; }
    seen.add(k);
    const v = raw.trim();
    if (GET_TOP.includes(k)) {
      if (k === 'name') {
        if (v.length > 40) details.push('name tối đa 40 ký tự.');
        else if (v) body.clientName = v;
      } else body[k] = v;
    } else if (GET_SCOPE.includes(k)) {
      if (k === 'freshAir') {
        if (v !== 'true' && v !== 'false') details.push('freshAir chỉ nhận true | false.');
        else scope.freshAir = v === 'true';
      } else if (v !== '') scope[k] = v;
    } else {
      details.push('Tham số không được hỗ trợ: ' + k + ' (chỉ nhận ' + GET_TOP.concat(GET_SCOPE).join(', ') + ').');
    }
  }
  if (Object.keys(scope).length) body.scope = scope;
  if (details.length) return { ok: false, errors: details };
  const v = calc.validateRequest(body);
  if (!v.ok) return v;
  v.value.showSchedule = false; // đường công khai: luôn ẩn tiến độ
  return v;
}

// Ngày hiện tại theo giờ VN + số giây đến 0 giờ hôm sau (để cache không giữ "Ngày lập" cũ).
function vnDay() {
  const now = Date.now();
  const vn = new Date(now + 7 * 3600_000);
  const day = vn.toISOString().slice(0, 10);
  const nextMidnightUtc = Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate() + 1) - 7 * 3600_000;
  return { day, ttl: Math.max(60, Math.min(86400, Math.floor((nextMidnightUtc - now) / 1000))) };
}

// ── Cache PDF theo cấu hình trong bộ nhớ instance (gộp cả các yêu cầu trùng đang render) ──
const pdfCache = new Map(); // key -> { promise, expires }
const CACHE_MAX = 60;
function cachedRender(value, day) {
  const key = crypto.createHash('sha256').update(day + '|' + JSON.stringify([
    value.clientName, value.area, value.beds, value.baths, value.tier, value.style, value.startDate,
    Object.keys(value.scope).sort().map(k => [k, value.scope[k]]),
  ])).digest('hex');
  const now = Date.now();
  const hit = pdfCache.get(key);
  if (hit && hit.expires > now) return { key, hit: true, promise: hit.promise };
  const promise = renderEstimatePdf(value);
  pdfCache.set(key, { promise, expires: now + 3600_000 });
  promise.catch(() => pdfCache.delete(key));
  if (pdfCache.size > CACHE_MAX) pdfCache.delete(pdfCache.keys().next().value);
  return { key, hit: false, promise };
}

async function handleGet(req, res) {
  const head = req.method === 'HEAD';
  if (rateLimited('GET', clientIp(req), LIMIT_GET)) {
    return send(res, 429, { error: 'Quá nhiều yêu cầu, thử lại sau 1 phút.' }, { 'Retry-After': '60' });
  }
  const v = parseGetQuery(req.url);
  if (!v.ok) return send(res, 400, { error: 'Dữ liệu không hợp lệ.', details: v.errors });

  const t0 = Date.now();
  try {
    const { day, ttl } = vnDay();
    const c = cachedRender(v.value, day);
    const { pdf, result } = await c.promise;
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="khai-toan-${v.value.area}m2.pdf"`);
    res.setHeader('Content-Length', pdf.length);
    // CDN của Vercel giữ bản đã render theo đúng URL đến 0 giờ (giờ VN); trình duyệt không cache.
    res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${ttl}`);
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('X-Khai-Toan-Total', String(result.total));
    res.setHeader('X-Khai-Toan-Cache', c.hit ? 'HIT' : 'MISS');
    res.end(head ? undefined : pdf);
    console.log(`[khai-toan/pdf GET] ok area=${v.value.area} cache=${c.hit ? 'hit' : 'miss'} ms=${Date.now() - t0}`);
  } catch (err) {
    console.error('[khai-toan/pdf GET] lỗi tạo PDF:', err && err.message);
    send(res, 500, { error: 'Không tạo được PDF, vui lòng thử lại.' });
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET' || req.method === 'HEAD') return handleGet(req, res);
  if (req.method !== 'POST') return send(res, 405, { error: 'Chỉ hỗ trợ GET, HEAD, POST.' }, { Allow: 'GET, HEAD, POST' });

  if (rateLimited('POST', clientIp(req), LIMIT_POST)) return send(res, 429, { error: 'Quá nhiều yêu cầu, thử lại sau 1 phút.' }, { 'Retry-After': '60' });

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
