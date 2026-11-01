// Kiểm GET công khai trên một URL deploy thật. Chạy: node tests/khai-toan/remote-get-check.mjs <base-url> [out-dir]
import fs from 'node:fs';
const base = (process.argv[2] || 'https://dqh.vercel.app').replace(/\/$/, '');
const outDir = process.argv[3];
const QS = 'area=60&beds=2&baths=2&tier=standard&style=modern&ac=ducted&smarthome=standard&freshAir=false';
const show = (label, r, ms) => console.log(`${label}: ${r.status} ${r.headers.get('content-type')} | ${r.headers.get('content-disposition') || ''} | x-vercel-cache=${r.headers.get('x-vercel-cache')} | total=${r.headers.get('x-khai-toan-total')} | ${ms}ms`);
async function hit(label, url, init = {}) {
  const t0 = Date.now();
  const r = await fetch(url, init);
  const buf = Buffer.from(await r.arrayBuffer());
  show(label, r, Date.now() - t0);
  return { r, buf };
}
const a = await hit('GET lần 1 (render)', `${base}/api/khai-toan/pdf?${QS}`);
if (outDir) fs.writeFileSync(`${outDir}/prod-get-60m2.pdf`, a.buf);
await hit('GET lần 2 (cùng URL)', `${base}/api/khai-toan/pdf?${QS}`);
await hit('Đuôi .pdf', `${base}/api/khai-toan/khai-toan-60m2.pdf?${QS}`);
await hit('UA Zalo in-app', `${base}/api/khai-toan/khai-toan-60m2.pdf?${QS}&zarsrc=31`, { headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo iOS/24.1.1 ZaloTheme/light ZaloLanguage/vn' } });
await hit('UA Messenger in-app + fbclid', `${base}/api/khai-toan/khai-toan-60m2.pdf?${QS}&fbclid=IwAR0abc`, { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36 [FB_IAB/MESSENGER;FBAV/440.0.0.0;]' } });
await hit('Facebook link preview bot', `${base}/api/khai-toan/khai-toan-60m2.pdf?${QS}`, { headers: { 'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' } });
await hit('HEAD', `${base}/api/khai-toan/pdf?${QS}`, { method: 'HEAD' });
const bad = await hit('area=10', `${base}/api/khai-toan/pdf?area=10&beds=2&baths=2&tier=standard&style=modern`);
console.log('   body:', bad.buf.toString());
let codes = [];
for (let i = 0; i < 15; i++) codes.push((await fetch(`${base}/api/khai-toan/pdf?area=10&i=${i}`)).status);
console.log('15 lần gọi lặp (không cache được):', codes.join(','));
