import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, BarChart3, Database, Download, FileSpreadsheet, History, Search, Trash2, Upload } from 'lucide-react';
import { readExcelFile, exportRowsToExcel } from '../../utils/excelIO';
import { fmt } from '../construction/types';

type PriceStatus = 'ok' | 'up' | 'down' | 'new' | 'missing';

interface PriceItem {
  id: string;
  batchId: string;
  importedAt: string;
  supplier: string;
  quoteCode: string;
  validUntil: string;
  itemCode: string;
  itemName: string;
  standardName: string;
  spec: string;
  brand: string;
  unit: string;
  unitPrice: number;
  vat: number;
  deliveryTerm: string;
  note: string;
}

interface PriceBatch {
  id: string;
  name: string;
  supplier: string;
  quoteCode: string;
  importedAt: string;
  validUntil: string;
  itemCount: number;
}

interface PreviewItem extends Omit<PriceItem, 'id' | 'batchId' | 'importedAt'> {
  sourceRow: number;
  status: PriceStatus;
  previousPrice: number;
  diff: number;
  diffPercent: number;
  warning: string;
}

const STORAGE_KEY = 'dqh.pricebook.v1';
const todayStr = () => new Date().toISOString().slice(0, 10);

const normalizeKey = (value: unknown) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/đ/g, 'd')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const pickCell = (row: Record<string, any>, keys: string[]) => {
  const entries = Object.entries(row);
  for (const key of keys) {
    const found = entries.find(([header]) => normalizeKey(header) === normalizeKey(key));
    if (found && String(found[1] ?? '').trim() !== '') return found[1];
  }
  return '';
};

const parseMoney = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const raw = String(value ?? '').trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.abs(n) : 0;
};

const parseDateValue = (value: unknown) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelDate = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (!Number.isNaN(excelDate.getTime())) return excelDate.toISOString().slice(0, 10);
  }
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const m = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (!m) return raw;
  const year = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
};

const itemMatchKey = (item: Pick<PriceItem, 'itemCode' | 'standardName' | 'itemName' | 'spec' | 'unit'>) =>
  [
    normalizeKey(item.itemCode),
    normalizeKey(item.standardName || item.itemName),
    normalizeKey(item.spec),
    normalizeKey(item.unit),
  ].filter(Boolean).join('|');

const loadStore = (): { batches: PriceBatch[]; items: PriceItem[] } => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { batches: parsed.batches || [], items: parsed.items || [] };
  } catch {
    return { batches: [], items: [] };
  }
};

const saveStore = (batches: PriceBatch[], items: PriceItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ batches, items }));
};

