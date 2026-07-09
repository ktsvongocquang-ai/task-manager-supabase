import { useState } from 'react';
import { ClipboardPaste, DollarSign, FileSpreadsheet, Layers, ListTree, RefreshCw, X } from 'lucide-react';
import { StatCard } from '../construction/ProjectDossierModal';
import { fmt } from '../construction/types';
import { readExcelFile } from '../../utils/excelIO';

type AiBoqImportItem = {
  code?: string | null;
  name?: string | null;
  unit?: string | null;
  quantity?: number | string | null;
  quote_unit_price?: number | string | null;
  quoted_unit_price?: number | string | null;
  quote_amount?: number | string | null;
  note?: string | null;
};

type AiBoqImportGroup = {
  code?: string | null;
  name?: string | null;
  items?: AiBoqImportItem[];
};

type AiBoqImportPayload = {
  project_name?: string | null;
  currency?: string | null;
  source_type?: string | null;
  boq_groups?: AiBoqImportGroup[];
  warnings?: string[];
};

export type NormalizedAiBoqPayload = ReturnType<typeof normalizeAiBoqPayload>;

const parseMoneyLike = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = String(value).replace(/[^\d.-]/g, '');
  if (!normalized) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
};

const normalizeHeader = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const pickCell = (row: Record<string, any>, aliases: string[]) => {
  const normalizedAliases = aliases.map(normalizeHeader);
  const foundKey = Object.keys(row).find(key => normalizedAliases.includes(normalizeHeader(key)));
  return foundKey ? row[foundKey] : '';
};

