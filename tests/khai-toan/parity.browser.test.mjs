// So khớp trên Chromium thật: app.js GỐC vs app.js mới (dùng calc.js) vs calc.js chạy trong Node.
// Chạy: node --test tests/khai-toan/parity.browser.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import '../../public/khai-toan/calc.js';
import { launch, runInPage, ORIGINAL_URL, CURRENT_URL } from './browser-helpers.mjs';
import { CASES } from './cases.mjs';

const K = globalThis.KhaiToanCalc;
let browser, orig, cur;

before(async () => {
  browser = await launch();
  orig = await browser.newPage();
  cur = await browser.newPage();
  const errors = [];
  cur.on('pageerror', e => errors.push(e.message));
  await orig.goto(ORIGINAL_URL, { waitUntil: 'load' });
  await cur.goto(CURRENT_URL, { waitUntil: 'load' });
  assert.deepEqual(errors, [], 'trang mới không được có lỗi JS');
});
after(async () => { await browser?.close(); });

for (const c of CASES) {
  test('Khớp tuyệt đối: ' + c.name, async () => {
    const a = await runInPage(orig, c.input);
    const b = await runInPage(cur, c.input);
    // 1) Giao diện mới hiển thị y hệt bản gốc (tổng, ngày, từng dòng hạng mục, tiến độ)
    assert.deepEqual(b, a);
    // 2) calc.js trong Node ra đúng số bản gốc hiển thị: sai lệch = 0
    const r = K.calculate(c.input);
    assert.equal(K.money(r.total), a.grandTotal);
    assert.equal(r.schedule.workDays + ' ngày', a.workDays);
    assert.equal(String(r.schedule.calendarDays), a.scheduleCalendar);
    assert.equal(K.dateText(r.schedule.end), a.handoverDate);
    assert.equal(r.total, c.expect.total);
    assert.equal(r.schedule.workDays, c.expect.workDays);
  });
}

test('?cfg=<base64> mở sẵn cấu hình', async () => {
  const c = CASES[3];
  const v = K.validateRequest({ ...c.input }).value;
  const page = await browser.newPage();
  await page.goto(CURRENT_URL + '?cfg=' + K.encodeCfg(v), { waitUntil: 'load' });
  const shown = await page.$eval('#grandTotal', el => el.textContent);
  assert.equal(shown, K.money(c.expect.total));
  await page.close();
});

test('Nút Xuất PDF dùng mẫu in chung (iframe) không lỗi', async () => {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(CURRENT_URL, { waitUntil: 'load' });
  // Chặn hộp thoại in để kiểm thử tự động
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await page.click('#printBtn');
  const info = await page.waitForFunction(() => {
    const f = document.querySelector('iframe[aria-hidden="true"]');
    return f && f.contentDocument && f.contentDocument.querySelector('h1') ? f.contentDocument.body.innerText : false;
  }, { timeout: 5000 });
  const text = await info.jsonValue();
  assert.match(text, /KHÁI TOÁN NỘI THẤT/);
  assert.match(text, /Khái toán sơ bộ, chỉ mang tính tham khảo/);
  assert.equal(await page.evaluate(() => window.__printed), 0, 'không được rơi về window.print() của trang chính');
  assert.deepEqual(errors, []);
  await page.close();
});
