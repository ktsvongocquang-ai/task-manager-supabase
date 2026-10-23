import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { landingSupabase } from '../sections/landingSupabase';

const FIELDS: { key: string; label: string }[] = [
  { key: 'founded_date', label: 'Ngày thành lập' },
  { key: 'scale_value', label: 'Quy mô (giá trị hiện)' },
  { key: 'scale_note', label: 'Quy mô (ghi chú nhỏ)' },
  { key: 'address_value', label: 'Địa chỉ (giá trị hiện)' },
  { key: 'address_note', label: 'Địa chỉ (ghi chú nhỏ)' },
  { key: 'project_types', label: 'Thể loại công trình' },
  { key: 'legal_name', label: 'Tên pháp nhân' },
  { key: 'tax_code', label: 'Mã số thuế' },
];

export function AdminCompany() {
  const { canWrite } = useOutletContext<{ canWrite: boolean }>();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    landingSupabase.from('landing_company_info').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      setForm(data || {});
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    await landingSupabase.from('landing_company_info').upsert({ id: 1, ...form });
    setSaving(false);
    setSaved(true);
  };

  if (loading) return <p className="text-xs text-[#8A8070]">Đang tải...</p>;

  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-2xl mb-1">Thông tin công ty</h1>
      <p className="text-xs text-[#8A8070] mb-6">Chỉ 1 bộ thông tin duy nhất hiển thị ở phần "Thông tin công ty" của landing page.</p>
      <div className="space-y-4">
        {FIELDS.map(f => (
          <div key={f.key}>
            <label className="block text-[10px] uppercase tracking-wide text-[#8A8070] font-semibold mb-1">{f.label}</label>
            <input
              value={form[f.key] || ''}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              disabled={!canWrite}
              className="w-full border border-[#2C2920]/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B8913A]"
            />
          </div>
        ))}
      </div>
      {canWrite && (
        <button onClick={save} disabled={saving} className="mt-6 bg-[#1A1814] hover:bg-[#B8913A] text-white text-xs uppercase tracking-wide font-bold px-6 py-3 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      )}
      {saved && <span className="ml-3 text-xs text-emerald-600">Đã lưu.</span>}
    </div>
  );
}
