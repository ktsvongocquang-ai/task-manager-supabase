// Kiểm thử GET công khai /api/khai-toan/pdf (handler thật + Chromium local).
// Chạy: node --test --test-force-exit tests/khai-toan/api-get.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.KHAI_TOAN_API_KEY = 'unit-test-key';
process.env.KHAI_TOAN_PUBLIC_RATE_LIMIT = '8';
const { default: handler } = await import('../../api/khai-toan/pdf.js');
const { closeBrowser, calc } = await import('../../lib/khai-toan/pdf.js');

let server, base;
before(async () => {
  server = http.createServer(handler);
  await new Promise(r => server.listen(0, r));
  base = `http://localhost:${server.address().port}/api/khai-toan/pdf`;
});
after(async () => { await closeBrowser(); server.close(); });

// Mỗi test dùng IP giả khác nhau để không ảnh hưởng giới hạn tần suất của nhau.
const get = (qs, ip = '10.0.0.1', method = 'GET') => fetch(base + qs, { method, headers: { 'x-real-ip': ip } });

test('GET hợp lệ -> PDF inline, đúng tổng, không cần khoá, cache lần 2', async () => {
  const qs = '?area=60&beds=2&baths=2&tier=standard&style=modern&ac=ducted&smarthome=standard&freshAir=false&name=Ch%E1%BB%8B%20Hoa';
  const r = await get(qs, '10.0.0.1');
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'application/pdf');
  assert.equal(r.headers.get('content-disposition'), 'inline; filename="khai-toan-60m2.pdf"');
  assert.match(r.headers.get('cache-control'), /s-maxage=\d+/);
  const expected = calc.calculate({ area: 60, beds: 2, baths: 2, tier: 'standard', style: 'modern', scope: { ac: 'ducted', smarthome: 'standard', freshAir: false } }).total;
  assert.equal(r.headers.get('x-khai-toan-total'), String(expected));
  assert.equal(Buffer.from(await r.arrayBuffer()).subarray(0, 5).toString(), '%PDF-');
  // Cùng cấu hình, thứ tự tham số khác + fbclid của Messenger -> lấy từ cache, không render lại
  const r2 = await get('?style=modern&tier=standard&baths=2&beds=2&area=60&freshAir=false&smarthome=standard&ac=ducted&name=Ch%E1%BB%8B%20Hoa&fbclid=abc', '10.0.0.1');
  assert.equal(r2.status, 200);
  assert.equal(r2.headers.get('x-khai-toan-cache'), 'HIT');
});

test('Đuôi .pdf được chấp nhận ở dev server / rewrite (handler nhận mọi path)', async () => {
  const r = await fetch(base.replace('/pdf', '/khai-toan-60m2.pdf') + '?area=60&beds=2&baths=2&tier=standard&style=modern', { headers: { 'x-real-ip': '10.0.0.9' } });
  assert.equal(r.status, 200);
});

test('area=10 / enum sai / tham số lạ / showSchedule -> 400 kèm details', async () => {
  for (const qs of [
    '?area=10&beds=2&baths=2&tier=standard&style=modern',
    '?area=60&beds=5&baths=2&tier=standard&style=modern',
    '?area=60&beds=2&baths=2&tier=vip&style=modern',
    '?area=60&beds=2&baths=2&tier=standard&style=modern&ac=split',
    '?area=60&beds=2&baths=2&tier=standard&style=modern&freshAir=yes',
    '?area=60&beds=2&baths=2&tier=standard&style=modern&showSchedule=true',
    '?area=60&beds=2&baths=2&tier=standard&style=modern&name=' + 'x'.repeat(41),
  ]) {
    const r = await get(qs, '10.0.0.2');
    assert.equal(r.status, 400, qs);
    assert.ok(Array.isArray((await r.json()).details), qs);
  }
});

test('Gọi lặp -> 429', async () => {
  let last;
  for (let i = 0; i < 9; i++) last = await get('?area=10', '10.0.0.3');
  assert.equal(last.status, 429);
});

test('HEAD -> 200 không có body (cho trình xem trước link)', async () => {
  const r = await get('?area=60&beds=2&baths=2&tier=standard&style=modern', '10.0.0.4', 'HEAD');
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'application/pdf');
});

test('POST không khoá vẫn 401 như cũ', async () => {
  const r = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 401);
});
