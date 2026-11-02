// Đồng bộ Google Sheets kế toán -> app (chỉ đọc từ Sheets, kế toán vẫn nhập ở Sheets như cũ).
// Nguồn đọc, theo thứ tự:
//   1. GAS_SYNC_URL: Web App Google Apps Script sẵn có của DQH (?action=read&sheetId=…) trả { success, data: { <tab>: [[…], …] } }
//   2. Sheet chia sẻ "bất kỳ ai có link": tải CSV tab đầu.
// Mỗi dòng có ngày + số tiền được lưu 1 lần vào accounting_entries (khoá theo mã băm nội dung dòng), chạy lại không nhân đôi.
import crypto from 'node:crypto';
import { db, check, CoreError } from './db.js';
import { fold } from './text.js';

export function sheetIdOf(urlOrId) {
  const s = String(urlOrId || '').trim();
  const m = s.match(/\/d\/([a-zA-Z0-9-_]{20,})/);
  return m ? m[1] : (/^[a-zA-Z0-9-_]{20,}$/.test(s) ? s : null);
}

/** "1.250.000", "1,250,000", "(500.000)", "-2.5tr", 1250000 -> số */
export function parseAmount(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  let s = String(v ?? '').trim().toLowerCase();
  if (!s) return null;
  const neg = /^\(.*\)$/.test(s) || s.startsWith('-');
  let mult = 1;
  if (/(tr|triệu|trieu)\s*$/.test(s)) { mult = 1e6; s = s.replace(/(tr|triệu|trieu)\s*$/, ''); }
  else if (/(k|nghìn|ngàn)\s*$/.test(s)) { mult = 1e3; s = s.replace(/(k|nghìn|ngàn)\s*$/, ''); }
  s = s.replace(/[()\s₫đvndVND-]/gi, '');
  if (mult > 1) s = s.replace(',', '.');
  else s = s.replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) && s !== '' ? (neg ? -1 : 1) * n * mult : null;
}

/** dd/mm/yyyy, d/m/yy, yyyy-mm-dd, số ngày kiểu Excel/Sheets -> YYYY-MM-DD */
export function parseDate(v) {
  if (typeof v === 'number' && v > 20000 && v < 80000) return new Date(Date.UTC(1899, 11, 30) + v * 864e5).toISOString().slice(0, 10);
  const s = String(v ?? '').trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
  const t = Date.parse(s);
  return Number.isFinite(t) && /\d{4}/.test(s) ? new Date(t + 7 * 3600_000).toISOString().slice(0, 10) : null;
}

const H = {
  date: /^(ngay|ngay chi|ngay thu|ngay ct|ngay chung tu|date)$/,
  desc: /(noi dung|dien giai|mo ta|ten hang|hang muc|description)/,
  amount: /^(so tien|thanh tien|gia tri|tong tien|amount|tien)$/,
  thu: /^(thu|tien thu|so tien thu)$/,
  chi: /^(chi|tien chi|so tien chi)$/,
  kind: /^(loai|thu\/chi|thu chi|phan loai)$/,
  category: /(nhom|danh muc|khoan muc|hang muc chi|category)/,
  party: /(ncc|nha cung cap|doi tuong|nguoi nhan|to doi)/,
};

/** Tìm dòng tiêu đề trong 15 dòng đầu, trả chỉ số cột. */
export function detectColumns(rows) {
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const cells = (rows[r] || []).map(c => fold(c));
    const find = re => cells.findIndex(c => re.test(c));
    const cols = { date: find(H.date), desc: find(H.desc), amount: find(H.amount), thu: find(H.thu), chi: find(H.chi), kind: find(H.kind), category: find(H.category), party: find(H.party) };
    if (cols.date >= 0 && (cols.amount >= 0 || cols.thu >= 0 || cols.chi >= 0)) return { headerRow: r, cols };
  }
  return null;
}

