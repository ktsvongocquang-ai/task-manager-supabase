import { useState, useMemo } from 'react';
import { ClipboardPaste, CheckSquare, DollarSign, FileSpreadsheet, Check, X, Edit3, Plus, Trash2, AlertTriangle, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { flattenPriceBook, getItemPrice, formatVND, CATEGORY_LABELS, MARGIN_STRATEGIES, TIERS } from '../../constants/priceBook';
import { calculateSummary, exportToExcel } from '../../utils/exportInteriorQuote';
import type { InteriorQuoteProject, BOQLineItem } from '../../utils/interiorQuoteTypes';

const STEPS = [
  { name: 'Dán từ Claude', icon: ClipboardPaste },
  { name: 'Checklist', icon: CheckSquare },
  { name: 'Áp giá', icon: DollarSign },
  { name: 'Xuất Excel', icon: FileSpreadsheet },
];

const SAMPLE_JSON = `{
  "project": { "name": "Căn hộ Landmark 3", "client": "Mr Hân", "type": "chung_cu", "area_m2": 95, "tier": "premium", "margin_strategy": "target", "is_out_of_town": false },
  "bills": [
    { "bill": "BILL 01", "name": "ĐẬP PHÁ", "items": [
      { "stt": 1, "name": "Tháo dỡ đồ gỗ cũ", "unit": "hệ", "quantity": 1, "waste_factor": 1.0, "price_key": "chung_cu.thao_do.thao_do_do_go_cu", "unit_price": 0, "scope": "NC", "note": "" }
    ]}
  ]
}`;

interface ParsedBill {
  bill: string;
  name: string;
  items: ParsedItem[];
}
interface ParsedItem {
  stt: number;
  name: string;
  unit: string;
  quantity: number;
  waste_factor: number;
  price_key: string;
  unit_price: number;
  scope: string;
  note: string;
  checked: boolean;
  matched_price: number | null;
  warning?: string;
}

export default function InteriorQuote() {
  const [step, setStep] = useState(0);
  const [rawJson, setRawJson] = useState('');
  const [parseError, setParseError] = useState('');
  const [project, setProject] = useState<InteriorQuoteProject>({ name: '', clientName: '', type: 'chung_cu', area: 0, tier: 'premium', marginStrategy: 'target', isOutOfTown: false });
  const [bills, setBills] = useState<ParsedBill[]>([]);
  const [expandedBills, setExpandedBills] = useState<Record<string, boolean>>({});
  const [allChecked, setAllChecked] = useState(false);

  // Flatten price book for matching
  const priceItems = useMemo(() => flattenPriceBook(project.type), [project.type]);

  // Match a price_key to actual price
  const matchPrice = (priceKey: string, tier: 'basic' | 'premium' | 'luxury'): number | null => {
    // Try direct key lookup: "chung_cu.thao_do.thao_do_do_go_cu"
    const parts = priceKey.split('.');
    const itemKey = parts[parts.length - 1];
    const found = priceItems.find(p => p.itemKey === itemKey);
    if (found) return getItemPrice(found.item, tier);
    // Fuzzy fallback by name
    return null;
  };

  const handleParse = () => {
    try {
      setParseError('');
      const text = rawJson.trim();
      // Try to extract JSON from code blocks
      const jsonMatch = text.match(/```json?\s*([\s\S]*?)```/) || [null, text];
      const data = JSON.parse(jsonMatch[1] || text);

      if (!data.project || !data.bills) {
        setParseError('JSON thiếu "project" hoặc "bills". Kiểm tra lại format từ Claude.');
        return;
      }

      setProject({
        name: data.project.name || '',
        clientName: data.project.client || '',
        type: data.project.type || 'chung_cu',
        area: data.project.area_m2 || 0,
        tier: data.project.tier || 'premium',
        marginStrategy: data.project.margin_strategy || 'target',
        isOutOfTown: data.project.is_out_of_town || false,
      });

      const tier = data.project.tier || 'premium';
      const parsed: ParsedBill[] = data.bills.map((b: any) => ({
        bill: b.bill,
        name: b.name,
        items: (b.items || []).map((it: any) => {
          const mp = matchPrice(it.price_key || '', tier);
          return {
            ...it,
            checked: false,
            matched_price: mp,
            warning: mp === null ? 'Không tìm thấy giá trong price book' : (it.unit_price > 0 && it.unit_price !== mp ? `Claude: ${formatVND(it.unit_price)} ≠ Price book: ${formatVND(mp)}` : undefined),
          };
        }),
      }));

      setBills(parsed);
      setExpandedBills(Object.fromEntries(parsed.map(b => [b.bill, true])));
      setStep(1);
    } catch (e: any) {
      setParseError(`Lỗi parse JSON: ${e.message}`);
    }
  };

  const toggleItem = (billIdx: number, itemIdx: number) => {
    setBills(prev => prev.map((b, bi) => bi !== billIdx ? b : {
      ...b, items: b.items.map((it, ii) => ii !== itemIdx ? it : { ...it, checked: !it.checked })
    }));
  };

  const toggleAllInBill = (billIdx: number, val: boolean) => {
    setBills(prev => prev.map((b, bi) => bi !== billIdx ? b : { ...b, items: b.items.map(it => ({ ...it, checked: val })) }));
  };

  const updateItemField = (billIdx: number, itemIdx: number, field: string, value: any) => {
    setBills(prev => prev.map((b, bi) => bi !== billIdx ? b : {
      ...b, items: b.items.map((it, ii) => ii !== itemIdx ? it : { ...it, [field]: value })
    }));
  };

  const removeItem = (billIdx: number, itemIdx: number) => {
    setBills(prev => prev.map((b, bi) => bi !== billIdx ? b : { ...b, items: b.items.filter((_, ii) => ii !== itemIdx) }));
  };

  const checkedItems = bills.flatMap(b => b.items.filter(it => it.checked));
  const hasUnchecked = bills.some(b => b.items.some(it => !it.checked));

  const confirmChecklist = () => {
    if (hasUnchecked && !window.confirm(`Còn ${bills.flatMap(b=>b.items).length - checkedItems.length} hạng mục chưa tick. Tiếp tục?`)) return;
    setAllChecked(true);
    setStep(2);
  };

  // Build BOQLineItems for summary calc
  const lineItems: BOQLineItem[] = checkedItems.map((it, i) => ({
    id: String(i),
    category: '', subcategory: '', itemKey: it.price_key || it.name,
    itemName: it.name, unit: it.unit, quantity: it.quantity,
    wasteFactor: it.waste_factor || 1,
    scope: it.scope || 'NC_VT',
    priceBasic: null, pricePremium: null, priceLuxury: null,
    selectedPrice: it.matched_price ?? it.unit_price ?? 0,
    note: it.note || '',
  }));

  const summary = useMemo(() => calculateSummary(lineItems, project.marginStrategy, project.isOutOfTown), [lineItems, project.marginStrategy, project.isOutOfTown]);

  const noPrice = checkedItems.filter(it => (it.matched_price ?? it.unit_price) === 0);

  // ─── RENDERERS ───

  const renderStep0 = () => (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <div className="font-bold flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4" /> Hướng dẫn</div>
        <p>1. Mở <strong>Claude Desktop</strong> → gửi bản vẽ → nói "bóc khối lượng"</p>
        <p>2. Claude sẽ xuất JSON ở bước cuối → copy toàn bộ JSON đó</p>
        <p>3. Dán vào ô bên dưới → bấm "Phân tích"</p>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Dán JSON từ Claude</label>
        <textarea value={rawJson} onChange={e => { setRawJson(e.target.value); setParseError(''); }}
          rows={14} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none bg-white resize-y"
          placeholder={SAMPLE_JSON} />
      </div>
      {parseError && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-semibold">{parseError}</div>}
      <div className="flex gap-3">
        <button onClick={handleParse} disabled={!rawJson.trim()}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${rawJson.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
          <ClipboardPaste className="w-4 h-4" /> Phân tích JSON
        </button>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
        <div className="text-sm"><strong>{project.name}</strong> — {project.clientName} — {project.area} m² — {project.tier.toUpperCase()}</div>
        <div className="text-xs font-bold text-indigo-600">{checkedItems.length} / {bills.flatMap(b=>b.items).length} đã tick</div>
      </div>
      <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
        {bills.map((bill, bi) => (
          <div key={bill.bill} className="border border-slate-200 rounded-xl overflow-hidden">
            <button onClick={() => setExpandedBills(p => ({ ...p, [bill.bill]: !p[bill.bill] }))}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 text-white text-left">
              <span className="text-sm font-bold">{bill.bill}: {bill.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs opacity-70">{bill.items.filter(i=>i.checked).length}/{bill.items.length}</span>
                {expandedBills[bill.bill] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>
            {expandedBills[bill.bill] && (
              <div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200">
                  <button onClick={() => toggleAllInBill(bi, true)} className="text-xs font-bold text-emerald-600 hover:underline">Tick tất cả</button>
                  <span className="text-slate-300">|</span>
                  <button onClick={() => toggleAllInBill(bi, false)} className="text-xs font-bold text-slate-500 hover:underline">Bỏ tick</button>
                </div>
                <div className="divide-y divide-slate-100">
                  {bill.items.map((it, ii) => (
                    <div key={ii} className={`flex items-start gap-3 px-4 py-3 ${it.checked ? 'bg-emerald-50/50' : 'bg-white'} transition-colors`}>
                      <button onClick={() => toggleItem(bi, ii)} className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${it.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-indigo-400'}`}>
                        {it.checked && <Check className="w-3 h-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800">{it.stt}. {it.name}</div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                          <span><strong>KL:</strong> <input type="number" value={it.quantity} onChange={e => updateItemField(bi, ii, 'quantity', Number(e.target.value))} className="w-16 px-1 py-0.5 border border-slate-200 rounded text-center inline-block" /> {it.unit}</span>
                          <span><strong>Hao hụt:</strong> ×{it.waste_factor}</span>
                          <span><strong>Scope:</strong> {it.scope}</span>
                        </div>
                        {it.note && <div className="text-xs text-slate-400 mt-1 italic">{it.note}</div>}
                        {it.warning && <div className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {it.warning}</div>}
                      </div>
                      <button onClick={() => removeItem(bi, ii)} className="p-1 text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={confirmChecklist}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm">
        <CheckSquare className="w-4 h-4" /> Xác nhận Checklist ({checkedItems.length} hạng mục)
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      {noPrice.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-sm font-bold text-amber-800 mb-2">⚠️ {noPrice.length} hạng mục CHƯA CÓ GIÁ:</div>
          {noPrice.map((it, i) => <div key={i} className="text-xs text-amber-700">• {it.name} ({it.unit})</div>)}
          <p className="text-xs text-amber-600 mt-2 italic">Cần liên hệ NCC hoặc nhập thủ công giá.</p>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs">STT</th>
              <th className="px-3 py-2.5 text-left text-xs">Hạng mục</th>
              <th className="px-3 py-2.5 text-center text-xs">ĐVT</th>
              <th className="px-3 py-2.5 text-right text-xs">KL thực</th>
              <th className="px-3 py-2.5 text-right text-xs">Đơn giá</th>
              <th className="px-3 py-2.5 text-right text-xs">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {checkedItems.map((it, i) => {
              const qty = it.quantity * (it.waste_factor || 1);
              const price = it.matched_price ?? it.unit_price ?? 0;
              return (
                <tr key={i} className={`hover:bg-slate-50 ${price === 0 ? 'bg-amber-50' : ''}`}>
                  <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{it.name}</td>
                  <td className="px-3 py-2 text-center text-slate-600">{it.unit}</td>
                  <td className="px-3 py-2 text-right">{(Math.round(qty * 100) / 100).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{price > 0 ? formatVND(price) : <span className="text-red-500 font-bold">—</span>}</td>
                  <td className="px-3 py-2 text-right font-bold">{price > 0 ? formatVND(qty * price) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5 space-y-2">
        <div className="flex justify-between text-sm"><span>Tổng cộng:</span><span className="font-bold">{formatVND(summary.subtotal)}</span></div>
        <div className="flex justify-between text-sm"><span>Margin ({(summary.marginPercent * 100).toFixed(0)}%):</span><span className="font-bold text-indigo-600">+{formatVND(summary.marginAmount)}</span></div>
        {summary.ngoaiTinhAmount > 0 && <div className="flex justify-between text-sm"><span>Ngoại tỉnh (4%):</span><span className="font-bold text-orange-600">+{formatVND(summary.ngoaiTinhAmount)}</span></div>}
        <div className="flex justify-between text-sm border-t border-indigo-200 pt-2"><span>Trước VAT:</span><span className="font-bold">{formatVND(summary.totalBeforeVAT)}</span></div>
        <div className="flex justify-between text-sm"><span>VAT (8%):</span><span className="font-bold">+{formatVND(summary.vat)}</span></div>
        <div className="flex justify-between text-lg font-bold border-t border-indigo-200 pt-3"><span>TỔNG SAU VAT:</span><span className="text-indigo-700">{formatVND(summary.totalAfterVAT)}</span></div>
      </div>
      <button onClick={() => setStep(3)} className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm">
        Xác nhận giá → Xuất Excel
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 text-center">
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-8">
        <FileSpreadsheet className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800 mb-2">Báo giá sẵn sàng!</h3>
        <p className="text-sm text-slate-600 mb-1"><strong>{project.name}</strong> — {project.clientName}</p>
        <p className="text-sm text-slate-600">{checkedItems.length} hạng mục • {project.tier.toUpperCase()} • {formatVND(summary.totalAfterVAT)}</p>
        <button onClick={() => exportToExcel(project, lineItems, summary)}
          className="mt-6 inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-bold hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-200 active:scale-95 transition-all">
          <Download className="w-5 h-5" /> Tải Excel (.xlsx)
        </button>
      </div>
      <p className="text-xs text-slate-500 italic">Khối lượng cuối cùng được xác định theo nghiệm thu thực tế tại công trình.</p>
    </div>
  );

  const renderers = [renderStep0, renderStep1, renderStep2, renderStep3];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          Báo Giá Nội Thất
        </h1>
        <p className="text-sm text-slate-500 mt-1 ml-[52px]">Dán JSON từ Claude → Checklist → Áp giá → Xuất Excel</p>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1.5 overflow-x-auto">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <button key={i} onClick={() => { if (done) setStep(i); }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex-1 justify-center ${active ? 'bg-white shadow-sm text-indigo-700' : done ? 'text-emerald-600 hover:bg-white/50 cursor-pointer' : 'text-slate-400 cursor-default'}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{s.name}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 min-h-[300px]">
        {renderers[step]()}
      </div>
    </div>
  );
}
