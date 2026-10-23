import { useEffect, useState } from 'react';
import { landingSupabase } from '../sections/landingSupabase';

export interface FieldConfig {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'select' | 'checkbox';
  options?: { value: string; label: string }[];
  width?: string; // tailwind width class cho ô input trong bảng
}

interface Props {
  table: string;
  idKey?: string;
  fields: FieldConfig[];
  orderBy?: string;
  defaultValues?: Record<string, any>;
  canWrite: boolean;
}

// Bảng CRUD inline dùng chung cho các bảng nội dung đơn giản (đội ngũ, chi
// phí, quy trình, đơn giá...) — mỗi dòng sửa trực tiếp tại chỗ, có hàng
// thêm mới ở cuối. Không áp dụng cho landing_featured_projects (có cột
// case_study jsonb phức tạp hơn, xem AdminProjects.tsx).
export function CrudTable({ table, idKey = 'id', fields, orderBy, defaultValues = {}, canWrite }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRow, setNewRow] = useState<Record<string, any>>(defaultValues);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    let query = landingSupabase.from(table).select('*');
    if (orderBy) query = query.order(orderBy);
    const { data, error: err } = await query;
    if (err) setError(err.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [table]);

  const updateField = (id: string, key: string, value: any) => {
    setRows(prev => prev.map(r => (r[idKey] === id ? { ...r, [key]: value } : r)));
  };

  const saveRow = async (row: any) => {
    setSavingId(row[idKey]);
    setError('');
    const { [idKey]: id, ...rest } = row;
    const { error: err } = await landingSupabase.from(table).update(rest).eq(idKey, id);
    if (err) setError(err.message);
    setSavingId(null);
  };

  const deleteRow = async (id: string) => {
    if (!confirm('Xoá dòng này?')) return;
    const { error: err } = await landingSupabase.from(table).delete().eq(idKey, id);
    if (err) { setError(err.message); return; }
    setRows(prev => prev.filter(r => r[idKey] !== id));
  };

  const addRow = async () => {
    setError('');
    const { data, error: err } = await landingSupabase.from(table).insert([newRow]).select().single();
    if (err) { setError(err.message); return; }
    setRows(prev => [...prev, data]);
    setNewRow(defaultValues);
  };

  const renderInput = (field: FieldConfig, value: any, onChange: (v: any) => void) => {
    if (field.type === 'textarea') {
      return <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={2} className="w-full border border-[#2C2920]/15 rounded px-2 py-1.5 text-xs" disabled={!canWrite} />;
    }
    if (field.type === 'number') {
      return <input type="number" value={value ?? ''} onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))} className="w-full border border-[#2C2920]/15 rounded px-2 py-1.5 text-xs" disabled={!canWrite} />;
    }
    if (field.type === 'checkbox') {
      return <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} disabled={!canWrite} />;
    }
    if (field.type === 'select') {
      return (
        <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-full border border-[#2C2920]/15 rounded px-2 py-1.5 text-xs" disabled={!canWrite}>
          <option value="">--</option>
          {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      );
    }
    return <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} className="w-full border border-[#2C2920]/15 rounded px-2 py-1.5 text-xs" disabled={!canWrite} />;
  };

  if (loading) return <p className="text-xs text-[#8A8070]">Đang tải...</p>;

  return (
    <div className="space-y-4">
      {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded p-2">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#2C2920]/10">
              {fields.map(f => <th key={f.key} className={`text-left p-2 font-bold text-[#8A8070] uppercase tracking-wide ${f.width || ''}`}>{f.label}</th>)}
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row[idKey]} className="border-b border-[#2C2920]/5">
                {fields.map(f => (
                  <td key={f.key} className="p-2 align-top">{renderInput(f, row[f.key], v => updateField(row[idKey], f.key, v))}</td>
                ))}
                <td className="p-2 align-top whitespace-nowrap">
                  {canWrite && (
                    <div className="flex gap-1">
                      <button onClick={() => saveRow(row)} disabled={savingId === row[idKey]} className="px-2 py-1 bg-[#1A1814] text-white rounded text-[10px] font-bold cursor-pointer disabled:opacity-50">Lưu</button>
                      <button onClick={() => deleteRow(row[idKey])} className="px-2 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded text-[10px] font-bold cursor-pointer">Xoá</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {canWrite && (
              <tr>
                {fields.map(f => (
                  <td key={f.key} className="p-2 align-top">{renderInput(f, newRow[f.key], v => setNewRow(prev => ({ ...prev, [f.key]: v })))}</td>
                ))}
                <td className="p-2 align-top">
                  <button onClick={addRow} className="px-2 py-1 bg-[#B8913A] text-white rounded text-[10px] font-bold cursor-pointer">+ Thêm</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="text-xs text-[#8A8070]">Chưa có dữ liệu.</p>}
    </div>
  );
}