export default function PriceBook() {
  const initial = useMemo(loadStore, []);
  const [batches, setBatches] = useState<PriceBatch[]>(initial.batches);
  const [items, setItems] = useState<PriceItem[]>(initial.items);
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [supplier, setSupplier] = useState('');
  const [quoteCode, setQuoteCode] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [batchName, setBatchName] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PriceStatus | ''>('');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const latestByKey = useMemo(() => {
    const map = new Map<string, PriceItem>();
    [...items]
      .sort((a, b) => b.importedAt.localeCompare(a.importedAt))
      .forEach(item => {
        const key = itemMatchKey(item);
        if (key && !map.has(key)) map.set(key, item);
      });
    return map;
  }, [items]);

  const filteredPreview = preview.filter(item =>
    (!statusFilter || item.status === statusFilter) &&
    (!search || [item.itemCode, item.itemName, item.standardName, item.spec, item.brand, item.supplier].some(v => normalizeKey(v).includes(normalizeKey(search))))
  );

  const latestItems = useMemo(() => Array.from(latestByKey.values()), [latestByKey]);
  const filteredLatest = latestItems.filter(item =>
    !search || [item.itemCode, item.itemName, item.standardName, item.spec, item.brand, item.supplier].some(v => normalizeKey(v).includes(normalizeKey(search)))
  );

  const statusCount = preview.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<PriceStatus, number>);

  const parseRows = (rows: Record<string, any>[]) => rows.map((row, index): PreviewItem => {
    const itemName = String(pickCell(row, ['Tên vật tư', 'Tên hàng', 'Hạng mục', 'Item name', 'Tên']) || '').trim();
    const standardName = String(pickCell(row, ['Tên chuẩn', 'Tên vật tư chuẩn', 'Standard name']) || itemName).trim();
    const item: Omit<PriceItem, 'id' | 'batchId' | 'importedAt'> = {
      supplier: String(pickCell(row, ['Nhà cung cấp', 'NCC', 'Supplier']) || supplier).trim(),
      quoteCode: String(pickCell(row, ['Mã báo giá', 'Số báo giá', 'Quote code']) || quoteCode).trim(),
      validUntil: parseDateValue(pickCell(row, ['Hiệu lực đến', 'Valid until', 'Hạn báo giá']) || validUntil),
      itemCode: String(pickCell(row, ['Mã vật tư', 'Mã hàng', 'Item code', 'SKU']) || '').trim(),
      itemName,
      standardName,
      spec: String(pickCell(row, ['Quy cách', 'Thông số', 'Spec', 'Mô tả']) || '').trim(),
      brand: String(pickCell(row, ['Thương hiệu', 'Brand', 'Hãng']) || '').trim(),
      unit: String(pickCell(row, ['Đơn vị', 'ĐVT', 'Unit']) || '').trim(),
      unitPrice: parseMoney(pickCell(row, ['Đơn giá', 'Giá', 'Unit price', 'Price'])),
      vat: Number(pickCell(row, ['VAT', 'Thuế']) || 0) || 0,
      deliveryTerm: String(pickCell(row, ['Điều kiện giao hàng', 'Giao hàng', 'Delivery']) || '').trim(),
      note: String(pickCell(row, ['Ghi chú', 'Note']) || '').trim(),
    };

    const prev = latestByKey.get(itemMatchKey(item));
    const diff = item.unitPrice - (prev?.unitPrice || 0);
    const diffPercent = prev?.unitPrice ? diff / prev.unitPrice : 0;
    const missing = !item.itemName || !item.unit || item.unitPrice <= 0;
    let status: PriceStatus = prev ? 'ok' : 'new';
    if (missing) status = 'missing';
    else if (prev && Math.abs(diffPercent) >= 0.03) status = diff > 0 ? 'up' : 'down';

    return {
      ...item,
      sourceRow: index + 2,
      status,
      previousPrice: prev?.unitPrice || 0,
      diff,
      diffPercent,
      warning: missing ? 'Thiếu tên vật tư, đơn vị hoặc đơn giá.' : '',
    };
  });

  const handleImportFile = async (file: File) => {
    const rows = await readExcelFile(file);
    const parsed = parseRows(rows);
    setPreview(parsed);
    setBatchName(batchName || file.name.replace(/\.[^.]+$/, ''));
    setMessage(`Đã đọc ${parsed.length} dòng. Kiểm tra preview trước khi lưu vào kho giá.`);
  };

  const savePreview = () => {
    const valid = preview.filter(item => item.status !== 'missing');
    if (valid.length === 0) return;
    const batchId = crypto.randomUUID();
    const importedAt = new Date().toISOString();
    const newBatch: PriceBatch = {
      id: batchId,
      name: batchName.trim() || `Báo giá ${todayStr()}`,
      supplier: supplier.trim() || valid[0]?.supplier || '',
      quoteCode: quoteCode.trim() || valid[0]?.quoteCode || '',
      importedAt,
      validUntil: validUntil || valid[0]?.validUntil || '',
      itemCount: valid.length,
    };
    const newItems: PriceItem[] = valid.map(item => ({
      ...item,
      id: crypto.randomUUID(),
      batchId,
      importedAt,
      supplier: item.supplier || newBatch.supplier,
      quoteCode: item.quoteCode || newBatch.quoteCode,
      validUntil: item.validUntil || newBatch.validUntil,
    }));
    const nextBatches = [newBatch, ...batches];
    const nextItems = [...newItems, ...items];
    setBatches(nextBatches);
    setItems(nextItems);
    saveStore(nextBatches, nextItems);
    setPreview([]);
    setMessage(`Đã lưu ${newItems.length} dòng vào kho giá.`);
  };

  const deleteBatch = (batchId: string) => {
    if (!confirm('Xóa bộ báo giá này khỏi kho giá?')) return;
    const nextBatches = batches.filter(b => b.id !== batchId);
    const nextItems = items.filter(i => i.batchId !== batchId);
    setBatches(nextBatches);
    setItems(nextItems);
    saveStore(nextBatches, nextItems);
  };

  const exportTemplate = () => exportRowsToExcel([{
    'Nhà cung cấp': supplier || 'Tên NCC',
    'Mã báo giá': quoteCode || 'BG-001',
    'Hiệu lực đến': validUntil || todayStr(),
    'Mã vật tư': 'VT-001',
    'Tên vật tư': 'Gạch 600x600',
    'Tên chuẩn': 'Gạch lát nền 600x600',
    'Quy cách': 'Porcelain, chống trượt',
    'Thương hiệu': 'Prime',
    'Đơn vị': 'm2',
    'Đơn giá': 250000,
    'VAT': 8,
    'Điều kiện giao hàng': 'Giao tại công trình',
    'Ghi chú': '',
  }], 'Mau_kho_gia_NCC.xlsx', 'Mau gia');

  const exportLatest = () => exportRowsToExcel(filteredLatest.map(item => ({
    'Nhà cung cấp': item.supplier,
    'Mã báo giá': item.quoteCode,
    'Ngày nhập': item.importedAt.slice(0, 10),
    'Hiệu lực đến': item.validUntil,
    'Mã vật tư': item.itemCode,
    'Tên vật tư': item.itemName,
    'Tên chuẩn': item.standardName,
    'Quy cách': item.spec,
    'Thương hiệu': item.brand,
    'Đơn vị': item.unit,
    'Đơn giá': item.unitPrice,
    'VAT': item.vat,
    'Điều kiện giao hàng': item.deliveryTerm,
    'Ghi chú': item.note,
  })), `Kho_gia_moi_nhat_${todayStr()}.xlsx`, 'Kho gia');

  const exportPreview = () => exportRowsToExcel(filteredPreview.map(item => ({
    'Trạng thái': statusLabel(item.status),
    'Nhà cung cấp': item.supplier,
    'Mã báo giá': item.quoteCode,
    'Mã vật tư': item.itemCode,
    'Tên vật tư': item.itemName,
    'Tên chuẩn': item.standardName,
    'Quy cách': item.spec,
    'Đơn vị': item.unit,
    'Giá mới': item.unitPrice,
    'Giá trước': item.previousPrice,
    'Chênh lệch': item.diff,
    '% lệch': item.diffPercent,
    'Ghi chú': item.warning || item.note,
  })), `So_sanh_gia_${todayStr()}.xlsx`, 'So sanh');

  return (
    <div className="p-4 sm:p-6 max-w-[1500px] mx-auto w-full space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" /> Kho giá NCC
          </h1>
          <p className="text-xs text-slate-500 mt-1">Import báo giá, lưu lịch sử và so sánh giá mới với giá đã có.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={exportTemplate} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Mẫu Excel</button>
          <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Import giá</button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = ''; }} />
          <button onClick={exportLatest} disabled={filteredLatest.length === 0} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40"><FileSpreadsheet className="w-3.5 h-3.5" /> Xuất kho</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Summary label="Bộ báo giá" value={String(batches.length)} />
        <Summary label="Dòng lịch sử" value={String(items.length)} />
        <Summary label="Mã giá mới nhất" value={String(latestItems.length)} />
        <Summary label="Dòng preview" value={String(preview.length)} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input value={batchName} onChange={e => setBatchName(e.target.value)} placeholder="Tên bộ báo giá" className="px-3 py-2 border border-slate-200 rounded-lg text-xs" />
          <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Nhà cung cấp mặc định" className="px-3 py-2 border border-slate-200 rounded-lg text-xs" />
          <input value={quoteCode} onChange={e => setQuoteCode(e.target.value)} placeholder="Mã báo giá" className="px-3 py-2 border border-slate-200 rounded-lg text-xs" />
          <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-xs" />
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm vật tư/NCC..." className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
          </div>
        </div>
        {message && <p className="text-xs text-slate-500 mt-2">{message}</p>}
      </div>

      {preview.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {(['new', 'up', 'down', 'ok', 'missing'] as PriceStatus[]).map(status => (
              <button key={status} onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                className={`text-left rounded-xl border p-3 ${statusFilter === status ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                <p className={`text-[10px] font-bold uppercase ${statusTone(status)}`}>{statusLabel(status)}</p>
                <p className="text-lg font-bold text-slate-800 mt-1">{statusCount[status] || 0}</p>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-500" /> Preview so sánh</h2>
            <div className="flex items-center gap-2">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as PriceStatus | '')} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
                <option value="">Tất cả trạng thái</option>
                {(['new', 'up', 'down', 'ok', 'missing'] as PriceStatus[]).map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
              <button onClick={exportPreview} className="px-3 py-2 bg-white border border-slate-200 text-xs font-bold rounded-lg">Xuất so sánh</button>
              <button onClick={savePreview} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg">Lưu vào kho</button>
            </div>
          </div>
          <PriceTable rows={filteredPreview} />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2"><History className="w-4 h-4 text-indigo-500" /> Giá mới nhất trong kho</h2>
          <LatestTable rows={filteredLatest} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Lịch sử import</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
            {batches.map(batch => (
              <div key={batch.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{batch.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{batch.supplier || '--'} • {batch.itemCount} dòng</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(batch.importedAt).toLocaleString('vi-VN')} {batch.quoteCode ? `• ${batch.quoteCode}` : ''}</p>
                  </div>
                  <button onClick={() => deleteBatch(batch.id)} className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {batches.length === 0 && <p className="text-xs text-slate-400 text-center py-8">Chưa có bộ báo giá nào.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-slate-800 mt-1">{value}</p>
    </div>
  );
}

function statusLabel(status: PriceStatus) {
  return ({ ok: 'Ổn định', up: 'Tăng giá', down: 'Giảm giá', new: 'Mới', missing: 'Thiếu dữ liệu' } as Record<PriceStatus, string>)[status];
}

function statusTone(status: PriceStatus) {
  return ({ ok: 'text-emerald-700', up: 'text-rose-700', down: 'text-sky-700', new: 'text-indigo-700', missing: 'text-amber-700' } as Record<PriceStatus, string>)[status];
}

function statusBadge(status: PriceStatus) {
  return ({ ok: 'bg-emerald-50 text-emerald-700', up: 'bg-rose-50 text-rose-700', down: 'bg-sky-50 text-sky-700', new: 'bg-indigo-50 text-indigo-700', missing: 'bg-amber-50 text-amber-700' } as Record<PriceStatus, string>)[status];
}

function PriceTable({ rows }: { rows: PreviewItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
          <tr>
            <th className="text-left px-3 py-2.5 font-bold">Trạng thái</th>
            <th className="text-left px-3 py-2.5 font-bold">Vật tư</th>
            <th className="text-left px-3 py-2.5 font-bold">NCC</th>
            <th className="text-right px-3 py-2.5 font-bold">Giá mới</th>
            <th className="text-right px-3 py-2.5 font-bold">Giá trước</th>
            <th className="text-right px-3 py-2.5 font-bold">Lệch</th>
            <th className="text-left px-3 py-2.5 font-bold">Ghi chú</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(row => (
            <tr key={`${row.sourceRow}-${row.itemName}`} className="hover:bg-slate-50">
              <td className="px-3 py-2.5 whitespace-nowrap"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${statusBadge(row.status)}`}>{statusLabel(row.status)}</span></td>
              <td className="px-3 py-2.5 min-w-[260px]">
                <p className="font-bold text-slate-800">{row.standardName || row.itemName}</p>
                <p className="text-[10px] text-slate-400">{row.itemCode || '--'} • {row.spec || '--'} • {row.unit || '--'}</p>
              </td>
              <td className="px-3 py-2.5 text-slate-500">{row.supplier || '--'}</td>
              <td className="px-3 py-2.5 text-right font-bold">{fmt(row.unitPrice)}</td>
              <td className="px-3 py-2.5 text-right text-slate-500">{row.previousPrice ? fmt(row.previousPrice) : '--'}</td>
              <td className={`px-3 py-2.5 text-right font-bold ${row.diff > 0 ? 'text-rose-600' : row.diff < 0 ? 'text-sky-600' : 'text-slate-500'}`}>
                {row.previousPrice ? `${row.diff > 0 ? '+' : ''}${fmt(row.diff)} (${(row.diffPercent * 100).toFixed(1)}%)` : '--'}
              </td>
              <td className="px-3 py-2.5 text-slate-500 min-w-[180px]">{row.warning || row.note || '--'}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400 py-8">Chưa có dữ liệu preview.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function LatestTable({ rows }: { rows: PriceItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
          <tr>
            <th className="text-left px-3 py-2.5 font-bold">Vật tư</th>
            <th className="text-left px-3 py-2.5 font-bold">NCC</th>
            <th className="text-right px-3 py-2.5 font-bold">Đơn giá</th>
            <th className="text-left px-3 py-2.5 font-bold">Ngày nhập</th>
            <th className="text-left px-3 py-2.5 font-bold">Hiệu lực</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(row => (
            <tr key={row.id} className="hover:bg-slate-50">
              <td className="px-3 py-2.5 min-w-[260px]">
                <p className="font-bold text-slate-800">{row.standardName || row.itemName}</p>
                <p className="text-[10px] text-slate-400">{row.itemCode || '--'} • {row.spec || '--'} • {row.unit || '--'}</p>
              </td>
              <td className="px-3 py-2.5 text-slate-500">{row.supplier || '--'}</td>
              <td className="px-3 py-2.5 text-right font-bold text-slate-800">{fmt(row.unitPrice)}</td>
              <td className="px-3 py-2.5 text-slate-500">{row.importedAt.slice(0, 10)}</td>
              <td className="px-3 py-2.5 text-slate-500">{row.validUntil || '--'}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center text-slate-400 py-10">
                <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-slate-300" />
                Chưa có dữ liệu kho giá.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