/** Bảng 2 chiều -> các dòng thu/chi chuẩn. */
export function parseLedger(rows, tab = '') {
  const found = detectColumns(rows);
  if (!found) return [];
  const { headerRow, cols } = found;
  const out = [];
  for (const row of rows.slice(headerRow + 1)) {
    const date = cols.date >= 0 ? parseDate(row[cols.date]) : null;
    if (!date) continue;
    const pick = i => (i >= 0 ? String(row[i] ?? '').trim() : '');
    const entries = [];
    if (cols.thu >= 0 || cols.chi >= 0) {
      const thu = cols.thu >= 0 ? parseAmount(row[cols.thu]) : null;
      const chi = cols.chi >= 0 ? parseAmount(row[cols.chi]) : null;
      if (thu) entries.push({ kind: 'thu', amount: Math.abs(thu) });
      if (chi) entries.push({ kind: 'chi', amount: Math.abs(chi) });
    } else {
      const a = parseAmount(row[cols.amount]);
      if (!a) continue;
      const k = fold(pick(cols.kind));
      entries.push({ kind: k.startsWith('thu') ? 'thu' : 'chi', amount: Math.abs(a) });
    }
    for (const e of entries) {
      const description = pick(cols.desc), category = pick(cols.category), party = pick(cols.party);
      const row_hash = crypto.createHash('sha1').update(JSON.stringify([tab, date, e.kind, e.amount, description, category, party])).digest('hex');
      out.push({ entry_date: date, kind: e.kind, amount: e.amount, description: description || null, category: category || null, party: party || null, sheet_tab: tab || null, row_hash });
    }
  }
  return out;
}

async function readSheet(sheetId) {
  const gas = process.env.GAS_SYNC_URL;
  if (gas) {
    const r = await fetch(`${gas}?action=read&sheetId=${encodeURIComponent(sheetId)}`);
    const j = await r.json().catch(() => ({}));
    if (!j.success) throw new CoreError(502, 'Apps Script không đọc được sheet', j.error || r.status);
    return Object.entries(j.data || {}); // [[tab, rows]]
  }
  const r = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`, { redirect: 'follow' });
  const text = await r.text();
  if (!r.ok || /<html/i.test(text.slice(0, 200))) throw new CoreError(502, 'Sheet chưa chia sẻ "Bất kỳ ai có link" và chưa cấu hình GAS_SYNC_URL');
  return [['Sheet1', parseCsv(text)]];
}

export function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

/** Đồng bộ 1 hoặc mọi công trình có link sheet. Trả số dòng mới / đã có / lỗi theo công trình. */
export async function syncAccounting({ projectId } = {}) {
  let q = db().from('construction_projects').select('id, name, accounting_sheet_url, accounting_sheet_id');
  if (projectId) q = q.eq('id', projectId);
  const projects = (check(await q, 'đọc công trình') || []).filter(p => sheetIdOf(p.accounting_sheet_id || p.accounting_sheet_url));
  const result = [];
  for (const p of projects) {
    const sheetId = sheetIdOf(p.accounting_sheet_id || p.accounting_sheet_url);
    try {
      const tabs = await readSheet(sheetId);
      const entries = tabs.flatMap(([tab, rows]) => parseLedger(rows, tab)).map(e => ({ ...e, project_id: p.id, sheet_id: sheetId }));
      let added = 0;
      for (let i = 0; i < entries.length; i += 500) {
        const chunk = entries.slice(i, i + 500);
        const { data, error } = await db().from('accounting_entries').upsert(chunk, { onConflict: 'project_id,row_hash', ignoreDuplicates: true }).select('id');
        if (error) throw new CoreError(500, error.message);
        added += data?.length || 0;
      }
      result.push({ project: p.name, rows: entries.length, added });
    } catch (e) {
      result.push({ project: p.name, error: e.message });
    }
  }
  return { projects: result.length, result };
}

/** Tổng thu / chi của 1 công trình theo sheet kế toán. */
export async function accountingSummary(projectId) {
  const rows = check(await db().from('accounting_entries').select('kind, amount').eq('project_id', projectId), 'đọc sổ kế toán') || [];
  const sum = k => rows.filter(r => r.kind === k).reduce((s, r) => s + Number(r.amount || 0), 0);
  return { thu: sum('thu'), chi: sum('chi'), so_dong: rows.length };
}
