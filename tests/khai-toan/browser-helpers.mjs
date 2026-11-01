// Tiện ích điều khiển trang Khái toán trong Chromium thật (puppeteer, devDependency).
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const ORIGINAL_URL = pathToFileURL(path.join(ROOT, 'tests/khai-toan/fixtures/original.html')).href;
export const CURRENT_URL = pathToFileURL(path.join(ROOT, 'public/khai-toan/index.html')).href;

export function launch() {
  return puppeteer.launch({ headless: true, args: ['--no-sandbox', '--allow-file-access-from-files'] });
}

// Điền form theo đầu vào chuẩn rồi đọc toàn bộ phần kết quả hiển thị.
export async function runInPage(page, input) {
  return page.evaluate((inp) => {
    const form = document.querySelector('#estimateForm');
    const setVal = (sel, v) => { const el = document.querySelector(sel); el.value = String(v); };
    setVal('#area', inp.area); setVal('#bedCount', inp.beds); setVal('#bathCount', inp.baths); setVal('#startDate', inp.startDate);
    const radio = (name, v) => { const el = form.querySelector(`input[name="${name}"][value="${v}"]`); if (!el) throw new Error('no radio ' + name + '=' + v); el.checked = true; };
    radio('tier', inp.tier); radio('style', inp.style);
    const DEFAULT = {
      demolition: true, demoLevel: 100, wcRenovation: true, ceiling: true, painting: true,
      staircase: 'none', flooring: 'standard', floorMaterial: 'wood', lighting: 'luxury', electrical: 'full_mod', smarthome: 'none',
      wood: 'melamine_standard', loose: 'standard', stone: 'standard_stone', appliances: 'basic', wcEquipment: 'none',
      curtain: 'normal', ac: 'none', speaker: 'none', freshAir: false, epoxyGrout: false,
    };
    const scope = Object.assign({}, DEFAULT, inp.scope);
    for (const [k, v] of Object.entries(scope)) {
      if (typeof v === 'boolean') { document.getElementById(k).checked = v; continue; }
      const sel = form.querySelector(`select[name="${k}"]`);
      if (sel) sel.value = String(v); else radio(k, v);
    }
    form.dispatchEvent(new Event('change', { bubbles: true }));
    const txt = s => document.querySelector(s).textContent;
    return {
      grandTotal: txt('#grandTotal'), grandTotalBottom: txt('#grandTotalBottom'), rateBadge: txt('#rateBadge'),
      summaryMeta: txt('#summaryMeta'), workDays: txt('#workDays'), handoverDate: txt('#handoverDate'), itemCount: txt('#itemCount'),
      scheduleWork: txt('#scheduleWork'), scheduleCalendar: txt('#scheduleCalendar'),
      breakdown: document.querySelector('#breakdown').innerHTML, timeline: document.querySelector('#timeline').innerHTML,
    };
  }, input);
}
