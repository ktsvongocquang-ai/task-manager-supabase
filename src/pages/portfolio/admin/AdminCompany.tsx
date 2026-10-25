import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { landingSupabase } from '../sections/landingSupabase';
import { ImageUploadField } from './ImageUploadField';

const TEXT_FIELDS: { key: string; label: string }[] = [
  { key: 'founded_date', label: 'Ngày thành lập' },
  { key: 'scale_value', label: 'Quy mô (giá trị hiện)' },
  { key: 'scale_note', label: 'Quy mô (ghi chú nhỏ)' },
  { key: 'address_value', label: 'Địa chỉ (giá trị hiện)' },
  { key: 'address_note', label: 'Địa chỉ (ghi chú nhỏ)' },
  { key: 'project_types', label: 'Thể loại công trình' },
  { key: 'legal_name', label: 'Tên pháp nhân' },
  { key: 'tax_code', label: 'Mã số thuế' },
];

const STORY_BLOCKS: { textKey: string; imageKey: string; label: string }[] = [
  { textKey: 'history_text', imageKey: 'history_image', label: 'Lịch sử hình thành' },
  { textKey: 'vision_text', imageKey: 'vision_image', label: 'Tầm nhìn' },
  { textKey: 'philosophy_text', imageKey: 'philosophy_image', label: 'Triết lý làm nghề' },
];

const input = 'w-full border border-[#2C2920]/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B8913A]';
const label = 'block text-[10px] uppercase tracking-wide text-[#8A8070] font-semibold mb-1';

export function AdminCompany() {
  const { canWrite } = useOutletContext<{ canWrite: boolean }>();
  const [form, setForm] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    landingSupabase.from('landing_company_info').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      setForm(data || {});
      setLoading(false);
    });
  }, []);

  const set = (key: string, val: string | null) => setForm(prev => ({ ...prev, [key]: val }));

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

      <h2 className="font-serif text-lg mb-3">Ảnh bìa trang chủ (Hero)</h2>
      <div className="bg-white border border-[#2C2920]/10 rounded-lg p-4 mb-8">
        <ImageUploadField label="Ảnh nền đầu trang (hiện ngay khi mở link)" value={form.hero_image} onChange={url => set('hero_image', url)} />
      </div>

      <h2 className="font-serif text-lg mb-3">Kể chuyện thương hiệu</h2>
      <div className="space-y-6 mb-8">
        {STORY_BLOCKS.map(b => (
          <div key={b.textKey} className="bg-white border border-[#2C2920]/10 rounded-lg p-4 space-y-3">
            <p className="text-xs font-bold text-[#2C2920]">{b.label}</p>
            <ImageUploadField label="Ảnh nền (full-màn-hình)" value={form[b.imageKey]} onChange={url => set(b.imageKey, url)} />
            <div>
              <label className={label}>Nội dung</label>
              <textarea
                className={input}
                rows={3}
                value={form[b.textKey] || ''}
                onChange={e => set(b.textKey, e.target.value)}
                disabled={!canWrite}
              />
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-serif text-lg mb-3">Thông tin pháp lý & liên hệ</h2>
      <div className="space-y-4">
        {TEXT_FIELDS.map(f => (
          <div key={f.key}>
            <label className={label}>{f.label}</label>
            <input
              value={form[f.key] || ''}
              onChange={e => set(f.key, e.target.value)}
              disabled={!canWrite}
              className={input}
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
