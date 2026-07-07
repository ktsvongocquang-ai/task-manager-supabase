import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Copy,
  Database,
  Download,
  FileSpreadsheet,
  FolderKanban,
  GitBranch,
  History,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { flattenPriceBook, getItemPrice, MARGIN_STRATEGIES, formatVND } from '../../constants/priceBook';
import { exportRowsToExcel, readExcelFile } from '../../utils/excelIO';

type QuoteTab = 'PROJECTS' | 'BOQ' | 'PRICEBOOK' | 'PRICING' | 'EXPORT';
type QuoteType = 'chung_cu' | 'nha_o' | 'shop';
type QuoteTier = 'basic' | 'premium' | 'luxury';
type QuoteSource = 'drawing' | 'ai' | 'supplier_quote' | 'manual';
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

interface PricePreviewItem extends Omit<PriceItem, 'id' | 'batchId' | 'importedAt'> {
  sourceRow: number;
  status: PriceStatus;
  previousPrice: number;
  diff: number;
  diffPercent: number;
  warning: string;
}

interface QuoteLine {
  id: string;
  category: string;
  itemCode: string;
  itemName: string;
  spec: string;
  unit: string;
  quantity: number;
  wasteFactor: number;
  source: QuoteSource;
  checked: boolean;
  selectedSupplier: string;
  selectedPrice: number;
  priceSource: 'ncc' | 'internal' | 'manual' | 'none';
  previousPrice: number;
  note: string;
}

interface QuoteVersion {
  id: string;
  versionNo: number;
  name: string;
  drawingVersion: string;
  createdAt: string;
  status: 'draft' | 'reviewed' | 'sent';
  lines: QuoteLine[];
}

interface QuoteProject {
  id: string;
  name: string;
  clientName: string;
  type: QuoteType;
  area: number;
  tier: QuoteTier;
  marginStrategy: keyof typeof MARGIN_STRATEGIES;
  isOutOfTown: boolean;
  activeVersionId: string;
  versions: QuoteVersion[];
}

const QUOTE_STORAGE_KEY = 'dqh.quote.system.v1';
const PRICE_STORAGE_KEY = 'dqh.pricebook.v1';
const todayStr = () => new Date().toISOString().slice(0, 10);
const FORM_INPUT ='w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300';
const TABLE_INPUT = 'px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300';

const normalizeKey = (value: unknown) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/đ/g, 'd')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const money = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const raw = String(value ?? '').trim();
  if (!raw) return 0;
  const n = Number(raw.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  return Number.isFinite(n) ? Math.abs(n) : 0;
};

const pickCell = (row: Record<string, any>, keys: string[]) => {
  const entries = Object.entries(row);
  for (const key of keys) {
    const found = entries.find(([header]) => normalizeKey(header) === normalizeKey(key));
    if (found && String(found[1] ?? '').trim() !== '') return found[1];
  }
  return '';
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

const matchKey = (line: Pick<QuoteLine, 'itemCode' | 'itemName' | 'spec' | 'unit'>) =>
  [normalizeKey(line.itemCode), normalizeKey(line.itemName), normalizeKey(line.spec), normalizeKey(line.unit)].filter(Boolean).join('|');

const priceItemMatchKey = (item: Pick<PriceItem, 'itemCode' | 'standardName' | 'itemName' | 'spec' | 'unit'>) =>
  [normalizeKey(item.itemCode), normalizeKey(item.standardName || item.itemName), normalizeKey(item.spec), normalizeKey(item.unit)].filter(Boolean).join('|');

const loadQuotes = (): QuoteProject[] => {
  try { return JSON.parse(localStorage.getItem(QUOTE_STORAGE_KEY) || '[]'); }
  catch { return []; }
};

const saveQuotes = (projects: QuoteProject[]) => localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(projects));

const loadPriceStore = (): { batches: PriceBatch[]; items: PriceItem[] } => {
  try {
    const parsed = JSON.parse(localStorage.getItem(PRICE_STORAGE_KEY) || '{}');
    return { batches: parsed.batches || [], items: parsed.items || [] };
  } catch {
    return { batches: [], items: [] };
  }
};

const savePriceStore = (batches: PriceBatch[], items: PriceItem[]) =>
  localStorage.setItem(PRICE_STORAGE_KEY, JSON.stringify({ batches, items }));

const emptyLine = (): QuoteLine => ({
  id: crypto.randomUUID(),
  category: '',
  itemCode: '',
  itemName: '',
  spec: '',
  unit: '',
  quantity: 1,
  wasteFactor: 1,
  source: 'manual',
  checked: true,
  selectedSupplier: '',
  selectedPrice: 0,
  priceSource: 'none',
  previousPrice: 0,
  note: '',
});

const sourceLabel: Record<QuoteSource, string> = {
  drawing: 'Bản vẽ',
  ai: 'AI',
  supplier_quote: 'NCC',
  manual: 'Nhập tay',
};

