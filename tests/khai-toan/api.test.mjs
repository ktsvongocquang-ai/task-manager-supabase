// Kiểm thử API /api/khai-toan/pdf (chạy handler thật + Chromium local).
// Chạy: node --test tests/khai-toan/api.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';

process.env.KHAI_TOAN_API_KEY = 'unit-test-key';
process.env.KHAI_TOAN_RATE_LIMIT = '12';
const { default: handler } = await import('../../api/khai-toan/pdf.js');
const { closeBrowser } = await import('../../lib/khai-toan/pdf.js');

let server, url;
const body70 = fs.readFileSync(new URL('./fixtures/request-70m2.json', import.meta.url), 'utf8');
const post = (body, key = 'unit-test-key', extra = {}) => fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: 'Bearer ' + key } : {}), ...extra },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

before(async () => {
  server = http.createServer(handler);
  await new Promise(r => server.listen(0, r));
  url = `http://localhost:${server.address().port}/api/khai-toan/pdf`;
});
after(async () => { await closeBrowser(); server.close(); });

test('Thiếu khoá -> 401', async () => { assert.equal((await post(body70, null)).status, 401); });
test('Sai khoá -> 401', async () => { assert.equal((await post(body70, 'sai')).status, 401); });
test('GET -> 405', async () => { assert.equal((await fetch(url)).status, 405); });
test('area = 10 -> 400 kèm thông báo rõ', async () => {
  const r = await post({ area: 10, beds: 2, baths: 2, tier: 'standard', style: 'modern' });
  assert.equal(r.status, 400);
  const j = await r.json();
  assert.match(j.details.join(' '), /area phải là số từ 35 đến 350/);
});
test('Enum sai / JSON hỏng -> 400', async () => {
  assert.equal((await post({ area: 70, beds: 2, baths: 2, tier: 'vip', style: 'modern' })).status, 400);
  assert.equal((await post({ area: 70, beds: 2, baths: 2, tier: 'standard', style: 'modern', scope: { ac: 'split' } })).status, 400);
  assert.equal((await post('{khong phai json')).status, 400);
});
test('70m² 2PN 2WC Tiêu chuẩn -> PDF hợp lệ, đúng tổng, < 10 giây', async () => {
  const t0 = Date.now();
  const r = await post(body70);
  const ms = Date.now() - t0;
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'application/pdf');
  assert.equal(r.headers.get('x-khai-toan-total'), '725400000');
  const buf = Buffer.from(await r.arrayBuffer());
  assert.equal(buf.subarray(0, 5).toString(), '%PDF-');
  assert.ok(ms < 10000, 'mất ' + ms + 'ms');
  assert.doesNotMatch(r.headers.get('content-disposition'), /Hoa|0909/);
});
test('Giới hạn tần suất -> 429', async () => {
  let last;
  for (let i = 0; i < 12; i++) last = await post(body70, 'sai');
  assert.equal(last.status, 429);
});
