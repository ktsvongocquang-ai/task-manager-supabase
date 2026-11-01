// Đọc tổng tiền trên trang Khái toán THẬT (đã deploy) cho 1 cấu hình, để so với PDF.
// Chạy: node tests/khai-toan/live-page-total.mjs [base-url]
import { launch, runInPage } from './browser-helpers.mjs';
const base = (process.argv[2] || 'https://dqh.vercel.app').replace(/\/$/, '');
const browser = await launch();
const page = await browser.newPage();
await page.goto(`${base}/khai-toan/index.html`, { waitUntil: 'networkidle0' });
const r = await runInPage(page, { area: 60, beds: 2, baths: 2, tier: 'standard', style: 'modern', startDate: '2026-11-09', scope: { ac: 'ducted', smarthome: 'standard', freshAir: false } });
console.log('Trang Khái toán (60m², 2PN, 2WC, Tiêu chuẩn, Hiện đại, ĐH âm trần, smarthome cơ bản):', r.grandTotal, '|', r.itemCount, 'hạng mục');
await browser.close();
