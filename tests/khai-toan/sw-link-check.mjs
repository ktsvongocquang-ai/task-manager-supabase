// Tái hiện lỗi "bấm link PDF lại mở ra app": vào web trước để cài service worker (PWA),
// rồi mở link PDF trong cùng trình duyệt. Chạy: node tests/khai-toan/sw-link-check.mjs [base-url]
import puppeteer from 'puppeteer';
const base = (process.argv[2] || 'https://dqh.vercel.app').replace(/\/$/, '');
const link = `${base}/api/khai-toan/khai-toan-60m2.pdf?area=60&beds=2&baths=2&tier=standard&style=modern&ac=ducted`;
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
const go = (u) => page.goto(u, { waitUntil: 'networkidle0' }).catch(() => null);
await go(base + '/login');
await page.waitForFunction(() => navigator.serviceWorker.controller || navigator.serviceWorker.ready.then(r => !!r.active), { timeout: 20000 }).catch(() => {});
await go(base + '/login'); // tải lại để SW nắm quyền điều khiển trang
const info = await page.evaluate(async () => ({
  controlled: !!navigator.serviceWorker.controller,
  denylist: await fetch('/sw.js').then(r => r.text()).then(t => (t.match(/denylist:\[[^\]]*\]/) || ['(không thấy)'])[0]),
}));
console.log('Trang có service worker điều khiển:', info.controlled, '| denylist:', info.denylist);

for (let i = 1; i <= 2; i++) {
  let main = null;
  const onResp = r => { if (r.url().startsWith(link.split('?')[0]) && r.request().isNavigationRequest()) main = r; };
  page.on('response', onResp);
  await page.goto(link, { waitUntil: 'load', timeout: 20000 }).catch(() => {}); // PDF có thể bị coi là "tải về" -> ERR_ABORTED, vẫn đọc được response
  page.off('response', onResp);
  const appShown = await page.evaluate(() => !!document.querySelector('#root')).catch(() => false);
  console.log(`Lần ${i}: ${main ? `status=${main.status()} content-type=${main.headers()['content-type']} fromServiceWorker=${main.fromServiceWorker()}` : 'không bắt được response'} | hiện app React: ${appShown}`);
}
await browser.close();
