import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { ImageUploadField } from './ImageUploadField';

interface ArchitectStat {
  value: string;
  label: string;
}
interface SocialLink {
  platform: string;
  url: string;
}

const SOCIAL_PLATFORMS = ['facebook', 'instagram', 'behance', 'tiktok', 'zalo'];

interface Form {
  default_phone: string;
  default_zalo: string;
  architect_name: string;
  architect_role: string;
  architect_photo: string | null;
  architect_signature: string | null;
  architect_quote: string;
  architect_zalo: string;
  architect_stats: ArchitectStat[];
  offer_slots_left: number | '';
  offer_month: string;
  response_promise: string;
  legal_name: string;
  tax_code: string;
  address: string;
  maps_url: string;
  hotline: string;
  founded_at: string;
  social_links: SocialLink[];
}

const EMPTY: Form = {
  default_phone: '',
  default_zalo: '',
  architect_name: '',
  architect_role: '',
  architect_photo: null,
  architect_signature: null,
  architect_quote: '',
  architect_zalo: '',
  architect_stats: [
    { value: '', label: '' },
    { value: '', label: '' },
    { value: '', label: '' },
  ],
  offer_slots_left: '',
  offer_month: '',
  response_promise: '',
  legal_name: '',
  tax_code: '',
  address: '',
  maps_url: '',
  hotline: '',
  founded_at: '',
  social_links: SOCIAL_PLATFORMS.map(p => ({ platform: p, url: '' })),
};

const input = 'w-full border border-gray-300 rounded px-3 py-2.5 text-sm';
const label = 'block text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1';