const priceStatusLabel: Record<PriceStatus, string> = { ok: 'Ổn định', up: 'Tăng giá', down: 'Giảm giá', new: 'Mới', missing: 'Thiếu dữ liệu' };
const priceStatusTone: Record<PriceStatus, string> = { ok: 'text-emerald-700', up: 'text-rose-700', down: 'text-sky-700', new: 'text-indigo-700', missing: 'text-amber-700' };
const priceStatusBadge: Record<PriceStatus, string> = { ok: 'bg-emerald-50 text-emerald-700', up: 'bg-rose-50 text-rose-700', down: 'bg-sky-50 text-sky-700', new: 'bg-indigo-50 text-indigo-700', missing: 'bg-amber-50 text-amber-700' };

export default function InteriorQuote() {
  const initial = useMemo(loadQuotes, []);
  const initialPriceStore = useMemo(loadPriceStore, []);
  const [projects, setProjects] = useState<QuoteProject[]>(initial);
  const [activeProjectId, setActiveProjectId] = useState(initial[0]?.id || '');
  const [tab, setTab] = useState<QuoteTab>('PROJECTS');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [priceBatches, setPriceBatches] = useState<PriceBatch[]>(initialPriceStore.batches);
  const [priceItems, setPriceItems] = useState<PriceItem[]>(initialPriceStore.items);
  const [pricePreview, setPricePreview] = useState<PricePreviewItem[]>([]);
  const [priceSupplier, setPriceSupplier] = useState('');
  const [priceQuoteCode, setPriceQuoteCode] = useState('');
  const [priceValidUntil, setPriceValidUntil] = useState('');
  const [priceBatchName, setPriceBatchName] = useState('');
  const [priceSearch, setPriceSearch] = useState('');
  const [priceStatusFilter, setPriceStatusFilter] = useState<PriceStatus | ''>('');
  const [priceMessage, setPriceMessage] = useState('');
  const priceFileInputRef = useRef<HTMLInputElement>(null);

  const nccPrices = priceItems;
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const activeVersion = activeProject?.versions.find(v => v.id === activeProject.activeVersionId) || activeProject?.versions[0];

  const summary = useMemo(() => {
    const lines = activeVersion?.lines.filter(l => l.checked) || [];
    const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.wasteFactor * l.selectedPrice, 0);
    const strategy = activeProject ? MARGIN_STRATEGIES[activeProject.marginStrategy] : MARGIN_STRATEGIES.target;
    const marginPercent = (strategy.min + strategy.max) / 2;
    const margin = subtotal * marginPercent;
    const outOfTown = activeProject?.isOutOfTown ? (subtotal + margin) * 0.04 : 0;
    const beforeVat = subtotal + margin + outOfTown;
    const vat = beforeVat * 0.08;
    return { subtotal, marginPercent, margin, outOfTown, beforeVat, vat, total: beforeVat + vat };
  }, [activeProject, activeVersion]);

  const persist = (next: QuoteProject[]) => {
    setProjects(next);
    saveQuotes(next);
  };

  const updateProject = (patch: Partial<QuoteProject>) => {
    if (!activeProject) return;
    persist(projects.map(p => p.id === activeProject.id ? { ...p, ...patch } : p));
  };

  const updateVersion = (version: QuoteVersion) => {
    if (!activeProject) return;
    persist(projects.map(p => p.id === activeProject.id ? {
      ...p,
      versions: p.versions.map(v => v.id === version.id ? version : v),
    } : p));
  };

  const createProject = () => {
    const versionId = crypto.randomUUID();
    const project: QuoteProject = {
      id: crypto.randomUUID(),
      name: `Báo giá mới ${projects.length + 1}`,
      clientName: '',
      type: 'chung_cu',
      area: 0,
      tier: 'premium',
      marginStrategy: 'target',
      isOutOfTown: false,
      activeVersionId: versionId,
      versions: [{
        id: versionId,
        versionNo: 1,
        name: 'V1 - Dự thảo',
        drawingVersion: 'A',
        createdAt: new Date().toISOString(),
        status: 'draft',
        lines: [],
      }],
    };
    persist([project, ...projects]);
    setActiveProjectId(project.id);
    setTab('PROJECTS');
  };

  const cloneVersion = () => {
    if (!activeProject || !activeVersion) return;
    const versionNo = Math.max(...activeProject.versions.map(v => v.versionNo)) + 1;
    const clone: QuoteVersion = {
      ...activeVersion,
      id: crypto.randomUUID(),
      versionNo,
      name: `V${versionNo} - Sao chép`,
      createdAt: new Date().toISOString(),
      status: 'draft',
      lines: activeVersion.lines.map(l => ({ ...l, id: crypto.randomUUID() })),
    };
    persist(projects.map(p => p.id === activeProject.id ? {
      ...p,
      activeVersionId: clone.id,
      versions: [clone, ...p.versions],
    } : p));
  };

  const deleteProject = (id: string) => {
    if (!confirm('Xóa hồ sơ báo giá này?')) return;
    const next = projects.filter(p => p.id !== id);
    persist(next);
    if (activeProjectId === id) setActiveProjectId(next[0]?.id || '');
  };

  const setLines = (lines: QuoteLine[]) => {
    if (!activeVersion) return;
    updateVersion({ ...activeVersion, lines });
  };

  const addLine = () => setLines([...(activeVersion?.lines || []), emptyLine()]);

  const updateLine = (id: string, patch: Partial<QuoteLine>) => {
    if (!activeVersion) return;
    setLines(activeVersion.lines.map(l => l.id === id ? { ...l, ...patch } : l));
  };

  const removeLine = (id: string) => {
    if (!activeVersion) return;
    setLines(activeVersion.lines.filter(l => l.id !== id));
  };

  const BOQ_ITEM_NAME_KEYS = ['Tên vật tư', 'Tên hạng mục', 'Tên công việc', 'Nội dung', 'Nội dung công việc', 'Diễn giải', 'Hạng mục công việc', 'name', 'item_name'];
  const BOQ_UNIT_KEYS = ['Đơn vị', 'ĐVT', 'Đơn vị tính', 'unit'];
  const BOQ_QUANTITY_KEYS = ['Khối lượng', 'KL', 'Số lượng', 'SL', 'quantity'];

  const parseImportedRows = (rows: Record<string, any>[]): QuoteLine[] => rows.map(row => ({
    ...emptyLine(),
    category: String(pickCell(row, ['Bill', 'Nhóm', 'Hạng mục', 'Phần việc', 'category']) || '').trim(),
    itemCode: String(pickCell(row, ['Mã vật tư', 'Mã hàng', 'Mã công việc', 'Mã', 'item_code', 'price_key']) || '').trim(),
    itemName: String(pickCell(row, BOQ_ITEM_NAME_KEYS) || '').trim(),
    spec: String(pickCell(row, ['Quy cách', 'Thông số', 'spec']) || '').trim(),
    unit: String(pickCell(row, BOQ_UNIT_KEYS) || '').trim(),
    quantity: Number(pickCell(row, BOQ_QUANTITY_KEYS) || 0) || 0,
    wasteFactor: Number(pickCell(row, ['Hao hụt', 'Hệ số hao hụt', 'waste_factor']) || 1) || 1,
    source: 'ai' as QuoteSource,
    selectedPrice: money(pickCell(row, ['Đơn giá', 'unit_price', 'price'])),
    priceSource: (money(pickCell(row, ['Đơn giá', 'unit_price', 'price'])) > 0 ? 'manual' : 'none') as QuoteLine['priceSource'],
    note: String(pickCell(row, ['Ghi chú', 'note']) || '').trim(),
  })).filter(l => l.itemName);

  const exportBoqTemplate = () => exportRowsToExcel([{
    'Hạng mục': 'BILL 01 - ĐẬP PHÁ', 'Mã công việc': 'CV-001', 'Tên công việc': 'Tháo dỡ đồ gỗ cũ',
    'Quy cách': '', 'Đơn vị': 'hệ', 'Khối lượng': 1, 'Hao hụt': 1, 'Đơn giá': 0, 'Ghi chú': '',
  }], 'Mau_BOQ.xlsx', 'Mau BOQ');

  const importExcel = async (file: File) => {
    const rows = await readExcelFile(file);
    const parsed = parseImportedRows(rows);
    if (parsed.length === 0 && rows.length > 0) {
      const foundHeaders = Object.keys(rows[0] || {}).join(', ') || '(không có)';
      setMessage(`Đọc được ${rows.length} dòng nhưng không dòng nào khớp cột "Tên công việc/Tên vật tư". Cột phát hiện trong file: ${foundHeaders}. Tải "Mẫu Excel" để xem đúng tên cột cần dùng.`);
      return;
    }
    setLines([...(activeVersion?.lines || []), ...parsed]);
    setMessage(`Đã đọc ${rows.length} dòng, nhập được ${parsed.length} dòng BOQ hợp lệ${rows.length !== parsed.length ? ` (bỏ qua ${rows.length - parsed.length} dòng thiếu tên)` : ''}.`);
  };

  const applyPrices = () => {
    if (!activeProject || !activeVersion) return;
    const internalPrices = flattenPriceBook(activeProject.type);
    const next = activeVersion.lines.map(line => {
      const key = matchKey(line);
      const candidates = nccPrices
        .filter(p => matchKey({
          itemCode: p.itemCode,
          itemName: p.standardName || p.itemName,
          spec: p.spec,
          unit: p.unit,
        }) === key || normalizeKey(p.standardName || p.itemName).includes(normalizeKey(line.itemName)))
        .sort((a, b) => b.importedAt.localeCompare(a.importedAt));

      if (candidates[0]) {
        return {
          ...line,
          selectedSupplier: candidates[0].supplier,
          selectedPrice: candidates[0].unitPrice,
          previousPrice: candidates[1]?.unitPrice || 0,
          priceSource: 'ncc' as const,
        };
      }

      const itemKey = line.itemCode.split('.').pop() || line.itemCode;
      const internal = internalPrices.find(p => p.itemKey === itemKey || normalizeKey(p.displayName) === normalizeKey(line.itemName));
      const price = internal ? getItemPrice(internal.item, activeProject.tier) || 0 : 0;
      return price > 0 ? { ...line, selectedPrice: price, previousPrice: 0, priceSource: 'internal' as const } : line;
    });
    setLines(next);
    setMessage('Đã áp giá từ Kho giá NCC, fallback về bảng giá nội bộ nếu chưa có NCC.');
  };

  const exportQuote = () => {
    if (!activeProject || !activeVersion) return;
    const rows = [
      { 'Thông tin': 'Dự án', 'Giá trị': activeProject.name },
      { 'Thông tin': 'Khách hàng', 'Giá trị': activeProject.clientName },
      { 'Thông tin': 'Version', 'Giá trị': activeVersion.name },
      { 'Thông tin': 'Tổng sau VAT', 'Giá trị': Math.round(summary.total) },
      {},
      ...activeVersion.lines.filter(l => l.checked).map((l, i) => ({
        'STT': i + 1,
        'Hạng mục': l.category,
        'Mã': l.itemCode,
        'Tên vật tư/hạng mục': l.itemName,
        'Quy cách': l.spec,
        'ĐVT': l.unit,
        'KL': l.quantity,
        'Hao hụt': l.wasteFactor,
        'KL thực': Math.round(l.quantity * l.wasteFactor * 100) / 100,
        'Đơn giá': l.selectedPrice,
        'Thành tiền': Math.round(l.quantity * l.wasteFactor * l.selectedPrice),
        'NCC': l.selectedSupplier,
        'Nguồn giá': l.priceSource,
        'Nguồn BOQ': sourceLabel[l.source],
        'Ghi chú': l.note,
      })),
      {},
      { 'Thông tin': 'Tạm tính', 'Giá trị': Math.round(summary.subtotal) },
      { 'Thông tin': `Margin ${(summary.marginPercent * 100).toFixed(0)}%`, 'Giá trị': Math.round(summary.margin) },
      { 'Thông tin': 'Phụ thu ngoài tỉnh', 'Giá trị': Math.round(summary.outOfTown) },
      { 'Thông tin': 'Trước VAT', 'Giá trị': Math.round(summary.beforeVat) },
      { 'Thông tin': 'VAT 8%', 'Giá trị': Math.round(summary.vat) },
      { 'Thông tin': 'Tổng sau VAT', 'Giá trị': Math.round(summary.total) },
    ];
    exportRowsToExcel(rows, `Bao_gia_${activeProject.name}_${activeVersion.name}.xlsx`, 'Bao gia');
  };

  const filteredProjects = projects.filter(p => normalizeKey(p.name + ' ' + p.clientName).includes(normalizeKey(search)));

  // ── Kho giá NCC (gộp chung vào 1 trang với Báo giá) ──
  const latestByKey = useMemo(() => {
    const map = new Map<string, PriceItem>();
    [...priceItems]
      .sort((a, b) => b.importedAt.localeCompare(a.importedAt))
      .forEach(item => {
        const key = priceItemMatchKey(item);
        if (key && !map.has(key)) map.set(key, item);
      });
    return map;
  }, [priceItems]);

  const latestPriceItems = useMemo(() => Array.from(latestByKey.values()), [latestByKey]);
  const filteredPricePreview = pricePreview.filter(item =>
    (!priceStatusFilter || item.status === priceStatusFilter) &&
    (!priceSearch || [item.itemCode, item.itemName, item.standardName, item.spec, item.brand, item.supplier].some(v => normalizeKey(v).includes(normalizeKey(priceSearch))))
  );
  const filteredLatestPrices = latestPriceItems.filter(item =>
    !priceSearch || [item.itemCode, item.itemName, item.standardName, item.spec, item.brand, item.supplier].some(v => normalizeKey(v).includes(normalizeKey(priceSearch)))
  );
  const priceStatusCount = pricePreview.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<PriceStatus, number>);

  const parsePriceRows = (rows: Record<string, any>[]) => rows.map((row, index): PricePreviewItem => {
    const itemName = String(pickCell(row, ['Tên vật tư', 'Tên hàng', 'Hạng mục', 'Item name', 'Tên']) || '').trim();
    const standardName = String(pickCell(row, ['Tên chuẩn', 'Tên vật tư chuẩn', 'Standard name']) || itemName).trim();
    const item: Omit<PriceItem, 'id' | 'batchId' | 'importedAt'> = {
      supplier: String(pickCell(row, ['Nhà cung cấp', 'NCC', 'Supplier']) || priceSupplier).trim(),
      quoteCode: String(pickCell(row, ['Mã báo giá', 'Số báo giá', 'Quote code']) || priceQuoteCode).trim(),
      validUntil: parseDateValue(pickCell(row, ['Hiệu lực đến', 'Valid until', 'Hạn báo giá']) || priceValidUntil),
      itemCode: String(pickCell(row, ['Mã vật tư', 'Mã hàng', 'Item code', 'SKU']) || '').trim(),
      itemName,
      standardName,
      spec: String(pickCell(row, ['Quy cách', 'Thông số', 'Spec', 'Mô tả']) || '').trim(),
      brand: String(pickCell(row, ['Thương hiệu', 'Brand', 'Hãng']) || '').trim(),
      unit: String(pickCell(row, ['Đơn vị', 'ĐVT', 'Unit']) || '').trim(),
      unitPrice: money(pickCell(row, ['Đơn giá', 'Giá', 'Unit price', 'Price'])),
      vat: Number(pickCell(row, ['VAT', 'Thuế']) || 0) || 0,
      deliveryTerm: String(pickCell(row, ['Điều kiện giao hàng', 'Giao hàng', 'Delivery']) || '').trim(),
      note: String(pickCell(row, ['Ghi chú', 'Note']) || '').trim(),
    };

    const prev = latestByKey.get(priceItemMatchKey(item));
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

  const handleImportPriceFile = async (file: File) => {
    const rows = await readExcelFile(file);
    const parsed = parsePriceRows(rows);
    setPricePreview(parsed);
    setPriceBatchName(priceBatchName || file.name.replace(/\.[^.]+$/, ''));
    setPriceMessage(`Đã đọc ${parsed.length} dòng. Kiểm tra preview trước khi lưu vào kho giá.`);
  };

  const savePricePreview = () => {
    const valid = pricePreview.filter(item => item.status !== 'missing');
    if (valid.length === 0) return;
    const batchId = crypto.randomUUID();
    const importedAt = new Date().toISOString();
    const newBatch: PriceBatch = {
      id: batchId,
      name: priceBatchName.trim() || `Báo giá ${todayStr()}`,
      supplier: priceSupplier.trim() || valid[0]?.supplier || '',
      quoteCode: priceQuoteCode.trim() || valid[0]?.quoteCode || '',
      importedAt,
      validUntil: priceValidUntil || valid[0]?.validUntil || '',
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
    const nextBatches = [newBatch, ...priceBatches];
    const nextItems = [...newItems, ...priceItems];
    setPriceBatches(nextBatches);
    setPriceItems(nextItems);
    savePriceStore(nextBatches, nextItems);
    setPricePreview([]);
    setPriceMessage(`Đã lưu ${newItems.length} dòng vào kho giá.`);
  };

  const deletePriceBatch = (batchId: string) => {
    if (!confirm('Xóa bộ báo giá này khỏi kho giá?')) return;
    const nextBatches = priceBatches.filter(b => b.id !== batchId);
    const nextItems = priceItems.filter(i => i.batchId !== batchId);
    setPriceBatches(nextBatches);
    setPriceItems(nextItems);
    savePriceStore(nextBatches, nextItems);
  };

  const exportPriceTemplate = () => exportRowsToExcel([{
    'Nhà cung cấp': priceSupplier || 'Tên NCC',
    'Mã báo giá': priceQuoteCode || 'BG-001',
    'Hiệu lực đến': priceValidUntil || todayStr(),
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

  const exportLatestPrices = () => exportRowsToExcel(filteredLatestPrices.map(item => ({
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

  const exportPricePreview = () => exportRowsToExcel(filteredPricePreview.map(item => ({
    'Trạng thái': priceStatusLabel[item.status],
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
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" /> Hệ thống báo giá
          </h1>
          <p className="text-xs text-slate-500 mt-1">BOQ nằm trong app, Kho giá là dữ liệu nền, Excel chỉ là cổng nhập/xuất.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={createProject} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Hồ sơ mới</button>
          <button onClick={cloneVersion} disabled={!activeProject} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40"><Copy className="w-3.5 h-3.5" /> Clone version</button>
          <button onClick={exportQuote} disabled={!activeVersion?.lines.length} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40"><Download className="w-3.5 h-3.5" /> Xuất Excel</button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {([
          ['PROJECTS', 'Hồ sơ', FolderKanban],
          ['BOQ', 'BOQ', CheckCircle2],
          ['PRICEBOOK', 'Kho giá', Database],
          ['PRICING', 'Áp giá', BarChart3],
          ['EXPORT', 'Tổng hợp', Download],
        ] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${tab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {message && <div className="bg-sky-50 border border-sky-100 text-sky-700 text-xs font-medium rounded-xl px-4 py-3">{message}</div>}

      {tab === 'PROJECTS' && (
        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-slate-100 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-5 top-5" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm hồ sơ..." className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
              {filteredProjects.map(p => (
                <button key={p.id} onClick={() => setActiveProjectId(p.id)} className={`w-full text-left p-4 hover:bg-slate-50 ${activeProject?.id === p.id ? 'bg-indigo-50/70' : ''}`}>
                  <p className="text-sm font-bold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{p.clientName || 'Chưa có khách hàng'} • {p.versions.length} version</p>
                </button>
              ))}
              {projects.length === 0 && <p className="text-xs text-slate-400 text-center py-10">Chưa có hồ sơ báo giá.</p>}
            </div>
          </div>
          <ProjectEditor project={activeProject} activeVersion={activeVersion} onUpdate={updateProject} onDelete={deleteProject} />
        </div>
      )}

      {tab === 'BOQ' && activeProject && activeVersion && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800">BOQ - {activeProject.name}</h2>
                <p className="text-xs text-slate-500">{activeVersion.name} • {activeVersion.lines.length} dòng</p>
              </div>
              <div className="flex gap-2">
                <button onClick={addLine} className="px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Dòng</button>
                <button onClick={exportBoqTemplate} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Mẫu Excel</button>
                <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-white border border-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Excel</button>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importExcel(f); e.target.value = ''; }} />
              </div>
            </div>
          </div>
          <BoqTable lines={activeVersion.lines} onUpdate={updateLine} onRemove={removeLine} />
        </div>
      )}

      {tab === 'PRICEBOOK' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Kho giá NCC</h2>
                <p className="text-xs text-slate-500 mt-1">Import báo giá NCC (file Excel), lưu lịch sử và so sánh giá mới với giá đã có. Dùng ngay ở tab "Áp giá".</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={exportPriceTemplate} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Mẫu Excel</button>
                <button onClick={() => priceFileInputRef.current?.click()} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Import giá</button>
                <input ref={priceFileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImportPriceFile(f); e.target.value = ''; }} />
                <button onClick={exportLatestPrices} disabled={filteredLatestPrices.length === 0} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40"><FileSpreadsheet className="w-3.5 h-3.5" /> Xuất kho</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-4">
              <input value={priceBatchName} onChange={e => setPriceBatchName(e.target.value)} placeholder="Tên bộ báo giá" className="px-3 py-2 border border-slate-200 rounded-lg text-xs" />
              <input value={priceSupplier} onChange={e => setPriceSupplier(e.target.value)} placeholder="Nhà cung cấp mặc định" className="px-3 py-2 border border-slate-200 rounded-lg text-xs" />
              <input value={priceQuoteCode} onChange={e => setPriceQuoteCode(e.target.value)} placeholder="Mã báo giá" className="px-3 py-2 border border-slate-200 rounded-lg text-xs" />
              <input type="date" value={priceValidUntil} onChange={e => setPriceValidUntil(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-xs" />
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input value={priceSearch} onChange={e => setPriceSearch(e.target.value)} placeholder="Tìm vật tư/NCC..." className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
              </div>
            </div>
            {priceMessage && <p className="text-xs text-slate-500 mt-2">{priceMessage}</p>}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Bộ báo giá" value={String(priceBatches.length)} />
            <SummaryCard label="Dòng lịch sử" value={String(priceItems.length)} />
            <SummaryCard label="Mã giá mới nhất" value={String(latestPriceItems.length)} />
            <SummaryCard label="Dòng preview" value={String(pricePreview.length)} />
          </div>

          {pricePreview.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {(['new', 'up', 'down', 'ok', 'missing'] as PriceStatus[]).map(status => (
                  <button key={status} onClick={() => setPriceStatusFilter(priceStatusFilter === status ? '' : status)}
                    className={`text-left rounded-xl border p-3 ${priceStatusFilter === status ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                    <p className={`text-[10px] font-bold uppercase ${priceStatusTone[status]}`}>{priceStatusLabel[status]}</p>
                    <p className="text-lg font-bold text-slate-800 mt-1">{priceStatusCount[status] || 0}</p>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-500" /> Preview so sánh</h2>
                <div className="flex items-center gap-2">
                  <select value={priceStatusFilter} onChange={e => setPriceStatusFilter(e.target.value as PriceStatus | '')} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
                    <option value="">Tất cả trạng thái</option>
                    {(['new', 'up', 'down', 'ok', 'missing'] as PriceStatus[]).map(s => <option key={s} value={s}>{priceStatusLabel[s]}</option>)}
                  </select>
                  <button onClick={exportPricePreview} className="px-3 py-2 bg-white border border-slate-200 text-xs font-bold rounded-lg">Xuất so sánh</button>
                  <button onClick={savePricePreview} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg">Lưu vào kho</button>
                </div>
              </div>
              <PricePreviewTable rows={filteredPricePreview} />
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2"><History className="w-4 h-4 text-indigo-500" /> Giá mới nhất trong kho</h2>
              <LatestPriceTable rows={filteredLatestPrices} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-800">Lịch sử import</h2>
              </div>
              <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                {priceBatches.map(batch => (
                  <div key={batch.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{batch.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{batch.supplier || '--'} • {batch.itemCount} dòng</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(batch.importedAt).toLocaleString('vi-VN')} {batch.quoteCode ? `• ${batch.quoteCode}` : ''}</p>
                      </div>
                      <button onClick={() => deletePriceBatch(batch.id)} className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {priceBatches.length === 0 && <p className="text-xs text-slate-400 text-center py-8">Chưa có bộ báo giá nào.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'PRICING' && activeProject && activeVersion && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <SummaryCard label="Dòng BOQ" value={String(activeVersion.lines.length)} />
            <SummaryCard label="Đã tick" value={String(activeVersion.lines.filter(l => l.checked).length)} />
            <SummaryCard label="Có giá NCC" value={String(activeVersion.lines.filter(l => l.priceSource === 'ncc').length)} />
            <SummaryCard label="Chưa có giá" value={String(activeVersion.lines.filter(l => !l.selectedPrice).length)} />
            <SummaryCard label="Tạm tính" value={formatVND(summary.subtotal)} />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Áp giá từ Kho giá NCC</h2>
              <p className="text-xs text-slate-500 mt-1">Ưu tiên giá NCC mới nhất, sau đó fallback sang bảng giá nội bộ.</p>
            </div>
            <button onClick={applyPrices} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Áp giá</button>
          </div>
          <PricingTable lines={activeVersion.lines} onUpdate={updateLine} />
        </div>
      )}

      {tab === 'EXPORT' && activeProject && activeVersion && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                <tr><th className="px-3 py-2 text-left">Hạng mục</th><th className="px-3 py-2 text-right">KL thực</th><th className="px-3 py-2 text-right">Đơn giá</th><th className="px-3 py-2 text-right">Thành tiền</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeVersion.lines.filter(l => l.checked).map(l => (
                  <tr key={l.id}><td className="px-3 py-2 font-medium">{l.itemName}</td><td className="px-3 py-2 text-right">{Math.round(l.quantity * l.wasteFactor * 100) / 100} {l.unit}</td><td className="px-3 py-2 text-right">{formatVND(l.selectedPrice)}</td><td className="px-3 py-2 text-right font-bold">{formatVND(l.quantity * l.wasteFactor * l.selectedPrice)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm h-fit space-y-2">
            <SummaryLine label="Tạm tính" value={summary.subtotal} />
            <SummaryLine label={`Margin ${(summary.marginPercent * 100).toFixed(0)}%`} value={summary.margin} />
            <SummaryLine label="Phụ thu ngoài tỉnh" value={summary.outOfTown} />
            <SummaryLine label="Trước VAT" value={summary.beforeVat} />
            <SummaryLine label="VAT 8%" value={summary.vat} />
            <div className="border-t border-slate-100 pt-3 flex justify-between text-base font-bold"><span>Tổng sau VAT</span><span className="text-indigo-700">{formatVND(summary.total)}</span></div>
            <button onClick={exportQuote} className="w-full mt-3 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl">Xuất Excel</button>
          </div>
        </div>
      )}

      {!activeProject && tab !== 'PROJECTS' && <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-400">Tạo hồ sơ báo giá trước.</div>}
    </div>
  );
}

function ProjectEditor({ project, activeVersion, onUpdate, onDelete }: {
  project?: QuoteProject;
  activeVersion?: QuoteVersion;
  onUpdate: (patch: Partial<QuoteProject>) => void;
  onDelete: (id: string) => void;
}) {
  if (!project) return <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-400">Chọn hoặc tạo hồ sơ báo giá.</div>;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-800">Thông tin hồ sơ</h2>
        <button onClick={() => onDelete(project.id)} className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Tên dự án"><input value={project.name} onChange={e => onUpdate({ name: e.target.value })} className={FORM_INPUT} /></Field>
        <Field label="Khách hàng"><input value={project.clientName} onChange={e => onUpdate({ clientName: e.target.value })} className={FORM_INPUT} /></Field>
        <Field label="Loại hình"><select value={project.type} onChange={e => onUpdate({ type: e.target.value as QuoteType })} className={FORM_INPUT}><option value="chung_cu">Chung cư</option><option value="nha_o">Nhà ở</option><option value="shop">Shop</option></select></Field>
        <Field label="Diện tích"><input type="number" value={project.area} onChange={e => onUpdate({ area: Number(e.target.value) || 0 })} className={FORM_INPUT} /></Field>
        <Field label="Phân khúc"><select value={project.tier} onChange={e => onUpdate({ tier: e.target.value as QuoteTier })} className={FORM_INPUT}><option value="basic">Basic</option><option value="premium">Premium</option><option value="luxury">Luxury</option></select></Field>
        <Field label="Chiến lược margin"><select value={project.marginStrategy} onChange={e => onUpdate({ marginStrategy: e.target.value as any })} className={FORM_INPUT}>{Object.entries(MARGIN_STRATEGIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
      </div>
      <label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={project.isOutOfTown} onChange={e => onUpdate({ isOutOfTown: e.target.checked })} /> Công trình ngoài tỉnh</label>
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" /> Version hiện tại</p>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
          <p className="text-sm font-bold text-slate-800">{activeVersion?.name}</p>
          <p className="text-xs text-slate-500 mt-1">Bản vẽ {activeVersion?.drawingVersion || '--'} • {activeVersion?.lines.length || 0} dòng BOQ</p>
        </div>
      </div>
      <div className="text-xs text-slate-400 flex items-center gap-1"><Save className="w-3.5 h-3.5" /> Dữ liệu tự lưu trong app/browser ở phase này.</div>
    </div>
  );
}

function BoqTable({ lines, onUpdate, onRemove }: { lines: QuoteLine[]; onUpdate: (id: string, patch: Partial<QuoteLine>) => void; onRemove: (id: string) => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
          <tr><th className="px-3 py-2">Tick</th><th className="px-3 py-2 text-left">Hạng mục</th><th className="px-3 py-2 text-left">Tên</th><th className="px-3 py-2">ĐVT</th><th className="px-3 py-2">KL</th><th className="px-3 py-2">Hao hụt</th><th className="px-3 py-2">Nguồn</th><th></th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lines.map(line => (
            <tr key={line.id} className="hover:bg-slate-50">
              <td className="px-3 py-2 text-center"><input type="checkbox" checked={line.checked} onChange={e => onUpdate(line.id, { checked: e.target.checked })} /></td>
              <td className="px-3 py-2"><input value={line.category} onChange={e => onUpdate(line.id, { category: e.target.value })} className={`${TABLE_INPUT} w-32`} /></td>
              <td className="px-3 py-2 min-w-[260px]"><input value={line.itemName} onChange={e => onUpdate(line.id, { itemName: e.target.value })} className={`${TABLE_INPUT} w-full font-medium`} /><input value={line.spec} onChange={e => onUpdate(line.id, { spec: e.target.value })} placeholder="Quy cách" className={`${TABLE_INPUT} w-full mt-1 text-slate-500`} /></td>
              <td className="px-3 py-2"><input value={line.unit} onChange={e => onUpdate(line.id, { unit: e.target.value })} className={`${TABLE_INPUT} w-16 text-center`} /></td>
              <td className="px-3 py-2"><input type="number" value={line.quantity} onChange={e => onUpdate(line.id, { quantity: Number(e.target.value) || 0 })} className={`${TABLE_INPUT} w-20 text-right`} /></td>
              <td className="px-3 py-2"><input type="number" value={line.wasteFactor} onChange={e => onUpdate(line.id, { wasteFactor: Number(e.target.value) || 1 })} className={`${TABLE_INPUT} w-20 text-right`} /></td>
              <td className="px-3 py-2"><select value={line.source} onChange={e => onUpdate(line.id, { source: e.target.value as QuoteSource })} className={TABLE_INPUT}><option value="drawing">Bản vẽ</option><option value="ai">AI</option><option value="supplier_quote">NCC</option><option value="manual">Tay</option></select></td>
              <td className="px-3 py-2"><button onClick={() => onRemove(line.id)} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></td>
            </tr>
          ))}
          {lines.length === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-8">Chưa có BOQ.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function PricingTable({ lines, onUpdate }: { lines: QuoteLine[]; onUpdate: (id: string, patch: Partial<QuoteLine>) => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
          <tr><th className="px-3 py-2 text-left">Hạng mục</th><th className="px-3 py-2 text-left">Nguồn giá</th><th className="px-3 py-2 text-left">NCC</th><th className="px-3 py-2 text-right">Giá trước</th><th className="px-3 py-2 text-right">Giá chọn</th><th className="px-3 py-2 text-right">Chênh lệch</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lines.map(line => {
            const diff = line.previousPrice ? line.selectedPrice - line.previousPrice : 0;
            return (
              <tr key={line.id} className={!line.selectedPrice ? 'bg-amber-50/60' : 'hover:bg-slate-50'}>
                <td className="px-3 py-2 min-w-[260px]"><p className="font-bold text-slate-800">{line.itemName || '--'}</p><p className="text-[10px] text-slate-400">{line.spec || '--'} • {line.quantity} {line.unit}</p></td>
                <td className="px-3 py-2"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${line.priceSource === 'ncc' ? 'bg-emerald-50 text-emerald-700' : line.priceSource === 'internal' ? 'bg-indigo-50 text-indigo-700' : line.priceSource === 'manual' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>{line.priceSource}</span></td>
                <td className="px-3 py-2 text-slate-500">{line.selectedSupplier || '--'}</td>
                <td className="px-3 py-2 text-right text-slate-500">{line.previousPrice ? formatVND(line.previousPrice) : '--'}</td>
                <td className="px-3 py-2 text-right"><input type="number" value={line.selectedPrice} onChange={e => onUpdate(line.id, { selectedPrice: Number(e.target.value) || 0, priceSource: 'manual' })} className={`${TABLE_INPUT} w-28 text-right font-bold`} /></td>
                <td className={`px-3 py-2 text-right font-bold ${diff > 0 ? 'text-rose-600' : diff < 0 ? 'text-sky-600' : 'text-slate-400'}`}>{line.previousPrice ? `${diff > 0 ? '+' : ''}${formatVND(diff)}` : '--'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-slate-500 space-y-1"><span>{label}</span>{children}</label>;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm"><p className="text-[10px] text-slate-400 font-bold uppercase">{label}</p><p className="text-base font-bold text-slate-800 mt-1">{value}</p></div>;
}

function SummaryLine({ label, value }: { label: string; value: number }) {
  return <div className="flex justify-between text-sm"><span className="text-slate-500">{label}</span><span className="font-bold text-slate-800">{formatVND(value)}</span></div>;
}

function PricePreviewTable({ rows }: { rows: PricePreviewItem[] }) {
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
              <td className="px-3 py-2.5 whitespace-nowrap"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${priceStatusBadge[row.status]}`}>{priceStatusLabel[row.status]}</span></td>
              <td className="px-3 py-2.5 min-w-[260px]">
                <p className="font-bold text-slate-800">{row.standardName || row.itemName}</p>
                <p className="text-[10px] text-slate-400">{row.itemCode || '--'} • {row.spec || '--'} • {row.unit || '--'}</p>
              </td>
              <td className="px-3 py-2.5 text-slate-500">{row.supplier || '--'}</td>
              <td className="px-3 py-2.5 text-right font-bold">{formatVND(row.unitPrice)}</td>
              <td className="px-3 py-2.5 text-right text-slate-500">{row.previousPrice ? formatVND(row.previousPrice) : '--'}</td>
              <td className={`px-3 py-2.5 text-right font-bold ${row.diff > 0 ? 'text-rose-600' : row.diff < 0 ? 'text-sky-600' : 'text-slate-500'}`}>
                {row.previousPrice ? `${row.diff > 0 ? '+' : ''}${formatVND(row.diff)} (${(row.diffPercent * 100).toFixed(1)}%)` : '--'}
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

function LatestPriceTable({ rows }: { rows: PriceItem[] }) {
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
              <td className="px-3 py-2.5 text-right font-bold text-slate-800">{formatVND(row.unitPrice)}</td>
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
