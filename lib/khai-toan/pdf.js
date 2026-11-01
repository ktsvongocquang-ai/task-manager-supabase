// Tạo PDF khái toán phía máy chủ: render mẫu in dùng chung (public/khai-toan/print-template.js)
// bằng Chromium headless rồi page.pdf().
//  - Trên Vercel / Lambda: puppeteer-core + @sparticuz/chromium
//  - Máy local: Chrome của gói puppeteer (devDependency) hoặc biến CHROME_PATH
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
// Nạp 2 module UMD dùng chung (gắn vào globalThis). Import tĩnh để Vercel đóng gói kèm.
import '../../public/khai-toan/calc.js';
import '../../public/khai-toan/print-template.js';

export const calc = globalThis.KhaiToanCalc;
export const printTpl = globalThis.KhaiToanPrint;

// Thư mục của file này (phòng trường hợp công cụ đóng gói chuyển sang CommonJS làm mất import.meta).
let HERE = process.cwd();
try { HERE = path.dirname(fileURLToPath(import.meta.url)); } catch { /* dùng cwd */ }
const FONT_WEIGHTS = { Regular: 400, Medium: 500, SemiBold: 600, Bold: 700 };

// Tìm thư mục font (cạnh mã nguồn hoặc theo thư mục làm việc trên Vercel).
function fontDir() {
  const candidates = [
    path.join(HERE, '..', '..', 'public', 'khai-toan', 'fonts'),
    path.join(process.cwd(), 'public', 'khai-toan', 'fonts'),
  ];
  const found = candidates.find(d => fs.existsSync(path.join(d, 'BeVietnamPro-Regular.ttf')));
  if (!found) throw new Error('Không tìm thấy font Be Vietnam Pro');
  return found;
}

// CSS @font-face nhúng base64: PDF không phụ thuộc mạng, chắc chắn đủ dấu tiếng Việt.
let fontCssCache = null;
function embeddedFontCss() {
  if (fontCssCache) return fontCssCache;
  const dir = fontDir();
  fontCssCache = Object.entries(FONT_WEIGHTS).map(([name, weight]) => {
    const b64 = fs.readFileSync(path.join(dir, `BeVietnamPro-${name}.ttf`)).toString('base64');
    return `@font-face{font-family:'Be Vietnam Pro';font-style:normal;font-weight:${weight};src:url(data:font/ttf;base64,${b64}) format('truetype');font-display:block}`;
  }).join('');
  return fontCssCache;
}

const isServerless = () => !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

async function launchBrowser() {
  if (isServerless()) {
    const { default: chromium } = await import('@sparticuz/chromium');
    return puppeteer.launch({
      args: await puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' }),
      defaultViewport: { width: 1240, height: 1754, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    });
  }
  let executablePath = process.env.CHROME_PATH;
  if (!executablePath) {
    // Tên gói để trong biến để công cụ đóng gói của Vercel không kéo puppeteer (bản đầy đủ) vào hàm.
    const pkg = 'puppeteer';
    const full = await import(pkg);
    executablePath = full.default.executablePath();
  }
  return puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--font-render-hinting=none'] });
}

// Giữ trình duyệt giữa các lần gọi khi hàm còn "ấm" để giảm thời gian.
let browserPromise = null;
async function getBrowser() {
  if (browserPromise) {
    const b = await browserPromise.catch(() => null);
    if (b && b.connected) return b;
  }
  browserPromise = launchBrowser();
  return browserPromise;
}

/** Dựng HTML in từ đầu vào ĐÃ kiểm tra (kết quả validateRequest().value). */
export function buildEstimateHtml(input, { issuedAt = new Date() } = {}) {
  const result = calc.calculate(input);
  const html = printTpl.renderHtml(result, {
    clientName: input.clientName, phone: input.phone, showSchedule: input.showSchedule === true,
    issuedAt, fontCss: embeddedFontCss(),
  });
  return { html, result };
}

/** Trả về { pdf: Buffer, result } */
export async function renderEstimatePdf(input, opts = {}) {
  const { html, result } = buildEstimateHtml(input, opts);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    // Không cho trang tải tài nguyên ngoài (mọi thứ đã nhúng sẵn).
    await page.setRequestInterception(true);
    page.on('request', req => (req.url().startsWith('data:') || req.url() === 'about:blank' ? req.continue() : req.abort()));
    await page.setContent(html, { waitUntil: 'load', timeout: 8000 });
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, timeout: 8000 });
    return { pdf: Buffer.from(pdf), result };
  } finally {
    await page.close().catch(() => {});
  }
}

export async function closeBrowser() {
  if (!browserPromise) return;
  const b = await browserPromise.catch(() => null);
  browserPromise = null;
  if (b) await b.close().catch(() => {});
}