export function AdminContent() {
  const { pageId } = useOutletContext<{ pageId: string }>();
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase
      .from('landing_pages')
      .select('*')
      .eq('id', pageId)
      .single()
      .then(({ data }) => {
        if (data) {
          const stats: ArchitectStat[] = data.architect_stats?.length ? data.architect_stats : EMPTY.architect_stats;
          const socials: SocialLink[] = SOCIAL_PLATFORMS.map(p => {
            const found = (data.social_links || []).find((s: SocialLink) => s.platform === p);
            return { platform: p, url: found?.url || '' };
          });
          setForm({
            default_phone: data.default_phone || '',
            default_zalo: data.default_zalo || '',
            architect_name: data.architect_name || '',
            architect_role: data.architect_role || '',
            architect_photo: data.architect_photo,
            architect_signature: data.architect_signature,
            architect_quote: data.architect_quote || '',
            architect_zalo: data.architect_zalo || '',
            architect_stats: stats,
            offer_slots_left: data.offer_slots_left ?? '',
            offer_month: data.offer_month || '',
            response_promise: data.response_promise || '',
            legal_name: data.legal_name || '',
            tax_code: data.tax_code || '',
            address: data.address || '',
            maps_url: data.maps_url || '',
            hotline: data.hotline || '',
            founded_at: data.founded_at || '',
            social_links: socials,
          });
        }
        setLoading(false);
      });
  }, [pageId]);

  const set = <K extends keyof Form>(key: K, val: Form[K]) => setForm(prev => ({ ...prev, [key]: val }));
  const setStat = (i: number, patch: Partial<ArchitectStat>) =>
    setForm(prev => ({ ...prev, architect_stats: prev.architect_stats.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }));
  const setSocial = (platform: string, url: string) =>
    setForm(prev => ({ ...prev, social_links: prev.social_links.map(s => (s.platform === platform ? { ...s, url } : s)) }));

  const save = async () => {
    setSaving(true);
    setSaved(false);
    await supabase
      .from('landing_pages')
      .update({
        ...form,
        offer_slots_left: form.offer_slots_left === '' ? null : Number(form.offer_slots_left),
        founded_at: form.founded_at || null,
        architect_stats: form.architect_stats.filter(s => s.value || s.label),
        social_links: form.social_links.filter(s => s.url),
      })
      .eq('id', pageId);
    setSaving(false);
    setSaved(true);
  };

  if (loading) return <p className="text-xs text-gray-400">Đang tải...</p>;

  return (
    <div className="max-w-3xl space-y-8">
      <section>
        <h2 className="font-serif text-lg mb-3">Liên hệ mặc định</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Số điện thoại mặc định</label>
            <input className={input} value={form.default_phone} onChange={e => set('default_phone', e.target.value)} />
          </div>
          <div>
            <label className={label}>Zalo mặc định</label>
            <input className={input} value={form.default_zalo} onChange={e => set('default_zalo', e.target.value)} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-lg mb-3">Kiến trúc sư</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Tên</label>
            <input className={input} value={form.architect_name} onChange={e => set('architect_name', e.target.value)} />
          </div>
          <div>
            <label className={label}>Vai trò</label>
            <input className={input} value={form.architect_role} onChange={e => set('architect_role', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Câu triết lý (tối đa 3 câu)</label>
            <textarea className={input} rows={2} value={form.architect_quote} onChange={e => set('architect_quote', e.target.value)} />
          </div>
          <div>
            <label className={label}>Zalo riêng của KTS</label>
            <input className={input} value={form.architect_zalo} onChange={e => set('architect_zalo', e.target.value)} />
          </div>
          <ImageUploadField label="Ảnh chân dung (4:5)" value={form.architect_photo} onChange={v => set('architect_photo', v)} />
          <ImageUploadField label="Chữ ký (PNG nền trong)" value={form.architect_signature} onChange={v => set('architect_signature', v)} />
        </div>
        <p className={`${label} mt-4`}>3 con số (để trống dòng nào sẽ tự ẩn)</p>
        <div className="grid grid-cols-3 gap-3">
          {form.architect_stats.map((s, i) => (
            <div key={i} className="space-y-1">
              <input className={input} placeholder="Giá trị, vd: 120+" value={s.value} onChange={e => setStat(i, { value: e.target.value })} />
              <input className={input} placeholder="Nhãn" value={s.label} onChange={e => setStat(i, { label: e.target.value })} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-lg mb-3">Lời mời (Offer)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={label}>Số suất còn lại</label>
            <input
              type="number"
              className={input}
              value={form.offer_slots_left}
              onChange={e => set('offer_slots_left', e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          <div>
            <label className={label}>Tháng (vd: 11/2026)</label>
            <input className={input} value={form.offer_month} onChange={e => set('offer_month', e.target.value)} />
          </div>
          <div>
            <label className={label}>Cam kết phản hồi</label>
            <input className={input} value={form.response_promise} onChange={e => set('response_promise', e.target.value)} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-lg mb-3">Thông tin công ty</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Tên pháp nhân</label>
            <input className={input} value={form.legal_name} onChange={e => set('legal_name', e.target.value)} />
          </div>
          <div>
            <label className={label}>Mã số thuế</label>
            <input className={input} value={form.tax_code} onChange={e => set('tax_code', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Địa chỉ</label>
            <input className={input} value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div>
            <label className={label}>Link Google Maps</label>
            <input className={input} value={form.maps_url} onChange={e => set('maps_url', e.target.value)} />
          </div>
          <div>
            <label className={label}>Hotline</label>
            <input className={input} value={form.hotline} onChange={e => set('hotline', e.target.value)} />
          </div>
          <div>
            <label className={label}>Ngày thành lập</label>
            <input type="date" className={input} value={form.founded_at} onChange={e => set('founded_at', e.target.value)} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-lg mb-3">Mạng xã hội (để trống nếu chưa có)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {form.social_links.map(s => (
            <div key={s.platform}>
              <label className={label}>{s.platform}</label>
              <input className={input} value={s.url} onChange={e => setSocial(s.platform, e.target.value)} placeholder="https://..." />
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="bg-gray-900 hover:bg-indigo-600 text-white text-xs uppercase tracking-wide font-bold px-6 py-3 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
      >
        {saving ? 'Đang lưu...' : 'Lưu'}
      </button>
      {saved && <span className="ml-3 text-xs text-emerald-600">Đã lưu.</span>}
    </div>
  );
}
