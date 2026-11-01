// Kiểm tra nội dung một file PDF khái toán + chụp ảnh từng trang.
// Chạy: node tests/khai-toan/pdf-inspect.mjs <file.pdf> [--expect-total=725.400.000] [--no-schedule|--schedule] [--png-dir=dir]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const opt = k => (args.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const flag = k => args.includes('--' + k);

const data = new Uint8Array(fs.readFileSync(file));
const doc = await pdfjs.getDocument({ data, useSystemFonts: false }).promise;
const pages = [];
const fontSet = new Set();
for (let i = 1; i <= doc.numPages; i++) {
  const p = await doc.getPage(i);
  const tc = await p.getTextContent();
  pages.push(tc.items.map(x => x.str + (x.hasEOL ? '\n' : '')).join(''));
  // Lấy tên font thật được nhúng (qua danh sách lệnh vẽ của trang)
  const ops = await p.getOperatorList();
  ops.fnArray.forEach((fn, k) => {
    if (fn === pdfjs.OPS.setFont) {
      const id = ops.argsArray[k][0];
      try { const f = p.commonObjs.get(id); fontSet.add(f.name || f.loadedName); } catch {}
    }
  });
}
const all = pages.join('\n');
// Bản "phẳng" để so chữ: bỏ khoảng trắng, không phân biệt hoa thường
// (CSS letter-spacing / uppercase làm trình trích văn bản tách từng chữ).
const flat = s => s.normalize('NFC').toLocaleLowerCase('vi').replace(/\s+/g, '');
const allFlat = flat(all);
const has = s => allFlat.includes(flat(s));
const DISC = 'Khái toán sơ bộ, chỉ mang tính tham khảo. Báo giá chính xác theo khảo sát và bản vẽ thực tế.';
// Phần thân = bỏ các dòng chân trang bắt buộc
const body = all.split(DISC).join('');
const checks = [];
const check = (name, ok, extra = '') => checks.push({ name, ok: !!ok, extra });

const fonts = [...fontSet];
check('Số trang <= 2', doc.numPages <= 2, doc.numPages + ' trang');
check('Font nhúng là Be Vietnam Pro', fonts.length > 0 && fonts.every(f => /BeVietnamPro/.test(f)), fonts.join(', '));
check('Có tiêu đề KHÁI TOÁN NỘI THẤT', has('KHÁI TOÁN NỘI THẤT'));
check('Chân trang: câu miễn trừ', all.includes(DISC));
check('Chân trang: hotline', all.includes('0799 666 866'));
check('Chân trang: email', all.includes('dqh.architects@gmail.com'));
check('Chân trang: địa chỉ', all.includes('105-107 Trần Văn Dư, Phường 13, Tân Bình, TP.HCM'));
check('Không có ký tự lỗi (U+FFFD)', !all.includes('\uFFFD'));
const VI = ['Phòng vệ sinh', 'Đơn giá bình quân', 'Hoàn thiện sàn', 'Phân khúc vật tư', 'Ngày khởi công dự kiến', 'Diện tích thông thủy', 'Đồ gỗ liền tường'];
check('Tiếng Việt đủ dấu (' + VI.join(', ') + ')', VI.every(has), VI.filter(s => !has(s)).join(', '));
check('Không có trang trống', pages.every(t => flat(t.split(DISC).join('').replace(/DQH Architects · Hotline.*TP\.HCM/g, '').replace(/Trang \d\/\d/g, '')).length > 20));
check('Thân không có từ cấm (báo giá, cam kết, ưu đãi, giảm giá)', !/báo giá|cam kết|ưu đãi|giảm giá/i.test(body));
check('Không có dấu gạch ngang dài (em dash)', !all.includes('\u2014'));
if (opt('expect-total')) check('Đúng tổng tiền ' + opt('expect-total'), all.includes(opt('expect-total') + ' ₫') || all.includes(opt('expect-total') + '\u00a0₫'));
if (flag('no-schedule')) check('KHÔNG có phần tiến độ', !['Tiến độ dự kiến', 'ngày làm việc', 'Bàn giao dự kiến'].some(has));
if (flag('schedule')) check('CÓ phần tiến độ', has('Tiến độ dự kiến') && has('Bàn giao dự kiến'));

for (const c of checks) console.log((c.ok ? 'PASS ' : 'FAIL ') + c.name + (c.extra ? '  [' + c.extra + ']' : ''));
console.log('\n----- Văn bản trích từ PDF -----');
pages.forEach((t, i) => console.log(`\n=== Trang ${i + 1} ===\n` + t));

// Chụp ảnh từng trang bằng pdf.js trong Chromium (puppeteer, devDependency)
const pngDir = opt('png-dir');
if (pngDir) {
  fs.mkdirSync(pngDir, { recursive: true });
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    if (u === '/') { res.setHeader('Content-Type', 'text/html'); return res.end('<html><body style="margin:0"></body></html>'); }
    const f = u === '/doc.pdf' ? path.resolve(file) : path.join(ROOT, 'node_modules', u);
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end(); }
    res.setHeader('Content-Type', f.endsWith('.mjs') ? 'text/javascript' : 'application/pdf');
    fs.createReadStream(f).pipe(res);
  }).listen(0);
  const port = server.address().port;
  const { default: puppeteer } = await import('puppeteer');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1240, height: 1754 });
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'load' });
  const base = path.basename(file, '.pdf');
  for (let i = 1; i <= doc.numPages; i++) {
    const dataUrl = await page.evaluate(async (port, i) => {
      const lib = await import(`http://localhost:${port}/pdfjs-dist/build/pdf.mjs`);
      lib.GlobalWorkerOptions.workerSrc = `http://localhost:${port}/pdfjs-dist/build/pdf.worker.mjs`;
      const d = await lib.getDocument({ url: `http://localhost:${port}/doc.pdf` }).promise;
      const pg = await d.getPage(i);
      const vp = pg.getViewport({ scale: 2 });
      const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
      await pg.render({ canvas: c, canvasContext: c.getContext('2d'), viewport: vp }).promise;
      return c.toDataURL('image/png');
    }, port, i);
    const out = path.join(pngDir, `${base}-trang-${i}.png`);
    fs.writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log('Ảnh trang ' + i + ': ' + out);
  }
  await browser.close();
  server.close();
}
process.exitCode = checks.every(c => c.ok) ? 0 : 1;
