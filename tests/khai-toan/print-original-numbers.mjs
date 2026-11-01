// In ra số liệu app.js GỐC trên Chromium thật cho từng cấu hình (dùng để điền cases.mjs).
import { launch, runInPage, ORIGINAL_URL } from './browser-helpers.mjs';
import { CASES } from './cases.mjs';

const browser = await launch();
const page = await browser.newPage();
await page.goto(ORIGINAL_URL, { waitUntil: 'load' });
for (const c of CASES) {
  const r = await runInPage(page, c.input);
  const total = Number(r.grandTotal.replace(/\D/g, ''));
  console.log(JSON.stringify({ name: c.name, total, workDays: Number(r.scheduleWork), shown: r.grandTotal, days: r.workDays }));
}
await browser.close();