const inferRowType = (rawType: unknown, code: string, unit: string, quantity: number, unitPrice: number) => {
  const type = String(rawType || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (type.includes('group') || type.includes('nhom')) return 'group';
  if (type.includes('item') || type.includes('cong viec') || type.includes('hang muc')) return 'item';
  if (code && !code.includes('.') && !unit && quantity === 0 && unitPrice === 0) return 'group';
  return 'item';
};

const rowsToBoqPayload = (rows: Record<string, any>[], projectName: string) => {
  const groupsByCode = new Map<string, { code: string; name: string; items: any[] }>();
  const warnings: string[] = [];
  let currentGroupCode = '';
  let autoGroupIndex = 0;
  let autoItemIndex = 0;

  const ensureGroup = (code?: string, name?: string) => {
    const groupCode = code || String.fromCharCode(65 + autoGroupIndex++);
    if (!groupsByCode.has(groupCode)) {
      groupsByCode.set(groupCode, { code: groupCode, name: name || `Nhóm ${groupCode}`, items: [] });
    }
    currentGroupCode = groupCode;
    return groupsByCode.get(groupCode)!;
  };

  rows.forEach((row, rowIndex) => {
    const codeRaw = String(pickCell(row, ['Mã dòng', 'Ma dong', 'Mã', 'Ma', 'Code', 'Item code', 'item_code']) || '').trim();
    const typeRaw = pickCell(row, ['Loại dòng', 'Loai dong', 'Loại', 'Loai', 'Type', 'row_type']);
    const name = String(pickCell(row, ['Tên hạng mục', 'Ten hang muc', 'Tên công việc', 'Ten cong viec', 'Tên hàng mục', 'Nội dung', 'Noi dung', 'Diễn giải', 'Dien giai', 'Name', 'item_name']) || '').trim();
    const unit = String(pickCell(row, ['ĐVT', 'DVT', 'Đơn vị', 'Don vi', 'Unit']) || '').trim();
    const quantity = parseMoneyLike(pickCell(row, ['KL dự toán', 'KL du toan', 'Khối lượng', 'Khoi luong', 'Số lượng', 'So luong', 'Quantity', 'estimated_quantity'])) ?? 0;
    const unitPrice = parseMoneyLike(pickCell(row, ['Đơn giá báo giá', 'Don gia bao gia', 'Đơn giá', 'Don gia', 'Unit price', 'quoted_unit_price', 'quote_unit_price'])) ?? 0;
    const note = String(pickCell(row, ['Ghi chú', 'Ghi chu', 'Note', 'Notes']) || '').trim();
    const rowType = inferRowType(typeRaw, codeRaw, unit, quantity, unitPrice);

    if (!name && !codeRaw && !unit && quantity === 0 && unitPrice === 0) return;

    if (rowType === 'group') {
      const groupCode = codeRaw || String.fromCharCode(65 + autoGroupIndex++);
      ensureGroup(groupCode, name || `Nhóm ${groupCode}`);
      if (!name) warnings.push(`Dòng Excel ${rowIndex + 2}: nhóm ${groupCode} thiếu tên.`);
      return;
    }

    const parentCodeFromCode = codeRaw.includes('.') ? codeRaw.split('.').slice(0, -1).join('.') : '';
    const parent = parentCodeFromCode
      ? ensureGroup(parentCodeFromCode, `Nhóm ${parentCodeFromCode}`)
      : currentGroupCode
        ? ensureGroup(currentGroupCode)
        : ensureGroup('A', 'BOQ nhập từ Excel');

    autoItemIndex += 1;
    const itemCode = codeRaw || `${parent.code}.${autoItemIndex}`;
    if (!name) warnings.push(`Dòng Excel ${rowIndex + 2}: dòng ${itemCode} thiếu tên công việc.`);
    if (!unit) warnings.push(`Dòng Excel ${rowIndex + 2}: dòng ${itemCode} thiếu ĐVT.`);
    if (quantity === 0) warnings.push(`Dòng Excel ${rowIndex + 2}: dòng ${itemCode} thiếu hoặc bằng 0 ở KL dự toán.`);
    if (unitPrice === 0) warnings.push(`Dòng Excel ${rowIndex + 2}: dòng ${itemCode} thiếu hoặc bằng 0 ở đơn giá báo giá.`);

    parent.items.push({
      code: itemCode,
      name: name || `Dòng ${itemCode}`,
      unit: unit || null,
      quantity,
      quote_unit_price: unitPrice,
      quote_amount: quantity * unitPrice,
      note,
    });
  });

  return normalizeAiBoqPayload({
    project_name: projectName,
    currency: 'VND',
    source_type: 'excel',
    boq_groups: Array.from(groupsByCode.values()),
    warnings,
  });
};

const normalizeAiBoqPayload = (raw: AiBoqImportPayload) => {
  const warnings = [...(Array.isArray(raw.warnings) ? raw.warnings : [])];
  const groups = (raw.boq_groups || []).map((group, groupIndex) => {
    const groupCode = (group.code || String.fromCharCode(65 + groupIndex)).trim();
    if (!group.name?.trim()) warnings.push(`Nhóm ${groupCode} thiếu tên nhóm.`);
    return {
      code: groupCode,
      name: group.name?.trim() || `Nhóm ${groupCode}`,
      items: (group.items || []).map((item, itemIndex) => {
        const itemCode = (item.code || `${groupCode}.${itemIndex + 1}`).trim();
        const quantity = parseMoneyLike(item.quantity) ?? 0;
        const unitPrice = parseMoneyLike(item.quoted_unit_price ?? item.quote_unit_price) ?? 0;
        if (!item.name?.trim()) warnings.push(`Dòng ${itemCode} thiếu tên công việc.`);
        if (!item.unit?.trim()) warnings.push(`Dòng ${itemCode} thiếu ĐVT.`);
        if (!quantity) warnings.push(`Dòng ${itemCode} thiếu hoặc bằng 0 ở KL dự toán.`);
        if (!unitPrice) warnings.push(`Dòng ${itemCode} thiếu hoặc bằng 0 ở đơn giá báo giá.`);
        return {
          code: itemCode,
          name: item.name?.trim() || `Dòng ${itemCode}`,
          unit: item.unit?.trim() || null,
          quantity,
          quoted_unit_price: unitPrice,
          quote_amount: parseMoneyLike(item.quote_amount) ?? quantity * unitPrice,
          note: item.note?.trim() || '',
        };
      }),
    };
  });

  const seen = new Set<string>();
  [...groups, ...groups.flatMap(g => g.items)].forEach(row => {
    if (seen.has(row.code)) warnings.push(`Trùng mã dòng ${row.code}.`);
    seen.add(row.code);
  });

  return {
    project_name: raw.project_name || null,
    currency: raw.currency || 'VND',
    source_type: raw.source_type || 'unknown',
    boq_groups: groups,
    warnings: Array.from(new Set(warnings)),
  };
};

export function BoqJsonImportModal({
  projectName,
  onClose,
  onImport,
}: {
  projectName: string;
  onClose: () => void;
  onImport: (payload: NormalizedAiBoqPayload) => Promise<{ success: boolean; created: number; error?: string }>;
}) {
  const sampleJson = `{
  "project_name": "${projectName}",
  "currency": "VND",
  "source_type": "excel_image",
  "boq_groups": [
    {
      "code": "A",
      "name": "Phần thô",
      "items": [
        {
          "code": "A.1",
          "name": "Tháo dỡ đồ cũ",
          "unit": "m2",
          "quantity": 100,
          "quote_unit_price": 50000,
          "note": ""
        }
      ]
    }
  ],
  "warnings": []
}`;
  const [jsonText, setJsonText] = useState(sampleJson);
  const [draft, setDraft] = useState<NormalizedAiBoqPayload | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [readingExcel, setReadingExcel] = useState(false);

  const flatItems = draft?.boq_groups.flatMap(g => g.items.map(item => ({ ...item, groupName: g.name }))) || [];
  const total = flatItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.quoted_unit_price || 0), 0);

  const handleCheck = () => {
    setError('');
    try {
      const parsed = JSON.parse(jsonText) as AiBoqImportPayload;
      const normalized = normalizeAiBoqPayload(parsed);
      if (!normalized.boq_groups.length) {
        setDraft(null);
        setError('JSON chưa có nhóm BOQ nào. Cần trường boq_groups.');
        return;
      }
      setDraft(normalized);
    } catch (e: any) {
      setDraft(null);
      setError(e?.message || 'JSON không hợp lệ.');
    }
  };

  const handleSave = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setError('');
    const res = await onImport(draft);
    setSaving(false);
    if (!res.success) setError(res.error || 'Không nhập được BOQ.');
  };

  const handleExcelFile = async (file?: File | null) => {
    if (!file) return;
    setReadingExcel(true);
    setError('');
    try {
      const rows = await readExcelFile(file);
      const normalized = rowsToBoqPayload(rows, projectName);
      if (!normalized.boq_groups.length) {
        setDraft(null);
        setError('File Excel chưa có dòng BOQ hợp lệ.');
        return;
      }
      setDraft(normalized);
      setJsonText(JSON.stringify(normalized, null, 2));
    } catch (e: any) {
      setDraft(null);
      setError(e?.message || 'Không đọc được file Excel.');
    } finally {
      setReadingExcel(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-800">Nhập BOQ chuẩn app</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Chọn Excel hoặc paste JSON từ AI, kiểm tra nháp rồi mới tạo bảng BOQ.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-0 flex-1 min-h-0 overflow-hidden">
          <div className="p-4 border-r border-slate-100 min-h-0 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <label className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 cursor-pointer">
                {readingExcel ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                Chọn Excel
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={e => handleExcelFile(e.target.files?.[0])}
                />
              </label>
              <span className="text-[11px] text-slate-400">Excel và JSON dùng chung một chuẩn lưu.</span>
            </div>
            <textarea
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              spellCheck={false}
              className="flex-1 min-h-[320px] font-mono text-xs leading-relaxed border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-400 resize-none"
            />
            <div className="flex items-center justify-between gap-2 mt-3">
              <p className="text-[11px] text-slate-400">Số tiền dùng dạng number, không có dấu chấm/phẩy trong JSON là tốt nhất.</p>
              <button onClick={handleCheck} className="px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900">Kiểm tra</button>
            </div>
          </div>

          <div className="p-4 overflow-y-auto">
            {draft ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <StatCard icon={<Layers className="w-4 h-4 text-indigo-500" />} label="Nhóm" value={String(draft.boq_groups.length)} />
                  <StatCard icon={<ListTree className="w-4 h-4 text-emerald-500" />} label="Dòng việc" value={String(flatItems.length)} />
                  <StatCard icon={<DollarSign className="w-4 h-4 text-amber-500" />} label="Tổng BOQ" value={fmt(total)} />
                </div>
                {draft.warnings.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-bold text-amber-700 mb-1">Cần kiểm tra</p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {draft.warnings.map((w, i) => <p key={i} className="text-[11px] text-amber-700">- {w}</p>)}
                    </div>
                  </div>
                )}
                <div className="border border-slate-200 rounded-xl overflow-auto max-h-[420px]">
                  <table className="min-w-[760px] w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="text-left px-3 py-2">Mã</th>
                        <th className="text-left px-3 py-2">Nhóm</th>
                        <th className="text-left px-3 py-2">Hạng mục</th>
                        <th className="text-left px-3 py-2">ÄVT</th>
                        <th className="text-right px-3 py-2">KL</th>
                        <th className="text-right px-3 py-2">Đơn giá</th>
                        <th className="text-right px-3 py-2">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {flatItems.map(item => (
                        <tr key={item.code}>
                          <td className="px-3 py-2 font-mono text-slate-400">{item.code}</td>
                          <td className="px-3 py-2 text-slate-500">{item.groupName}</td>
                          <td className="px-3 py-2 font-medium text-slate-700">{item.name}</td>
                          <td className="px-3 py-2 text-slate-500">{item.unit || '--'}</td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">{fmt(item.quoted_unit_price || 0)}</td>
                          <td className="px-3 py-2 text-right font-bold">{fmt((item.quantity || 0) * (item.quoted_unit_price || 0))}</td>
                        </tr>
                      ))}
                      {flatItems.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400 py-8">Chưa có dòng công việc.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[360px] flex items-center justify-center text-center text-slate-400">
                <div>
                  <ClipboardPaste className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-bold text-slate-500">Dán JSON rồi bấm Kiểm tra</p>
                  <p className="text-xs mt-1">App sẽ hiện bảng nháp để bạn rà trước khi lưu.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <p className="px-5 py-2 text-xs text-rose-600 font-medium border-t border-slate-100">{error}</p>}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Hủy</button>
          <button onClick={handleSave} disabled={!draft || saving} className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-2">
            {saving && <RefreshCw className="w-4 h-4 animate-spin" />} Tạo bảng BOQ
          </button>
        </div>
      </div>
    </div>
  );
}
